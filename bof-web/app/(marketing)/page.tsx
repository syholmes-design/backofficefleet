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
  title: "BackOfficeFleet – Enforcement Engine for Trucking Operations",
  description:
    "BackOfficeFleet is an enforcement-driven operating system for trucking back-office operations. Join the Founding Fleet Program and help shape the future of dispatch, compliance, proof, settlements, finance, and driver readiness.",
};

export { default } from "@/components/marketing/MarketingHomeAccountable";
