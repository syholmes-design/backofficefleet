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
  title: "Drivers | BOF",
  description: "Manage driver readiness, documents, worker type, dispatch eligibility, acknowledgments, and fix paths from one manager view",
};

export default function DriversIndexPage() {
  return <DriversListPageClient />;
}
