"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { getGeneratedLoadDocEntry } from "@/lib/load-doc-manifest";
import { getLoadEvidenceUrl } from "@/lib/load-documents";
import {
  filterTriageCards,
  listDispatchTriageCards,
  sortTriageColumn,
  type DispatchReadinessStatus,
  type DispatchTriageCard,
  type DispatchTriageRole,
} from "@/lib/dispatch/dispatch-triage";
import type { DispatchIssueCategory } from "@/lib/dispatch/dispatch-issue-grouping";
import type { DispatchIssueSeverity } from "@/lib/dispatch/dispatch-severity";
import { DispatchOperatingTimeline } from "./DispatchOperatingTimeline";

type Props = {
  onSelectLoad?: (loadId: string) => void;
  onOpenAssign?: (loadId: string) => void;
  initialSeverity?: DispatchIssueSeverity | "ALL";
  demoMode?: boolean;
};

const SEVERITIES: DispatchIssueSeverity[] = ["CRITICAL", "MAJOR", "MINOR"];

function severityTone(severity: DispatchIssueSeverity) {
  if (severity === "CRITICAL") return "border-red-500/60 bg-red-950/35 text-red-100";
  if (severity === "MAJOR") return "border-amber-500/60 bg-amber-950/30 text-amber-100";
  return "border-slate-500/60 bg-slate-900/70 text-slate-100";
}

function readinessTone(status: DispatchReadinessStatus) {
  if (status === "BLOCKED") return "border-red-700/50 bg-red-950/40 text-red-100";
  if (status === "REVIEW_REQUIRED") return "border-amber-700/50 bg-amber-950/30 text-amber-100";
  return "border-emerald-700/50 bg-emerald-950/30 text-emerald-100";
}

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

function documentLinks(loadId: string) {
  if (!/^L\d+$/i.test(loadId)) return [];
  const generated = getGeneratedLoadDocEntry(loadId);
  const links: Array<{ kind: string; label: string; href: string }> = [
    { kind: "Document Record", label: "Load file", href: `/loads/${encodeURIComponent(loadId)}` },
  ];
  if (generated.bol) links.push({ kind: "Actual Document", label: "BOL", href: generated.bol });
  if (generated.rateConfirmation) links.push({ kind: "Actual Document", label: "Rate confirmation", href: generated.rateConfirmation });
  const evidence = getLoadEvidenceUrl(loadId, "sealPhoto") ?? getLoadEvidenceUrl(loadId, "sealPickupPhoto");
  if (evidence) links.push({ kind: "Evidence", label: "Seal evidence", href: evidence });
  return links;
}

