"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { DriverDocumentPacket, DriverPacketDocument } from "@/lib/driver-document-packet";
import {
  documentSignal,
  documentSignalClass,
  documentSignalLabel,
  isCanonicalVaultFormPdf,
  isEmbedPreviewPath,
  isImagePath,
  statusBadgeClass,
} from "@/lib/document-ui";
import { describeCredentialExpiration } from "@/lib/driver-doc-registry";
import { ProofGapReviewLinks } from "@/components/review/ReviewDeepLinks";

function statusCounts(rows: DriverPacketDocument[]) {
  let ready = 0;
  let missing = 0;
  let expired = 0;
  let needsReview = 0;
  for (const row of rows) {
    const status = row.status.toUpperCase();
    if (status === "VALID") ready += 1;
    else if (status === "EXPIRED") expired += 1;
    else if (status === "MISSING") missing += 1;
    else needsReview += 1;
  }
  return { ready, missing, expired, needsReview };
}

function groupTitle(group: DriverPacketDocument["group"]) {
  if (group === "core_dqf") return "Core Driver Qualification File";
  if (group === "hr_workflow") return "Applications & HR Workflow";
  return "Generated Administrative Summaries";
}

function actionLabel(row: DriverPacketDocument) {
  if (row.fileUrl) return "Open file";
  if (row.needsMapping) return "Needs mapping";
  return "Missing / Needs review";
}

