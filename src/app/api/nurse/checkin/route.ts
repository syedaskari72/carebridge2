import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.userType !== "NURSE") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { location, timestamp } = body;

    // Find nurse profile
    const nurse = await prisma.nurse.findUnique({
      where: { userId: session.user.id },
    });

    if (!nurse) {
      return NextResponse.json(
        { error: "Nurse profile not found" },
        { status: 404 }
      );
    }

    // Update nurse check-in status
    await prisma.nurse.update({
      where: { id: nurse.id },
      data: {
        isOnDuty: true,
        isAvailable: true, // Make nurse available for bookings when checking in
        lastCheckIn: new Date(timestamp),
        currentLocation: location,
      },
    });

    // TODO: Implement real-time location tracking
    // - Start location tracking session
    // - Notify admin of nurse going on duty
    // - Set up safety monitoring

    return NextResponse.json(
      {
        message: "Check-in successful",
        timestamp: new Date(timestamp),
        location: location ? JSON.parse(location) : null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Check-in error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
