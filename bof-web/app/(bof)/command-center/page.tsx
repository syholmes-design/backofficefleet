import { getBofData } from "@/lib/load-bof-data";
import {
  buildFleetScorecard,
  buildBofNetworkImpact,
  buildCommandCenterKpiStrip,
  enrichCommandCenterItems,
} from "@/lib/command-center-system";
import { buildSavingsEngineScorecard } from "@/lib/bof-savings-engine";
import {
  buildSavingsQualification,
  buildImmediateActionsRequired,
} from "@/lib/bof-savings-layer";
import {
  FleetScorecardPanel,
  BofNetworkImpactPanel,
} from "@/components/CommandCenterTopPanels";
import { CommandCenterExecutiveHeader } from "@/components/CommandCenterExecutiveHeader";
import { CommandCenterSavingsScorecard } from "@/components/CommandCenterSavingsScorecard";
import { CommandCenterSavingsQualify } from "@/components/CommandCenterSavingsQualify";
import { CommandCenterImmediateActions } from "@/components/CommandCenterImmediateActions";
import { CommandCenterKpiStrip } from "@/components/CommandCenterKpiStrip";
import { CommandCenterIssueList } from "@/components/CommandCenterIssueList";
import { CommandCenterRfClaimsExposure } from "@/components/CommandCenterRfClaimsExposure";
import { CommandCenterSupportingOps } from "@/components/CommandCenterSupportingOps";

export const metadata = {
  title: "Command Center | BOF",
  description: "Executive action layer",
};

export default function CommandCenterPage() {
  const data = getBofData();
  const scorecard = buildFleetScorecard(data);
  const networkImpact = buildBofNetworkImpact(data);
  const enrichedItems = enrichCommandCenterItems(data);
  const kpiStrip = buildCommandCenterKpiStrip(data);
  const savingsEngine = buildSavingsEngineScorecard(data);
  const savingsQualify = buildSavingsQualification(data);
  const immediateActions = buildImmediateActionsRequired(data);

  return (
    <div className="bof-page bof-cc-page">
      <CommandCenterExecutiveHeader />

      <CommandCenterSavingsScorecard scorecard={savingsEngine} />
      <CommandCenterSavingsQualify model={savingsQualify} />
      <CommandCenterImmediateActions rows={immediateActions} />

      <CommandCenterKpiStrip kpis={kpiStrip} />

      <div className="bof-cc-scoreboard-row">
        <FleetScorecardPanel card={scorecard} />
        <BofNetworkImpactPanel impact={networkImpact} />
      </div>

      <section
        className="bof-cc-attention-section"
        aria-labelledby="cc-attention-heading"
      >
        <div className="bof-cc-attention-section-head">
          <h2 id="cc-attention-heading" className="bof-cc-section-title">
            What needs attention right now
          </h2>
          <p className="bof-cc-section-lead">
            Blocked settlements, proof gaps, compliance, and dispatch exceptions
            — with money on the line and a specific BOF next step.
          </p>
        </div>
        <CommandCenterIssueList items={enrichedItems} />
      </section>

      <CommandCenterRfClaimsExposure data={data} />

      <CommandCenterSupportingOps data={data} />
    </div>
  );
}
