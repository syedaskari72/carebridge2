import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== "NURSE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      where: {
        nurseId: session.user.id,
        status: { in: ["CONFIRMED", "IN_PROGRESS"] },
      },
      include: {
        patient: { include: { user: { select: { id: true, name: true } } } },
        treatmentData: true,
      },
    });

    const patients = bookings.map((booking) => ({
      id: booking.patient.user.id,
      name: booking.patient.user.name,
      bookingId: booking.id,
      treatment: booking.treatmentData ? {
        name: booking.treatmentData.treatmentName,
        progress: booking.treatmentData.progress,
        medications: booking.treatmentData.medications as any,
        vitals: booking.treatmentData.vitals as any,
      } : undefined,
    }));

    return NextResponse.json({ patients });
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
