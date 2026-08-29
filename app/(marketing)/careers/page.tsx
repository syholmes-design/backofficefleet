import type { Metadata } from "next";
import { CareersPageClient } from "@/components/marketing/CareersPageClient";

export const metadata: Metadata = {
  title: "Careers | BackOfficeFleet",
  description: "Explore active CDL-A driver openings, equipment specs, compensation, and home time with BackOfficeFleet partner carriers.",
};

export default function CareersPage() {
  return <CareersPageClient />;
}
