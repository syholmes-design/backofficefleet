"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { BofData } from "@/lib/load-bof-data";
import {
  filterDqfRowsByGroup,
  getDriverDqfReadinessSummary,
  type DriverDqfDocumentRow,
} from "@/lib/driver-dqf-readiness";

type Props = {
  data: BofData;
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

export function DriverVaultDqfPageClient({ data, driverId }: Props) {
  const summary = useMemo(() => getDriverDqfReadinessSummary(data, driverId), [data, driverId]);
  const core = useMemo(() => filterDqfRowsByGroup(summary.documents, "core_dqf"), [summary.documents]);
  const hr = useMemo(() => filterDqfRowsByGroup(summary.documents, "hr_workflow"), [summary.documents]);
  const gen = useMemo(() => filterDqfRowsByGroup(summary.documents, "generated_summaries"), [summary.documents]);
  const supplemental = useMemo(
    () => summary.documents.filter((d) => d.group === "vault_supplemental"),
    [summary.documents]
  );

  const defaultSelect = core[0]?.canonicalType ?? hr[0]?.canonicalType ?? null;
  const [selected, setSelected] = useState<string | null>(defaultSelect);
  const [hrOpen, setHrOpen] = useState(false);
  const [genOpen, setGenOpen] = useState(false);

  const selectedRow = useMemo(
    () => summary.documents.find((d) => d.canonicalType === selected) ?? null,
    [summary.documents, selected]
  );

  const chipLabel =
    summary.overallStatus === "ready"
      ? "Ready"
      : summary.overallStatus === "needs_review"
        ? "Needs Review"
        : summary.overallStatus === "blocked"
          ? "Blocked"
          : "Action Required";

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
            <span className={statusChipClass(summary.overallStatus)}>{chipLabel}</span>
          </div>
          <p className="bof-dqf-vault-next">{summary.nextRecommendedAction}</p>
          <div className="bof-dqf-vault-quick">
            <Link href={`/drivers/${driverId}/profile`} className="bof-dqf-vault-btn">
              Open profile
            </Link>
            <Link href={`/drivers/${driverId}/safety`} className="bof-dqf-vault-btn">
              Open safety
            </Link>
            <Link href="/dispatch" className="bof-dqf-vault-btn">
              Open dispatch
            </Link>
            <Link href={`/drivers/${driverId}/hr`} className="bof-dqf-vault-btn bof-dqf-vault-btn--secondary">
              HR / generated packet
            </Link>
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

        <div className="bof-dqf-vault-layout">
          <div className="bof-dqf-vault-main">
            <section className="bof-dqf-vault-panel">
              <h2 className="bof-dqf-vault-h2">Core DQF documents</h2>
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
                    {core.map((row) => (
                      <tr
                        key={row.canonicalType}
                        className={selected === row.canonicalType ? "bof-dqf-vault-tr--active" : undefined}
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
                        </td>
                        <td>{row.expirationDate ?? "—"}</td>
                        <td>{formatSource(row.source)}</td>
                        <td>
                          {row.actionHref ? (
                            <Link href={row.actionHref} className="bof-dqf-vault-link">
                              {row.actionLabel ?? "Open"}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="bof-dqf-vault-panel">
              <button type="button" className="bof-dqf-vault-collapse-head" onClick={() => setHrOpen((o) => !o)}>
                <span>Applications &amp; HR workflow</span>
                <span>{hrOpen ? "▼" : "▶"}</span>
              </button>
              {hrOpen ? <DqfSubTable rows={hr} selected={selected} onSelect={setSelected} /> : null}
            </section>

            <section className="bof-dqf-vault-panel">
              <button type="button" className="bof-dqf-vault-collapse-head" onClick={() => setGenOpen((o) => !o)}>
                <span>Generated administrative summaries</span>
                <span>{genOpen ? "▼" : "▶"}</span>
              </button>
              {genOpen ? <DqfSubTable rows={gen} selected={selected} onSelect={setSelected} /> : null}
            </section>

            {supplemental.length > 0 ? (
              <section className="bof-dqf-vault-panel">
                <h2 className="bof-dqf-vault-h2">Additional compliance (generated)</h2>
                <DqfSubTable rows={supplemental} selected={selected} onSelect={setSelected} />
              </section>
            ) : null}
          </div>

          <aside className="bof-dqf-vault-preview" aria-label="Selected document preview">
            {selectedRow?.fileUrl && /\.pdf(\?|$)/i.test(selectedRow.fileUrl) ? (
              <div>
                <h3 className="bof-dqf-vault-h3">{selectedRow.label}</h3>
                <p className="bof-dqf-vault-muted">PDF preview is not embedded — open the file to view at full resolution.</p>
                <a
                  href={selectedRow.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bof-dqf-vault-btn"
                >
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
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}

function DqfSubTable({
  rows,
  selected,
  onSelect,
}: {
  rows: DriverDqfDocumentRow[];
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  if (!rows.length) return <p className="bof-dqf-vault-muted">No rows.</p>;
  return (
    <div className="bof-dqf-vault-table-wrap">
      <table className="bof-dqf-vault-table">
        <thead>
          <tr>
            <th>Document</th>
            <th>Status</th>
            <th>Expiration</th>
            <th>Source</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.canonicalType} className={selected === row.canonicalType ? "bof-dqf-vault-tr--active" : undefined}>
              <td>
                <button type="button" className="bof-dqf-vault-doc-link" onClick={() => onSelect(row.canonicalType)}>
                  {row.label}
                </button>
              </td>
              <td>
                <span className={rowStatusPill(row.status)}>{row.status.replace(/_/g, " ")}</span>
              </td>
              <td>{row.expirationDate ?? "—"}</td>
              <td>{formatSource(row.source)}</td>
              <td>
                {row.fileUrl ? (
                  <a href={row.fileUrl} target="_blank" rel="noopener noreferrer" className="bof-dqf-vault-link">
                    Open
                  </a>
                ) : (
                  "—"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
