/**
 * BOF Route Owner:
 * URL: /dashboard
 * Type: DEMO
 * Primary component: DashboardPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { DashboardPageClient } from "@/components/dashboard/DashboardPageClient";

export const metadata = {
  title: "Dashboard | BOF",
  description: "Executive overview",
};

export default function DashboardPage() {
  return <DashboardPageClient />;
}
