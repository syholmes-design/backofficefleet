/**
 * BOF Route Owner:
 * URL: /intake
 * Type: DEMO
 * Primary component: IntakeEnginePage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { IntakeEngineInboxClient } from "@/components/intake-engine/IntakeEngineInboxClient";

export const metadata = {
  title: "BOF Intake Engine | BOF",
  description:
    "Operational intake inbox — classify order packets and documents, resolve gaps, and finalize dispatch-ready work.",
};

export default function IntakeEnginePage() {
  return <IntakeEngineInboxClient />;
}
