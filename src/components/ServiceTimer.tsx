"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Square, Clock, DollarSign, CheckCircle } from "lucide-react";

interface ServiceTimerProps {
  booking: {
    id: string;
    serviceStartedAt?: string;
    serviceEndedAt?: string;
    actualDuration?: number;
    actualCost?: number;
    arrivalConfirmedAt?: string;
    nurse?: {
      hourlyRate: number;
      user: {
        name: string;
      };
    };
  };
  userType: "NURSE" | "PATIENT";
  onServiceStarted?: () => void;
  onServiceEnded?: () => void;
}

export default function ServiceTimer({ 
  booking, 
  userType, 
  onServiceStarted, 
  onServiceEnded 
}: ServiceTimerProps) {
  const [currentDuration, setCurrentDuration] = useState<number>(0);
  const [currentCost, setCurrentCost] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (booking.serviceStartedAt && !booking.serviceEndedAt) {
      const startTime = new Date(booking.serviceStartedAt);
      
      const timer = setInterval(() => {
        const now = new Date();
        const durationMs = now.getTime() - startTime.getTime();
        const durationMinutes = Math.ceil(durationMs / (1000 * 60));
        setCurrentDuration(durationMinutes);
        
        // Calculate current cost
        if (booking.nurse?.hourlyRate) {
          const cost = Math.round((booking.nurse.hourlyRate * durationMinutes) / 60);
          setCurrentCost(cost);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [booking.serviceStartedAt, booking.serviceEndedAt, booking.nurse?.hourlyRate]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const handleStartService = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bookings/${booking.id}/service`, {
        method: "POST",
      });

      if (response.ok) {
        onServiceStarted?.();
      } else {
        const error = await response.json();
        alert(`Failed to start service: ${error.error}`);
      }
    } catch (error) {
      console.error("Error starting service:", error);
      alert("Failed to start service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStopService = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bookings/${booking.id}/service`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" }),
      });

      if (response.ok) {
        onServiceEnded?.();
      } else {
        const error = await response.json();
        alert(`Failed to stop service: ${error.error}`);
      }
    } catch (error) {
      console.error("Error stopping service:", error);
      alert("Failed to stop service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // If service is completed
  if (booking.serviceEndedAt) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            Service Completed
          </CardTitle>
          <CardDescription>
            The healthcare service has been completed successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatDuration(booking.actualDuration || 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Duration</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                PKR {booking.actualCost || 0}
              </div>
              <div className="text-sm text-muted-foreground">Final Cost</div>
            </div>
          </div>
          
          <div className="text-sm text-green-600 text-center">
            Completed at {new Date(booking.serviceEndedAt).toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>
    );
  }

  // If service is in progress
  if (booking.serviceStartedAt) {
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Clock className="h-5 w-5" />
            Service in Progress
          </CardTitle>
          <CardDescription>
            Healthcare service is currently being provided
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatDuration(currentDuration)}
              </div>
              <div className="text-sm text-muted-foreground">Duration</div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                PKR {currentCost}
              </div>
              <div className="text-sm text-muted-foreground">Current Cost</div>
            </div>
          </div>

          <div className="text-sm text-blue-600 text-center">
            Started at {new Date(booking.serviceStartedAt).toLocaleTimeString()}
          </div>

          <div className="text-xs text-muted-foreground text-center">
            Rate: PKR {booking.nurse?.hourlyRate}/hour
          </div>

          <Button 
            onClick={handleStopService}
            disabled={loading}
            variant="destructive"
            className="w-full"
            size="lg"
          >
            <Square className="h-4 w-4 mr-2" />
            {loading ? "Stopping Service..." : "Stop Service"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            {userType === "NURSE" 
              ? "Click to end the service when treatment is complete"
              : "The nurse will end the service when treatment is complete"
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  // If arrival is confirmed but service not started
  if (booking.arrivalConfirmedAt && userType === "NURSE") {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <Play className="h-5 w-5" />
            Start Service
          </CardTitle>
          <CardDescription>
            Begin the healthcare service and start the timer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center p-3 bg-white rounded-lg">
            <div className="text-lg font-semibold text-green-600">
              PKR {booking.nurse?.hourlyRate}/hour
            </div>
            <div className="text-sm text-muted-foreground">Your Rate</div>
          </div>

          <Button 
            onClick={handleStartService}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            <Play className="h-4 w-4 mr-2" />
            {loading ? "Starting Service..." : "Start Service Timer"}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            The timer will track your service duration and calculate payment
          </p>
        </CardContent>
      </Card>
    );
  }

  // Waiting for arrival confirmation
  return (
    <Card className="border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Service Timer
        </CardTitle>
        <CardDescription>
          Service will begin after arrival is confirmed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-4">
          <div className="text-2xl mb-2">⏳</div>
          <p className="text-muted-foreground">
            Waiting for arrival confirmation to start service
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
