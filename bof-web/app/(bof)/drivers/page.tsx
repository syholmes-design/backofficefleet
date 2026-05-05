/**
 * BOF Route Owner:
 * URL: /drivers
 * Type: DEMO
 * Primary component: DriversIndexPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { DriversListPageClient } from "@/components/drivers/DriversListPageClient";

export const metadata = {
  title: "Drivers Command Center | BOF",
  description: "Driver readiness, compliance, safety, dispatch eligibility, and settlement signals",
};

export default function DriversIndexPage() {
  return <DriversListPageClient />;
}
