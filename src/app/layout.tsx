import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { AmbientBackground } from "@/components/ui/AmbientBackground";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/Toaster";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const viewport = {
  themeColor: "#051A24", // Ocean Deep
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "To'a Fatalona | Admin Dashboard",
  description: "Fat Loss & Fitness Team Management Dashboard — Track weigh-ins, KM, lifestyle, attendance, and team standings.",
  keywords: ["fitness", "team management", "weigh-in", "Tongan", "fat loss"],
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "To'a Fatalona",
  },
  applicationName: "To'a Fatalona Dashboard",
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(inter.variable, jetbrainsMono.variable, outfit.variable)} suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground font-sans h-full relative selection:bg-lagoon/30 transition-colors duration-300">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          {/* Cinematic Ambient Background */}
          <AmbientBackground />

          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
