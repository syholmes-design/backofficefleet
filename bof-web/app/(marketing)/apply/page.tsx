/**
 * BOF Route Owner:
 * URL: /apply
 * Type: MARKETING
 * Primary component: ApplyPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import type { Metadata } from "next";
import { FleetApplicationWizardClient } from "@/components/marketing/funnel/FleetApplicationWizardClient";

export const metadata: Metadata = {
  title: "Qualify for a BOF Strategy Conversation | BackOfficeFleet",
  description:
    "Curated application for fleets evaluating BackOfficeFleet — operational context, readiness, and next-step qualification.",
};

export default function ApplyPage() {
  return (
    <div className="bof-mkt-funnel-page">
      <div className="bof-mkt-funnel-shell">
        <FleetApplicationWizardClient />
      </div>
    </div>
  );
}
