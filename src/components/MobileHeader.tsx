"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { Menu, ArrowLeft, Sun, Moon } from "lucide-react";
import { useDrawer } from "@/components/DrawerProvider";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import NotificationsDropdown from "@/components/NotificationsDropdown";

export default function MobileHeader() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { open: openDrawer } = useDrawer();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Hide header on welcome and onboarding
  if (pathname === "/welcome" || pathname === "/onboarding") {
    return null;
  }

  const showBackButton = () => {
    return pathname !== "/" && 
           !pathname.includes("/dashboard/nurse") && 
           !pathname.includes("/dashboard/doctor") && 
           !pathname.includes("/dashboard/patient") && 
           !pathname.includes("/dashboard/admin");
  };

  const handleBack = () => {
    if (pathname.includes("/auth/")) {
      router.replace("/welcome");
    } else {
      router.back();
    }
  };

  return (
    <header className={`md:hidden bg-gradient-to-b from-cyan-500 to-cyan-600 text-white pt-safe transition-all duration-300 rounded-b-3xl ${
      scrolled ? "shadow-none" : "shadow-lg"
    }`}>
      <div className={`px-4 transition-all duration-300 ${
        scrolled ? "py-2" : "pt-3 pb-4"
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {showBackButton() ? (
              <button
                onClick={handleBack}
                className="p-1.5 -ml-1.5 rounded-full active:bg-white/10 transition-colors"
              >
                <ArrowLeft className="h-5 w-5 stroke-[2.5]" />
              </button>
            ) : (
              <button
                onClick={openDrawer}
                className="p-1.5 -ml-1.5 rounded-full active:bg-white/10 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-1.5 rounded-full active:bg-white/10 transition-colors"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </button>
            )}
            {session && <NotificationsDropdown />}
          </div>
        </div>
      </div>

    </header>
  );
}
