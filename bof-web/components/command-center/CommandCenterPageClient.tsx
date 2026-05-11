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
import { CommandCenterImmediateActions } from "@/components/CommandCenterImmediateActions";
import { CommandCenterKpiStrip } from "@/components/CommandCenterKpiStrip";
import { CommandCenterIssueList } from "@/components/CommandCenterIssueList";
import { CommandCenterRfClaimsExposure } from "@/components/CommandCenterRfClaimsExposure";
import { CommandCenterSupportingOps } from "@/components/CommandCenterSupportingOps";
import { CommandCenterSavingsScorecard } from "@/components/CommandCenterSavingsScorecard";
import { CommandCenterSavingsQualify } from "@/components/CommandCenterSavingsQualify";
import { buildCommandCenterIssueViewModels } from "@/lib/command-center/command-center-issue-view-model";

export function CommandCenterPageClient() {
  const { data } = useBofDemoData();
  const intakeCommandCenterItems = useIntakeEngineStore(
    (s) => s.commandCenterIntakeItems
  );

  const scorecard = useMemo(() => buildFleetScorecard(data), [data]);
  const networkImpact = useMemo(() => buildBofNetworkImpact(data), [data]);
  const enrichedItems = useMemo(() => {
    const fromIntake = enrichCommandCenterItemList(data, intakeCommandCenterItems);
    const fromRegisters = enrichCommandCenterItems(data);
    return [...fromIntake, ...fromRegisters];
  }, [data, intakeCommandCenterItems]);
  const issueViewModels = useMemo(
    () => buildCommandCenterIssueViewModels(data, enrichedItems),
    [data, enrichedItems]
  );
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
      <header className="bof-cc-page-header">
        <h1 className="bof-cc-page-title">Command Center</h1>
        <p className="bof-cc-page-subtitle">
          BOF shows issues that can delay dispatch, block payment, increase claims risk, or require owner review.
        </p>
      </header>

      {/* Exception Management Story Section */}
      <section className="bof-cc-panel" aria-labelledby="exception-management-heading" id="exception-management">
        <div className="bof-cc-panel-head">
          <h2 id="exception-management-heading" className="bof-h2">Exception Management</h2>
        </div>
        <div className="bof-cc-panel-content">
          <div className="bof-cc-story-grid">
            <div className="bof-cc-story-card">
              <h3 className="bof-cc-story-title">Manage by Exception, Not by Inbox</h3>
              <p className="bof-cc-story-text">
                Busy fleet operators should not have to dig through every load, document, proof item, settlement, or claim. BOF manages by exception, filtering noise and surfacing only true exceptions that require attention.
              </p>
            </div>
            
            <div className="bof-cc-story-card">
              <h3 className="bof-cc-story-title">Controls Before Problems</h3>
              <p className="bof-cc-story-text">
                Because BOF has controls throughout the operation, it catches many errors before they grow into problems. Our proactive monitoring identifies issues early, preventing operational failures before they impact service.
              </p>
            </div>
            
            <div className="bof-cc-story-card">
              <h3 className="bof-cc-story-title">Prepared Response When Something Goes Wrong</h3>
              <p className="bof-cc-story-text">
                When an issue does become a problem, BOF already has a process to minimize impact. Every exception includes severity, owner, source record, financial/operational impact, next action, and fix path.
              </p>
            </div>
          </div>
          
          <div className="bof-cc-exception-types">
            <h4 className="bof-cc-section-subtitle">What BOF Surfaces</h4>
            <div className="bof-cc-exception-grid">
              <div className="bof-cc-exception-item">
                <span className="bof-cc-exception-icon">📋</span>
                <span className="bof-cc-exception-label">Proof Gaps</span>
              </div>
              <div className="bof-cc-exception-item">
                <span className="bof-cc-exception-icon">💰</span>
                <span className="bof-cc-exception-label">Settlement Holds</span>
              </div>
              <div className="bof-cc-exception-item">
                <span className="bof-cc-exception-icon">👤</span>
                <span className="bof-cc-exception-label">Driver Readiness Issues</span>
              </div>
              <div className="bof-cc-exception-item">
                <span className="bof-cc-exception-icon">🔧</span>
                <span className="bof-cc-exception-label">Maintenance Risk</span>
              </div>
              <div className="bof-cc-exception-item">
                <span className="bof-cc-exception-icon">⚖️</span>
                <span className="bof-cc-exception-label">Claims Exposure</span>
              </div>
              <div className="bof-cc-exception-item">
                <span className="bof-cc-exception-icon">🚚</span>
                <span className="bof-cc-exception-label">Customer-Impacting Delays</span>
              </div>
            </div>
          </div>
          
          <div className="bof-cc-benefits">
            <h4 className="bof-cc-section-subtitle">Why It Matters for Busy Operators</h4>
            <div className="bof-cc-benefit-grid">
              <div className="bof-cc-benefit-item">
                <span className="bof-cc-benefit-icon">✓</span>
                <span className="bof-cc-benefit-text">Fewer surprises</span>
              </div>
              <div className="bof-cc-benefit-item">
                <span className="bof-cc-benefit-icon">✓</span>
                <span className="bof-cc-benefit-text">Less firefighting</span>
              </div>
              <div className="bof-cc-benefit-item">
                <span className="bof-cc-benefit-icon">✓</span>
                <span className="bof-cc-benefit-text">Faster resolution</span>
              </div>
              <div className="bof-cc-benefit-item">
                <span className="bof-cc-benefit-icon">✓</span>
                <span className="bof-cc-benefit-text">Lower operational drag</span>
              </div>
              <div className="bof-cc-benefit-item">
                <span className="bof-cc-benefit-icon">✓</span>
                <span className="bof-cc-benefit-text">More predictable service</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bof-cc-attention-section" aria-labelledby="cc-attention-heading">
        <div className="bof-cc-attention-section-head">
          <h2 id="cc-attention-heading" className="bof-cc-section-title">
            What Needs Attention Now
          </h2>
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
        <CommandCenterIssueList items={issueViewModels} />
      </section>

      <CommandCenterImmediateActions rows={immediateActions} />

      <CommandCenterKpiStrip kpis={kpiStrip} />

      <div className="bof-cc-scoreboard-row">
        <FleetScorecardPanel card={scorecard} />
        <BofNetworkImpactPanel impact={networkImpact} />
      </div>

      <CommandCenterRfClaimsExposure data={data} />

      <CommandCenterSupportingOps data={data} />

      <CommandCenterSavingsScorecard scorecard={savingsEngine} />
      <CommandCenterSavingsQualify model={savingsQualify} />

    </div>
  );
}
