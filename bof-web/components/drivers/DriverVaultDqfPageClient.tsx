"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import {
  getDriverDqfReadinessSummary,
  type DriverDqfDocumentRow,
} from "@/lib/driver-dqf-readiness";
import {
  DRIVER_VAULT_UI_GROUP_DESCRIPTION,
  DRIVER_VAULT_UI_GROUP_LABEL,
  DRIVER_VAULT_UI_GROUP_ORDER,
  groupDqfRowsByVaultUi,
} from "@/lib/driver-vault-ui-groups";
import { dqfDocumentIssueId } from "@/lib/dqf-document-review-explanation";

type Props = {
  driverId: string;
};

function statusChipClass(overall: string): string {
  if (overall === "ready") return "bof-dqf-vault-chip bof-dqf-vault-chip--ok";
  if (overall === "needs_review") return "bof-dqf-vault-chip bof-dqf-vault-chip--warn";
  if (overall === "blocked") return "bof-dqf-vault-chip bof-dqf-vault-chip--bad";
  return "bof-dqf-vault-chip bof-dqf-vault-chip--danger";
}

function rowStatusPill(status: DriverDqfDocumentRow["status"]): string {
  if (status === "ready") return "bof-dqf-vault-pill bof-dqf-vault-pill--ok";
  if (status === "missing") return "bof-dqf-vault-pill bof-dqf-vault-pill--bad";
  if (status === "expired") return "bof-dqf-vault-pill bof-dqf-vault-pill--danger";
  if (status === "expiring_soon") return "bof-dqf-vault-pill bof-dqf-vault-pill--warn";
  return "bof-dqf-vault-pill bof-dqf-vault-pill--muted";
}

function formatSource(s: DriverDqfDocumentRow["source"]): string {
  const m: Record<string, string> = {
    public_file: "Public file",
    generated_summary: "Generated",
    template_output: "Template",
    structured_record: "Record",
    missing: "—",
  };
  return m[s] ?? s;
}

function previewVariant(row: DriverDqfDocumentRow): "cdl" | "medical" | "standard" {
  if (row.canonicalType === "cdl") return "cdl";
  if (row.canonicalType === "medical_card") return "medical";
  return "standard";
}

function rowNeedsExplain(row: DriverDqfDocumentRow): boolean {
  return (
    row.status === "missing" ||
    row.status === "expired" ||
    row.status === "needs_review" ||
    row.status === "pending_review"
  );
}

