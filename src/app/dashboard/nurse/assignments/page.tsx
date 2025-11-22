"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, Phone, CheckCircle, XCircle, Filter } from "lucide-react";

interface Assignment {
  id: string;
  serviceType: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  address: string;
  notes?: string;
  patient: {
    user: {
      name: string;
      phone?: string;
    };
  };
}

export default function NurseAssignmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("ALL");

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session || session.user.userType !== "NURSE") {
      router.push("/auth/signin");
      return;
    }

    loadAssignments();
  }, [session, status, router]);

  const loadAssignments = async () => {
    try {
      const res = await fetch("/api/bookings?scope=nurse");
      if (res.ok) {
        const data = await res.json();
        // Sort by date descending (latest first)
        data.sort((a: Assignment, b: Assignment) => {
          const dateA = new Date(a.appointmentDate).getTime();
          const dateB = new Date(b.appointmentDate).getTime();
          return dateB - dateA;
        });
        setAssignments(data);
      }
    } catch (e) {
      console.error("Failed to load assignments:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (assignmentId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/bookings/${assignmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        await loadAssignments(); // Reload assignments
      } else {
        alert("Failed to update assignment status");
      }
    } catch (e) {
      console.error("Failed to update status:", e);
      alert("Failed to update assignment status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CONFIRMED": return "bg-green-100 text-green-800";
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "COMPLETED": return "bg-blue-100 text-blue-800";
      case "CANCELLED": return "bg-red-100 text-red-800";
      case "IN_PROGRESS": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getFilteredAssignments = () => {
    let filtered = [...assignments];

    // Status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(a => a.status === statusFilter);
    }

    // Date filter
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dateFilter === "TODAY") {
      filtered = filtered.filter(a => {
        const date = new Date(a.appointmentDate);
        date.setHours(0, 0, 0, 0);
        return date.getTime() === today.getTime();
      });
    } else if (dateFilter === "UPCOMING") {
      filtered = filtered.filter(a => {
        const date = new Date(a.appointmentDate);
        date.setHours(0, 0, 0, 0);
        return date.getTime() >= today.getTime();
      });
    } else if (dateFilter === "PAST") {
      filtered = filtered.filter(a => {
        const date = new Date(a.appointmentDate);
        date.setHours(0, 0, 0, 0);
        return date.getTime() < today.getTime();
      });
    }

    return filtered;
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading assignments...</p>
        </div>
      </div>
    );
  }

  const filteredAssignments = getFilteredAssignments();

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">My Assignments</h1>
        <p className="text-muted-foreground">Manage your patient assignments and appointments</p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Date</label>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All dates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Dates</SelectItem>
              <SelectItem value="TODAY">Today</SelectItem>
              <SelectItem value="UPCOMING">Upcoming</SelectItem>
              <SelectItem value="PAST">Past</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-4 text-sm text-muted-foreground">
        Showing {filteredAssignments.length} of {assignments.length} assignments
      </div>

      {filteredAssignments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-xl font-semibold mb-2">
              {assignments.length === 0 ? "No assignments yet" : "No assignments match your filters"}
            </h2>
            <p className="text-muted-foreground">
              {assignments.length === 0 
                ? "You don't have any patient assignments at the moment." 
                : "Try adjusting your filters to see more results."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="text-2xl">
                        {assignment.serviceType === "NURSE_VISIT" ? "👩‍⚕️" : "🧪"}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{assignment.patient.user.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {assignment.serviceType === "NURSE_VISIT" ? "Nurse Visit" : 
                           assignment.serviceType === "LAB_SERVICE" ? "Lab Service" : 
                           assignment.serviceType}
                        </p>
                      </div>
                      <Badge className={getStatusColor(assignment.status)}>
                        {assignment.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>
                          {new Date(assignment.appointmentDate).toLocaleDateString()} at {assignment.appointmentTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{assignment.address}</span>
                      </div>
                      {assignment.patient.user.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-muted-foreground" />
                          <span>{assignment.patient.user.phone}</span>
                        </div>
                      )}
                    </div>

                    {assignment.notes && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-sm"><strong>Notes:</strong> {assignment.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    {assignment.status === "PENDING" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(assignment.id, "CONFIRMED")}
                          className="flex-1"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleStatusUpdate(assignment.id, "CANCELLED")}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    {assignment.status === "CONFIRMED" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleStatusUpdate(assignment.id, "IN_PROGRESS")}
                          className="flex-1"
                        >
                          Start Visit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(assignment.id, "CANCELLED")}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}

                    {assignment.status === "IN_PROGRESS" && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(assignment.id, "COMPLETED")}
                        className="w-full"
                      >
                        Complete Visit
                      </Button>
                    )}

                    {(assignment.status === "COMPLETED" || assignment.status === "CANCELLED") && (
                      <div className="text-center text-sm text-muted-foreground">
                        {assignment.status === "COMPLETED" ? "✅ Completed" : "❌ Cancelled"}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
