import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadNurseDocument, validateDocumentFile, fileToBuffer } from "@/lib/cloudinary";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.userType !== "NURSE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const nurse = await prisma.nurse.findUnique({
      where: { userId: session.user.id },
      include: {
        documents: {
          orderBy: { createdAt: "desc" }
        }
      }
    });

    if (!nurse) {
      return NextResponse.json({ error: "Nurse profile not found" }, { status: 404 });
    }

    return NextResponse.json(nurse.documents);
  } catch (error) {
    console.error("Error fetching nurse documents:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.userType !== "NURSE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const nurse = await prisma.nurse.findUnique({
      where: { userId: session.user.id }
    });

    if (!nurse) {
      return NextResponse.json({ error: "Nurse profile not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const documentType = formData.get("documentType") as string;

    if (!file || !documentType) {
      return NextResponse.json({ error: "File and document type are required" }, { status: 400 });
    }

    // Validate file
    const validation = validateDocumentFile(file);
    if (!validation.isValid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = await fileToBuffer(file);

    // Upload to Cloudinary
    const uploadResult = await uploadNurseDocument(
      buffer,
      nurse.id,
      documentType,
      file.name
    );

    // Map document type to enum
    const typeMapping: { [key: string]: string } = {
      "license": "LICENSE",
      "degree": "DEGREE",
      "cpr": "CERTIFICATE",
      "id": "ID_CARD",
      "experience": "EXPERIENCE_LETTER",
      "background": "OTHER",
      "other": "OTHER"
    };

    // Save document record to database
    const document = await prisma.nurseDocument.create({
      data: {
        nurseId: nurse.id,
        type: typeMapping[documentType] as any,
        fileName: file.name,
        fileUrl: uploadResult.secure_url,
        cloudinaryId: uploadResult.public_id,
        fileSize: uploadResult.bytes,
        isVerified: false,
      }
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    console.error("Error uploading nurse document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.userType !== "NURSE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("id");

    if (!documentId) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    const nurse = await prisma.nurse.findUnique({
      where: { userId: session.user.id }
    });

    if (!nurse) {
      return NextResponse.json({ error: "Nurse profile not found" }, { status: 404 });
    }

    // Find the document and verify ownership
    const document = await prisma.nurseDocument.findFirst({
      where: {
        id: documentId,
        nurseId: nurse.id
      }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Delete from Cloudinary
    if (document.cloudinaryId) {
      try {
        const { deleteFromCloudinary } = await import("@/lib/cloudinary");
        await deleteFromCloudinary(document.cloudinaryId);
      } catch (error) {
        console.error("Error deleting from Cloudinary:", error);
        // Continue with database deletion even if Cloudinary deletion fails
      }
    }

    // Delete from database
    await prisma.nurseDocument.delete({
      where: { id: documentId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting nurse document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
