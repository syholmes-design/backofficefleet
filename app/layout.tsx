import type { Metadata } from "next";
import { ConditionalHeader } from "@/components/ConditionalHeader";
import { BofDebugBanner } from "@/components/debug/BofDebugBanner";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";
import { Dancing_Script } from "next/font/google";

const dancingScript = Dancing_Script({ 
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-dancing-script'
});

export const metadata: Metadata = {
  title: {
    default: "BackOfficeFleet",
    template: "%s | BackOfficeFleet",
  },
  description:
    "Compliance and operations command center for trucking - dispatch, proof, settlements, and revenue protection.",
  icons: {
    icon: "/assets/images/logo/boflogo-dark-background-transparent.png",
    shortcut: "/assets/images/logo/boflogo-dark-background-transparent.png",
    apple: "/assets/images/logo/boflogo-dark-background-transparent.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={dancingScript.variable}>
      <body>
        <ConditionalHeader />
        {children}
        <BofDebugBanner />
      </body>
    </html>
  );
}
