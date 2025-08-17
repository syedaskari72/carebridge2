// PWA Installation Test Utilities
// Run in browser console to test PWA install functionality

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function testPWAInstallability() {
  console.log('=== PWA Installability Test ===');
  
  // Check if running in standalone mode (already installed)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIOSStandalone = (window.navigator as any).standalone === true;
  
  console.log('📱 App installed (standalone mode):', isStandalone || isIOSStandalone);
  
  // Check browser support
  const supportsBeforeInstallPrompt = 'onbeforeinstallprompt' in window;
  console.log('🔧 Browser supports beforeinstallprompt:', supportsBeforeInstallPrompt);
  
  // Device detection
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isChrome = /Chrome/.test(navigator.userAgent) && !/Edg/.test(navigator.userAgent);
  const isEdge = /Edg/.test(navigator.userAgent);
  
  console.log('📱 Device detection:', {
    isIOS,
    isAndroid,
    isChrome,
    isEdge,
    userAgent: navigator.userAgent
  });
  
  // Check service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistration().then(registration => {
      console.log('⚙️ Service Worker registered:', !!registration);
      if (registration) {
        console.log('   SW state:', registration.active?.state);
        console.log('   SW URL:', registration.active?.scriptURL);
      }
    });
  } else {
    console.log('⚙️ Service Worker: Not supported');
  }
  
  // Check manifest
  const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
  console.log('📄 Manifest link:', !!manifestLink);
  if (manifestLink) {
    console.log('   Manifest URL:', manifestLink.href);
    
    // Try to fetch manifest
    fetch(manifestLink.href)
      .then(res => res.json())
      .then(manifest => {
        console.log('✅ Manifest loaded:', {
          name: manifest.name,
          startUrl: manifest.start_url,
          display: manifest.display,
          iconCount: manifest.icons?.length || 0
        });
      })
      .catch(err => console.error('❌ Manifest fetch failed:', err));
  }
  
  // Check for beforeinstallprompt event listener
  console.log('🎯 Install button availability check...');
  setTimeout(() => {
    const installButtons = document.querySelectorAll('[data-testid="install-button"], button:contains("Install")');
    console.log('   Install buttons found:', installButtons.length);
  }, 1000);
  
  // Manual trigger test
  console.log('🧪 Manual install trigger test available as: window.testInstallPrompt()');
  (window as any).testInstallPrompt = () => {
    const event = new CustomEvent('beforeinstallprompt', {
      detail: { prompt: () => console.log('Test install prompt triggered') }
    });
    window.dispatchEvent(event);
  };
}

// Auto-run test
if (typeof window !== 'undefined') {
  (window as any).testPWAInstall = testPWAInstallability;
  console.log('PWA test available. Run testPWAInstall() in console.');
}
