import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PWAProvider from "@/components/PWAProvider";
import Header from "@/components/Header";
import MobileHeader from "@/components/MobileHeader";
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
    icon: [
      { url: "/applogo.png", sizes: "192x192", type: "image/png" },
      { url: "/applogo.png", sizes: "512x512", type: "image/png" }
    ],
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
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="CareBridge" />
        <meta name="apple-mobile-web-app-title" content="CareBridge" />
        <meta name="msapplication-starturl" content="/" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background overflow-x-hidden`}
        suppressHydrationWarning
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
                  <div className="sticky top-0 z-50">
                    <Header />
                    <MobileHeader />
                  </div>
                  <main className="flex-1 pb-20 md:pb-0 w-full overflow-x-hidden relative z-10">{children}</main>
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
