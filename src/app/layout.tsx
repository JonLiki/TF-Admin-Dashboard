import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { TonganNgatu } from "@/components/ui/Patterns";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/Toaster";

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

export const metadata: Metadata = {
  title: "To’a Fatalona Admin",
  description: "Fat Loss & Fitness Team Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(inter.variable, jetbrainsMono.variable, outfit.variable)}>
      <body className="antialiased bg-ocean-deep text-white font-sans h-full relative selection:bg-lagoon/30">
        {/* Global Background Pattern */}
        <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] mix-blend-multiply">
          <TonganNgatu />
        </div>

        {children}
        <Toaster />
      </body>
    </html>
  );
}
