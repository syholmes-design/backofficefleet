import type { Metadata } from "next";
import { FleetAssessmentWizardClient } from "@/components/marketing/funnel/FleetAssessmentWizardClient";

export const metadata: Metadata = {
  title: "Fleet Operations Assessment | BackOfficeFleet",
  description:
    "Multi-step fleet assessment for dispatch, compliance, proof, and settlement workflows — consultative intake aligned with BOF engagements.",
};

type BookAssessmentPageProps = {
  searchParams?: Promise<{
    sector?: string;
  }>;
};

export default async function BookAssessmentPage({ searchParams }: BookAssessmentPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const requestedSector = params?.sector;
  return (
    <div className="bof-mkt-funnel-page">
      <div className="bof-mkt-funnel-shell">
        <FleetAssessmentWizardClient initialSector={requestedSector} />
      </div>
    </div>
  );
}
