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

    // Get nurse record
    const nurse = await prisma.nurse.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true
      }
    });

    if (!nurse) {
      return NextResponse.json(
        { error: "Nurse record not found" },
        { status: 404 }
      );
    }

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Get nurse's bookings
    const allBookings = await prisma.booking.findMany({
      where: { nurseId: nurse.id },
      include: {
        patient: {
          include: {
            user: {
              select: {
                name: true,
                phone: true
              }
            }
          }
        },
        payment: true
      },
      orderBy: {
        appointmentDate: 'asc'
      }
    });

    // Filter active bookings (pending, confirmed, or in-progress)
    const activeBookings = allBookings.filter(b => 
      b.status === 'PENDING' || b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS'
    );

    // Get today's assignments (only confirmed or in-progress)
    const todaysAppointments = activeBookings.filter(booking => {
      const scheduledDate = new Date(booking.appointmentDate);
      return scheduledDate >= startOfDay && scheduledDate < endOfDay;
    });

    // Get upcoming appointments (next 7 days)
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const upcomingAppointments = allBookings.filter(booking => {
      const scheduledDate = new Date(booking.appointmentDate);
      return scheduledDate >= endOfDay && scheduledDate <= nextWeek;
    });

    // Calculate earnings
    const completedBookings = allBookings.filter(booking => booking.status === 'COMPLETED');

    // Service duration mapping for earnings calculation
    const serviceDurations: { [key: string]: number } = {
      "blood-pressure": 30,
      "medication": 45,
      "wound-care": 60,
      "diabetes-care": 30,
      "general-checkup": 45,
      "post-surgery": 90
    };

    const totalEarnings = completedBookings.reduce((sum, booking) => {
      // Use payment amount if available, otherwise calculate from hourly rate
      if (booking.payment?.amount) {
        return sum + booking.payment.amount;
      } else {
        const duration = serviceDurations[booking.serviceType] || 60;
        const earnings = (nurse.hourlyRate * duration) / 60;
        return sum + earnings;
      }
    }, 0);

    const todaysEarnings = todaysAppointments
      .filter(booking => booking.status === 'COMPLETED')
      .reduce((sum, booking) => {
        // Use payment amount if available, otherwise calculate from hourly rate
        if (booking.payment?.amount) {
          return sum + booking.payment.amount;
        } else {
          const duration = serviceDurations[booking.serviceType] || 60;
          const earnings = (nurse.hourlyRate * duration) / 60;
          return sum + earnings;
        }
      }, 0);

    // Get safety status (mock for now)
    const safetyStatus = {
      isOnDuty: false,
      lastCheckIn: null,
      lastCheckOut: null,
      currentLocation: null
    };

    // Calculate stats
    const stats = {
      todaysAppointments: todaysAppointments.length,
      completedToday: todaysAppointments.filter(b => b.status === 'COMPLETED').length,
      totalActivePatients: activeBookings.reduce((set, b) => set.add(b.patientId), new Set<string>()).size,
      rating: nurse.rating || 0,
      completionRate: allBookings.length > 0 ? Math.round((completedBookings.length / allBookings.length) * 100) : 0,
      earnings: totalEarnings
    };

    const todayStats = {
      totalPatients: todaysAppointments.length,
      completed: todaysAppointments.filter(b => b.status === 'COMPLETED').length,
      pending: todaysAppointments.filter(b => b.status === 'PENDING').length,
      earnings: todaysEarnings
    };

    const dashboardData = {
      nurse: {
        id: nurse.id,
        name: nurse.user.name,
        email: nurse.user.email,
        phone: nurse.user.phone,
        department: nurse.department,
        licenseNumber: nurse.licenseNumber,
        experience: nurse.experience,
        hourlyRate: nurse.hourlyRate,
        isVerified: nurse.isVerified,
        specialties: nurse.specialties,
        location: nurse.location,
        isOnDuty: nurse.isOnDuty,
        isAvailable: nurse.isAvailable
      },
      stats,
      todayStats,
      safetyStatus,
      todaysAppointments: todaysAppointments.map(booking => ({
        id: booking.id,
        patientId: booking.patient.userId,
        name: booking.patient.user.name,
        condition: booking.serviceType,
        address: booking.address,
        nextVisit: booking.appointmentDate,
        priority: booking.urgencyLevel || 'ROUTINE',
        phone: booking.patient.user.phone,
        status: booking.status
      })),
      upcomingAppointments: upcomingAppointments.slice(0, 5).map(booking => ({
        id: booking.id,
        patientName: booking.patient.user.name,
        serviceType: booking.serviceType,
        scheduledFor: booking.appointmentDate,
        address: booking.address,
        status: booking.status
      })),
      recentActivity: completedBookings.slice(0, 5).map(booking => ({
        id: booking.id,
        type: 'Treatment Completed',
        patient: booking.patient.user.name,
        time: booking.updatedAt,
        description: `Completed ${booking.serviceType} service`
      }))
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Nurse dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch nurse dashboard data" },
      { status: 500 }
    );
  }
}
