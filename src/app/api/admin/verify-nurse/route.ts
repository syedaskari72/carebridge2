import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { nurseId, action } = await request.json();

    if (!nurseId || !action) {
      return NextResponse.json(
        { error: "Nurse ID and action are required" },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    const nurse = await prisma.nurse.findUnique({
      where: { id: nurseId }
    });

    if (!nurse) {
      return NextResponse.json(
        { error: "Nurse not found" },
        { status: 404 }
      );
    }

    // Update nurse verification status
    await prisma.nurse.update({
      where: { id: nurseId },
      data: {
        isVerified: action === 'approve',
        verifiedAt: action === 'approve' ? new Date() : null,
        verifiedBy: action === 'approve' ? session.user.id : null
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Verify nurse error:", error);
    return NextResponse.json(
      { error: "Failed to verify nurse" },
      { status: 500 }
    );
  }
}
