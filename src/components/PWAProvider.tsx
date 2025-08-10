"use client";

import { useEffect } from "react";

export default function PWAProvider() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator
    ) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered successfully:", registration);
        })
        .catch((err) => console.warn("SW registration failed", err));
    }
  }, []);

  return null;
}

