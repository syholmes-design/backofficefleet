"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { formatUsd } from "@/lib/format-money";
import {
  getDashboardTodayChanges,
  getDriverReadinessChartData,
  getFleetRiskChartData,
  getLoadStatusChartData,
  getMainDashboardSummary,
  getOwnerAttentionQueue,
  getSettlementStatusChartData,
  type BreakdownPoint,
  type DashboardKpi,
  type OwnerAttentionItem,
} from "@/lib/dashboard-insights";
import { settlementTotals } from "@/lib/executive-layer";
import { getPayrollMonthlyTrend } from "@/lib/demo-trends";
import { getClientLoadRequests } from "@/lib/client-load-requests";
import { getDriverDispatchEligibility } from "@/lib/driver-dispatch-eligibility";

export function DashboardPageClient() {
  const { data } = useBofDemoData();
  const [heroImageMissing, setHeroImageMissing] = useState(false);

  const st = useMemo(() => settlementTotals(data), [data]);
  const summary = useMemo(() => getMainDashboardSummary(data), [data]);
  const fleetRisk = useMemo(() => getFleetRiskChartData(data), [data]);
  const readiness = useMemo(() => getDriverReadinessChartData(data), [data]);
  const loadStatus = useMemo(() => getLoadStatusChartData(data), [data]);
  const settlementStatus = useMemo(() => getSettlementStatusChartData(data), [data]);
  const attentionQueue = useMemo(() => getOwnerAttentionQueue(data), [data]);
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

  const driverDispatchRollup = useMemo(() => {
    let ready = 0;
    let needsReview = 0;
    let blocked = 0;
    for (const d of data.drivers) {
      const s = getDriverDispatchEligibility(data, d.id).status;
      if (s === "ready") ready += 1;
      else if (s === "needs_review") needsReview += 1;
      else blocked += 1;
    }
    return { ready, needsReview, blocked };
  }, [data]);

  const kpis = useMemo<Array<DashboardKpi & { href?: string }>>(
    () => [
      {
        label: "Active Loads",
        value: summary.activeLoads,
        hint: "En route + pending loads currently in play.",
        tone: summary.activeLoads > 5 ? "info" : "warn",
        delta: `${summary.activeLoads > 5 ? "High" : "Normal"} fleet movement`,
        href: "/dispatch",
      },
      {
        label: "Drivers Ready",
        value: summary.driversReady,
        hint: "Drivers clear for immediate dispatch assignment.",
        tone: "ok",
        delta: `${summary.driversReady} dispatch-eligible`,
        href: "/drivers",
      },
      {
        label: "Loads At Risk",
        value: summary.loadsAtRisk,
        hint: "Exception, seal mismatch, or pending proof risk.",
        tone: summary.loadsAtRisk > 3 ? "danger" : "warn",
        delta: summary.loadsAtRisk > 0 ? "Needs owner review" : "No flagged loads",
        href: "/loads",
      },
      {
        label: "Compliance Blocked",
        value: summary.complianceBlocked,
        hint: "Open compliance incidents affecting operations.",
        tone: summary.complianceBlocked > 0 ? "danger" : "ok",
        delta: summary.complianceBlocked > 0 ? "Blocking dispatch readiness" : "No open blockers",
        href: "/drivers",
      },
      {
        label: "Settlement Holds",
        value: summary.settlementHolds,
        hint: "Driver settlements held or pending release.",
        tone: summary.settlementHolds > 0 ? "warn" : "ok",
        delta: summary.settlementHolds > 0 ? "Release queue active" : "Settlement queue clear",
        href: "/settlements",
      },
      {
        label: "Claim Exposure",
        value: formatUsd(summary.claimExposure),
        hint: "Open claim-linked money-at-risk exposure.",
        tone: summary.claimExposure > 0 ? "danger" : "ok",
        delta: summary.claimExposure > 0 ? "Exposure currently open" : "No active claim exposure",
        href: "/money-at-risk",
      },
      {
        label: "Backhaul Recovery",
        value: formatUsd(summary.backhaulRecovery),
        hint: "Current backhaul pay tracked across fleet loads.",
        tone: "info",
        delta: "Recovery opportunity in flight",
        href: "/dispatch",
      },
      {
        label: "Safety At Risk",
        value: summary.safetyAtRisk,
        hint: "Drivers in at-risk safety tier right now.",
        tone: summary.safetyAtRisk > 0 ? "danger" : "ok",
        delta: summary.safetyAtRisk > 0 ? "Needs coaching plan" : "Safety posture stable",
        href: "/safety",
      },
    ],
    [summary]
  );

  const groupedKpis = useMemo(
    () => ({
      operations: kpis.filter((kpi) => ["Active Loads", "Loads At Risk", "Backhaul Recovery"].includes(kpi.label)),
      peopleCompliance: kpis.filter((kpi) =>
        ["Drivers Ready", "Compliance Blocked", "Safety At Risk"].includes(kpi.label)
      ),
      money: kpis.filter((kpi) => ["Settlement Holds", "Claim Exposure"].includes(kpi.label)),
    }),
    [kpis]
  );

  const criticalQueue = attentionQueue.filter((item) => item.severity === "critical");
  const latestCriticalAlert = criticalQueue[0] ?? null;
  const nonCriticalQueue = attentionQueue.filter((item) => item.severity !== "critical");
  const prioritizedQueue = [...criticalQueue, ...nonCriticalQueue];
  const queuePreview = prioritizedQueue.slice(0, 4);
  const readinessSplit = {
    ready: readiness.find((point) => point.label === "Ready")?.value ?? 0,
    review: readiness.find((point) => point.label === "Needs Review")?.value ?? 0,
    blocked: readiness.find((point) => point.label === "Blocked")?.value ?? 0,
  };
  const heroSummaryStats = [
    { label: "Active Loads", value: summary.activeLoads },
    { label: "Loads At Risk", value: summary.loadsAtRisk },
    { label: "Drivers Ready", value: readinessSplit.ready },
    { label: "Drivers Blocked", value: readinessSplit.blocked },
    { label: "Needs Review", value: readinessSplit.review },
    { label: "Settlement Holds", value: summary.settlementHolds },
    { label: "Claim Exposure", value: formatUsd(summary.claimExposure) },
    { label: "Client Requests Pending", value: pendingClientLoadRequests },
  ] as const;

  return (
    <div className="bof-page bof-cc-page bof-dashboard-page">
      <section
        className={`bof-dashboard-hero bof-cc-hero${heroImageMissing ? " bof-dashboard-hero--no-image" : ""}`}
      >
        {!heroImageMissing ? (
          <div className="bof-dashboard-hero__imagePanel">
            <div className="bof-dashboard-hero__imageSlot">
              <Image
                src="/images/bof-command-dashboard-hero.png"
                alt="BOF command dashboard showing fleet operations, documents, compliance, and route visibility."
                fill
                priority
                sizes="100vw"
                className="bof-dashboard-hero__image bof-dashboard-hero__imagePanel-img"
                onError={() => setHeroImageMissing(true)}
                unoptimized
              />
            </div>
            <nav className="bof-dashboard-hero__hotspots" aria-label="Quick dashboard links">
              <Link href="/dispatch" className="bof-dashboard-hero__hotspot">
                <span className="bof-dashboard-hero__hotspot-title">Dispatch Board</span>
                <span className="bof-dashboard-hero__hotspot-value">
                  {summary.activeLoads} active · {summary.loadsAtRisk} at risk
                </span>
              </Link>
              <Link href="/dashboard#attention-queue" className="bof-dashboard-hero__hotspot">
                <span className="bof-dashboard-hero__hotspot-title">Attention Queue</span>
                <span className="bof-dashboard-hero__hotspot-value">
                  {criticalQueue.length} critical · {attentionQueue.length} total
                </span>
              </Link>
              <Link href="/drivers" className="bof-dashboard-hero__hotspot">
                <span className="bof-dashboard-hero__hotspot-title">Driver Readiness</span>
                <span className="bof-dashboard-hero__hotspot-value">
                  {driverDispatchRollup.ready} ready · {driverDispatchRollup.blocked} blocked ·{" "}
                  {driverDispatchRollup.needsReview} review
                </span>
              </Link>
              <Link href="/settlements" className="bof-dashboard-hero__hotspot">
                <span className="bof-dashboard-hero__hotspot-title">Settlements</span>
                <span className="bof-dashboard-hero__hotspot-value">
                  {summary.settlementHolds} holds · {formatUsd(summary.claimExposure)} exposure
                </span>
              </Link>
              <Link href="/load-requests" className="bof-dashboard-hero__hotspot">
                <span className="bof-dashboard-hero__hotspot-title">Client Requests</span>
                <span className="bof-dashboard-hero__hotspot-value">
                  {pendingClientLoadRequests} pending
                </span>
              </Link>
            </nav>
          </div>
        ) : null}
        <div className="bof-dashboard-hero__content">
          <div className="bof-dashboard-hero__intro bof-cc-hero-left">
            <p className="bof-cc-kicker">Executive Operations Cockpit</p>
            <h1 className="bof-title bof-cc-title">Fleet Command Dashboard</h1>
            <p className="bof-lead bof-cc-lead">
              Readiness, dispatch risk, compliance blocks, settlements, proof exceptions, and revenue impact in one
              operating view.
            </p>
            <div className="bof-cc-hero-actions">
              <Link href="/dispatch" className="bof-cc-btn bof-cc-btn-primary">
                Open Dispatch Board
              </Link>
              <a href="#attention-queue" className="bof-cc-btn">
                Review Attention Queue
              </a>
              <Link href="/settlements" className="bof-cc-btn">
                Open Settlements
              </Link>
            </div>
          </div>
          <div className="bof-dashboard-hero__stats">
            <div className="bof-cc-hero-stat-grid">
              {heroSummaryStats.map((stat) => (
                <article key={stat.label} className="bof-cc-hero-stat">
                  <span className="bof-cc-hero-stat-label">{stat.label}</span>
                  <strong className="bof-cc-hero-stat-value">{stat.value}</strong>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bof-dashboard-route-snapshot" aria-label="Route and alert snapshot">
        <RouteSnapshotCard
          latestCriticalAlert={latestCriticalAlert}
          loadsAtRisk={summary.loadsAtRisk}
          topRiskLoads={topRiskLoads}
        />
      </section>

      <section className="bof-cc-kpi-sections" aria-label="Executive KPI strip">
        <article className="bof-cc-panel">
          <div className="bof-cc-kpi-group-head">
            <h2 className="bof-h2">Operations</h2>
          </div>
          <div className="bof-cc-kpi-grid">
            {groupedKpis.operations.map((kpi) => (
              <KpiCard key={kpi.label} kpi={kpi} />
            ))}
          </div>
        </article>

        <article className="bof-cc-panel">
          <div className="bof-cc-kpi-group-head">
            <h2 className="bof-h2">People &amp; Compliance</h2>
          </div>
          <div className="bof-cc-kpi-grid">
            {groupedKpis.peopleCompliance.map((kpi) => (
              <KpiCard key={kpi.label} kpi={kpi} />
            ))}
          </div>
        </article>

        <article className="bof-cc-panel">
          <div className="bof-cc-kpi-group-head">
            <h2 className="bof-h2">Money</h2>
          </div>
          <div className="bof-cc-kpi-grid">
            {groupedKpis.money.map((kpi) => (
              <KpiCard key={kpi.label} kpi={kpi} />
            ))}
          </div>
        </article>
      </section>

      <section className="bof-cc-panel bof-cc-attention-priority" aria-label="Priority owner actions" id="attention-queue">
        <div className="bof-cc-panel-head">
          <h2 className="bof-h2">Owner&apos;s Attention Queue</h2>
          <Link href="/command-center" className="bof-link-secondary">Open full queue →</Link>
        </div>
        <p className="bof-cc-panel-sub">
          Critical blockers are pinned first with direct actions into the canonical BOF workflow.
        </p>
        <div className="bof-cc-critical-banner">
          <strong>{criticalQueue.length}</strong> critical items require immediate owner action.
        </div>
        <div className="bof-cc-queue-cards">
          {queuePreview.map((item) => (
            <article key={item.id} className={`bof-cc-queue-card bof-cc-queue-${item.severity}`}>
              <div className="bof-cc-queue-head">
                <span className={`bof-cc-sev bof-cc-sev-${item.severity}`}>{item.severity}</span>
                <span className="bof-cc-chip bof-cc-chip-info">{item.area}</span>
              </div>
              <p className="bof-cc-queue-target">{item.target}</p>
              <p className="bof-cc-queue-issue">{item.issue}</p>
              <p className="bof-cc-queue-fix"><strong>Recommended fix:</strong> {item.recommendedFix}</p>
              <div className="bof-cc-queue-foot">
                <span>{item.financialImpact ? formatUsd(item.financialImpact) : "No direct amount"}</span>
                <Link href={item.actionHref} className="bof-cc-action-btn bof-cc-action-btn-primary">
                  {item.actionLabel}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bof-cc-chart-grid" aria-label="Fleet breakdown charts">
        <DonutChartCard title="Fleet Risk Breakdown" subtitle="Compliance, dispatch, safety, settlements, and claims." data={fleetRisk} />
        <BarChartCard title="Driver Readiness" subtitle="Ready vs review vs blocked dispatch states." data={readiness} />
        <DonutChartCard title="Load Status Breakdown" subtitle="On-time, risk, delayed, and completed loads." data={loadStatus} />
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
          <h3 className="bof-cc-panel-title">Queue Detail</h3>
        </div>
        <div className="bof-cc-table-wrap">
          <table className="bof-cc-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Category</th>
                <th>Driver / Load</th>
                <th>Issue</th>
                <th>Financial Impact</th>
                <th>Recommended Fix</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {prioritizedQueue.map((item) => (
                <tr key={item.id} className={item.severity === "critical" ? "bof-cc-row-critical" : undefined}>
                  <td><span className={`bof-cc-sev bof-cc-sev-${item.severity}`}>{item.severity}</span></td>
                  <td><span className="bof-cc-chip bof-cc-chip-info">{item.area}</span></td>
                  <td>{item.target}</td>
                  <td>{item.issue}</td>
                  <td>{item.financialImpact ? formatUsd(item.financialImpact) : "—"}</td>
                  <td>{item.recommendedFix}</td>
                  <td>
                    <Link href={item.actionHref} className="bof-cc-table-link">
                      {item.actionLabel}
                    </Link>
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
            <ExecutiveNote label="Drivers newly blocked" value={summary.complianceBlocked} tone={summary.complianceBlocked > 0 ? "warn" : "ok"} detail={`${summary.driversReady} drivers currently dispatch-ready.`} />
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

function RouteSnapshotCard({
  latestCriticalAlert,
  loadsAtRisk,
  topRiskLoads,
}: {
  latestCriticalAlert: OwnerAttentionItem | null;
  loadsAtRisk: number;
  topRiskLoads: Array<{ id: string; origin: string; destination: string; status: string; sealStatus: string }>;
}) {
  return (
    <aside className="bof-cc-route-panel bof-dashboard-route-snapshot__panel" aria-label="Route summary visual">
      <h3 className="bof-cc-panel-title">Route &amp; Alert Snapshot</h3>
      <p className="bof-cc-panel-sub">{loadsAtRisk} loads currently at risk across active lanes.</p>
      {latestCriticalAlert ? (
        <div className="bof-cc-critical-note">
          <span className="bof-cc-sev bof-cc-sev-critical">critical</span>
          <strong>{latestCriticalAlert.issue}</strong>
          <p>{latestCriticalAlert.recommendedFix}</p>
        </div>
      ) : (
        <p className="bof-cc-route-empty">No critical alert currently open.</p>
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
  const maxY = Math.max(...rows.map((row) => row.grossPay), 1);
  const points = rows.map((row, idx) => {
    const x = rows.length === 1 ? 0 : (idx / (rows.length - 1)) * 100;
    const grossY = 100 - (row.grossPay / maxY) * 100;
    const netY = 100 - (row.netPay / maxY) * 100;
    return { x, grossY, netY };
  });
  const grossPath = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.grossY}`).join(" ");
  const netPath = points.map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x} ${p.netY}`).join(" ");
  return (
    <article className="bof-cc-panel bof-cc-panel-wide">
      <h3 className="bof-cc-panel-title">{title}</h3>
      <p className="bof-cc-panel-sub">{subtitle}</p>
      <svg viewBox="0 0 100 30" className="bof-cc-trend-svg" role="img" aria-label={title}>
        <path d={`${grossPath} L 100 100 L 0 100 Z`} className="bof-cc-trend-area-gross" />
        <path d={grossPath} className="bof-cc-trend-line-gross" />
        <path d={netPath} className="bof-cc-trend-line-net" />
      </svg>
      <div className="bof-cc-trend-list">
        {rows.map((row) => (
          <div key={row.label} className="bof-cc-trend-row">
            <div className="bof-cc-trend-head">
              <span>{row.label}</span>
              <strong>{formatUsd(row.netPay)}</strong>
            </div>
            <div className="bof-cc-trend-track">
              <div className="bof-cc-trend-gross" style={{ width: `${(row.grossPay / maxY) * 100}%` }} />
              <div className="bof-cc-trend-net" style={{ width: `${(row.netPay / maxY) * 100}%` }} />
            </div>
            <p className="bof-cc-trend-meta">
              Gross {formatUsd(row.grossPay)} · Safety {formatUsd(row.safetyBonus)} · Backhaul {formatUsd(row.backhaulPay)}
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
