"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user has dismissed recently
    const dismissedTime = localStorage.getItem('pwa-install-dismissed');
    if (dismissedTime) {
      const dismissedDate = new Date(dismissedTime);
      const now = new Date();
      const daysSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceDismissed < 1) { // Show again after 1 day for header button
        return;
      }
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowButton(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowButton(false);
      setDeferredPrompt(null);
      localStorage.removeItem('pwa-install-dismissed');
    };

    // For mobile devices, always show the button
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile && !isInstalled) {
      setShowButton(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Use native install prompt if available
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowButton(false);
      }
      
      setDeferredPrompt(null);
    } else {
      // For devices without beforeinstallprompt, show manual instructions
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroid = /Android/i.test(navigator.userAgent);
      
      if (isIOS) {
        alert('To install CareBridge:\n1. Tap the Share button (📤)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to install');
      } else if (isAndroid) {
        alert('To install CareBridge:\n1. Tap the menu (⋮) in your browser\n2. Tap "Add to Home screen"\n3. Tap "Add" to install');
      } else {
        alert('To install CareBridge:\n1. Look for the install icon in your browser address bar\n2. Click it to install the app');
      }
    }
  };

  // Don't show if already installed
  if (isInstalled || !showButton) {
    return null;
  }

  return (
    <Button
      onClick={handleInstallClick}
      size="sm"
      variant="outline"
      className="flex items-center gap-2 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950 border-cyan-200 dark:border-cyan-800 hover:from-cyan-100 hover:to-blue-100 dark:hover:from-cyan-900 dark:hover:to-blue-900"
    >
      <Download className="h-4 w-4" />
      <span className="hidden md:inline">Install App</span>
    </Button>
  );
}
