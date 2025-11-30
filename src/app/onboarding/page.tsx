"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Heart, Shield, Clock } from "lucide-react";

const slides = [
  {
    icon: Heart,
    title: "Healthcare at Home",
    description: "Get professional nursing care in the comfort of your home, 24/7",
    color: "text-red-500",
  },
  {
    icon: Shield,
    title: "Verified Professionals",
    description: "All our nurses are certified, verified, and background-checked",
    color: "text-cyan-500",
  },
  {
    icon: Clock,
    title: "On-Demand Service",
    description: "Book instantly or schedule appointments at your convenience",
    color: "text-blue-500",
  },
];

export default function OnboardingPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
    if (hasSeenOnboarding) {
      router.replace("/welcome");
    }
  }, [router]);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem("hasSeenOnboarding", "true");
    router.replace("/welcome");
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex flex-col px-6 py-8">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className={`mb-6 ${slide.color}`}>
          <Icon className="h-24 w-24 stroke-[1.5]" />
        </div>
        
        <h1 className="text-2xl font-bold text-center mb-3 text-foreground">
          {slide.title}
        </h1>
        
        <p className="text-center text-muted-foreground text-base max-w-xs mb-8">
          {slide.description}
        </p>

        <div className="flex gap-2">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentSlide
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="space-y-3 pb-4">
        <Button
          onClick={handleNext}
          className="w-full h-12 text-sm font-semibold"
        >
          {currentSlide === slides.length - 1 ? "Get Started" : "Next"}
        </Button>
        
        {currentSlide < slides.length - 1 && (
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="w-full h-12 text-sm"
          >
            Skip
          </Button>
        )}
      </div>
    </div>
  );
}
