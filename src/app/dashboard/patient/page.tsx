"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Heart,
  Pill,
  AlertTriangle,
  UserCheck,
  FileText,
  Phone,
  MapPin,
  Activity,
  Stethoscope,
  TrendingUp
} from "lucide-react";

// Mock data - replace with real API calls
const mockPatientData = {
  upcomingAppointments: [
    {
      id: "1",
      type: "Blood Pressure Check",
      provider: "Nurse Sarah Johnson",
      date: "2024-08-12",
      time: "14:00",
      status: "confirmed",
      location: "Home Visit"
    },
    {
      id: "2",
      type: "Medication Administration",
      provider: "Nurse Emily Davis",
      date: "2024-08-13",
      time: "10:00",
      status: "scheduled",
      location: "Home Visit"
    }
  ],
  recentTreatments: [
    {
      id: "1",
      type: "Blood Pressure Monitoring",
      date: "2024-08-10",
      nurse: "Sarah Johnson",
      status: "completed",
      notes: "BP within normal range"
    },
    {
      id: "2",
      type: "Wound Care",
      date: "2024-08-08",
      nurse: "Maria Rodriguez",
      status: "completed",
      notes: "Healing well, no infection"
    }
  ],
  vitals: {
    bloodPressure: { value: "120/80", status: "normal", lastChecked: "2024-08-10" },
    bloodSugar: { value: "110", unit: "mg/dL", status: "normal", lastChecked: "2024-08-10" },
    weight: { value: "70", unit: "kg", status: "stable", lastChecked: "2024-08-08" },
    temperature: { value: "98.6", unit: "°F", status: "normal", lastChecked: "2024-08-10" }
  },
  medications: [
    {
      id: "1",
      name: "Lisinopril 10mg",
      nextDose: "2024-08-12T20:00:00",
      frequency: "Once daily",
      remaining: "15 days"
    },
    {
      id: "2",
      name: "Metformin 500mg",
      nextDose: "2024-08-12T08:00:00",
      frequency: "Twice daily",
      remaining: "45 days"
    }
  ],
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
  ],
  recommendations: [
    {
      id: "1",
      type: "Nurse Recommendation",
      title: "Specialized Cardiac Care",
      description: "Based on your hypertension, we recommend Nurse Sarah Johnson who specializes in cardiac care.",
      provider: "Sarah Johnson, RN",
      rating: 4.9,
      experience: "8 years cardiac care"
    },
    {
      id: "2",
      type: "Treatment Recommendation",
      title: "Blood Pressure Monitoring",
      description: "Weekly BP checks recommended for optimal management.",
      frequency: "Weekly",
      nextDue: "2024-08-19"
    }
  ]
};

