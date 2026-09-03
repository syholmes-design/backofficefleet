"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

type TimelineEvent = {
  id: string;
  activity: string;
  timestamp: string;
  actor: string;
  source: string;
  status: string | null;
  relatedException: string | null;
  relatedCorrectiveAction: string | null;
};

type TimelinePayload = {
  loadId: string;
  requestedLoadId: string;
  historyStatus: string;
  historyStatusLabel: string;
  orderedEvents: TimelineEvent[];
  loadIdentity: { customerName: string; status: string };
};

type Props = {
  loadId: string;
  open: boolean;
  onClose: () => void;
};

export function DispatchOperatingTimeline({ loadId, open, onClose }: Props) {
  const [payload, setPayload] = useState<TimelinePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !loadId) return;
    let cancelled = false;
    async function load() {
      setError(null);
      setPayload(null);
      try {
        const response = await fetch(`/api/load-process-intelligence/${encodeURIComponent(loadId)}`, { cache: "no-store" });
        const body = await response.json();
        if (cancelled) return;
        if (!response.ok) {
          setError(body?.error ?? "Process history is not available.");
          return;
        }
        setPayload(body as TimelinePayload);
      } catch {
        if (!cancelled) setError("Process history is not available.");
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [loadId, open]);

  if (!open) return null;

  const panel = (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/70 p-3 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="dispatch-timeline-title">
      <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-4 shadow-2xl sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-300">Actual process history</p>
            <h2 id="dispatch-timeline-title" className="mt-1 break-words text-xl font-black text-white">
              Timeline · {loadId}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              OperatingProcessEvent records only. Current readiness is not inferred as history.
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md border border-slate-600 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-slate-900">
            Close
          </button>
        </div>

        {error ? <p className="mt-4 rounded-lg border border-amber-700/50 bg-amber-950/30 p-3 text-sm text-amber-100">{error}</p> : null}
        {!error && !payload ? <p className="mt-4 text-sm text-slate-400">Loading persisted events…</p> : null}

        {payload ? (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-slate-300">
              {payload.loadIdentity.customerName} · current state {payload.loadIdentity.status} · {payload.historyStatusLabel}
            </p>
            {payload.orderedEvents.length === 0 ? (
              <p className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-300">
                INSUFFICIENT EVENT HISTORY. No persisted OperatingProcessEvent rows exist for this load.
              </p>
            ) : (
              <ol className="space-y-2">
                {payload.orderedEvents.map((event) => (
                  <li key={event.id} className="rounded-lg border border-slate-800 bg-slate-900/70 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-teal-200">{event.activity.replace(/_/g, " ")}</p>
                    <p className="mt-1 text-sm text-slate-200">{new Date(event.timestamp).toISOString()}</p>
                    <p className="mt-1 break-words text-xs text-slate-400">
                      Actor {event.actor} · Source {event.source}
                      {event.status ? ` · Resulting state ${event.status}` : ""}
                    </p>
                    {event.relatedException ? <p className="mt-1 text-xs text-amber-200">Exception {event.relatedException}</p> : null}
                    {event.relatedCorrectiveAction ? <p className="mt-1 text-xs text-cyan-200">Corrective action {event.relatedCorrectiveAction}</p> : null}
                  </li>
                ))}
              </ol>
            )}
            <Link
              href={`/loads/${encodeURIComponent(payload.requestedLoadId || loadId)}`}
              className="inline-flex min-h-11 items-center rounded-md border border-teal-600 px-3 py-2 text-sm font-bold text-teal-100 hover:bg-teal-950/40"
            >
              Open process intelligence view
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );

  if (typeof document === "undefined") return panel;
  return createPortal(panel, document.body);
}
