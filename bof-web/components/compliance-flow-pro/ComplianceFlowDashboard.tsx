"use client";

import { useMemo, useState } from "react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { ComplianceFlowEligibilityService } from "@/lib/compliance-flow-pro/eligibility-service";
import type {
  DqfComplianceState,
  DqfEligibilityState,
} from "@/lib/compliance-flow-pro/dqf-types";
import { DriverAvatar } from "@/components/DriverAvatar";
import { DriverLink } from "@/components/DriverLink";

function statusBadgeClass(state: string) {
  switch (state) {
    case "Active":
    case "Fully_Eligible":
      return "bof-status-pill bof-status-pill-ok";
    case "Compliance_Alert":
    case "Conditionally_Eligible":
      return "bof-status-pill bof-status-pill-warn";
    case "Compliance_Warning":
    case "Limited_Eligibility":
      return "bof-status-pill bof-status-pill-warn";
    case "Restricted":
    case "Not_Eligible":
      return "bof-status-pill bof-status-pill-danger";
    case "Pending_Onboarding":
    case "Under_Review":
    case "Disqualified":
    case "Suspended":
      return "bof-status-pill bof-status-pill-danger";
    default:
      return "bof-status-pill bof-status-pill-muted";
  }
}

function complianceStateIcon(state: DqfComplianceState) {
  switch (state) {
    case "Active": return "✅";
    case "Compliance_Alert": return "⚠️";
    case "Compliance_Warning": return "⚠️";
    case "Restricted": return "🚫";
    case "Pending_Onboarding": return "📋";
    case "Under_Review": return "🔍";
    case "Disqualified": return "❌";
    case "Suspended": return "⏸️";
    default: return "❓";
  }
}

function eligibilityStateIcon(state: DqfEligibilityState) {
  switch (state) {
    case "Fully_Eligible": return "🟢";
    case "Conditionally_Eligible": return "🟡";
    case "Limited_Eligibility": return "🟠";
    case "Not_Eligible": return "🔴";
    case "Emergency_Only": return "🚨";
    default: return "⚪";
  }
}

