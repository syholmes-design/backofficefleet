/**
 * BOF Route Owner:
 * URL: /intake/:intakeId
 * Type: DEMO
 * Primary component: IntakeEngineDetailPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { IntakeEngineDetailClient } from "@/components/intake-engine/IntakeEngineDetailClient";

export const metadata = {
  title: "Intake review | BOF Intake Engine",
  description: "Review extracted fields, attachments, and finalize intake into BOF workflows.",
};

export default function IntakeEngineDetailPage() {
  return <IntakeEngineDetailClient />;
}
