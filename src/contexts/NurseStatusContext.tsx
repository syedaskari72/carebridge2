"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface NurseStatusContextType {
  isOnDuty: boolean;
  isAvailable: boolean;
  location: GeolocationPosition | null;
  setIsOnDuty: (status: boolean) => void;
  setIsAvailable: (status: boolean) => void;
  setLocation: (location: GeolocationPosition | null) => void;
  refreshStatus: () => Promise<void>;
}

const NurseStatusContext = createContext<NurseStatusContextType | undefined>(undefined);

interface NurseStatusProviderProps {
  children: ReactNode;
}

export function NurseStatusProvider({ children }: NurseStatusProviderProps) {
  const { data: session } = useSession();
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);

  const refreshStatus = async () => {
    if (session?.user.userType === "NURSE") {
      try {
        const response = await fetch("/api/nurse/dashboard");
        if (response.ok) {
          const data = await response.json();
          setIsOnDuty(data.isOnDuty || false);
          setIsAvailable(data.isAvailable || false);
        }
      } catch (error) {
        console.error("Failed to load nurse status:", error);
      }
    }
  };

  // Load initial status only once when nurse session is established
  useEffect(() => {
    if (session?.user.userType === "NURSE") {
      refreshStatus();
    }
  }, [session?.user.id]);

  // Get location when component mounts
  useEffect(() => {
    if (session?.user.userType === "NURSE" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setLocation(position),
        (error) => console.log("Location access denied:", error)
      );
    }
  }, [session]);

  const value = {
    isOnDuty,
    isAvailable,
    location,
    setIsOnDuty,
    setIsAvailable,
    setLocation,
    refreshStatus,
  };

  return (
    <NurseStatusContext.Provider value={value}>
      {children}
    </NurseStatusContext.Provider>
  );
}

export function useNurseStatus() {
  const context = useContext(NurseStatusContext);
  if (context === undefined) {
    throw new Error('useNurseStatus must be used within a NurseStatusProvider');
  }
  return context;
}
