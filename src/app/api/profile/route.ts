import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user with related profile data
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        patient: true,
        nurse: true,
        doctor: true,
        admin: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Return user profile data
    const profileData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      cnic: user.cnic,
      address: user.address,
      userType: user.userType,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      // Include role-specific data
      patient: user.patient ? {
        bloodType: user.patient.bloodType,
        allergies: user.patient.allergies,
        medications: user.patient.medications,
        medicalConditions: user.patient.medicalConditions,
        emergencyContactName: user.patient.emergencyContactName,
        emergencyContactPhone: user.patient.emergencyContactPhone,
        emergencyContactRelationship: user.patient.emergencyContactRelationship,
        preferredLanguage: user.patient.preferredLanguage,
        notifications: user.patient.notifications,
      } : null,
      nurse: user.nurse ? {
        nurseId: user.nurse.nurseId,
        department: user.nurse.department,
        specialties: user.nurse.specialties,
        experience: user.nurse.experience,
        hourlyRate: user.nurse.hourlyRate,
        location: user.nurse.location,
        bio: user.nurse.bio,
        licenseNumber: user.nurse.licenseNumber,
        isVerified: user.nurse.isVerified,
      } : null,
      doctor: user.doctor ? {
        doctorId: user.doctor.doctorId,
        specialization: user.doctor.specialization,
        department: user.doctor.department,
        licenseNumber: user.doctor.licenseNumber,
        experience: user.doctor.experience,
        consultationFee: user.doctor.consultationFee,
        isVerified: user.doctor.isVerified,
      } : null,
      admin: user.admin ? {
        adminId: user.admin.adminId,
        role: user.admin.role,
      } : null,
    };

    return NextResponse.json(profileData);
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      name, 
      phone, 
      address, 
      // Patient-specific fields
      bloodType,
      allergies,
      medications,
      medicalConditions,
      emergencyContactName,
      emergencyContactPhone,
      emergencyContactRelationship,
      preferredLanguage,
      notifications,
      // Nurse-specific fields
      bio,
      hourlyRate,
      location,
      // Doctor-specific fields
      consultationFee,
    } = body;

    // Update user basic info
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        phone,
        address,
      },
    });

    // Update role-specific data
    if (session.user.userType === "PATIENT") {
      await prisma.patient.update({
        where: { userId: session.user.id },
        data: {
          bloodType,
          allergies,
          medications,
          medicalConditions,
          emergencyContactName,
          emergencyContactPhone,
          emergencyContactRelationship,
          preferredLanguage,
          notifications,
        },
      });
    } else if (session.user.userType === "NURSE") {
      await prisma.nurse.update({
        where: { userId: session.user.id },
        data: {
          bio,
          hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
          location,
        },
      });
    } else if (session.user.userType === "DOCTOR") {
      await prisma.doctor.update({
        where: { userId: session.user.id },
        data: {
          consultationFee: consultationFee ? parseFloat(consultationFee) : undefined,
        },
      });
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
