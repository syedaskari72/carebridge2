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

    // Medications schedule - if you track per-patient medication reminders, fetch here
    const medications: any[] = [];

    // Active prescriptions from database
    const prescriptions = await prisma.prescription.findMany({
      where: { patientId: patient.id, isActive: true },
      include: { doctor: { include: { user: true } } },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const activePrescriptions = prescriptions.map(p => {
      const meds = (p.medications as any[]) || [];
      const first = meds[0] || {};
      return {
        id: p.id,
        medication: first.name || 'Prescription',
        frequency: first.frequency || 'As directed',
        doctor: p.doctor.user.name,
        remaining: '—'
      };
    });

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

    // Recommended nurses based on patient conditions -> departments
    const conditions = patient.medicalConditions || [];
    const deptFromConditions = new Set<string>();
    for (const c of conditions) {
      const lc = c.toLowerCase();
      if (lc.includes('hypertension') || lc.includes('cardiac') || lc.includes('heart')) deptFromConditions.add('CARDIOLOGY');
      if (lc.includes('diabetes') || lc.includes('sugar')) deptFromConditions.add('GENERAL');
      if (lc.includes('wound') || lc.includes('fracture') || lc.includes('orthopedic')) deptFromConditions.add('ORTHOPEDICS');
      if (lc.includes('child') || lc.includes('pediatric')) deptFromConditions.add('PEDIATRICS');
    }
    if (deptFromConditions.size === 0) deptFromConditions.add('GENERAL');

    const recommended = await prisma.nurse.findMany({
      where: {
        isAvailable: true,
        isVerified: true,
        department: { in: Array.from(deptFromConditions) as any }
      },
      include: { user: true },
      take: 6
    });

    const recommendedNurses = recommended.map(n => ({
      id: n.id,
      name: n.user.name,
      gender: n.user.gender,
      department: n.department,
      isAvailable: n.isAvailable,
      hourlyRate: n.hourlyRate,
      rating: n.rating,
      experience: n.experience,
      specialties: n.specialties,
    }));

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
      activePrescriptions,
      recommendedNurses
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
