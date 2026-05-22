/**
 * BOF Route Owner:
 * URL: /rf-actions
 * Type: DEMO
 * Primary component: RfActionsPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { RfActionsPageClient } from "@/components/rf-actions/RfActionsPageClient";

export const metadata = {
  title: "RF Action Engine | BOF",
  description: "Proof and dispute-driven follow-ups",
};

export default function RfActionsPage() {
  return <RfActionsPageClient />;
}
