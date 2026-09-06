"use client";

import Link from "next/link";
import type { SettlementCommandCenterSummary } from "@/lib/settlement/settlement-operating-display";

type Props = {
  summary: SettlementCommandCenterSummary;
};

function countLabel(value: number | null, available: boolean): string {
  if (!available || value === null) return "Unavailable";
  return String(value);
}

export function SettlementCommandCenterIntelligence({ summary }: Props) {
  return (
    <section className="mb-6 rounded-xl border border-slate-700 bg-slate-900/75 p-5" aria-labelledby="cc-settlement-summary">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-200">Settlement</p>
          <h2 id="cc-settlement-summary" className="mt-1 text-xl font-semibold text-white">
            Settlement operating summary
          </h2>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">{summary.note}</p>
          <p className="mt-1 text-xs text-slate-500">
            Source classes: hold previews AUTHORITATIVE · row counts DERIVED · fleet money UNSUPPORTED. {summary.source}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {summary.actions.map((action) => (
            <Link
              key={`${action.label}-${action.href}`}
              href={action.href}
              className="rounded-lg border border-teal-400/40 px-4 py-2 text-sm font-semibold text-teal-100 hover:bg-teal-950/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
            >
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Open settlement hold rows", value: summary.openHolds, cls: "DERIVED" },
          { label: "Weekly rows with pending/hold/review in stored status", value: summary.pendingWeekly, cls: "DERIVED" },
          { label: "Payroll rows with pending/hold in stored status", value: summary.pendingPayroll, cls: "DERIVED" },
          { label: "Safety Event settlementHold flags", value: summary.safetySettlementHolds, cls: "DERIVED" },
          { label: "Weekly settlement rows", value: summary.weeklyRowCount, cls: "DERIVED" },
          { label: "Payroll rows", value: summary.payrollRowCount, cls: "DERIVED" },
          { label: "Weekly packet flag complete", value: summary.packetCompleteCount, cls: "DERIVED" },
          { label: "Weekly packet flag not marked complete", value: summary.packetNotMarkedCompleteCount, cls: "DERIVED" },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{item.label}</dt>
            <dd className="mt-1 text-2xl font-semibold text-white" aria-label={`${item.label} ${countLabel(item.value, summary.available)}`}>
              {countLabel(item.value, summary.available)}
            </dd>
            <p className="mt-1 text-[11px] text-slate-500">Source class: {item.cls}</p>
          </div>
        ))}
      </dl>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
          <h3 className="text-sm font-semibold text-white">Fleet settlement readiness</h3>
          <p className="mt-2 text-sm text-white" aria-label={`Fleet settlement readiness ${summary.readinessFleet}`}>
            {summary.readinessFleet}
          </p>
          <p className="mt-1 text-xs text-slate-500">{summary.readinessNote} Source class: UNSUPPORTED at fleet.</p>
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
          <h3 className="text-sm font-semibold text-white">Fleet calculation (not summed)</h3>
          <ul className="mt-2 grid gap-1 text-sm text-slate-300">
            <li>Gross: <strong className="text-white">{summary.fleetGross}</strong></li>
            <li>Adjustments: <strong className="text-white">{summary.fleetAdjustments}</strong></li>
            <li>Deductions: <strong className="text-white">{summary.fleetDeductions}</strong></li>
            <li>Reimbursements: <strong className="text-white">{summary.fleetReimbursements}</strong></li>
            <li>Advances: <strong className="text-white">{summary.fleetAdvances}</strong></li>
            <li>Net: <strong className="text-white">{summary.fleetNet}</strong></li>
          </ul>
          <p className="mt-1 text-xs text-slate-500">{summary.calculationNote} Source class: UNSUPPORTED.</p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-700 bg-slate-950/50 p-3">
        <h3 className="text-sm font-semibold text-white">Packet / evidence / workflow</h3>
        <p className="mt-2 text-xs text-slate-400">{summary.packetNote}</p>
        <p className="mt-2 text-xs text-slate-400">{summary.evidenceNote}</p>
        <p className="mt-2 text-xs text-slate-400">{summary.workflowNote}</p>
        <p className="mt-2 text-xs text-slate-400">{summary.payrollBoundary}</p>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
          <h3 className="text-sm font-semibold text-white">Stored weekly settlement statuses</h3>
          <p className="mt-1 text-xs text-slate-500">DERIVED counts of exact Weekly_Settlements.settlementStatus strings. Labels are not remapped to PAID.</p>
          {!summary.available || summary.weeklyStatusBuckets.length === 0 ? (
            <p className="mt-2 text-sm text-slate-300">Unavailable / no weekly rows in this session.</p>
          ) : (
            <ul className="mt-2 grid gap-1">
              {summary.weeklyStatusBuckets.map((bucket) => (
                <li key={`weekly-${bucket.status}`} className="flex items-center justify-between gap-3 text-sm text-slate-200">
                  <span>{bucket.status}</span>
                  <span className="font-semibold" aria-label={`${bucket.status} ${bucket.count}`}>
                    {bucket.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-lg border border-slate-700 bg-slate-950/50 p-3">
          <h3 className="text-sm font-semibold text-white">Stored payroll row statuses</h3>
          <p className="mt-1 text-xs text-slate-500">DERIVED counts of exact PayrollSettlementDetail.status strings. Payroll status is not driver payment confirmation.</p>
          {!summary.available || summary.payrollStatusBuckets.length === 0 ? (
            <p className="mt-2 text-sm text-slate-300">Unavailable / no payroll rows in this session.</p>
          ) : (
            <ul className="mt-2 grid gap-1">
              {summary.payrollStatusBuckets.map((bucket) => (
                <li key={`payroll-${bucket.status}`} className="flex items-center justify-between gap-3 text-sm text-slate-200">
                  <span>{bucket.status}</span>
                  <span className="font-semibold" aria-label={`${bucket.status} ${bucket.count}`}>
                    {bucket.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-semibold text-white">Open settlement holds</h3>
        <p className="mt-1 text-xs text-slate-500">AUTHORITATIVE copies of workbook Settlement Holds that are not resolved/closed/released. Preview is capped.</p>
        {summary.holdPreviews.length === 0 ? (
          <p className="mt-2 text-sm text-slate-300">
            {summary.available ? "No open Settlement Holds rows in the workbook." : "Unavailable until the operational workbook loads."}
          </p>
        ) : (
          <ul className="mt-2 grid gap-3">
            {summary.holdPreviews.map((row) => (
              <li key={row.id} className="rounded-lg border border-slate-700 bg-slate-950/50 p-3 text-sm text-slate-300">
                <p className="text-white">
                  <span className="font-semibold">{row.kind.replaceAll("_", " ")}</span>
                  {" · "}
                  {row.category}
                  {" · "}
                  <span aria-label={`Hold status ${row.status}`}>{row.status}</span>
                </p>
                <p className="mt-1"><strong className="text-slate-200">Problem:</strong> {row.problem}</p>
                <p className="mt-1"><strong className="text-slate-200">Owner:</strong> {row.owner}</p>
                <p className="mt-1"><strong className="text-slate-200">Why it matters:</strong> {row.whyItMatters}</p>
                <p className="mt-1">
                  <strong className="text-slate-200">Required action:</strong>{" "}
                  {row.href ? (
                    <Link className="text-teal-200 underline underline-offset-2" href={row.href}>
                      {row.requiredAction}
                    </Link>
                  ) : (
                    row.requiredAction
                  )}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-semibold text-white">Safety-related settlement holds</h3>
        <p className="mt-1 text-xs text-slate-500">AUTHORITATIVE only where Safety Event settlementHold is stored. Other Safety issues are not converted into holds here.</p>
        {summary.safetyHoldPreviews.length === 0 ? (
          <p className="mt-2 text-sm text-slate-300">
            {summary.available ? "No Safety Event settlementHold flags in the workbook." : "Unavailable until the operational workbook loads."}
          </p>
        ) : (
          <ul className="mt-2 grid gap-3">
            {summary.safetyHoldPreviews.map((row) => (
              <li key={row.id} className="rounded-lg border border-slate-700 bg-slate-950/50 p-3 text-sm text-slate-300">
                <p className="text-white font-semibold">{row.problem}</p>
                <p className="mt-1"><strong className="text-slate-200">Owner:</strong> {row.owner}</p>
                <p className="mt-1">{row.whyItMatters}</p>
                {row.href ? (
                  <p className="mt-1">
                    <Link className="text-teal-200 underline underline-offset-2" href={row.href}>
                      {row.requiredAction}
                    </Link>
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
