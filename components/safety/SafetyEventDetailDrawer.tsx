"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import type { SafetyEvent } from "@/types/safety";
import { useSafetyStore } from "@/lib/stores/safety-store";
import {
  eventStatusChipClass,
  nextEventStatuses,
  severityChipClass,
} from "@/lib/safety-rules";
import { formatExposure } from "./safety-ui";

type Props = {
  event: SafetyEvent | null;
  open: boolean;
  onClose: () => void;
};

export function SafetyEventDetailDrawer({ event, open, onClose }: Props) {
  const setEventStatus = useSafetyStore((s) => s.setEventStatus);
  const setEventInternalNotes = useSafetyStore((s) => s.setEventInternalNotes);
  const setEventClaimNeeded = useSafetyStore((s) => s.setEventClaimNeeded);

  const [notesDraft, setNotesDraft] = useState("");

  useEffect(() => {
    if (event) setNotesDraft(event.internal_notes ?? "");
  }, [event]);

  if (!open || !event) return null;

  const nextStatuses = nextEventStatuses(event.status);

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-end bg-black/55 backdrop-blur-[1px]"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        className="flex h-full w-full max-w-lg flex-col border-l border-slate-800 bg-slate-950 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="safety-event-drawer-title"
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-800 px-4 py-3">
          <div>
            <p
              id="safety-event-drawer-title"
              className="text-[10px] font-semibold uppercase tracking-wide text-slate-500"
            >
              Safety event
            </p>
            <h2 className="text-base font-semibold text-white">{event.event_id}</h2>
            <p className="mt-0.5 text-sm text-slate-400">{event.event_type}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-slate-400 hover:bg-slate-900 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 text-sm">
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2">
            <dt className="text-slate-500">Severity</dt>
            <dd>
              <span
                className={[
                  "inline-flex rounded px-2 py-0.5 text-xs font-semibold",
                  severityChipClass(event.severity),
                ].join(" ")}
              >
                {event.severity}
              </span>
            </dd>
            <dt className="text-slate-500">Status</dt>
            <dd>
              <span
                className={[
                  "inline-flex rounded px-2 py-0.5 text-xs font-semibold",
                  eventStatusChipClass(event.status),
                ].join(" ")}
              >
                {event.status}
              </span>
            </dd>
            <dt className="text-slate-500">Event date</dt>
            <dd className="font-mono text-xs text-slate-200">
              {event.event_date.replace("T", " ")}
            </dd>
            <dt className="text-slate-500">Driver</dt>
            <dd className="text-slate-100">{event.driver_name}</dd>
            <dt className="text-slate-500">Linked load</dt>
            <dd className="font-mono text-xs text-teal-300">
              {event.linked_load_id ?? "—"}
            </dd>
          </dl>

          {event.notes && (
            <section className="rounded border border-slate-800 bg-slate-900/50 p-3">
              <h3 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Field notes
              </h3>
              <p className="mt-1 text-sm text-slate-300">{event.notes}</p>
            </section>
          )}

          {event.evidence_image_url && (
            <section className="rounded border border-slate-800 bg-slate-900/50 p-3">
              <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Evidence
              </h3>
              <a
                href={event.evidence_image_url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative block aspect-video max-h-48 overflow-hidden rounded border border-slate-800 scale-80 transform origin-center"
              >
                <Image
                  src={event.evidence_image_url}
                  alt="Evidence"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </a>
              <p className="mt-2 text-[11px] text-slate-500">
                Opens in new tab — deploy-safe path on this host.
              </p>
            </section>
          )}

          <section className="rounded border border-slate-800 bg-slate-900/50 p-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Risk &amp; claims
            </h3>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <dt className="text-slate-500">Claim needed</dt>
              <dd className="font-medium text-slate-100">
                {event.insurance_claim_needed ? "Yes" : "No"}
              </dd>
              <dt className="text-slate-500">Est. exposure</dt>
              <dd
                className={
                  event.estimated_claim_exposure > 0
                    ? "font-semibold text-amber-200"
                    : "text-slate-300"
                }
              >
                {formatExposure(event.estimated_claim_exposure)}
              </dd>
            </dl>
          </section>

          <section className="rounded border border-slate-800 bg-slate-900/50 p-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Internal notes
            </h3>
            <textarea
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-xs text-slate-100"
              placeholder="Safety desk notes…"
            />
            <button
              type="button"
              onClick={() => {
                setEventInternalNotes(event.event_id, notesDraft);
              }}
              className="mt-2 rounded border border-teal-700 bg-teal-950/40 px-2 py-1 text-xs font-medium text-teal-100 hover:bg-teal-900/50"
            >
              Save notes
            </button>
          </section>
        </div>

        <footer className="shrink-0 space-y-2 border-t border-slate-800 bg-slate-950/95 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Status workflow (Open → In Review → Reviewed → Closed)
          </p>
          <div className="flex flex-wrap gap-2">
            {nextStatuses.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  const ok = setEventStatus(event.event_id, st);
                  if (!ok) {
                    window.alert("Invalid status transition for this event.");
                  }
                }}
                className="rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700"
              >
                Mark {st}
              </button>
            ))}
            <button
              type="button"
              onClick={() =>
                setEventClaimNeeded(event.event_id, !event.insurance_claim_needed)
              }
              className="rounded border border-amber-800/60 bg-amber-950/35 px-2 py-1.5 text-xs font-medium text-amber-100 hover:bg-amber-900/40"
            >
              {event.insurance_claim_needed
                ? "Clear claim flag"
                : "Mark claim needed"}
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}