function TriageCard({
  card,
  role,
  onSelectLoad,
  onOpenAssign,
  onOpenTimeline,
}: {
  card: DispatchTriageCard;
  role: DispatchTriageRole;
  onSelectLoad?: (loadId: string) => void;
  onOpenAssign?: (loadId: string) => void;
  onOpenTimeline: (loadId: string) => void;
}) {
  const docs = documentLinks(card.loadId);
  return (
    <article className="min-w-0 rounded-xl border border-slate-800 bg-slate-950/80 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <button type="button" className="text-left text-base font-black text-white hover:text-teal-100" onClick={() => onSelectLoad?.(card.loadId)}>
          {card.loadId}
        </button>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${severityTone(card.severity)}`}>
          {card.severity}
        </span>
      </div>
      <p className="mt-1 text-xs text-slate-400">{card.loadStatus}</p>
      <div className="mt-2 flex flex-wrap gap-1">
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase ${readinessTone(card.readiness)}`}>
          {card.readiness.replace("_", " ")}
        </span>
        {card.categories.map((row) => (
          <span key={row.category} className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] font-semibold text-slate-200">
            {row.label} · {row.count}
          </span>
        ))}
      </div>
      <p className="mt-2 text-sm leading-5 text-slate-200">{card.issueSummary}</p>
      <p className="mt-2 text-xs text-slate-400">
        {card.driverName} · {card.equipmentId ?? "No tractor"} · {card.trailerId ?? "No trailer"}
      </p>
      <p className="mt-2 text-xs font-semibold text-teal-200">Next: {card.nextAction}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Link href={card.nextActionHref} className="inline-flex min-h-10 items-center rounded border border-teal-600 px-2.5 py-1.5 text-xs font-bold text-teal-100 hover:bg-teal-950/50">
          {card.nextActionLabel}
        </Link>
        {card.nextActionLabel.includes("Assign") && onOpenAssign ? (
          <button
            type="button"
            onClick={() => onOpenAssign(card.loadId)}
            className="inline-flex min-h-10 items-center rounded border border-teal-600 px-2.5 py-1.5 text-xs font-bold text-teal-100 hover:bg-teal-950/50"
          >
            Assign in dispatch
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => onOpenTimeline(card.loadId)}
          className="inline-flex min-h-10 items-center rounded border border-slate-600 px-2.5 py-1.5 text-xs font-bold text-slate-100 hover:bg-slate-900"
        >
          View Timeline
        </button>
        <Link href={`/trip-release/${encodeURIComponent(card.loadId)}`} className="inline-flex min-h-10 items-center rounded border border-slate-600 px-2.5 py-1.5 text-xs font-bold text-slate-100 hover:bg-slate-900">
          Review release gate
        </Link>
        {role === "manager" && card.requiresManagerReview ? (
          <span className="inline-flex min-h-10 items-center rounded border border-amber-700/60 px-2.5 py-1.5 text-xs font-bold text-amber-100">
            Override not implemented
          </span>
        ) : null}
      </div>
      {role === "manager" && card.escalationReason ? (
        <p className="mt-2 text-xs text-amber-200">Escalation: {card.escalationReason}</p>
      ) : null}
      {docs.length > 0 ? (
        <ul className="mt-2 space-y-1 text-[11px] text-slate-400">
          {docs.map((doc) => (
            <li key={`${doc.kind}-${doc.href}`}>
              <span className="font-semibold text-slate-500">{doc.kind}:</span>{" "}
              <a href={doc.href} className="text-teal-300 hover:text-teal-100">
                {doc.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}

export function DispatchTriageBoard({ onSelectLoad, onOpenAssign, initialSeverity = "ALL", demoMode = true }: Props) {
  const { data } = useBofDemoData();
  const [role, setRole] = useState<DispatchTriageRole>("dispatcher");
  const [timelineLoadId, setTimelineLoadId] = useState<string | null>(null);
  const [severity, setSeverity] = useState<DispatchIssueSeverity | "ALL">(initialSeverity);
  const [readiness, setReadiness] = useState<DispatchReadinessStatus | "ALL">("ALL");
  const [loadStatus, setLoadStatus] = useState("ALL");
  const [customer, setCustomer] = useState("ALL");
  const [driver, setDriver] = useState("ALL");
  const [equipment, setEquipment] = useState("ALL");
  const [lane, setLane] = useState("ALL");
  const [category, setCategory] = useState<DispatchIssueCategory | "ALL">("ALL");

  const cards = useMemo(() => (demoMode ? listDispatchTriageCards(data) : []), [data, demoMode]);
  const filtered = useMemo(
    () =>
      filterTriageCards(cards, {
        severity,
        readiness,
        loadStatus,
        customer,
        driver,
        equipment,
        lane,
        category,
      }),
    [cards, category, customer, driver, equipment, lane, loadStatus, readiness, severity],
  );

  const visibleCards = role === "manager" ? filtered.filter((card) => card.requiresManagerReview) : filtered;
  const visibleColumns = {
    CRITICAL: sortTriageColumn(visibleCards, "CRITICAL"),
    MAJOR: sortTriageColumn(visibleCards, "MAJOR"),
    MINOR: sortTriageColumn(visibleCards, "MINOR"),
  };

  return (
    <section id="dispatch-triage" className="overflow-x-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-4" aria-label="Dispatch triage">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-300">Dispatch triage</p>
          <h2 className="mt-1 text-2xl font-black text-white">CRITICAL · MAJOR · MINOR</h2>
          <p className="mt-1 text-sm text-slate-400">
            Severity is operational urgency. Readiness remains READY / REVIEW REQUIRED / BLOCKED from the existing dispatch gate.
            {!demoMode
              ? " Canonical demo blockers are not mixed into this fleet list. Use PI-TEST-001 timeline for persisted OperatingProcessEvent history."
              : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            aria-pressed={role === "dispatcher"}
            onClick={() => setRole("dispatcher")}
            className={`min-h-10 rounded-md border px-3 py-2 text-xs font-black uppercase ${role === "dispatcher" ? "border-teal-500 bg-teal-950/40 text-teal-100" : "border-slate-700 text-slate-300"}`}
          >
            Dispatcher view
          </button>
          <button
            type="button"
            aria-pressed={role === "manager"}
            onClick={() => setRole("manager")}
            className={`min-h-10 rounded-md border px-3 py-2 text-xs font-black uppercase ${role === "manager" ? "border-teal-500 bg-teal-950/40 text-teal-100" : "border-slate-700 text-slate-300"}`}
          >
            Manager view
          </button>
          <button
            type="button"
            onClick={() => setTimelineLoadId("PI-TEST-001")}
            className="min-h-10 rounded-md border border-slate-600 px-3 py-2 text-xs font-bold text-slate-100 hover:bg-slate-900"
          >
            PI-TEST-001 timeline
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <label className="min-w-0 text-[10px] font-black uppercase tracking-wide text-slate-500">
          Severity
          <select className="mt-1 w-full min-w-0 rounded border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100" value={severity} onChange={(event) => setSeverity(event.target.value as DispatchIssueSeverity | "ALL")}>
            {["ALL", "CRITICAL", "MAJOR", "MINOR"].map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="min-w-0 text-[10px] font-black uppercase tracking-wide text-slate-500">
          Readiness
          <select className="mt-1 w-full min-w-0 rounded border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100" value={readiness} onChange={(event) => setReadiness(event.target.value as DispatchReadinessStatus | "ALL")}>
            {["ALL", "READY", "REVIEW_REQUIRED", "BLOCKED"].map((option) => <option key={option} value={option}>{option.replace(/_/g, " ")}</option>)}
          </select>
        </label>
        <label className="min-w-0 text-[10px] font-black uppercase tracking-wide text-slate-500">
          Load status
          <select className="mt-1 w-full min-w-0 rounded border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100" value={loadStatus} onChange={(event) => setLoadStatus(event.target.value)}>
            {["ALL", ...unique(cards.map((card) => card.loadStatus))].map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="min-w-0 text-[10px] font-black uppercase tracking-wide text-slate-500">
          Customer
          <select className="mt-1 w-full min-w-0 rounded border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100" value={customer} onChange={(event) => setCustomer(event.target.value)}>
            {["ALL", ...unique(cards.map((card) => card.customerName))].map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="min-w-0 text-[10px] font-black uppercase tracking-wide text-slate-500">
          Driver
          <select className="mt-1 w-full min-w-0 rounded border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100" value={driver} onChange={(event) => setDriver(event.target.value)}>
            {["ALL", ...unique(cards.map((card) => card.driverName))].map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="min-w-0 text-[10px] font-black uppercase tracking-wide text-slate-500">
          Equipment
          <select className="mt-1 w-full min-w-0 rounded border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100" value={equipment} onChange={(event) => setEquipment(event.target.value)}>
            {["ALL", ...unique(cards.map((card) => card.equipmentId ?? ""))].map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="min-w-0 text-[10px] font-black uppercase tracking-wide text-slate-500">
          Lane
          <select className="mt-1 w-full min-w-0 rounded border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100" value={lane} onChange={(event) => setLane(event.target.value)}>
            {["ALL", ...unique(cards.map((card) => card.lane))].map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
        <label className="min-w-0 text-[10px] font-black uppercase tracking-wide text-slate-500">
          Issue category
          <select className="mt-1 w-full min-w-0 rounded border border-slate-700 bg-slate-950 px-2 py-2 text-xs text-slate-100" value={category} onChange={(event) => setCategory(event.target.value as DispatchIssueCategory | "ALL")}>
            {["ALL", "DOCUMENTATION", "SEAL & SECURITY", "MAINTENANCE & SAFETY", "COMPLIANCE"].map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {SEVERITIES.map((column) => (
          <div key={column} className={`flex min-h-[18rem] min-w-0 flex-col rounded-xl border p-3 ${severityTone(column)}`}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-black uppercase tracking-wide">{column}</h3>
              <span className="rounded-full border border-white/20 px-2 py-0.5 text-xs font-black">{visibleColumns[column].length}</span>
            </div>
            <div className="flex max-h-[32rem] min-h-0 flex-1 flex-col gap-3 overflow-y-auto overflow-x-hidden pr-1">
              {visibleColumns[column].length === 0 ? (
                <p className="text-sm text-white/70">No loads in this tier for the current filters.</p>
              ) : (
                visibleColumns[column].map((card) => (
                  <TriageCard
                    key={card.loadId}
                    card={card}
                    role={role}
                    onSelectLoad={onSelectLoad}
                    onOpenAssign={onOpenAssign}
                    onOpenTimeline={setTimelineLoadId}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <DispatchOperatingTimeline loadId={timelineLoadId ?? ""} open={Boolean(timelineLoadId)} onClose={() => setTimelineLoadId(null)} />
    </section>
  );
}
