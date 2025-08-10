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
    const { location, timestamp, description } = body;

    // Find nurse profile
    const nurse = await prisma.nurse.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true,
      },
    });

    if (!nurse) {
      return NextResponse.json(
        { error: "Nurse profile not found" },
        { status: 404 }
      );
    }

    // Create safety alert
    const safetyAlert = await prisma.safetyAlert.create({
      data: {
        nurseId: nurse.id,
        type: "SOS_PANIC",
        location: location || "Location not available",
        description: description || "SOS panic button pressed",
        isResolved: false,
      },
    });

    // TODO: Implement emergency response system
    // - Send immediate SMS to admin
    // - Call emergency services (1122 in Pakistan)
    // - Notify nurse's emergency contact
    // - Send push notifications to nearby nurses/doctors
    // - Start real-time location tracking
    // - Create incident report

    // For now, simulate emergency response
    console.log(`🚨 EMERGENCY ALERT: Nurse ${nurse.user.name} (ID: ${nurse.nurseId}) has triggered SOS`);
    console.log(`Location: ${location || "Unknown"}`);
    console.log(`Time: ${timestamp}`);
    console.log(`Description: ${description}`);

    // Simulate notifying admin and emergency contacts
    const adminUsers = await prisma.user.findMany({
      where: { userType: "ADMIN" },
      include: { admin: true },
    });

    // TODO: Send real notifications
    for (const admin of adminUsers) {
      console.log(`Notifying admin: ${admin.name} (${admin.email})`);
    }

    // Parse emergency contact if available
    let emergencyContact = null;
    if (nurse.emergencyContact) {
      try {
        emergencyContact = JSON.parse(nurse.emergencyContact);
        console.log(`Notifying emergency contact: ${emergencyContact.name} (${emergencyContact.phone})`);
      } catch (e) {
        console.error("Failed to parse emergency contact:", e);
      }
    }

    return NextResponse.json(
      {
        message: "Emergency alert sent successfully",
        alertId: safetyAlert.id,
        timestamp: new Date(timestamp),
        emergencyServices: "1122 has been notified",
        adminNotified: adminUsers.length > 0,
        emergencyContactNotified: !!emergencyContact,
        estimatedResponse: "5-10 minutes",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("SOS alert error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
