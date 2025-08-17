import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Mark prescription as given
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ prescriptionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.userType !== "NURSE") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const nurse = await prisma.nurse.findUnique({
      where: { userId: session.user.id },
    });

    if (!nurse) {
      return NextResponse.json({ error: "Nurse record not found" }, { status: 404 });
    }

    const body = await request.json();
    const { medicationIndex, action, notes } = body;
    const resolvedParams = await params;

    // Validate action
    if (action !== "given" && action !== "skip") {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Get the prescription and verify access
    const prescription = await prisma.prescription.findUnique({
      where: { id: resolvedParams.prescriptionId }
    });

    if (!prescription) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    }

    // Verify nurse has access to this prescription (through active booking)
    const activeBooking = await prisma.booking.findFirst({
      where: {
        nurseId: nurse.id,
        patientId: prescription.patientId,
        status: { in: ["CONFIRMED", "IN_PROGRESS"] },
        serviceStartedAt: { not: null },
        serviceEndedAt: null
      }
    });

    if (!activeBooking) {
      return NextResponse.json({ error: "No active booking with this patient" }, { status: 403 });
    }

    // Get current medications array
    const medications = prescription.medications as any[];
    if (!medications || medicationIndex >= medications.length) {
      return NextResponse.json({ error: "Invalid medication index" }, { status: 400 });
    }

    // Update the specific medication
    const updatedMedications = medications.map((med, index) => {
      if (index === medicationIndex) {
        return {
          ...med,
          givenAt: action === "given" ? new Date().toISOString() : null,
          givenBy: action === "given" ? nurse.id : null,
          nurseNotes: notes || null,
          status: action
        };
      }
      return med;
    });

    // Update the prescription
    const updatedPrescription = await prisma.prescription.update({
      where: { id: resolvedParams.prescriptionId },
      data: {
        medications: updatedMedications,
        updatedAt: new Date()
      },
      include: {
        doctor: { include: { user: true } },
        patient: { include: { user: true } }
      }
    });

    return NextResponse.json(updatedPrescription);
  } catch (error) {
    console.error("Error updating prescription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
