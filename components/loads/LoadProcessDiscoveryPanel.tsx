"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type DiscoveryPayload = {
  datasetLabel: string;
  caseSummary: {
    totalCases: number;
    sufficientHistoryCases: number;
    partialHistoryCases: number;
    noHistoryCases: number;
    eligibleForStatistics: number;
    sampleSupportsPercentages: boolean;
    percentageNote: string | null;
  };
  variants: {
    status: string;
    uniqueVariantCount: number;
    mostCommonVariant: null | { variantId: string; caseCount: number; percentageOfCases: number | null; percentageNote: string | null; activitySequence: string[]; cases: Array<{ loadId: string; referenceNumber: string | null; throughputTime: string | null; conformanceStatus: string }> };
    rows: Array<{ variantId: string; caseCount: number; percentageOfCases: number | null; percentageNote: string | null; averageThroughputTime: string | null; conformanceSummary: { conformingCases: number; nonConformingCases: number }; topDeviations: Array<{ deviationType: string; count: number }>; cases: Array<{ loadId: string; referenceNumber: string | null; throughputTime: string | null; conformanceStatus: string }>; activitySequence: string[] }>;
  };
  recurringDeviations: Array<{ deviationType: string; count: number; affectedCases: string[]; affectedPercentage: number | null; associatedVariants: string[] }>;
  conformanceSummary: { conformingCases: number; nonConformingCases: number; insufficientCases: number; conformingPercentage: number | null; percentageNote: string | null };
  throughputAnalysis: Record<string, { average: string | null; median: string | null; minimum: string | null; maximum: string | null; caseCount: number; note?: string }>;
  bottlenecks: { status: string; rows: Array<{ stage: string; averageDuration: string; affectedCases: string[]; variantAssociation: string[]; deviationFrequency: number }> };
  processGraph: { nodes: Array<{ id: string; label: string; activityFrequency: number; variantMembership: string[] }>; edges: Array<{ from: string; to: string; transitionCount: number; caseCount: number; variantCount: number }> };
  transitionAnalysis: Array<{ from: string; to: string; transitionCount: number; caseCount: number; variantCount: number; unexpected: boolean }>;
  nextRequiredAction: string;
};

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function describeVariant(sequence: string[]) {
  const hasRework = sequence.includes("EXCEPTION_OPENED") || sequence.filter((item) => item === "DISPATCH_ASSIGNED").length > 1 || sequence.filter((item) => item === "DRIVER_LINKED").length > 1;
  const hasSettlement = sequence.includes("SETTLEMENT_APPROVED") || sequence.includes("SETTLEMENT_CLOSED");
  if (hasRework) return "Reassignment / rework path";
  if (!hasSettlement) return "Incomplete / blocked path";
  return "Normal load path";
}

function processSignal(payload: DiscoveryPayload) {
  const repeat = payload.recurringDeviations.find((item) => item.deviationType === "ACTIVITY_REPEAT");
  const outOfOrder = payload.recurringDeviations.find((item) => item.deviationType === "OUT_OF_ORDER");
  const incomplete = payload.caseSummary.partialHistoryCases + payload.caseSummary.noHistoryCases;
  if (repeat && repeat.affectedCases.length > 1) return { title: "Recurring rework", detail: `${repeat.affectedCases.length} cases include repeated activity.`, cases: repeat.affectedCases };
  if (outOfOrder && outOfOrder.affectedCases.length > 1) return { title: "Out-of-order activity", detail: `${outOfOrder.affectedCases.length} cases include out-of-order process events.`, cases: outOfOrder.affectedCases };
  if (incomplete > 0) return { title: "Incomplete process", detail: `${incomplete} case has partial or missing event history.`, cases: [] as string[] };
  return { title: "No recurring signal yet", detail: "The sample is small; no recurring management signal should be treated as fleet-wide performance.", cases: [] as string[] };
}

function conformanceClass(value: string) {
  if (value === "CONFORMING") return "border-emerald-500/50 bg-emerald-950/30 text-emerald-100";
  if (value === "NON_CONFORMING") return "border-rose-500/50 bg-rose-950/30 text-rose-100";
  return "border-amber-500/50 bg-amber-950/30 text-amber-100";
}

