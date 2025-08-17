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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if app is already installed
    const checkInstallStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isIOSStandalone = (window.navigator as any).standalone === true;
      const isInWebApk = window.matchMedia('(display-mode: minimal-ui)').matches;
      
      return isStandalone || isIOSStandalone || isInWebApk;
    };

    if (checkInstallStatus()) {
      setIsInstalled(true);
      setIsLoading(false);
      return;
    }

    // Device and browser detection
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent);
    const isEdge = /Edg/.test(navigator.userAgent);
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isFirefox = /Firefox/.test(navigator.userAgent);
    const isMobile = isIOS || isAndroid;
    
    // More permissive support detection - show for most modern browsers
    const isSupported = 
      (isIOS && isSafari) || // iOS Safari
      (isAndroid && (isChrome || isEdge)) || // Android Chrome/Edge
      (!isMobile && (isChrome || isEdge || isFirefox)) || // Desktop browsers
      (isMobile && !isIOS); // Any mobile browser on Android

    console.log('🔍 PWA Install Detection:', {
      isIOS,
      isAndroid,
      isChrome,
      isEdge,
      isSafari,
      isFirefox,
      isMobile,
      isSupported,
      userAgent: navigator.userAgent.substring(0, 100)
    });

    // Handle beforeinstallprompt for supported browsers
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('🎯 Native beforeinstallprompt event captured!', {
        platforms: (e as BeforeInstallPromptEvent).platforms,
        timestamp: new Date().toISOString()
      });
      e.preventDefault(); // Prevent default mini-infobar
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowButton(true);
      setIsLoading(false);
    };

    // Handle successful installation
    const handleAppInstalled = () => {
      console.log('✅ PWA installed successfully');
      setIsInstalled(true);
      setShowButton(false);
      setDeferredPrompt(null);
    };

    // Show button for supported platforms immediately
    if (isSupported) {
      setShowButton(true);
      
      // Set a reasonable timeout for loading state
      const loadingTimeout = setTimeout(() => {
        setIsLoading(false);
      }, 1500); // Reduced from 2000ms
      
      // Clear timeout if beforeinstallprompt fires early
      const clearLoadingOnPrompt = () => {
        clearTimeout(loadingTimeout);
        setIsLoading(false);
      };
      
      window.addEventListener('beforeinstallprompt', clearLoadingOnPrompt, { once: true });
      
      return () => {
        clearTimeout(loadingTimeout);
        window.removeEventListener('beforeinstallprompt', clearLoadingOnPrompt);
      };
    } else {
      setIsLoading(false);
    }

    // Add event listeners for all cases
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    const isChrome = /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent);
    const isEdge = /Edg/.test(navigator.userAgent);
    
    console.log('🚀 Install clicked', {
      hasNativePrompt: !!deferredPrompt,
      isIOS,
      isAndroid,
      isChrome,
      isEdge,
      platforms: deferredPrompt?.platforms
    });

    // Priority 1: Use native install prompt if available
    if (deferredPrompt && !isIOS) {
      try {
        console.log('📱 Using native PWA install prompt');
        
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        
        console.log('📊 User choice:', choiceResult.outcome);
        
        if (choiceResult.outcome === 'accepted') {
          console.log('🎉 PWA installation accepted');
          setShowButton(false);
          setIsInstalled(true);
        }
        
        setDeferredPrompt(null);
        return;
      } catch (error) {
        console.error('❌ Native install prompt failed:', error);
        // Continue to fallback methods below
      }
    }

    // Priority 2: iOS Safari instructions
    if (isIOS) {
      console.log('📱 Showing iOS install modal');
      setShowIOSModal(true);
      return;
    }

    // Priority 3: Android Chrome/Edge fallback
    if (isAndroid && (isChrome || isEdge)) {
      console.log('🤖 Android fallback instructions');
      alert(
        'To install CareBridge as an app:\n\n' +
        '1. Tap the menu (⋮) in your browser\n' +
        '2. Look for "Add to Home screen" or "Install app"\n' +
        '3. Tap it and follow the prompts\n\n' +
        'Or look for an install icon (⬇️) in the address bar'
      );
      return;
    }

    // Priority 4: Desktop Chrome/Edge fallback
    if (!isAndroid && !isIOS && (isChrome || isEdge)) {
      console.log('💻 Desktop fallback instructions');
      alert(
        'To install CareBridge as an app:\n\n' +
        '1. Look for the install icon (⬇️) in your browser address bar\n' +
        '2. Or click the menu (⋮) → "Install CareBridge"\n' +
        '3. Click "Install" in the popup\n\n' +
        'If you don\'t see these options, try refreshing the page'
      );
      return;
    }

    // Priority 5: Other browsers
    console.log('🌐 Generic browser instructions');
    alert(
      'To add CareBridge to your device:\n\n' +
      '• Look for "Add to Home Screen" in your browser menu\n' +
      '• Or bookmark this page for quick access\n' +
      '• Some browsers may show an install option in the address bar'
    );
  };

  // If still loading, show loading state
  if (isLoading) {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 border-gray-200 dark:border-gray-800"
      >
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
        <span className="text-gray-600 dark:text-gray-400">Checking...</span>
      </Button>
    );
  }

  // If already installed, show "App Installed" with checkmark
  if (isInstalled) {
    return (
      <Button
        size="sm"
        variant="outline"
        disabled
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800"
        title="CareBridge is already installed on this device"
      >
        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
        <span className="text-green-700 dark:text-green-300">App Installed</span>
      </Button>
    );
  }

  // Don't show if not supported or not ready
  if (!showButton) {
    return null;
  }

  return (
    <>
      <Button
        onClick={handleInstallClick}
        size="sm"
        variant="outline"
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-blue-200 dark:border-blue-800 hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900 dark:hover:to-cyan-900 transition-all duration-200"
        title="Install CareBridge as an app on your device"
      >
        <Download className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <span className="text-blue-700 dark:text-blue-300 font-medium">
          Install App
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
              <h3 className="text-lg font-semibold">Add CareBridge to Home Screen</h3>
              <p className="text-sm text-muted-foreground">Get app-like experience with offline access</p>
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
