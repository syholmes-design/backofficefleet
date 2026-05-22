/**
 * BOF Route Owner:
 * URL: /maintenance/pm-inspections
 * Type: DEMO
 * Primary component: MaintenancePmPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { MaintenancePmInspectionClient } from "@/components/maintenance/MaintenancePmInspectionClient";

export const metadata = { title: "PM / Inspections | Maintenance | BOF" };

export default function MaintenancePmPage() {
  return <MaintenancePmInspectionClient />;
}
