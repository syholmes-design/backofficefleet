"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { DriverAvatar } from "@/components/DriverAvatar";
import { DriverLink } from "@/components/DriverLink";
import {
  isEmbedPreviewPath,
  isImagePath,
  normalizeDocStatus,
  previewAvailable,
  proofHref,
  statusBadgeClass,
} from "@/lib/document-ui";
import type { VaultDocumentRow } from "@/lib/document-vault";
import { driverPhotoPath } from "@/lib/driver-photo";

type StatusFilter = "all" | "valid" | "expired" | "missing" | "at-risk";

function rowKey(r: VaultDocumentRow) {
  return `${r.driverId}::${r.type}`;
}

export function DocumentVaultClient({
  rows,
  totalExpected,
}: {
  rows: VaultDocumentRow[];
  totalExpected: number;
}) {
  const [driverId, setDriverId] = useState<string>("");
  const [docType, setDocType] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [modalRow, setModalRow] = useState<VaultDocumentRow | null>(null);

  const closeModal = useCallback(() => setModalRow(null), []);

  useEffect(() => {
    if (!modalRow) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalRow, closeModal]);

  const driverOptions = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of rows) m.set(r.driverId, r.driverName);
    return [...m.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([id, name]) => ({ id, name }));
  }, [rows]);

  const docTypeOptions = useMemo(() => {
    const u = new Set<string>();
    for (const r of rows) u.add(r.type);
    return [...u].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (driverId && r.driverId !== driverId) return false;
      if (docType && r.type !== docType) return false;
      const norm = normalizeDocStatus(r.status);
      switch (statusFilter) {
        case "valid":
          return norm === "VALID";
        case "expired":
          return norm === "EXPIRED";
        case "missing":
          return norm === "MISSING";
        case "at-risk":
          return r.atRisk;
        default:
          return true;
      }
    });
  }, [rows, driverId, docType, statusFilter]);

  const countOk = rows.length === totalExpected;

  return (
    <>
      <div className="bof-vault-toolbar" role="search" aria-label="Filter documents">
        <div className="bof-vault-filters">
          <label className="bof-vault-field">
            <span className="bof-vault-label">Driver</span>
            <select
              className="bof-vault-select"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
            >
              <option value="">All drivers</option>
              {driverOptions.map(({ id, name }) => (
                <option key={id} value={id}>
                  {name} ({id})
                </option>
              ))}
            </select>
          </label>
          <label className="bof-vault-field">
            <span className="bof-vault-label">Document type</span>
            <select
              className="bof-vault-select"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              <option value="">All types</option>
              {docTypeOptions.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className="bof-vault-field">
            <span className="bof-vault-label">Status</span>
            <select
              className="bof-vault-select"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as StatusFilter)
              }
            >
              <option value="all">All statuses</option>
              <option value="valid">Valid</option>
              <option value="expired">Expired</option>
              <option value="missing">Missing</option>
              <option value="at-risk">At risk</option>
            </select>
          </label>
        </div>
        <p className="bof-vault-count" aria-live="polite">
          Showing <strong>{filtered.length}</strong> of{" "}
          <strong>{rows.length}</strong> documents
          {!countOk ? (
            <span className="bof-vault-count-warn">
              {" "}
              (expected {totalExpected} in demo dataset)
            </span>
          ) : null}
        </p>
      </div>

      <div className="bof-table-wrap">
        <table className="bof-table bof-table-compact bof-vault-table">
          <thead>
            <tr>
              <th scope="col" className="bof-table-photo-col">
                Photo
              </th>
              <th scope="col">Driver</th>
              <th scope="col">Driver ID</th>
              <th scope="col">Document type</th>
              <th scope="col" className="bof-vault-group-col">
                Group
              </th>
              <th scope="col">Status</th>
              <th scope="col">Expiration</th>
              <th scope="col">Flags</th>
              <th scope="col">Proof</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const k = rowKey(r);
              const href = proofHref(r);
              const hasPreview = previewAvailable(r);
              return (
                <tr key={k}>
                  <td className="bof-table-photo-cell">
                    <DriverLink
                      driverId={r.driverId}
                      className="bof-table-driver-hit"
                    >
                      <DriverAvatar
                        name={r.driverName}
                        photoUrl={driverPhotoPath(r.driverId)}
                        size={28}
                      />
                    </DriverLink>
                  </td>
                  <td>
                    <DriverLink driverId={r.driverId}>{r.driverName}</DriverLink>
                  </td>
                  <td>
                    <code className="bof-code">{r.driverId}</code>
                  </td>
                  <td>{r.type}</td>
                  <td className="bof-vault-group-col">
                    <span
                      className={`bof-vault-group-tag bof-vault-group-tag--${r.vaultGroup.toLowerCase()}`}
                    >
                      {r.vaultGroup}
                    </span>
                  </td>
                  <td>
                    <span className={statusBadgeClass(r.status)}>{r.status}</span>
                  </td>
                  <td>
                    {r.expirationDate ? (
                      <time dateTime={r.expirationDate}>{r.expirationDate}</time>
                    ) : (
                      <span className="bof-muted">—</span>
                    )}
                  </td>
                  <td className="bof-vault-flags">
                    {r.atRisk ? (
                      <span className="bof-doc-badge bof-doc-badge-warn">
                        At risk
                      </span>
                    ) : null}
                    {r.blocking ? (
                      <span className="bof-vault-block-pill">Blocks dispatch</span>
                    ) : null}
                    {!r.atRisk && !r.blocking ? (
                      <span className="bof-muted">—</span>
                    ) : null}
                  </td>
                  <td className="bof-vault-proof-cell">
                    <div
                      className="bof-vault-proof-wrap"
                      onMouseLeave={() => setHoveredKey(null)}
                    >
                      {hasPreview ? (
                        <>
                          <button
                            type="button"
                            className="bof-vault-proof-btn"
                            onMouseEnter={() => setHoveredKey(k)}
                            onClick={() => setModalRow(r)}
                          >
                            Preview
                          </button>
                          {href ? (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bof-link-secondary bof-vault-open"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Open
                            </a>
                          ) : null}
                          {hoveredKey === k && (
                            <div
                              className="bof-doc-popover bof-vault-popover"
                              role="tooltip"
                            >
                              <div className="bof-doc-popover-title">Preview</div>
                              {isEmbedPreviewPath(r.previewUrl || r.fileUrl || "") ? (
                                <iframe
                                  src={r.previewUrl || r.fileUrl}
                                  title=""
                                  className="bof-doc-popover-iframe"
                                />
                              ) : isImagePath(r.previewUrl || r.fileUrl || "") ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={r.previewUrl || r.fileUrl}
                                  alt=""
                                  className="bof-doc-popover-img"
                                />
                              ) : (
                                <p className="bof-doc-popover-file">
                                  File linked — click Preview for detail or use Open.
                                </p>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="bof-muted bof-vault-no-proof">
                          Preview not available
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="bof-muted bof-small bof-vault-footnote">
        Fleet register: <strong>{rows.length}</strong> rows. <strong>Group</strong>{" "}
        reflects core credentials, primary extensions (e.g. exam report), and
        secondary / workflow files. Proof uses paths under{" "}
        <code className="bof-code">/public</code> when present.
      </p>

      {modalRow && (
        <div
          className="bof-modal-backdrop"
          role="presentation"
          onClick={closeModal}
        >
          <div
            className="bof-modal bof-modal-wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="vault-doc-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="bof-modal-head">
              <h3 id="vault-doc-title">{modalRow.type}</h3>
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
                <dt>Driver</dt>
                <dd>
                  <Link
                    href={`/drivers/${modalRow.driverId}`}
                    className="bof-driver-link"
                  >
                    {modalRow.driverName}
                  </Link>{" "}
                  <code className="bof-code">{modalRow.driverId}</code>
                </dd>
                <dt>Group</dt>
                <dd>
                  <span
                    className={`bof-vault-group-tag bof-vault-group-tag--${modalRow.vaultGroup.toLowerCase()}`}
                  >
                    {modalRow.vaultGroup}
                  </span>
                </dd>
                <dt>Status</dt>
                <dd>
                  <span className={statusBadgeClass(modalRow.status)}>
                    {modalRow.status}
                  </span>
                </dd>
                <dt>Expiration</dt>
                <dd>{modalRow.expirationDate ?? "—"}</dd>
                <dt>Flags</dt>
                <dd>
                  {[
                    modalRow.atRisk ? "At risk" : null,
                    modalRow.blocking ? "Blocks dispatch" : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </dd>
                <dt>Preview URL</dt>
                <dd>
                  {modalRow.previewUrl ? (
                    <code className="bof-code bof-code-break">
                      {modalRow.previewUrl}
                    </code>
                  ) : (
                    "—"
                  )}
                </dd>
                <dt>File URL</dt>
                <dd>
                  {modalRow.fileUrl ? (
                    <code className="bof-code bof-code-break">
                      {modalRow.fileUrl}
                    </code>
                  ) : (
                    "—"
                  )}
                </dd>
              </dl>
              {proofHref(modalRow) ? (
                <p className="bof-modal-note">
                  <a
                    href={proofHref(modalRow)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bof-link-secondary"
                  >
                    Open proof in new tab
                  </a>
                </p>
              ) : (
                <p className="bof-modal-note bof-muted">Preview not available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
