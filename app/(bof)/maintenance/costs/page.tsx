/**
 * BOF Route Owner:
 * URL: /maintenance/costs
 * Type: DEMO
 * Primary component: MaintenanceCostsPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { MaintenanceCostsClient } from "@/components/maintenance/MaintenanceCostsClient";

export const metadata = { title: "Costs / vendors | Maintenance | BOF" };

export default function MaintenanceCostsPage() {
  return <MaintenanceCostsClient />;
}
