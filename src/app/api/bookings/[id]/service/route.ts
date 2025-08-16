import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Start service timer
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

    // Verify the booking exists
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

    // Only the assigned nurse can start service
    if (session.user.userType !== "NURSE" || booking.nurse?.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if arrival was confirmed
    if (!booking.arrivalConfirmedAt) {
      return NextResponse.json({ 
        error: "Cannot start service until arrival is confirmed by patient" 
      }, { status: 400 });
    }

    // Check if service is already started
    if (booking.serviceStartedAt) {
      return NextResponse.json({ 
        error: "Service has already been started" 
      }, { status: 400 });
    }

    // Start service timer
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        serviceStartedAt: new Date()
      },
      include: {
        nurse: { include: { user: true } },
        patient: { include: { user: true } }
      }
    });

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      message: "Service timer started successfully."
    });
  } catch (error) {
    console.error("Error starting service:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Stop service timer
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
    const body = await request.json();
    const { action } = body; // 'stop' or 'confirm_stop'

    // Verify the booking exists
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

    // Check access permissions
    const isNurse = session.user.userType === "NURSE" && booking.nurse?.userId === session.user.id;
    const isPatient = session.user.userType === "PATIENT" && booking.patient.userId === session.user.id;

    if (!isNurse && !isPatient) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if service was started
    if (!booking.serviceStartedAt) {
      return NextResponse.json({ 
        error: "Service has not been started yet" 
      }, { status: 400 });
    }

    // Check if service is already ended
    if (booking.serviceEndedAt) {
      return NextResponse.json({ 
        error: "Service has already been completed" 
      }, { status: 400 });
    }

    const now = new Date();
    const serviceStart = new Date(booking.serviceStartedAt);
    const durationMinutes = Math.ceil((now.getTime() - serviceStart.getTime()) / (1000 * 60));
    
    // Calculate actual cost based on nurse's hourly rate
    const actualCost = Math.round((booking.nurse!.hourlyRate * durationMinutes) / 60);

    // End service and calculate final cost
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        serviceEndedAt: now,
        actualDuration: durationMinutes,
        actualCost: actualCost,
        status: "COMPLETED"
      },
      include: {
        nurse: { include: { user: true } },
        patient: { include: { user: true } }
      }
    });

    return NextResponse.json({
      success: true,
      booking: updatedBooking,
      duration: durationMinutes,
      actualCost: actualCost,
      message: "Service completed successfully."
    });
  } catch (error) {
    console.error("Error stopping service:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
