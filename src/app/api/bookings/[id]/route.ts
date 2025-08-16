import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await params;
    const booking = await prisma.booking.findUnique({
      where: { id: resolvedParams.id },
      include: {
        patient: { include: { user: { select: { name: true, email: true, phone: true } } } },
        nurse: { include: { user: { select: { name: true, email: true, phone: true } } } },
        doctor: { include: { user: { select: { name: true, email: true } } } },
        payment: true,
      },
    });

    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    // Check permissions
    if (session.user.userType === "PATIENT") {
      const patient = await prisma.patient.findUnique({ where: { userId: session.user.id } });
      if (booking.patientId !== patient?.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    } else if (session.user.userType === "NURSE") {
      const nurse = await prisma.nurse.findUnique({ where: { userId: session.user.id } });
      if (booking.nurseId !== nurse?.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    } else if (session.user.userType !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(booking);
  } catch (e) {
    console.error("[Booking][GET]", e);
    return NextResponse.json({ error: "Failed to fetch booking" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { status, notes } = body;

    const resolvedParams = await params;
    const booking = await prisma.booking.findUnique({
      where: { id: resolvedParams.id },
      include: { patient: true, nurse: true },
    });

    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    // Check permissions and allowed status transitions
    if (session.user.userType === "NURSE") {
      const nurse = await prisma.nurse.findUnique({ where: { userId: session.user.id } });
      if (booking.nurseId !== nurse?.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
      // Nurses can accept/decline/complete
      if (!["CONFIRMED", "CANCELLED", "COMPLETED"].includes(status)) {
        return NextResponse.json({ error: "Invalid status transition" }, { status: 400 });
      }
    } else if (session.user.userType === "PATIENT") {
      const patient = await prisma.patient.findUnique({ where: { userId: session.user.id } });
      if (booking.patientId !== patient?.id) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
      // Patients can only cancel
      if (status !== "CANCELLED") {
        return NextResponse.json({ error: "Patients can only cancel bookings" }, { status: 400 });
      }
    } else if (session.user.userType !== "ADMIN") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: resolvedParams.id },
      data: {
        status,
        notes: notes || booking.notes,
        completedAt: status === "COMPLETED" ? new Date() : booking.completedAt,
      },
    });

    return NextResponse.json(updatedBooking);
  } catch (e) {
    console.error("[Booking][PATCH]", e);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