export function DriverVaultDqfPageClient({ driverId }: Props) {
  const { data, resetDocumentReviewOverrides } = useBofDemoData();
  const summary = useMemo(() => getDriverDqfReadinessSummary(data, driverId), [data, driverId]);
  const grouped = useMemo(() => groupDqfRowsByVaultUi(summary.documents), [summary.documents]);

  const firstSelectable = useMemo(() => {
    for (const g of DRIVER_VAULT_UI_GROUP_ORDER) {
      const row = grouped[g][0];
      if (row) return row.canonicalType;
    }
    return null;
  }, [grouped]);

  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    setSelected(firstSelectable);
  }, [driverId, firstSelectable]);

  const [expandedIssueKey, setExpandedIssueKey] = useState<string | null>(null);

  const effectiveCanonical = selected ?? firstSelectable;

  const selectedRow = useMemo(
    () => summary.documents.find((d) => d.canonicalType === effectiveCanonical) ?? null,
    [summary.documents, effectiveCanonical]
  );

  const resolvedDocIds = useMemo(
    () => new Set(data.documentReviewOverrides?.[driverId]?.resolvedIssueIds ?? []),
    [data.documentReviewOverrides, driverId]
  );

  const chipLabel =
    summary.overallStatus === "ready"
      ? "Ready"
      : summary.overallStatus === "needs_review"
        ? "Needs Review"
        : summary.overallStatus === "blocked"
          ? "Blocked"
          : "Action Required";

  function issueStatus(overall: string): "Blocked" | "Needs Review" | "Watch" {
    if (overall === "blocked") return "Blocked";
    if (overall === "needs_review") return "Needs Review";
    return "Watch";
  }

  function rowIssueTitle(row: DriverDqfDocumentRow): string {
    if (row.status === "missing") return "Required document missing";
    if (row.status === "expired") return `${row.label} expired`;
    if (row.status === "expiring_soon") return `${row.label} expires soon`;
    if (row.status === "needs_review" || row.status === "pending_review") {
      return row.label.toLowerCase().includes("safety")
        ? "Safety review needed"
        : "Driver file review";
    }
    return "Review reason needs clarification";
  }

  function rowIssueWhy(row: DriverDqfDocumentRow): string {
    if (row.status === "missing") {
      return "BOF cannot fully clear this driver file until the required document is added.";
    }
    if (row.status === "expired") {
      return "This expired credential can block dispatch readiness until it is renewed.";
    }
    if (row.status === "expiring_soon") {
      return "The driver is usable now, but this credential is approaching expiration.";
    }
    if (row.whyItMatters?.trim()) return row.whyItMatters;
    return "This driver is marked for review, but BOF has not identified a specific expired document, missing document, safety item, load issue, or settlement hold.";
  }

  function rowIssueFix(row: DriverDqfDocumentRow): string {
    if (row.recommendedFix?.trim()) return row.recommendedFix;
    return "Review the driver vault and replace this generic review flag with the specific document or safety item causing the issue.";
  }

  function toggleIssuePanel(key: string) {
    setExpandedIssueKey((prev) => (prev === key ? null : key));
  }

  return (
    <div className="bof-dqf-vault-dashboard min-h-screen bg-slate-50">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <header className="bof-dqf-vault-header">
          <div className="bof-dqf-vault-header-top">
            <Link href={`/drivers/${driverId}`} className="bof-dqf-vault-back">
              ← Driver hub
            </Link>
            <div className="bof-dqf-vault-title-block">
              <h1 className="bof-dqf-vault-title">
                {summary.driverName}
                <span className="bof-dqf-vault-id">{summary.driverId}</span>
              </h1>
              <p className="bof-dqf-vault-sub">Document Vault / Qualification File</p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.35rem" }}>
              {summary.overallStatus === "needs_review" || summary.overallStatus === "blocked" ? (
                <button
                  type="button"
                  className={statusChipClass(summary.overallStatus)}
                  style={{ cursor: "pointer", border: "none", font: "inherit" }}
                  onClick={() => setExpandedIssueKey((prev) => (prev === "__vault_review__" ? null : "__vault_review__"))}
                >
                  {chipLabel}
                </button>
              ) : (
                <span className={statusChipClass(summary.overallStatus)}>{chipLabel}</span>
              )}
              {(summary.overallStatus === "needs_review" || summary.overallStatus === "blocked") && (
                <button
                  type="button"
                  className="bof-dqf-vault-link"
                  style={{ fontSize: "0.85rem" }}
                  onClick={() => setExpandedIssueKey((prev) => (prev === "__vault_review__" ? null : "__vault_review__"))}
                >
                  What needs review?
                </button>
              )}
            </div>
          </div>
          {expandedIssueKey === "__vault_review__" ? (
            <div className="rounded border border-slate-800 bg-slate-950/60 p-3 text-sm">
              <p><strong>Title:</strong> Driver file review</p>
              <p><strong>Status:</strong> {issueStatus(summary.overallStatus)}</p>
              <p>
                <strong>Why:</strong> {summary.nextRecommendedAction || "The driver file has unresolved items that need review."}
              </p>
              <p>
                <strong>Recommended fix:</strong> Open the driver vault and address each missing, expired, or pending item below.
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link href={`/drivers/${driverId}/vault`} className="bof-cc-action-btn">Open driver vault</Link>
                <Link href={`/drivers/${driverId}#driver-review`} className="bof-cc-action-btn">Review driver file</Link>
              </div>
            </div>
          ) : null}
          <p className="bof-dqf-vault-next">{summary.nextRecommendedAction}</p>
          <div className="bof-dqf-vault-quick">
            <Link href={`/drivers/${driverId}/profile`} className="bof-dqf-vault-btn">
              Open profile
            </Link>
            <Link href={`/drivers/${driverId}/safety`} className="bof-dqf-vault-btn">
              Open safety
            </Link>
            <Link href={`/drivers/${driverId}#driver-review`} className="bof-dqf-vault-btn">
              Driver dispatch review
            </Link>
            <Link href="/dispatch" className="bof-dqf-vault-btn">
              Open dispatch
            </Link>
            <Link href={`/drivers/${driverId}/hr`} className="bof-dqf-vault-btn bof-dqf-vault-btn--secondary">
              Open HR workspace
            </Link>
            <button
              type="button"
              className="bof-dqf-vault-btn bof-dqf-vault-btn--ghost"
              onClick={() => resetDocumentReviewOverrides(driverId)}
            >
              Reset DQF demo marks
            </button>
            <Link href="/source-of-truth" className="bof-dqf-vault-btn bof-dqf-vault-btn--ghost">
              Regenerate (fleet source)
            </Link>
          </div>
        </header>

        <section className="bof-dqf-vault-metrics" aria-label="DQF Readiness Status">
          <h2 className="bof-dqf-vault-h2">DQF Readiness Status</h2>
          <div className="bof-dqf-vault-metric-grid">
            <div className="bof-dqf-vault-metric">
              <span className="bof-dqf-vault-metric-value bof-dqf-vault-metric--ok">{summary.readyCount}</span>
              <span className="bof-dqf-vault-metric-label">Ready</span>
            </div>
            <div className="bof-dqf-vault-metric">
              <span className="bof-dqf-vault-metric-value bof-dqf-vault-metric--bad">{summary.missingCount}</span>
              <span className="bof-dqf-vault-metric-label">Missing</span>
            </div>
            <div className="bof-dqf-vault-metric">
              <span className="bof-dqf-vault-metric-value bof-dqf-vault-metric--danger">{summary.expiredCount}</span>
              <span className="bof-dqf-vault-metric-label">Expired</span>
            </div>
            <div className="bof-dqf-vault-metric">
              <span className="bof-dqf-vault-metric-value bof-dqf-vault-metric--muted">{summary.needsReviewCount}</span>
              <span className="bof-dqf-vault-metric-label">Needs review</span>
            </div>
            <div className="bof-dqf-vault-metric">
              <span className="bof-dqf-vault-metric-value bof-dqf-vault-metric--warn">{summary.expiringSoonCount}</span>
              <span className="bof-dqf-vault-metric-label">Expiring soon</span>
            </div>
          </div>
        </section>

        <nav className="bof-dqf-vault-group-nav" aria-label="Vault document groups">
          {DRIVER_VAULT_UI_GROUP_ORDER.map((g) => {
            const n = grouped[g].length;
            if (!n) return null;
            return (
              <a key={g} href={`#vault-${g}`} className="bof-dqf-vault-group-nav-link">
                {DRIVER_VAULT_UI_GROUP_LABEL[g]}
                <span className="bof-dqf-vault-group-nav-count">{n}</span>
              </a>
            );
          })}
        </nav>

        <div className="bof-dqf-vault-layout">
          <div className="bof-dqf-vault-main">
            {DRIVER_VAULT_UI_GROUP_ORDER.map((g) => {
              const sectionRows = grouped[g];
              if (!sectionRows.length) return null;
              return (
                <section key={g} id={`vault-${g}`} className="bof-dqf-vault-panel">
                  <h2 className="bof-dqf-vault-h2">
                    {DRIVER_VAULT_UI_GROUP_LABEL[g]}
                    <span className="bof-dqf-vault-group-count"> ({sectionRows.length})</span>
                  </h2>
                  <p className="bof-dqf-vault-group-desc">{DRIVER_VAULT_UI_GROUP_DESCRIPTION[g]}</p>
                  <div className="bof-dqf-vault-table-wrap">
                    <table className="bof-dqf-vault-table">
                      <thead>
                        <tr>
                          <th>Document</th>
                          <th>Status</th>
                          <th>Expiration / review</th>
                          <th>Source</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sectionRows.map((row) => (
                          <Fragment key={row.canonicalType}>
                          <tr
                            className={
                              effectiveCanonical === row.canonicalType ? "bof-dqf-vault-tr--active" : undefined
                            }
                          >
                            <td>
                              <button
                                type="button"
                                className="bof-dqf-vault-doc-link"
                                onClick={() => setSelected(row.canonicalType)}
                              >
                                {row.label}
                              </button>
                              {row.optionalForReadiness ? (
                                <span className="bof-dqf-vault-optional">Optional</span>
                              ) : null}
                            </td>
                            <td>
                              <span className={rowStatusPill(row.status)}>{row.status.replace(/_/g, " ")}</span>
                              {resolvedDocIds.has(dqfDocumentIssueId(row.canonicalType)) ? (
                                <span className="bof-dqf-vault-pill bof-dqf-vault-pill--ok" style={{ marginLeft: 6 }}>
                                  Demo resolved
                                </span>
                              ) : null}
                            </td>
                            <td>{row.expirationDate ?? "—"}</td>
                            <td>{formatSource(row.source)}</td>
                            <td>
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "0.35rem",
                                  alignItems: "flex-start",
                                }}
                              >
                                {row.actionHref ? (
                                  <Link href={row.actionHref} className="bof-dqf-vault-link">
                                    {row.actionLabel ?? "Open"}
                                  </Link>
                                ) : (
                                  "—"
                                )}
                                {rowNeedsExplain(row) ? (
                                  <button
                                    type="button"
                                    className="bof-dqf-vault-link"
                                    onClick={() => toggleIssuePanel(`row:${row.canonicalType}`)}
                                  >
                                    What needs review?
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                          {expandedIssueKey === `row:${row.canonicalType}` && rowNeedsExplain(row) ? (
                            <tr>
                              <td colSpan={5}>
                                <div className="rounded border border-slate-800 bg-slate-950/60 p-3 text-sm">
                                  <p><strong>Title:</strong> {rowIssueTitle(row)}</p>
                                  <p><strong>Status:</strong> {issueStatus(summary.overallStatus)}</p>
                                  <p><strong>Why:</strong> {rowIssueWhy(row)}</p>
                                  <p><strong>Recommended fix:</strong> {rowIssueFix(row)}</p>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {row.actionHref ? (
                                      <Link href={row.actionHref} className="bof-cc-action-btn">
                                        {row.actionLabel ?? "Open related item"}
                                      </Link>
                                    ) : null}
                                    <Link href={`/drivers/${driverId}/vault`} className="bof-cc-action-btn">
                                      Open driver vault
                                    </Link>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ) : null}
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              );
            })}
          </div>

          <aside className="bof-dqf-vault-preview" aria-label="Selected document preview">
            {selectedRow?.fileUrl && /\.pdf(\?|$)/i.test(selectedRow.fileUrl) ? (
              <div>
                <h3 className="bof-dqf-vault-h3">{selectedRow.label}</h3>
                <p className="bof-dqf-vault-muted">PDF preview is not embedded — open the file to view at full resolution.</p>
                <a href={selectedRow.fileUrl} target="_blank" rel="noopener noreferrer" className="bof-dqf-vault-btn">
                  Open file
                </a>
              </div>
            ) : selectedRow?.fileUrl ? (
              <div>
                <h3 className="bof-dqf-vault-h3">{selectedRow.label}</h3>
                <div className={`bof-dqf-doc-preview bof-dqf-doc-preview--thumb bof-dqf-doc-preview--${previewVariant(selectedRow)}`}>
                  <div className="bof-dqf-doc-preview-frame bof-dqf-doc-preview-frame--thumb">
                    <iframe src={selectedRow.fileUrl} className="bof-dqf-doc-preview-iframe" title={selectedRow.label} />
                  </div>
                </div>
                <a
                  href={selectedRow.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bof-dqf-vault-btn"
                  style={{ marginTop: "0.75rem", display: "inline-block" }}
                >
                  Open file
                </a>
              </div>
            ) : (
              <p className="bof-dqf-vault-muted">Select a document with a preview URL, or open actions from the table.</p>
            )}

            {selectedRow && selectedRow.status !== "ready" ? (
              <div className="bof-dqf-vault-issue">
                <h4 className="bof-dqf-vault-h4">Why this matters</h4>
                <p>{selectedRow.whyItMatters}</p>
                <h4 className="bof-dqf-vault-h4">Recommended fix</h4>
                <p>{selectedRow.recommendedFix}</p>
                {selectedRow.actionHref ? (
                  <Link href={selectedRow.actionHref} className="bof-dqf-vault-btn">
                    {selectedRow.actionLabel ?? "Take action"}
                  </Link>
                ) : null}
                {rowNeedsExplain(selectedRow) ? (
                  <div style={{ marginTop: "0.65rem" }}>
                    <button
                      type="button"
                      className="bof-dqf-vault-btn bof-dqf-vault-btn--secondary"
                      onClick={() => toggleIssuePanel(`row:${selectedRow.canonicalType}`)}
                    >
                      Show review details
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </aside>
        </div>
      </div>

    </div>
  );
}
