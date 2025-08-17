"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, Share, Plus, CheckCircle } from "lucide-react";
import { Modal } from "@/components/ui/modal";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function NativePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    
    if (isStandalone || isIOSStandalone) {
      setIsInstalled(true);
      return;
    }

    // Device detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    const supportsBrowsers = /Chrome|CriOS|Edge|EdgiOS/.test(navigator.userAgent);

    console.log('🔍 PWA Install Detection:', {
      isIOS,
      isAndroid,
      supportsBrowsers,
      userAgent: navigator.userAgent.substring(0, 100)
    });

    // Handle beforeinstallprompt for Android/Chrome/Edge
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('🎯 Native beforeinstallprompt event captured!', {
        platforms: (e as BeforeInstallPromptEvent).platforms,
        timestamp: new Date().toISOString()
      });
      e.preventDefault(); // Prevent default mini-infobar
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowButton(true);
    };

    // Handle successful installation
    const handleAppInstalled = () => {
      console.log('✅ PWA installed successfully');
      setIsInstalled(true);
      setShowButton(false);
      setDeferredPrompt(null);
    };

    // For iOS, always show the button (they don't support beforeinstallprompt)
    if (isIOS && supportsBrowsers) {
      setShowButton(true);
    }

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    console.log('🚀 Install clicked', {
      hasNativePrompt: !!deferredPrompt,
      isIOS,
      platforms: deferredPrompt?.platforms
    });

    if (deferredPrompt && !isIOS) {
      try {
        console.log('📱 Triggering native PWA install prompt...', {
          platforms: deferredPrompt.platforms,
          userAgent: navigator.userAgent.substring(0, 50)
        });
        
        // This should show the native "Install app?" dialog (NOT "Add to Home Screen")
        const promptResult = await deferredPrompt.prompt();
        console.log('📱 Prompt shown, result:', promptResult);
        
        const choiceResult = await deferredPrompt.userChoice;
        console.log('📊 User choice result:', choiceResult);
        
        if (choiceResult.outcome === 'accepted') {
          console.log('🎉 User accepted PWA installation');
          setShowButton(false);
        } else {
          console.log('❌ User dismissed PWA installation');
        }
        
        setDeferredPrompt(null);
      } catch (error) {
        console.error('❌ Native PWA install failed:', error);
        // Only show fallback if native really failed
        alert('PWA installation failed. Please try: Browser menu (⋮) → "Install app"');
      }
    } else if (isIOS) {
      console.log('📱 Showing iOS install instructions');
      setShowIOSModal(true);
    } else {
      // Don't show fallback on Android Chrome - they should have native prompt
      const isAndroidChrome = /Android.*Chrome/i.test(navigator.userAgent);
      if (isAndroidChrome) {
        console.log('🤖 Android Chrome detected but no native prompt - user likely dismissed or app already installable');
        alert('To install CareBridge: Look for the install icon in your browser address bar or try refreshing the page');
      } else {
        console.log('🔄 No native prompt available, showing instructions');
        alert('To install CareBridge:\n1. Look for the install icon (⬇️) in your browser address bar\n2. Or use browser menu: ⋮ → "Install app"');
      }
    }
  };

  // If already installed, show "App Already Installed" with disabled button
  if (isInstalled) {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gray-50 to-gray-50 dark:from-gray-950 dark:to-gray-950 border-gray-200 dark:border-gray-800 cursor-not-allowed"
        title="CareBridge is already installed"
      >
        <CheckCircle className="h-4 w-4 text-gray-500" />
        <span className="text-gray-500">App Already Installed</span>
      </Button>
    );
  }

  // Don't show if not ready
  if (!showButton) {
    return null;
  }

  return (
    <>
      <Button
        onClick={handleInstallClick}
        size="sm"
        variant="outline"
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900 dark:hover:to-emerald-900"
        title={deferredPrompt ? "Install CareBridge as native app" : "Install CareBridge"}
      >
        <Download className="h-4 w-4 text-green-600 dark:text-green-400" />
        <span className="text-green-700 dark:text-green-300">
          {deferredPrompt ? "Install as App" : "Install App"}
        </span>
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
                <span><strong>Share</strong> button in Safari</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                2
              </div>
              <div className="flex items-center gap-2">
                <span>Scroll and tap</span>
                <Plus className="h-5 w-5 text-green-500" />
                <span><strong>"Add to Home Screen"</strong></span>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                3
              </div>
              <span>Tap <strong>"Add"</strong> to install</span>
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
