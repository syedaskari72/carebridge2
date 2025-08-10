import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.userType !== "PATIENT") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get patient record
    const patient = await prisma.patient.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true
      }
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Patient record not found" },
        { status: 404 }
      );
    }

    // Get patient's bookings
    const bookings = await prisma.booking.findMany({
      where: { patientId: patient.id },
      include: {
        nurse: {
          include: {
            user: {
              select: {
                name: true,
                image: true
              }
            }
          }
        },
        doctor: {
          include: {
            user: {
              select: {
                name: true,
                image: true
              }
            }
          }
        },
        payment: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });

    // Get upcoming appointments
    const upcomingAppointments = await prisma.booking.findMany({
      where: {
        patientId: patient.id,
        appointmentDate: {
          gte: new Date()
        },
        status: {
          in: ['CONFIRMED', 'PENDING']
        }
      },
      include: {
        nurse: {
          include: {
            user: {
              select: {
                name: true,
                image: true
              }
            }
          }
        },
        doctor: {
          include: {
            user: {
              select: {
                name: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: {
        appointmentDate: 'asc'
      },
      take: 5
    });

    // Get recent treatments (completed bookings)
    const recentTreatments = await prisma.booking.findMany({
      where: {
        patientId: patient.id,
        status: 'COMPLETED'
      },
      include: {
        nurse: {
          include: {
            user: {
              select: {
                name: true
              }
            }
          }
        },
        treatmentLogs: true
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5
    });

    // Get medications (mock for now - can be extended)
    const medications = [
      {
        id: "1",
        name: "Lisinopril 10mg",
        frequency: "Once daily",
        nextDose: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
        remaining: 15
      },
      {
        id: "2",
        name: "Metformin 500mg",
        frequency: "Twice daily",
        nextDose: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
        remaining: 30
      }
    ];

    // Calculate stats
    const totalBookings = await prisma.booking.count({
      where: { patientId: patient.id }
    });

    const completedBookings = await prisma.booking.count({
      where: { 
        patientId: patient.id,
        status: 'COMPLETED'
      }
    });

    const totalSpent = await prisma.payment.aggregate({
      where: {
        booking: {
          patientId: patient.id
        },
        status: 'COMPLETED'
      },
      _sum: {
        amount: true
      }
    });

    const dashboardData = {
      patient: {
        id: patient.id,
        name: patient.user.name,
        email: patient.user.email,
        phone: patient.user.phone,
        emergencyContact: patient.emergencyContactName,
        bloodType: patient.bloodType,
        allergies: patient.allergies,
        medicalHistory: patient.medicalHistory
      },
      stats: {
        totalBookings,
        completedBookings,
        upcomingAppointments: upcomingAppointments.length,
        totalSpent: totalSpent._sum.amount || 0
      },
      upcomingAppointments: upcomingAppointments.map(booking => ({
        id: booking.id,
        type: booking.serviceType,
        provider: booking.nurse?.user.name || booking.doctor?.user.name || 'TBD',
        date: booking.appointmentDate,
        status: booking.status,
        address: booking.address
      })),
      recentTreatments: recentTreatments.map(booking => ({
        id: booking.id,
        type: booking.serviceType,
        nurse: booking.nurse?.user.name || 'Unknown',
        date: booking.updatedAt,
        notes: booking.treatmentLogs?.[0]?.notes || 'No notes available'
      })),
      medications,
      activePrescriptions: [
        {
          id: "1",
          medication: "Lisinopril 10mg",
          frequency: "Once daily",
          doctor: "Dr. Smith",
          remaining: "15 days"
        },
        {
          id: "2",
          medication: "Metformin 500mg",
          frequency: "Twice daily",
          doctor: "Dr. Johnson",
          remaining: "45 days"
        }
      ]
    };

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Patient dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch patient dashboard data" },
      { status: 500 }
    );
  }
}
