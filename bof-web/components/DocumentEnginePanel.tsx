"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { EngineDocument } from "@/lib/document-engine";
import { formatUsd } from "@/lib/format-money";
import { isCanonicalDqfComplianceSummaryPdf, isCanonicalVaultFormPdf } from "@/lib/document-ui";

function isImagePath(url: string) {
  return /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url);
}

function isPdfPath(url: string) {
  return /\.pdf(\?|$)/i.test(url);
}

function isHtmlDocumentPath(url: string) {
  return /\.html(\?|$)/i.test(url);
}

/** Canonical driver vault PDFs where iframe embed is unreliable — use compact card + open link. */
function isCanonicalNonIframeDriverPdf(doc: Pick<EngineDocument, "type" | "previewUrl" | "fileUrl">) {
  const u = (doc.previewUrl || doc.fileUrl || "").trim();
  if (!isPdfPath(u)) return false;
  if (doc.type === "W-9") return isCanonicalVaultFormPdf(u, "w9");
  if (doc.type === "I-9") return isCanonicalVaultFormPdf(u, "i9");
  if (doc.type === "FMCSA DQF Compliance Summary") return isCanonicalDqfComplianceSummaryPdf(u);
  return false;
}

function canonicalVaultPdfCardTitle(doc: Pick<EngineDocument, "type">) {
  if (doc.type === "W-9") return "W-9";
  if (doc.type === "I-9") return "I-9";
  if (doc.type === "FMCSA DQF Compliance Summary") return "FMCSA DQF Compliance Summary";
  return "Document";
}

function badgeClass(blocks: boolean) {
  return blocks
    ? "bof-badge bof-badge-warn"
    : "bof-badge bof-badge-neutral";
}

/** HR packet hover/modal only — shrink CDL thumbnails without touching source files. */
function isCdlHrPreviewDoc(doc: Pick<EngineDocument, "type">) {
  return doc.type === "CDL";
}

