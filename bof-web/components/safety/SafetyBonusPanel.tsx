"use client";

import Link from "next/link";
import type { DriverSafetyBonusRow } from "@/lib/safety-bonus";
import { dispatchImpactLabel } from "@/lib/safety-command-feed";
import type { BofData } from "@/lib/load-bof-data";

function tierChip(status: DriverSafetyBonusRow["eligibilityStatus"]) {
  if (status === "eligible") return "bg-emerald-900/40 text-emerald-200 ring-1 ring-emerald-700/50";
  if (status === "at_risk") return "bg-amber-900/35 text-amber-200 ring-1 ring-amber-700/45";
  return "bg-rose-900/40 text-rose-200 ring-1 ring-rose-800/50";
}

export function SafetyBonusPanel({ data, rows }: { data: BofData; rows: DriverSafetyBonusRow[] }) {
  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/35 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-100">Safety bonus &amp; protocol compliance</h2>
        <span className="rounded bg-slate-950 px-2 py-0.5 text-[10px] text-slate-500">Derived from scorecard + proof manifests</span>
      </div>
      <div className="overflow-x-auto rounded border border-slate-800">
        <table className="w-full min-w-[960px] border-collapse text-left text-xs">
          <thead className="bg-slate-900/90 text-[10px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="border-b border-slate-800 px-2 py-2 font-medium">Driver</th>
              <th className="border-b border-slate-800 px-2 py-2 font-medium">Eligibility</th>
              <th className="border-b border-slate-800 px-2 py-2 font-medium text-right">Bonus ($)</th>
              <th className="border-b border-slate-800 px-2 py-2 font-medium text-right">Pre-trip %</th>
              <th className="border-b border-slate-800 px-2 py-2 font-medium text-right">POD %</th>
              <th className="border-b border-slate-800 px-2 py-2 font-medium text-right">Seal %</th>
              <th className="border-b border-slate-800 px-2 py-2 font-medium text-right">HOS %</th>
              <th className="border-b border-slate-800 px-2 py-2 font-medium text-right">OOS</th>
              <th className="border-b border-slate-800 px-2 py-2 font-medium text-right">Open signals</th>
              <th className="border-b border-slate-800 px-2 py-2 font-medium">Dispatch impact</th>
              <th className="border-b border-slate-800 px-2 py-2 font-medium">Action</th>
            </tr>
          </thead>
          <tbody className="text-slate-200">
            {rows.map((r) => (
              <tr key={r.driverId} className="border-b border-slate-800/80 hover:bg-slate-950/40">
                <td className="px-2 py-2">
                  <Link href={`/drivers/${r.driverId}/safety`} className="font-medium text-teal-300 hover:text-teal-200">
                    {r.driverName}
                  </Link>
                  <div className="font-mono text-[10px] text-slate-500">{r.driverId}</div>
                </td>
                <td className="px-2 py-2">
                  <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-semibold capitalize ${tierChip(r.eligibilityStatus)}`}>
                    {r.eligibilityStatus.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-2 py-2 text-right font-mono text-emerald-300">{r.bonusScore.toFixed(0)}</td>
                <td className="px-2 py-2 text-right font-mono">{r.preTripCompliancePct}%</td>
                <td className="px-2 py-2 text-right font-mono">{r.podCertificationPct}%</td>
                <td className="px-2 py-2 text-right font-mono">{r.sealProtocolPct}%</td>
                <td className="px-2 py-2 text-right font-mono">{r.hosCompliancePct}%</td>
                <td className="px-2 py-2 text-right font-mono">{r.oosEvents}</td>
                <td className="px-2 py-2 text-right font-mono text-amber-200/90">{r.openSafetySignals}</td>
                <td className="px-2 py-2 text-[11px] text-slate-300">{dispatchImpactLabel(data, r.driverId)}</td>
                <td className="px-2 py-2 text-[10px] text-slate-400">{r.recommendedAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
