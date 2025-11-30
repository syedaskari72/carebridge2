import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== "PATIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const booking = await prisma.booking.findFirst({
      where: {
        patientId: session.user.id,
        status: { in: ["CONFIRMED", "IN_PROGRESS"] },
      },
      include: {
        treatmentData: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!booking?.treatmentData) {
      return NextResponse.json({ treatment: null });
    }

    return NextResponse.json({ treatment: booking.treatmentData });
  } catch (error) {
    console.error("Error fetching treatment data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
