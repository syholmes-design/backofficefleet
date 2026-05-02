"use client";

import { Fragment } from "react";
import {
  EvidencePhotoViewer,
  isLoadEvidenceImageUrl,
} from "@/components/evidence/EvidencePhotoViewer";
import {
  type LoadEvidenceItem,
  type LoadDocumentPacket,
  type LoadProofItem,
} from "@/lib/load-proof";

function statusBadgeClass(s: string) {
  const u = s.toUpperCase();
  if (u === "COMPLETE" || u === "READY") return "bof-doc-badge bof-doc-badge-valid";
  if (u === "PENDING") return "bof-doc-badge bof-doc-badge-expired";
  if (u === "MISSING") return "bof-doc-badge bof-doc-badge-missing";
  if (u === "DISPUTED" || u === "BLOCKED") return "bof-doc-badge bof-doc-badge-disputed";
  return "bof-doc-badge bof-doc-badge-neutral";
}

function displayEvidenceStatus(status: LoadEvidenceItem["status"]) {
  if (status === "ready") return "Ready";
  if (status === "pending") return "Pending";
  if (status === "missing") return "Missing";
  if (status === "blocked") return "Blocked";
  return "Not applicable";
}

function displaySource(source?: LoadEvidenceItem["source"]) {
  if (!source) return "Missing";
  if (source === "missing") return "Missing";
  if (source === "ai_generated") return "AI demo evidence";
  if (source === "svg_demo" || source === "generated") return "Demo SVG evidence";
  if (source === "real" || source === "actual_docs" || source === "manual_upload") return "Real evidence";
  return "Real file";
}

export function LoadProofPanel({
  loadId,
  loadNumber,
  items,
  packet,
  automationProofLinks,
}: {
  loadId: string;
  loadNumber: string;
  items: LoadProofItem[];
  packet?: LoadDocumentPacket | null;
  /** Document engine output: automated SVG per proof type */
  automationProofLinks?: {
    proofType: string;
    label: string;
    fileUrl: string;
    previewUrl: string;
  }[];
}) {
  const autoByType = new Map((automationProofLinks ?? []).map((x) => [x.proofType, x]));
  const evidenceRows: LoadEvidenceItem[] =
    packet?.documents ??
    items.map((doc) => ({
      id: `${loadId}:${doc.type.toLowerCase().replace(/\s+/g, "_")}`,
      loadId,
      label: doc.type,
      section: "proof",
      type: "bol",
      status:
        doc.status === "Complete"
          ? "ready"
          : doc.status === "Pending"
            ? "pending"
            : doc.status === "Missing"
              ? "missing"
              : doc.status === "Disputed"
                ? "blocked"
                : "not_applicable",
      url: (doc.fileUrl || doc.previewUrl || "").trim() || undefined,
      fileName: undefined,
      note: doc.riskNote || doc.notes,
      requiredForSettlementRelease: doc.blocksPayment,
    }));
  const requiredBlocking = evidenceRows.filter(
    (doc) =>
      doc.requiredForSettlementRelease &&
      !(doc.status === "ready" || doc.status === "not_applicable")
  );
  const grouped = [
    { section: "Core Trip Documents", rows: evidenceRows.filter((d) => d.section === "core") },
    { section: "Proof & Media", rows: evidenceRows.filter((d) => d.section === "proof") },
    { section: "Exceptions / Claims", rows: evidenceRows.filter((d) => d.section === "exceptions") },
    { section: "Reference Documents", rows: evidenceRows.filter((d) => d.section === "reference") },
  ].filter((g) => g.rows.length > 0);

  const tripSummary = packet?.tripValidation;

  return (
    <section className="bof-doc-section" aria-labelledby="load-proof-heading">
      <h2 id="load-proof-heading" className="bof-h2">
        Trip Document Packet
      </h2>
      <p className="bof-doc-section-lead">
        Canonical trip packet for load {loadNumber}. Settlement release requires required items to be Ready or Not applicable.
      </p>
      {tripSummary && (
        <div className="mb-4 flex flex-wrap gap-2 text-xs">
          <span className="bof-doc-badge bof-doc-badge-neutral">
            {tripSummary.status.replace(/_/g, " ")}
          </span>
          <span className="bof-doc-badge bof-doc-badge-neutral">
            Ready {tripSummary.readyCount}/{tripSummary.requiredCount}
          </span>
          <span className="bof-doc-badge bof-doc-badge-neutral">{tripSummary.recommendedAction}</span>
        </div>
      )}
      <p className={requiredBlocking.length > 0 ? "bof-proof-flag bof-proof-flag-block" : "bof-proof-flag bof-proof-flag-risk"}>
        {requiredBlocking.length > 0
          ? "Settlement hold is on — documentation does not yet support release."
          : "Settlement release supported — all required proof is on file."}
      </p>

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full min-w-[980px] border-collapse text-left text-xs">
          <thead className="bg-slate-900/90 text-[10px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="border-b border-slate-800 px-2 py-2 font-medium">Document</th>
              <th className="border-b border-slate-800 px-2 py-2 font-medium">Status</th>
              <th className="border-b border-slate-800 px-2 py-2 font-medium">Link</th>
              <th className="border-b border-slate-800 px-2 py-2 font-medium">Filename</th>
              <th className="border-b border-slate-800 px-2 py-2 font-medium">Source</th>
              <th className="border-b border-slate-800 px-2 py-2 font-medium">Notes</th>
            </tr>
          </thead>
          <tbody className="text-slate-200">
            {grouped.map((group) => (
              <Fragment key={group.section}>
                <tr className="border-b border-slate-800 bg-slate-950/65">
                  <td colSpan={6} className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {group.section}
                  </td>
                </tr>
                {group.rows.map((doc) => {
                  const auto = autoByType.get(doc.label);
                  const href = (doc.url || auto?.fileUrl || "").trim();
                  const canOpen = Boolean(href);
                  const viewAsPhoto = isLoadEvidenceImageUrl(href);
                  return (
                    <tr key={doc.id} className="border-b border-slate-800/80">
                      <td className="px-2 py-1.5">
                        <span className="font-medium text-slate-100">{doc.label}</span>
                        {doc.requiredForSettlementRelease && (
                          <span className="ml-2 text-[10px] text-amber-300">required</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5">
                        <span className={statusBadgeClass(displayEvidenceStatus(doc.status))}>
                          {displayEvidenceStatus(doc.status)}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 align-middle">
                        {canOpen && viewAsPhoto ? (
                          <EvidencePhotoViewer
                            url={href}
                            label={doc.label}
                            source={displaySource(doc.source)}
                            loadId={loadId}
                            description={doc.note}
                          />
                        ) : canOpen ? (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bof-link-secondary"
                          >
                            {doc.type.includes("photo") ? "View photo" : "Open"}
                          </a>
                        ) : (
                          <span className="text-slate-500">Missing / Needs review</span>
                        )}
                      </td>
                      <td className="px-2 py-1.5 font-mono text-[10px] text-slate-500">
                        {doc.fileName ?? "—"}
                      </td>
                      <td className="px-2 py-1.5 text-slate-400">{displaySource(doc.source)}</td>
                      <td className="px-2 py-1.5 text-slate-400">
                        {doc.note ??
                          (doc.status === "missing"
                            ? "Required to release settlement."
                            : doc.status === "pending"
                              ? "Awaiting upload or verification."
                              : doc.status === "not_applicable"
                                ? "Not required on this move."
                                : "—")}
                      </td>
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
