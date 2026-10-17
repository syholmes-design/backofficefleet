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
  title: "BackOfficeFleet | Outsourced Transportation Back-Office Operations",
  description:
    "BackOfficeFleet provides outsourced back-office operations for transportation aggregators, affiliated carriers, and fleet operators—recruiting through settlements with trained staff and supporting technology.",
};

export { default } from "@/components/marketing/MarketingHomeAccountable";
