/**
 * BOF Route Owner:
 * URL: /
 * Type: MARKETING
 * Primary component: @/components/marketing/MarketingHomeAccountable
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BackOfficeFleet | The Operating Layer for Transportation Businesses",
  description:
    "BackOfficeFleet connects the systems, people, proof, and decisions that keep transportation moving.",
};

export { default } from "@/components/marketing/MarketingHomeAccountable";
