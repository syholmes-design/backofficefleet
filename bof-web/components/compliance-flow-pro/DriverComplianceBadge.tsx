"use client";

import { useMemo } from "react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { ComplianceFlowEligibilityService } from "@/lib/compliance-flow-pro/eligibility-service";
import type { DqfDocumentRecord, DqfDocumentType, DqfDocumentCategory, DqfDocumentStatus, DqfVerificationStatus, DqfReviewState } from "@/lib/compliance-flow-pro/dqf-types";

interface DriverComplianceBadgeProps {
  driverId: string;
  showDetails?: boolean;
}

export function DriverComplianceBadge({ driverId, showDetails = false }: DriverComplianceBadgeProps) {
  const { data } = useBofDemoData();
  const eligibilityService = useMemo(() => new ComplianceFlowEligibilityService(), []);

  const complianceProfile = useMemo(() => {
    const driver = data.drivers.find(d => d.id === driverId);
    if (!driver) return null;

    // Get driver documents from existing BOF data
    const driverDocuments = data.documents.filter(doc => doc.driverId === driverId);
    
    // Convert to DQF format (simplified for demo)
    const dqfDocuments: DqfDocumentRecord[] = driverDocuments.map(doc => ({
      id: `${doc.driverId}-${doc.type}`,
      driverId: doc.driverId,
      documentType: doc.type as DqfDocumentType,
      category: "core_dqf" as DqfDocumentCategory,
      requirement: "required" as "required" | "optional",
      issueDate: doc.issueDate,
      expirationDate: doc.expirationDate,
      status: doc.status.toLowerCase() as DqfDocumentStatus,
      verificationStatus: "verified" as DqfVerificationStatus,
      reviewState: "reviewed" as DqfReviewState,
      fileUrl: doc.fileUrl,
      previewUrl: doc.previewUrl,
      fileName: doc.type,
      extractedFields: {},
      extractionConfidence: "high" as "high" | "medium" | "low",
      reviewNotes: undefined,
      reviewerId: undefined,
      reviewFlags: undefined,
      blocksDispatch: (doc as { blocksPayment?: boolean }).blocksPayment || false,
      blocksPayment: (doc as { blocksPayment?: boolean }).blocksPayment || false,
      complianceAlerts: [],
      auditLog: [{
        id: "1",
        timestamp: new Date().toISOString(),
        action: "created" as "created" | "updated" | "viewed" | "verified" | "rejected" | "exported" | "reviewed",
        userType: "system" as "driver" | "admin" | "system" | "auditor",
        details: "Document created from existing BOF data"
      }],
      source: "legacy" as "driver_upload" | "admin_upload" | "system_generated" | "imported" | "legacy",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    return eligibilityService.calculateComplianceProfile(
      driver.id,
      driver.name,
      dqfDocuments
    );
  }, [data, driverId, eligibilityService]);

  if (!complianceProfile) {
    return <div className="bof-compliance-badge bof-compliance-unknown">Unknown</div>;
  }

  const getBadgeClass = () => {
    switch (complianceProfile.complianceState) {
      case "Active":
        return "bof-compliance-badge bof-compliance-active";
      case "Compliance_Alert":
        return "bof-compliance-badge bof-compliance-alert";
      case "Compliance_Warning":
        return "bof-compliance-badge bof-compliance-warning";
      case "Restricted":
        return "bof-compliance-badge bof-compliance-restricted";
      case "Pending_Onboarding":
      case "Under_Review":
        return "bof-compliance-badge bof-compliance-pending";
      case "Disqualified":
      case "Suspended":
        return "bof-compliance-badge bof-compliance-disqualified";
      default:
        return "bof-compliance-badge bof-compliance-unknown";
    }
  };

  const getStatusIcon = () => {
    switch (complianceProfile.complianceState) {
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
  };

  const getEligibilityIcon = () => {
    switch (complianceProfile.eligibilityState) {
      case "Fully_Eligible": return "🟢";
      case "Conditionally_Eligible": return "🟡";
      case "Limited_Eligibility": return "🟠";
      case "Not_Eligible": return "🔴";
      case "Emergency_Only": return "🚨";
      default: return "⚪";
    }
  };

  if (!showDetails) {
    return (
      <div className={getBadgeClass()}>
        <span className="bof-compliance-icon">{getStatusIcon()}</span>
        <span className="bof-compliance-text">{complianceProfile.complianceState}</span>
      </div>
    );
  }

  return (
    <div className="bof-compliance-details">
      <div className={getBadgeClass()}>
        <span className="bof-compliance-icon">{getStatusIcon()}</span>
        <div className="bof-compliance-info">
          <div className="bof-compliance-state">{complianceProfile.complianceState}</div>
          <div className="bof-compliance-eligibility">
            {getEligibilityIcon()} {complianceProfile.eligibilityState}
          </div>
        </div>
      </div>
      
      {complianceProfile.blockingIssues.length > 0 && (
        <div className="bof-compliance-issues">
          <div className="bof-compliance-issues-header">
            <span className="bof-compliance-issues-count">
              {complianceProfile.blockingIssues.length} Critical
            </span>
          </div>
          <div className="bof-compliance-issues-list">
            {complianceProfile.blockingIssues.slice(0, 2).map(issue => (
              <div key={issue.id} className="bof-compliance-issue">
                <span className="bof-compliance-issue-type">{issue.type}</span>
                <span className="bof-compliance-issue-desc">{issue.description}</span>
              </div>
            ))}
            {complianceProfile.blockingIssues.length > 2 && (
              <div className="bof-compliance-issue-more">
                +{complianceProfile.blockingIssues.length - 2} more issues
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className="bof-compliance-docs">
        <div className="bof-compliance-doc-summary">
          <span className="bof-compliance-doc-count bof-text-success">
            {complianceProfile.validDocuments} Valid
          </span>
          {complianceProfile.expiringDocuments > 0 && (
            <span className="bof-compliance-doc-count bof-text-warning">
              {complianceProfile.expiringDocuments} Expiring
            </span>
          )}
          {complianceProfile.expiredDocuments > 0 && (
            <span className="bof-compliance-doc-count bof-text-danger">
              {complianceProfile.expiredDocuments} Expired
            </span>
          )}
          {complianceProfile.missingDocuments > 0 && (
            <span className="bof-compliance-doc-count bof-text-muted">
              {complianceProfile.missingDocuments} Missing
            </span>
          )}
        </div>
      </div>
      
      {complianceProfile.dispatchRestrictions.length > 0 && (
        <div className="bof-compliance-restrictions">
          <div className="bof-compliance-restrictions-header">Dispatch Restrictions:</div>
          <ul className="bof-compliance-restrictions-list">
            {complianceProfile.dispatchRestrictions.slice(0, 3).map((restriction, index) => (
              <li key={index}>{restriction}</li>
            ))}
            {complianceProfile.dispatchRestrictions.length > 3 && (
              <li>+{complianceProfile.dispatchRestrictions.length - 3} more</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
