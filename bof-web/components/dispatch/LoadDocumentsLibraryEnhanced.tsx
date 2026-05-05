"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, FileText, ImageIcon, AlertCircle } from "lucide-react";
import {
  EvidencePhotoViewer,
  isLoadEvidenceImageUrl,
} from "@/components/evidence/EvidencePhotoViewer";
import type { Load } from "@/types/dispatch";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { buildTripDocumentPacket, groupTripPacketRows } from "@/lib/load-trip-packet";
import type { TripPacketRow, TripPacketGroupId } from "@/lib/load-trip-packet";
import { ProofGapReviewLinks } from "@/components/review/ReviewDeepLinks";
import { getOperatingDocumentsForLoad, getOperatingDocumentPath, getOperatingDocumentTitle } from "@/lib/operating-documents";

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
  const operatingRows = useMemo(() => {
    const docs = getOperatingDocumentsForLoad(load.load_id);
    const existingUrls = new Set(
      visibleRows
        .map((row) => row.url?.trim())
        .filter((url): url is string => Boolean(url))
    );
    return docs
      .map((doc) => {
        const url = getOperatingDocumentPath(doc);
        return {
          key: `operating:${doc.id}`,
          label: getOperatingDocumentTitle(doc),
          group: "reference" as const,
          status: "ready" as const,
          url,
          requiredForSettlementRelease: false,
          deliveredMinimum: false,
          loadEvidenceType: "work_order" as const,
          source: doc.kind === "generated" ? ("generated" as const) : ("manual_upload" as const),
        };
      })
      .filter((row) => !existingUrls.has(row.url));
  }, [load.load_id, visibleRows]);

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
          Trip document packet
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
              <ProofGapReviewLinks
                driverId={load.driver_id}
                loadId={load.load_id}
                className="mt-2 flex flex-wrap gap-x-2 gap-y-1"
              />
            </div>
          </div>
        )}
      </div>

      {groups.map((group) => (
        <DocGroup
          key={group.group}
          loadId={load.load_id}
          driverId={load.driver_id}
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

      {operatingRows.length > 0 && (
        <DocGroup
          loadId={load.load_id}
          driverId={load.driver_id}
          title="Operating Documents"
          rows={operatingRows}
        />
      )}

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
  loadId,
  driverId,
  title,
  rows,
  referenceCollapsed,
  onExpandReference,
}: {
  loadId: string;
  driverId?: string | null;
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
            <DocCard key={row.key} loadId={loadId} driverId={driverId} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}

function getAudienceTags(key: string, group: TripPacketGroupId): React.ReactNode[] {
  const tags: React.ReactNode[] = [];
  
  // Fleet owner applies to most core documents
  if (["rate_confirmation", "bol", "pod", "invoice"].includes(key)) {
    tags.push(<span key="fleet" className="inline-flex rounded px-1 py-0.5 text-[8px] font-medium bg-blue-950 text-blue-100">Fleet owner</span>);
  }
  
  // Dispatcher tags
  if (["rate_confirmation", "work_order", "bol", "pod"].includes(key)) {
    tags.push(<span key="dispatcher" className="inline-flex rounded px-1 py-0.5 text-[8px] font-medium bg-green-950 text-green-100">Dispatcher</span>);
  }
  
  // Driver tags
  if (["work_order", "bol", "pod"].includes(key)) {
    tags.push(<span key="driver" className="inline-flex rounded px-1 py-0.5 text-[8px] font-medium bg-purple-950 text-purple-100">Driver</span>);
  }
  
  // Billing tags
  if (["rate_confirmation", "bol", "pod", "invoice"].includes(key)) {
    tags.push(<span key="billing" className="inline-flex rounded px-1 py-0.5 text-[8px] font-medium bg-orange-950 text-orange-100">Billing</span>);
  }
  
  // Claims tags
  if (["claim_intake", "claim_packet", "damage_photo_packet"].includes(key)) {
    tags.push(<span key="claims" className="inline-flex rounded px-1 py-0.5 text-[8px] font-medium bg-red-950 text-red-100">Claims</span>);
  }
  
  // Insurance tags
  if (["insurance_notification"].includes(key)) {
    tags.push(<span key="insurance" className="inline-flex rounded px-1 py-0.5 text-[8px] font-medium bg-cyan-950 text-cyan-100">Insurance</span>);
  }
  
  // Factoring tags
  if (["factoring_notification"].includes(key)) {
    tags.push(<span key="factoring" className="inline-flex rounded px-1 py-0.5 text-[8px] font-medium bg-pink-950 text-pink-100">Factoring</span>);
  }
  
  // Legal tags
  if (["claim_packet"].includes(key)) {
    tags.push(<span key="legal" className="inline-flex rounded px-1 py-0.5 text-[8px] font-medium bg-indigo-950 text-indigo-100">Legal</span>);
  }
  
  return tags;
}

function getActionLabel(key: string): string {
  switch (key) {
    case "rate_confirmation": return "Open rate confirmation";
    case "work_order": return "Open work order";
    case "bol": return "Open BOL";
    case "pod": return "Open POD";
    case "invoice": return "Open invoice";
    case "claim_packet": return "Open claim packet";
    case "factoring_notification": return "Open factoring notice";
    case "pickup_photo": return "View pickup photo";
    case "cargo_photo": return "View cargo photo";
    case "seal_pickup_photo": return "View seal pickup photo";
    case "seal_delivery_photo": return "View seal delivery photo";
    case "delivery_empty_trailer": return "View empty-trailer proof";
    case "rfid_geo": return "View RFID proof";
    case "seal_mismatch_photo": return "View seal mismatch photo";
    default: return "Open in new tab";
  }
}

function DocCard({
  loadId,
  driverId,
  row,
}: {
  loadId: string;
  driverId?: string | null;
  row: TripPacketRow;
}) {
  const ready = rowReady(row);
  const statusColors = {
    ready: "border-emerald-700/60 bg-emerald-950/40",
    missing: "border-red-700/60 bg-red-950/40",
  };
  const url = row.url?.trim();
  const isRasterEvidence = isLoadEvidenceImageUrl(url || "");
  const kind: "pdf" | "image" =
    row.group === "proof" || isRasterEvidence ? "image" : "pdf";
  const sourceLabel =
    row.source === "missing"
      ? "Missing"
      : row.source === "ai_generated"
        ? "Generated document"
        : row.source === "svg_demo" || row.source === "generated"
          ? "Generated document"
          : row.source === "real" || row.source === "actual_docs"
            ? "Verified trip proof"
            : row.source === "rfid"
              ? "RFID proof"
              : row.source
                ? "Photo proof"
                : "Missing";

  return (
    <div
      className={`group flex gap-3 rounded-lg border p-3 transition-colors ${statusColors[ready ? "ready" : "missing"]} ${ready && url ? "hover:border-teal-700/60" : ""}`}
    >
      {kind === "image" && url && ready ? (
        <div className="shrink-0">
          <EvidencePhotoViewer
            url={url}
            label={row.label}
            source={sourceLabel}
            loadId={loadId}
            evidenceType={row.key}
            layout="stack"
          />
        </div>
      ) : (
        <div className="bof-evidence-thumb flex shrink-0 flex-col items-center justify-center gap-0.5 border border-slate-800 bg-slate-900 text-slate-500">
          <FileText className="h-6 w-6 text-teal-500/90" aria-hidden />
          <span className="text-[9px] font-medium uppercase tracking-wide">PDF</span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start gap-1.5">
          {kind === "image" && <ImageIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" aria-hidden />}
          {url && isSignedDocUrl(url) && (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" aria-label="Signed document attached" />
          )}
          {!ready && <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-400" />}
          <span className="text-sm font-medium text-slate-100">{row.label}</span>
          <span
            className={`ml-2 inline-flex rounded px-2 py-0.5 text-xs font-medium ${ready ? "bg-emerald-950 text-emerald-100" : "bg-red-950 text-red-100"}`}
          >
            {ready ? "READY" : String(row.status).toUpperCase()}
          </span>
          <span className="ml-2 inline-flex rounded px-2 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-300">
            {sourceLabel}
          </span>
          {/* Audience tags */}
          <div className="ml-2 flex flex-wrap gap-1">
            {getAudienceTags(row.key, row.group)}
          </div>
        </div>
        <p className="mt-1 truncate font-mono text-[10px] text-slate-500">{url || "No URL"}</p>
        {kind === "image" && url && ready ? (
          <p className="mt-1 text-[10px] text-slate-500">Click to thumbnail or {getActionLabel(row.key)} for a large preview.</p>
        ) : url && ready ? (
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-teal-500/90">
            <a href={url} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {getActionLabel(row.key)}
            </a>
          </p>
        ) : (
          <>
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {row.status === "not_applicable" ? "Not required for this trip" : "Missing / Needs review"}
            </p>
            <ProofGapReviewLinks
              driverId={driverId}
              loadId={loadId}
              className="mt-1 flex flex-wrap gap-x-2 gap-y-1"
            />
          </>
        )}
      </div>
    </div>
  );
}
