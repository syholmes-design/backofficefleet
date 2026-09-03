"use client";

import { useEffect, useState } from "react";

type ProcessPayload = {
  dataAuthority: string;
  historyStatus: string;
  historyStatusLabel: string;
  loadIdentity: { id: string; customerName: string; origin: string; destination: string; status: string; driverId: string | null; equipmentId: string | null };
  eventLogSufficiency: { sufficientForSingleTrace: boolean; sufficientForConformance: boolean; sufficientForVariants: boolean; reason: string };
  orderedEvents: Array<{ id: string; activity: string; timestamp: string; actor: string; source: string; processStage: string; status: string | null; durationToNextEvent: string | null; relatedException?: string | null; relatedCorrectiveAction?: string | null }>;
  referenceProcess: { label: string; note: string; activities: string[] };
  conformance: { conformanceStatus: string; deviationCount: number; deviations: Array<{ type: string; reason: string; businessImpact: string; nextInvestigationAction: string }>; actualPath: string[]; referencePath: string[]; variant: string; throughputTime: string | null; nextRequiredAction: string };
  processDiscovery: { status: string };
  variants: { status: string };
  throughput: { reason: string; loadCreatedToDelivery: string | null; loadCreatedToPod: string | null; podToInvoice: string | null; invoiceToSettlement: string | null };
  bottlenecks: { status: string };
};

function formatActivity(value: string) {
  return value.replace(/_/g, " ");
}

function badgeClass(status: string) {
  if (status === "CONFORMING") return "border-emerald-300 bg-emerald-100 text-emerald-800";
  if (status === "NON_CONFORMING") return "border-rose-300 bg-rose-100 text-rose-800";
  return "border-amber-300 bg-amber-100 text-amber-900";
}

function formatTime(value: string) {
  return new Date(value).toLocaleString("en-US", { timeZone: "UTC" });
}

export function LoadProcessIntelligencePanel({ loadId }: { loadId: string }) {
  const [payload, setPayload] = useState<ProcessPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadProcess() {
      try {
        const response = await fetch(`/api/load-process-intelligence/${encodeURIComponent(loadId)}`, { cache: "no-store" });
        const body = await response.json();
        if (cancelled) return;
        if (!response.ok) {
          setError(body?.error ?? "Unable to load process intelligence");
          return;
        }
        setPayload(body as ProcessPayload);
      } catch {
        if (!cancelled) setError("Unable to load process intelligence");
      }
    }
    void loadProcess();
    return () => {
      cancelled = true;
    };
  }, [loadId]);

  if (error) return <p className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{error}</p>;
  if (!payload) return <p className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">Loading load process intelligence...</p>;

  const firstDeviation = payload.conformance.deviations[0];
  const hasActualHistory = payload.historyStatus === "ACTUAL_EVENT_HISTORY_AVAILABLE";

  return (
    <section className="mt-6 overflow-x-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-teal-700">Process intelligence</p>
          <h2 className="mt-1 break-words text-2xl font-black text-slate-950">Expected Process vs Actual Process</h2>
          <p className="mt-2 text-sm text-slate-600">Current State is separate from Actual Process history, Expected Process, Process Variant, Conformance, Deviation, Exception, and Corrective Action.</p>
        </div>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${hasActualHistory ? "border-teal-300 bg-teal-50 text-teal-800" : "border-amber-300 bg-amber-100 text-amber-900"}`}>
            {payload.historyStatusLabel}
          </span>
          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${badgeClass(payload.conformance.conformanceStatus)}`}>
            {formatActivity(payload.conformance.conformanceStatus)}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Load / case</p><p className="mt-1 break-words font-black text-slate-950">{payload.loadIdentity.id}</p><p className="mt-1 break-words text-xs text-slate-600">{payload.loadIdentity.customerName}</p><p className="mt-1 text-xs text-slate-600">Current readiness/state: {payload.loadIdentity.status}</p></div>
        <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Expected path</p><p className="mt-1 text-sm font-bold text-slate-950">{payload.referenceProcess.activities.length} activities</p><p className="mt-1 text-xs text-slate-600">Expected model, not historical truth.</p></div>
        <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Actual path</p><p className="mt-1 text-sm font-bold text-slate-950">{payload.orderedEvents.length} persisted events</p><p className="mt-1 break-words text-xs text-slate-600">{payload.eventLogSufficiency.reason}</p></div>
        <div className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Next action</p><p className="mt-1 break-words text-sm font-bold text-slate-950">{payload.conformance.nextRequiredAction}</p></div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <article className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Expected process</p>
          <p className="mt-2 break-words text-sm leading-6 text-slate-700">{payload.referenceProcess.activities.map(formatActivity).join(" -> ")}</p>
        </article>
        <article className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Actual process</p>
          <p className="mt-2 break-words text-sm leading-6 text-slate-700">{hasActualHistory ? payload.conformance.actualPath.map(formatActivity).join(" -> ") : "INSUFFICIENT EVENT HISTORY"}</p>
        </article>
      </div>

      {hasActualHistory ? (
        <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4" open>
          <summary className="cursor-pointer text-[10px] font-black uppercase tracking-wider text-slate-500">Event trace detail</summary>
          <ol className="mt-3 grid gap-2">
            {payload.orderedEvents.map((event) => (
              <li key={event.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                <p className="font-black text-slate-950">{formatActivity(event.activity)}</p>
                <p className="mt-1">{formatTime(event.timestamp)} UTC · Actor {event.actor} · Source {event.source}</p>
                <p className="mt-1">Result: {event.status ?? "Not recorded"} · Next dwell: {event.durationToNextEvent ?? "End of trace"}</p>
                {event.relatedException ? <p className="mt-1 text-amber-700">Exception: {event.relatedException}</p> : null}
                {event.relatedCorrectiveAction ? <p className="mt-1 text-sky-700">Corrective Action: {event.relatedCorrectiveAction}</p> : null}
              </li>
            ))}
          </ol>
        </details>
      ) : null}

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <article className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Process variant</p><p className="mt-2 break-words text-sm text-slate-700">{payload.variants.status}</p></article>
        <article className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Throughput</p><p className="mt-2 break-words text-sm text-slate-700">{hasActualHistory ? (payload.conformance.throughputTime ?? payload.throughput.reason) : "INSUFFICIENT EVENT HISTORY"}</p></article>
        <article className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Bottleneck analysis</p><p className="mt-2 break-words text-sm text-slate-700">{payload.bottlenecks.status}</p></article>
      </div>

      <div className="mt-4 min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Deviation summary</p>
        {!hasActualHistory ? (
          <p className="mt-2 text-sm text-slate-700">INSUFFICIENT EVENT HISTORY. No persisted operating events exist to support a deviation claim.</p>
        ) : firstDeviation ? (
          <div className="mt-2 break-words text-sm text-slate-700">
            <p><strong className="text-slate-950">{formatActivity(firstDeviation.type)}:</strong> {firstDeviation.reason}</p>
            <p className="mt-1"><strong className="text-slate-950">Business impact:</strong> {firstDeviation.businessImpact}</p>
            <p className="mt-1"><strong className="text-slate-950">Corrective action:</strong> {firstDeviation.nextInvestigationAction}</p>
          </div>
        ) : <p className="mt-2 text-sm text-slate-700">No deviations detected from persisted event data.</p>}
      </div>
    </section>
  );
}