export function DriverDocumentPacketSection({
  packet,
}: {
  packet: DriverDocumentPacket;
}) {
  const [selectedCanonicalType, setSelectedCanonicalType] = useState<string | null>(
    packet.documents[0]?.canonicalType ?? null
  );
  const selected = packet.documents.find((d) => d.canonicalType === selectedCanonicalType) ?? null;

  const groups = useMemo(() => {
    return {
      core: packet.documents.filter((d) => d.group === "core_dqf"),
      workflow: packet.documents.filter((d) => d.group === "hr_workflow"),
      summaries: packet.documents.filter((d) => d.group === "generated_summaries"),
    };
  }, [packet.documents]);
  const counts = useMemo(() => statusCounts(packet.documents), [packet.documents]);

  return (
    <section className="bof-doc-section" aria-labelledby="driver-document-packet-heading">
      <h2 id="driver-document-packet-heading" className="bof-h2">
        Driver document summary
      </h2>
      <p className="bof-doc-section-lead">
        Canonical packet grouped by DQF, HR workflow, and generated summaries. Duplicate source rows
        are deduplicated by canonical type and only one primary entry remains visible.
      </p>
      <div className="bof-driver-doc-summary-chips">
        <span className="bof-status-pill bof-status-pill-ok">Ready: {counts.ready}</span>
        <span className="bof-status-pill bof-status-pill-warn">Needs review: {counts.needsReview}</span>
        <span className="bof-status-pill bof-status-pill-danger">Expired: {counts.expired}</span>
        <span className="bof-status-pill bof-status-pill-info">Missing: {counts.missing}</span>
      </div>
      {(counts.needsReview > 0 || counts.missing > 0) && (
        <div className="mt-2">
          <ProofGapReviewLinks
            driverId={packet.driverId}
            loadId={null}
            className="flex flex-wrap gap-x-3 gap-y-1"
          />
        </div>
      )}

      {packet.duplicates.length > 0 ? (
        <p className="bof-small bof-muted">
          Deduped canonical rows:{" "}
          {packet.duplicates.map((d) => d.canonicalType).join(", ")}
        </p>
      ) : null}

      <details open className="bof-driver-doc-group">
        <summary>{groupTitle("core_dqf")}</summary>
        <div className="bof-driver-doc-table">
          {groups.core.map((row) => (
            <button
              key={row.canonicalType}
              type="button"
              className="bof-driver-doc-row"
              onClick={() => setSelectedCanonicalType(row.canonicalType)}
            >
              <span className="bof-driver-doc-col bof-driver-doc-col-title">{row.label}</span>
              <span className="bof-driver-doc-col">
                <span className={statusBadgeClass(row.status)}>{row.status}</span>
              </span>
              <span className="bof-driver-doc-col">
                {row.expirationDate || describeCredentialExpiration(row.expirationDate)}
              </span>
              <span className="bof-driver-doc-col">{row.sourceLabel}</span>
              <span className="bof-driver-doc-col bof-driver-doc-col-action">{actionLabel(row)}</span>
            </button>
          ))}
        </div>
      </details>

      <details className="bof-driver-doc-group">
        <summary>{groupTitle("hr_workflow")}</summary>
        <div className="bof-driver-doc-table">
          {groups.workflow.map((row) => (
            <button
              key={row.canonicalType}
              type="button"
              className="bof-driver-doc-row"
              onClick={() => setSelectedCanonicalType(row.canonicalType)}
            >
              <span className="bof-driver-doc-col bof-driver-doc-col-title">{row.label}</span>
              <span className="bof-driver-doc-col">
                <span className={statusBadgeClass(row.status)}>{row.status}</span>
              </span>
              <span className="bof-driver-doc-col">
                {row.expirationDate || describeCredentialExpiration(row.expirationDate)}
              </span>
              <span className="bof-driver-doc-col">{row.sourceLabel}</span>
              <span className="bof-driver-doc-col bof-driver-doc-col-action">{actionLabel(row)}</span>
            </button>
          ))}
        </div>
      </details>

      <details className="bof-driver-doc-group">
        <summary>{groupTitle("generated_summaries")}</summary>
        <div className="bof-driver-doc-table">
          {groups.summaries.map((row) => (
            <button
              key={row.canonicalType}
              type="button"
              className="bof-driver-doc-row"
              onClick={() => setSelectedCanonicalType(row.canonicalType)}
            >
              <span className="bof-driver-doc-col bof-driver-doc-col-title">{row.label}</span>
              <span className="bof-driver-doc-col">
                <span className={statusBadgeClass(row.status)}>{row.status}</span>
              </span>
              <span className="bof-driver-doc-col">
                {row.expirationDate || describeCredentialExpiration(row.expirationDate)}
              </span>
              <span className="bof-driver-doc-col">{row.needsMapping ? "Needs mapping" : row.sourceLabel}</span>
              <span className="bof-driver-doc-col bof-driver-doc-col-action">{actionLabel(row)}</span>
            </button>
          ))}
        </div>
      </details>

      <article className="bof-driver-doc-preview-panel">
        <h3 className="bof-h3">Preview</h3>
        {!selected ? (
          <p className="bof-muted bof-small">Select a document row to preview and open.</p>
        ) : (
          <>
            <div className="bof-driver-doc-preview-head">
              <strong>{selected.label}</strong>
              <span className={statusBadgeClass(selected.status)}>{selected.status}</span>
              <span className={documentSignalClass(documentSignal({ status: selected.status }))}>
                {documentSignalLabel(documentSignal({ status: selected.status }))}
              </span>
            </div>
            <p className="bof-small bof-muted">
              Source: {selected.needsMapping ? "Needs mapping" : selected.sourceLabel}
            </p>
            {selected.fileUrl ? (
              <>
                <p className="bof-small">
                  <a href={selected.fileUrl} target="_blank" rel="noreferrer" className="bof-link-secondary">
                    Open file in new tab
                  </a>
                </p>
                {isCanonicalVaultFormPdf(selected.previewUrl || selected.fileUrl || "", "i9") ||
                isCanonicalVaultFormPdf(selected.previewUrl || selected.fileUrl || "", "w9") ? (
                  <div className="mt-3 rounded border border-slate-600/40 bg-slate-900/40 p-4 text-sm">
                    <p className="font-medium text-slate-100">{selected.label}</p>
                    <p className="mt-1 text-slate-400">Canonical PDF on file</p>
                    <a
                      href={selected.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block font-semibold text-teal-400 hover:underline"
                    >
                      Open file
                    </a>
                  </div>
                ) : isEmbedPreviewPath(selected.previewUrl || selected.fileUrl || "") ? (
                  <iframe
                    src={selected.previewUrl || selected.fileUrl}
                    title={selected.label}
                    className="bof-driver-doc-preview-frame"
                  />
                ) : isImagePath(selected.previewUrl || selected.fileUrl || "") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selected.previewUrl || selected.fileUrl}
                    alt={selected.label}
                    className="bof-driver-doc-preview-image"
                  />
                ) : (
                  <p className="bof-muted bof-small">Preview unavailable for this file type.</p>
                )}
              </>
            ) : (
              <p className="bof-small bof-muted">
                No file URL available.{" "}
                {selected.needsMapping ? "This document type still needs source mapping." : "Marked missing."}
              </p>
            )}
          </>
        )}
        <p className="bof-small">
          <Link href="/documents" className="bof-link-secondary">
            Open Document Vault
          </Link>
        </p>
      </article>
    </section>
  );
}

