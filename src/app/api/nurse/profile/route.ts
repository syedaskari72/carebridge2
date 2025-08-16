import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.userType !== "NURSE") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get nurse profile
    const nurse = await prisma.nurse.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          }
        }
      }
    });

    if (!nurse) {
      return NextResponse.json(
        { error: "Nurse profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(nurse);
  } catch (error) {
    console.error("Nurse profile fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch nurse profile" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.userType !== "NURSE") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      name,
      phone,
      department,
      specialties,
      hourlyRate,
      bio,
      location
    } = body;

    // Update user basic info
    if (name || phone) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          ...(name && { name }),
          ...(phone && { phone }),
        },
      });
    }

    // Update nurse-specific info
    const updatedNurse = await prisma.nurse.update({
      where: { userId: session.user.id },
      data: {
        ...(department && { department }),
        ...(specialties && { specialties }),
        ...(hourlyRate && { hourlyRate: parseFloat(hourlyRate) }),
        ...(bio && { bio }),
        ...(location && { location }),
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          }
        }
      }
    });

    return NextResponse.json({ success: true, nurse: updatedNurse });
  } catch (error) {
    console.error("Nurse profile update error:", error);
    return NextResponse.json(
      { error: "Failed to update nurse profile" },
      { status: 500 }
    );
  }
}
