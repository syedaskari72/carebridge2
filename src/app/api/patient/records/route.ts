import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.userType !== "PATIENT" && session.user.userType !== "NURSE")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    
    const patient = await prisma.patient.findUnique({
      where: patientId ? { id: patientId } : { userId: session.user.id },
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

    // Treatment data from bookings
    const treatmentData = await prisma.treatmentData.findMany({
      where: {
        booking: { patientId: patient.id },
      },
      include: {
        booking: {
          include: {
            nurse: { include: { user: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
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
      treatmentHistory: [
        ...treatmentData.map(td => ({
          id: td.id,
          date: td.updatedAt,
          type: td.treatmentName,
          nurse: td.booking.nurse?.user.name || "Nurse",
          duration: undefined,
          vitals: (td.vitals as any) || {},
          medications: Array.isArray((td.medications as any)) ? (td.medications as any) : [],
          procedures: [],
          notes: `Treatment progress: ${td.progress}%`,
          nextVisit: undefined,
          status: td.progress === 100 ? "completed" : "ongoing",
          photos: [],
          nurseSignature: undefined,
        })),
        ...treatmentLogs.map(t => ({
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
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
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

