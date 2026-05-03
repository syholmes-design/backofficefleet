"use client";

import { useMemo } from "react";
import type { BreakdownPoint, OwnerAttentionItem } from "@/lib/dashboard-insights";
import type { PayrollMonthlyTrend } from "@/lib/demo-trends";

function toneColor(tone: BreakdownPoint["tone"]): string {
  switch (tone) {
    case "danger":
      return "#fb7185";
    case "warn":
      return "#fbbf24";
    case "info":
      return "#38bdf8";
    default:
      return "#2dd4bf";
  }
}

function buildFleetRiskGradient(points: BreakdownPoint[]): string {
  const safe = points.map((p) => ({ ...p, value: Math.max(0, p.value) }));
  const total = safe.reduce((s, p) => s + p.value, 0);
  if (total <= 0) return "conic-gradient(#334155 0deg 360deg)";
  let angle = 0;
  const parts: string[] = [];
  for (const p of safe) {
    const deg = (p.value / total) * 360;
    const start = angle;
    const end = angle + deg;
    parts.push(`${toneColor(p.tone)} ${start}deg ${end}deg`);
    angle = end;
  }
  return `conic-gradient(${parts.join(", ")})`;
}

function queueRowClass(severity: OwnerAttentionItem["severity"] | undefined, filled: boolean): string {
  const base = "bof-dashboard-hero-mock__qrow";
  if (!filled) return `${base} ${base}--empty`;
  if (severity === "critical") return `${base} ${base}--critical`;
  if (severity === "high") return `${base} ${base}--high`;
  return `${base} ${base}--medium`;
}

export type DashboardHeroMockupProps = {
  activeLoads: number;
  loadsAtRisk: number;
  driversReady: number;
  settlementHolds: number;
  fleetRisk: BreakdownPoint[];
  payrollTrend: PayrollMonthlyTrend[];
  queuePreview: OwnerAttentionItem[];
};

export function DashboardHeroMockup({
  activeLoads,
  loadsAtRisk,
  driversReady,
  settlementHolds,
  fleetRisk,
  payrollTrend,
  queuePreview,
}: DashboardHeroMockupProps) {
  const donutGradient = useMemo(() => buildFleetRiskGradient(fleetRisk), [fleetRisk]);
  const months = useMemo(() => payrollTrend.slice(-6), [payrollTrend]);
  const maxGross = useMemo(() => Math.max(...months.map((m) => m.grossPay), 1), [months]);
  const maxNet = useMemo(() => Math.max(...months.map((m) => m.netPay), 1), [months]);

  const paddedQueue = useMemo<(OwnerAttentionItem | null)[]>(() => {
    const rows: (OwnerAttentionItem | null)[] = queuePreview.slice(0, 4);
    while (rows.length < 4) rows.push(null);
    return rows;
  }, [queuePreview]);

  const netLinePoints = useMemo(() => {
    if (months.length === 0) return "";
    if (months.length === 1) {
      const y = 38 - (months[0]!.netPay / maxNet) * 34;
      return `0,${y} 100,${y}`;
    }
    return months
      .map((m, i) => {
        const x = (i / (months.length - 1)) * 100;
        const y = 38 - (m.netPay / maxNet) * 34;
        return `${x},${y}`;
      })
      .join(" ");
  }, [months, maxNet]);

  return (
    <div className="bof-dashboard-hero-mock" aria-hidden="true">
      <div className="bof-dashboard-hero-mock__metrics">
        <div className="bof-dashboard-hero-mock__metric">
          <span className="bof-dashboard-hero-mock__metric-label">Active Loads</span>
          <strong className="bof-dashboard-hero-mock__metric-value">{activeLoads}</strong>
        </div>
        <div className="bof-dashboard-hero-mock__metric">
          <span className="bof-dashboard-hero-mock__metric-label">Loads at Risk</span>
          <strong className="bof-dashboard-hero-mock__metric-value">{loadsAtRisk}</strong>
        </div>
        <div className="bof-dashboard-hero-mock__metric">
          <span className="bof-dashboard-hero-mock__metric-label">Drivers Ready</span>
          <strong className="bof-dashboard-hero-mock__metric-value">{driversReady}</strong>
        </div>
        <div className="bof-dashboard-hero-mock__metric">
          <span className="bof-dashboard-hero-mock__metric-label">Settlement Holds</span>
          <strong className="bof-dashboard-hero-mock__metric-value">{settlementHolds}</strong>
        </div>
      </div>

      <div className="bof-dashboard-hero-mock__mid">
        <div className="bof-dashboard-hero-mock__donutBlock">
          <p className="bof-dashboard-hero-mock__blockTitle">Fleet Risk Breakdown</p>
          <div className="bof-dashboard-hero-mock__donutRow">
            <div className="bof-dashboard-hero-mock__donut">
              <div
                className="bof-dashboard-hero-mock__donutRing"
                style={{ background: donutGradient }}
              />
              <div className="bof-dashboard-hero-mock__donutHole" />
            </div>
            <ul className="bof-dashboard-hero-mock__legend">
              {fleetRisk.map((p) => (
                <li key={p.label} className="bof-dashboard-hero-mock__legendItem">
                  <span
                    className="bof-dashboard-hero-mock__legendSwatch"
                    style={{ background: toneColor(p.tone) }}
                  />
                  <span className="bof-dashboard-hero-mock__legendLabel">{p.label}</span>
                  <span className="bof-dashboard-hero-mock__legendValue">{p.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bof-dashboard-hero-mock__trendBlock">
          <p className="bof-dashboard-hero-mock__blockTitle">6-Month Revenue Trend</p>
          <div className="bof-dashboard-hero-mock__trendChart">
            <svg
              className="bof-dashboard-hero-mock__trendLine"
              viewBox="0 0 100 40"
              preserveAspectRatio="none"
            >
              <polyline
                fill="none"
                stroke="rgba(94, 234, 212, 0.95)"
                strokeWidth="1.25"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                points={netLinePoints}
              />
            </svg>
            <div className="bof-dashboard-hero-mock__bars">
              {months.map((m) => (
                <div key={m.month} className="bof-dashboard-hero-mock__barCol">
                  <div
                    className="bof-dashboard-hero-mock__barFill"
                    style={{ height: `${Math.max(8, (m.grossPay / maxGross) * 100)}%` }}
                    title={`${m.month} gross ${m.grossPay}`}
                  />
                  <span className="bof-dashboard-hero-mock__barLab">{m.month.split(" ")[0]}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="bof-dashboard-hero-mock__trendHint">Bars: gross pay · Line: net pay</p>
        </div>
      </div>

      <div className="bof-dashboard-hero-mock__queueBlock">
        <p className="bof-dashboard-hero-mock__blockTitle">Owner&apos;s Attention Queue</p>
        <ul className="bof-dashboard-hero-mock__queue">
          {paddedQueue.map((item, idx) => (
            <li
              key={item?.id ?? `placeholder-${idx}`}
              className={queueRowClass(item?.severity, Boolean(item))}
            >
              {item ? (
                <>
                  <span className="bof-dashboard-hero-mock__qseverity">{item.severity}</span>
                  <span className="bof-dashboard-hero-mock__qissue">{item.issue}</span>
                  <span className="bof-dashboard-hero-mock__qmeta">{item.area}</span>
                </>
              ) : (
                <span className="bof-dashboard-hero-mock__qempty">No additional alerts in preview.</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
