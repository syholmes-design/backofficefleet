import type { Metadata } from "next";
import { FleetIntelligenceIndexPage } from "@/components/marketing/FleetIntelligenceContent";

export const metadata: Metadata = {
  title: "Fleet Intelligence | BackOfficeFleet",
  description:
    "Insights from BackOfficeFleet on enforcement-driven trucking operations, proof packets, settlement readiness, driver readiness, and back-office modernization.",
};

export default function BlogIndexRoute() {
  return <FleetIntelligenceIndexPage />;
}
