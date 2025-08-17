"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share, Plus } from "lucide-react";
import { Modal } from "@/components/ui/modal";

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
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Check if user has dismissed recently
    const dismissedTime = localStorage.getItem('pwa-install-dismissed');
    if (dismissedTime) {
      const dismissedDate = new Date(dismissedTime);
      const now = new Date();
      const daysSinceDismissed = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceDismissed < 1) {
        return;
      }
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('🎯 InstallButton: beforeinstallprompt event fired', {
        platforms: (e as BeforeInstallPromptEvent).platforms,
        userAgent: navigator.userAgent
      });
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      setShowButton(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('PWA installed successfully');
      setIsInstalled(true);
      setShowButton(false);
      setDeferredPrompt(null);
      localStorage.removeItem('pwa-install-dismissed');
    };

    // Check device and browser capabilities
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent);
    const isEdge = /Edg/.test(navigator.userAgent);
    const isMobile = isIOS || isAndroid;

    // Show button for supported browsers
    if (isMobile && (isIOS || isChrome || isEdge)) {
      setShowButton(true);
      if (isIOS) {
        setIsInstallable(true); // iOS PWAs are always "installable" via Share menu
      }
    }

    // Don't show button until we know if beforeinstallprompt will fire
    // For Android, wait for the event or timeout
    if (isAndroid && (isChrome || isEdge)) {
      const androidTimer = setTimeout(() => {
        if (!deferredPrompt) {
          console.log('⏰ No beforeinstallprompt after 5 seconds, showing fallback');
          setIsInstallable(true);
        }
      }, 5000);
      
      return () => {
        clearTimeout(androidTimer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const handleInstallClick = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    console.log('🚀 Install button clicked', {
      hasDeferredPrompt: !!deferredPrompt,
      isIOS,
      isInstallable,
      userAgent: navigator.userAgent
    });
    
    if (deferredPrompt && !isIOS) {
      try {
        console.log('✅ Using native install prompt');
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        console.log('📊 Install prompt outcome:', outcome);
        if (outcome === 'accepted') {
          setShowButton(false);
        }
        
        setDeferredPrompt(null);
      } catch (error) {
        console.error('❌ Install prompt failed:', error);
        // Fallback to manual instructions if native prompt fails
        showManualInstructions();
      }
    } else if (isIOS) {
      console.log('📱 Showing iOS install modal');
      setShowIOSModal(true);
    } else {
      console.log('🔄 Using fallback manual instructions');
      showManualInstructions();
    }
  };

  const showManualInstructions = () => {
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    if (isAndroid) {
      alert('To install CareBridge:\n1. Tap the menu (⋮) in your browser\n2. Tap "Add to Home screen"\n3. Tap "Add" to install');
    } else {
      alert('To install CareBridge:\n1. Look for the install icon in your browser address bar\n2. Click it to install the app');
    }
  };

  // Only show button if app is installable and not already installed
  if (isInstalled || !showButton || !isInstallable) {
    return null;
  }

  return (
    <>
      <Button
        onClick={handleInstallClick}
        size="sm"
        variant="outline"
        className="flex items-center gap-2 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950 border-cyan-200 dark:border-cyan-800 hover:from-cyan-100 hover:to-blue-100 dark:hover:from-cyan-900 dark:hover:to-blue-900"
      >
        <Download className="h-4 w-4" />
        <span className="hidden md:inline">Install App</span>
      </Button>

      {/* iOS Install Modal */}
      <Modal isOpen={showIOSModal} onClose={() => setShowIOSModal(false)}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">C</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold">Install CareBridge</h3>
              <p className="text-sm text-muted-foreground">Add to your home screen for easy access</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                1
              </div>
              <div className="flex items-center gap-2">
                <span>Tap the</span>
                <Share className="h-5 w-5 text-blue-500" />
                <span><strong>Share</strong> button below</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                2
              </div>
              <div className="flex items-center gap-2">
                <span>Select</span>
                <Plus className="h-5 w-5 text-green-500" />
                <span><strong>"Add to Home Screen"</strong></span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                3
              </div>
              <span>Tap <strong>"Add"</strong> to install CareBridge</span>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t">
            <Button 
              onClick={() => setShowIOSModal(false)}
              className="w-full"
            >
              Got it!
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
