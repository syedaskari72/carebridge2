import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { documentId, action, notes } = await request.json();

    if (!documentId || !action) {
      return NextResponse.json(
        { error: "Document ID and action are required" },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    const document = await prisma.nurseDocument.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Update document verification status
    await prisma.nurseDocument.update({
      where: { id: documentId },
      data: {
        isVerified: action === 'approve',
        verifiedAt: action === 'approve' ? new Date() : null,
        verifiedBy: action === 'approve' ? session.user.id : null,
        notes: notes || null
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Verify document error:", error);
    return NextResponse.json(
      { error: "Failed to verify document" },
      { status: 500 }
    );
  }
}