export function LoadProcessDiscoveryPanel() {
  const [payload, setPayload] = useState<DiscoveryPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "", customer: "", driver: "", equipment: "", lane: "", loadStatus: "", variant: "", conformance: "", deviationType: "" });

  useEffect(() => {
    let cancelled = false;
    async function loadDiscovery() {
      try {
        const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value.trim()));
        const response = await fetch(`/api/load-process-intelligence/discovery${query.size ? `?${query.toString()}` : ""}`, { cache: "no-store" });
        const body = await response.json();
        if (cancelled) return;
        if (!response.ok) {
          setError(body?.error ?? "Unable to load process discovery");
          return;
        }
        setPayload(body as DiscoveryPayload);
      } catch {
        if (!cancelled) setError("Unable to load process discovery");
      }
    }
    void loadDiscovery();
    return () => {
      cancelled = true;
    };
  }, [filters]);

  if (error) return <section className="bof-oper-panel border-amber-700/40 bg-amber-950/20 text-amber-100">{error}</section>;
  if (!payload) return <section className="bof-oper-panel text-sm text-slate-300">Loading process discovery...</section>;

  const selectedVariant = payload.variants.rows.find((variant) => variant.variantId === selectedVariantId) ?? payload.variants.mostCommonVariant;
  const topDeviation = payload.recurringDeviations[0];
  const longestDwell = Object.entries(payload.throughputAnalysis).find(([, stats]) => stats.caseCount > 0 && stats.maximum)?.[1];
  const signal = processSignal(payload);

  return (
    <section className="bof-oper-panel overflow-x-hidden" aria-label="Load process discovery">
      <div className="bof-cc-panel-head">
        <div className="min-w-0">
          <p className="bof-kicker">Process intelligence</p>
          <h2 className="bof-h2">How is my load process performing?</h2>
          <p className="bof-cc-panel-sub">PI PROCESS DEMO DATA: {payload.caseSummary.totalCases} process cases in the current demonstration dataset. Observed variants and deviations are derived from OperatingProcessEvent only.</p>
        </div>
        <span className="rounded-full border border-amber-500/50 bg-amber-950/30 px-3 py-1 text-xs font-black uppercase tracking-wider text-amber-100">{payload.datasetLabel}</span>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Observed load cases</p><p className="mt-1 text-2xl font-black text-white">{payload.caseSummary.totalCases}</p><p className="mt-1 text-xs text-slate-400">{payload.caseSummary.sufficientHistoryCases} sufficient · {payload.caseSummary.partialHistoryCases} partial · {payload.caseSummary.noHistoryCases} none</p></div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Unique variants</p><p className="mt-1 text-2xl font-black text-white">{payload.variants.uniqueVariantCount}</p><p className="mt-1 text-xs text-slate-400">{payload.variants.status}</p></div>
        <div className="rounded-xl border border-emerald-800/70 bg-emerald-950/20 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-emerald-200">Conforming</p><p className="mt-1 text-2xl font-black text-white">{payload.conformanceSummary.conformingCases}</p><p className="mt-1 text-xs text-emerald-100">Supporting case count shown.</p></div>
        <div className="rounded-xl border border-rose-800/70 bg-rose-950/20 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-rose-200">Non-conforming</p><p className="mt-1 text-2xl font-black text-white">{payload.conformanceSummary.nonConformingCases}</p><p className="mt-1 text-xs text-rose-100">{payload.conformanceSummary.percentageNote ?? `${payload.conformanceSummary.conformingPercentage}% conforming`}</p></div>
        <div className="rounded-xl border border-amber-800/70 bg-amber-950/20 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-amber-200">Incomplete</p><p className="mt-1 text-2xl font-black text-white">{payload.conformanceSummary.insufficientCases}</p><p className="mt-1 text-xs text-amber-100">Not counted in variant statistics.</p></div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Recurring deviations</p><p className="mt-1 text-2xl font-black text-white">{payload.recurringDeviations.filter((item) => item.affectedCases.length > 1).length}</p><p className="mt-1 text-xs text-slate-400">Across multiple cases only.</p></div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
        <article className="rounded-xl border border-sky-800/60 bg-sky-950/20 p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-sky-200">Process signal</p>
          <h3 className="mt-1 text-xl font-black text-white">{signal.title}</h3>
          <p className="mt-2 text-sm text-sky-100">{signal.detail}</p>
          {signal.cases.length > 0 ? <div className="mt-3 flex flex-wrap gap-2">{signal.cases.map((loadId) => <Link key={loadId} href={`/loads/${loadId}`} className="rounded-md border border-sky-700 px-3 py-2 text-xs font-black text-sky-100 hover:bg-sky-900/50">{loadId}</Link>)}</div> : null}
        </article>
        <article className="rounded-xl border border-teal-800/60 bg-teal-950/20 p-4">
          <p className="text-[10px] font-black uppercase tracking-wider text-teal-200">What should management look at next?</p>
          <h3 className="mt-1 text-lg font-black text-white">{payload.nextRequiredAction}</h3>
          <p className="mt-2 text-sm text-teal-100">Demo sample - not statistically representative of the fleet. Drill into the affected loads before assigning cause.</p>
        </article>
      </div>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">Process filters</h3>
          <button type="button" onClick={() => setFilters({ dateFrom: "", dateTo: "", customer: "", driver: "", equipment: "", lane: "", loadStatus: "", variant: "", conformance: "", deviationType: "" })} className="rounded-md border border-slate-700 px-3 py-2 text-xs font-black text-slate-200 hover:bg-slate-800">Clear filters</button>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="grid gap-1 text-xs font-bold text-slate-300">Date From<input value={filters.dateFrom} onChange={(event) => setFilters((current) => ({ ...current, dateFrom: event.target.value }))} type="date" className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
          <label className="grid gap-1 text-xs font-bold text-slate-300">Date To<input value={filters.dateTo} onChange={(event) => setFilters((current) => ({ ...current, dateTo: event.target.value }))} type="date" className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
          <label className="grid gap-1 text-xs font-bold text-slate-300">Customer<input value={filters.customer} onChange={(event) => setFilters((current) => ({ ...current, customer: event.target.value }))} placeholder="PROCESS INTELLIGENCE" className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
          <label className="grid gap-1 text-xs font-bold text-slate-300">Driver<input value={filters.driver} onChange={(event) => setFilters((current) => ({ ...current, driver: event.target.value }))} placeholder="driver id" className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
          <label className="grid gap-1 text-xs font-bold text-slate-300">Equipment<input value={filters.equipment} onChange={(event) => setFilters((current) => ({ ...current, equipment: event.target.value }))} placeholder="equipment id" className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
          <label className="grid gap-1 text-xs font-bold text-slate-300">Lane<input value={filters.lane} onChange={(event) => setFilters((current) => ({ ...current, lane: event.target.value }))} placeholder="Dallas" className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" /></label>
          <label className="grid gap-1 text-xs font-bold text-slate-300">Load Status<select value={filters.loadStatus} onChange={(event) => setFilters((current) => ({ ...current, loadStatus: event.target.value }))} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option value="">Any</option><option value="PLANNED">Planned</option><option value="DISPATCHED">Dispatched</option><option value="DELIVERED">Delivered</option><option value="EXCEPTION">Exception</option></select></label>
          <label className="grid gap-1 text-xs font-bold text-slate-300">Variant<select value={filters.variant} onChange={(event) => setFilters((current) => ({ ...current, variant: event.target.value }))} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option value="">Any</option>{payload.variants.rows.map((variant) => <option key={variant.variantId} value={variant.activitySequence.join(" -> ")}>{variant.variantId} - {describeVariant(variant.activitySequence)}</option>)}</select></label>
          <label className="grid gap-1 text-xs font-bold text-slate-300">Conformance<select value={filters.conformance} onChange={(event) => setFilters((current) => ({ ...current, conformance: event.target.value }))} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option value="">Any</option><option value="CONFORMING">Conforming</option><option value="NON_CONFORMING">Non-conforming</option><option value="INSUFFICIENT_EVENT_HISTORY">Insufficient history</option></select></label>
          <label className="grid gap-1 text-xs font-bold text-slate-300">Deviation Type<select value={filters.deviationType} onChange={(event) => setFilters((current) => ({ ...current, deviationType: event.target.value }))} className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"><option value="">Any</option>{["ACTIVITY_REPEAT", "ACTIVITY_SKIP", "UNEXPECTED_ACTIVITY", "INVALID_START", "INVALID_END", "OUT_OF_ORDER", "UNEXPECTED_TRANSITION", "LOOP_BACK", "INCOMPLETE_SEQUENCE"].map((item) => <option key={item} value={item}>{formatLabel(item)}</option>)}</select></label>
        </div>
        <p className="mt-3 text-xs text-slate-500">Filters are server-backed. Empty results mean no observed event-log case matches the selected operational dimension.</p>
      </div>

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">Variant table</h3>
          <span className="text-xs font-semibold text-slate-400">Percentages hidden until sample is sufficient</span>
        </div>
        {payload.variants.rows.length > 0 ? (
          <div className="mt-3 grid gap-3">
            {payload.variants.rows.map((variant) => (
              <button key={variant.variantId} type="button" onClick={() => setSelectedVariantId(variant.variantId)} className="grid gap-2 rounded-lg border border-slate-800 bg-slate-900/70 p-3 text-left text-sm text-slate-300 hover:border-teal-600 lg:grid-cols-[0.6fr_0.5fr_0.5fr_0.7fr_1fr]">
                <strong className="text-white">{variant.variantId}<span className="mt-1 block text-xs font-semibold text-slate-400">{describeVariant(variant.activitySequence)}</span></strong>
                <span>Cases: {variant.caseCount}</span>
                <span>{variant.percentageOfCases === null ? variant.percentageNote : `${variant.percentageOfCases}%`}</span>
                <span>Cycle: {variant.averageThroughputTime ?? "Not enough timestamps"}</span>
                <span className={`rounded-md border px-2 py-1 text-xs font-black ${conformanceClass(variant.conformanceSummary.nonConformingCases > 0 ? "NON_CONFORMING" : "CONFORMING")}`}>{variant.conformanceSummary.conformingCases} conforming · {variant.conformanceSummary.nonConformingCases} non-conforming</span>
                <span>Top deviation: {variant.topDeviations[0] ? formatLabel(variant.topDeviations[0].deviationType) : "None"}</span>
              </button>
            ))}
          </div>
        ) : <p className="mt-3 text-sm text-slate-300">INSUFFICIENT EVENT HISTORY. At least two sufficient traces are needed before BOF can compare variants.</p>}
      </div>

      {selectedVariant ? (
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">Case drilldown · {selectedVariant.variantId}</h3>
          <p className="mt-2 text-sm font-bold text-teal-100">{describeVariant(selectedVariant.activitySequence)}</p>
          <p className="mt-2 break-words text-sm text-slate-300">Actual sequence: {selectedVariant.activitySequence.map(formatLabel).join(" -> ")}</p>
          <p className="mt-2 text-sm text-slate-400">Expected process: Load intake {"->"} canonical load {"->"} dispatch {"->"} driver/equipment {"->"} pre-trip {"->"} readiness {"->"} release {"->"} delivery {"->"} POD {"->"} invoice/payment {"->"} settlement.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedVariant.cases.map((item) => (
              <Link key={item.loadId} href={`/loads/${item.referenceNumber ?? item.loadId}`} className="rounded-md border border-slate-700 px-3 py-2 text-xs font-black text-teal-200 hover:bg-slate-800">{item.referenceNumber ?? item.loadId}</Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <article className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Recurring deviations</p><p className="mt-2 text-sm text-slate-300">{topDeviation ? `${formatLabel(topDeviation.deviationType)} · ${topDeviation.count} event(s) · ${topDeviation.affectedCases.length} case(s)` : "No recurring deviations yet."}</p></article>
        <article className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Longest dwell</p><p className="mt-2 text-sm text-slate-300">{longestDwell?.maximum ?? payload.bottlenecks.status}</p></article>
        <article className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Graph data</p><p className="mt-2 text-sm text-slate-300">{payload.processGraph.nodes.length} nodes · {payload.processGraph.edges.length} transitions</p></article>
      </div>

      <details className="mt-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
        <summary className="cursor-pointer text-sm font-black uppercase tracking-wider text-slate-200">Process graph and transition detail</summary>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          <div className="max-h-80 overflow-auto rounded-lg border border-slate-800 bg-slate-900/60 p-3">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">Activities</p>
            {payload.processGraph.nodes.map((node) => <p key={node.id} className="mt-2 text-sm text-slate-300">{node.label}: {node.activityFrequency} event(s), {node.variantMembership.length} variant(s)</p>)}
          </div>
          <div className="max-h-80 overflow-auto rounded-lg border border-slate-800 bg-slate-900/60 p-3">
            <p className="text-xs font-black uppercase tracking-wider text-slate-500">Transitions</p>
            {payload.transitionAnalysis.slice(0, 12).map((edge) => <p key={`${edge.from}-${edge.to}`} className="mt-2 text-sm text-slate-300">{formatLabel(edge.from)} {"->"} {formatLabel(edge.to)}: {edge.transitionCount} transition(s), {edge.caseCount} case(s){edge.unexpected ? " · unexpected" : ""}</p>)}
          </div>
        </div>
      </details>
    </section>
  );
}