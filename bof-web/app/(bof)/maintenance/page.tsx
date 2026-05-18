/**
 * BOF Route Owner:
 * URL: /maintenance
 * Type: DEMO
 * Primary component: MaintenanceDashboardPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { MaintenanceDashboardV4 } from "@/components/maintenance-v4/MaintenanceDashboardV4";

export const metadata = {
  title: "Maintenance | BOF",
};

export default function MaintenanceDashboardPage() {
  return <MaintenanceDashboardV4 />;
}
