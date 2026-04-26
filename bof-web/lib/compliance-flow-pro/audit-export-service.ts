/**
 * ComplianceFlow Pro - Auditor Retrieval and Export Service
 * 
 * Provides audit-ready document packages and export functionality
 * for DQF compliance reviews and inspections.
 */

import type {
  DqfDocumentRecord,
  DqfDriverComplianceProfile,
  DqfAuditPackage,
  DqfPackageDocument,
  DqfComplianceSummary,
  DqfCertification,
  DqfAuditEntry,
} from "./dqf-types";

export class ComplianceFlowAuditService {
  /**
   * Generate a complete DQF audit package for a driver
   */
  generateFullDQFPackage(
    driverId: string,
    driverName: string,
    documents: DqfDocumentRecord[],
    complianceProfile: DqfDriverComplianceProfile,
    requestedBy: string,
    requestedFor?: string
  ): DqfAuditPackage {
    const packageId = `dqf-${driverId}-${Date.now()}`;
    const now = new Date().toISOString();

    // Filter and organize documents for audit
    const packageDocuments = this.organizeDocumentsForAudit(documents);

    // Generate compliance summary
    const complianceSummary = this.generateComplianceSummary(complianceProfile);

    // Collect audit trail
    const auditTrail = this.collectAuditTrail(documents);

    // Generate certifications
    const certifications = this.generateCertifications(complianceProfile);

    return {
      id: packageId,
      driverId,
      driverName,
      packageType: "full_dqf",
      generatedAt: now,
      generatedBy: requestedBy,
      generatedFor: requestedFor,
      documents: packageDocuments,
      complianceSummary,
      auditTrail,
      certifications,
      exportFormat: "pdf",
      includesConfidential: true,
      watermarkText: requestedFor ? `Audit Copy for ${requestedFor}` : "Audit Copy",
      accessLevel: "confidential",
    };
  }

  /**
   * Generate a compliance summary package
   */
  generateComplianceSummaryPackage(
    driverId: string,
    driverName: string,
    complianceProfile: DqfDriverComplianceProfile,
    requestedBy: string
  ): DqfAuditPackage {
    const packageId = `summary-${driverId}-${Date.now()}`;
    const now = new Date().toISOString();

    return {
      id: packageId,
      driverId,
      driverName,
      packageType: "compliance_summary",
      generatedAt: now,
      generatedBy: requestedBy,
      documents: [], // Summary packages don't include full documents
      complianceSummary: this.generateComplianceSummary(complianceProfile),
      auditTrail: [],
      certifications: this.generateBasicCertifications(complianceProfile),
      exportFormat: "html",
      includesConfidential: false,
      accessLevel: "public",
    };
  }

  /**
   * Generate an audit response package
   */
  generateAuditResponsePackage(
    driverId: string,
    driverName: string,
    documents: DqfDocumentRecord[],
    complianceProfile: DqfDriverComplianceProfile,
    auditRequest: string,
    requestedBy: string
  ): DqfAuditPackage {
    const packageId = `response-${driverId}-${Date.now()}`;
    const now = new Date().toISOString();

    // Include only documents relevant to the audit request
    const relevantDocuments = this.filterDocumentsForAuditRequest(documents, auditRequest);

    return {
      id: packageId,
      driverId,
      driverName,
      packageType: "audit_response",
      generatedAt: now,
      generatedBy: requestedBy,
      generatedFor: auditRequest,
      documents: this.organizeDocumentsForAudit(relevantDocuments),
      complianceSummary: this.generateComplianceSummary(complianceProfile),
      auditTrail: this.collectAuditTrail(relevantDocuments),
      certifications: this.generateCertifications(complianceProfile),
      exportFormat: "pdf",
      includesConfidential: true,
      watermarkText: `Audit Response for ${auditRequest}`,
      accessLevel: "restricted",
    };
  }

