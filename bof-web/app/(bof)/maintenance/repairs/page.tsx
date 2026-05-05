/**
 * BOF Route Owner:
 * URL: /maintenance/repairs
 * Type: DEMO
 * Primary component: MaintenanceRepairsPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { MaintenanceRepairsClient } from "@/components/maintenance/MaintenanceRepairsClient";

export const metadata = { title: "Repair issues | Maintenance | BOF" };

export default function MaintenanceRepairsPage() {
  return <MaintenanceRepairsClient />;
}
