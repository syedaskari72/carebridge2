"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Calendar, MessageSquare, Menu, Activity, Shield, User, LayoutDashboard } from "lucide-react";
import { useDrawer } from "@/components/DrawerProvider";
import { useSession } from "next-auth/react";

export default function BottomNav() {
  const pathname = usePathname();
  const { open: openDrawer } = useDrawer();
  const { data: session } = useSession();

  // Hide navbar on auth pages, welcome, and onboarding
  if (pathname.includes("/auth/") || pathname === "/welcome" || pathname === "/onboarding") {
    return null;
  }

  const getNavItems = () => {
    if (!session) {
      return [
        { href: "/", icon: Home, label: "Home" },
        { href: "/nurses", icon: Users, label: "Nurses" },
        { href: "/assistant", icon: MessageSquare, label: "AI" },
      ];
    }

    switch (session.user.userType) {
      case "PATIENT":
        return [
          { href: "/", icon: Home, label: "Home" },
          { href: "/nurses", icon: Users, label: "Nurses" },
          { href: "/bookings", icon: Calendar, label: "Bookings" },
          { href: "/assistant", icon: MessageSquare, label: "AI" },
        ];
      case "NURSE":
        return [
          { href: "/dashboard/nurse", icon: LayoutDashboard, label: "Dashboard" },
          { href: "/dashboard/nurse/assignments", icon: Calendar, label: "Assignments" },
          { href: "/assistant", icon: MessageSquare, label: "AI" },
          { href: "/dashboard/nurse/safety", icon: Shield, label: "Safety" },
        ];
      case "DOCTOR":
        return [
          { href: "/dashboard/doctor", icon: LayoutDashboard, label: "Dashboard" },
          { href: "/dashboard/doctor/consultations", icon: Calendar, label: "Cases" },
          { href: "/assistant", icon: MessageSquare, label: "AI" },
        ];
      case "ADMIN":
        return [
          { href: "/dashboard/admin", icon: LayoutDashboard, label: "Dashboard" },
          { href: "/assistant", icon: MessageSquare, label: "AI" },
        ];
      default:
        return [
          { href: "/", icon: Home, label: "Home" },
          { href: "/nurses", icon: Users, label: "Nurses" },
          { href: "/assistant", icon: MessageSquare, label: "AI" },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 pb-safe">
      <div className="flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className={`h-6 w-6 mb-1 ${isActive ? "stroke-[2.5]" : "stroke-[2]"}`} />
              <span className={`text-[11px] ${isActive ? "font-semibold" : "font-medium"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
        <button
          onClick={openDrawer}
          className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground transition-colors"
        >
          <Menu className="h-6 w-6 mb-1 stroke-[2]" />
          <span className="text-[11px] font-medium">Menu</span>
        </button>
      </div>
    </nav>
  );
}
