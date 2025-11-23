"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Clock,
  User,
  CheckCircle,
  AlertTriangle,
  Users,
  ClipboardList,
  TrendingUp,
  Phone,
  Stethoscope,
  Pill,
  UserCheck,
  FileText,
  Heart,
  Activity
} from "lucide-react";

// Mock data - replace with real API calls
const mockDoctorData = {
  patientCases: [
    {
      id: "1",
      patientName: "Ahmed Hassan",
      age: 65,
      condition: "Hypertension",
      assignedNurse: "Sarah Johnson",
      lastConsultation: "2024-08-08",
      nextAppointment: "2024-08-15",
      status: "active",
      priority: "medium",
      treatmentPlan: "Blood pressure monitoring, medication adjustment"
    },
    {
      id: "2",
      patientName: "Fatima Khan",
      age: 58,
      condition: "Diabetes Type 2",
      assignedNurse: "Emily Davis",
      lastConsultation: "2024-08-09",
      nextAppointment: "2024-08-16",
      status: "active",
      priority: "high",
      treatmentPlan: "Insulin adjustment, dietary counseling"
    }
  ],
  pendingPrescriptions: [
    {
      id: "1",
      patientName: "Ahmed Hassan",
      medication: "Lisinopril 10mg",
      dosage: "Once daily",
      duration: "30 days",
      requestedBy: "Sarah Johnson",
      requestDate: "2024-08-11",
      reason: "Blood pressure control"
    },
    {
      id: "2",
      patientName: "Fatima Khan",
      medication: "Metformin 500mg",
      dosage: "Twice daily",
      duration: "90 days",
      requestedBy: "Emily Davis",
      requestDate: "2024-08-11",
      reason: "Diabetes management"
    }
  ],
  emergencyCases: [
    {
      id: "1",
      patientName: "Emergency Patient",
      age: 45,
      condition: "Chest pain",
      type: "Cardiac",
      severity: "critical",
      arrivalTime: "2024-08-12T09:30:00",
      timeAgo: "30 minutes ago",
      assignedNurse: "Available",
      symptoms: "Severe chest pain, shortness of breath",
      location: "DHA Phase 2, Karachi"
    }
  ],
  nurseRecommendations: [
    {
      id: "1",
      nurseName: "Sarah Johnson",
      specialization: "Cardiac Care",
      experience: "8 years",
      rating: 4.9,
      availability: "Available",
      patientMatch: "Ahmed Hassan - Hypertension",
      reason: "Specialized in cardiac care"
    }
  ],
  pendingCases: [
    {
      id: "1",
      patientName: "Ahmed Hassan",
      age: 65,
      condition: "Hypertension",
      assignedNurse: "Sarah Johnson",
      lastConsultation: "2024-08-08",
      nextAppointment: "2024-08-15",
      status: "pending",
      priority: "medium",
      treatmentPlan: "Blood pressure monitoring, medication adjustment",
      requestedService: "Blood pressure monitoring",
      estimatedCost: 2500,
      urgency: "medium"
    }
  ],
  recommendedNurses: [
    {
      id: "1",
      name: "Sarah Johnson",
      department: "Cardiac Care",
      experience: "8 years",
      rating: 4.9,
      availability: "Available",
      specialization: "Cardiac Care"
    }
  ],
  todayStats: {
    totalCases: 45,
    approved: 12,
    pending: 3,
    emergencies: 1,
    earnings: 15000
  },
  stats: {
    totalPatients: 45,
    activeCases: 12,
    pendingApprovals: 3,
    emergencyCases: 1,
    todaysConsultations: 5,
    rating: 4.9
  }
};

