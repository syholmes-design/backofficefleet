"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";
import { DriverAvatar } from "@/components/DriverAvatar";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { driverPhotoPath } from "@/lib/driver-photo";
import { getDriverReviewExplanation, type DriverReviewExplanation, type DriverReviewIssueCategory, type DriverReviewRequirement } from "@/lib/driver-review-explanation";
import { getDriverTableRowModel } from "@/lib/drivers/driver-table-row-model";
import {
  driverHasCredentialExpiringWithin,
  driverHasMissingOrInvalidDoc,
} from "@/lib/drivers/drivers-command-metrics";
import { getDriverWorkerType, getDriverPolicyAcknowledgments, getDriverSettlementSummary } from "@/lib/driver-readiness-ui";
import type { WorkerType } from "@/lib/driver-pay-settlement-methods";
import { getDriverActionIssues, type DriverActionIssue } from "@/lib/driver-action-issues";
import type { DriverOperationalSummary } from "@/lib/services/driverOperationalReadModelService";

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
  status: "Active" | "Review" | "Blocked" | "Evaluation unavailable";
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
  actionIssues: DriverActionIssue[];
  qualificationLine?: string;
  authoritativeSource?: "available" | "not_evaluated" | "unavailable";
};

type Props = {
  operationalSummaries: DriverOperationalSummary[];
  driverRequirements: DriverReviewRequirement[];
  hasFleetContext: boolean;
};

function formatEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function mapOperationalStatus(summary: DriverOperationalSummary | undefined, hasFleetContext: boolean) {
  if (!hasFleetContext) {
    return {
      status: "needs_review" as const,
      label: "Evaluation unavailable" as const,
      primaryReason: "Authoritative qualification and readiness require fleet sign-in.",
      businessImpact: "No authenticated fleet context is available for this session.",
      qualificationLine: "Qualification: unavailable until authenticated fleet access is present.",
      source: "unavailable" as const,
    };
  }

  if (!summary) {
    return {
      status: "needs_review" as const,
      label: "Review" as const,
      primaryReason: "Qualification and readiness have not been loaded for this driver yet.",
      businessImpact: "No authoritative read-model result is currently available.",
      qualificationLine: "Qualification: not available.",
      source: "unavailable" as const,
    };
  }

  const qualificationLine = summary.qualification
    ? `Qualification: ${formatEnumLabel(summary.qualification.qualificationStatus)}`
    : "Qualification: Not yet evaluated";

  if (summary.readiness) {
    return {
      status:
        summary.readiness.readinessStatus === "READY"
          ? ("ready" as const)
          : summary.readiness.readinessStatus === "NOT_READY"
            ? ("blocked" as const)
            : ("needs_review" as const),
      label:
        summary.readiness.readinessStatus === "READY"
          ? ("Active" as const)
          : summary.readiness.readinessStatus === "NOT_READY"
            ? ("Blocked" as const)
            : ("Review" as const),
      primaryReason:
        summary.readiness.summary ??
        `Readiness is ${formatEnumLabel(summary.readiness.readinessStatus).toLowerCase()}.`,
      businessImpact: qualificationLine,
      qualificationLine,
      source: "available" as const,
    };
  }

  if (summary.qualification) {
    const status =
      summary.qualification.qualificationStatus === "NOT_QUALIFIED"
        ? ("blocked" as const)
        : summary.qualification.qualificationStatus === "QUALIFIED"
          ? ("ready" as const)
          : ("needs_review" as const);

    return {
      status,
      label: status === "blocked" ? ("Blocked" as const) : status === "ready" ? ("Active" as const) : ("Review" as const),
      primaryReason: "Readiness has not yet been evaluated for this driver.",
      businessImpact: qualificationLine,
      qualificationLine,
      source: "not_evaluated" as const,
    };
  }

  return {
    status: "needs_review" as const,
    label: "Review" as const,
    primaryReason: "Qualification and readiness have not yet been evaluated.",
    businessImpact: "No authoritative Step 9 or Step 10 result is available yet.",
    qualificationLine,
    source: "not_evaluated" as const,
  };
}

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
      minHeight: '480px',
      height: 'clamp(420px, 25vw, 520px)',
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
        background: 'linear-gradient(90deg, rgba(0, 0, 0, 0.15) 0%, rgba(0, 0, 0, 0.2) 40%, rgba(2, 6, 23, 0.65) 70%, rgba(2, 6, 23, 0.75) 100%)',
        zIndex: 1
      }} />
      <Image 
        src="/images/drivers-emma-brown-hero.png" 
        alt="Professional driver team" 
        fill
        style={{ 
          objectFit: 'cover',
          objectPosition: 'left center',
          zIndex: 0
        }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = driverPhotoPath('DRV-009');
        }}
      />
      
      {/* Right-side Content Overlay */}
      <div className="bof-drivers-hero-content" style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        width: '55%',
        zIndex: 2,
        padding: '2.5rem 3rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: 'linear-gradient(to left, rgba(2, 6, 23, 0.85) 0%, rgba(2, 6, 23, 0.6) 40%, rgba(2, 6, 23, 0.3) 70%, transparent 100%)'
      }}>
        <div className="bof-drivers-hero-copy" style={{ maxWidth: '400px' }}>
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
          <div className="bof-drivers-hero-actions" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <Link href="/documents/vault" className="bof-drivers-hero-action" style={{
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
            <Link href="/documents/vault" className="bof-drivers-hero-action" style={{
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
            <Link href="/drivers?driverStatusFilter=needs_review" className="bof-drivers-hero-action" style={{
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
        @media (max-width: 900px) {
          .bof-drivers-hero {
            min-height: 560px !important;
            height: auto !important;
          }
          .bof-drivers-hero-content {
            width: 100% !important;
            background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.4) 50%, transparent 100%);
            padding: 1.5rem !important;
            justify-content: flex-end !important;
          }
          .bof-drivers-hero-copy {
            max-width: none !important;
          }
          .bof-drivers-hero h1 {
            font-size: 2rem !important;
          }
          .bof-drivers-hero-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 0.625rem !important;
          }
          .bof-drivers-hero-action {
            width: 100% !important;
            justify-content: center !important;
            text-align: center !important;
            white-space: normal !important;
          }
        }
      `}</style>
    </div>
  );
}

export function DriversRosterTable({ operationalSummaries, driverRequirements, hasFleetContext }: Props) {
  const { data, hydrated } = useBofDemoData();
  const [driverStatusFilter, setDriverStatusFilter] = useState<DriverStatusFilter>("all");
  const [credentialWindowDays, setCredentialWindowDays] = useState<90 | 60 | 30>(90);
  const [searchText, setSearchText] = useState("");
  const operationalSummaryMap = useMemo(
    () => new Map(operationalSummaries.map((summary) => [summary.driverId, summary])),
    [operationalSummaries],
  );

  
  const driverRows = useMemo<DriverRow[]>(
    () => {
      if (hasFleetContext && operationalSummaries.length > 0) {
        return operationalSummaries.map((summary) => {
          const authoritativeStatus = mapOperationalStatus(summary, hasFleetContext);
          const reviewExplanation = getDriverReviewExplanation(
            data,
            summary.driverId,
            driverRequirements.filter((requirement) => requirement.driverId === summary.driverId),
          );

          return {
            driverId: summary.driverId,
            name: summary.driverName,
            avatar: driverPhotoPath(summary.driverId),
            status: authoritativeStatus.label,
            eligibilityStatus: authoritativeStatus.status,
            dispatchEligibility:
              summary.readiness?.readinessStatus
                ? formatEnumLabel(summary.readiness.readinessStatus)
                : "Not yet evaluated",
            compliance: summary.qualification?.qualificationStatus
              ? formatEnumLabel(summary.qualification.qualificationStatus)
              : "Not yet evaluated",
            safety: "Standard",
            settlement: "Pending",
            currentOrNextLoad: "No active dispatch assignment shown in this view.",
            documentSummary:
              summary.qualification?.summary ??
              summary.readiness?.summary ??
              "No authoritative evaluation is currently available.",
            blockerHref: `/portals/driver/${summary.driverId}`,
            loadLinkId: null,
            primaryReviewReason: authoritativeStatus.primaryReason,
            reviewExplanation,
            readinessSummary: {
              status: authoritativeStatus.status,
              primaryReason: authoritativeStatus.primaryReason,
              businessImpact: authoritativeStatus.businessImpact,
              requiredFix: "Open the driver portal for the authoritative operational summary.",
              ownerTeam: "Operations Team",
              fixAction: {
                label: "Open driver portal",
                href: `/portals/driver/${summary.driverId}`,
              },
            },
            actionIssues: getDriverActionIssues(
              summary.driverId,
              data,
              driverRequirements.filter((requirement) => requirement.driverId === summary.driverId),
            ),
            qualificationLine: authoritativeStatus.qualificationLine,
            authoritativeSource: authoritativeStatus.source,
          };
        });
      }

      return data.drivers.map((driver) => {
        const m = getDriverTableRowModel(data, driver.id);
        const reviewExplanation = getDriverReviewExplanation(
          data,
          driver.id,
          driverRequirements.filter((requirement) => requirement.driverId === driver.id),
        );
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
        const actionIssues = getDriverActionIssues(
          driver.id,
          data,
          driverRequirements.filter((requirement) => requirement.driverId === driver.id),
        );
        const authoritativeStatus = mapOperationalStatus(operationalSummaryMap.get(driver.id), hasFleetContext);
        
        return {
          driverId: m.driverId,
          name: m.driverName,
          email: driver.email,
          phone: driver.phone,
          avatar: driverPhotoPath(driver.id),
          status: authoritativeStatus.label,
          eligibilityStatus: authoritativeStatus.status,
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
          readinessSummary: {
            status: authoritativeStatus.status,
            primaryReason: authoritativeStatus.primaryReason,
            businessImpact: authoritativeStatus.businessImpact,
            requiredFix: authoritativeStatus.businessImpact,
            ownerTeam: "Operations Team",
          },
          actionIssues,
          qualificationLine: authoritativeStatus.qualificationLine,
          authoritativeSource: authoritativeStatus.source,
        };
      });
    },
    [data, driverRequirements, hasFleetContext, operationalSummaries, operationalSummaryMap]
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

  const visibleDriverRows = hydrated ? filteredDriverRows : [];
  const evaluatedAttentionCount = driverRows.filter(
    (row) => row.authoritativeSource !== "unavailable" && row.eligibilityStatus !== "ready",
  ).length;
  const evaluationUnavailableCount = driverRows.filter(
    (row) => row.authoritativeSource === "unavailable",
  ).length;

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
          <h2 className="bof-h2">Drivers needing attention ({evaluatedAttentionCount})</h2>
          {evaluationUnavailableCount > 0 ? (
            <p className="bof-cc-panel-sub">
              {evaluationUnavailableCount} driver{evaluationUnavailableCount === 1 ? "" : "s"} could not be evaluated because authenticated fleet readiness data is unavailable.
            </p>
          ) : null}
        </div>
        {/* Horizontal Driver Roster Table */}
        <div className="bof-driver-roster-table" style={{ paddingBottom: "6rem" }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: 'white',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <thead>
              <tr style={{
                background: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0'
              }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Driver</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>ID</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Role</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Attention Item</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Due Date</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: '600', color: '#475569' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleDriverRows.map((row) => (
                <tr key={row.driverId} style={{
                  borderBottom: '1px solid #F1F5F9',
                  transition: 'background-color 0.2s ease'
                }}>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <DriverAvatar name={row.name} photoUrl={row.avatar} size={40} />
                      <div>
                        <div style={{ fontWeight: '600', color: '#1E293B', fontSize: '0.875rem' }}>{row.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{row.email ?? row.phone ?? "No contact"}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem', color: '#475569', fontFamily: 'monospace' }}>{row.driverId}</td>
                  <td style={{ padding: '1rem' }}>
                    {row.workerType && (
                      <span style={{
                        background: row.workerType === 'Employee Driver' ? '#DBEAFE' : '#F3E8FF',
                        color: row.workerType === 'Employee Driver' ? '#1E40AF' : '#6B21A8',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        {row.workerType === 'Employee Driver' ? 'Employee' : 'Owner-Op'}
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <StatusChip label={row.status} driverId={row.driverId} />
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    {row.readinessSummary && row.readinessSummary.status !== 'ready' ? (
                      <div>
                        <div style={{ 
                          fontWeight: '600', 
                          color: row.readinessSummary.status === 'blocked' ? '#991B1B' : '#92400E',
                          marginBottom: '0.25rem',
                          fontSize: '0.875rem'
                        }}>
                          {row.readinessSummary.primaryReason}
                        </div>
                        {row.readinessSummary.businessImpact && (
                          <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                            {row.readinessSummary.businessImpact}
                          </div>
                        )}
                        {row.qualificationLine ? (
                          <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.25rem' }}>
                            {row.qualificationLine}
                          </div>
                        ) : null}
                      </div>
                    ) : (
                      <div>
                        <span style={{ color: '#10B981', fontWeight: '500' }}>Ready</span>
                        {row.qualificationLine ? (
                          <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.25rem' }}>
                            {row.qualificationLine}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.875rem' }}>
                    {row.readinessSummary?.dueDate || '-'}
                  </td>
                  <td style={{ padding: '1rem', minWidth: '190px' }}>
                    {row.readinessSummary && row.readinessSummary.status !== 'ready' ? (
                      <div className="bof-driver-roster-actions">
                        {row.readinessSummary.fixAction?.href && row.authoritativeSource === 'available' && (
                          <Link href={row.readinessSummary.fixAction.href} className="bof-driver-roster-action" style={{
                            padding: '0.375rem 0.75rem',
                            backgroundColor: row.readinessSummary.status === 'blocked' ? '#B91C1C' : '#B45309',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            transition: 'all 0.2s ease'
                          }}>
                            {row.readinessSummary.fixAction.label}
                          </Link>
                        )}
                        <Link href={row.actionIssues.length > 0 ? row.actionIssues[0].primaryActionHref : `/portals/driver/${row.driverId}`} className="bof-driver-roster-action" style={{
                          padding: '0.375rem 0.75rem',
                          backgroundColor: '#F3F4F6',
                          color: '#374151',
                          textDecoration: 'none',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          border: '1px solid #D1D5DB'
                        }}>
                          Review issue
                        </Link>
                      </div>
                    ) : (
                      <Link href={`/portals/driver/${row.driverId}`} className="bof-driver-roster-action" style={{
                        padding: '0.375rem 0.75rem',
                        backgroundColor: '#F0FDF4',
                        color: '#166534',
                        textDecoration: 'none',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        border: '1px solid #BBF7D0'
                      }}>
                        View Documents
                      </Link>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bof-driver-roster-mobile-cards" aria-label="Driver attention cards">
          {visibleDriverRows.map((row) => (
            <article className="bof-driver-roster-card" key={`${row.driverId}-mobile`}>
              <div className="bof-driver-roster-card__header">
                <div className="bof-driver-roster-card__identity">
                  <DriverAvatar name={row.name} photoUrl={row.avatar} size={42} />
                  <div>
                    <div className="bof-driver-roster-card__name">{row.name}</div>
                    <div className="bof-driver-roster-card__meta">
                      {row.driverId} - {row.email ?? row.phone ?? "No contact"}
                    </div>
                  </div>
                </div>
                <StatusChip label={row.status} driverId={row.driverId} />
              </div>
              <div className="bof-driver-roster-card__issue">
                {row.readinessSummary && row.readinessSummary.status !== 'ready' ? (
                  <>
                    <strong>{row.readinessSummary.primaryReason}</strong>
                    <span>{row.readinessSummary.businessImpact}</span>
                    {row.qualificationLine && <span>{row.qualificationLine}</span>}
                    {row.readinessSummary.dueDate && (
                      <div className="bof-driver-roster-card__meta">Due: {row.readinessSummary.dueDate}</div>
                    )}
                  </>
                ) : (
                  <>
                    <strong>Ready for dispatch</strong>
                    <span>{row.qualificationLine ?? "No active driver file blockers."}</span>
                  </>
                )}
              </div>
              {row.readinessSummary && row.readinessSummary.status !== 'ready' ? (
                <div className="bof-driver-roster-actions">
                  {row.readinessSummary.fixAction?.href && row.authoritativeSource === 'available' && (
                    <Link href={row.readinessSummary.fixAction.href} className="bof-driver-roster-action" style={{
                      padding: '0.55rem 0.85rem',
                      backgroundColor: row.readinessSummary.status === 'blocked' ? '#B91C1C' : '#B45309',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: '700'
                    }}>
                      {row.readinessSummary.fixAction.label}
                    </Link>
                  )}
                  <Link href={row.actionIssues.length > 0 ? row.actionIssues[0].primaryActionHref : `/portals/driver/${row.driverId}`} className="bof-driver-roster-action" style={{
                    padding: '0.55rem 0.85rem',
                    backgroundColor: '#F8FAFC',
                    color: '#334155',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    border: '1px solid #CBD5E1'
                  }}>
                    Review issue
                  </Link>
                </div>
              ) : (
                <div className="bof-driver-roster-actions">
                  <Link href={`/portals/driver/${row.driverId}`} className="bof-driver-roster-action" style={{
                    padding: '0.55rem 0.85rem',
                    backgroundColor: '#F0FDF4',
                    color: '#166534',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    border: '1px solid #BBF7D0'
                  }}>
                    View Documents
                  </Link>
                </div>
              )}
            </article>
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
      case "Evaluation unavailable":
        return "Evaluation unavailable";
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
