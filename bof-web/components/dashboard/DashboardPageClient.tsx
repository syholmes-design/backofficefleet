"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { BookDemoLink } from "@/components/BookDemoLink";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { sectorLinks } from "@/lib/site-links";
import { formatUsd } from "@/lib/format-money";
import {
  getDashboardTodayChanges,
  getMainDashboardSummary,
  getSettlementStatusChartData,
  type BreakdownPoint,
  type DashboardKpi,
} from "@/lib/dashboard-insights";
import {
  buildExecutiveDashboardModel,
  type DashboardBreakdownPoint,
  type ExecutiveDashboardOwnerItem,
  type ExecutiveDashboardTopSummary,
} from "@/lib/dashboard-command-summary";
import { settlementTotals } from "@/lib/executive-layer";
import { getPayrollMonthlyTrend } from "@/lib/demo-trends";
import { getClientLoadRequests } from "@/lib/client-load-requests";
import { useIntakeEngineStore } from "@/lib/stores/intake-engine-store";

const SEV_ORDER: Record<ExecutiveDashboardOwnerItem["severity"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
};

export function DashboardPageClient() {
  const { data } = useBofDemoData();
  const intakeCommandCenterItems = useIntakeEngineStore((s) => s.commandCenterIntakeItems);

  const st = useMemo(() => settlementTotals(data), [data]);
  const summary = useMemo(() => getMainDashboardSummary(data), [data]);
  const exec = useMemo(
    () => buildExecutiveDashboardModel(data, intakeCommandCenterItems),
    [data, intakeCommandCenterItems]
  );
  const settlementStatus = useMemo(() => getSettlementStatusChartData(data), [data]);
  const pendingClientLoadRequests = useMemo(
    () =>
      getClientLoadRequests(data).filter(
        (request) => request.status !== "converted_to_load" && request.status !== "rejected"
      ).length,
    [data]
  );
  const todayChanges = useMemo(() => getDashboardTodayChanges(data), [data]);
  const payrollTrend = useMemo(() => getPayrollMonthlyTrend(), []);
  const topRiskLoads = useMemo(
    () =>
      data.loads
        .filter((load) => load.dispatchExceptionFlag || load.sealStatus !== "OK" || load.podStatus === "pending")
        .slice(0, 3),
    [data]
  );

  const [expandedReadiness, setExpandedReadiness] = useState<Record<string, boolean>>({});

  /** Command-center KPI strip — every value is derived in `buildExecutiveDashboardModel` from BOF + merged CC queue. */
  const commandKpis = useMemo<Array<DashboardKpi & { href?: string }>>(
    () => [
      {
        label: "Active Loads",
        value: exec.topSummary.activeLoads,
        hint: "En route + pending loads in the dispatch register.",
        tone: exec.topSummary.activeLoads > 5 ? "info" : "warn",
        delta: "Same load list as dispatch",
        href: "/dispatch",
      },
      {
        label: "Loads At Risk",
        value: exec.topSummary.loadsAtRisk,
        hint: "Exception, seal mismatch, or pending proof on active loads.",
        tone: exec.topSummary.loadsAtRisk > 3 ? "danger" : "warn",
        delta: exec.topSummary.loadsAtRisk > 0 ? "Review dispatch proof stack" : "No flagged loads",
        href: "/loads",
      },
      {
        label: "Dispatch Blocked",
        value: exec.topSummary.dispatchBlockedDrivers,
        hint: "Drivers in canonical dispatch-blocked review state.",
        tone: exec.topSummary.dispatchBlockedDrivers > 0 ? "danger" : "ok",
        delta:
          exec.topSummary.dispatchBlockedDrivers > 0
            ? "Clear compliance / document gates"
            : "No dispatch hard-gates",
        href: "/drivers",
      },
      {
        label: "Documents Needing Action",
        value: exec.topSummary.documentsNeedingAction,
        hint: "Compliance + credential queue rows from the same Command Center feed.",
        tone: exec.topSummary.documentsNeedingAction > 0 ? "warn" : "ok",
        delta: "Each row maps to a CC item",
        href: "/command-center",
      },
      {
        label: "Settlement Holds",
        value: exec.topSummary.settlementHolds,
        hint: "Drivers in pending / on-hold settlement posture (settlement totals).",
        tone: exec.topSummary.settlementHolds > 0 ? "warn" : "ok",
        delta: exec.topSummary.settlementHolds > 0 ? "Release queue active" : "Settlement queue clear",
        href: "/settlements",
      },
      {
        label: "Claim Exposure",
        value: formatUsd(exec.topSummary.claimExposureUsd),
        hint: "Open claim-linked rows in the money-at-risk register.",
        tone: exec.topSummary.claimExposureUsd > 0 ? "danger" : "ok",
        delta: exec.topSummary.claimExposureUsd > 0 ? "Exposure open" : "No claim-linked exposure",
        href: "/money-at-risk",
      },
    ],
    [exec.topSummary]
  );

  const criticalQueue = exec.ownerAttentionQueue.filter((item) => item.severity === "critical");
  const prioritizedQueue = useMemo(() => {
    return [...exec.ownerAttentionQueue].sort(
      (a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity] || a.id.localeCompare(b.id)
    );
  }, [exec.ownerAttentionQueue]);
  const queuePreview = prioritizedQueue.slice(0, 4);
  const snapshotAlert = prioritizedQueue[0] ?? null;

  const proofPendingLoads = useMemo(
    () =>
      data.loads.filter((l) => String(l.podStatus ?? "").toLowerCase() === "pending").length,
    [data.loads]
  );

  return (
    <div className="bof-page bof-cc-page bof-dashboard-page">
      <section className="bof-dashboard-hero bof-dashboard-hero--product bof-cc-hero">
        <div className="bof-dashboard-hero__productGrid">
          <div className="bof-dashboard-hero__introWrap">
            <div className="bof-dashboard-hero__intro bof-cc-hero-left">
              <p className="bof-cc-kicker">Executive Operations Cockpit</p>
              <h1 className="bof-title bof-cc-title">
                The Back Office Platform Built for Freight Operations
              </h1>
              <p className="bof-lead bof-cc-lead">
                BOF unifies dispatch, drivers, documents, compliance, proof, settlements, and revenue risk in one
                operating view.
              </p>
              <div className="bof-dashboard-hero__ctaRow" aria-label="Dashboard actions">
                <BookDemoLink className="bof-cc-btn bof-cc-btn-primary" ariaLabel="Book a BOF demo appointment">
                  Book a Demo
                </BookDemoLink>
                <Link href="/dispatch" prefetch={false} className="bof-cc-btn">
                  Open Dispatch Board
                </Link>
                <Link href="/dashboard#attention-queue" prefetch={false} className="bof-cc-btn">
                  Review Attention Queue
                </Link>
              </div>
              <nav className="bof-dashboard-hero__sectorRow" aria-label="Solutions by fleet type">
                {sectorLinks.map((item) => (
                  <Link key={item.href} href={item.href} className="bof-dashboard-hero__sectorLink" prefetch={false}>
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
          <DashboardHeroProductPreview
            topSummary={exec.topSummary}
            driverReadiness={exec.driverReadiness}
            attentionSample={snapshotAlert}
            proofPendingLoads={proofPendingLoads}
          />
        </div>
      </section>

      <section className="bof-dashboard-route-snapshot" aria-label="Route and alert snapshot">
        <RouteSnapshotCard
          priorityAlert={snapshotAlert}
          loadsAtRisk={exec.topSummary.loadsAtRisk}
          topRiskLoads={topRiskLoads}
        />
      </section>

      <section className="bof-cc-kpi-sections" aria-label="Command center summary">
        <article className="bof-cc-panel">
          <div className="bof-cc-kpi-group-head">
            <h2 className="bof-h2">Fleet command summary</h2>
            <p className="bof-cc-panel-sub" style={{ marginTop: "0.35rem" }}>
              Metrics below use the same merged Command Center queue as{" "}
              <Link href="/command-center" className="bof-link-secondary">
                Command Center
              </Link>{" "}
              plus canonical BOF registers (loads, settlements, money-at-risk, driver review).
            </p>
          </div>
          <div className="bof-cc-kpi-grid">
            {commandKpis.map((kpi) => (
              <KpiCard key={kpi.label} kpi={kpi} />
            ))}
          </div>
        </article>
      </section>

      <section className="bof-cc-panel bof-cc-attention-priority" aria-label="Priority owner actions" id="attention-queue">
        <div className="bof-cc-panel-head">
          <h2 className="bof-h2">What needs attention</h2>
          <Link href="/command-center" className="bof-link-secondary">Open full queue →</Link>
        </div>
        <p className="bof-cc-panel-sub">
          Sourced from <code className="text-xs opacity-90">buildCommandCenterItems</code> merged with intake CC
          rows — severity matches the canonical queue, not cosmetic labels.
        </p>
        {criticalQueue.length > 0 ? (
          <div className="bof-cc-critical-banner">
            <strong>{criticalQueue.length}</strong> item{criticalQueue.length === 1 ? "" : "s"} at critical severity
            (compliance / hard gates).
          </div>
        ) : (
          <p className="bof-cc-panel-sub">No critical-severity queue items right now.</p>
        )}
        <div className="bof-cc-queue-cards">
          {queuePreview.map((item) => (
            <article key={item.id} className={`bof-cc-queue-card bof-cc-queue-${item.severity}`}>
              <div className="bof-cc-queue-head">
                <span className={`bof-cc-sev bof-cc-sev-${item.severity}`}>{item.severity}</span>
                <span className="bof-cc-chip bof-cc-chip-info">{item.area}</span>
                <span className="bof-cc-chip bof-cc-chip-info">{item.entityType}</span>
              </div>
              <p className="bof-cc-queue-target">{item.target}</p>
              <p className="bof-cc-queue-issue">{item.issue}</p>
              <p className="bof-cc-queue-fix"><strong>Recommended fix:</strong> {item.recommendedFix}</p>
              <div className="bof-cc-queue-foot">
                <span>{item.financialImpact ? formatUsd(item.financialImpact) : "No direct amount"}</span>
                <span style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", justifyContent: "flex-end" }}>
                  {item.reviewDriverId ? (
                    <Link href={`/drivers/${item.reviewDriverId}#driver-review`} className="bof-cc-action-btn">
                      View driver review
                    </Link>
                  ) : null}
                  {item.reviewLoadId ? (
                    <Link href={`/loads/${item.reviewLoadId}#load-review`} className="bof-cc-action-btn">
                      View load review
                    </Link>
                  ) : null}
                  <Link href={item.actionHref} className="bof-cc-action-btn bof-cc-action-btn-primary">
                    {item.actionLabel}
                  </Link>
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bof-cc-chart-grid" aria-label="Fleet breakdown charts">
        <DonutChartCard
          title="Fleet Risk Breakdown"
          subtitle="Counts of Command Center items by lane (same feed as the queue above)."
          data={exec.fleetRiskFromAlerts}
        />
        <div className="bof-cc-panel">
          <BarChartCard
            title="Driver Readiness"
            subtitle="Ready, action needed (only when review lists issues), dispatch blocked."
            data={exec.driverReadiness}
          />
          <div className="bof-cc-panel-sub" style={{ marginTop: "0.75rem" }}>
            <strong>Details</strong> — plain-language driver review reasons and recommended next steps.
          </div>
          <ul className="bof-cc-notes" style={{ listStyle: "none", padding: 0, marginTop: "0.5rem" }}>
            {exec.driverReadinessDetails
              .filter((r) => r.segment !== "ready")
              .map((row) => (
                <li key={row.driverId} className="bof-cc-note bof-cc-note-warn" style={{ marginBottom: "0.35rem" }}>
                  <button
                    type="button"
                    className="bof-link-secondary"
                    style={{ background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit" }}
                    onClick={() =>
                      setExpandedReadiness((prev) => ({ ...prev, [row.driverId]: !prev[row.driverId] }))
                    }
                  >
                    {row.driverId} — {row.segment === "blocked" ? "Dispatch blocked" : "Action needed"}
                    {expandedReadiness[row.driverId] ? " ▲" : " ▼"}
                  </button>
                  {expandedReadiness[row.driverId] ? (
                    <ul style={{ marginTop: "0.35rem", paddingLeft: "1.1rem" }}>
                      {row.reasonLines.length ? (
                        row.reasonLines.map((line, idx) => (
                          <li key={`${row.driverId}-reason-${idx}`}>{line}</li>
                        ))
                      ) : (
                        <li>
                          <Link href={`/drivers/${row.driverId}#driver-review`} className="bof-cc-table-link">
                            Open driver review
                          </Link>
                        </li>
                      )}
                    </ul>
                  ) : null}
                </li>
              ))}
          </ul>
        </div>
        <DonutChartCard
          title="Load Status Breakdown"
          subtitle="Partition of every load in `data.loads` (dispatch register)."
          data={exec.loadStatus}
        />
        <BarChartCard title="Settlement Exposure" subtitle="Paid vs pending vs hold/review settlement posture." data={settlementStatus} />
        <TrendCard
          title="6-Month Payroll / Revenue Trend"
          subtitle="Gross pay, safety bonus, backhaul pay, and net pay trendline."
          rows={payrollTrend.map((row) => ({
            label: row.month,
            grossPay: row.grossPay,
            safetyBonus: row.safetyBonus,
            backhaulPay: row.backhaulPay,
            netPay: row.netPay,
          }))}
        />
      </section>

      <section className="bof-cc-panel" aria-label="Owner attention queue table">
        <div className="bof-cc-panel-head">
          <h3 className="bof-cc-panel-title">Queue detail</h3>
        </div>
        <div className="bof-cc-table-wrap">
          <table className="bof-cc-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Area</th>
                <th>Entity</th>
                <th>Entity ID</th>
                <th>Driver / Load</th>
                <th>Issue</th>
                <th>Financial impact</th>
                <th>Recommended fix</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {prioritizedQueue.map((item) => (
                <tr key={item.id} className={item.severity === "critical" ? "bof-cc-row-critical" : undefined}>
                  <td><span className={`bof-cc-sev bof-cc-sev-${item.severity}`}>{item.severity}</span></td>
                  <td><span className="bof-cc-chip bof-cc-chip-info">{item.area}</span></td>
                  <td>{item.entityType}</td>
                  <td>{item.entityId}</td>
                  <td>{item.target}</td>
                  <td>{item.issue}</td>
                  <td>{item.financialImpact ? formatUsd(item.financialImpact) : "—"}</td>
                  <td>{item.recommendedFix}</td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                      {item.reviewDriverId ? (
                        <Link href={`/drivers/${item.reviewDriverId}#driver-review`} className="bof-cc-table-link">
                          Driver review details
                        </Link>
                      ) : null}
                      {item.reviewLoadId ? (
                        <Link href={`/loads/${item.reviewLoadId}#load-review`} className="bof-cc-table-link">
                          Load review details
                        </Link>
                      ) : null}
                      <Link href={item.actionHref} className="bof-cc-table-link">
                        {item.actionLabel}
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bof-cc-grid-2" aria-label="Financial and change summaries">
        <article className="bof-cc-panel">
          <h2 className="bof-h2">Settlement & Revenue Snapshot</h2>
          <div className="bof-cc-fin-grid">
            <div className="bof-cc-fin-pill">
              <span>Total Gross Pay</span>
              <strong>{formatUsd(st.totalGross)}</strong>
            </div>
            <div className="bof-cc-fin-pill">
              <span>Total Net Pay</span>
              <strong>{formatUsd(st.totalNet)}</strong>
            </div>
            <div className="bof-cc-fin-pill">
              <span>Backhaul Pay</span>
              <strong>{formatUsd(st.totalBackhaul)}</strong>
            </div>
            <div className="bof-cc-fin-pill">
              <span>Pending / Hold Drivers</span>
              <strong>{st.pendingOrHold}</strong>
            </div>
          </div>
        </article>

        <article className="bof-cc-panel">
          <h2 className="bof-h2">What Changed Today</h2>
          <div className="bof-cc-notes">
            <ExecutiveNote label="Loads newly at risk" value={summary.loadsAtRisk} tone={summary.loadsAtRisk > 0 ? "danger" : "ok"} detail={todayChanges[0]} />
            <ExecutiveNote label="Drivers dispatch-blocked" value={summary.complianceBlocked} tone={summary.complianceBlocked > 0 ? "warn" : "ok"} detail={`${summary.driversReady} drivers currently dispatch-ready · ${summary.openComplianceIncidents} open compliance incident(s) in queue.`} />
            <ExecutiveNote label="Settlement holds changed" value={summary.settlementHolds} tone={summary.settlementHolds > 0 ? "warn" : "ok"} detail={todayChanges[1]} />
            <ExecutiveNote label="Claim exposure changed" value={formatUsd(summary.claimExposure)} tone={summary.claimExposure > 0 ? "danger" : "ok"} detail={summary.claimExposure > 0 ? "Active claim-linked exposure remains open." : "No active claim-linked exposure."} />
            <ExecutiveNote label="Documents / proof exceptions" value={`${summary.loadsAtRisk} open`} tone={summary.loadsAtRisk > 0 ? "warn" : "ok"} detail={todayChanges[4]} />
            <ExecutiveNote
              label="Client load requests pending"
              value={pendingClientLoadRequests}
              tone={pendingClientLoadRequests > 0 ? "warn" : "ok"}
              detail={
                pendingClientLoadRequests > 0
                  ? "Internal BOF review queue has pending client submissions."
                  : "No pending client submissions in load request queue."
              }
            />
          </div>
        </article>
      </section>

      <div className="bof-dashboard-bottom-spacer" aria-hidden />
    </div>
  );
}

function readinessCount(rows: DashboardBreakdownPoint[], label: string): number {
  return rows.find((r) => r.label === label)?.value ?? 0;
}

function DashboardHeroProductPreview({
  topSummary,
  driverReadiness,
  attentionSample,
  proofPendingLoads,
}: {
  topSummary: ExecutiveDashboardTopSummary;
  driverReadiness: DashboardBreakdownPoint[];
  attentionSample: ExecutiveDashboardOwnerItem | null;
  proofPendingLoads: number;
}) {
  const ready = readinessCount(driverReadiness, "Ready");
  const actionNeeded = readinessCount(driverReadiness, "Action needed");
  const blocked = readinessCount(driverReadiness, "Dispatch blocked");

  return (
    <aside className="bof-dashboard-hero-preview" aria-label="Live operations preview">
      <div className="bof-dashboard-hero-preview__chrome">
        <span className="bof-dashboard-hero-preview__dot" aria-hidden />
        Operations cockpit preview · live demo data
      </div>
      <div className="bof-dashboard-hero-preview__kpis">
        <div className="bof-dashboard-hero-preview__kpi">
          <span className="bof-dashboard-hero-preview__kpiLabel">Active loads</span>
          <strong>{topSummary.activeLoads}</strong>
        </div>
        <div className="bof-dashboard-hero-preview__kpi">
          <span className="bof-dashboard-hero-preview__kpiLabel">Loads at risk</span>
          <strong>{topSummary.loadsAtRisk}</strong>
        </div>
        <div className="bof-dashboard-hero-preview__kpi">
          <span className="bof-dashboard-hero-preview__kpiLabel">Docs need action</span>
          <strong>{topSummary.documentsNeedingAction}</strong>
        </div>
      </div>
      <div className="bof-dashboard-hero-preview__cards">
        <div className="bof-dashboard-hero-preview__card">
          <p className="bof-dashboard-hero-preview__cardTitle">Attention queue</p>
          {attentionSample ? (
            <>
              <p className={`bof-dashboard-hero-preview__sev bof-dashboard-hero-preview__sev--${attentionSample.severity}`}>
                {attentionSample.severity}
              </p>
              <p className="bof-dashboard-hero-preview__cardIssue">{attentionSample.issue}</p>
              <Link href={attentionSample.actionHref} className="bof-dashboard-hero-preview__cardLink">
                {attentionSample.actionLabel} →
              </Link>
            </>
          ) : (
            <p className="bof-dashboard-hero-preview__muted">No queued items.</p>
          )}
        </div>
        <div className="bof-dashboard-hero-preview__card">
          <p className="bof-dashboard-hero-preview__cardTitle">Driver readiness</p>
          <div className="bof-dashboard-hero-preview__readinessRow">
            <span>
              Ready <strong>{ready}</strong>
            </span>
            <span>
              Review <strong>{actionNeeded}</strong>
            </span>
            <span>
              Blocked <strong>{blocked}</strong>
            </span>
          </div>
          <Link href="/drivers" className="bof-dashboard-hero-preview__cardLink">
            Open drivers →
          </Link>
        </div>
      </div>
      <div className="bof-dashboard-hero-preview__footer">
        <div className="bof-dashboard-hero-preview__proof">
          <span className="bof-dashboard-hero-preview__proofLabel">Loads with POD pending</span>
          <strong>{proofPendingLoads}</strong>
        </div>
        <Link href="/loads" className="bof-dashboard-hero-preview__cardLink">
          Review loads →
        </Link>
      </div>
    </aside>
  );
}

function RouteSnapshotCard({
  priorityAlert,
  loadsAtRisk,
  topRiskLoads,
}: {
  priorityAlert: ExecutiveDashboardOwnerItem | null;
  loadsAtRisk: number;
  topRiskLoads: Array<{ id: string; origin: string; destination: string; status: string; sealStatus: string }>;
}) {
  return (
    <aside className="bof-cc-route-panel bof-dashboard-route-snapshot__panel" aria-label="Route summary visual">
      <h3 className="bof-cc-panel-title">Route &amp; Alert Snapshot</h3>
      <p className="bof-cc-panel-sub">{loadsAtRisk} loads currently at risk across active lanes.</p>
      {priorityAlert ? (
        <div className="bof-cc-critical-note">
          <span className={`bof-cc-sev bof-cc-sev-${priorityAlert.severity}`}>{priorityAlert.severity}</span>
          <span className="bof-cc-chip bof-cc-chip-info" style={{ marginLeft: "0.35rem" }}>
            {priorityAlert.entityType} · {priorityAlert.entityId}
          </span>
          <strong>{priorityAlert.issue}</strong>
          <p>{priorityAlert.recommendedFix}</p>
          <p>
            <Link href={priorityAlert.actionHref} className="bof-cc-table-link">
              {priorityAlert.actionLabel} →
            </Link>
          </p>
        </div>
      ) : (
        <p className="bof-cc-route-empty">No queue items in the merged Command Center feed.</p>
      )}
      <RouteSummaryPanel loadsAtRisk={loadsAtRisk} topRiskLoads={topRiskLoads} />
      <div className="bof-dashboard-route-snapshot__links">
        <Link href="/dispatch" className="bof-cc-table-link">
          Open full dispatch board →
        </Link>
        <Link href="/dashboard#attention-queue" className="bof-cc-table-link">
          Jump to attention queue →
        </Link>
      </div>
    </aside>
  );
}

function KpiCard({ kpi }: { kpi: DashboardKpi & { href?: string } }) {
  const body = (
    <article className={`bof-cc-kpi bof-cc-tone-${kpi.tone}`}>
      <p className="bof-cc-kpi-label">{kpi.label}</p>
      <p className="bof-cc-kpi-value">{kpi.value}</p>
      <p className="bof-cc-kpi-hint">{kpi.hint}</p>
      {kpi.delta ? <p className="bof-cc-kpi-delta">{kpi.delta}</p> : null}
    </article>
  );
  if (!kpi.href) return body;
  return (
    <Link href={kpi.href} className="bof-cc-kpi-link">
      {body}
    </Link>
  );
}

function toneClass(tone: BreakdownPoint["tone"], idx = 0): string {
  if (tone === "ok") return "bof-cc-bar-ok";
  if (tone === "warn") return "bof-cc-bar-warn";
  if (tone === "danger") return "bof-cc-bar-danger";
  const fallbacks = ["bof-cc-bar-info", "bof-cc-bar-ok", "bof-cc-bar-warn", "bof-cc-bar-danger"];
  return fallbacks[idx % fallbacks.length];
}

function DonutChartCard({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle: string;
  data: BreakdownPoint[];
}) {
  const total = data.reduce((sum, point) => sum + point.value, 0);
  const safeTotal = total || 1;
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <article className="bof-cc-panel">
      <h3 className="bof-cc-panel-title">{title}</h3>
      <p className="bof-cc-panel-sub">{subtitle}</p>
      <div className="bof-cc-donut-layout">
        <svg viewBox="0 0 140 140" className="bof-cc-donut-svg" role="img" aria-label={title}>
          <circle cx="70" cy="70" r={radius} className="bof-cc-donut-track" />
          {data.map((point, idx) => {
            const ratio = point.value / safeTotal;
            const slice = Math.max(0, ratio * circumference);
            const segment = (
              <circle
                key={point.label}
                cx="70"
                cy="70"
                r={radius}
                className={`bof-cc-donut-slice ${toneClass(point.tone, idx)}`}
                strokeDasharray={`${slice} ${Math.max(0, circumference - slice)}`}
                strokeDashoffset={-offset}
              />
            );
            offset += slice;
            return segment;
          })}
          <text x="70" y="64" textAnchor="middle" className="bof-cc-donut-total-label">
            Total
          </text>
          <text x="70" y="82" textAnchor="middle" className="bof-cc-donut-total-value">
            {total}
          </text>
        </svg>
        <div className="bof-cc-bars">
          {data.map((point) => {
            const width = Math.max(8, (point.value / safeTotal) * 100);
            return (
              <div key={point.label} className="bof-cc-bar-row">
                <div className="bof-cc-bar-meta">
                  <span>{point.label}</span>
                  <strong>{point.value}</strong>
                </div>
                <div className="bof-cc-bar-track">
                  <div className={`bof-cc-bar-fill ${toneClass(point.tone)}`} style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

function BarChartCard({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle: string;
  data: BreakdownPoint[];
}) {
  const max = Math.max(...data.map((point) => point.value), 1);
  return (
    <article className="bof-cc-panel">
      <h3 className="bof-cc-panel-title">{title}</h3>
      <p className="bof-cc-panel-sub">{subtitle}</p>
      <div className="bof-cc-vbar-chart" role="img" aria-label={title}>
        {data.map((point, idx) => (
          <div key={point.label} className="bof-cc-vbar-col">
            <div className="bof-cc-vbar-value">{point.value}</div>
            <div className="bof-cc-vbar-track">
              <div
                className={`bof-cc-vbar-fill ${toneClass(point.tone, idx)}`}
                style={{ height: `${Math.max(10, (point.value / max) * 100)}%` }}
              />
            </div>
            <div className="bof-cc-vbar-label">{point.label}</div>
          </div>
        ))}
      </div>
    </article>
  );
}

function TrendCard({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: Array<{ label: string; grossPay: number; safetyBonus: number; backhaulPay: number; netPay: number }>;
}) {
  const validated = rows.filter(
    (r) =>
      Boolean(String(r.label ?? "").trim()) &&
      Number.isFinite(r.grossPay) &&
      Number.isFinite(r.netPay) &&
      Number.isFinite(r.safetyBonus) &&
      Number.isFinite(r.backhaulPay) &&
      r.grossPay >= 0 &&
      r.netPay >= 0 &&
      r.safetyBonus >= 0 &&
      r.backhaulPay >= 0
  );

  const maxYForBars = Math.max(...validated.map((row) => row.grossPay), 1);

  const W = 640;
  const H = 312;
  const padL = 64;
  const padR = 20;
  const padT = 16;
  const padB = 56;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const baselineY = padT + chartH;

  const maxSeries = Math.max(
    ...validated.flatMap((r) => [r.grossPay, r.netPay, r.safetyBonus, r.backhaulPay]),
    1
  );

  function linePath(pts: Array<{ x: number; y: number }>): string {
    if (!pts.length) return "";
    return pts
      .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
      .join(" ");
  }

  function xAt(i: number, n: number): number {
    if (n <= 1) return padL + chartW / 2;
    return padL + (i / (n - 1)) * chartW;
  }

  function yAt(v: number): number {
    const clamped = Math.min(Math.max(v / maxSeries, 0), 1);
    return baselineY - clamped * chartH;
  }

  let svgChart: ReactNode = null;

  if (validated.length > 0) {
    const n = validated.length;
    const grossPts = validated.map((r, i) => ({ x: xAt(i, n), y: yAt(r.grossPay) }));
    const netPts = validated.map((r, i) => ({ x: xAt(i, n), y: yAt(r.netPay) }));
    const safetyPts = validated.map((r, i) => ({ x: xAt(i, n), y: yAt(r.safetyBonus) }));
    const backhaulPts = validated.map((r, i) => ({ x: xAt(i, n), y: yAt(r.backhaulPay) }));

    const netLine = linePath(netPts);
    const lastNet = netPts[n - 1];
    const firstNet = netPts[0];
    const netAreaD =
      netLine && lastNet && firstNet
        ? `${netLine} L ${lastNet.x.toFixed(2)} ${baselineY.toFixed(2)} L ${firstNet.x.toFixed(2)} ${baselineY.toFixed(2)} Z`
        : "";

    const tickVals = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(maxSeries * t));

    svgChart = (
      <div className="bof-cc-trend-chart-wrap">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="bof-cc-trend-svg-chart"
          role="img"
          aria-label={`${title}: gross, net, safety bonus, and backhaul by month`}
          preserveAspectRatio="xMidYMid meet"
        >
          <rect x={padL} y={padT} width={chartW} height={chartH} className="bof-cc-trend-plot-bg" rx={6} />

          {tickVals.map((tv) => {
            const yy = yAt(tv);
            return (
              <g key={`g-${tv}`}>
                <line x1={padL} x2={padL + chartW} y1={yy} y2={yy} className="bof-cc-trend-grid-line" />
                <text x={padL - 8} y={yy + 4} textAnchor="end" className="bof-cc-trend-axis-text">
                  {formatUsd(tv)}
                </text>
              </g>
            );
          })}

          <line
            x1={padL}
            x2={padL + chartW}
            y1={baselineY}
            y2={baselineY}
            className="bof-cc-trend-axis-line"
          />

          {netAreaD ? <path d={netAreaD} className="bof-cc-trend-area-net" /> : null}

          <path d={linePath(grossPts)} className="bof-cc-trend-line-gross" fill="none" />
          <path d={linePath(backhaulPts)} className="bof-cc-trend-line-backhaul" fill="none" />
          <path d={linePath(safetyPts)} className="bof-cc-trend-line-safety" fill="none" />
          <path d={netLine} className="bof-cc-trend-line-net" fill="none" />

          {validated.map((row, i) => (
            <text key={row.label} x={xAt(i, n)} y={H - 14} textAnchor="middle" className="bof-cc-trend-month-label">
              {row.label}
            </text>
          ))}
        </svg>

        <div className="bof-cc-trend-legend" aria-hidden="true">
          <span className="bof-cc-trend-legend-item">
            <span className="bof-cc-trend-legend-swatch bof-cc-trend-legend-swatch--net" /> Net pay
          </span>
          <span className="bof-cc-trend-legend-item">
            <span className="bof-cc-trend-legend-swatch bof-cc-trend-legend-swatch--gross" /> Gross pay
          </span>
          <span className="bof-cc-trend-legend-item">
            <span className="bof-cc-trend-legend-swatch bof-cc-trend-legend-swatch--safety" /> Safety bonus
          </span>
          <span className="bof-cc-trend-legend-item">
            <span className="bof-cc-trend-legend-swatch bof-cc-trend-legend-swatch--backhaul" /> Backhaul pay
          </span>
        </div>
      </div>
    );
  }

  return (
    <article className="bof-cc-panel bof-cc-panel-wide">
      <h3 className="bof-cc-panel-title">{title}</h3>
      <p className="bof-cc-panel-sub">{subtitle}</p>
      {validated.length === 0 ? (
        <p className="bof-cc-trend-empty">
          Payroll trend data is missing or invalid — chart hidden until demo series is available.
        </p>
      ) : (
        svgChart
      )}
      <div className="bof-cc-trend-list">
        {validated.map((row) => (
          <div key={row.label} className="bof-cc-trend-row">
            <div className="bof-cc-trend-head">
              <span>{row.label}</span>
              <strong>{formatUsd(row.netPay)}</strong>
            </div>
            <div className="bof-cc-trend-track">
              <div className="bof-cc-trend-gross" style={{ width: `${(row.grossPay / maxYForBars) * 100}%` }} />
              <div className="bof-cc-trend-net" style={{ width: `${(row.netPay / maxYForBars) * 100}%` }} />
            </div>
            <p className="bof-cc-trend-meta">
              Gross {formatUsd(row.grossPay)} · Safety {formatUsd(row.safetyBonus)} · Backhaul{" "}
              {formatUsd(row.backhaulPay)}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}

function RouteSummaryPanel({
  loadsAtRisk,
  topRiskLoads,
}: {
  loadsAtRisk: number;
  topRiskLoads: Array<{ id: string; origin: string; destination: string; status: string; sealStatus: string }>;
}) {
  const topOrigins = Array.from(new Set(topRiskLoads.map((load) => load.origin))).slice(0, 3);
  const topDestinations = Array.from(new Set(topRiskLoads.map((load) => load.destination))).slice(0, 3);
  return (
    <div className="bof-cc-route-summary-body" aria-label="Route summary visual detail">
      <div className="bof-cc-route-pills">
        {topOrigins.length ? <span className="bof-cc-chip bof-cc-chip-info">Origins: {topOrigins.join(", ")}</span> : null}
        {topDestinations.length ? <span className="bof-cc-chip bof-cc-chip-info">Destinations: {topDestinations.join(", ")}</span> : null}
      </div>
      <svg viewBox="0 0 360 120" className="bof-cc-route-svg" role="img" aria-label="Route summary">
        <path d="M 20 92 C 82 20, 162 118, 234 45 C 272 12, 315 40, 340 22" className="bof-cc-route-line" />
        <circle cx="20" cy="92" r="5" className="bof-cc-route-node-start" />
        <circle cx="234" cy="45" r="5" className="bof-cc-route-node-mid" />
        <circle cx="340" cy="22" r="5" className="bof-cc-route-node-end" />
      </svg>
      <div className="bof-cc-route-list">
        {topRiskLoads.length ? (
          topRiskLoads.map((load) => (
            <div key={load.id} className="bof-cc-route-row">
              <strong>{load.id}</strong>
              <span>{load.origin} → {load.destination}</span>
              <span className="bof-cc-route-status">{load.status} · Seal {load.sealStatus}</span>
            </div>
          ))
        ) : (
          <p className="bof-cc-route-empty">
            {loadsAtRisk > 0 ? "Risk lanes available in dispatch map." : "No active risk lanes detected."}
          </p>
        )}
      </div>
    </div>
  );
}

function ExecutiveNote({
  label,
  value,
  tone,
  detail,
}: {
  label: string;
  value: string | number;
  tone: "ok" | "warn" | "danger";
  detail: string;
}) {
  return (
    <article className={`bof-cc-note bof-cc-note-${tone}`}>
      <div className="bof-cc-note-head">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <p>{detail}</p>
    </article>
  );
}
