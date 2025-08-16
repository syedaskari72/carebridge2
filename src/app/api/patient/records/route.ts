import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== "PATIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      include: { user: true },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient record not found" }, { status: 404 });
    }

    // Prescriptions
    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: patient.id },
      include: { doctor: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Treatment history from treatment logs
    const treatmentLogs = await prisma.treatmentLog.findMany({
      where: { patientId: patient.id },
      include: { nurse: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const consultations = await prisma.consultation.findMany({
      where: { patientId: patient.id },
      include: { doctor: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const data = {
      personalInfo: {
        name: patient.user.name,
        age: undefined,
        gender: undefined,
        bloodType: patient.bloodType,
        allergies: patient.allergies || [],
        conditions: patient.medicalConditions || [],
        emergencyContact: {
          name: patient.emergencyContactName,
          phone: patient.emergencyContactPhone,
          relationship: patient.emergencyContactRelationship,
        },
      },
      prescriptions: prescriptions.map(p => ({
        id: p.id,
        medication: ((p.medications as any[])?.[0]?.name) || "Prescription",
        frequency: ((p.medications as any[])?.[0]?.frequency) || "As directed",
        dosage: ((p.medications as any[])?.[0]?.dosage) || undefined,
        doctor: p.doctor.user.name,
        startDate: p.createdAt,
        endDate: p.updatedAt,
        status: p.isActive ? "active" : "inactive",
        remaining: "—",
        instructions: undefined,
        sideEffects: [],
        refillsRemaining: undefined,
      })),
      treatmentHistory: treatmentLogs.map(t => ({
        id: t.id,
        date: t.createdAt,
        type: t.treatmentType,
        nurse: t.nurse.user.name,
        duration: undefined,
        vitals: t.vitals || {},
        medications: Array.isArray(t.medications as any) ? (t.medications as any) : [],
        procedures: [],
        notes: t.notes,
        nextVisit: t.nextVisit || undefined,
        status: "completed",
        photos: [],
        nurseSignature: undefined,
      })),
      consultations: consultations.map(c => ({
        id: c.id,
        date: c.createdAt,
        doctor: c.doctor.user.name,
        type: c.type,
        diagnosis: c.diagnosis,
        treatment: c.treatment,
        cost: c.cost,
        followUp: c.followUp || undefined,
        duration: undefined,
        notes: c.notes,
        recommendations: [],
      })),
      medicalHistory: {
        familyHistory: [],
        pastSurgeries: [],
        hospitalizations: [],
        immunizations: [],
      },
      trackingSystem: {
        reminders: [],
        nurseUpdates: [],
        progressTracking: {
          bloodPressure: [],
          bloodSugar: [],
          weight: [],
        },
      },
    };

    return NextResponse.json(data);
  } catch (error) {
    console.error("[PatientRecords][GET]", error);
    return NextResponse.json({ error: "Failed to fetch records" }, { status: 500 });
  }
}

