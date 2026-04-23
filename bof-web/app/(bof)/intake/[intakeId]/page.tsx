import { IntakeEngineDetailClient } from "@/components/intake-engine/IntakeEngineDetailClient";

export const metadata = {
  title: "Intake review | BOF Intake Engine",
  description: "Review extracted fields, attachments, and finalize intake into BOF workflows.",
};

export default function IntakeEngineDetailPage() {
  return <IntakeEngineDetailClient />;
}