export function ComplianceFlowDashboard() {
  const { data } = useBofDemoData();
  const [selectedState, setSelectedState] = useState<string>("all");
  const [showDetails, setShowDetails] = useState<string | null>(null);

  const eligibilityService = useMemo(() => new ComplianceFlowEligibilityService(), []);

  const complianceProfiles = useMemo(() => {
    return data.drivers.map(driver => {
      // Get driver documents from existing BOF data
      const driverDocuments = data.documents.filter(doc => doc.driverId === driver.id);
      
      // Convert to DQF format (simplified for demo)
      const dqfDocuments = driverDocuments.map(doc => ({
        id: `${doc.driverId}-${doc.type}`,
        driverId: doc.driverId,
        documentType: doc.type as any,
        category: "core_dqf" as any,
        requirement: "required" as any,
        issueDate: doc.issueDate,
        expirationDate: doc.expirationDate,
        status: doc.status.toLowerCase() as any,
        verificationStatus: "verified" as any,
        reviewState: "reviewed" as any,
        fileUrl: doc.fileUrl,
        previewUrl: doc.previewUrl,
        fileName: doc.type,
        extractedFields: {},
        extractionConfidence: "high" as any,
        reviewNotes: undefined,
        reviewerId: undefined,
        reviewFlags: undefined,
        blocksDispatch: (doc as any).blocksPayment || false,
        blocksPayment: (doc as any).blocksPayment || false,
        complianceAlerts: [],
        auditLog: [{
          id: "1",
          timestamp: new Date().toISOString(),
          action: "created" as any,
          userType: "system" as any,
          details: "Document created from existing BOF data"
        }],
        source: "legacy" as any,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      return eligibilityService.calculateComplianceProfile(
        driver.id,
        driver.name,
        dqfDocuments
      );
    });
  }, [data, eligibilityService]);

  const filteredProfiles = useMemo(() => {
    if (selectedState === "all") return complianceProfiles;
    return complianceProfiles.filter(profile => 
      profile.complianceState === selectedState || profile.eligibilityState === selectedState
    );
  }, [complianceProfiles, selectedState]);

  const stateCounts = useMemo(() => {
    const counts: Record<string, number> = { all: complianceProfiles.length };
    complianceProfiles.forEach(profile => {
      counts[profile.complianceState] = (counts[profile.complianceState] || 0) + 1;
      counts[profile.eligibilityState] = (counts[profile.eligibilityState] || 0) + 1;
    });
    return counts;
  }, [complianceProfiles]);

  const criticalIssues = useMemo(() => {
    return complianceProfiles
      .filter(profile => profile.blockingIssues.length > 0)
      .flatMap(profile => 
        profile.blockingIssues.map(issue => ({
          ...issue,
          driverName: profile.driverName,
          driverId: profile.driverId,
        }))
      )
      .filter(issue => issue.severity === "critical");
  }, [complianceProfiles]);

  const expiringSoon = useMemo(() => {
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    return complianceProfiles
      .filter(profile => profile.expiringDocuments > 0)
      .map(profile => ({
        driverName: profile.driverName,
        driverId: profile.driverId,
        expiringCount: profile.expiringDocuments,
        nextExpiration: profile.complianceAlerts
          .filter(alert => alert.type === "expiring_soon")
          .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())[0]?.dueDate
      }))
      .sort((a, b) => new Date(a.nextExpiration!).getTime() - new Date(b.nextExpiration!).getTime());
  }, [complianceProfiles]);

  return (
    <div className="bof-page">
      <div className="bof-page-header">
        <h1 className="bof-title">ComplianceFlow Pro Dashboard</h1>
        <p className="bof-lead">
          Real-time driver qualification monitoring and compliance state management
        </p>
      </div>

      {/* Summary Cards */}
      <div className="bof-grid-3">
        <div className="bof-card">
          <div className="bof-card-header">
            <h3 className="bof-card-title">Total Drivers</h3>
            <span className="bof-stat-number">{complianceProfiles.length}</span>
          </div>
          <div className="bof-card-body">
            <div className="bof-mini-stats">
              <div className="bof-mini-stat">
                <span className="bof-mini-stat-label">Active</span>
                <span className="bof-mini-stat-value">
                  {stateCounts["Active"] || 0}
                </span>
              </div>
              <div className="bof-mini-stat">
                <span className="bof-mini-stat-label">Issues</span>
                <span className="bof-mini-stat-value bof-text-danger">
                  {criticalIssues.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bof-card">
          <div className="bof-card-header">
            <h3 className="bof-card-title">Critical Issues</h3>
            <span className="bof-stat-number bof-text-danger">{criticalIssues.length}</span>
          </div>
          <div className="bof-card-body">
            <div className="bof-issues-list">
              {criticalIssues.slice(0, 3).map(issue => (
                <div key={issue.id} className="bof-issue-item">
                  <DriverLink driverId={issue.driverId}>
                    {issue.driverName}
                  </DriverLink>
                  <span className="bof-issue-desc">{issue.description}</span>
                </div>
              ))}
              {criticalIssues.length > 3 && (
                <div className="bof-issue-more">
                  +{criticalIssues.length - 3} more critical issues
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bof-card">
          <div className="bof-card-header">
            <h3 className="bof-card-title">Expiring Soon</h3>
            <span className="bof-stat-number bof-text-warning">{expiringSoon.length}</span>
          </div>
          <div className="bof-card-body">
            <div className="bof-expiring-list">
              {expiringSoon.slice(0, 3).map(item => (
                <div key={item.driverId} className="bof-expiring-item">
                  <DriverLink driverId={item.driverId}>
                    {item.driverName}
                  </DriverLink>
                  <span className="bof-expiring-count">
                    {item.expiringCount} docs
                  </span>
                </div>
              ))}
              {expiringSoon.length > 3 && (
                <div className="bof-expiring-more">
                  +{expiringSoon.length - 3} more drivers
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* State Filter */}
      <div className="bof-filter-section">
        <h3 className="bof-section-title">Filter by Status</h3>
        <div className="bof-filter-pills">
          {Object.entries(stateCounts).map(([state, count]) => (
            <button
              key={state}
              onClick={() => setSelectedState(state)}
              className={`bof-filter-pill ${
                selectedState === state ? "bof-filter-pill-active" : ""
              }`}
            >
              {state} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Driver Compliance Table */}
      <div className="bof-card">
        <div className="bof-card-header">
          <h3 className="bof-card-title">Driver Compliance Status</h3>
          <span className="bof-card-subtitle">
            {filteredProfiles.length} drivers shown
          </span>
        </div>
        <div className="bof-card-body">
          <div className="bof-table-wrapper">
            <table className="bof-table">
              <thead>
                <tr>
                  <th>Driver</th>
                  <th>Compliance State</th>
                  <th>Eligibility</th>
                  <th>Documents</th>
                  <th>Issues</th>
                  <th>Next Review</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProfiles.map(profile => (
                  <tr key={profile.driverId}>
                    <td>
                      <div className="bof-driver-cell">
                        <DriverAvatar name={profile.driverName} size={24} />
                        <DriverLink driverId={profile.driverId}>
                          {profile.driverName}
                        </DriverLink>
                      </div>
                    </td>
                    <td>
                      <div className="bof-status-cell">
                        <span className={statusBadgeClass(profile.complianceState)}>
                          {complianceStateIcon(profile.complianceState)} {profile.complianceState}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="bof-status-cell">
                        <span className={statusBadgeClass(profile.eligibilityState)}>
                          {eligibilityStateIcon(profile.eligibilityState)} {profile.eligibilityState}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="bof-doc-stats">
                        <div className="bof-doc-stat">
                          <span className="bof-doc-count bof-text-success">
                            {profile.validDocuments}
                          </span>
                          <span className="bof-doc-label">Valid</span>
                        </div>
                        <div className="bof-doc-stat">
                          <span className="bof-doc-count bof-text-warning">
                            {profile.expiringDocuments}
                          </span>
                          <span className="bof-doc-label">Expiring</span>
                        </div>
                        <div className="bof-doc-stat">
                          <span className="bof-doc-count bof-text-danger">
                            {profile.expiredDocuments}
                          </span>
                          <span className="bof-doc-label">Expired</span>
                        </div>
                        <div className="bof-doc-stat">
                          <span className="bof-doc-count bof-text-muted">
                            {profile.missingDocuments}
                          </span>
                          <span className="bof-doc-label">Missing</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="bof-issues-cell">
                        {profile.blockingIssues.length > 0 && (
                          <span className="bof-issue-count bof-text-danger">
                            {profile.blockingIssues.length} critical
                          </span>
                        )}
                        {profile.complianceAlerts.length > 0 && (
                          <span className="bof-issue-count bof-text-warning">
                            {profile.complianceAlerts.length} alerts
                          </span>
                        )}
                        {profile.warnings.length > 0 && (
                          <span className="bof-issue-count bof-text-muted">
                            {profile.warnings.length} warnings
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="bof-date-cell">
                        {new Date(profile.nextReviewDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div className="bof-actions-cell">
                        <button
                          onClick={() => setShowDetails(
                            showDetails === profile.driverId ? null : profile.driverId
                          )}
                          className="bof-btn bof-btn-sm bof-btn-secondary"
                        >
                          {showDetails === profile.driverId ? "Hide" : "Details"}
                        </button>
                        <button className="bof-btn bof-btn-sm bof-btn-primary">
                          Review
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detailed Driver View */}
      {showDetails && (
        <div className="bof-card">
          <div className="bof-card-header">
            <h3 className="bof-card-title">
              {complianceProfiles.find(p => p.driverId === showDetails)?.driverName} - 
              Compliance Details
            </h3>
            <button
              onClick={() => setShowDetails(null)}
              className="bof-btn bof-btn-sm bof-btn-secondary"
            >
              Close
            </button>
          </div>
          <div className="bof-card-body">
            {(() => {
              const profile = complianceProfiles.find(p => p.driverId === showDetails);
              if (!profile) return null;

              return (
                <div className="bof-compliance-details">
                  <div className="bof-grid-2">
                    <div className="bof-detail-section">
                      <h4>Compliance Information</h4>
                      <div className="bof-detail-grid">
                        <div className="bof-detail-item">
                          <span className="bof-detail-label">State Effective</span>
                          <span className="bof-detail-value">
                            {new Date(profile.stateEffectiveDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="bof-detail-item">
                          <span className="bof-detail-label">Grace Period</span>
                          <span className="bof-detail-value">
                            {profile.gracePeriodEnds 
                              ? new Date(profile.gracePeriodEnds).toLocaleDateString()
                              : "None"}
                          </span>
                        </div>
                        <div className="bof-detail-item">
                          <span className="bof-detail-label">Verification Level</span>
                          <span className="bof-detail-value">{profile.verificationLevel}</span>
                        </div>
                        <div className="bof-detail-item">
                          <span className="bof-detail-label">Onboarding</span>
                          <span className="bof-detail-value">
                            {profile.onboardingComplete ? "Complete" : `Step ${profile.onboardingStep}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bof-detail-section">
                      <h4>Dispatch Restrictions</h4>
                      <div className="bof-restrictions-list">
                        {profile.dispatchRestrictions.length > 0 ? (
                          profile.dispatchRestrictions.map((restriction, index) => (
                            <div key={index} className="bof-restriction-item">
                              {restriction}
                            </div>
                          ))
                        ) : (
                          <div className="bof-no-restrictions">No restrictions</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {profile.blockingIssues.length > 0 && (
                    <div className="bof-detail-section">
                      <h4>Blocking Issues</h4>
                      <div className="bof-issues-grid">
                        {profile.blockingIssues.map(issue => (
                          <div key={issue.id} className="bof-issue-card bof-issue-critical">
                            <div className="bof-issue-header">
                              <span className="bof-issue-type">{issue.type}</span>
                              <span className="bof-issue-severity">{issue.severity}</span>
                            </div>
                            <div className="bof-issue-description">{issue.description}</div>
                            <div className="bof-issue-resolution">
                              <strong>Resolution:</strong> {issue.resolutionRequired}
                            </div>
                            {issue.dueDate && (
                              <div className="bof-issue-due">
                                <strong>Due:</strong> {new Date(issue.dueDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {profile.complianceAlerts.length > 0 && (
                    <div className="bof-detail-section">
                      <h4>Compliance Alerts</h4>
                      <div className="bof-alerts-grid">
                        {profile.complianceAlerts.map(alert => (
                          <div key={alert.id} className="bof-alert-card">
                            <div className="bof-alert-header">
                              <span className="bof-alert-type">{alert.type}</span>
                              <span className="bof-alert-severity">{alert.severity}</span>
                            </div>
                            <div className="bof-alert-description">{alert.description}</div>
                            <div className="bof-alert-action">
                              <strong>Action Required:</strong> {alert.actionRequired}
                            </div>
                            {alert.dueDate && (
                              <div className="bof-alert-due">
                                <strong>Due:</strong> {new Date(alert.dueDate).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
