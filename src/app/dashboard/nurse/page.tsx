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
  Heart,
  Pill,
  MessageSquare
} from "lucide-react";
import { createChatId } from "@/lib/chatUtils";
import { useNurseStatus } from "@/contexts/NurseStatusContext";
import PrescriptionManager from "@/components/PrescriptionManager";



export default function NurseDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isOnDuty, isAvailable, setIsOnDuty, setIsAvailable, refreshStatus } = useNurseStatus();
  // Removed nurseData state - now using realNurseData from API
  const [realNurseData, setRealNurseData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);

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
    loadSubscriptionStatus();

    return () => clearInterval(timer);
  }, [session, status, router]);

  const loadNurseDashboardData = async () => {
    try {
      const res = await fetch("/api/nurse/dashboard");
      if (res.ok) {
        const data = await res.json();
        setRealNurseData(data);
      } else {
        console.error("Failed to load nurse dashboard data");
      }
    } catch (e) {
      console.error("Error loading nurse dashboard:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadSubscriptionStatus = async () => {
    try {
      const res = await fetch("/api/subscriptions/status");
      if (res.ok) {
        const data = await res.json();
        setSubscriptionStatus(data);
      }
    } catch (e) {
      console.error("Error loading subscription:", e);
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
        // Refresh status in context to sync with mobile menu
        await refreshStatus();
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
        // Refresh status in context to sync with mobile menu
        await refreshStatus();
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

        {/* Subscription Alert */}
        {subscriptionStatus && !subscriptionStatus.hasSubscription && (
          <Card className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2 text-lg">
                    👑 Start Your Subscription to Accept Bookings
                  </h3>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3 sm:mb-0">
                    Subscribe to accept bookings and grow your practice. Start with a free 14-day trial!
                  </p>
                </div>
                <Link href="/dashboard/nurse/subscription" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto bg-yellow-600 hover:bg-yellow-700 text-white font-semibold">
                    🚀 View Plans & Subscribe
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {subscriptionStatus?.hasSubscription && subscriptionStatus.subscription.status === "PAUSED" && (
          <Card className="mb-6 border-red-500 bg-red-50 dark:bg-red-950">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                    ⚠️ Subscription Paused
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300">
                    You've reached your booking limit. Upgrade your plan to continue accepting bookings.
                  </p>
                </div>
                <Link href="/dashboard/nurse/subscription">
                  <Button size="sm" className="bg-red-600 hover:bg-red-700">
                    Upgrade Now
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

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

        {/* Subscription Booking Counter */}
        {subscriptionStatus?.hasSubscription && (
          <Card className={`mb-6 border-2 ${
            subscriptionStatus.subscription.status === "TRIAL" || subscriptionStatus.subscription.plan.isTrial
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
              : "border-primary"
          }`}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Booking Usage</h3>
                    <Badge variant="outline">{subscriptionStatus.subscription.plan.name}</Badge>
                    {(subscriptionStatus.subscription.status === "TRIAL" || subscriptionStatus.subscription.plan.isTrial) && (
                      <Badge className="bg-blue-500">Trial</Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Bookings Used:</span>
                      <span className="font-semibold">
                        {subscriptionStatus.subscription.bookingsUsed} / {subscriptionStatus.subscription.bookingLimit === -1 ? "∞" : subscriptionStatus.subscription.bookingLimit}
                      </span>
                    </div>
                    {subscriptionStatus.subscription.bookingLimit !== -1 && (
                      <>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full ${
                              (subscriptionStatus.subscription.bookingsUsed / subscriptionStatus.subscription.bookingLimit) >= 0.9
                                ? "bg-red-500"
                                : (subscriptionStatus.subscription.bookingsUsed / subscriptionStatus.subscription.bookingLimit) >= 0.7
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            style={{
                              width: `${Math.min((subscriptionStatus.subscription.bookingsUsed / subscriptionStatus.subscription.bookingLimit) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Remaining:</span>
                          <span className="font-semibold text-primary">
                            {subscriptionStatus.subscription.bookingLimit - subscriptionStatus.subscription.bookingsUsed} bookings left
                          </span>
                        </div>
                      </>
                    )}
                    {(subscriptionStatus.subscription.status === "TRIAL" || subscriptionStatus.subscription.plan.isTrial) && subscriptionStatus.subscription.endDate && (
                      <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                        Trial ends: {new Date(subscriptionStatus.subscription.endDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 w-full sm:w-auto">
                  {(subscriptionStatus.subscription.status === "TRIAL" || subscriptionStatus.subscription.plan.isTrial) ? (
                    <Link href="/dashboard/nurse/subscription" className="w-full sm:w-auto">
                      <Button size="sm" className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
                        Upgrade Plan
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/dashboard/nurse/subscription" className="w-full sm:w-auto">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        Manage Plan
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="h-full">
            <CardContent className="p-4 sm:p-5 text-center flex flex-col items-center justify-center min-h-[110px]">
              <Users className="h-7 w-7 sm:h-8 sm:w-8 mb-2 text-primary" />
              <p className="text-xl sm:text-2xl font-bold">{realNurseData?.stats?.totalActivePatients || 0}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Active Patients</p>
            </CardContent>
          </Card>
          <Card className="h-full">
            <CardContent className="p-4 sm:p-5 text-center flex flex-col items-center justify-center min-h-[110px]">
              <CheckCircle className="h-7 w-7 sm:h-8 sm:w-8 mb-2 text-green-500" />
              <p className="text-xl sm:text-2xl font-bold">{realNurseData?.stats?.completedToday || 0}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Completed Today</p>
            </CardContent>
          </Card>
          <Card className="h-full">
            <CardContent className="p-4 sm:p-5 text-center flex flex-col items-center justify-center min-h-[110px]">
              <Heart className="h-7 w-7 sm:h-8 sm:w-8 mb-2 text-red-500" />
              <p className="text-xl sm:text-2xl font-bold">{realNurseData?.stats?.rating || 0}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Rating</p>
            </CardContent>
          </Card>
          <Card className="h-full">
            <CardContent className="p-4 sm:p-5 text-center flex flex-col items-center justify-center min-h-[110px]">
              <TrendingUp className="h-7 w-7 sm:h-8 sm:w-8 mb-2 text-blue-500" />
              <p className="text-xl sm:text-2xl font-bold">PKR {realNurseData?.todayStats?.earnings || 0}</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">Today's Earnings</p>
            </CardContent>
          </Card>
        </div>

      </div>



      {/* Assigned Patients */}
      <Card className="mb-6 sm:mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg sm:text-xl">Today's Assignments</CardTitle>
            <Link href="/dashboard/nurse/assignments">
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">View All</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-2">⏳</div>
            <p>Loading assignments...</p>
          </div>
        ) : !realNurseData || realNurseData.todaysAppointments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-4xl mb-2">📋</div>
            <p>No assignments for today</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {realNurseData.todaysAppointments.map((patient: any) => (
              <div key={patient.id} className="border rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base sm:text-lg">{patient.name}</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">{patient.condition}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">📍 {patient.address}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">🕐 {new Date(patient.nextVisit).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    {patient.phone && (
                      <p className="text-xs sm:text-sm text-muted-foreground">📞 {patient.phone}</p>
                    )}
                  </div>
                  <div className="flex sm:flex-col gap-2">
                    <Badge className={`text-xs ${
                      patient.priority === "EMERGENCY"
                        ? "bg-red-100 text-red-800"
                        : patient.priority === "URGENT"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}>
                      {patient.priority.toLowerCase()}
                    </Badge>
                    <Badge className={`text-xs ${
                      patient.status === "CONFIRMED"
                        ? "bg-blue-100 text-blue-800"
                        : patient.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {patient.status.toLowerCase()}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 sm:flex gap-2">
                  <Button className="col-span-2 sm:flex-1 text-xs sm:text-sm">
                    Start Treatment
                  </Button>
                  <Button 
                    variant="outline" 
                    className="col-span-2 sm:flex-1 text-xs sm:text-sm"
                    onClick={() => setSelectedPatient(patient)}
                  >
                    View Details
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      if (!patient.patientId) {
                        console.error('Patient ID missing:', patient);
                        alert('Unable to start chat: Patient ID not found');
                        return;
                      }
                      router.push(`/chat/${createChatId(session.user.id, patient.patientId)}`);
                    }}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.location.href = `tel:${patient.phone}`}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        </CardContent>
      </Card>

      {/* Prescription Management */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mb-6 sm:mb-8">
        <PrescriptionManager />
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 mb-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <Link href="/dashboard/nurse/treatments">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 sm:p-5 text-center flex flex-col items-center justify-center h-full min-h-[120px]">
              <div className="text-3xl sm:text-4xl mb-2">📝</div>
              <h3 className="font-semibold text-sm sm:text-base mb-1">Treatment Logs</h3>
              <p className="text-xs text-muted-foreground">Update records</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/nurse/schedule">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 sm:p-5 text-center flex flex-col items-center justify-center h-full min-h-[120px]">
              <div className="text-3xl sm:text-4xl mb-2">📅</div>
              <h3 className="font-semibold text-sm sm:text-base mb-1">My Schedule</h3>
              <p className="text-xs text-muted-foreground">View availability</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/nurse/safety">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 sm:p-5 text-center flex flex-col items-center justify-center h-full min-h-[120px]">
            <div className="text-3xl sm:text-4xl mb-2">🛡️</div>
              <h3 className="font-semibold text-sm sm:text-base mb-1">Safety Center</h3>
              <p className="text-xs text-muted-foreground">Emergency protocols</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/nurse/earnings">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 sm:p-5 text-center flex flex-col items-center justify-center h-full min-h-[120px]">
              <div className="text-3xl sm:text-4xl mb-2">💰</div>
              <h3 className="font-semibold text-sm sm:text-base mb-1">Earnings</h3>
              <p className="text-xs text-muted-foreground">Track payments</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Link href="/dashboard/nurse/subscription" className="block mt-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-primary">
          <CardContent className="p-5 sm:p-6 text-center">
            <div className="text-4xl mb-2">👑</div>
            <h3 className="font-semibold text-base sm:text-lg mb-1">Subscription</h3>
            <p className="text-sm text-muted-foreground">Manage your plan</p>
          </CardContent>
        </Card>
      </Link>
      </div>

      {selectedPatient && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPatient(null)}>
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>Patient Details</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedPatient(null)}>X</Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{selectedPatient.name}</h3>
                <div className="grid gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Condition</p>
                    <p className="font-medium">{selectedPatient.condition}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">{selectedPatient.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedPatient.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Appointment Time</p>
                    <p className="font-medium">{new Date(selectedPatient.nextVisit).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Priority</p>
                    <Badge className={selectedPatient.priority === "EMERGENCY" ? "bg-red-500" : selectedPatient.priority === "URGENT" ? "bg-yellow-500" : "bg-green-500"}>
                      {selectedPatient.priority}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge>{selectedPatient.status}</Badge>
                  </div>
                </div>
              </div>
              <div className="space-y-2 pt-4">
                <div className="flex gap-2">
                  <Button className="flex-1">Start Treatment</Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => {
                      if (!selectedPatient.patientId) {
                        console.error('Patient ID missing:', selectedPatient);
                        alert('Unable to start chat: Patient ID not found');
                        return;
                      }
                      router.push(`/chat/${createChatId(session.user.id, selectedPatient.patientId)}`);
                    }}
                  >
                    Chat
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = `tel:${selectedPatient.phone}`}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => router.push(`/dashboard/patient/records?patientId=${selectedPatient.patientId}`)}
                >
                  View Medical Records
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
