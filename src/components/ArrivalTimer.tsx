"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, CheckCircle, AlertTriangle } from "lucide-react";

interface ArrivalTimerProps {
  booking: {
    id: string;
    nurseArrivedAt?: string;
    arrivalConfirmedAt?: string;
    nurse?: {
      user: {
        name: string;
      };
    };
  };
  userType: "NURSE" | "PATIENT";
  onArrivalMarked?: () => void;
  onArrivalConfirmed?: () => void;
}

export default function ArrivalTimer({ 
  booking, 
  userType, 
  onArrivalMarked, 
  onArrivalConfirmed 
}: ArrivalTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (booking.nurseArrivedAt && !booking.arrivalConfirmedAt) {
      const arrivalTime = new Date(booking.nurseArrivedAt);
      const fiveMinutesLater = new Date(arrivalTime.getTime() + 5 * 60 * 1000);
      
      const timer = setInterval(() => {
        const now = new Date();
        const remaining = Math.max(0, fiveMinutesLater.getTime() - now.getTime());
        setTimeLeft(remaining);
        
        if (remaining === 0) {
          clearInterval(timer);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [booking.nurseArrivedAt, booking.arrivalConfirmedAt]);

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMarkArrival = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bookings/${booking.id}/arrival`, {
        method: "POST",
      });

      if (response.ok) {
        onArrivalMarked?.();
      } else {
        const error = await response.json();
        alert(`Failed to mark arrival: ${error.error}`);
      }
    } catch (error) {
      console.error("Error marking arrival:", error);
      alert("Failed to mark arrival. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmArrival = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bookings/${booking.id}/arrival`, {
        method: "PATCH",
      });

      if (response.ok) {
        onArrivalConfirmed?.();
      } else {
        const error = await response.json();
        alert(`Failed to confirm arrival: ${error.error}`);
      }
    } catch (error) {
      console.error("Error confirming arrival:", error);
      alert("Failed to confirm arrival. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // If arrival is already confirmed, show success state
  if (booking.arrivalConfirmedAt) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            Arrival Confirmed
          </CardTitle>
          <CardDescription>
            Nurse arrival has been confirmed by the patient
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-green-600">
            Confirmed at {new Date(booking.arrivalConfirmedAt).toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>
    );
  }

  // If nurse has arrived but not confirmed yet
  if (booking.nurseArrivedAt) {
    const isExpired = timeLeft === 0;
    
    return (
      <Card className={`border-2 ${isExpired ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${isExpired ? 'text-red-700' : 'text-yellow-700'}`}>
            <Clock className="h-5 w-5" />
            {isExpired ? 'Confirmation Expired' : 'Waiting for Confirmation'}
          </CardTitle>
          <CardDescription>
            {userType === "PATIENT" 
              ? "Please confirm that the nurse has arrived"
              : "Waiting for patient to confirm your arrival"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Time remaining:</span>
            <Badge variant={isExpired ? "destructive" : "secondary"} className="text-lg px-3 py-1">
              {isExpired ? "EXPIRED" : formatTime(timeLeft)}
            </Badge>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Nurse arrived at: {new Date(booking.nurseArrivedAt).toLocaleTimeString()}
          </div>

          {userType === "PATIENT" && !isExpired && (
            <Button 
              onClick={handleConfirmArrival}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? "Confirming..." : "Confirm Nurse Arrival"}
            </Button>
          )}

          {isExpired && (
            <div className="text-center p-4 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600 mx-auto mb-2" />
              <p className="text-red-700 font-medium">Confirmation window expired</p>
              <p className="text-red-600 text-sm">Please contact support for assistance</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // If nurse hasn't arrived yet
  if (userType === "NURSE") {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <MapPin className="h-5 w-5" />
            Mark Your Arrival
          </CardTitle>
          <CardDescription>
            Click the button below when you arrive at the patient's location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleMarkArrival}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? "Marking Arrival..." : "I Have Arrived"}
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            The patient will have 5 minutes to confirm your arrival
          </p>
        </CardContent>
      </Card>
    );
  }

  // Patient waiting for nurse to arrive
  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Waiting for Nurse
        </CardTitle>
        <CardDescription>
          {booking.nurse?.user.name} is on the way to your location
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-4">
          <div className="text-2xl mb-2">🚗</div>
          <p className="text-muted-foreground">
            You will be notified when the nurse arrives
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
