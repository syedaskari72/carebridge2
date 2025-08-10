import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.userType !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get total counts
    const [
      totalUsers,
      totalPatients,
      totalNurses,
      totalDoctors,
      pendingNurseVerifications,
      activeBookings,
      totalPayments,
      emergencyAlerts
    ] = await Promise.all([
      prisma.user.count(),
      prisma.patient.count(),
      prisma.nurse.count(),
      prisma.doctor.count(),
      prisma.nurse.count({
        where: { isVerified: false }
      }),
      prisma.booking.count({
        where: {
          status: {
            in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
          }
        }
      }),
      prisma.payment.aggregate({
        _sum: {
          amount: true
        },
        where: {
          status: 'COMPLETED'
        }
      }),
      prisma.safetyAlert.count({
        where: {
          isResolved: false
        }
      })
    ]);

    const stats = {
      totalUsers,
      totalPatients,
      totalNurses,
      totalDoctors,
      pendingVerifications: pendingNurseVerifications,
      activeBookings,
      totalRevenue: totalPayments._sum.amount || 0,
      emergencyAlerts
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin stats" },
      { status: 500 }
    );
  }
}
