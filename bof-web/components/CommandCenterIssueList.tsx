"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CommandCenterIssueViewModel } from "@/lib/command-center/command-center-issue-view-model";

export function CommandCenterIssueList({
  items,
}: {
  items: CommandCenterIssueViewModel[];
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<"all" | "Critical" | "High" | "Medium" | "Watch">("all");
  const [typeFilter, setTypeFilter] = useState<
    "all" | "dispatch" | "driver_compliance" | "proof_documents" | "settlement" | "safety_claims" | "revenue"
  >("all");

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (severityFilter === "all" || i.severityLabel === severityFilter) &&
          (typeFilter === "all" || i.issueType === typeFilter)
      ),
    [items, severityFilter, typeFilter]
  );

  const critical = items.filter((i) => i.severityLabel === "Critical").length;
  const revenueAtRisk = items
    .map((i) => i.exposureLabel)
    .filter(Boolean)
    .length;
  const driversFlagged = new Set(items.map((i) => i.driverId).filter(Boolean)).size;
  const proofIssues = items.filter((i) => i.issueType === "proof_documents").length;

  return (
    <>
      <section className="bof-cc-risk-summary" aria-label="Compact risk summary">
        <h3 className="bof-cc-risk-summary-title">Risk Summary</h3>
        <div className="bof-cc-risk-summary-grid">
          <div className="bof-cc-risk-summary-item">
            <span className="bof-cc-risk-summary-label">Critical issues</span>
            <span className="bof-cc-risk-summary-value bof-cc-risk-summary--critical">{critical}</span>
          </div>
          <div className="bof-cc-risk-summary-item">
            <span className="bof-cc-risk-summary-label">Revenue at risk</span>
            <span className="bof-cc-risk-summary-value">{revenueAtRisk}</span>
          </div>
          <div className="bof-cc-risk-summary-item">
            <span className="bof-cc-risk-summary-label">Drivers blocked/under review</span>
            <span className="bof-cc-risk-summary-value">{driversFlagged}</span>
          </div>
          <div className="bof-cc-risk-summary-item">
            <span className="bof-cc-risk-summary-label">Loads with missing proof</span>
            <span className="bof-cc-risk-summary-value">{proofIssues}</span>
          </div>
        </div>
      </section>

      <div className="bof-drivers-filter-bar" role="toolbar" aria-label="Queue quick metrics">
        <button type="button" className={`bof-drivers-filter-pill ${severityFilter === "Critical" ? "bof-drivers-filter-pill--active" : ""}`} onClick={() => setSeverityFilter(severityFilter === "Critical" ? "all" : "Critical")}>
          Critical issues: {critical}
        </button>
        <button type="button" className={`bof-drivers-filter-pill ${typeFilter === "proof_documents" ? "bof-drivers-filter-pill--active" : ""}`} onClick={() => setTypeFilter(typeFilter === "proof_documents" ? "all" : "proof_documents")}>
          Loads with missing proof: {proofIssues}
        </button>
        <span className="bof-drivers-filter-pill">Revenue-risk rows: {revenueAtRisk}</span>
        <span className="bof-drivers-filter-pill">Drivers flagged: {driversFlagged}</span>
      </div>

      <div className="bof-drivers-filter-bar" role="toolbar" aria-label="Queue filters">
        {[
          ["all", "All"],
          ["dispatch", "Dispatch blockers"],
          ["driver_compliance", "Driver compliance"],
          ["proof_documents", "Proof / documents"],
          ["settlement", "Settlement holds"],
          ["safety_claims", "Safety / claims"],
          ["revenue", "Revenue risk"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`bof-drivers-filter-pill ${typeFilter === id ? "bof-drivers-filter-pill--active" : ""}`}
            onClick={() => setTypeFilter(id as typeof typeFilter)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bof-cc-attention-list">
        {filtered.map((item) => (
          <article key={item.id} className="bof-cc-attention-card">
            <div className="bof-cc-attention-row">
              <div className="bof-cc-attention-main">
                <h2 className="bof-cc-attention-title">{item.headline}</h2>
                <p className="bof-cc-attention-cause">
                  <strong>{item.severityLabel}</strong> — {item.severityMeaning}
                </p>
                <div className="bof-cc-attention-context">
                  {item.driverName && item.driverId && (
                    <span>
                      <Link href={`/drivers/${item.driverId}`} className="bof-driver-link">
                        {item.driverName}
                      </Link>
                      <code className="bof-code">{item.driverId}</code>
                    </span>
                  )}
                  {item.loadId && (
                    <span>
                      <Link
                        href={`/loads/${item.loadId}`}
                        className="bof-driver-link"
                      >
                        Load <code className="bof-code">{item.loadId}</code>
                      </Link>
                    </span>
                  )}
                  <span className="bof-cc-attention-owner">Owner: {item.owner}</span>
                </div>
                <p className="bof-cc-attention-money">{item.exposureLabel ?? "Payment hold risk"}</p>
                <div className="flex flex-wrap gap-2">
                  <Link href={item.primaryAction.href} className="bof-cc-next-action-btn bof-cc-next-action-btn-premium">
                    {item.primaryAction.label}
                  </Link>
                  <button type="button" className="bof-cc-action-btn" onClick={() => setOpenId(openId === item.id ? null : item.id)}>
                    {openId === item.id ? "Hide details" : "Details"}
                  </button>
                </div>
                {openId === item.id ? (
                  <div className="mt-2 rounded border border-slate-800 bg-slate-950/60 p-3 text-sm">
                    <p><strong>Issue:</strong> {item.headline}</p>
                    <p><strong>Severity:</strong> {item.severityLabel} — {item.severityMeaning}</p>
                    <p><strong>Why this matters:</strong> {item.whyItMatters}</p>
                    <p><strong>Recommended fix:</strong> {item.recommendedFix}</p>
                    <p><strong>Evidence / source:</strong> {item.driverId ?? "—"} {item.loadId ? `· ${item.loadId}` : ""} {item.settlementId ? `· ${item.settlementId}` : ""}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {item.secondaryActions.map((a) => (
                        <Link key={`${a.label}-${a.href}`} href={a.href} className="bof-cc-action-btn">
                          {a.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
