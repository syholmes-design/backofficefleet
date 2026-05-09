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
import type { BofData } from "@/lib/load-bof-data";

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

// Emma Brown Hero Card Component
function EmmaBrownHeroCard({ data }: { data: BofData }) {
  const emmaDriver = data.drivers.find((d: { id: string }) => d.id === 'DRV-009');
  if (!emmaDriver) return null;
  
  const readinessSummary = getDriverReadinessSummary('DRV-009', data);
  const workerType = getDriverWorkerType('DRV-009', data);
  const acknowledgments = getDriverPolicyAcknowledgments('DRV-009', data);
  const settlement = getDriverSettlementSummary('DRV-009', data);
  
  const missingAcks = acknowledgments.filter(ack => ack.status === 'missing').length;
  const statusColor = readinessSummary.status === 'ready' ? '#0BA5A4' : 
                      readinessSummary.status === 'needs_review' ? '#F59E0B' : '#EF4444';
  
  return (
    <div className="bof-emma-hero-card" style={{
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '1.5rem',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Image 
          src="/images/drivers-emma-brown-hero.png" 
          alt="Emma Brown" 
          width={80}
          height={80}
          style={{ 
            borderRadius: '50%', 
            objectFit: 'cover',
            border: '3px solid #0BA5A4'
          }}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = driverPhotoPath('DRV-009');
          }}
        />
        <div>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#1a202c' }}>
            Emma Brown
          </h3>
          <p style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#64748b' }}>
            DRV-009 • {workerType}
          </p>
          <div style={{
            display: 'inline-block',
            padding: '0.25rem 0.75rem',
            backgroundColor: statusColor,
            color: 'white',
            borderRadius: '9999px',
            fontSize: '0.75rem',
            fontWeight: '500',
            textTransform: 'uppercase'
          }}>
            {readinessSummary.status}
          </div>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.875rem' }}>
        <div>
          <span style={{ color: '#64748b', fontWeight: '500' }}>Documents:</span>
          <span style={{ marginLeft: '0.5rem', color: '#1a202c' }}>
            {readinessSummary.status === 'ready' ? 'Complete' : 'Action Needed'}
          </span>
        </div>
        <div>
          <span style={{ color: '#64748b', fontWeight: '500' }}>Acknowledgments:</span>
          <span style={{ marginLeft: '0.5rem', color: missingAcks > 0 ? '#EF4444' : '#1a202c' }}>
            {missingAcks > 0 ? `${missingAcks} missing` : 'Complete'}
          </span>
        </div>
        <div>
          <span style={{ color: '#64748b', fontWeight: '500' }}>Settlement:</span>
          <span style={{ marginLeft: '0.5rem', color: '#1a202c' }}>
            {settlement.status}
          </span>
        </div>
        <div>
          <span style={{ color: '#64748b', fontWeight: '500' }}>Dispatch:</span>
          <span style={{ marginLeft: '0.5rem', color: '#1a202c' }}>
            {readinessSummary.status === 'ready' ? 'Eligible' : 'Not Eligible'}
          </span>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        <Link 
          href="/drivers/DRV-009" 
          style={{
            flex: 1,
            padding: '0.5rem 1rem',
            backgroundColor: '#0BA5A4',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '6px',
            textAlign: 'center',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
        >
          View Driver
        </Link>
        <Link 
          href="/portals/driver/DRV-009" 
          style={{
            flex: 1,
            padding: '0.5rem 1rem',
            backgroundColor: '#f8fafc',
            color: '#0BA5A4',
            border: '1px solid #0BA5A4',
            textDecoration: 'none',
            borderRadius: '6px',
            textAlign: 'center',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}
        >
          Open Driver Portal
        </Link>
      </div>
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
      {/* Mini Hero Section */}
      <section className="bof-drivers-mini-hero" aria-labelledby="bof-drivers-title" style={{
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        padding: '2rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'center' }}>
          {/* Left Side: Title and CTAs */}
          <div>
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
            <h1 id="bof-drivers-title" style={{ 
              fontSize: '2rem', 
              fontWeight: '700', 
              color: '#1a202c',
              margin: '0 0 1rem 0',
              lineHeight: '1.2'
            }}>
              Drivers
            </h1>
            <p style={{ 
              fontSize: '1.125rem', 
              color: '#475569',
              lineHeight: '1.6',
              margin: '0 0 1.5rem 0',
              maxWidth: '500px'
            }}>
              Manage driver readiness, documents, worker type, dispatch eligibility, acknowledgments, and fix paths from one manager view.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link href="/documents" style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#0BA5A4',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'inline-flex',
                alignItems: 'center',
                transition: 'all 0.2s ease'
              }}>
                View Document Readiness
              </Link>
              <Link href="/documents/vault" style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: 'white',
                color: '#0BA5A4',
                border: '1px solid #0BA5A4',
                textDecoration: 'none',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'inline-flex',
                alignItems: 'center',
                transition: 'all 0.2s ease'
              }}>
                Open Driver Vault
              </Link>
            </div>
          </div>
          
          {/* Right Side: Emma Brown Hero Card */}
          <div>
            <EmmaBrownHeroCard data={data} />
          </div>
        </div>
      </section>

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
