import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== "NURSE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { patientId, bookingId, treatmentName, progress, medications, vitals } = await req.json();

    const treatmentData = await prisma.treatmentData.upsert({
      where: { bookingId },
      update: {
        treatmentName,
        progress,
        medications,
        vitals,
        updatedAt: new Date(),
      },
      create: {
        bookingId,
        treatmentName,
        progress,
        medications,
        vitals,
      },
    });

    return NextResponse.json({ success: true, treatmentData });
  } catch (error) {
    console.error("Error updating treatment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
