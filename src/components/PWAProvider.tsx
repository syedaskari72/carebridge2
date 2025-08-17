"use client";

import { useEffect } from "react";

export default function PWAProvider() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Register service worker
      navigator.serviceWorker
        .register("/sw.js", {
          scope: "/"
        })
        .then((registration) => {
          console.log("✅ Service Worker registered successfully:", {
            scope: registration.scope,
            updateViaCache: registration.updateViaCache
          });
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            console.log('🔄 Service Worker update found');
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🆕 New Service Worker installed, refresh recommended');
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn("❌ Service Worker registration failed:", err);
        });

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('📨 Message from Service Worker:', event.data);
      });

      // Handle service worker controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 Service Worker controller changed');
        // Optionally reload the page when a new service worker takes control
        // window.location.reload();
      });
    }

    // Add PWA-specific meta tags if not already present
    const addMetaTag = (name: string, content: string) => {
      if (!document.querySelector(`meta[name="${name}"]`)) {
        const meta = document.createElement('meta');
        meta.name = name;
        meta.content = content;
        document.head.appendChild(meta);
      }
    };

    // Ensure PWA meta tags are present
    addMetaTag('mobile-web-app-capable', 'yes');
    addMetaTag('apple-mobile-web-app-capable', 'yes');
    addMetaTag('apple-mobile-web-app-status-bar-style', 'default');
    addMetaTag('apple-mobile-web-app-title', 'CareBridge');
    
    // Add manifest link if not present
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/manifest.json';
      document.head.appendChild(link);
    }

    // Log PWA installation status
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    const isInWebApk = window.matchMedia('(display-mode: minimal-ui)').matches;
    
    console.log('📱 PWA Status:', {
      isStandalone,
      isIOSStandalone,
      isInWebApk,
      isInstalled: isStandalone || isIOSStandalone || isInWebApk,
      userAgent: navigator.userAgent.substring(0, 50)
    });
  }, []);

  return null;
}

