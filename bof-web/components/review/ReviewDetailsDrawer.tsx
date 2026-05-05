"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import type { ReviewDrawerIssue } from "./review-types";

const SEV_CLASS: Record<ReviewDrawerIssue["severity"], string> = {
  critical: "bof-driver-review-chip-sev-critical",
  high: "bof-driver-review-chip-sev-high",
  warning: "bof-driver-review-chip-sev-warning",
  info: "bof-driver-review-chip-sev-info",
};

function sevOrder(s: ReviewDrawerIssue["severity"]): number {
  if (s === "critical") return 0;
  if (s === "high") return 1;
  if (s === "warning") return 2;
  return 3;
}

export type ReviewDetailsDrawerProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  summary?: string;
  statusChip?: string;
  primaryAction?: { label: string; href: string };
  /** Hub shortcuts — same targets as roster “where to click next”. */
  quickLinks?: { label: string; href: string }[];
  issues: ReviewDrawerIssue[];
  categoryOrder: string[];
  categoryLabels: Record<string, string>;
  onResolveIssue?: (issueId: string) => void;
  headerExtra?: ReactNode;
  footerNote?: string;
};

export function ReviewDetailsDrawer({
  open,
  onClose,
  title,
  subtitle,
  summary,
  statusChip,
  primaryAction,
  quickLinks,
  issues,
  categoryOrder,
  categoryLabels,
  onResolveIssue,
  headerExtra,
  footerNote,
}: ReviewDetailsDrawerProps) {
  if (!open) return null;

  const sorted = [...issues].sort((a, b) => {
    const o = sevOrder(a.severity) - sevOrder(b.severity);
    if (o !== 0) return o;
    return a.title.localeCompare(b.title);
  });

  const grouped = new Map<string, ReviewDrawerIssue[]>();
  for (const cat of categoryOrder) grouped.set(cat, []);
  for (const issue of sorted) {
    const arr = grouped.get(issue.category) ?? [];
    arr.push(issue);
    grouped.set(issue.category, arr);
  }

  return (
    <div
      className="bof-driver-review-drawer-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bof-review-details-title"
    >
      <button
        type="button"
        aria-label="Close review details"
        style={{
          flex: 1,
          minWidth: 0,
          cursor: "default",
          border: "none",
          padding: 0,
          background: "transparent",
        }}
        onClick={onClose}
      />
      <aside className="bof-driver-review-drawer-panel" onClick={(e) => e.stopPropagation()}>
        <header className="bof-driver-review-drawer-head">
          <div>
            <h2 id="bof-review-details-title" className="bof-h2" style={{ margin: 0, fontSize: "1.05rem" }}>
              {title}
            </h2>
            {subtitle ? (
              <p className="bof-cc-panel-sub" style={{ margin: "0.35rem 0 0" }}>
                <span className="bof-code-break">{subtitle}</span>
              </p>
            ) : null}
            {statusChip ? (
              <p className="bof-cc-panel-sub" style={{ margin: "0.25rem 0 0" }}>
                Status: <strong>{statusChip}</strong>
              </p>
            ) : null}
          </div>
          <button type="button" className="bof-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="bof-driver-review-drawer-body">
          {summary ? (
            <p style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", color: "var(--bof-muted)" }}>{summary}</p>
          ) : null}
          {primaryAction ? (
            <p style={{ margin: "0 0 1rem" }}>
              <Link href={primaryAction.href} className="bof-cc-action-btn bof-cc-action-btn-primary">
                {primaryAction.label}
              </Link>
            </p>
          ) : null}
          {quickLinks && quickLinks.length > 0 ? (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.4rem",
                margin: "0 0 1rem",
                alignItems: "center",
              }}
            >
              {quickLinks.map((q) => (
                <Link key={q.href + q.label} href={q.href} className="bof-cc-action-btn">
                  {q.label}
                </Link>
              ))}
            </div>
          ) : null}
          {headerExtra}
          {footerNote ? (
            <p className="bof-cc-panel-sub" style={{ margin: "0 0 1rem", fontSize: "0.78rem" }}>
              {footerNote}
            </p>
          ) : null}

          {sorted.length === 0 ? (
            <p className="bof-cc-panel-sub">No review items in this view.</p>
          ) : (
            categoryOrder.map((cat) => {
              const items = grouped.get(cat) ?? [];
              if (!items.length) return null;
              const catLabel = categoryLabels[cat] ?? cat;
              return (
                <section key={cat} style={{ marginBottom: "1.25rem" }}>
                  <h3 className="bof-cc-panel-title" style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                    {catLabel}
                  </h3>
                  {items.map((issue) => (
                    <article
                      key={issue.id}
                      className={`bof-driver-review-issue${issue.resolved ? " bof-driver-review-issue-resolved" : ""}`}
                    >
                      <div className="bof-driver-review-chip-row">
                        <span className={`bof-driver-review-chip ${SEV_CLASS[issue.severity]}`}>{issue.severity}</span>
                        <span className="bof-driver-review-chip">{issue.category}</span>
                        {issue.resolved ? (
                          <span className="bof-driver-review-chip bof-driver-review-chip-sev-info">
                            Resolved for demo
                          </span>
                        ) : null}
                      </div>
                      <p style={{ margin: "0 0 0.35rem", fontWeight: 600, fontSize: "0.92rem" }}>{issue.title}</p>
                      <p style={{ margin: "0 0 0.35rem", fontSize: "0.82rem", color: "var(--bof-muted)" }}>
                        <strong>Why:</strong> {issue.detail}
                      </p>
                      <p style={{ margin: "0 0 0.35rem", fontSize: "0.82rem" }}>
                        <strong>Impact:</strong> {issue.whyItMatters}
                      </p>
                      <p style={{ margin: "0 0 0.5rem", fontSize: "0.82rem" }}>
                        <strong>Recommended fix:</strong> {issue.recommendedFix}
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", alignItems: "center" }}>
                        {issue.actionHref && issue.actionLabel ? (
                          <Link href={issue.actionHref} className="bof-cc-action-btn">
                            {issue.actionLabel}
                          </Link>
                        ) : null}
                        {onResolveIssue && issue.canResolveInDemo && !issue.resolved ? (
                          <button
                            type="button"
                            className="bof-cc-action-btn bof-cc-action-btn-danger"
                            onClick={() => onResolveIssue(issue.id)}
                          >
                            {issue.dispatchBlockerId ? "Resolve blocker for demo" : "Mark reviewed for demo"}
                          </button>
                        ) : null}
                        {issue.canResolveInDemo ? (
                          <span style={{ fontSize: "0.7rem", color: "var(--bof-muted)" }}>
                            Demo action — not production
                          </span>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </section>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
}