  /**
   * Organize documents for audit presentation
   */
  private organizeDocumentsForAudit(documents: DqfDocumentRecord[]): DqfPackageDocument[] {
    return documents
      .filter(doc => doc.status !== "missing") // Exclude missing documents
      .map(doc => ({
        documentId: doc.id,
        documentType: doc.documentType,
        title: `${doc.documentType} - ${doc.driverId}`,
        status: doc.status,
        fileUrl: doc.fileUrl || "",
        fileName: doc.fileName || `${doc.documentType.replace(/\s+/g, "_")}.pdf`,
        fileSize: this.estimateFileSize(doc),
        includeInExport: true,
        redactionLevel: this.determineRedactionLevel(doc),
      }))
      .sort((a, b) => this.sortDocumentsForAudit(a, b));
  }

  /**
   * Generate compliance summary
   */
  private generateComplianceSummary(profile: DqfDriverComplianceProfile): DqfComplianceSummary {
    return {
      overallStatus: profile.complianceState,
      eligibilityStatus: profile.eligibilityState,
      documentCounts: {
        total: profile.totalDocuments,
        valid: profile.validDocuments,
        expired: profile.expiredDocuments,
        missing: profile.missingDocuments,
        pending: profile.pendingDocuments,
      },
      blockingIssues: profile.blockingIssues.length,
      complianceAlerts: profile.complianceAlerts.length,
      lastUpdated: profile.calculatedAt,
      reviewedBy: "ComplianceFlow Pro",
      reviewDate: new Date().toISOString(),
    };
  }

