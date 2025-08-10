import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.userType !== "DOCTOR") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get doctor record
    const doctor = await prisma.doctor.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true
      }
    });

    if (!doctor) {
      return NextResponse.json(
        { error: "Doctor record not found" },
        { status: 404 }
      );
    }

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Get doctor's bookings
    const allBookings = await prisma.booking.findMany({
      where: { doctorId: doctor.id },
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
        nurse: {
          include: {
            user: {
              select: {
                name: true
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

    // Get today's consultations
    const todaysConsultations = allBookings.filter(booking => {
      const scheduledDate = new Date(booking.appointmentDate);
      return scheduledDate >= startOfDay && scheduledDate < endOfDay;
    });

    // Get upcoming consultations
    const upcomingConsultations = allBookings.filter(booking => {
      const scheduledDate = new Date(booking.appointmentDate);
      return scheduledDate >= endOfDay;
    }).slice(0, 10);

    // Get emergency cases (high urgency bookings)
    const emergencyCases = allBookings.filter(booking =>
      booking.urgencyLevel === 'EMERGENCY' &&
      ['PENDING', 'CONFIRMED'].includes(booking.status)
    );

    // Get pending cases (awaiting doctor approval)
    const pendingCases = allBookings.filter(booking => 
      booking.status === 'PENDING'
    );

    // Calculate earnings
    const completedBookings = allBookings.filter(booking => booking.status === 'COMPLETED');
    const totalEarnings = completedBookings.reduce((sum, booking) => {
      return sum + (booking.payment?.amount || 0);
    }, 0);

    const todaysEarnings = todaysConsultations
      .filter(booking => booking.status === 'COMPLETED')
      .reduce((sum, booking) => sum + (booking.payment?.amount || 0), 0);

    // Get recommended nurses (top rated nurses in same department)
    const recommendedNurses = await prisma.nurse.findMany({
      where: {
        department: doctor.department,
        isVerified: true
      },
      include: {
        user: {
          select: {
            name: true
          }
        }
      },
      take: 5
    });

    // Calculate stats
    const stats = {
      totalPatients: allBookings.length,
      activeCases: allBookings.filter(b => ['PENDING', 'CONFIRMED', 'IN_PROGRESS'].includes(b.status)).length,
      pendingApprovals: pendingCases.length,
      emergencyCases: emergencyCases.length,
      todaysConsultations: todaysConsultations.length,
      rating: 4.9 // Mock rating
    };

    const todayStats = {
      totalCases: todaysConsultations.length,
      approved: todaysConsultations.filter(b => b.status === 'CONFIRMED').length,
      pending: todaysConsultations.filter(b => b.status === 'PENDING').length,
      emergencies: todaysConsultations.filter(b => b.urgencyLevel === 'EMERGENCY').length,
      earnings: todaysEarnings
    };

    const dashboardData = {
      doctor: {
        id: doctor.id,
        name: doctor.user.name,
        email: doctor.user.email,
        phone: doctor.user.phone,
        specialization: doctor.specialization,
        department: doctor.department,
        licenseNumber: doctor.licenseNumber,
        experience: doctor.experience,
        consultationFee: doctor.consultationFee,
        isVerified: doctor.isVerified
      },
      stats,
      todayStats,
      upcomingConsultations: upcomingConsultations.map(booking => ({
        id: booking.id,
        patientName: booking.patient.user.name,
        age: 35, // Mock age - can be calculated from patient DOB
        condition: booking.serviceType,
        scheduledFor: booking.appointmentDate,
        type: booking.serviceType,
        status: booking.status
      })),
      emergencyCases: emergencyCases.map(booking => ({
        id: booking.id,
        patientName: booking.patient.user.name,
        age: 35, // Mock age
        condition: booking.serviceType,
        type: booking.serviceType,
        severity: booking.urgencyLevel,
        arrivalTime: booking.createdAt,
        timeAgo: `${Math.floor((Date.now() - new Date(booking.createdAt).getTime()) / (1000 * 60))} minutes ago`,
        assignedNurse: booking.nurse?.user.name || 'Available',
        symptoms: booking.notes || 'No symptoms recorded',
        location: booking.address
      })),
      pendingCases: pendingCases.map(booking => ({
        id: booking.id,
        patientName: booking.patient.user.name,
        age: 35, // Mock age
        condition: booking.serviceType,
        assignedNurse: booking.nurse?.user.name || 'Not assigned',
        lastConsultation: booking.createdAt,
        nextAppointment: booking.appointmentDate,
        status: booking.status,
        priority: booking.urgencyLevel || 'ROUTINE',
        treatmentPlan: booking.notes || 'Treatment plan pending',
        requestedService: booking.serviceType,
        estimatedCost: booking.payment?.amount || 2500,
        urgency: booking.urgencyLevel || 'ROUTINE'
      })),
      recommendedNurses: recommendedNurses.map(nurse => ({
        id: nurse.id,
        name: nurse.user.name,
        department: nurse.department,
        experience: nurse.experience,
        rating: 4.9, // Mock rating
        availability: 'Available',
        specialization: nurse.specialties[0] || nurse.department
      }))
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Doctor dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch doctor dashboard data" },
      { status: 500 }
    );
  }
}
