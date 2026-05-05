"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { DriverAvatar } from "@/components/DriverAvatar";
import { DriverReviewInlinePanel } from "@/components/drivers/DriverReviewInlinePanel";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { driverPhotoPath } from "@/lib/driver-photo";
import { getDriverReviewExplanation, type DriverReviewExplanation, type DriverReviewIssueCategory } from "@/lib/driver-review-explanation";
import { getDriverTableRowModel } from "@/lib/drivers/driver-table-row-model";
import {
  driverHasCredentialExpiringWithin,
  driverHasMissingOrInvalidDoc,
  getDriverCommandSummary,
} from "@/lib/drivers/drivers-command-metrics";

type DriverStatusFilter =
  | "all"
  | "ready"
  | "needs_review"
  | "blocked"
  | "expiring_soon"
  | "missing_docs"
  | "safety_at_risk";

type DriverRow = {
  driverId: string;
  name: string;
  email?: string;
  phone?: string;
  avatar: string;
  status: "Active" | "Review" | "Blocked";
  eligibilityStatus: "ready" | "needs_review" | "blocked";
  dispatchEligibility: string;
  compliance: string;
  safety: "Elite" | "Standard" | "At Risk";
  settlement: "Paid" | "Pending" | "Hold / Review";
  currentOrNextLoad: string;
  documentSummary: string;
  blockerHref?: string;
  primaryDispatchBlockerId?: string;
  loadLinkId: string | null;
  complianceDrawerCategory?: DriverReviewIssueCategory;
  primaryReviewReason: string;
  reviewExplanation: DriverReviewExplanation;
};

function compactSentence(text: string): string {
  const first = text.split(".")[0]?.trim() ?? text.trim();
  if (!first) return text.trim();
  return first.endsWith(".") ? first : `${first}.`;
}

