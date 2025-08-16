"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider
      refetchInterval={30} // Refetch session every 30 seconds (more aggressive)
      refetchOnWindowFocus={true} // Refetch when window gains focus
      refetchWhenOffline={false} // Don't refetch when offline
    >
      {children}
    </NextAuthSessionProvider>
  );
}
