"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, MapPin, User, FileText } from "lucide-react";
import ArrivalTimer from "@/components/ArrivalTimer";
import ServiceTimer from "@/components/ServiceTimer";

interface Booking {
  id: string;
  serviceType: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  address: string;
  notes?: string;
  nurseArrivedAt?: string;
  arrivalConfirmedAt?: string;
  serviceStartedAt?: string;
  serviceEndedAt?: string;
  actualDuration?: number;
  actualCost?: number;
  nurse?: {
    hourlyRate: number;
    user: {
      name: string;
      phone?: string;
    };
  };
  patient?: {
    user: {
      name: string;
      phone?: string;
    };
  };
}

export default function BookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  useEffect(() => {
    if (status === "loading" || !resolvedParams) return;
    
    if (!session) {
      router.push("/auth/signin");
      return;
    }

    loadBooking();
  }, [session, status, router, resolvedParams]);

  const loadBooking = async () => {
    if (!resolvedParams) return;
    
    try {
      const response = await fetch(`/api/bookings/${resolvedParams.id}`);
      if (response.ok) {
        const data = await response.json();
        setBooking(data);
      } else {
        console.error("Failed to load booking");
        router.push("/bookings");
      }
    } catch (error) {
      console.error("Error loading booking:", error);
      router.push("/bookings");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      case "CONFIRMED": return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS": return "bg-green-100 text-green-800";
      case "COMPLETED": return "bg-gray-100 text-gray-800";
      case "CANCELLED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-2">⏳</div>
          <p>Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!session || !booking) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Booking Details</h1>
            <p className="text-muted-foreground">Booking ID: {booking.id}</p>
          </div>
          <Badge className={getStatusColor(booking.status)}>
            {booking.status}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booking Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Booking Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {new Date(booking.appointmentDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground">{booking.appointmentTime}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Service Location</p>
                  <p className="text-sm text-muted-foreground">{booking.address}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Service Type</p>
                  <p className="text-sm text-muted-foreground">{booking.serviceType}</p>
                </div>
              </div>

              {booking.notes && (
                <div>
                  <p className="font-medium mb-1">Notes</p>
                  <p className="text-sm text-muted-foreground">{booking.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {booking.nurse && (
                <div>
                  <p className="font-medium">Nurse</p>
                  <p className="text-sm text-muted-foreground">{booking.nurse.user.name}</p>
                  {booking.nurse.user.phone && (
                    <p className="text-sm text-muted-foreground">{booking.nurse.user.phone}</p>
                  )}
                </div>
              )}

              {booking.patient && session.user.userType === "NURSE" && (
                <div>
                  <p className="font-medium">Patient</p>
                  <p className="text-sm text-muted-foreground">{booking.patient.user.name}</p>
                  {booking.patient.user.phone && (
                    <p className="text-sm text-muted-foreground">{booking.patient.user.phone}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Timers */}
        <div className="space-y-6">
          {/* Arrival Timer */}
          <ArrivalTimer
            booking={booking}
            userType={session.user.userType as "NURSE" | "PATIENT"}
            onArrivalMarked={loadBooking}
            onArrivalConfirmed={loadBooking}
          />

          {/* Service Timer */}
          <ServiceTimer
            booking={booking}
            userType={session.user.userType as "NURSE" | "PATIENT"}
            onServiceStarted={loadBooking}
            onServiceEnded={loadBooking}
          />
        </div>
      </div>
    </div>
  );
}