export default function PatientDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (session.user.userType !== "PATIENT") {
      router.push(`/dashboard/${session.user.userType.toLowerCase()}`);
      return;
    }

    // Load dashboard data
    loadDashboardData();
  }, [session, status, router]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/patient/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        console.error('Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.userType !== "PATIENT") {
    return null;
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Failed to load dashboard data. Please refresh the page.</p>
      </div>
    );
  }

  const getNextMedication = () => {
    if (!dashboardData?.medications) return null;

    const now = new Date();
    const upcoming = dashboardData.medications
      .map((med: any) => ({
        ...med,
        nextDoseTime: new Date(med.nextDose)
      }))
      .filter((med: any) => med.nextDoseTime > now)
      .sort((a: any, b: any) => a.nextDoseTime.getTime() - b.nextDoseTime.getTime());

    return upcoming[0] || null;
  };

  const nextMed = getNextMedication();

  const handleEmergency = () => {
    // In a real app, this would trigger emergency protocols
    if (confirm("This will contact emergency services and your emergency contacts. Continue?")) {
      router.push("/emergency");
    }
  };

  return (
    <div className="w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Welcome back, {session.user.name}
          </h1>
          <p className="text-muted-foreground">Your health dashboard</p>
        </div>

        {/* Emergency Button - Always Visible */}
        <div className="mb-6">
          <Button
            onClick={handleEmergency}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-4 text-lg font-semibold"
            size="lg"
          >
            🚨 Emergency - Get Help Now
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Link href="/book/nurse">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 sm:p-6 text-center">
                <UserCheck className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 sm:mb-3 text-primary" />
                <h3 className="font-semibold text-sm sm:text-base mb-1">Book Nurse</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Home care service</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/book/doctor">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 sm:p-6 text-center">
                <Stethoscope className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 sm:mb-3 text-primary" />
                <h3 className="font-semibold text-sm sm:text-base mb-1">Book Doctor</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Medical consultation</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/patient/records">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 sm:p-6 text-center">
                <FileText className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 sm:mb-3 text-primary" />
                <h3 className="font-semibold text-sm sm:text-base mb-1">My Records</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Health history</p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/patient/tracking">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-4 sm:p-6 text-center">
                <Activity className="h-8 w-8 sm:h-10 sm:w-10 mx-auto mb-2 sm:mb-3 text-primary" />
                <h3 className="font-semibold text-sm sm:text-base mb-1">Treatment</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">Track progress</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Next Medication Reminder */}
        {nextMed && (
          <Card className="mb-6 border-orange-200 bg-orange-50 dark:bg-orange-950">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Pill className="h-6 w-6 text-orange-600" />
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-900 dark:text-orange-100">Next Medication</h3>
                  <p className="text-sm text-orange-700 dark:text-orange-300">{nextMed.name}</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    Due: {new Date(nextMed.nextDose).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.upcomingAppointments.map((appointment: any) => (
                  <div key={appointment.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-sm sm:text-base">{appointment.type}</h3>
                      <Badge variant={appointment.status === 'confirmed' ? 'default' : 'secondary'}>
                        {appointment.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{appointment.provider}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs sm:text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(appointment.date).toLocaleDateString()}</span>
                      <Clock className="h-4 w-4 ml-2" />
                      <span>{appointment.time}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{appointment.location}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Treatments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Treatments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.recentTreatments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-4xl mb-2">🏥</div>
                  <p>No recent treatments</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData.recentTreatments.map((treatment: any) => (
                    <div key={treatment.id} className="border rounded-lg p-4">
                      <h3 className="font-medium">{treatment.type}</h3>
                      <p className="text-sm text-muted-foreground">by {treatment.nurse}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(treatment.date).toLocaleDateString()}
                      </p>
                      <p className="text-sm mt-2">{treatment.notes}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Additional Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mt-6">
          {/* Active Prescriptions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Active Prescriptions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dashboardData.activePrescriptions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="text-4xl mb-2">💊</div>
                  <p>No active prescriptions</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData.activePrescriptions.map((prescription: any) => (
                    <div key={prescription.id} className="border rounded-lg p-4">
                      <h3 className="font-medium">{prescription.medication}</h3>
                      <p className="text-sm text-muted-foreground">{prescription.frequency}</p>
                      <p className="text-sm text-muted-foreground">Prescribed by {prescription.doctor}</p>
                      <p className="text-sm text-orange-600 mt-1">{prescription.remaining} remaining</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Health Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended for You</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="border border-cyan-200 bg-cyan-50 dark:bg-cyan-950 rounded-lg p-4">
                  <h3 className="font-medium text-cyan-900 dark:text-cyan-100">Cardiology Nurse</h3>
                  <p className="text-sm text-cyan-700 dark:text-cyan-300">Based on your medical history</p>
                  <Link href="/nurses?department=cardiology" className="text-cyan-600 hover:text-cyan-700 text-sm">
                    View specialists →
                  </Link>
                </div>

                <div className="border border-blue-200 bg-blue-50 dark:bg-blue-950 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 dark:text-blue-100">Regular Health Checkup</h3>
                  <p className="text-sm text-blue-700 dark:text-blue-300">It's been 3 months since your last checkup</p>
                  <Link href="/book?type=checkup" className="text-blue-600 hover:text-blue-700 text-sm">
                    Schedule now →
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
