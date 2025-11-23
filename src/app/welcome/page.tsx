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
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col items-center justify-between p-6 pt-12 pb-8">
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md">
        <div className="mb-8 relative">
          <div className="w-48 h-48 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center shadow-2xl">
            <img
              src="/applogo.png"
              alt="CareBridge"
              className="w-32 h-32 object-contain"
            />
          </div>
        </div>

        <h1 className="text-4xl font-bold text-center mb-3 text-foreground">
          CareBridge
        </h1>
        
        <p className="text-center text-muted-foreground text-lg mb-12">
          Healthcare at your doorstep
        </p>
      </div>

      <div className="w-full max-w-md space-y-4">
        <Button
          onClick={() => router.push("/auth/signin")}
          size="lg"
          className="w-full h-14 text-lg font-semibold bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
        >
          Login
        </Button>
        
        <Button
          onClick={() => router.push("/auth/signup")}
          variant="outline"
          size="lg"
          className="w-full h-14 text-lg font-semibold border-2"
        >
          Register Now
        </Button>
      </div>
    </div>
  );
}
