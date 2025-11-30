"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function WelcomePage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    // Redirect authenticated users to home
    if (status === "authenticated") {
      router.replace("/");
      return;
    }
    
    // Mark that user has seen onboarding
    localStorage.setItem("hasSeenOnboarding", "true");
  }, [status, router]);

  if (status === "loading") {
    return <div className="min-h-screen bg-background" />;
  }

  if (status === "authenticated") {
    return null;
  }

  return (
    <div className="h-[100dvh] w-screen fixed inset-0 bg-gradient-to-br from-cyan-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-hidden touch-none">
      <div className="h-full flex flex-col items-center justify-between p-6 py-8">
        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
          <div className="mb-6">
            <div className="w-36 h-36 sm:w-40 sm:h-40 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center shadow-2xl">
              <img
                src="/applogo.png"
                alt="CareBridge"
                className="w-24 h-24 sm:w-28 sm:h-28 object-contain"
              />
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold text-center mb-2 text-foreground">
            CareBridge
          </h1>
          
          <p className="text-center text-muted-foreground text-base sm:text-lg">
            Healthcare at your doorstep
          </p>
        </div>

        <div className="w-full max-w-md space-y-3 pb-safe">
          <Button
            onClick={() => router.push("/auth/signin")}
            size="lg"
            className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
          >
            Login
          </Button>
          
          <Button
            onClick={() => router.push("/auth/signup")}
            variant="outline"
            size="lg"
            className="w-full h-12 sm:h-14 text-base sm:text-lg font-semibold border-2"
          >
            Register Now
          </Button>
        </div>
      </div>
    </div>
  );
}
