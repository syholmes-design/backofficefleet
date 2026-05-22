import type { CommandCenterKpiStripModel } from "@/lib/command-center-system";
import { formatUsd } from "@/lib/format-money";

export function CommandCenterKpiStrip({ kpis }: { kpis: CommandCenterKpiStripModel }) {
  return (
    <section className="bof-cc-kpi-strip" aria-label="Executive KPI summary">
      <article className="bof-cc-kpi-card bof-cc-kpi-card--primary">
        <span className="bof-cc-kpi-label">Total money at risk</span>
        <span className="bof-cc-kpi-value">{formatUsd(kpis.totalMoneyAtRisk)}</span>
        <span className="bof-cc-kpi-sub">Fleet register · settlement &amp; proof exposure</span>
      </article>
      <article className="bof-cc-kpi-card">
        <span className="bof-cc-kpi-label">Drivers blocked / at risk</span>
        <span className="bof-cc-kpi-value">{kpis.driversAtRisk}</span>
        <span className="bof-cc-kpi-sub">Unique drivers on the money-at-risk register</span>
      </article>
      <article className="bof-cc-kpi-card">
        <span className="bof-cc-kpi-label">Settlement holds</span>
        <span className="bof-cc-kpi-value">{kpis.settlementHoldsCount}</span>
        <span className="bof-cc-kpi-sub">
          {formatUsd(kpis.settlementHoldsUsd)} held / flagged in summary
        </span>
      </article>
      <article className="bof-cc-kpi-card">
        <span className="bof-cc-kpi-label">Claims / RF exposure</span>
        <span className="bof-cc-kpi-value">{formatUsd(kpis.claimsExposureUsd)}</span>
        <span className="bof-cc-kpi-sub">
          {kpis.claimWorkspaces} claim workspaces · {kpis.openRfActions} open RF actions
        </span>
      </article>
      <article className="bof-cc-kpi-card">
        <span className="bof-cc-kpi-label">Maintenance issues</span>
        <span className="bof-cc-kpi-value">{kpis.maintenanceIssues}</span>
        <span className="bof-cc-kpi-sub">Maintenance-category register rows</span>
      </article>
      <article className="bof-cc-kpi-card">
        <span className="bof-cc-kpi-label">BOF network impact</span>
        <span className="bof-cc-kpi-value">{formatUsd(kpis.networkImpactTotalUsd)}</span>
        <span className="bof-cc-kpi-sub">Recovery + prevention + efficiency (est.)</span>
      </article>
      <article className="bof-cc-kpi-card">
        <span className="bof-cc-kpi-label">Backhaul opportunity engine</span>
        <span className="bof-cc-kpi-value">{kpis.backhaulOpportunitiesFound}</span>
        <span className="bof-cc-kpi-sub">
          {kpis.deadheadMilesAvoided} mi avoided · captured{" "}
          {formatUsd(kpis.backhaulRevenueCapturedUsd)} · bonus pending{" "}
          {formatUsd(kpis.bofBackhaulBonusPendingUsd)}
        </span>
      </article>
    </section>
  );
}
