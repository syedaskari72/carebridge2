import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== "PATIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient record not found" }, { status: 404 });
    }

    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: patient.id },
      include: { doctor: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(prescriptions);
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== "PATIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient record not found" }, { status: 404 });
    }

    const body = await request.json();
    const { doctorName, diagnosis, medications, notes } = body;

    // Validate required fields
    if (!doctorName || !diagnosis || !medications || !Array.isArray(medications) || medications.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate medications array
    for (const med of medications) {
      if (!med.name || !med.dosage || !med.frequency) {
        return NextResponse.json({ error: "Each medication must have name, dosage, and frequency" }, { status: 400 });
      }
    }

    // For now, we'll create a generic doctor entry or find existing one
    // In a real system, you'd have proper doctor verification
    let doctor = await prisma.doctor.findFirst({
      where: {
        user: {
          name: doctorName
        }
      },
      include: { user: true }
    });

    // If doctor doesn't exist, create a placeholder (in real system, this would be handled differently)
    if (!doctor) {
      const doctorUser = await prisma.user.create({
        data: {
          email: `${doctorName.toLowerCase().replace(/\s+/g, '.')}@external.doctor`,
          name: doctorName,
          userType: "DOCTOR",
        }
      });

      doctor = await prisma.doctor.create({
        data: {
          userId: doctorUser.id,
          doctorId: "EXT-" + Date.now(),
          specialization: "General Medicine",
          department: "GENERAL",
          licenseNumber: "EXT-" + Date.now(),
          experience: "External Doctor",
          consultationFee: 0,
          isVerified: true,
        },
        include: { user: true }
      });
    }

    // Create the prescription
    const prescription = await prisma.prescription.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        medications: medications,
        diagnosis: diagnosis,
        notes: notes || null,
        isActive: true,
      },
      include: {
        doctor: {
          include: {
            user: true
          }
        }
      }
    });

    return NextResponse.json(prescription, { status: 201 });
  } catch (error) {
    console.error("Error creating prescription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