export default function DoctorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [doctorData, setDoctorData] = useState(mockDoctorData);
  const [isOnCall, setIsOnCall] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (session.user.userType !== "DOCTOR") {
      router.push(`/dashboard/${session.user.userType.toLowerCase()}`);
      return;
    }
  }, [session, status, router]);

  const handleApproveCase = async (caseId: string) => {
    try {
      const response = await fetch(`/api/doctor/cases/${caseId}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        setDoctorData(prev => ({
          ...prev,
          pendingCases: prev.pendingCases.filter(c => c.id !== caseId),
          todayStats: {
            ...prev.todayStats,
            approved: prev.todayStats.approved + 1,
            pending: prev.todayStats.pending - 1
          }
        }));
      }
    } catch (error) {
      console.error("Approve case error:", error);
    }
  };

  const handleRejectCase = async (caseId: string) => {
    try {
      const response = await fetch(`/api/doctor/cases/${caseId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        setDoctorData(prev => ({
          ...prev,
          pendingCases: prev.pendingCases.filter(c => c.id !== caseId)
        }));
      }
    } catch (error) {
      console.error("Reject case error:", error);
    }
  };

  const toggleOnCall = async () => {
    try {
      const response = await fetch("/api/doctor/oncall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOnCall: !isOnCall }),
      });

      if (response.ok) {
        setIsOnCall(!isOnCall);
      }
    } catch (error) {
      console.error("Toggle on-call error:", error);
    }
  };

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session || session.user.userType !== "DOCTOR") {
    return null;
  }

  return (
    <div className="w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
      {/* Welcome Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Welcome, Dr. {session.user.name}
        </h1>
        <p className="text-muted-foreground">Review cases and manage patient care</p>
      </div>

      {/* On-Call Status */}
      <Card className="mb-6 bg-blue-50 dark:bg-blue-950 border-blue-200">
        <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100">Emergency On-Call Status</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {isOnCall ? "You are available for emergency cases" : "You are not available for emergencies"}
            </p>
          </div>
          <Button
            onClick={toggleOnCall}
            className={`w-full sm:w-auto ${
              isOnCall 
                ? "bg-red-600 hover:bg-red-700" 
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isOnCall ? "Go Off-Call" : "Go On-Call"}
          </Button>
        </div>
        </CardContent>
      </Card>

      {/* Emergency Cases Alert */}
      {doctorData.emergencyCases.length > 0 && (
        <Card className="mb-6 bg-red-50 dark:bg-red-950 border-red-200">
          <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-red-900 dark:text-red-100">🚨 Emergency Cases</h2>
            <Badge className="bg-red-600 text-white">
              {doctorData.emergencyCases.length} Active
            </Badge>
          </div>
          
          <div className="space-y-3">
            {doctorData.emergencyCases.map((emergency) => (
              <div key={emergency.id} className="bg-white dark:bg-gray-800 border border-red-200 rounded-lg p-3 sm:p-4">
                <div className="flex flex-col gap-3">
                  <div>
                    <h3 className="font-semibold text-red-900 dark:text-red-100 text-sm sm:text-base">{emergency.type} Emergency</h3>
                    <p className="text-xs sm:text-sm text-red-700 dark:text-red-300">Patient: {emergency.patientName}</p>
                    <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">📍 {emergency.location}</p>
                    <p className="text-xs sm:text-sm text-red-500">⏰ {emergency.timeAgo}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button className="flex-1 bg-red-600 hover:bg-red-700">
                      Accept Case
                    </Button>
                    <Button variant="outline" className="flex-1 border-red-600 text-red-600">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-bold text-cyan-600">{doctorData.todayStats.totalCases}</div>
          <p className="text-xs sm:text-sm text-muted-foreground">Total Cases</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-bold text-green-600">{doctorData.todayStats.approved}</div>
          <p className="text-xs sm:text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-bold text-orange-600">{doctorData.todayStats.pending}</div>
          <p className="text-xs sm:text-sm text-muted-foreground">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-bold text-red-600">{doctorData.todayStats.emergencies}</div>
          <p className="text-xs sm:text-sm text-muted-foreground">Emergencies</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:p-4 text-center">
          <div className="text-xl sm:text-2xl font-bold text-purple-600">PKR {doctorData.todayStats.earnings}</div>
          <p className="text-xs sm:text-sm text-muted-foreground">Earnings</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        {/* Pending Cases for Approval */}
        <Card>
          <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg sm:text-xl">Cases Pending Approval</CardTitle>
            <Link href="/dashboard/doctor/cases">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm">View all</Button>
            </Link>
          </div>
          </CardHeader>
          <CardContent>

          {doctorData.pendingCases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-2">✅</div>
              <p>No pending cases</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {doctorData.pendingCases.map((case_) => (
                <div key={case_.id} className="border rounded-lg p-3 sm:p-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm sm:text-base">{case_.patientName}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">Age: {case_.age} • {case_.condition}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Service: {case_.requestedService}</p>
                      <p className="text-xs sm:text-sm text-green-600 font-medium">Estimated: PKR {case_.estimatedCost}</p>
                    </div>
                    <Badge className={case_.urgency === "urgent" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                      {case_.urgency}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => handleApproveCase(case_.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                      size="sm"
                    >
                      Approve
                    </Button>
                    <Button
                      onClick={() => handleRejectCase(case_.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-xs sm:text-sm"
                      size="sm"
                    >
                      Reject
                    </Button>
                    <Link href={`/dashboard/doctor/cases/${case_.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full text-xs sm:text-sm">
                        Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
          </CardContent>
        </Card>

        {/* Recommended Nurses */}
        <Card>
          <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg sm:text-xl">Recommended Nurses</CardTitle>
            <Link href="/dashboard/doctor/nurses">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm">View all</Button>
            </Link>
          </div>
          </CardHeader>
          <CardContent>

          <div className="space-y-3 sm:space-y-4">
            {doctorData.recommendedNurses.map((nurse) => (
              <div key={nurse.id} className="border rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm sm:text-base">{nurse.name}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">{nurse.department}</p>
                    <div className="flex items-center mt-1">
                      <span className="text-yellow-500">★</span>
                      <span className="ml-1 text-xs sm:text-sm font-medium">{nurse.rating}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-green-600 mt-1">{nurse.availability}</p>
                  </div>
                  <Button size="sm" className="w-full sm:w-auto text-xs sm:text-sm">
                    Recommend
                  </Button>
                </div>
              </div>
            ))}
          </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mt-6 sm:mt-8">
        <Link href="/dashboard/doctor/prescriptions">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">💊</div>
              <h3 className="font-semibold text-sm sm:text-base mb-1">Prescriptions</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Manage medications</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/doctor/consultations">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">🩺</div>
              <h3 className="font-semibold text-sm sm:text-base mb-1">Consultations</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Patient consultations</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/doctor/reports">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">📊</div>
              <h3 className="font-semibold text-sm sm:text-base mb-1">Reports</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Analytics & insights</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/doctor/schedule">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-4 sm:p-6 text-center">
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">📅</div>
              <h3 className="font-semibold text-sm sm:text-base mb-1">Schedule</h3>
              <p className="text-xs sm:text-sm text-muted-foreground">Manage availability</p>
            </CardContent>
          </Card>
        </Link>
      </div>
      </div>
    </div>
  );
}
