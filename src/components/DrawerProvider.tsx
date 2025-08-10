"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import SideDrawer from "@/components/SideDrawer";

interface DrawerContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const DrawerContext = createContext<DrawerContextValue | undefined>(undefined);

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  return (
    <DrawerContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
      {/* Mount the drawer at the root so it overlays all pages */}
      <SideDrawer isOpen={isOpen} onClose={close} />
    </DrawerContext.Provider>
  );
}

export function useDrawer() {
  const ctx = useContext(DrawerContext);
  if (!ctx) throw new Error("useDrawer must be used within DrawerProvider");
  return ctx;
}

