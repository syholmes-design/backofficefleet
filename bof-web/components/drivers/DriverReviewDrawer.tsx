"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { BofData } from "@/lib/load-bof-data";
import {
  getDriverReviewExplanation,
  type DriverReviewIssue,
  type DriverReviewIssueCategory,
} from "@/lib/driver-review-explanation";

const CATEGORY_ORDER: DriverReviewIssueCategory[] = [
  "dispatch",
  "credentials",
  "documents",
  "compliance",
  "safety",
  "settlement",
];

const CATEGORY_LABEL: Record<DriverReviewIssueCategory, string> = {
  dispatch: "Dispatch",
  credentials: "Credentials",
  documents: "Documents",
  compliance: "Compliance",
  safety: "Safety",
  settlement: "Settlement",
};

const SEV_CLASS: Record<DriverReviewIssue["severity"], string> = {
  critical: "bof-driver-review-chip-sev-critical",
  high: "bof-driver-review-chip-sev-high",
  warning: "bof-driver-review-chip-sev-warning",
  info: "bof-driver-review-chip-sev-info",
};

function sevOrder(s: DriverReviewIssue["severity"]): number {
  if (s === "critical") return 0;
  if (s === "high") return 1;
  if (s === "warning") return 2;
  return 3;
}

export type DriverReviewDrawerProps = {
  data: BofData;
  driverId: string;
  filterCategory?: DriverReviewIssueCategory | null;
  onClose: () => void;
  resolveDriverDispatchBlocker: (driverId: string, reasonId: string, note?: string) => void;
  resolveDriverReviewIssue: (driverId: string, issueId: string, note?: string) => void;
  resetDriverReviewOverrides: (driverId: string) => void;
};

export function DriverReviewDrawer({
  data,
  driverId,
  filterCategory,
  onClose,
  resolveDriverDispatchBlocker,
  resolveDriverReviewIssue,
  resetDriverReviewOverrides,
}: DriverReviewDrawerProps) {
  const explanation = useMemo(() => getDriverReviewExplanation(data, driverId), [data, driverId]);

  const displayIssues = useMemo(() => {
    let list = [...explanation.issues];
    if (filterCategory) {
      list = list.filter((i) => i.category === filterCategory);
    }
    list.sort((a, b) => {
      const o = sevOrder(a.severity) - sevOrder(b.severity);
      if (o !== 0) return o;
      return a.title.localeCompare(b.title);
    });
    return list;
  }, [explanation.issues, filterCategory]);

  const topStatus =
    explanation.reviewStatus === "ready"
      ? "Ready"
      : explanation.reviewStatus === "needs_review"
        ? "Needs Review"
        : "Blocked";

  const grouped = useMemo(() => {
    const m = new Map<DriverReviewIssueCategory, DriverReviewIssue[]>();
    for (const cat of CATEGORY_ORDER) m.set(cat, []);
    for (const issue of displayIssues) {
      const arr = m.get(issue.category) ?? [];
      arr.push(issue);
      m.set(issue.category, arr);
    }
    return m;
  }, [displayIssues]);

  return (
    <div
      className="bof-driver-review-drawer-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bof-driver-review-title"
    >
      <button
        type="button"
        aria-label="Close driver review"
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
            <h2 id="bof-driver-review-title" className="bof-h2" style={{ margin: 0, fontSize: "1.05rem" }}>
              Driver Review — {explanation.driverName}
            </h2>
            <p className="bof-cc-panel-sub" style={{ margin: "0.35rem 0 0" }}>
              <span className="bof-code-break">{explanation.driverId}</span>
            </p>
            <p className="bof-cc-panel-sub" style={{ margin: "0.25rem 0 0" }}>
              Status: <strong>{topStatus}</strong>
              {filterCategory ? (
                <>
                  {" "}
                  · Filter: {CATEGORY_LABEL[filterCategory]}
                </>
              ) : null}
            </p>
          </div>
          <button type="button" className="bof-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="bof-driver-review-drawer-body">
          <p style={{ margin: "0 0 0.75rem", fontSize: "0.9rem", color: "var(--bof-muted)" }}>{explanation.summary}</p>
          {explanation.primaryAction ? (
            <p style={{ margin: "0 0 1rem" }}>
              <Link href={explanation.primaryAction.href} className="bof-cc-action-btn bof-cc-action-btn-primary">
                {explanation.primaryAction.label}
              </Link>
            </p>
          ) : null}

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
            <button
              type="button"
              className="bof-cc-action-btn"
              onClick={() => resetDriverReviewOverrides(driverId)}
            >
              Reset demo review marks (this driver)
            </button>
          </div>

          {displayIssues.length === 0 ? (
            <p className="bof-cc-panel-sub">No issues in this view.</p>
          ) : (
            CATEGORY_ORDER.map((cat) => {
              const items = grouped.get(cat) ?? [];
              if (!items.length) return null;
              return (
                <section key={cat} style={{ marginBottom: "1.25rem" }}>
                  <h3 className="bof-cc-panel-title" style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>
                    {CATEGORY_LABEL[cat]}
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
                          <span className="bof-driver-review-chip bof-driver-review-chip-sev-info">Resolved for demo</span>
                        ) : null}
                      </div>
                      <p style={{ margin: "0 0 0.35rem", fontWeight: 600, fontSize: "0.92rem" }}>{issue.title}</p>
                      <p style={{ margin: "0 0 0.35rem", fontSize: "0.82rem", color: "var(--bof-muted)" }}>{issue.detail}</p>
                      <p style={{ margin: "0 0 0.35rem", fontSize: "0.82rem" }}>
                        <strong>Why it matters:</strong> {issue.whyItMatters}
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
                        {issue.canResolveInDemo && !issue.resolved ? (
                          <button
                            type="button"
                            className="bof-cc-action-btn bof-cc-action-btn-danger"
                            onClick={() => {
                              if (issue.dispatchBlockerId) {
                                resolveDriverDispatchBlocker(
                                  driverId,
                                  issue.dispatchBlockerId,
                                  "Driver review — resolve blocker (demo)"
                                );
                              } else {
                                resolveDriverReviewIssue(driverId, issue.id, "Driver review — mark reviewed (demo)");
                              }
                            }}
                          >
                            {issue.dispatchBlockerId ? "Resolve blocker for demo" : "Mark reviewed for demo"}
                          </button>
                        ) : null}
                        {issue.canResolveInDemo ? (
                          <span style={{ fontSize: "0.7rem", color: "var(--bof-muted)" }}>Demo action — not production</span>
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
