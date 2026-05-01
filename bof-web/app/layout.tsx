import type { Metadata } from "next";
import { BofHeader } from "@/components/BofHeader";
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
        <BofHeader />
        {children}
      </body>
    </html>
  );
}
