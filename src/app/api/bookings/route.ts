import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendBookingConfirmationEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get("scope");

    if (session.user.userType === "PATIENT" || scope === "patient") {
      const patient = await prisma.patient.findUnique({ where: { userId: session.user.id } });
      if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      const bookings = await prisma.booking.findMany({
        where: { patientId: patient.id },
        include: {
          nurse: { include: { user: { select: { name: true, image: true } } } },
          payment: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(bookings);
    }

    if (session.user.userType === "NURSE" || scope === "nurse") {
      const nurse = await prisma.nurse.findUnique({ where: { userId: session.user.id } });
      if (!nurse) return NextResponse.json({ error: "Nurse not found" }, { status: 404 });
      const bookings = await prisma.booking.findMany({
        where: { nurseId: nurse.id },
        include: {
          patient: { include: { user: { select: { name: true, image: true } } } },
          payment: true,
        },
        orderBy: { appointmentDate: "asc" },
      });
      return NextResponse.json(bookings);
    }

    if (session.user.userType === "ADMIN") {
      const bookings = await prisma.booking.findMany({
        include: {
          patient: { include: { user: { select: { name: true, email: true } } } },
          nurse: { include: { user: { select: { name: true, email: true } } } },
          payment: true,
        },
        orderBy: { createdAt: "desc" },
        take: 200,
      });
      return NextResponse.json(bookings);
    }

    return NextResponse.json({ error: "Unsupported" }, { status: 400 });
  } catch (e) {
    console.error("[Bookings][GET]", e);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (session.user.userType !== "PATIENT") {
      return NextResponse.json({ error: "Only patients can create bookings" }, { status: 403 });
    }

    const patient = await prisma.patient.findUnique({ where: { userId: session.user.id } });
    if (!patient) return NextResponse.json({ error: "Patient not found" }, { status: 404 });

    const body = await request.json();
    const { serviceType, nurseId, appointmentDate, appointmentTime, urgencyLevel, address, notes } = body;

    const booking = await prisma.booking.create({
      data: {
        patientId: patient.id,
        nurseId: nurseId || null,
        serviceType,
        appointmentDate: new Date(appointmentDate),
        appointmentTime,
        urgencyLevel,
        address,
        notes,
        status: nurseId ? "PENDING" : "PENDING",
      },
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              }
            }
          }
        },
        nurse: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              }
            }
          }
        }
      }
    });

    // Send confirmation emails if nurse is assigned
    if (booking.nurse && booking.patient) {
      try {
        // Calculate estimated cost
        const serviceTypes = [
          { id: "blood-pressure", name: "Blood Pressure Monitoring", duration: "30 min" },
          { id: "medication", name: "Medication Administration", duration: "45 min" },
          { id: "wound-care", name: "Wound Care", duration: "60 min" },
          { id: "diabetes-care", name: "Diabetes Care", duration: "30 min" },
          { id: "general-checkup", name: "General Health Checkup", duration: "45 min" },
          { id: "post-surgery", name: "Post-Surgery Care", duration: "90 min" }
        ];

        const service = serviceTypes.find(s => s.id === serviceType);
        const durationMinutes = service ? parseInt(service.duration.split(' ')[0]) : 60;
        const estimatedCost = Math.round((booking.nurse.hourlyRate * durationMinutes) / 60);

        await sendBookingConfirmationEmail({
          patientName: booking.patient.user.name,
          patientEmail: booking.patient.user.email,
          nurseName: booking.nurse.user.name,
          nurseEmail: booking.nurse.user.email,
          serviceType: service?.name || serviceType,
          appointmentDate: booking.appointmentDate.toISOString(),
          appointmentTime: booking.appointmentTime,
          address: booking.address,
          estimatedCost,
          bookingId: booking.id,
          notes: booking.notes || undefined,
        });
      } catch (emailError) {
        console.error('Failed to send confirmation emails:', emailError);
        // Don't fail the booking if email fails
      }
    }

    return NextResponse.json(booking, { status: 201 });
  } catch (e) {
    console.error("[Bookings][POST]", e);
    return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
  }
}
