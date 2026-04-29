"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AlertOctagon, FileWarning, ShieldAlert, UserX } from "lucide-react";
import { formatExposure } from "./safety-ui";
import {
  getAtRiskSafetyDrivers,
  getSafetyEvidenceByDriverId,
  getSafetyScorecardRows,
  getSafetyScorecardSummary,
  getSafetyViolationActions,
  type SafetyPerformanceTier,
} from "@/lib/safety-scorecard";
import { getSafetyMonthlyTrend } from "@/lib/demo-trends";

export function SafetyDashboardScreen() {
  const safetyScorecardRows = useMemo(() => getSafetyScorecardRows(), []);
  const safetyScoreSummary = useMemo(() => getSafetyScorecardSummary(), []);
  const atRiskSafetyDrivers = useMemo(() => getAtRiskSafetyDrivers(), []);
  const safetyViolationActions = useMemo(() => getSafetyViolationActions(), []);
  const safetyMonthlyTrend = useMemo(() => getSafetyMonthlyTrend(), []);
  const evidenceByDriverId = useMemo(() => {
    const out = new Map<string, ReturnType<typeof getSafetyEvidenceByDriverId>>();
    for (const row of safetyScorecardRows) out.set(row.driverId, getSafetyEvidenceByDriverId(row.driverId));
    return out;
  }, [safetyScorecardRows]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 p-5">
      <header>
        <h1 className="text-lg font-semibold tracking-tight text-white">
          Safety &amp; Compliance
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">
          Review driver safety status, HOS compliance, OOS violations, asset inspection
          results, cargo exposure, safety bonuses, and required actions.
        </p>
      </header>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-200">
          Driver Safety Metrics
        </h2>
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
            <thead className="bg-slate-900/90 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="border-b border-slate-800 px-3 py-2 font-medium">Driver</th>
                <th className="border-b border-slate-800 px-3 py-2 font-medium">Driver ID</th>
                <th className="border-b border-slate-800 px-3 py-2 font-medium">OOS Violations</th>
                <th className="border-b border-slate-800 px-3 py-2 font-medium">HOS Compliance</th>
                <th className="border-b border-slate-800 px-3 py-2 font-medium">Maintenance Photos</th>
                <th className="border-b border-slate-800 px-3 py-2 font-medium">Tire/Asset Insp.</th>
                <th className="border-b border-slate-800 px-3 py-2 font-medium">Cargo Damage</th>
                <th className="border-b border-slate-800 px-3 py-2 font-medium">Safety Bonus</th>
                <th className="border-b border-slate-800 px-3 py-2 font-medium">Performance Tier</th>
                <th className="border-b border-slate-800 px-3 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="text-slate-200">
              {safetyScorecardRows.map((row) => (
                <tr key={row.driverId} className="border-b border-slate-800/80 hover:bg-slate-900/60">
                  <td className="px-3 py-2 text-xs">
                    <Link href={`/drivers/${row.driverId}/profile`} className="font-medium text-teal-300 hover:text-teal-200">
                      {row.driverName}
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-slate-500">{row.driverId}</td>
                  <td className="px-3 py-2 text-xs">{row.oosViolations}</td>
                  <td className={["px-3 py-2 text-xs font-medium", row.hosCompliancePct < 90 ? "text-rose-300" : "text-slate-200"].join(" ")}>
                    {row.hosCompliancePct}%
                  </td>
                  <td className="px-3 py-2 text-xs">{row.maintenancePhotosDate}</td>
                  <td className="px-3 py-2 text-xs">
                    <span
                      className={[
                        "inline-flex rounded px-2 py-0.5 text-[11px] font-semibold",
                        row.tireAssetInspection === "Fail"
                          ? "bg-rose-900/40 text-rose-300 ring-1 ring-rose-700/60"
                          : "bg-emerald-900/35 text-emerald-300 ring-1 ring-emerald-700/50",
                      ].join(" ")}
                    >
                      {row.tireAssetInspection}
                    </span>
                  </td>
                  <td className={["px-3 py-2 font-mono text-xs", row.cargoDamageUsd > 0 ? "font-semibold text-rose-300" : "text-slate-400"].join(" ")}>
                    {formatExposure(row.cargoDamageUsd)}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-emerald-300">
                    {formatExposure(row.safetyBonusUsd)}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <TierChip tier={row.performanceTier} />
                  </td>
                  <td className="px-3 py-2 text-xs">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/drivers/${row.driverId}/safety`}
                        className="inline-flex rounded border border-teal-700/50 bg-teal-900/25 px-2 py-1 text-[11px] font-semibold text-teal-200 hover:bg-teal-900/40"
                      >
                        Open Safety
                      </Link>
                      {(evidenceByDriverId.get(row.driverId)?.length ?? 0) > 0 && (
                        <a
                          href={`#evidence-${row.driverId}`}
                          className="inline-flex rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-800"
                        >
                          Evidence ({evidenceByDriverId.get(row.driverId)!.length})
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              <tr className="border-b border-slate-800/80">
                <td className="px-3 py-2 text-xs text-slate-400" colSpan={10}>
                  DRV-012 (Robert Johnson): No safety score on file.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-200">
            At-Risk Drivers / Required Actions
          </h2>
          <ul className="space-y-2 text-xs">
            {atRiskSafetyDrivers.map((row) => (
              <li key={row.driverId} className="rounded border border-rose-900/40 bg-rose-950/20 px-3 py-2">
                <div className="font-semibold text-rose-200">{row.driverName}</div>
                <div className="mt-0.5 text-slate-300">
                  {row.driverId === "DRV-004"
                    ? "Failed tire/asset inspection and cargo damage."
                    : "HOS compliance below standard, failed tire/asset inspection, and high cargo damage."}
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="mb-2 text-sm font-semibold text-slate-200">
            Recent Violations &amp; Required Actions
          </h2>
          <ul className="space-y-2 text-xs">
            {safetyViolationActions.map((row) => (
              <li key={row.driverId} className="rounded border border-slate-800 bg-slate-900/40 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-100">
                    {row.driverShortName} — {row.code?.replace(/[()]/g, "")}
                  </span>
                  <span
                    className={[
                      "inline-flex rounded px-2 py-0.5 text-[11px] font-semibold",
                      row.severity === "High"
                        ? "bg-rose-900/40 text-rose-300 ring-1 ring-rose-700/50"
                        : "bg-amber-900/30 text-amber-300 ring-1 ring-amber-700/40",
                    ].join(" ")}
                  >
                    {row.severity}
                  </span>
                </div>
                <div className="mt-1 text-slate-400">{row.action}</div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-200">Safety evidence</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          {["DRV-004", "DRV-008"].map((driverId) => {
            const evidence = evidenceByDriverId.get(driverId) ?? [];
            if (evidence.length === 0) return null;
            return (
              <div
                key={driverId}
                id={`evidence-${driverId}`}
                className="rounded-lg border border-slate-800 bg-slate-900/35 p-3"
              >
                <p className="text-xs font-semibold text-slate-100">
                  {evidence[0]?.driverName} ({driverId})
                </p>
                <div className="mt-2 space-y-2">
                  {evidence.map((item) => (
                    <div
                      key={item.id}
                      className="rounded border border-slate-800 bg-slate-950/50 px-2 py-2 text-xs"
                    >
                      <EvidenceThumb url={item.url} alt={item.label} />
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-100">{item.label}</span>
                        <span
                          className={[
                            "inline-flex rounded px-2 py-0.5 text-[10px] font-semibold",
                            item.severity === "high"
                              ? "bg-rose-900/40 text-rose-300 ring-1 ring-rose-700/50"
                              : "bg-amber-900/30 text-amber-300 ring-1 ring-amber-700/40",
                          ].join(" ")}
                        >
                          {item.severity === "high" ? "High" : "Medium"}
                        </span>
                      </div>
                      <p className="mt-1 text-slate-400">{item.note}</p>
                      <p className="mt-1 text-[10px] text-slate-500">
                        {item.date}
                        {item.location ? ` · ${item.location}` : ""}
                      </p>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex text-[11px] font-semibold text-teal-300 hover:text-teal-200"
                      >
                        Open evidence
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          label="Scored Drivers"
          value={safetyScoreSummary.scoredDrivers}
          icon={<ShieldAlert className="h-4 w-4 text-teal-500" />}
        />
        <KpiCard
          label="Elite Tier %"
          value={`${Math.round(safetyScoreSummary.eliteTierPct)}%`}
          icon={<AlertOctagon className="h-4 w-4 text-orange-400" />}
        />
        <KpiCard
          label="At-Risk Drivers"
          value={safetyScoreSummary.atRiskDrivers}
          icon={<FileWarning className="h-4 w-4 text-amber-400" />}
        />
        <KpiCard
          label="Cargo Damage Exposure"
          value={formatExposure(safetyScoreSummary.cargoDamageExposureUsd)}
          icon={<UserX className="h-4 w-4 text-red-400" />}
        />
        <KpiCard
          label="Safety Bonus Earned"
          value={formatExposure(safetyScoreSummary.safetyBonusEarnedUsd)}
          icon={<ShieldAlert className="h-4 w-4 text-rose-400" />}
        />
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-100">
            6-Month Safety Trend
          </h2>
          <span className="rounded bg-slate-900 px-2 py-0.5 text-[11px] text-slate-400">
            Demo trend data
          </span>
        </div>
        <div className="overflow-x-auto rounded border border-slate-800">
          <table className="w-full min-w-[860px] border-collapse text-left text-xs">
            <thead className="bg-slate-900/90 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="border-b border-slate-800 px-2 py-2 font-medium">Month</th>
                <th className="border-b border-slate-800 px-2 py-2 font-medium">Safety Score</th>
                <th className="border-b border-slate-800 px-2 py-2 font-medium">Avg HOS</th>
                <th className="border-b border-slate-800 px-2 py-2 font-medium">At-Risk Drivers</th>
                <th className="border-b border-slate-800 px-2 py-2 font-medium">OOS Violations</th>
                <th className="border-b border-slate-800 px-2 py-2 font-medium">Cargo Damage Exposure</th>
                <th className="border-b border-slate-800 px-2 py-2 font-medium">Safety Bonus Paid</th>
              </tr>
            </thead>
            <tbody className="text-slate-200">
              {safetyMonthlyTrend.map((row) => (
                <tr key={row.month} className="border-b border-slate-800/80">
                  <td className="px-2 py-1.5 font-medium text-slate-100">{row.month}</td>
                  <td className="px-2 py-1.5 font-mono text-teal-300">{row.safetyScore}</td>
                  <td className="px-2 py-1.5 font-mono">{row.avgHosCompliance}%</td>
                  <td className="px-2 py-1.5 font-mono">{row.atRiskDrivers}</td>
                  <td className="px-2 py-1.5 font-mono">{row.oosViolations}</td>
                  <td className="px-2 py-1.5 font-mono text-rose-300">
                    {formatExposure(row.cargoDamageExposure)}
                  </td>
                  <td className="px-2 py-1.5 font-mono text-emerald-300">
                    {formatExposure(row.safetyBonusPaid)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/20 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Source details
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Driver safety metrics are sourced from the BOF safety scorecard rows and
          current demo safety violations data.
        </p>
      </section>
    </div>
  );
}

function EvidenceThumb({ url, alt }: { url: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <div className="mb-2 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] text-slate-400">
        Evidence image unavailable
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className="mb-2 h-28 w-full rounded border border-slate-800 object-cover"
      onError={() => setFailed(true)}
    />
  );
}

function TierChip({ tier }: { tier: SafetyPerformanceTier }) {
  const cls =
    tier === "Elite"
      ? "bg-teal-900/35 text-teal-300 ring-1 ring-teal-700/50"
      : tier === "Standard"
        ? "bg-amber-900/30 text-amber-300 ring-1 ring-amber-700/40"
        : "bg-rose-900/40 text-rose-300 ring-1 ring-rose-700/55";
  return <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{tier}</span>;
}

function KpiCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{value}</p>
      {sub && <p className="mt-1 text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}
