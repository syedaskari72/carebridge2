"use client";

import Link from "next/link";
import { useState } from "react";
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
import InstallButton from "@/components/InstallButton";
import { Menu, ChevronDown, User } from "lucide-react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { open: openDrawer } = useDrawer();
  const { data: session, status } = useSession();

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
          { href: "/dashboard/admin/users", label: "Users" },
          { href: "/dashboard/admin/reports", label: "Reports" },
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
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
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
            <InstallButton />
            <ThemeToggle />
            {!session ? (
              <>
                <Button asChild>
                  <Link href="/book">Book a Nurse</Link>
                </Button>
                <Button variant="ghost" asChild>
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
              </>
            ) : (
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
                    <DropdownMenuItem onClick={() => signOut()}>
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <div className="sm:hidden">
              <InstallButton />
            </div>
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={openDrawer}
            >
              <Menu className="h-6 w-6" />
            </Button>
          </div>
        </div>


      </div>
    </header>
  );
}