  /**
   * Collect audit trail from all documents
   */
  private collectAuditTrail(documents: DqfDocumentRecord[]): DqfAuditEntry[] {
    const allEntries = documents.flatMap(doc => doc.auditLog);
    
    // Sort by timestamp (most recent first)
    return allEntries.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Generate certifications based on compliance profile
   */
  private generateCertifications(profile: DqfDriverComplianceProfile): DqfCertification[] {
    const certifications: DqfCertification[] = [];
    const now = new Date();

    // Compliance review certification
    if (profile.complianceState === "Active") {
      certifications.push({
        id: `cert-active-${profile.driverId}`,
        type: "compliance_review",
        title: "Driver Qualification File Compliance Review",
        issuedBy: "ComplianceFlow Pro",
        issuedAt: now.toISOString(),
        validUntil: this.calculateNextReviewDate(profile),
        certificateUrl: `/certificates/compliance/${profile.driverId}`,
        referenceNumber: `CF-${profile.driverId}-${now.getFullYear()}`,
        notes: "All required DQF documents verified and current",
      });
    }

    // Good faith effort certification (if applicable)
    const goodFaithInquiries = profile.blockingIssues.filter(
      issue => issue.type === "failed_verification" && issue.description.includes("employer inquiry")
    );
    
    if (goodFaithInquiries.length > 0) {
      certifications.push({
        id: `cert-gfe-${profile.driverId}`,
        type: "good_faith_effort",
        title: "Good Faith Employer Inquiry Effort",
        issuedBy: "ComplianceFlow Pro",
        issuedAt: now.toISOString(),
        certificateUrl: `/certificates/good-faith/${profile.driverId}`,
        referenceNumber: `GFE-${profile.driverId}-${now.getFullYear()}`,
        notes: "Good faith efforts made to contact prior employers",
      });
    }

    return certifications;
  }

  /**
   * Generate basic certifications for summary packages
   */
  private generateBasicCertifications(profile: DqfDriverComplianceProfile): DqfCertification[] {
    const certifications: DqfCertification[] = [];
    const now = new Date();

    // Basic compliance status certification
    certifications.push({
      id: `cert-basic-${profile.driverId}`,
      type: "compliance_review",
      title: "Compliance Status Summary",
      issuedBy: "ComplianceFlow Pro",
      issuedAt: now.toISOString(),
      certificateUrl: `/certificates/summary/${profile.driverId}`,
      referenceNumber: `SUM-${profile.driverId}-${now.getFullYear()}`,
      notes: `Current compliance status: ${profile.complianceState}`,
    });

    return certifications;
  }

  /**
   * Filter documents based on audit request
   */
  private filterDocumentsForAuditRequest(
    documents: DqfDocumentRecord[], 
    auditRequest: string
  ): DqfDocumentRecord[] {
    const requestLower = auditRequest.toLowerCase();
    
    return documents.filter(doc => {
      // Include documents mentioned in the audit request
      if (requestLower.includes(doc.documentType.toLowerCase())) {
        return true;
      }
      
      // Include core DQF documents for most audits
      const coreDQF = [
        "CDL",
        "Medical Certification", 
        "MVR",
        "Driver Application",
        "Drug Test Result"
      ];
      
      if (coreDQF.includes(doc.documentType)) {
        return true;
      }
      
      // Include documents with compliance issues
      if (doc.status === "expired" || doc.status === "review_pending") {
        return true;
      }
      
      return false;
    });
  }

  /**
   * Determine redaction level for document
   */
  private determineRedactionLevel(doc: DqfDocumentRecord): "none" | "partial" | "full" {
    // Full redaction for highly sensitive documents
    if (doc.documentType.includes("Bank") || doc.documentType.includes("W-9")) {
      return "full";
    }
    
    // Partial redaction for personal information
    if (doc.documentType.includes("Emergency") || doc.documentType.includes("Contact")) {
      return "partial";
    }
    
    // No redaction for compliance documents
    return "none";
  }

  /**
   * Estimate file size for document
   */
  private estimateFileSize(doc: DqfDocumentRecord): number {
    // Default size estimates based on document type
    const sizeMap: Record<string, number> = {
      "CDL": 200000, // ~200KB
      "Medical Certification": 150000,
      "MVR": 100000,
      "Driver Application": 300000,
      "Drug Test Result": 100000,
      "I-9": 250000,
      "W-9": 100000,
      "Road Test Certificate": 150000,
    };
    
    return sizeMap[doc.documentType] || 150000; // Default 150KB
  }

  /**
   * Sort documents for audit presentation
   */
  private sortDocumentsForAudit(a: DqfPackageDocument, b: DqfPackageDocument): number {
    // Define priority order for document types
    const priorityOrder: Record<string, number> = {
      "CDL": 1,
      "Medical Certification": 2,
      "MVR": 3,
      "Driver Application": 4,
      "Drug Test Result": 5,
      "Road Test Certificate": 6,
      "I-9": 7,
      "W-9": 8,
      "Employment Verification": 9,
      "Prior Employer Inquiry": 10,
    };
    
    const aPriority = priorityOrder[a.documentType] || 999;
    const bPriority = priorityOrder[b.documentType] || 999;
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // If same priority, sort by document type name
    return a.documentType.localeCompare(b.documentType);
  }

  /**
   * Calculate next review date
   */
  private calculateNextReviewDate(profile: DqfDriverComplianceProfile): string {
    const nextReview = new Date(profile.nextReviewDate);
    return nextReview.toISOString();
  }

  /**
   * Generate export URL for package
   */
  generateExportUrl(packageId: string, format: "pdf" | "html" | "zip"): string {
    return `/api/compliance-flow/export/${packageId}.${format}`;
  }

  /**
   * Set download expiry for package
   */
  setDownloadExpiry(packageId: string, hours: number = 24): string {
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + hours);
    return expiry.toISOString();
  }

  /**
   * Validate package access permissions
   */
  validatePackageAccess(
    packageId: string, 
    userId: string, 
    userRole: "admin" | "auditor" | "driver" | "readonly"
  ): boolean {
    // In a real implementation, this would check database permissions
    // For demo, allow admin and auditor access
    return userRole === "admin" || userRole === "auditor";
  }

  /**
   * Log package access for audit trail
   */
  logPackageAccess(
    packageId: string, 
    userId: string, 
    action: "viewed" | "downloaded" | "shared"
  ): void {
    const logEntry = {
      packageId,
      userId,
      action,
      timestamp: new Date().toISOString(),
      ipAddress: "192.168.1.1", // Would be real IP in production
      userAgent: "ComplianceFlow Pro", // Would be real user agent
    };
    
    // In production, this would be stored in audit database
    console.log("Package access logged:", logEntry);
  }
}
