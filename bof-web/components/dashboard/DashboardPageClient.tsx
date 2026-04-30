"use client";

import Link from "next/link";
import { useMemo } from "react";
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
} from "@/lib/dashboard-insights";
import { settlementTotals } from "@/lib/executive-layer";
import { getPayrollMonthlyTrend } from "@/lib/demo-trends";

export function DashboardPageClient() {
  const { data } = useBofDemoData();

  const st = useMemo(() => settlementTotals(data), [data]);
  const summary = useMemo(() => getMainDashboardSummary(data), [data]);
  const fleetRisk = useMemo(() => getFleetRiskChartData(data), [data]);
  const readiness = useMemo(() => getDriverReadinessChartData(data), [data]);
  const loadStatus = useMemo(() => getLoadStatusChartData(data), [data]);
  const settlementStatus = useMemo(() => getSettlementStatusChartData(data), [data]);
  const attentionQueue = useMemo(() => getOwnerAttentionQueue(data), [data]);
  const todayChanges = useMemo(() => getDashboardTodayChanges(data), [data]);
  const payrollTrend = useMemo(() => getPayrollMonthlyTrend(), []);

  const kpis = useMemo<DashboardKpi[]>(
    () => [
      {
        label: "Active Loads",
        value: summary.activeLoads,
        hint: "En route + pending loads currently in play.",
        tone: summary.activeLoads > 5 ? "info" : "warn",
      },
      {
        label: "Drivers Ready",
        value: summary.driversReady,
        hint: "Drivers clear for immediate dispatch assignment.",
        tone: "ok",
      },
      {
        label: "Loads At Risk",
        value: summary.loadsAtRisk,
        hint: "Exception, seal mismatch, or pending proof risk.",
        tone: summary.loadsAtRisk > 3 ? "danger" : "warn",
      },
      {
        label: "Compliance Blocked",
        value: summary.complianceBlocked,
        hint: "Open compliance incidents affecting operations.",
        tone: summary.complianceBlocked > 0 ? "danger" : "ok",
      },
      {
        label: "Settlement Holds",
        value: summary.settlementHolds,
        hint: "Driver settlements held or pending release.",
        tone: summary.settlementHolds > 0 ? "warn" : "ok",
      },
      {
        label: "Claim Exposure",
        value: formatUsd(summary.claimExposure),
        hint: "Open claim-linked money-at-risk exposure.",
        tone: summary.claimExposure > 0 ? "danger" : "ok",
      },
      {
        label: "Backhaul Recovery",
        value: formatUsd(summary.backhaulRecovery),
        hint: "Current backhaul pay tracked across fleet loads.",
        tone: "info",
      },
      {
        label: "Safety At Risk",
        value: summary.safetyAtRisk,
        hint: "Drivers in at-risk safety tier right now.",
        tone: summary.safetyAtRisk > 0 ? "danger" : "ok",
      },
    ],
    [summary]
  );

  return (
    <div className="bof-page bof-cc-page">
      <section className="bof-cc-hero">
        <p className="bof-cc-kicker">Executive operations cockpit</p>
        <h1 className="bof-title bof-cc-title">Fleet Command Dashboard</h1>
        <p className="bof-lead bof-cc-lead">
          See readiness, risk, revenue impact, settlement holds, and dispatch exceptions across the fleet.
        </p>
        <div className="bof-cc-hero-actions">
          <Link href="/command-center" className="bof-cc-btn bof-cc-btn-primary">Open Command Center</Link>
          <Link href="/dispatch" className="bof-cc-btn">Open Dispatch Board</Link>
          <Link href="/settlements" className="bof-cc-btn">Open Settlements</Link>
        </div>
      </section>

      <section className="bof-cc-kpi-grid" aria-label="Main dashboard KPIs">
        {kpis.map((kpi) => (
          <article key={kpi.label} className={`bof-cc-kpi bof-cc-tone-${kpi.tone}`}>
            <p className="bof-cc-kpi-label">{kpi.label}</p>
            <p className="bof-cc-kpi-value">{kpi.value}</p>
            <p className="bof-cc-kpi-hint">{kpi.hint}</p>
            {kpi.delta ? <p className="bof-cc-kpi-delta">{kpi.delta}</p> : null}
          </article>
        ))}
      </section>

      <section className="bof-cc-chart-grid" aria-label="Fleet breakdown charts">
        <ChartCard title="Fleet Risk Overview" subtitle="Compliance, dispatch, safety, settlements, and claims." data={fleetRisk} />
        <ChartCard title="Driver Readiness Breakdown" subtitle="Ready vs review vs blocked dispatch states." data={readiness} />
        <ChartCard title="Load Status Breakdown" subtitle="On-time, risk, delayed, and completed loads." data={loadStatus} />
        <ChartCard title="Settlement Exposure" subtitle="Paid vs pending vs hold/review settlement posture." data={settlementStatus} />
        <TrendCard
          title="6-Month Payroll Trend (Demo)"
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

      <section className="bof-cc-panel" aria-label="Owner attention queue">
        <div className="bof-cc-panel-head">
          <h2 className="bof-h2">Owner&apos;s Attention Queue</h2>
          <Link href="/command-center" className="bof-link-secondary">Open full queue →</Link>
        </div>
        <div className="bof-cc-table-wrap">
          <table className="bof-cc-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Area</th>
                <th>Driver / Load</th>
                <th>Issue</th>
                <th>Financial Impact</th>
                <th>Recommended Fix</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {attentionQueue.map((item) => (
                <tr key={item.id}>
                  <td><span className={`bof-cc-sev bof-cc-sev-${item.severity}`}>{item.severity}</span></td>
                  <td>{item.area}</td>
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
          <ul className="bof-cc-change-list">
            {todayChanges.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}

function toneClass(tone: BreakdownPoint["tone"]): string {
  if (tone === "ok") return "bof-cc-bar-ok";
  if (tone === "warn") return "bof-cc-bar-warn";
  if (tone === "danger") return "bof-cc-bar-danger";
  return "bof-cc-bar-info";
}

function ChartCard({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle: string;
  data: BreakdownPoint[];
}) {
  const total = data.reduce((sum, point) => sum + point.value, 0) || 1;
  return (
    <article className="bof-cc-panel">
      <h3 className="bof-cc-panel-title">{title}</h3>
      <p className="bof-cc-panel-sub">{subtitle}</p>
      <div className="bof-cc-bars">
        {data.map((point) => {
          const width = Math.max(8, (point.value / total) * 100);
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
  const grossMax = Math.max(...rows.map((row) => row.grossPay), 1);
  return (
    <article className="bof-cc-panel bof-cc-panel-wide">
      <h3 className="bof-cc-panel-title">{title}</h3>
      <p className="bof-cc-panel-sub">{subtitle}</p>
      <div className="bof-cc-trend-list">
        {rows.map((row) => (
          <div key={row.label} className="bof-cc-trend-row">
            <div className="bof-cc-trend-head">
              <span>{row.label}</span>
              <strong>{formatUsd(row.netPay)}</strong>
            </div>
            <div className="bof-cc-trend-track">
              <div className="bof-cc-trend-gross" style={{ width: `${(row.grossPay / grossMax) * 100}%` }} />
              <div className="bof-cc-trend-net" style={{ width: `${(row.netPay / grossMax) * 100}%` }} />
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
