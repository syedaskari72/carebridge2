"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, AlertCircle, Calendar } from "lucide-react";

interface BookingStatusIndicatorProps {
  bookingId: string;
  initialStatus: string;
  userType: "PATIENT" | "NURSE" | "DOCTOR" | "ADMIN";
  onStatusChange?: (newStatus: string) => void;
}

export default function BookingStatusIndicator({ 
  bookingId, 
  initialStatus, 
  userType,
  onStatusChange 
}: BookingStatusIndicatorProps) {
  const [status, setStatus] = useState(initialStatus);
  const [loading, setLoading] = useState(false);

  // Poll for status updates every 15 seconds for real-time updates
  useEffect(() => {
    if (userType !== "PATIENT") return; // Only patients need real-time updates
    
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/bookings/${bookingId}`);
        if (response.ok) {
          const booking = await response.json();
          if (booking.status !== status) {
            console.log(`📊 Booking status changed: ${status} → ${booking.status}`);
            setStatus(booking.status);
            onStatusChange?.(booking.status);
          }
        }
      } catch (error) {
        console.error("Failed to check booking status:", error);
      }
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [bookingId, status, userType, onStatusChange]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "PENDING":
        return {
          icon: <Clock className="h-4 w-4" />,
          text: "⏳ Waiting for Confirmation",
          variant: "secondary" as const,
          color: "text-yellow-600"
        };
      case "CONFIRMED":
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: "✅ Confirmed",
          variant: "default" as const,
          color: "text-blue-600"
        };
      case "IN_PROGRESS":
        return {
          icon: <AlertCircle className="h-4 w-4 animate-pulse" />,
          text: "🟢 Nurse On Site - Service Active",
          variant: "default" as const,
          color: "text-green-600"
        };
      case "COMPLETED":
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: "✅ Service Completed",
          variant: "outline" as const,
          color: "text-gray-600"
        };
      case "CANCELLED":
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          text: "❌ Cancelled",
          variant: "destructive" as const,
          color: "text-red-600"
        };
      default:
        return {
          icon: <Calendar className="h-4 w-4" />,
          text: status,
          variant: "secondary" as const,
          color: "text-gray-600"
        };
    }
  };

  const statusInfo = getStatusInfo(status);

  return (
    <div className="flex items-center gap-2">
      <Badge variant={statusInfo.variant} className="flex items-center gap-1">
        {statusInfo.icon}
        <span>{statusInfo.text}</span>
      </Badge>
      
      {status === "IN_PROGRESS" && userType === "PATIENT" && (
        <div className="text-xs text-green-600 animate-pulse">
          • Live
        </div>
      )}
    </div>
  );
}