export function DriversRosterTable() {
  const {
    data,
    resolveDriverDispatchBlocker,
  } = useBofDemoData();
  const [expandedDriverId, setExpandedDriverId] = useState<string | null>(null);
  const [driverStatusFilter, setDriverStatusFilter] = useState<DriverStatusFilter>("all");
  const [credentialWindowDays, setCredentialWindowDays] = useState<90 | 60 | 30>(90);
  const [searchText, setSearchText] = useState("");

  const commandSummary = useMemo(
    () => getDriverCommandSummary(data, credentialWindowDays),
    [data, credentialWindowDays]
  );

  const driverRows = useMemo<DriverRow[]>(
    () =>
      data.drivers.map((driver) => {
        const m = getDriverTableRowModel(data, driver.id);
        const reviewExplanation = getDriverReviewExplanation(data, driver.id);
        const openIssues = m.issues.filter((i) => !i.resolved);
        const complianceFocusOrder: DriverReviewIssueCategory[] = [
          "dispatch",
          "credentials",
          "documents",
          "compliance",
        ];
        const complianceDrawerCategory = complianceFocusOrder.find((c) =>
          openIssues.some((i) => i.category === c)
        );
        return {
          driverId: m.driverId,
          name: m.driverName,
          email: driver.email,
          phone: driver.phone,
          avatar: driverPhotoPath(driver.id),
          status: m.statusLabel,
          eligibilityStatus: m.status,
          dispatchEligibility: m.dispatchEligibilityLabel,
          compliance: m.complianceLabel,
          safety: m.safetyLabel,
          settlement: m.settlementLabel,
          currentOrNextLoad: m.currentLoadLabel,
          documentSummary: m.documentsLabel,
          blockerHref: m.blockerHref,
          primaryDispatchBlockerId: m.primaryDispatchBlockerId,
          loadLinkId: m.loadLinkId,
          complianceDrawerCategory,
          primaryReviewReason:
            reviewExplanation.severity === "ready"
              ? m.primaryReviewReason
              : `${reviewExplanation.headline} — ${compactSentence(reviewExplanation.recommendedFix)}`,
          reviewExplanation,
        };
      }),
    [data]
  );

  const filteredDriverRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    let rows = driverRows;
    if (driverStatusFilter === "expiring_soon") {
      rows = rows.filter((row) =>
        driverHasCredentialExpiringWithin(data, row.driverId, credentialWindowDays)
      );
    } else if (driverStatusFilter === "missing_docs") {
      rows = rows.filter((row) => driverHasMissingOrInvalidDoc(data, row.driverId));
    } else if (driverStatusFilter === "safety_at_risk") {
      rows = rows.filter((row) => row.safety === "At Risk");
    } else if (driverStatusFilter !== "all") {
      rows = rows.filter((row) => row.eligibilityStatus === driverStatusFilter);
    }
    if (!query) return rows;
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(query) ||
        row.driverId.toLowerCase().includes(query) ||
        (row.email ?? "").toLowerCase().includes(query)
    );
  }, [credentialWindowDays, data, driverRows, driverStatusFilter, searchText]);

  return (
    <div className="bof-page bof-cc-page">
      <section className="bof-drivers-command-header" aria-labelledby="bof-drivers-command-title">
        <div className="bof-drivers-command-header__intro">
          <p className="bof-cc-hero-eyebrow">Driver file and document readiness</p>
          <h1 id="bof-drivers-command-title" className="bof-cc-hero-title">Driver Document Command Center</h1>
          <p className="bof-cc-panel-sub">
            {commandSummary.totalDrivers} drivers monitored · {commandSummary.needsReview} need document review ·{" "}
            {commandSummary.dispatchBlocked} blocked from dispatch
          </p>
          <div className="bof-drivers-lead-ctas" style={{ marginTop: "1rem" }}>
            <Link href="/documents" className="bof-cc-action-btn" style={{ marginRight: "0.5rem" }}>
              View document readiness
            </Link>
            <Link href="/documents/vault" className="bof-cc-action-btn">
              Open driver vault workspace
            </Link>
          </div>
        </div>
        <div className="bof-drivers-credential-window" aria-label="Driver roster controls">
          <label className="bof-drivers-credential-window__label" htmlFor="bof-drivers-search">Search driver</label>
          <input
            id="bof-drivers-search"
            className="bof-drivers-credential-window__select"
            placeholder="Name or driver ID"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <label className="bof-drivers-credential-window__label" htmlFor="bof-drivers-credential-window">
            Expiring window
          </label>
          <select
            id="bof-drivers-credential-window"
            className="bof-drivers-credential-window__select"
            value={credentialWindowDays}
            onChange={(e) => setCredentialWindowDays(Number(e.target.value) as 90 | 60 | 30)}
          >
            <option value={90}>90 days</option>
            <option value={60}>60 days</option>
            <option value={30}>30 days</option>
          </select>
        </div>
        <div className="bof-drivers-filter-bar" role="toolbar" aria-label="Filter driver roster">
          {[
            { id: "all" as const, label: "All" },
            { id: "ready" as const, label: "Ready" },
            { id: "needs_review" as const, label: "Needs review" },
            { id: "blocked" as const, label: "Dispatch blocked" },
            { id: "expiring_soon" as const, label: "Expiring soon" },
            { id: "missing_docs" as const, label: "Missing docs" },
            { id: "safety_at_risk" as const, label: "Safety at risk" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              className={`bof-drivers-filter-pill ${driverStatusFilter === f.id ? "bof-drivers-filter-pill--active" : ""}`}
              onClick={() => setDriverStatusFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      <section id="primary-driver-table" className="bof-cc-panel" aria-label="Driver roster table">
        <div className="bof-cc-panel-head">
          <h2 className="bof-h2">Driver roster ({filteredDriverRows.length} of {driverRows.length})</h2>
        </div>
        <div className="bof-cc-table-wrap">
          <table className="bof-cc-table">
            <thead>
              <tr>
                <th>Driver</th>
                <th>Status</th>
                <th>Dispatch Eligibility</th>
                <th>Compliance</th>
                <th>Safety</th>
                <th>Settlement</th>
                <th>Current / Next Load</th>
                <th>Documents</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDriverRows.map((row) => (
                <Fragment key={row.driverId}>
                <tr>
                  <td>
                    <div className="bof-cc-driver-cell">
                      <DriverAvatar name={row.name} photoUrl={row.avatar} size={40} />
                      <div>
                        <p className="bof-cc-driver-name">{row.name}</p>
                        <p className="bof-cc-driver-meta">{row.driverId}</p>
                        <p className="bof-cc-driver-meta">{row.email ?? row.phone ?? "No contact on file"}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <StatusChip
                      label={row.status}
                    />
                    {row.primaryReviewReason ? (
                      <p className="bof-cc-driver-meta" style={{ marginTop: "0.35rem" }}>
                        {row.primaryReviewReason}
                      </p>
                    ) : null}
                  </td>
                  <td>
                    <button 
                      type="button" 
                      className="bof-driver-review-dispatch-link text-left" 
                      onClick={() => setExpandedDriverId((prev) => (prev === row.driverId ? null : row.driverId))}
                    >
                      Show issue
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="bof-driver-review-dispatch-link text-left"
                      onClick={() => setExpandedDriverId((prev) => (prev === row.driverId ? null : row.driverId))}
                    >
                      {row.compliance}
                    </button>
                  </td>
                  <td><StatusChip label={row.safety} /></td>
                  <td><StatusChip label={row.settlement} /></td>
                  <td>{row.loadLinkId ? <Link href={`/loads/${encodeURIComponent(row.loadLinkId)}`} className="bof-driver-review-dispatch-link">{row.currentOrNextLoad}</Link> : row.currentOrNextLoad}</td>
                  <td>
                    <button type="button" className="bof-driver-review-dispatch-link text-left">
                      {row.documentSummary}
                    </button>
                  </td>
                  <td>
                    <div className="bof-cc-action-wrap">
                      {row.eligibilityStatus === "blocked" && row.primaryDispatchBlockerId ? (
                        <button
                          type="button"
                          className="bof-cc-action-btn bof-cc-action-btn-danger"
                          onClick={() =>
                            resolveDriverDispatchBlocker(
                              row.driverId,
                              row.primaryDispatchBlockerId!,
                              "Primary dispatch blocker — demo override"
                            )
                          }
                        >
                          Fix issue
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="bof-cc-action-btn bof-cc-action-btn-primary"
                          onClick={() => setExpandedDriverId((prev) => (prev === row.driverId ? null : row.driverId))}
                        >
                          {expandedDriverId === row.driverId ? "Hide issue" : "Show issue"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              {expandedDriverId === row.driverId ? (
                <tr>
                  <td colSpan={9}>
                    <DriverReviewInlinePanel 
                explanation={row.reviewExplanation} 
                driverId={row.driverId} 
                driverName={row.name} 
              />
                  </td>
                </tr>
              ) : null}
              </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>

          </div>
  );
}

function StatusChip({ label, onClick }: { label: string; onClick?: () => void }) {
  const cls =
    label === "Active" || label === "Elite" || label === "Paid"
      ? "bof-cc-chip bof-cc-chip-ok"
      : label === "Blocked" || label === "At Risk" || label === "Hold / Review"
        ? "bof-cc-chip bof-cc-chip-danger"
        : "bof-cc-chip bof-cc-chip-warn";
  if (onClick) {
    return (
      <button
        type="button"
        className={`${cls} bof-cc-chip-action`}
        onClick={onClick}
        title="Open driver review"
      >
        {label}
      </button>
    );
  }
  return <span className={cls}>{label}</span>;
}
