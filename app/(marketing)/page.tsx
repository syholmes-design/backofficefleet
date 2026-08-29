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
  title: "BackOfficeFleet – The Operating System Behind Your Fleet",
  description:
    "BackOfficeFleet becomes the back office behind growing trucking companies while owners keep control of their fleet and dispatch.",
};

export { default } from "@/components/marketing/MarketingHomeAccountable";
