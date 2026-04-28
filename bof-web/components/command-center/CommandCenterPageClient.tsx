"use client";

import { useMemo } from "react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import {
  buildFleetScorecard,
  buildBofNetworkImpact,
  buildCommandCenterKpiStrip,
  enrichCommandCenterItemList,
  enrichCommandCenterItems,
} from "@/lib/command-center-system";
import { useIntakeEngineStore } from "@/lib/stores/intake-engine-store";
import { buildSavingsEngineScorecard } from "@/lib/bof-savings-engine";
import { buildSavingsQualification, buildImmediateActionsRequired } from "@/lib/bof-savings-layer";
import { getBackhaulPendingApprovalAlert } from "@/lib/backhaul-opportunity-engine";
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

export function CommandCenterPageClient() {
  const { data } = useBofDemoData();
  const intakeCommandCenterItems = useIntakeEngineStore(
    (s) => s.commandCenterIntakeItems
  );

  const scorecard = useMemo(() => buildFleetScorecard(data), [data]);
  const networkImpact = useMemo(() => buildBofNetworkImpact(data), [data]);
  const enrichedItems = useMemo(() => {
    const fromIntake = enrichCommandCenterItemList(data, intakeCommandCenterItems);
    const canonical = enrichCommandCenterItems(data);
    return [...fromIntake, ...canonical];
  }, [data, intakeCommandCenterItems]);
  const kpiStrip = useMemo(() => buildCommandCenterKpiStrip(data), [data]);
  const savingsEngine = useMemo(() => buildSavingsEngineScorecard(data), [data]);
  const savingsQualify = useMemo(() => buildSavingsQualification(data), [data]);
  const immediateActions = useMemo(() => buildImmediateActionsRequired(data), [data]);
  const backhaulPendingAlert = useMemo(
    () => getBackhaulPendingApprovalAlert(data),
    [data]
  );

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

      <section className="bof-cc-attention-section" aria-labelledby="cc-attention-heading">
        <div className="bof-cc-attention-section-head">
          <h2 id="cc-attention-heading" className="bof-cc-section-title">
            What needs attention right now
          </h2>
          <p className="bof-cc-section-lead">
            Blocked settlements, proof gaps, compliance, and dispatch exceptions — with money on the
            line and a specific BOF next step.
          </p>
        </div>
        {backhaulPendingAlert && (
          <div className="mb-3 rounded border border-amber-800/50 bg-amber-950/25 px-3 py-2 text-sm">
            <p className="font-semibold text-amber-200">
              {backhaulPendingAlert.title}
              <span className="ml-2 rounded bg-amber-900/35 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-300">
                Severity: {backhaulPendingAlert.severity}
              </span>
            </p>
            <p className="mt-1 text-amber-100/90">{backhaulPendingAlert.reason}</p>
            <p className="mt-1 text-amber-200/90">
              Recommended fix: {backhaulPendingAlert.recommendedFix}
            </p>
          </div>
        )}
        <CommandCenterIssueList items={enrichedItems} />
      </section>

      <CommandCenterRfClaimsExposure data={data} />

      <CommandCenterSupportingOps data={data} />
    </div>
  );
}
