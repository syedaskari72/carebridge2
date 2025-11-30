import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.userType !== "DOCTOR") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const nurses = await prisma.nurse.findMany({
      where: {
        isVerified: true
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            gender: true,
            image: true
          }
        }
      },
      orderBy: {
        rating: 'desc'
      }
    });

    return NextResponse.json(nurses);
  } catch (error) {
    console.error("Error fetching approved nurses:", error);
    return NextResponse.json(
      { error: "Failed to fetch nurses" },
      { status: 500 }
    );
  }
}
