import type { Metadata } from "next";
import { FleetSavingsCalculatorClient } from "@/components/marketing/funnel/FleetSavingsCalculatorClient";

export const metadata: Metadata = {
  title: "Fleet Savings Outlook | BackOfficeFleet",
  description:
    "Directional fleet savings model across compliance, proof, dispatch, settlements, and admin efficiency — aligned with BOF command center economics.",
};

export default function FleetSavingsPage() {
  return (
    <div className="bof-mkt-funnel-page">
      <div className="bof-mkt-funnel-shell">
        <FleetSavingsCalculatorClient />
      </div>
    </div>
  );
}
