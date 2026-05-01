"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { CheckCircle2, FileText, ImageIcon, AlertCircle } from "lucide-react";
import type { Load } from "@/types/dispatch";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { buildTripDocumentPacket, groupTripPacketRows } from "@/lib/load-trip-packet";
import type { TripPacketRow } from "@/lib/load-trip-packet";

function showExceptionClaimSection(load: Load): boolean {
  return Boolean(
    load.exception_flag ||
      load.insurance_claim_needed ||
      load.claim_form_url ||
      load.damage_photo_url ||
      load.supporting_attachment_url
  );
}

function rowReady(row: TripPacketRow): boolean {
  return row.status === "ready" && Boolean(row.url?.trim());
}

function isSignedDocUrl(url: string): boolean {
  return url.includes("/actual_docs/");
}

type Props = {
  load: Load;
};

export function LoadDocumentsLibraryEnhanced({ load }: Props) {
  const { data } = useBofDemoData();
  const trip = useMemo(() => buildTripDocumentPacket(data, load.load_id), [data, load.load_id]);
  const groups = useMemo(
    () => groupTripPacketRows(trip, { hideNotApplicable: true }),
    [trip]
  );
  const [referenceOpen, setReferenceOpen] = useState(false);

  const visibleRows = useMemo(
    () =>
      groups.flatMap((g) => {
        if (g.group === "reference" && !referenceOpen) return [];
        return g.rows;
      }),
    [groups, referenceOpen]
  );

  const docStatus = useMemo(() => {
    const applicable = visibleRows;
    return {
      available: applicable.filter(rowReady).length,
      missing: applicable.filter((r) => !rowReady(r)).length,
      required: applicable.filter((r) => r.requiredForSettlementRelease || r.deliveredMinimum).length,
    };
  }, [visibleRows]);

  if (!trip || groups.length === 0) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <FileText className="h-3.5 w-3.5 text-teal-500" />
            Trip Document Packet
          </h3>
          <p className="text-sm text-slate-300">No manifest-backed packet rows for this load.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <FileText className="h-3.5 w-3.5 text-teal-500" />
          Trip Document Packet
        </h3>
        {trip.validation && (
          <div className="mb-3 flex flex-wrap gap-2 text-[11px] text-slate-200">
            <span className="rounded border border-slate-700 bg-slate-950/80 px-2 py-1 font-semibold capitalize">
              {trip.validation.status.replace(/_/g, " ")}
            </span>
            <span className="rounded border border-slate-700 bg-slate-950/80 px-2 py-1">
              Ready {trip.validation.readyCount}/{trip.validation.requiredCount}
            </span>
          </div>
        )}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className={`text-2xl font-bold ${docStatus.available > 0 ? "text-emerald-400" : "text-slate-600"}`}>
              {docStatus.available}
            </div>
            <div className="text-xs text-slate-400">Available</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${docStatus.missing > 0 ? "text-red-400" : "text-slate-600"}`}>
              {docStatus.missing}
            </div>
            <div className="text-xs text-slate-400">Missing / review</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${docStatus.required > 0 ? "text-teal-400" : "text-slate-600"}`}>
              {docStatus.required}
            </div>
            <div className="text-xs text-slate-400">Required rows</div>
          </div>
        </div>
        {docStatus.missing > 0 && (
          <div className="mt-3 rounded border border-amber-900/40 bg-amber-950/20 p-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div className="text-xs text-amber-100">
                <strong>Needs review:</strong> rows without URLs stay closed — regenerate from demo scripts or attach uploads.
              </div>
            </div>
          </div>
        )}
      </div>

      {groups.map((group) => (
        <DocGroup
          key={group.group}
          title={group.label}
          rows={group.rows}
          referenceCollapsed={group.group === "reference" && !referenceOpen}
          onExpandReference={
            group.group === "reference"
              ? () => setReferenceOpen(true)
              : undefined
          }
        />
      ))}

      {showExceptionClaimSection(load) && (
        <div>
          <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Exceptions / Claims Notes
          </h4>
          <div className="space-y-2">
            {load.exception_reason && (
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Exception notes</p>
                <p className="mt-1 text-sm text-slate-200">{load.exception_reason}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DocGroup({
  title,
  rows,
  referenceCollapsed,
  onExpandReference,
}: {
  title: string;
  rows: TripPacketRow[];
  referenceCollapsed?: boolean;
  onExpandReference?: () => void;
}) {
  if (referenceCollapsed && onExpandReference) {
    return (
      <div>
        <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
        <button
          type="button"
          onClick={onExpandReference}
          className="text-xs font-semibold text-teal-400 hover:text-teal-300"
        >
          Show reference documents ({rows.length})
        </button>
      </div>
    );
  }

  return (
    <div>
      <h4 className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{title}</h4>
      {rows.length === 0 ? (
        <p className="text-xs text-slate-600">No items in this group.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {rows.map((row) => (
            <DocCard key={row.key} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}

function DocCard({ row }: { row: TripPacketRow }) {
  const ready = rowReady(row);
  const statusColors = {
    ready: "border-emerald-700/60 bg-emerald-950/40",
    missing: "border-red-700/60 bg-red-950/40",
  };
  const kind: "pdf" | "image" = row.group === "proof" ? "image" : "pdf";
  const url = row.url?.trim();
  const sourceLabel =
    row.source === "missing"
      ? "Missing"
      : row.source === "ai_generated"
        ? "AI demo evidence"
        : row.source === "svg_demo" || row.source === "generated"
          ? "Demo generated"
          : row.source === "real" || row.source === "actual_docs"
            ? "Real evidence"
            : row.source === "rfid"
              ? "RFID"
              : row.source
                ? "Evidence"
                : "Missing";

  return (
    <a
      href={url || "#"}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => {
        if (!url || !ready) e.preventDefault();
      }}
      className={`group flex gap-3 rounded-lg border p-3 transition-colors ${statusColors[ready ? "ready" : "missing"]} hover:border-teal-700/60`}
    >
      <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded border border-slate-800 bg-slate-900">
        {kind === "image" && url && ready ? (
          <Image src={url} alt="" fill sizes="80px" className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 text-slate-500">
            <FileText className="h-6 w-6 text-teal-500/90" aria-hidden />
            <span className="text-[9px] font-medium uppercase tracking-wide">PDF</span>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start gap-1.5">
          {kind === "image" && <ImageIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />}
          {url && isSignedDocUrl(url) && (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-label="Signed document attached" />
          )}
          {!ready && <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />}
          <span className="text-sm font-medium text-slate-100 group-hover:text-teal-100">{row.label}</span>
          <span
            className={`ml-2 inline-flex rounded px-2 py-0.5 text-xs font-medium ${ready ? "bg-emerald-950 text-emerald-100" : "bg-red-950 text-red-100"}`}
          >
            {ready ? "READY" : String(row.status).toUpperCase()}
          </span>
          <span className="ml-2 inline-flex rounded px-2 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-300">
            {sourceLabel}
          </span>
        </div>
        <p className="mt-1 truncate font-mono text-[10px] text-slate-500">{url || "No URL"}</p>
        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-teal-500/90">
          {url && ready ? "Open in new tab" : "Missing / Needs review"}
        </p>
      </div>
    </a>
  );
}
