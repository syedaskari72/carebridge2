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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome, Dr. {session.user.name}
        </h1>
        <p className="text-slate-600">Review cases and manage patient care</p>
      </div>

      {/* On-Call Status */}
      <div className="card mb-8 bg-blue-50 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-blue-900">Emergency On-Call Status</h3>
            <p className="text-sm text-blue-700">
              {isOnCall ? "You are available for emergency cases" : "You are not available for emergencies"}
            </p>
          </div>
          <button
            onClick={toggleOnCall}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              isOnCall 
                ? "bg-red-600 hover:bg-red-700 text-white" 
                : "bg-green-600 hover:bg-green-700 text-white"
            }`}
          >
            {isOnCall ? "Go Off-Call" : "Go On-Call"}
          </button>
        </div>
      </div>

      {/* Emergency Cases Alert */}
      {doctorData.emergencyCases.length > 0 && (
        <div className="card mb-8 bg-red-50 border-red-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-red-900">🚨 Emergency Cases</h2>
            <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              {doctorData.emergencyCases.length} Active
            </span>
          </div>
          
          <div className="space-y-3">
            {doctorData.emergencyCases.map((emergency) => (
              <div key={emergency.id} className="bg-white border border-red-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-red-900">{emergency.type} Emergency</h3>
                    <p className="text-sm text-red-700">Patient: {emergency.patientName}</p>
                    <p className="text-sm text-red-600">📍 {emergency.location}</p>
                    <p className="text-sm text-red-500">⏰ {emergency.timeAgo}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium">
                      Accept Case
                    </button>
                    <button className="border border-red-600 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg">
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="card text-center">
          <div className="text-2xl font-bold text-cyan-600">{doctorData.todayStats.totalCases}</div>
          <p className="text-sm text-slate-600">Total Cases</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-green-600">{doctorData.todayStats.approved}</div>
          <p className="text-sm text-slate-600">Approved</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-orange-600">{doctorData.todayStats.pending}</div>
          <p className="text-sm text-slate-600">Pending</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-red-600">{doctorData.todayStats.emergencies}</div>
          <p className="text-sm text-slate-600">Emergencies</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-purple-600">₹{doctorData.todayStats.earnings}</div>
          <p className="text-sm text-slate-600">Earnings</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Cases for Approval */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Cases Pending Approval</h2>
            <Link href="/dashboard/doctor/cases" className="text-cyan-600 hover:text-cyan-700">
              View all cases
            </Link>
          </div>

          {doctorData.pendingCases.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <div className="text-4xl mb-2">✅</div>
              <p>No pending cases</p>
            </div>
          ) : (
            <div className="space-y-4">
              {doctorData.pendingCases.map((case_) => (
                <div key={case_.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{case_.patientName}</h3>
                      <p className="text-sm text-slate-600">Age: {case_.age} • {case_.condition}</p>
                      <p className="text-sm text-slate-500">Service: {case_.requestedService}</p>
                      <p className="text-sm text-green-600 font-medium">Estimated: ₹{case_.estimatedCost}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      case_.urgency === "urgent" 
                        ? "bg-red-100 text-red-800"
                        : "bg-green-100 text-green-800"
                    }`}>
                      {case_.urgency}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApproveCase(case_.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectCase(case_.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg"
                    >
                      Reject
                    </button>
                    <Link
                      href={`/dashboard/doctor/cases/${case_.id}`}
                      className="px-4 py-2 border border-cyan-600 text-cyan-600 hover:bg-cyan-50 rounded-lg text-center"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Nurses */}
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Recommended Nurses</h2>
            <Link href="/dashboard/doctor/nurses" className="text-cyan-600 hover:text-cyan-700">
              View all nurses
            </Link>
          </div>

          <div className="space-y-4">
            {doctorData.recommendedNurses.map((nurse) => (
              <div key={nurse.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold">{nurse.name}</h3>
                    <p className="text-sm text-slate-600">{nurse.department}</p>
                    <div className="flex items-center mt-1">
                      <span className="text-yellow-500">★</span>
                      <span className="ml-1 text-sm font-medium">{nurse.rating}</span>
                    </div>
                    <p className="text-sm text-green-600 mt-1">{nurse.availability}</p>
                  </div>
                  <button className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm">
                    Recommend
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <Link href="/dashboard/doctor/prescriptions" className="card hover:shadow-lg transition-shadow text-center">
          <div className="text-4xl mb-3">💊</div>
          <h3 className="font-semibold mb-2">Prescriptions</h3>
          <p className="text-sm text-slate-600">Manage medications</p>
        </Link>

        <Link href="/dashboard/doctor/consultations" className="card hover:shadow-lg transition-shadow text-center">
          <div className="text-4xl mb-3">🩺</div>
          <h3 className="font-semibold mb-2">Consultations</h3>
          <p className="text-sm text-slate-600">Patient consultations</p>
        </Link>

        <Link href="/dashboard/doctor/reports" className="card hover:shadow-lg transition-shadow text-center">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="font-semibold mb-2">Reports</h3>
          <p className="text-sm text-slate-600">Analytics & insights</p>
        </Link>

        <Link href="/dashboard/doctor/schedule" className="card hover:shadow-lg transition-shadow text-center">
          <div className="text-4xl mb-3">📅</div>
          <h3 className="font-semibold mb-2">Schedule</h3>
          <p className="text-sm text-slate-600">Manage availability</p>
        </Link>
      </div>
    </div>
  );
}
