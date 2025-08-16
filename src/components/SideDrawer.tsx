"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { X, User, Settings, LogOut, Home, Calendar, Users, MessageSquare, Shield, Activity } from "lucide-react";

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SideDrawer({ isOpen, onClose }: SideDrawerProps) {
  const { data: session, status } = useSession();

  // Debug session state
  console.log("[SideDrawer] Session status:", status, "Session:", session);

  const handleSignOut = async () => {
    console.log("[SideDrawer] Starting logout process...");
    try {
      // Close the drawer first
      onClose();

      // Clear any local storage or session storage
      localStorage.clear();
      sessionStorage.clear();

      // Sign out with NextAuth
      await signOut({
        callbackUrl: "/",
        redirect: false
      });

      // Force a complete page reload to clear all state
      window.location.href = "/";
    } catch (error) {
      console.error("[SideDrawer] Logout error:", error);
      // Fallback: force reload anyway
      window.location.href = "/";
    }
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
        { href: "/nurses", label: "Find Nurses", icon: Users },
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
          { href: "/nurses", label: "Find Nurses", icon: Users },
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
          className="fixed inset-0 bg-black/50 z-[70] md:hidden"
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-80 bg-background border-r border-border z-[80] transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <span className="text-xl font-bold text-foreground">CareBridge</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* User Info */}
          {session && (
            <div className="p-4 border-b border-border">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{session.user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                  <p className="text-xs text-primary capitalize font-medium">
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
                    className="flex items-center space-x-3 px-3 py-3 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{item.label}</span>
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
                    href="/book"
                    onClick={onClose}
                    className="block px-3 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-center"
                  >
                    Book a Nurse
                  </Link>
                  <Link
                    href="/auth/emergency"
                    onClick={onClose}
                    className="block px-3 py-2 rounded-lg bg-red-600 text-white font-medium text-center"
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
                </div>
                <div className="space-y-1">
                  <button className="w-full px-3 py-2 rounded-lg bg-green-600 text-white font-medium text-center">
                    Check In
                  </button>
                  <button className="w-full px-3 py-2 rounded-lg bg-red-600 text-white font-medium text-center">
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
