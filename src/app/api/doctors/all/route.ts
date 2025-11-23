import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.userType !== "NURSE") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const doctors = await prisma.doctor.findMany({
      where: {
        isVerified: true
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            image: true
          }
        }
      },
      orderBy: {
        user: {
          name: 'asc'
        }
      }
    });

    return NextResponse.json(doctors);
  } catch (error) {
    console.error("Error fetching doctors:", error);
    return NextResponse.json(
      { error: "Failed to fetch doctors" },
      { status: 500 }
    );
  }
}
