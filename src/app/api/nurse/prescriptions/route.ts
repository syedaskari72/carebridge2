import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Get prescriptions for patients the nurse is currently serving
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== "NURSE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const nurse = await prisma.nurse.findUnique({
      where: { userId: session.user.id },
    });

    if (!nurse) {
      return NextResponse.json({ error: "Nurse record not found" }, { status: 404 });
    }

    // Get current active bookings for this nurse
    const activeBookings = await prisma.booking.findMany({
      where: {
        nurseId: nurse.id,
        status: { in: ["CONFIRMED", "IN_PROGRESS"] },
        serviceStartedAt: { not: null },
        serviceEndedAt: null
      },
      include: {
        patient: {
          include: {
            prescriptions: {
              where: { isActive: true },
              include: {
                doctor: { include: { user: true } }
              },
              orderBy: { createdAt: "desc" }
            },
            user: true
          }
        }
      }
    });

    // Extract all prescriptions from active patients
    const prescriptions = activeBookings.flatMap((booking: any) => 
      booking.patient.prescriptions.map((prescription: any) => ({
        ...prescription,
        patientName: booking.patient.user.name,
        bookingId: booking.id
      }))
    );

    return NextResponse.json(prescriptions);
  } catch (error) {
    console.error("Error fetching nurse prescriptions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
