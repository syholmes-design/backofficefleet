"use client";

import Link from "next/link";
import type { BofData } from "@/lib/load-bof-data";
import type { EventStatus, SafetyEvent } from "@/types/safety";
import type { SafetyCommandFeedRow } from "@/lib/safety-command-feed";
import { dispatchImpactLabel } from "@/lib/safety-command-feed";
import { severityChipClass, nextEventStatuses } from "@/lib/safety-rules";
import type { SafetySeverity } from "@/types/safety";

function toChipSeverity(l: SafetyCommandFeedRow["severityLabel"]): SafetySeverity {
  if (l === "Critical") return "Critical";
  if (l === "High") return "High";
  if (l === "Medium") return "Medium";
  if (l === "Review") return "Medium";
  return "Low";
}

function workflowChipClass(w: SafetyCommandFeedRow["workflowLabel"]) {
  if (w === "Open") return "border border-rose-700/45 bg-rose-950/40 text-rose-100";
  if (w === "Pending review") return "border border-amber-600/45 bg-amber-950/40 text-amber-100";
  return "border border-teal-700/45 bg-teal-950/35 text-teal-100";
}

function dispatchChip(impact: string) {
  if (impact === "Blocks dispatch") return "bg-rose-950/50 text-rose-200 ring-1 ring-rose-800/50";
  if (impact === "Needs review") return "bg-amber-950/40 text-amber-100 ring-1 ring-amber-800/40";
  return "bg-slate-800/80 text-slate-300 ring-1 ring-slate-700/50";
}

type Props = {
  data: BofData;
  rows: SafetyCommandFeedRow[];
  storeEvents: SafetyEvent[];
  onOpenDrawer: (eventId: string) => void;
  onAdvanceEvent: (eventId: string, next: EventStatus) => void;
};

export function SafetyCommandEventList({ data, rows, storeEvents, onOpenDrawer, onAdvanceEvent }: Props) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-slate-800 bg-slate-900/30 px-4 py-6 text-center text-sm text-slate-500">
        No safety signals match the current filters.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const impact = dispatchImpactLabel(data, row.driverId);
        const storeEv = row.storeEventId ? storeEvents.find((e) => e.event_id === row.storeEventId) : undefined;
        const nextSt = storeEv ? nextEventStatuses(storeEv.status)[0] : undefined;
        const evidenceIsInternal = row.evidenceHref?.startsWith("/");

        return (
          <article
            key={row.id}
            className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 shadow-sm shadow-black/10"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-semibold ${severityChipClass(toChipSeverity(row.severityLabel))}`}>
                  {row.severityLabel}
                </span>
                <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-semibold ${workflowChipClass(row.workflowLabel)}`}>
                  {row.workflowLabel}
                </span>
                <span className="text-[11px] font-semibold text-slate-200">{row.eventTypeLabel}</span>
              </div>
              <span className={`inline-flex rounded px-2 py-0.5 text-[10px] font-semibold ${dispatchChip(impact)}`}>
                Dispatch: {impact}
              </span>
            </div>
            <div className="mt-2 grid gap-1 text-xs sm:grid-cols-2">
              <p className="text-slate-300">
                <span className="text-slate-500">Driver:</span>{" "}
                <Link href={`/drivers/${row.driverId}/safety`} className="font-medium text-teal-300 hover:text-teal-200">
                  {row.driverName}
                </Link>{" "}
                <span className="font-mono text-[10px] text-slate-500">({row.driverId})</span>
              </p>
              {row.loadId ? (
                <p className="text-slate-300">
                  <span className="text-slate-500">Load:</span>{" "}
                  <Link href={`/loads/${row.loadId}`} className="font-mono text-teal-300 hover:text-teal-200">
                    {row.loadId}
                  </Link>
                </p>
              ) : (
                <p className="text-slate-600">Load: —</p>
              )}
            </div>
            <p className="mt-2 text-sm text-slate-200">{row.summary}</p>
            <p className="mt-1 text-[11px] leading-snug text-slate-500">{row.whyMatters}</p>
            <p className="mt-1 text-[11px] font-medium text-teal-200/90">Recommended: {row.recommendedAction}</p>
            <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-800/80 pt-3">
              <Link
                href={`/drivers/${row.driverId}/safety`}
                className="inline-flex rounded border border-teal-800/50 bg-teal-950/30 px-2.5 py-1 text-[10px] font-semibold text-teal-200 hover:bg-teal-950/50"
              >
                Open driver
              </Link>
              {row.loadProofHref ? (
                <Link
                  href={row.loadProofHref}
                  className="inline-flex rounded border border-slate-700 bg-slate-950 px-2.5 py-1 text-[10px] font-semibold text-slate-200 hover:bg-slate-900"
                >
                  Open load proof
                </Link>
              ) : null}
              {row.evidenceHref ? (
                evidenceIsInternal ? (
                  <Link
                    href={row.evidenceHref}
                    className="inline-flex rounded border border-slate-700 bg-slate-950 px-2.5 py-1 text-[10px] font-semibold text-slate-200 hover:bg-slate-900"
                  >
                    Review evidence
                  </Link>
                ) : (
                  <a
                    href={row.evidenceHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded border border-slate-700 bg-slate-950 px-2.5 py-1 text-[10px] font-semibold text-slate-200 hover:bg-slate-900"
                  >
                    Review evidence
                  </a>
                )
              ) : (
                <span className="inline-flex rounded border border-amber-900/40 bg-amber-950/20 px-2.5 py-1 text-[10px] font-semibold text-amber-200/90">
                  Missing / Needs review
                </span>
              )}
              {row.storeEventId && storeEv ? (
                <>
                  <button
                    type="button"
                    onClick={() => onOpenDrawer(row.storeEventId!)}
                    className="inline-flex rounded border border-slate-600 bg-slate-900 px-2.5 py-1 text-[10px] font-semibold text-slate-300 hover:bg-slate-800"
                  >
                    Event drawer
                  </button>
                  {nextSt ? (
                    <button
                      type="button"
                      onClick={() => onAdvanceEvent(row.storeEventId!, nextSt)}
                      className="inline-flex rounded border border-teal-700/40 bg-teal-950/25 px-2.5 py-1 text-[10px] font-semibold text-teal-200 hover:bg-teal-950/45"
                    >
                      Mark: {nextSt}
                    </button>
                  ) : null}
                </>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
