import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PWAProvider from "@/components/PWAProvider";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { SessionProvider } from "@/components/SessionProvider";
import { ThemeProvider } from "@/components/theme-provider";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import { DrawerProvider } from "@/components/DrawerProvider";
import { NurseStatusProvider } from "@/contexts/NurseStatusContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CareBridge – On‑Demand Nurses & Lab",
  description:
    "Request nurses or lab attendants on demand and get AI‑powered guidance via the CareBridge assistant.",
  manifest: "/manifest.json",
  icons: {
    icon: "/applogo.png",
    shortcut: "/applogo.png",
    apple: "/applogo.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CareBridge",
  },
};

export const viewport: Viewport = {
  themeColor: "#0891b2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background overflow-x-hidden`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SessionProvider>
            <PWAProvider />
            <NurseStatusProvider>
              <DrawerProvider>
                <div className="flex flex-col min-h-screen w-full overflow-x-hidden">
                  <Header />
                  <main className="flex-1 pb-20 md:pb-0 w-full overflow-x-hidden">{children}</main>
                  <Footer />
                  <BottomNav />
                  <PWAInstallPrompt />
                </div>
              </DrawerProvider>
            </NurseStatusProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