export function DocumentEnginePanel({
  id = "document-engine",
  title,
  lead,
  documents,
  crossLinks,
  variant = "default",
  previewScope = "default",
}: {
  id?: string;
  title: string;
  lead: string;
  documents: EngineDocument[];
  crossLinks?: { label: string; href: string }[];
  /** Supporting block on driver hub — quieter visual weight */
  variant?: "default" | "supporting";
  /**
   * Driver hub HR packet only: scale embedded HTML/image previews so full sheets are visible.
   * Other surfaces keep default preview sizing.
   */
  previewScope?: "default" | "driverHrPacket";
}) {
  const hrPacketPreview = previewScope === "driverHrPacket";
  const [hovered, setHovered] = useState<EngineDocument | null>(null);
  const [modal, setModal] = useState<EngineDocument | null>(null);
  const [thumbError, setThumbError] = useState(false);

  const closeModal = useCallback(() => setModal(null), []);

  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal, closeModal]);

  useEffect(() => {
    setThumbError(false);
  }, [hovered?.id]);

  function renderPopover(doc: EngineDocument) {
    const url = doc.previewUrl?.trim() ?? "";
    const cdlHrThumb = hrPacketPreview && isCdlHrPreviewDoc(doc);
    if (!url) {
      return <p className="bof-doc-popover-empty">Preview not available</p>;
    }
    if (isPdfPath(url)) {
      if (isCanonicalNonIframeDriverPdf(doc)) {
        const openHref = doc.fileUrl?.trim() || url;
        return (
          <>
            <div className="bof-doc-popover-title">{canonicalVaultPdfCardTitle(doc)}</div>
            <div className="rounded border border-slate-200 bg-slate-50 p-3 text-sm text-gray-800">
              <p className="text-gray-600">Canonical PDF on file</p>
              <a
                href={openHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-block font-semibold text-teal-700 hover:underline"
              >
                Open file
              </a>
            </div>
          </>
        );
      }
      const hrFrame = (
        <div className="bof-hr-packet-preview-frame">
          <div className="bof-hr-packet-preview-frame-inner">
            <iframe src={url} title="" className="bof-hr-packet-preview-iframe" />
          </div>
        </div>
      );
      return (
        <>
          <div className="bof-doc-popover-title">Preview</div>
          {hrPacketPreview ? (
            cdlHrThumb ? (
              <div className="bof-cdl-preview-frame-popover bof-driver-doc-preview--cdl">{hrFrame}</div>
            ) : (
              hrFrame
            )
          ) : (
            <iframe src={url} title="" className="bof-doc-popover-iframe" />
          )}
        </>
      );
    }
    if (hrPacketPreview && isHtmlDocumentPath(url)) {
      const hrFrame = (
        <div className="bof-hr-packet-preview-frame">
          <div className="bof-hr-packet-preview-frame-inner">
            <iframe src={url} title="" className="bof-hr-packet-preview-iframe" />
          </div>
        </div>
      );
      return (
        <>
          <div className="bof-doc-popover-title">Preview</div>
          {cdlHrThumb ? (
            <div className="bof-cdl-preview-frame-popover bof-driver-doc-preview--cdl">{hrFrame}</div>
          ) : (
            hrFrame
          )}
        </>
      );
    }
    if (isImagePath(url)) {
      if (thumbError) {
        return <p className="bof-doc-popover-empty">Preview not available</p>;
      }
      return (
        <>
          <div className="bof-doc-popover-title">Preview</div>
          {cdlHrThumb ? (
            <div className="bof-cdl-preview-img-popover bof-driver-doc-preview--cdl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="bof-doc-popover-img bof-hr-packet-preview-image bof-cdl-preview"
                onError={() => setThumbError(true)}
              />
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt=""
              className={
                hrPacketPreview
                  ? "bof-doc-popover-img bof-hr-packet-preview-image"
                  : "bof-doc-popover-img"
              }
              onError={() => setThumbError(true)}
            />
          )}
        </>
      );
    }
    return (
      <>
        <div className="bof-doc-popover-title">Preview</div>
        <p className="bof-doc-popover-file">Open document for full view.</p>
      </>
    );
  }

  if (documents.length === 0) return null;

  return (
    <section
      id={id}
      className={`bof-gen-doc-section${variant === "supporting" ? " bof-gen-doc-section--supporting" : ""}${hrPacketPreview ? " bof-hr-packet-preview" : ""}`}
      aria-labelledby={`${id}-heading`}
    >
      <h2
        id={`${id}-heading`}
        className={`bof-h2${variant === "supporting" ? " bof-h2-supporting" : ""}`}
      >
        {title}
      </h2>
      <p
        className={`bof-doc-section-lead${variant === "supporting" ? " bof-doc-section-lead-supporting" : ""}`}
      >
        {lead}
      </p>
      {crossLinks && crossLinks.length > 0 && (
        <ul className="bof-gen-doc-cross">
          {crossLinks.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="bof-link-secondary">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <ul className="bof-gen-doc-list">
        {documents.map((doc) => (
          <li
            key={doc.id}
            className="bof-gen-doc-row"
            onMouseLeave={() => setHovered(null)}
          >
            <div className="bof-gen-doc-row-main">
              <button
                type="button"
                className="bof-gen-doc-cat bof-gen-doc-cat-btn"
                onMouseEnter={() => setHovered(doc)}
                onClick={() => setModal(doc)}
              >
                {doc.type}
              </button>
              <span className={badgeClass(doc.blocksPayment)}>
                {doc.status}
                {doc.blocksPayment ? " · may block pay" : ""}
              </span>
            </div>
            {doc.notes && (
              <p className="bof-muted bof-small bof-gen-doc-notes">{doc.notes}</p>
            )}
            <p className="bof-gen-doc-meta bof-small bof-muted">
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bof-link-secondary"
              >
                Open file (new tab)
              </a>
            </p>
            {hovered?.id === doc.id && (
              <div className="bof-doc-popover bof-gen-doc-popover" role="tooltip">
                {renderPopover(doc)}
              </div>
            )}
          </li>
        ))}
      </ul>

      {modal && (
        <div
          className="bof-modal-backdrop"
          role="presentation"
          onClick={closeModal}
        >
          <div
            className="bof-modal bof-modal-wide bof-modal-proof"
            role="dialog"
            aria-modal="true"
            aria-labelledby="doc-engine-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="bof-modal-head">
              <h3 id="doc-engine-modal-title">{modal.title}</h3>
              <button
                type="button"
                className="bof-modal-close"
                onClick={closeModal}
                aria-label="Close"
              >
                ×
              </button>
            </header>
            <div className="bof-modal-body">
              <p className="bof-muted bof-small">
                <strong>{modal.type}</strong> · Generated from BOF source data
              </p>
              <dl className="bof-modal-dl">
                {modal.driverId && (
                  <>
                    <dt>Driver</dt>
                    <dd>
                      <Link
                        href={modal.links.driverProfile ?? `#`}
                        className="bof-link-secondary"
                      >
                        {modal.driverId}
                      </Link>
                    </dd>
                  </>
                )}
                {modal.loadId && (
                  <>
                    <dt>Load</dt>
                    <dd>
                      <Link
                        href={modal.links.loadDetail ?? `#`}
                        className="bof-link-secondary"
                      >
                        {modal.loadId}
                      </Link>
                    </dd>
                  </>
                )}
                {modal.incidentId && (
                  <>
                    <dt>Incident</dt>
                    <dd>
                      <code className="bof-code">{modal.incidentId}</code>
                    </dd>
                  </>
                )}
                {modal.settlementId && (
                  <>
                    <dt>Settlement</dt>
                    <dd>
                      <code className="bof-code">{modal.settlementId}</code>
                    </dd>
                  </>
                )}
                {modal.moneyAtRiskId && (
                  <>
                    <dt>Money at risk</dt>
                    <dd>
                      <code className="bof-code">{modal.moneyAtRiskId}</code>
                    </dd>
                  </>
                )}
                {modal.rfEventId && (
                  <>
                    <dt>RF event</dt>
                    <dd>
                      <Link
                        href="/rf-actions"
                        className="bof-link-secondary"
                      >
                        <code className="bof-code">{modal.rfEventId}</code>
                      </Link>
                      <span className="bof-muted bof-small">
                        {" "}
                        (RF queue / RFID lane)
                      </span>
                    </dd>
                  </>
                )}
                {modal.financialImpactUsd != null &&
                  Number.isFinite(modal.financialImpactUsd) && (
                    <>
                      <dt>Financial impact (RF est.)</dt>
                      <dd>{formatUsd(modal.financialImpactUsd)}</dd>
                    </>
                  )}
                <dt>Status</dt>
                <dd>{modal.status}</dd>
                <dt>Blocks payment</dt>
                <dd>{modal.blocksPayment ? "Yes" : "No"}</dd>
                <dt>Source summary</dt>
                <dd>
                  <pre className="bof-doc-engine-pre">{modal.sourceDataSummary}</pre>
                </dd>
                {modal.notes && (
                  <>
                    <dt>Notes</dt>
                    <dd>{modal.notes}</dd>
                  </>
                )}
              </dl>
              <nav className="bof-doc-engine-nav" aria-label="Related BOF pages">
                {modal.links.driverProfile && (
                  <Link href={modal.links.driverProfile} className="bof-link-secondary">
                    Driver profile
                  </Link>
                )}
                {modal.links.loadDetail && (
                  <Link href={modal.links.loadDetail} className="bof-link-secondary">
                    Load detail
                  </Link>
                )}
                {modal.links.pretrip && (
                  <Link href={modal.links.pretrip} className="bof-link-secondary">
                    Pre-trip tablet
                  </Link>
                )}
                {modal.links.documentVault && (
                  <Link href={modal.links.documentVault} className="bof-link-secondary">
                    Document vault
                  </Link>
                )}
                {modal.links.settlements && (
                  <Link href={modal.links.settlements} className="bof-link-secondary">
                    Settlements
                  </Link>
                )}
                {modal.links.moneyAtRisk && (
                  <Link href={modal.links.moneyAtRisk} className="bof-link-secondary">
                    Money at risk
                  </Link>
                )}
                {modal.links.rfActions && (
                  <Link href={modal.links.rfActions} className="bof-link-secondary">
                    RF actions
                  </Link>
                )}
                {modal.links.commandCenter && (
                  <Link href={modal.links.commandCenter} className="bof-link-secondary">
                    Command Center
                  </Link>
                )}
              </nav>
              {modal.previewUrl && isImagePath(modal.previewUrl) && (
                hrPacketPreview && isCdlHrPreviewDoc(modal) ? (
                  <div className="bof-cdl-preview-modal-img-host bof-driver-doc-preview--cdl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={modal.previewUrl}
                      alt=""
                      className="bof-modal-proof-preview bof-hr-packet-preview-modal-image bof-cdl-preview"
                    />
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={modal.previewUrl}
                    alt=""
                    className={
                      hrPacketPreview
                        ? "bof-modal-proof-preview bof-hr-packet-preview-modal-image"
                        : "bof-modal-proof-preview"
                    }
                  />
                )
              )}
              {modal.previewUrl && isCanonicalNonIframeDriverPdf(modal) && (
                <div className="mt-4 rounded border border-slate-200 bg-slate-50 p-4 text-sm text-gray-800">
                  <p className="font-medium text-gray-900">{canonicalVaultPdfCardTitle(modal)}</p>
                  <p className="mt-1 text-gray-600">Canonical PDF on file</p>
                  <a
                    href={modal.fileUrl?.trim() || modal.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block font-semibold text-teal-700 hover:underline"
                  >
                    Open file
                  </a>
                </div>
              )}
              {modal.previewUrl &&
                hrPacketPreview &&
                (isPdfPath(modal.previewUrl) ||
                  isHtmlDocumentPath(modal.previewUrl)) &&
                !isCanonicalNonIframeDriverPdf(modal) && (
                  <div
                    className={
                      isCdlHrPreviewDoc(modal)
                        ? "bof-cdl-preview-modal-frame-host bof-driver-doc-preview--cdl"
                        : undefined
                    }
                  >
                    <div className="bof-hr-packet-preview-modal-frame">
                      <div className="bof-hr-packet-preview-modal-frame-inner">
                        <iframe
                          src={modal.previewUrl}
                          title="Document preview"
                          className="bof-hr-packet-preview-modal-iframe"
                        />
                      </div>
                    </div>
                  </div>
                )}
              {modal.previewUrl &&
                !hrPacketPreview &&
                isPdfPath(modal.previewUrl) &&
                !isCanonicalNonIframeDriverPdf(modal) && (
                  <iframe
                    src={modal.previewUrl}
                    title="Document preview"
                    className="bof-modal-proof-iframe"
                  />
                )}
              <p className="bof-modal-note">
                <a
                  href={modal.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bof-link-secondary"
                >
                  Open document (new tab)
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
