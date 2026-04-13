"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type LoadProofItem,
  getLoadProofSummary,
  proofStatusDisplay,
} from "@/lib/load-proof";
import { isEmbedPreviewPath } from "@/lib/document-ui";

function statusBadgeClass(s: string) {
  const u = s.toUpperCase();
  if (u === "COMPLETE") return "bof-doc-badge bof-doc-badge-valid";
  if (u === "PENDING") return "bof-doc-badge bof-doc-badge-expired";
  if (u === "MISSING") return "bof-doc-badge bof-doc-badge-missing";
  if (u === "DISPUTED") return "bof-doc-badge bof-doc-badge-disputed";
  return "bof-doc-badge bof-doc-badge-neutral";
}

function proofAssetUrl(doc: LoadProofItem) {
  return (doc.previewUrl || doc.fileUrl || "").trim();
}

function isImagePath(url: string) {
  return /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url);
}

export function LoadProofPanel({
  loadId,
  loadNumber,
  items,
  automationProofLinks,
}: {
  loadId: string;
  loadNumber: string;
  items: LoadProofItem[];
  /** Document engine output: automated SVG per proof type */
  automationProofLinks?: {
    proofType: string;
    label: string;
    fileUrl: string;
    previewUrl: string;
  }[];
}) {
  const autoByType = new Map(
    (automationProofLinks ?? []).map((x) => [x.proofType, x])
  );
  const [hovered, setHovered] = useState<LoadProofItem | null>(null);
  const [modalDoc, setModalDoc] = useState<LoadProofItem | null>(null);
  const [thumbError, setThumbError] = useState(false);

  const closeModal = useCallback(() => setModalDoc(null), []);

  useEffect(() => {
    if (!modalDoc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalDoc, closeModal]);

  useEffect(() => {
    setThumbError(false);
  }, [hovered?.type]);

  const blocking = items.filter((i) => i.blocksPayment);
  const dispute = items.filter((i) => i.disputeExposure && !i.blocksPayment);
  const summary = getLoadProofSummary(items);

  function renderHoverPreview(d: LoadProofItem) {
    const url = proofAssetUrl(d);
    if (!url) {
      return (
        <p className="bof-doc-popover-empty">Preview not available</p>
      );
    }
    if (isEmbedPreviewPath(url)) {
      return (
        <>
          <div className="bof-doc-popover-title">Preview</div>
          <iframe
            src={url}
            title=""
            className="bof-doc-popover-iframe"
          />
        </>
      );
    }
    if (isImagePath(url)) {
      if (thumbError) {
        return (
          <p className="bof-doc-popover-empty">Preview not available</p>
        );
      }
      return (
        <>
          <div className="bof-doc-popover-title">Preview</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt=""
            className="bof-doc-popover-img"
            onError={() => setThumbError(true)}
          />
        </>
      );
    }
    return (
      <>
        <div className="bof-doc-popover-title">Preview</div>
        <p className="bof-doc-popover-file">
          Linked document — open the detail dialog for a full preview or use
          &quot;Open linked asset&quot; below.
        </p>
      </>
    );
  }

  return (
    <section className="bof-doc-section" aria-labelledby="load-proof-heading">
      <h2 id="load-proof-heading" className="bof-h2">
        Load proof stack
      </h2>
      <p className="bof-doc-section-lead">
        Proof required for payment release, dispute defense, and RF actions. Items
        marked <strong>block payment</strong> must be cleared before settlement.
      </p>

      <div className="bof-proof-summary-bar" role="region" aria-label="Proof summary">
        <div className="bof-proof-summary-metric">
          <span className="bof-proof-summary-label">Proof completion</span>
          <span className="bof-proof-summary-value">{summary.completionPct}%</span>
          <span className="bof-muted bof-small">
            {summary.completeCount}/{summary.applicableCount} required items present
          </span>
        </div>
        <div className="bof-proof-summary-metric">
          <span className="bof-proof-summary-label">Payment blockers</span>
          <span className="bof-proof-summary-value bof-proof-summary-warn">
            {summary.blockingCount}
          </span>
        </div>
        <div className="bof-proof-summary-metric">
          <span className="bof-proof-summary-label">Dispute-sensitive</span>
          <span className="bof-proof-summary-value">{summary.disputeSensitiveCount}</span>
        </div>
      </div>

      {(blocking.length > 0 || dispute.length > 0) && (
        <div className="bof-proof-flags" role="status">
          {blocking.length > 0 && (
            <p className="bof-proof-flag bof-proof-flag-block">
              <strong>{blocking.length}</strong> item(s){" "}
              <span className="bof-proof-flag-label">blocking payment</span>:{" "}
              {blocking.map((b) => b.type).join(", ")}
            </p>
          )}
          {dispute.length > 0 && (
            <p className="bof-proof-flag bof-proof-flag-risk">
              <strong>{dispute.length}</strong> item(s) with{" "}
              <span className="bof-proof-flag-label">dispute / exposure risk</span>
            </p>
          )}
        </div>
      )}

      <div className="bof-doc-grid">
        {items.map((doc) => (
          <div
            key={doc.type}
            className="bof-doc-card-wrap"
            onMouseLeave={() => setHovered(null)}
          >
            <button
              type="button"
              className="bof-doc-card"
              onMouseEnter={() => setHovered(doc)}
              onClick={() => setModalDoc(doc)}
            >
              <div className="bof-doc-card-top">
                <span className="bof-doc-type">{doc.type}</span>
                <span className={statusBadgeClass(doc.status)}>
                  {proofStatusDisplay(doc.status)}
                </span>
              </div>
              <div className="bof-proof-card-meta">
                {doc.blocksPayment && (
                  <span className="bof-proof-pill bof-proof-pill-block">
                    Blocks payment
                  </span>
                )}
                {doc.disputeExposure && !doc.blocksPayment && (
                  <span className="bof-proof-pill bof-proof-pill-dispute">
                    Dispute risk
                  </span>
                )}
              </div>
              {doc.riskNote && (
                <p className="bof-proof-risk-note">{doc.riskNote}</p>
              )}
              {autoByType.get(doc.type) && (
                <p className="bof-proof-auto-link">
                  <a
                    href={autoByType.get(doc.type)!.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bof-link-secondary bof-small"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Automated doc
                  </a>
                </p>
              )}
              <span className="bof-doc-hint">Click for metadata · Hover for preview</span>
            </button>

            {hovered?.type === doc.type && (
              <div className="bof-doc-popover" role="tooltip">
                {renderHoverPreview(doc)}
              </div>
            )}
          </div>
        ))}
      </div>

      {modalDoc && (
        <div
          className="bof-modal-backdrop"
          role="presentation"
          onClick={closeModal}
        >
          <div
            className="bof-modal bof-modal-wide bof-modal-proof"
            role="dialog"
            aria-modal="true"
            aria-labelledby="load-proof-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="bof-modal-head">
              <h3 id="load-proof-modal-title">
                {modalDoc.type} · Load {loadNumber}
              </h3>
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
                <code className="bof-code">{loadId}</code>
              </p>
              <dl className="bof-modal-dl">
                <dt>Status</dt>
                <dd>
                  <span className={statusBadgeClass(modalDoc.status)}>
                    {proofStatusDisplay(modalDoc.status)}
                  </span>
                </dd>
                <dt>Blocks payment</dt>
                <dd>{modalDoc.blocksPayment ? "Yes" : "No"}</dd>
                <dt>Dispute exposure</dt>
                <dd>{modalDoc.disputeExposure ? "Yes" : "No"}</dd>
                <dt>Risk note</dt>
                <dd>{modalDoc.riskNote ?? "—"}</dd>
                <dt>RF / ops action</dt>
                <dd>{modalDoc.rfAction ?? "—"}</dd>
                <dt>Notes</dt>
                <dd>{modalDoc.notes ?? "—"}</dd>
                <dt>Preview URL</dt>
                <dd>
                  {modalDoc.previewUrl ? (
                    <code className="bof-code bof-code-break">{modalDoc.previewUrl}</code>
                  ) : (
                    "—"
                  )}
                </dd>
                <dt>File URL</dt>
                <dd>
                  {modalDoc.fileUrl ? (
                    <code className="bof-code bof-code-break">{modalDoc.fileUrl}</code>
                  ) : (
                    "—"
                  )}
                </dd>
              </dl>
              {(() => {
                const u = proofAssetUrl(modalDoc);
                if (!u) return null;
                if (isImagePath(u)) {
                  return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={u}
                      alt=""
                      className="bof-modal-proof-preview"
                    />
                  );
                }
                if (isEmbedPreviewPath(u)) {
                  return (
                    <iframe
                      src={u}
                      title="Document preview"
                      className="bof-modal-proof-iframe"
                    />
                  );
                }
                return null;
              })()}
              {(modalDoc.fileUrl || modalDoc.previewUrl) && (
                <p className="bof-modal-note">
                  <a
                    href={modalDoc.fileUrl || modalDoc.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bof-link-secondary"
                  >
                    Open linked asset (new tab)
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
