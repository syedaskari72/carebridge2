import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { UserType, Department, DocumentType } from "@prisma/client";
import { validatePakistaniCNIC, validatePakistaniPhone } from "@/lib/validation";
import { uploadNurseDocument, validateDocumentFile, fileToBuffer } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    // Check if request is FormData (for file uploads) or JSON
    const contentType = request.headers.get('content-type');
    let body: any;
    let uploadedFiles: File[] = [];

    if (contentType?.includes('multipart/form-data')) {
      // Handle FormData for file uploads
      const formData = await request.formData();
      body = {};

      // Extract form fields and files
      for (const [key, value] of formData.entries()) {
        if (key.startsWith('document_')) {
          uploadedFiles.push(value as File);
        } else {
          body[key] = value;
        }
      }
    } else {
      // Handle JSON data
      try {
        body = await request.json();
      } catch (error) {
        return NextResponse.json(
          { error: "Invalid request format" },
          { status: 400 }
        );
      }
    }

    const {
      name,
      email,
      password,
      phone,
      cnic,
      address,
      userType,
      department,
      specialization,
      licenseNumber,
      experience,
      hourlyRate,
      consultationFee,
      bio,
    } = body;

    // Validate required fields
    if (!name || !email || !password || !userType) {
      return NextResponse.json(
        { error: "Missing required fields: name, email, password, and user type are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Validate CNIC if provided
    if (cnic) {
      const cnicValidation = validatePakistaniCNIC(cnic);
      if (!cnicValidation.isValid) {
        return NextResponse.json(
          { error: `CNIC validation failed: ${cnicValidation.error}` },
          { status: 400 }
        );
      }
    }

    // Validate phone number if provided
    if (phone) {
      const phoneValidation = validatePakistaniPhone(phone);
      if (!phoneValidation.isValid) {
        return NextResponse.json(
          { error: `Phone validation failed: ${phoneValidation.error}` },
          { status: 400 }
        );
      }
    }

    // Validate professional fields for nurses and doctors
    if ((userType === "NURSE" || userType === "DOCTOR") && !licenseNumber) {
      return NextResponse.json(
        { error: "License number is required for healthcare professionals" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Check if CNIC already exists
    if (cnic) {
      const existingCNIC = await prisma.user.findFirst({
        where: { cnic },
      });

      if (existingCNIC) {
        return NextResponse.json(
          { error: "User with this CNIC already exists" },
          { status: 400 }
        );
      }
    }

    // Check if phone already exists
    if (phone) {
      const existingPhone = await prisma.user.findFirst({
        where: { phone },
      });

      if (existingPhone) {
        return NextResponse.json(
          { error: "User with this phone number already exists" },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        cnic,
        userType: userType as UserType,
      },
    });

    // Create role-specific profile
    switch (userType) {
      case "PATIENT":
        await prisma.patient.create({
          data: {
            userId: user.id,
          },
        });
        break;

      case "NURSE":
        if (!department || !licenseNumber) {
          return NextResponse.json(
            { error: "Department and license number required for nurses" },
            { status: 400 }
          );
        }

        const nurse = await prisma.nurse.create({
          data: {
            userId: user.id,
            nurseId: `NURSE-${Date.now()}`,
            department: department as Department,
            licenseNumber,
            experience: experience || "0 years",
            hourlyRate: 50, // Default rate
            location: "Not specified",
            specialties: [department],
            isVerified: false, // Requires admin verification
          },
        });

        // Handle document uploads for nurses
        if (uploadedFiles.length > 0) {
          for (let i = 0; i < uploadedFiles.length; i++) {
            const file = uploadedFiles[i];

            // Validate file
            const validation = validateDocumentFile(file);
            if (!validation.isValid) {
              console.warn(`Invalid document file: ${validation.error}`);
              continue;
            }

            try {
              // Convert file to buffer and upload to Cloudinary
              const buffer = await fileToBuffer(file);
              const uploadResult = await uploadNurseDocument(
                buffer,
                nurse.id,
                'CERTIFICATE', // Default type, can be made dynamic
                file.name
              );

              // Save document record to database
              await prisma.nurseDocument.create({
                data: {
                  nurseId: nurse.id,
                  type: DocumentType.CERTIFICATE,
                  fileName: file.name,
                  fileUrl: uploadResult.secure_url,
                  cloudinaryId: uploadResult.public_id,
                  fileSize: uploadResult.bytes,
                  mimeType: file.type,
                },
              });
            } catch (error) {
              console.error(`Failed to upload document ${file.name}:`, error);
              // Continue with other files even if one fails
            }
          }
        }
        break;

      case "DOCTOR":
        if (!department || !licenseNumber || !specialization) {
          return NextResponse.json(
            { error: "Department, specialization, and license number required for doctors" },
            { status: 400 }
          );
        }
        await prisma.doctor.create({
          data: {
            userId: user.id,
            doctorId: `DOC-${Date.now()}`,
            department: department as Department,
            specialization,
            licenseNumber,
            experience: experience || "0 years",
            consultationFee: 100, // Default fee
            isVerified: false, // Requires admin verification
          },
        });
        break;

      default:
        return NextResponse.json(
          { error: "Invalid user type" },
          { status: 400 }
        );
    }

    // Return success (don't include password)
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(
      {
        message: "User created successfully",
        user: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
