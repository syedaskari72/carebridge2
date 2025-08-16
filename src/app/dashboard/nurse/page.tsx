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
  MapPin,
  User,
  CheckCircle,
  AlertTriangle,
  Shield,
  Users,
  ClipboardList,
  TrendingUp,
  Phone,
  Navigation,
  Heart
} from "lucide-react";



export default function NurseDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  // Removed nurseData state - now using realNurseData from API
  const [realNurseData, setRealNurseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (session.user.userType !== "NURSE") {
      router.push(`/dashboard/${session.user.userType.toLowerCase()}`);
      return;
    }

    // Get location for safety tracking
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.error("Location error:", error)
      );
    }

    // Update time every minute
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);

    // Load real nurse dashboard data
    loadNurseDashboardData();

    return () => clearInterval(timer);
  }, [session, status, router]);

  const loadNurseDashboardData = async () => {
    try {
      const res = await fetch("/api/nurse/dashboard");
      if (res.ok) {
        const data = await res.json();
        setRealNurseData(data);
        // Set initial availability state from database
        if (data.nurse) {
          setIsOnDuty(data.nurse.isOnDuty || false);
          setIsAvailable(data.nurse.isAvailable || false);
        }
      } else {
        console.error("Failed to load nurse dashboard data");
      }
    } catch (e) {
      console.error("Error loading nurse dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      const response = await fetch("/api/nurse/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: location ? JSON.stringify(location) : null,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setIsOnDuty(true);
        setIsAvailable(true);
        alert("Checked in successfully! You are now available for bookings.");
        // Reload dashboard data to reflect changes
        loadNurseDashboardData();
      }
    } catch (error) {
      console.error("Check-in error:", error);
    }
  };

  const handleCheckOut = async () => {
    try {
      const response = await fetch("/api/nurse/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: location ? JSON.stringify(location) : null,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setIsOnDuty(false);
        setIsAvailable(false);
        alert("Checked out successfully! You are now unavailable for bookings.");
        // Reload dashboard data to reflect changes
        loadNurseDashboardData();
      }
    } catch (error) {
      console.error("Check-out error:", error);
    }
  };

  const handleSOS = async () => {
    if (!confirm("This will send an emergency alert to admin and authorities. Continue?")) {
      return;
    }

    try {
      const response = await fetch("/api/nurse/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: location ? JSON.stringify(location) : null,
          timestamp: new Date().toISOString(),
          description: "SOS alert triggered by nurse",
        }),
      });

      if (response.ok) {
        alert("Emergency alert sent! Help is on the way.");
      }
    } catch (error) {
      console.error("SOS error:", error);
      alert("Failed to send emergency alert. Please call 1122 directly.");
    }
  };

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!session || session.user.userType !== "NURSE") {
    return null;
  }

  return (
    <div className="w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Welcome, Nurse {session.user.name}
            </h1>
            <p className="text-muted-foreground">Your nursing dashboard</p>
          </div>
          <Link href="/dashboard/nurse/profile">
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile Settings
            </Button>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button
            onClick={isOnDuty ? handleCheckOut : handleCheckIn}
            className={`py-4 text-base font-semibold ${
              isOnDuty
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
            size="lg"
          >
            {isOnDuty ? "🏁 Check Out (Available)" : "▶️ Check In (Unavailable)"}
          </Button>
          <Button
            onClick={handleSOS}
            className="bg-red-600 hover:bg-red-700 py-4 text-base font-semibold"
            size="lg"
          >
            🚨 SOS Alert
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{realNurseData?.stats?.totalActivePatients || 0}</p>
              <p className="text-sm text-muted-foreground">Active Patients</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{realNurseData?.stats?.completedToday || 0}</p>
              <p className="text-sm text-muted-foreground">Completed Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Heart className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <p className="text-2xl font-bold">{realNurseData?.stats?.rating || 0}</p>
              <p className="text-sm text-muted-foreground">Rating</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">PKR {realNurseData?.todayStats?.earnings || 0}</p>
              <p className="text-sm text-muted-foreground">Today's Earnings</p>
            </CardContent>
          </Card>
        </div>

        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-blue-900">Location Tracking</h3>
              <p className="text-sm text-blue-700">
                {location ? "Active" : "Disabled"}
              </p>
            </div>
            <div className="text-2xl">
              {location ? "📍" : "📍❌"}
            </div>
          </div>
        </div>

        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-red-900">Emergency</h3>
              <p className="text-sm text-red-700">SOS Panic Button</p>
            </div>
            <button
              onClick={handleSOS}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold"
            >
              🚨 SOS
            </button>
          </div>
        </div>
      </div>



      {/* Assigned Patients */}
      <div className="card mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Today's Assignments</h2>
          <Link href="/dashboard/nurse/assignments" className="text-cyan-600 hover:text-cyan-700">
            View all assignments
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-500">
            <div className="text-4xl mb-2">⏳</div>
            <p>Loading assignments...</p>
          </div>
        ) : !realNurseData || realNurseData.todaysAppointments.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <div className="text-4xl mb-2">📋</div>
            <p>No assignments for today</p>
          </div>
        ) : (
          <div className="space-y-4">
            {realNurseData.todaysAppointments.map((patient: any) => (
              <div key={patient.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{patient.name}</h3>
                    <p className="text-slate-600">{patient.condition}</p>
                    <p className="text-sm text-slate-500">📍 {patient.address}</p>
                    <p className="text-sm text-slate-500">🕐 {new Date(patient.nextVisit).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    {patient.phone && (
                      <p className="text-sm text-slate-500">📞 {patient.phone}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      patient.priority === "EMERGENCY"
                        ? "bg-red-100 text-red-800"
                        : patient.priority === "URGENT"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}>
                      {patient.priority.toLowerCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      patient.status === "CONFIRMED"
                        ? "bg-blue-100 text-blue-800"
                        : patient.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {patient.status.toLowerCase()}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-4 rounded-lg">
                    Start Treatment
                  </button>
                  <button className="flex-1 border border-cyan-600 text-cyan-600 hover:bg-cyan-50 py-2 px-4 rounded-lg">
                    View Details
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-slate-600 hover:bg-gray-50 rounded-lg">
                    📞
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-slate-600 hover:bg-gray-50 rounded-lg">
                    🗺️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/dashboard/nurse/treatments" className="card hover:shadow-lg transition-shadow text-center">
          <div className="text-4xl mb-3">📝</div>
          <h3 className="font-semibold mb-2">Treatment Logs</h3>
          <p className="text-sm text-slate-600">Update patient records</p>
        </Link>

        <Link href="/dashboard/nurse/schedule" className="card hover:shadow-lg transition-shadow text-center">
          <div className="text-4xl mb-3">📅</div>
          <h3 className="font-semibold mb-2">My Schedule</h3>
          <p className="text-sm text-slate-600">View availability</p>
        </Link>

        <Link href="/dashboard/nurse/safety" className="card hover:shadow-lg transition-shadow text-center">
          <div className="text-4xl mb-3">🛡️</div>
          <h3 className="font-semibold mb-2">Safety Center</h3>
          <p className="text-sm text-muted-foreground">Emergency protocols & contacts</p>
        </Link>

        <Link href="/dashboard/nurse/earnings" className="card hover:shadow-lg transition-shadow text-center">
          <div className="text-4xl mb-3">💰</div>
          <h3 className="font-semibold mb-2">Earnings</h3>
          <p className="text-sm text-muted-foreground">Track payments</p>
        </Link>
      </div>
    </div>
  );
}
