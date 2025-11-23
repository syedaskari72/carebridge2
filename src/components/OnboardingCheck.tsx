"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export default function OnboardingCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSession();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    const isMobile = window.innerWidth < 768;
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    
    // First time mobile user - show onboarding
    if (isMobile && !hasSeenOnboarding && pathname === "/" && status === "unauthenticated") {
      router.replace("/onboarding");
      return;
    }
    
    // Mobile user who has seen onboarding but not logged in - show welcome
    if (isMobile && hasSeenOnboarding && pathname === "/" && status === "unauthenticated") {
      router.replace("/welcome");
      return;
    }
    
    setIsReady(true);
  }, [router, pathname, status]);

  if (!isReady) {
    return <div className="min-h-screen bg-background" />;
  }

  return <>{children}</>;
}
