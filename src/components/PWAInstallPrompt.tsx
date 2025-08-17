"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user has dismissed the prompt recently
    const dismissedTime = localStorage.getItem('pwa-install-dismissed');
    if (dismissedTime) {
      const dismissedDate = new Date(dismissedTime);
      const now = new Date();
      const daysSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);

      // Show again after 3 days
      if (daysSinceDismissed < 3) {
        return;
      }
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired in PWAInstallPrompt');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);

      // Only show full-screen prompt if InstallButton isn't already handling it
      setTimeout(() => {
        if (!isInstalled) {
          setShowPrompt(true);
        }
      }, 5000); // Delay to let header InstallButton show first
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem('pwa-install-dismissed');
    };

    // Only show prompt when we actually have the native install capability
    // Don't show for iOS or other browsers without beforeinstallprompt support

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (deferredPrompt && !isIOS) {
      try {
        console.log('Using native install prompt from PWAInstallPrompt');
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        console.log('Install prompt outcome:', outcome);
        if (outcome === 'accepted') {
          setShowPrompt(false);
        }

        setDeferredPrompt(null);
      } catch (error) {
        console.error('Install prompt failed:', error);
        // Don't show fallback alert for the main prompt - just dismiss
        setShowPrompt(false);
      }
    } else {
      // For iOS and fallback cases, don't show alert here - let InstallButton handle it
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDeferredPrompt(null);
    // Store dismissal time to avoid showing again for 3 days
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  // Don't show if already installed or not ready to show
  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">C</span>
              </div>
              <div>
                <CardTitle className="text-lg">Install CareBridge</CardTitle>
                <CardDescription className="text-sm">
                  Get the app for faster access
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            <Smartphone className="h-4 w-4" />
            <span>Works offline • Push notifications • App-like experience</span>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleInstallClick} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Install App
            </Button>
            <Button variant="outline" onClick={handleDismiss}>
              Not now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
