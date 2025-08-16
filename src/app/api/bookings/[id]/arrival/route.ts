import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Nurse marks arrival
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const bookingId = resolvedParams.id;

    // Verify the booking exists and belongs to the nurse
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        nurse: { include: { user: true } },
        patient: { include: { user: true } }
      }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Only the assigned nurse can mark arrival
    if (session.user.userType !== "NURSE" || booking.nurse?.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Update booking with arrival time
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        nurseArrivedAt: new Date(),
        status: "IN_PROGRESS"
      },
      include: {
        nurse: { include: { user: true } },
        patient: { include: { user: true } }
      }
    });

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message: "Arrival marked successfully. Patient has 5 minutes to confirm."
    });
  } catch (error) {
    console.error("Error marking arrival:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Patient confirms nurse arrival
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const bookingId = resolvedParams.id;

    // Verify the booking exists and belongs to the patient
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        nurse: { include: { user: true } },
        patient: { include: { user: true } }
      }
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Only the patient can confirm arrival
    if (session.user.userType !== "PATIENT" || booking.patient.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if nurse has marked arrival
    if (!booking.nurseArrivedAt) {
      return NextResponse.json({ error: "Nurse has not marked arrival yet" }, { status: 400 });
    }

    // Check if confirmation is within 5 minutes
    const arrivalTime = new Date(booking.nurseArrivedAt);
    const now = new Date();
    const timeDiff = (now.getTime() - arrivalTime.getTime()) / (1000 * 60); // in minutes

    if (timeDiff > 5) {
      return NextResponse.json({ 
        error: "Confirmation window expired. Please contact support." 
      }, { status: 400 });
    }

    // Update booking with confirmation
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        arrivalConfirmedAt: new Date()
      },
      include: {
        nurse: { include: { user: true } },
        patient: { include: { user: true } }
      }
    });

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message: "Arrival confirmed successfully."
    });
  } catch (error) {
    console.error("Error confirming arrival:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
