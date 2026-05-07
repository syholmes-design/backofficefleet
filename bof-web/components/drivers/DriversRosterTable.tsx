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
} from "@/lib/drivers/drivers-command-metrics";
import { getDriverWorkerType, getDriverReadinessSummary, getDriverPolicyAcknowledgments, getDriverSettlementSummary } from "@/lib/driver-readiness-ui";
import type { WorkerType } from "@/lib/driver-pay-settlement-methods";

type DriverStatusFilter =
  | "all"
  | "ready"
  | "needs_review"
  | "blocked"
  | "expiring_soon"
  | "missing_docs"
  | "employee_driver"
  | "owner_operator"
  | "documents_expiring"
  | "missing_acknowledgments"
  | "settlement_review";

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
  workerType?: WorkerType;
  readinessSummary?: {
    status: 'ready' | 'needs_review' | 'blocked';
    primaryReason: string;
    businessImpact: string;
    requiredFix: string;
    ownerTeam: string;
    relatedDocument?: string;
    dueDate?: string;
    fixAction?: {
      label: string;
      href?: string;
    };
  };
  settlementSummary?: string;
  ownerOperatorPacketStatus?: string;
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
        const workerType = getDriverWorkerType(driver.id, data);
        const readinessSummary = getDriverReadinessSummary(driver.id, data);
        
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
          workerType,
          readinessSummary,
        };
      }),
    [data]
  );

  const filteredDriverRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    let rows = driverRows;
    
    // Handle existing filters
    if (driverStatusFilter === "expiring_soon") {
      rows = rows.filter((row) =>
        driverHasCredentialExpiringWithin(data, row.driverId, credentialWindowDays)
      );
    } else if (driverStatusFilter === "missing_docs") {
      rows = rows.filter((row) => driverHasMissingOrInvalidDoc(data, row.driverId));
    } else if (driverStatusFilter === "employee_driver") {
      rows = rows.filter((row) => row.workerType === 'Employee Driver');
    } else if (driverStatusFilter === "owner_operator") {
      rows = rows.filter((row) => row.workerType === 'Independent Contractor / Owner-Operator');
    } else if (driverStatusFilter === "documents_expiring") {
      rows = rows.filter((row) => 
        driverHasCredentialExpiringWithin(data, row.driverId, 90)
      );
    } else if (driverStatusFilter === "missing_acknowledgments") {
      rows = rows.filter((row) => {
        const acknowledgments = getDriverPolicyAcknowledgments(row.driverId, data);
        return acknowledgments.some(ack => ack.status === 'missing');
      });
    } else if (driverStatusFilter === "settlement_review") {
      rows = rows.filter((row) => {
        const settlement = getDriverSettlementSummary(row.driverId, data);
        return settlement.status === 'needs_review';
      });
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
          <p className="bof-cc-hero-eyebrow">Driver Document Center</p>
          <h1 id="bof-drivers-command-title" className="bof-cc-hero-title">Driver Document Center</h1>
          <p className="bof-cc-panel-sub">
            Qualification, HR, payroll-support, and administrative documents for every driver.
          </p>
          <p className="bof-cc-panel-sub" style={{ fontSize: "0.875rem", opacity: 0.8, marginTop: "0.5rem" }}>
            Safety, settlement, and dispatch exceptions are managed in Command Center, Safety, Settlements, and Dispatch. This page focuses on driver documents.
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
            { id: "blocked" as const, label: "Blocked" },
            { id: "expiring_soon" as const, label: "Expiring soon" },
            { id: "missing_docs" as const, label: "Missing docs" },
            { id: "employee_driver" as const, label: "Employee Driver" },
            { id: "owner_operator" as const, label: "Owner-Operator" },
            { id: "documents_expiring" as const, label: "Documents Expiring" },
            { id: "missing_acknowledgments" as const, label: "Missing Acknowledgments" },
            { id: "settlement_review" as const, label: "Settlement Review" },
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

      <section id="primary-driver-table" className="bof-cc-panel" aria-label="Driver document center">
        <div className="bof-cc-panel-head">
          <h2 className="bof-h2">Driver Document Center ({filteredDriverRows.length} of {driverRows.length})</h2>
        </div>
        <div className="bof-driver-cards-grid" style={{ paddingBottom: "6rem" }}>
          {filteredDriverRows.map((row) => (
            <Fragment key={row.driverId}>
              <div className="bof-driver-card">
                {/* Driver Header */}
                <div className="bof-driver-card-header">
                  <div className="bof-driver-card-info">
                    <DriverAvatar name={row.name} photoUrl={row.avatar} size={48} />
                    <div className="bof-driver-card-details">
                      <h3 className="bof-driver-card-name">{row.name}</h3>
                      <p className="bof-driver-card-id">{row.driverId}</p>
                      <p className="bof-driver-card-contact">{row.email ?? row.phone ?? "No contact on file"}</p>
                      {/* Worker Type Badge */}
                      {row.workerType && (
                        <span 
                          className={`bof-driver-card-worker-type ${row.workerType === 'Employee Driver' ? 'employee' : 'owner-operator'}`}
                        >
                          {row.workerType}
                        </span>
                      )}
                    </div>
                  </div>
                  <StatusChip label={row.status} />
                </div>

                {/* Primary Issue - Visible without clicking */}
                {row.readinessSummary && row.readinessSummary.status !== 'ready' && (
                  <div className="bof-driver-card-issue">
                    <div className="bof-driver-card-issue-header">
                      <span className="bof-driver-card-issue-label">{row.readinessSummary.status === 'blocked' ? 'Blocked' : 'Needs Review'}</span>
                    </div>
                    <p className="bof-driver-card-issue-text">{row.readinessSummary.primaryReason}</p>
                    {row.readinessSummary.dueDate && (
                      <p className="bof-driver-card-issue-due">Due: {row.readinessSummary.dueDate}</p>
                    )}
                  </div>
                )}

                {/* Document Status */}
                <div className="bof-driver-card-status">
                  <div className="bof-driver-card-status-row">
                    <span className="bof-driver-card-status-label">Qualification Documents:</span>
                    <span className="bof-driver-card-status-value">{row.documentSummary}</span>
                  </div>
                  <div className="bof-driver-card-status-row">
                    <span className="bof-driver-card-status-label">Compliance Status:</span>
                    <button
                      type="button"
                      className="bof-driver-card-status-link"
                      onClick={() => setExpandedDriverId((prev) => (prev === row.driverId ? null : row.driverId))}
                    >
                      {row.compliance}
                    </button>
                  </div>
                </div>

                {/* Document Links */}
                <div className="bof-driver-card-docs">
                  <div className="bof-driver-card-doc-section">
                    <h4 className="bof-driver-card-doc-title">HR / Employment Admin</h4>
                    <div className="bof-driver-card-doc-chips">
                      <Link href={`/generated/drivers/${row.driverId}/hr-payroll/benefits-enrollment.html`} className="bof-driver-card-doc-chip">
                        Benefits Enrollment
                      </Link>
                      <Link href={`/generated/drivers/${row.driverId}/hr-payroll/life-insurance-beneficiary-election.html`} className="bof-driver-card-doc-chip">
                        Life Insurance Election
                      </Link>
                    </div>
                  </div>
                  <div className="bof-driver-card-doc-section">
                    <h4 className="bof-driver-card-doc-title">Payroll / Deduction Support</h4>
                    <div className="bof-driver-card-doc-chips">
                      <Link href={`/generated/drivers/${row.driverId}/hr-payroll/flexible-spending-account-election.html`} className="bof-driver-card-doc-chip">
                        FSA Election
                      </Link>
                      <Link href={`/generated/drivers/${row.driverId}/hr-payroll/garnishment-withholding-summary.html`} className="bof-driver-card-doc-chip">
                        Garnishment Summary
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="bof-driver-card-actions">
                  <Link href={`/documents/vault/${row.driverId}`} className="bof-driver-card-action-btn bof-driver-card-action-btn-secondary">
                    Open Driver Vault
                  </Link>
                  {row.eligibilityStatus === "blocked" && row.primaryDispatchBlockerId ? (
                    <button
                      type="button"
                      className="bof-driver-card-action-btn bof-driver-card-action-btn-danger"
                      onClick={() =>
                        resolveDriverDispatchBlocker(
                          row.driverId,
                          row.primaryDispatchBlockerId!,
                          "Primary dispatch blocker — demo override"
                        )
                      }
                    >
                      Fix Issue
                    </button>
                  ) : (
                    <Link href={`/drivers/${row.driverId}`} className="bof-driver-card-action-btn bof-driver-card-action-btn-primary">
                      View Driver
                    </Link>
                  )}
                </div>
              </div>

              {/* Expanded Issue Panel */}
              {expandedDriverId === row.driverId ? (
                <div className="bof-driver-card-expanded">
                  <DriverReviewInlinePanel 
                    explanation={row.reviewExplanation} 
                    driverId={row.driverId} 
                    driverName={row.name} 
                  />
                </div>
              ) : null}
            </Fragment>
          ))}
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
