"use client";

import { useCallback, useEffect, useState } from "react";
import type { DocumentRow } from "@/lib/driver-queries";
import { DRIVER_DOCUMENT_TYPES } from "@/lib/driver-queries";
import {
  isEmbedPreviewPath,
  isImagePath,
  previewAvailable,
  proofHref,
  statusBadgeClass,
} from "@/lib/document-ui";

export function DriverDocumentsPanel({
  driverId,
  driverName,
  documents,
  sectionTitle = "Driver documents",
  sectionLead = "Seven required credential types (all listed below). Hover for preview when a file path exists; click a card for full metadata and open-in-new-tab when a file URL is on file.",
  legendTypes = DRIVER_DOCUMENT_TYPES,
  headingId = "driver-docs-heading",
}: {
  driverId: string;
  driverName: string;
  documents: DocumentRow[];
  /** Override default “Driver documents” heading */
  sectionTitle?: string;
  /** Override intro paragraph */
  sectionLead?: string;
  /** Legend list; pass `false` to hide the numbered legend */
  legendTypes?: readonly string[] | false;
  /** Unique id when multiple panels on one page */
  headingId?: string;
}) {
  const [hovered, setHovered] = useState<DocumentRow | null>(null);
  const [modalDoc, setModalDoc] = useState<DocumentRow | null>(null);

  const closeModal = useCallback(() => setModalDoc(null), []);

  useEffect(() => {
    if (!modalDoc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalDoc, closeModal]);

  return (
    <section className="bof-doc-section" aria-labelledby={headingId}>
      <h2 id={headingId} className="bof-h2">
        {sectionTitle}
      </h2>
      <p className="bof-doc-section-lead">{sectionLead}</p>
      {legendTypes !== false && legendTypes.length > 0 && (
        <ol className="bof-doc-required-legend" aria-label="Document types in this group">
          {legendTypes.map((t, i) => (
            <li key={t}>
              <span className="bof-doc-required-idx">{i + 1}.</span> {t}
            </li>
          ))}
        </ol>
      )}

      <div className="bof-doc-grid">
        {documents.map((doc) => (
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
                  {doc.status}
                </span>
              </div>
              <div className="bof-doc-expiry">
                {doc.expirationDate ? (
                  <>
                    <span className="bof-muted">Expires</span>{" "}
                    <time dateTime={doc.expirationDate}>{doc.expirationDate}</time>
                  </>
                ) : (
                  <span className="bof-muted">No expiration on file</span>
                )}
              </div>
              <span className="bof-doc-hint">Click for details · Hover for preview</span>
            </button>

            {hovered?.type === doc.type && (
              <div
                className="bof-doc-popover bof-driver-doc-popover"
                role="tooltip"
              >
                {previewAvailable(doc) ? (
                  <>
                    <div className="bof-doc-popover-title">Preview</div>
                    {isEmbedPreviewPath(doc.previewUrl || doc.fileUrl || "") ? (
                      <div className="bof-doc-popover-iframe-host">
                        <iframe
                          src={doc.previewUrl || doc.fileUrl}
                          title=""
                          className="bof-doc-popover-iframe"
                        />
                      </div>
                    ) : isImagePath(doc.previewUrl || doc.fileUrl || "") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={doc.previewUrl || doc.fileUrl}
                        alt=""
                        className="bof-doc-popover-img"
                      />
                    ) : (
                      <p className="bof-doc-popover-file">
                        File linked — open detail view to access.
                      </p>
                    )}
                  </>
                ) : (
                  <p className="bof-doc-popover-empty">Preview not available</p>
                )}
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
            className="bof-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="doc-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="bof-modal-head">
              <h3 id="doc-modal-title">{modalDoc.type}</h3>
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
              <dl className="bof-modal-dl">
                <dt>Status</dt>
                <dd>
                  <span className={statusBadgeClass(modalDoc.status)}>
                    {modalDoc.status}
                  </span>
                </dd>
                <dt>Expiration</dt>
                <dd>{modalDoc.expirationDate ?? "—"}</dd>
                <dt>Driver</dt>
                <dd>
                  {driverName}{" "}
                  <code className="bof-code">{driverId}</code>
                </dd>
                <dt>Document type</dt>
                <dd>{modalDoc.type}</dd>
                {modalDoc.demoPlaceholder === true && (
                  <>
                    <dt>Demo</dt>
                    <dd>Synthetic placeholder shell (not a production scan).</dd>
                  </>
                )}
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
              {proofHref(modalDoc) && (
                <p className="bof-modal-note">
                  <a
                    href={proofHref(modalDoc)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bof-link-secondary"
                  >
                    Open file in new tab
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
