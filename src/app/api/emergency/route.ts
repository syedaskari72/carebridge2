import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EmergencyType, EmergencySeverity } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      phone,
      emergencyType,
      description,
      location,
      severity = "HIGH", // Default to HIGH for emergency cases
      patientId = null, // For guest emergencies
    } = body;

    // Validate required fields
    if (!name || !phone || !emergencyType || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create emergency case
    const emergencyCase = await prisma.emergencyCase.create({
      data: {
        patientId,
        type: emergencyType as EmergencyType,
        severity: severity as EmergencySeverity,
        location: location || "Location not provided",
        description,
        guestName: patientId ? null : name,
        guestPhone: patientId ? null : phone,
        status: "PENDING",
      },
    });

    // TODO: Implement real-time notifications
    // - Send push notifications to on-call doctors
    // - Send SMS alerts to emergency contacts
    // - Update real-time dashboard for admin

    // For now, simulate finding nearest available doctor
    const availableDoctor = await prisma.doctor.findFirst({
      where: {
        isOnCall: true,
        isAvailable: true,
      },
      include: {
        user: true,
      },
    });

    if (availableDoctor) {
      // Assign doctor to emergency case
      await prisma.emergencyCase.update({
        where: { id: emergencyCase.id },
        data: {
          doctorId: availableDoctor.id,
          status: "ASSIGNED",
        },
      });

      // TODO: Send notification to assigned doctor
      console.log(`Emergency case ${emergencyCase.id} assigned to Dr. ${availableDoctor.user.name}`);
    }

    return NextResponse.json(
      {
        message: "Emergency case created successfully",
        emergencyId: emergencyCase.id,
        assignedDoctor: availableDoctor ? {
          name: availableDoctor.user.name,
          phone: availableDoctor.user.phone,
        } : null,
        estimatedResponse: availableDoctor ? "5-10 minutes" : "15-20 minutes",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Emergency case creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const severity = searchParams.get("severity");

    const where: any = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const emergencyCases = await prisma.emergencyCase.findMany({
      where,
      include: {
        patient: {
          include: {
            user: true,
          },
        },
        doctor: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(emergencyCases);
  } catch (error) {
    console.error("Emergency cases fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
