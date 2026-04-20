import type { Metadata } from "next";
import { FleetAssessmentWizardClient } from "@/components/marketing/funnel/FleetAssessmentWizardClient";

export const metadata: Metadata = {
  title: "Fleet Operations Assessment | BackOfficeFleet",
  description:
    "Multi-step fleet assessment for dispatch, compliance, proof, and settlement workflows — consultative intake aligned with BOF engagements.",
};

export default function BookAssessmentPage() {
  return (
    <div className="bof-mkt-funnel-page">
      <div className="bof-mkt-funnel-shell">
        <FleetAssessmentWizardClient />
      </div>
    </div>
  );
}
