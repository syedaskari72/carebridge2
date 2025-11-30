"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { X, User, Settings, LogOut, Home, Calendar, Users, MessageSquare, Shield, Activity, MapPin } from "lucide-react";
import NativePWAInstall from "@/components/NativePWAInstall";
import { useNurseStatus } from "@/contexts/NurseStatusContext";

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SideDrawer({ isOpen, onClose }: SideDrawerProps) {
  const { data: session, status } = useSession();
  const { isOnDuty, isAvailable, location, setIsOnDuty, setIsAvailable, refreshStatus } = useNurseStatus();
  const [loadingCheckIn, setLoadingCheckIn] = useState(false);

  // Debug session state
  console.log("[SideDrawer] Session status:", status, "Session:", session);

  // The nurse status is now managed by the context

  const handleCheckIn = async () => {
    setLoadingCheckIn(true);
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
        // Refresh the status from server to ensure consistency
        await refreshStatus();
        // Show success message
        alert("Checked in successfully! You are now available for bookings.");
      } else {
        alert("Failed to check in. Please try again.");
      }
    } catch (error) {
      console.error("Check-in error:", error);
      alert("Failed to check in. Please try again.");
    } finally {
      setLoadingCheckIn(false);
    }
  };

  const handleCheckOut = async () => {
    setLoadingCheckIn(true);
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
        // Refresh the status from server to ensure consistency
        await refreshStatus();
        // Show success message
        alert("Checked out successfully! You are now unavailable for bookings.");
      } else {
        alert("Failed to check out. Please try again.");
      }
    } catch (error) {
      console.error("Check-out error:", error);
      alert("Failed to check out. Please try again.");
    } finally {
      setLoadingCheckIn(false);
    }
  };

  const handleSOS = async () => {
    try {
      const response = await fetch("/api/nurse/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location: location ? JSON.stringify(location) : null,
          timestamp: new Date().toISOString(),
          urgency: "HIGH",
        }),
      });

      if (response.ok) {
        alert("🚨 SOS Alert sent! Emergency services and your contacts have been notified.");
      } else {
        alert("Failed to send SOS alert. Please call emergency services directly.");
      }
    } catch (error) {
      console.error("SOS error:", error);
      alert("Failed to send SOS alert. Please call emergency services directly.");
    }
  };

  const handleSignOut = async () => {
    if (!confirm("Are you sure you want to logout?")) {
      return;
    }
    
    console.log("[SideDrawer] Starting logout process...");
    onClose();
    
    try {
      await signOut({ redirect: false });
    } catch (error) {
      console.error("[SideDrawer] Logout error:", error);
    }
    
    // Always redirect to welcome
    setTimeout(() => {
      window.location.href = "/welcome";
    }, 100);
  };

  // Close drawer on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  const getNavigationItems = () => {
    if (!session) {
      return [
        { href: "/", label: "Home", icon: Home },
        { href: "/assistant", label: "AI Assistant", icon: MessageSquare },
        { href: "/auth/emergency", label: "Emergency", icon: Shield },
      ];
    }

    const commonItems = [
      { href: "/", label: "Home", icon: Home },
    ];

    switch (session.user.userType) {
      case "PATIENT":
        return [
          ...commonItems,
          { href: "/dashboard/patient", label: "My Dashboard", icon: Activity },
          { href: "/bookings", label: "My Bookings", icon: Calendar },
          { href: "/assistant", label: "AI Assistant", icon: MessageSquare },
          { href: "/dashboard/patient/records", label: "Medical Records", icon: User },
        ];
      case "NURSE":
        return [
          ...commonItems,
          { href: "/dashboard/nurse", label: "Nurse Dashboard", icon: Activity },
          { href: "/dashboard/nurse/assignments", label: "My Assignments", icon: Calendar },
          { href: "/dashboard/nurse/schedule", label: "My Schedule", icon: Calendar },
          { href: "/assistant", label: "AI Assistant", icon: MessageSquare },
          { href: "/dashboard/nurse/safety", label: "Safety Center", icon: Shield },
        ];
      case "DOCTOR":
        return [
          ...commonItems,
          { href: "/dashboard/doctor", label: "Doctor Dashboard", icon: Activity },
          { href: "/dashboard/doctor/cases", label: "Patient Cases", icon: Users },
          { href: "/dashboard/doctor/consultations", label: "Consultations", icon: MessageSquare },
          { href: "/dashboard/doctor/emergency", label: "Emergency Cases", icon: Shield },
        ];
      case "ADMIN":
        return [
          ...commonItems,
          { href: "/dashboard/admin", label: "Admin Dashboard", icon: Activity },
          { href: "/dashboard/admin/users", label: "Manage Users", icon: Users },
          { href: "/dashboard/admin/emergency", label: "Emergency Center", icon: Shield },
          { href: "/dashboard/admin/reports", label: "Reports", icon: Calendar },
        ];
      default:
        return commonItems;
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[70] md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-[85vw] max-w-sm bg-background border-r border-border z-[80] transform transition-transform duration-300 ease-out md:hidden shadow-2xl ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border bg-gradient-to-br from-cyan-500/10 to-blue-500/10 dark:from-cyan-500/20 dark:to-blue-500/20">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                <img src="/applogo.png" alt="C" className="w-7 h-7 object-contain" />
              </div>
              <span className="text-xl font-bold text-foreground">CareBridge</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-accent">
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* User Info */}
          {session && (
            <div className="p-5 border-b border-border bg-muted/30">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-md">
                  <User className="h-7 w-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate text-base">{session.user.name}</p>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{session.user.email}</p>
                  <p className="text-xs text-primary capitalize font-semibold mt-1 inline-block px-2 py-0.5 bg-primary/15 rounded-full">
                    {session.user.userType.toLowerCase()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center space-x-3 px-4 py-3.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/80 transition-all active:scale-98 active:bg-accent"
                  >
                    <Icon className="h-5 w-5 stroke-[2]" />
                    <span className="font-medium text-[15px]">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Quick Actions */}
            {session?.user.userType === "PATIENT" && (
              <div className="px-2 mt-6">
                <div className="px-3 py-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Quick Actions
                  </p>
                </div>
                <div className="space-y-1">
                  <Link
                    href="/nurses"
                    onClick={onClose}
                    className="block px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-center shadow-md active:scale-98 transition-transform"
                  >
                    Find Nurses
                  </Link>
                  <Link
                    href="/auth/emergency"
                    onClick={onClose}
                    className="block px-4 py-3 rounded-xl bg-red-600 text-white font-semibold text-center shadow-md active:scale-98 transition-transform"
                  >
                    🚨 Emergency
                  </Link>
                </div>
              </div>
            )}

            {/* Nurse Safety Quick Actions */}
            {session?.user.userType === "NURSE" && (
              <div className="px-2 mt-6">
                <div className="px-3 py-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Safety Actions
                  </p>
                  {/* Status indicator */}
                  <div className="flex items-center space-x-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${isOnDuty ? 'bg-green-500' : 'bg-gray-400'}`} />
                    <span className="text-xs text-muted-foreground">
                      {isOnDuty ? 'On Duty' : 'Off Duty'}
                    </span>
                    {location && (
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  {!isOnDuty ? (
                    <button
                      onClick={handleCheckIn}
                      disabled={loadingCheckIn}
                      className="w-full px-4 py-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold text-center transition-all shadow-md active:scale-98"
                    >
                      {loadingCheckIn ? "Checking In..." : "✓ Check In"}
                    </button>
                  ) : (
                    <button
                      onClick={handleCheckOut}
                      disabled={loadingCheckIn}
                      className="w-full px-4 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-semibold text-center transition-all shadow-md active:scale-98"
                    >
                      {loadingCheckIn ? "Checking Out..." : "⏹ Check Out"}
                    </button>
                  )}
                  <button
                    onClick={handleSOS}
                    className="w-full px-4 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-center transition-all shadow-md active:scale-98"
                  >
                    🚨 SOS Alert
                  </button>
                </div>
              </div>
            )}

            {/* Doctor Quick Actions */}
            {session?.user.userType === "DOCTOR" && (
              <div className="px-2 mt-6">
                <div className="px-3 py-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Quick Actions
                  </p>
                </div>
                <div className="space-y-1">
                  <button className="w-full px-3 py-2 rounded-lg bg-blue-600 text-white font-medium text-center">
                    Go On-Call
                  </button>
                  <Link
                    href="/dashboard/doctor/emergency"
                    onClick={onClose}
                    className="block px-3 py-2 rounded-lg bg-red-600 text-white font-medium text-center"
                  >
                    Emergency Cases
                  </Link>
                </div>
              </div>
            )}
          </nav>

          {/* Footer */}
          <div className="border-t border-border p-4">
            {/* PWA Install Button - Always show at top of footer */}
            <div className="mb-3">
              <NativePWAInstall />
            </div>
            
            {session ? (
              <div className="space-y-2">
                <Link
                  href="/profile"
                  onClick={onClose}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <Settings className="h-5 w-5" />
                  <span>Settings</span>
                </Link>
                
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors w-full"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/auth/signin"
                  onClick={onClose}
                  className="block px-3 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-center"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={onClose}
                  className="block px-3 py-2 rounded-lg border border-border text-foreground font-medium text-center"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
