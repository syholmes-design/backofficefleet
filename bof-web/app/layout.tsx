import type { Metadata } from "next";
import { ConditionalHeader } from "@/components/ConditionalHeader";
import { BofDebugBanner } from "@/components/debug/BofDebugBanner";
import "./globals.css";
import "mapbox-gl/dist/mapbox-gl.css";

export const metadata: Metadata = {
  title: {
    default: "BackOfficeFleet",
    template: "%s | BackOfficeFleet",
  },
  description:
    "Compliance and operations command center for trucking — dispatch, proof, settlements, and revenue protection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <ConditionalHeader />
        {children}
        <BofDebugBanner />
      </body>
    </html>
  );
}
