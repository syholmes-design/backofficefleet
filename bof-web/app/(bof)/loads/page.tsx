/**
 * BOF Route Owner:
 * URL: /loads
 * Type: DISPATCH
 * Primary component: LoadsPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { LoadsPageClient } from "@/components/loads/LoadsPageClient";

export const metadata = {
  title: "Loads / Dispatch | BOF",
  description: "Active and recent dispatch loads",
};

export default function LoadsPage() {
  return <LoadsPageClient />;
}
