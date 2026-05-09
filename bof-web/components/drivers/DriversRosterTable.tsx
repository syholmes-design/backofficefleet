"use client";

import Link from "next/link";
import Image from "next/image";
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

// Drivers Hero Component with full-span Emma Brown background
function DriversHero() {
  return (
    <div className="bof-drivers-hero" style={{
      position: 'relative',
      borderRadius: '12px',
      overflow: 'hidden',
      height: '320px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
      marginBottom: '2rem'
    }}>
      {/* Full-span Background Image */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(90deg, rgba(11, 165, 164, 0.85) 0%, rgba(11, 165, 164, 0.6) 40%, rgba(11, 165, 164, 0.3) 70%, rgba(11, 165, 164, 0.1) 100%)',
        zIndex: 1
      }} />
      <Image 
        src="/images/drivers-emma-brown-hero.png" 
        alt="Professional driver team" 
        fill
        style={{ 
          objectFit: 'cover',
          objectPosition: 'center 20%',
          zIndex: 0
        }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = driverPhotoPath('DRV-009');
        }}
      />
      
      {/* Right-side Content Overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: '50%',
        zIndex: 2,
        padding: '3rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: 'linear-gradient(to left, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.4) 50%, transparent 100%)'
      }}>
        <div style={{ maxWidth: '400px' }}>
          <p style={{ 
            color: '#0BA5A4', 
            fontSize: '0.875rem', 
            fontWeight: '600', 
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: '0 0 0.5rem 0'
          }}>
            Driver Operations
          </p>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '700', 
            color: 'white',
            margin: '0 0 1rem 0',
            lineHeight: '1.1'
          }}>
            Drivers Command Center
          </h1>
          <p style={{ 
            fontSize: '1.125rem', 
            color: 'rgba(255, 255, 255, 0.9)',
            lineHeight: '1.6',
            margin: '0 0 1.5rem 0'
          }}>
            Track driver readiness, documents, acknowledgments, eligibility, and fix paths from one source-of-truth view.
          </p>
          <p style={{ 
            fontSize: '0.875rem', 
            color: 'rgba(255, 255, 255, 0.7)',
            lineHeight: '1.5',
            margin: '0 0 2rem 0',
            fontStyle: 'italic'
          }}>
            Every review item should explain what changed, why it matters, and what action resolves it.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link href="/documents" style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              color: '#0BA5A4',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)'
            }}>
              Review Driver Files
            </Link>
            <Link href="/documents/vault" style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)'
            }}>
              View Documents
            </Link>
            <Link href="/drivers?driverStatusFilter=needs_review" style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'rgba(220, 38, 38, 0.9)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: '600',
              display: 'inline-flex',
              alignItems: 'center',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)'
            }}>
              Fix Attention Items
            </Link>
          </div>
        </div>
      </div>
      
      {/* Mobile Responsive */}
      <style jsx>{`
        @media (max-width: 768px) {
          .bof-drivers-hero {
            height: 400px;
          }
          .bof-drivers-hero > div:last-child {
            width: 100%;
            background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.4) 50%, transparent 100%);
            padding: 2rem;
          }
          .bof-drivers-hero h1 {
            font-size: 2rem;
          }
        }
      `}</style>
    </div>
  );
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
      {/* Full-span Hero Section */}
      <DriversHero />

      {/* Filter and Search Section */}
      <section className="bof-drivers-command-header" aria-labelledby="bof-drivers-filters-title" style={{ marginBottom: '1rem' }}>
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
                  <StatusChip label={row.status} driverId={row.driverId} />
                </div>

                {/* Primary Issue - Visible without clicking */}
                {row.readinessSummary && row.readinessSummary.status !== 'ready' && (
                  <div className="bof-driver-card-issue" style={{
                    background: row.readinessSummary.status === 'blocked' ? '#FEF2F2' : '#FFFBEB',
                    border: `1px solid ${row.readinessSummary.status === 'blocked' ? '#FCA5A5' : '#FCD34D'}`,
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div className="bof-driver-card-issue-header" style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.5rem'
                    }}>
                      <span className="bof-driver-card-issue-label" style={{
                        background: row.readinessSummary.status === 'blocked' ? '#DC2626' : '#D97706',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        textTransform: 'uppercase'
                      }}>
                        {row.readinessSummary.status === 'blocked' ? 'Blocked' : 'Needs Review'}
                      </span>
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: row.readinessSummary.status === 'blocked' ? '#DC2626' : '#D97706'
                      }}>
                        Dispatch: {row.readinessSummary.status === 'blocked' ? 'Not Eligible' : 'Review Required'}
                      </span>
                    </div>
                    
                    {/* Enhanced specific reason display */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.6)',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      marginBottom: '0.75rem',
                      border: '1px solid rgba(0, 0, 0, 0.1)'
                    }}>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '0.25rem'
                      }}>
                        Issue: {row.readinessSummary.primaryReason}
                      </div>
                      {row.readinessSummary.businessImpact && (
                        <div style={{
                          fontSize: '0.75rem',
                          color: '#6B7280',
                          marginBottom: '0.5rem'
                        }}>
                          Why it matters: {row.readinessSummary.businessImpact}
                        </div>
                      )}
                      {row.readinessSummary.dueDate && (
                        <div style={{
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          color: row.readinessSummary.status === 'blocked' ? '#DC2626' : '#D97706'
                        }}>
                          Due: {row.readinessSummary.dueDate}
                        </div>
                      )}
                    </div>
                    
                    {/* Fix action with clear explanation */}
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center',
                      flexWrap: 'wrap'
                    }}>
                      {row.readinessSummary.fixAction?.href && (
                        <Link href={row.readinessSummary.fixAction.href} style={{
                          padding: '0.375rem 0.75rem',
                          backgroundColor: row.readinessSummary.status === 'blocked' ? '#DC2626' : '#D97706',
                          color: 'white',
                          textDecoration: 'none',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          display: 'inline-flex',
                          alignItems: 'center',
                          transition: 'all 0.2s ease'
                        }}>
                          Fix: {row.readinessSummary.fixAction.label}
                        </Link>
                      )}
                      <Link href={`/drivers/${row.driverId}/vault`} style={{
                        padding: '0.375rem 0.75rem',
                        backgroundColor: 'white',
                        color: row.readinessSummary.status === 'blocked' ? '#DC2626' : '#D97706',
                        border: `1px solid ${row.readinessSummary.status === 'blocked' ? '#DC2626' : '#D97706'}`,
                        textDecoration: 'none',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        display: 'inline-flex',
                        alignItems: 'center',
                        transition: 'all 0.2s ease'
                      }}>
                        Review Driver File
                      </Link>
                    </div>
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
                  <Link href={`/portals/driver/${row.driverId}`} className="bof-driver-card-action-btn bof-driver-card-action-btn-secondary" style={{ marginLeft: '0.5rem' }}>
                    Open Driver Portal
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

function StatusChip({ label, onClick, driverId }: { label: string; onClick?: () => void; driverId?: string }) {
  // Enhanced status labels with specific explanations
  const enhancedLabel = (() => {
    switch (label) {
      case "At Risk":
        return "Document expiring soon";
      case "Hold / Review":
        return "Review required";
      case "Review":
        return "Needs attention";
      case "Pending Review":
        return "Pending review";
      case "Attention Required":
        return "Action needed";
      default:
        return label;
    }
  })();

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
        title={`Open driver review for ${driverId || 'driver'}`}
      >
        {enhancedLabel}
      </button>
    );
  }
  return <span className={cls}>{enhancedLabel}</span>;
}
