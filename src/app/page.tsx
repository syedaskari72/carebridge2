"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  const router = useRouter();
  const { status } = useSession();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    
    if (isMobile && status === "unauthenticated") {
      const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
      
      if (!hasSeenOnboarding) {
        router.replace("/onboarding");
      } else {
        router.replace("/welcome");
      }
      return;
    }
    
    setChecking(false);
  }, [status, router]);

  if (checking || (typeof window !== "undefined" && window.innerWidth < 768 && status === "unauthenticated")) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Hero Section */}
        <div className="text-center py-8 sm:py-12">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-foreground mb-4 sm:mb-6">
            On-Demand Healthcare
            <span className="block text-primary">At Your Doorstep</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
            Request qualified nurses or lab attendants instantly. Get AI-powered medical guidance 24/7.
          </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="text-lg px-8 py-3">
            <Link href="/nurses">Book a Nurse Now</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-8 py-3">
            <Link href="/assistant">Chat with AI Assistant</Link>
          </Button>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-4xl mb-4">👩‍⚕️</div>
            <CardTitle className="mb-2">Qualified Nurses</CardTitle>
            <CardDescription>Licensed nurses for home care, medication management, and health monitoring.</CardDescription>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-4xl mb-4">🧪</div>
            <CardTitle className="mb-2">Lab Services</CardTitle>
            <CardDescription>Blood tests, sample collection, and diagnostic services at your home.</CardDescription>
          </CardContent>
        </Card>
        <Card className="text-center">
          <CardContent className="pt-6">
            <div className="text-4xl mb-4">🤖</div>
            <CardTitle className="mb-2">AI Assistant</CardTitle>
            <CardDescription>24/7 medical guidance and health questions answered by AI.</CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* How It Works */}
      <div className="py-12">
        <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
            <h3 className="font-semibold mb-2">Book Service</h3>
            <p className="text-slate-600">Choose your service and preferred time slot</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
            <h3 className="font-semibold mb-2">Get Matched</h3>
            <p className="text-slate-600">We match you with a qualified professional</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
            <h3 className="font-semibold mb-2">Receive Care</h3>
            <p className="text-slate-600">Professional arrives at your location</p>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
