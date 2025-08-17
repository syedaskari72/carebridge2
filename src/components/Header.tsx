"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { useDrawer } from "@/components/DrawerProvider";
import NativePWAInstall from "@/components/NativePWAInstall";
import { Menu, ChevronDown, User } from "lucide-react";
import { useNurseStatus } from "@/contexts/NurseStatusContext";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { open: openDrawer } = useDrawer();
  const { data: session, status } = useSession();
  const { isOnDuty } = useNurseStatus();

  // Debug session state
  console.log("[Header] Session status:", status, "Session:", session);

  // Force re-render when session status changes
  useEffect(() => {
    console.log("[Header] Session status changed:", status);
  }, [status, session]);

  const handleSignOut = async () => {
    console.log("[Header] Starting logout process...");
    try {
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
      console.error("[Header] Logout error:", error);
      // Fallback: force reload anyway
      window.location.href = "/";
    }
  };

  const getNavigationItems = () => {
    if (!session) {
      return [
        { href: "/nurses", label: "Find Nurses" },
        { href: "/assistant", label: "AI Assistant" },
      ];
    }

    switch (session.user.userType) {
      case "PATIENT":
        return [
          { href: "/nurses", label: "Find Nurses" },
          { href: "/bookings", label: "My Bookings" },
          { href: "/assistant", label: "AI Assistant" },
        ];
      case "NURSE":
        return [
          { href: "/dashboard/nurse", label: "Dashboard" },
          { href: "/dashboard/nurse/assignments", label: "Assignments" },
          { href: "/dashboard/nurse/schedule", label: "Schedule" },
        ];
      case "DOCTOR":
        return [
          { href: "/dashboard/doctor", label: "Dashboard" },
          { href: "/dashboard/doctor/cases", label: "Cases" },
          { href: "/dashboard/doctor/consultations", label: "Consultations" },
        ];
      case "ADMIN":
        return [
          { href: "/dashboard/admin", label: "Dashboard" },
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <img
              src="/applogo.png"
              alt="CareBridge Logo"
              className="w-8 h-8 object-contain"
            />
            <span className="text-xl font-bold text-foreground">CareBridge</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-primary font-medium transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* CTA Button & User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <NativePWAInstall />
            <ThemeToggle />
            {status === "loading" ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : status === "authenticated" && session ? (
              <>
                {session.user.userType === "PATIENT" && (
                  <Button asChild>
                    <Link href="/book">Book a Nurse</Link>
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2">
                      <User className="h-4 w-4" />
                      <span>{session.user.name}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={
                        session.user.userType === "PATIENT" ? "/dashboard/patient" :
                        session.user.userType === "NURSE" ? "/dashboard/nurse" :
                        session.user.userType === "DOCTOR" ? "/dashboard/doctor" :
                        "/dashboard/admin"
                      }>Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut}>
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button asChild>
                  <Link href="/book">Book a Nurse</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            {/* Nurse status indicator for mobile */}
            {session?.user.userType === "NURSE" && (
              <div className="flex items-center space-x-1">
                <div className={`w-2 h-2 rounded-full ${isOnDuty ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  {isOnDuty ? 'On Duty' : 'Off Duty'}
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={openDrawer}
              className="relative"
            >
              <Menu className="h-6 w-6" />
              {/* Status indicator on menu button for nurses */}
              {session?.user.userType === "NURSE" && isOnDuty && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background" />
              )}
            </Button>
          </div>
        </div>


      </div>
    </header>
  );
}
