import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserType } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId, newRole } = await request.json();

    if (!userId || !newRole) {
      return NextResponse.json(
        { error: "User ID and new role are required" },
        { status: 400 }
      );
    }

    // Validate the new role
    if (!Object.values(UserType).includes(newRole)) {
      return NextResponse.json(
        { error: "Invalid user role" },
        { status: 400 }
      );
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        patient: true,
        nurse: true,
        doctor: true,
        admin: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Start a transaction to handle role change
    await prisma.$transaction(async (tx) => {
      // Update user type
      await tx.user.update({
        where: { id: userId },
        data: { userType: newRole }
      });

      // Clean up old role-specific records
      if (user.patient && newRole !== 'PATIENT') {
        await tx.patient.delete({ where: { userId } });
      }
      if (user.nurse && newRole !== 'NURSE') {
        await tx.nurse.delete({ where: { userId } });
      }
      if (user.doctor && newRole !== 'DOCTOR') {
        await tx.doctor.delete({ where: { userId } });
      }
      if (user.admin && newRole !== 'ADMIN') {
        await tx.admin.delete({ where: { userId } });
      }

      // Create new role-specific record
      switch (newRole) {
        case 'PATIENT':
          if (!user.patient) {
            await tx.patient.create({
              data: { userId }
            });
          }
          break;
        case 'NURSE':
          if (!user.nurse) {
            await tx.nurse.create({
              data: {
                userId,
                nurseId: `NURSE-${Date.now()}`,
                department: 'GENERAL',
                licenseNumber: 'PENDING',
                experience: '0 years',
                hourlyRate: 50,
                location: 'Not specified',
                specialties: ['GENERAL'],
                isVerified: false
              }
            });
          }
          break;
        case 'DOCTOR':
          if (!user.doctor) {
            await tx.doctor.create({
              data: {
                userId,
                doctorId: `DOC-${Date.now()}`,
                specialization: 'General Medicine',
                department: 'GENERAL',
                licenseNumber: 'PENDING',
                experience: '0 years',
                consultationFee: 100,
                isVerified: false
              }
            });
          }
          break;
        case 'ADMIN':
          if (!user.admin) {
            await tx.admin.create({
              data: {
                userId,
                adminId: `ADMIN-${Date.now()}`,
                role: 'MODERATOR'
              }
            });
          }
          break;
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Change role error:", error);
    return NextResponse.json(
      { error: "Failed to change user role" },
      { status: 500 }
    );
  }
}
