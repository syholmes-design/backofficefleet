/**
 * ComplianceFlow Pro - Eligibility Logic Service
 * 
 * Calculates driver compliance state and eligibility from DQF records
 * using a rule-based state machine approach.
 */

import type {
  DqfDocumentRecord,
  DqfDriverComplianceProfile,
  DqfComplianceState,
  DqfEligibilityState,
  DqfBlockingIssue,
  DqfComplianceAlert,
  DqfComplianceWarning,
  DqfExpirationAlert,
  DqfComplianceRule,
  DqfRuleCondition,
} from "./dqf-types";

// Core DQF document requirements
const CORE_DQF_REQUIREMENTS = [
  "CDL",
  "Medical Certification",
  "MVR", 
  "Driver Application",
  "Employment Verification",
  "I-9",
  "W-9",
  "Road Test Certificate",
  "Drug Test Result",
  "Prior Employer Inquiry",
] as const;

// Default compliance rules
export const DEFAULT_COMPLIANCE_RULES: DqfComplianceRule[] = [
  {
    id: "cdl-expiry",
    name: "CDL Expiration Check",
    description: "CDL must be valid and not expired",
    category: "document_expiry",
    conditions: [
      { field: "documentType", operator: "equals", value: "CDL" },
      { field: "status", operator: "equals", value: "expired" }
    ],
    actions: [
      { type: "create_blocking_issue", parameters: { blocksDispatch: true, severity: "critical" } },
      { type: "set_state", parameters: { complianceState: "Disqualified" } }
    ],
    severity: "critical",
    enabled: true,
    priority: 1,
    effectiveDate: "2024-01-01",
    version: "1.0",
    lastUpdated: "2024-01-01",
    updatedBy: "system"
  },
  {
    id: "medical-expiry",
    name: "Medical Certification Expiration",
    description: "Medical certification must be current",
    category: "document_expiry",
    conditions: [
      { field: "documentType", operator: "equals", value: "Medical Certification" },
      { field: "status", operator: "equals", value: "expired" }
    ],
    actions: [
      { type: "create_blocking_issue", parameters: { blocksDispatch: true, severity: "critical" } },
      { type: "set_state", parameters: { complianceState: "Disqualified" } }
    ],
    severity: "critical",
    enabled: true,
    priority: 2,
    effectiveDate: "2024-01-01",
    version: "1.0",
    lastUpdated: "2024-01-01",
    updatedBy: "system"
  },
  {
    id: "drug-test-positive",
    name: "Positive Drug Test",
    description: "Positive drug test result disqualifies driver",
    category: "document_requirement",
    conditions: [
      { field: "documentType", operator: "equals", value: "Drug Test Result" },
      { field: "extractedFields.result", operator: "equals", value: "Positive" }
    ],
    actions: [
      { type: "create_blocking_issue", parameters: { blocksDispatch: true, severity: "critical" } },
      { type: "set_state", parameters: { complianceState: "Disqualified" } }
    ],
    severity: "critical",
    enabled: true,
    priority: 1,
    effectiveDate: "2024-01-01",
    version: "1.0",
    lastUpdated: "2024-01-01",
    updatedBy: "system"
  },
  {
    id: "missing-core-docs",
    name: "Missing Core DQF Documents",
    description: "Core DQF documents must be present",
    category: "document_requirement",
    conditions: CORE_DQF_REQUIREMENTS.map(doc => ({
      field: "documentType",
      operator: "equals", 
      value: doc,
      logicalOperator: "or" as const
    })),
    actions: [
      { type: "create_blocking_issue", parameters: { blocksDispatch: true, severity: "high" } },
      { type: "set_state", parameters: { complianceState: "Pending_Onboarding" } }
    ],
    severity: "high",
    enabled: true,
    priority: 3,
    effectiveDate: "2024-01-01",
    version: "1.0",
    lastUpdated: "2024-01-01",
    updatedBy: "system"
  },
  {
    id: "expiring-soon-alert",
    name: "Document Expiring Soon",
    description: "Alert for documents expiring within 30 days",
    category: "document_expiry",
    conditions: [
      { field: "daysUntilExpiration", operator: "less_than", value: 30 },
      { field: "daysUntilExpiration", operator: "greater_than", value: 0 }
    ],
    actions: [
      { type: "create_alert", parameters: { severity: "medium", autoEscalate: true } }
    ],
    severity: "medium",
    enabled: true,
    priority: 4,
    effectiveDate: "2024-01-01",
    version: "1.0",
    lastUpdated: "2024-01-01",
    updatedBy: "system"
  }
];

export class ComplianceFlowEligibilityService {
  private rules: DqfComplianceRule[] = DEFAULT_COMPLIANCE_RULES;

  constructor(customRules?: DqfComplianceRule[]) {
    if (customRules) {
      this.rules = [...DEFAULT_COMPLIANCE_RULES, ...customRules];
    }
  }

  /**
   * Calculate comprehensive compliance profile for a driver
   */
  calculateComplianceProfile(
    driverId: string,
    driverName: string,
    documents: DqfDocumentRecord[]
  ): DqfDriverComplianceProfile {
    const now = new Date();
    // const docsByType = new Map(documents.map(doc => [doc.documentType, doc])); // Unused but kept for reference

    // Count document statuses
    const documentCounts = this.countDocumentStatuses(documents);
    
    // Calculate expiration alerts
    // const expirationAlerts = this.calculateExpirationAlerts(documents); // Unused but kept for reference
    
    // Apply compliance rules
    const ruleResults = this.applyComplianceRules(documents);
    
    // Determine compliance state
    const complianceState = this.determineComplianceState(
      documentCounts,
      ruleResults.blockingIssues,
      ruleResults.alerts
    );
    
    // Determine eligibility state
    const eligibilityState = this.determineEligibilityState(
      complianceState
    );

    // Generate dispatch restrictions
    const dispatchRestrictions = this.generateDispatchRestrictions(
      complianceState,
      ruleResults.blockingIssues,
      documents
    );

    return {
      driverId,
      driverName,
      complianceState,
      eligibilityState,
      stateEffectiveDate: now.toISOString(),
      gracePeriodEnds: this.calculateGracePeriodEnd(complianceState, documents),
      reviewRequiredBy: this.calculateReviewRequiredDate(documents),
      ...documentCounts,
      blockingIssues: ruleResults.blockingIssues,
      complianceAlerts: ruleResults.alerts,
      warnings: ruleResults.warnings,
      dispatchRestrictions,
      vehicleRestrictions: this.generateVehicleRestrictions(documents),
      lastAuditDate: this.getLastAuditDate(documents),
      verificationLevel: this.calculateVerificationLevel(documents),
      onboardingComplete: this.isOnboardingComplete(documents),
      onboardingStep: this.calculateOnboardingStep(documents),
      onboardingRequiredDocs: this.getMissingRequiredDocs(documents),
      calculatedAt: now.toISOString(),
      nextReviewDate: this.calculateNextReviewDate(),
    };
  }

  /**
   * Count documents by status
   */
  private countDocumentStatuses(documents: DqfDocumentRecord[]) {
    const counts = {
      totalDocuments: documents.length,
      validDocuments: 0,
      expiringDocuments: 0,
      expiredDocuments: 0,
      missingDocuments: 0,
      pendingDocuments: 0,
    };

    documents.forEach(doc => {
      switch (doc.status) {
        case "valid":
          counts.validDocuments++;
          break;
        case "expiring_soon":
          counts.expiringDocuments++;
          break;
        case "expired":
          counts.expiredDocuments++;
          break;
        case "missing":
          counts.missingDocuments++;
          break;
        case "review_pending":
          counts.pendingDocuments++;
          break;
      }
    });

    return counts;
  }

  /**
   * Calculate expiration alerts for documents
   */
  private calculateExpirationAlerts(documents: DqfDocumentRecord[]): DqfExpirationAlert[] {
    const alerts: DqfExpirationAlert[] = [];
    const now = new Date();

    documents.forEach(doc => {
      if (!doc.expirationDate) return;

      const expirationDate = new Date(doc.expirationDate);
      const daysUntilExpiration = Math.ceil(
        (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiration <= 0) return; // Already expired

      let alertLevel: "critical" | "warning" | "notice";
      if (daysUntilExpiration <= 7) {
        alertLevel = "critical";
      } else if (daysUntilExpiration <= 30) {
        alertLevel = "warning";
      } else if (daysUntilExpiration <= 60) {
        alertLevel = "notice";
      } else {
        return; // No alert needed
      }

      alerts.push({
        id: `exp-${doc.id}-${Date.now()}`,
        driverId: doc.driverId,
        documentId: doc.id,
        documentType: doc.documentType,
        documentTitle: `${doc.documentType} - ${doc.driverId}`,
        expirationDate: doc.expirationDate,
        daysUntilExpiration,
        alertLevel,
        autoEmailSent: false,
        escalationLevel: 1,
        requiresAction: alertLevel !== "notice",
        recommendedAction: this.getRecommendedAction(alertLevel),
      });
    });

    return alerts.sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);
  }

  /**
   * Apply compliance rules to documents
   */
  private applyComplianceRules(documents: DqfDocumentRecord[]) {
    const blockingIssues: DqfBlockingIssue[] = [];
    const alerts: DqfComplianceAlert[] = [];
    const warnings: DqfComplianceWarning[] = [];

    for (const rule of this.rules.filter(r => r.enabled)) {
      if (this.evaluateRuleConditions(rule.conditions, documents)) {
        for (const action of rule.actions) {
          switch (action.type) {
            case "create_blocking_issue":
              blockingIssues.push(...this.createBlockingIssues(rule, documents, action.parameters));
              break;
            case "create_alert":
              alerts.push(...this.createAlerts(rule, documents, action.parameters));
              break;
            case "create_warning":
              warnings.push(...this.createWarnings(rule, documents));
              break;
          }
        }
      }
    }

    return { blockingIssues, alerts, warnings };
  }

  /**
   * Evaluate rule conditions against documents
   */
  private evaluateRuleConditions(conditions: DqfRuleCondition[], documents: DqfDocumentRecord[]): boolean {
    if (conditions.length === 0) return true;

    // Simple evaluation - in production, this would be more sophisticated
    return conditions.some(condition => {
      const { field, operator, value } = condition;
      
      switch (field) {
        case "documentType":
          return this.evaluateDocumentTypeCondition(documents, operator, value as string);
        case "status":
          return this.evaluateStatusCondition(documents, operator, value as string);
        case "daysUntilExpiration":
          return this.evaluateExpirationCondition(documents, operator, value as number);
        case "extractedFields.result":
          return this.evaluateExtractedFieldCondition(documents, "result", operator, value as string);
        default:
          return false;
      }
    });
  }

  private evaluateDocumentTypeCondition(documents: DqfDocumentRecord[], operator: string, value: string): boolean {
    const hasType = documents.some(doc => doc.documentType === value);
    return operator === "equals" ? hasType : !hasType;
  }

  private evaluateStatusCondition(documents: DqfDocumentRecord[], operator: string, value: string): boolean {
    const hasStatus = documents.some(doc => doc.status === value);
    return operator === "equals" ? hasStatus : !hasStatus;
  }

  private evaluateExpirationCondition(documents: DqfDocumentRecord[], operator: string, value: number): boolean {
    const now = new Date();
    return documents.some(doc => {
      if (!doc.expirationDate) return false;
      const daysUntil = Math.ceil(
        (new Date(doc.expirationDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      switch (operator) {
        case "less_than":
          return daysUntil < value;
        case "greater_than":
          return daysUntil > value;
        default:
          return false;
      }
    });
  }

  private evaluateExtractedFieldCondition(documents: DqfDocumentRecord[], field: string, operator: string, value: unknown): boolean {
    return documents.some(doc => {
      const fieldValue = doc.extractedFields?.[field];
      if (!fieldValue) return false;
      return operator === "equals" ? fieldValue === value : fieldValue !== value;
    });
  }

  /**
   * Create blocking issues from rule
   */
  private createBlockingIssues(rule: DqfComplianceRule, documents: DqfDocumentRecord[], parameters: Record<string, unknown>): DqfBlockingIssue[] {
    const issues: DqfBlockingIssue[] = [];
    
    // Find relevant documents for this rule
    const relevantDocs = documents.filter(doc => {
      return rule.conditions.some(condition => {
        if (condition.field === "documentType") {
          return condition.operator === "equals" 
            ? doc.documentType === condition.value
            : doc.documentType !== condition.value;
        }
        if (condition.field === "status") {
          return condition.operator === "equals"
            ? doc.status === condition.value
            : doc.status !== condition.value;
        }
        return false;
      });
    });

    relevantDocs.forEach(doc => {
      issues.push({
        id: `block-${rule.id}-${doc.id}-${Date.now()}`,
        type: this.mapRuleToIssueType(rule.category),
        severity: (parameters.severity as "critical" | "high") || rule.severity,
        description: rule.description,
        documentType: doc.documentType,
        documentId: doc.id,
        blocksDispatch: (parameters.blocksDispatch as boolean) || false,
        blocksPayment: (parameters.blocksPayment as boolean) || false,
        resolutionRequired: this.getResolutionRequired(rule.category),
        dueDate: this.calculateDueDate(rule.category, doc),
        autoResolveDate: this.calculateAutoResolveDate(rule.category, doc),
      });
    });

    return issues;
  }

  /**
   * Create alerts from rule
   */
  private createAlerts(rule: DqfComplianceRule, documents: DqfDocumentRecord[], parameters: Record<string, unknown>): DqfComplianceAlert[] {
    const alerts: DqfComplianceAlert[] = [];
    
    documents.forEach(doc => {
      alerts.push({
        id: `alert-${rule.id}-${doc.id}-${Date.now()}`,
        type: this.mapRuleToAlertType(rule.category),
        severity: (parameters.severity as "medium" | "low") || rule.severity,
        description: rule.description,
        documentType: doc.documentType,
        documentId: doc.id,
        actionRequired: this.getActionRequired(rule.category),
        dueDate: this.calculateDueDate(rule.category, doc),
        autoEscalateDate: parameters.autoEscalate ? this.calculateEscalationDate() : undefined,
      });
    });

    return alerts;
  }

  /**
   * Create warnings from rule
   */
  private createWarnings(rule: DqfComplianceRule, documents: DqfDocumentRecord[]): DqfComplianceWarning[] {
    const warnings: DqfComplianceWarning[] = [];
    
    documents.forEach(doc => {
      warnings.push({
        id: `warn-${rule.id}-${doc.id}-${Date.now()}`,
        type: "conditional_approval",
        description: rule.description,
        recommendation: this.getRecommendation(rule.category),
        monitorUntil: this.calculateMonitorUntil(),
      });
    });

    return warnings;
  }

  /**
   * Determine overall compliance state
   */
  private determineComplianceState(
    documentCounts: { validDocuments: number; expiredDocuments: number; missingDocuments: number; expiringDocuments: number; totalDocuments: number; pendingDocuments: number; },
    blockingIssues: DqfBlockingIssue[],
    alerts: DqfComplianceAlert[]
  ): DqfComplianceState {
    // Critical blocking issues = Disqualified
    const criticalIssues = blockingIssues.filter(issue => issue.severity === "critical");
    if (criticalIssues.length > 0) {
      return "Disqualified";
    }

    // High severity blocking issues = Restricted
    const highIssues = blockingIssues.filter(issue => issue.severity === "high");
    if (highIssues.length > 0) {
      return "Restricted";
    }

    // Missing core documents = Pending_Onboarding
    if (documentCounts.missingDocuments > 0) {
      return "Pending_Onboarding";
    }

    // Expiring soon = Compliance_Alert
    if (documentCounts.expiringDocuments > 0) {
      return "Compliance_Alert";
    }

    // Pending reviews = Under_Review
    if (documentCounts.pendingDocuments > 0) {
      return "Under_Review";
    }

    // Medium alerts = Compliance_Warning
    const mediumAlerts = alerts.filter(alert => alert.severity === "medium");
    if (mediumAlerts.length > 0) {
      return "Compliance_Warning";
    }

    // All good = Active
    return "Active";
  }

  /**
   * Determine eligibility state
   */
  private determineEligibilityState(
    complianceState: DqfComplianceState
  ): DqfEligibilityState {
    switch (complianceState) {
      case "Active":
        return "Fully_Eligible";
      case "Compliance_Alert":
      case "Compliance_Warning":
        return "Conditionally_Eligible";
      case "Restricted":
        return "Limited_Eligibility";
      case "Pending_Onboarding":
      case "Under_Review":
        return "Not_Eligible";
      case "Disqualified":
        return "Not_Eligible";
      default:
        return "Not_Eligible";
    }
  }

  /**
   * Generate dispatch restrictions
   */
  private generateDispatchRestrictions(
    complianceState: DqfComplianceState,
    blockingIssues: DqfBlockingIssue[],
    documents: DqfDocumentRecord[]
  ): string[] {
    const restrictions: string[] = [];

    if (complianceState === "Disqualified") {
      restrictions.push("No dispatch allowed");
    } else if (complianceState === "Restricted") {
      restrictions.push("Limited dispatch only");
      restrictions.push("Supervisor approval required");
    } else if (complianceState === "Pending_Onboarding") {
      restrictions.push("Onboarding required before dispatch");
    }

    // Document-specific restrictions
    const expiredCDL = documents.find(doc => 
      doc.documentType === "CDL" && doc.status === "expired"
    );
    if (expiredCDL) {
      restrictions.push("CDL expired - no dispatch");
    }

    const expiredMedical = documents.find(doc => 
      doc.documentType === "Medical Certification" && doc.status === "expired"
    );
    if (expiredMedical) {
      restrictions.push("Medical expired - no dispatch");
    }

    return restrictions;
  }

  /**
   * Generate vehicle restrictions
   */
  private generateVehicleRestrictions(documents: DqfDocumentRecord[]): string[] {
    const restrictions: string[] = [];

    // Check for HAZMAT endorsement
    const hazmatDoc = documents.find(doc => doc.documentType === "HAZMAT Endorsement");
    if (!hazmatDoc || hazmatDoc.status !== "valid") {
      restrictions.push("No HAZMAT materials");
    }

    // Check for tanker endorsement
    const tankerDoc = documents.find(doc => doc.documentType === "Tanker Endorsement");
    if (!tankerDoc || tankerDoc.status !== "valid") {
      restrictions.push("No tanker trailers");
    }

    return restrictions;
  }

  // Helper methods for various calculations
  private calculateGracePeriodEnd(complianceState: DqfComplianceState, documents: DqfDocumentRecord[]): string | undefined {
    if (complianceState === "Compliance_Alert") {
      const soonestExpiring = documents
        .filter(doc => doc.status === "expiring_soon" && doc.expirationDate)
        .sort((a, b) => new Date(a.expirationDate!).getTime() - new Date(b.expirationDate!).getTime())[0];
      
      if (soonestExpiring?.expirationDate) {
        const graceEnd = new Date(soonestExpiring.expirationDate);
        graceEnd.setDate(graceEnd.getDate() + 7); // 7-day grace period
        return graceEnd.toISOString();
      }
    }
    return undefined;
  }

  private calculateReviewRequiredDate(documents: DqfDocumentRecord[]): string | undefined {
    const pendingDocs = documents.filter(doc => doc.status === "review_pending");
    if (pendingDocs.length === 0) return undefined;

    const oldestPending = pendingDocs
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
    
    const reviewDate = new Date(oldestPending.createdAt);
    reviewDate.setDate(reviewDate.getDate() + 3); // 3-day review window
    return reviewDate.toISOString();
  }

  private getLastAuditDate(documents: DqfDocumentRecord[]): string | undefined {
    const auditEntries = documents
      .flatMap(doc => doc.auditLog)
      .filter(entry => entry.action === "reviewed" || entry.action === "verified")
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return auditEntries[0]?.timestamp;
  }

  private calculateVerificationLevel(documents: DqfDocumentRecord[]): "basic" | "enhanced" | "premium" {
    const verifiedCount = documents.filter(doc => 
      doc.verificationStatus === "verified"
    ).length;
    
    const totalDocs = documents.length;
    const verifiedRatio = verifiedCount / totalDocs;
    
    if (verifiedRatio >= 0.9) return "premium";
    if (verifiedRatio >= 0.7) return "enhanced";
    return "basic";
  }

  private isOnboardingComplete(documents: DqfDocumentRecord[]): boolean {
    const requiredDocs = CORE_DQF_REQUIREMENTS;
    return requiredDocs.every(docType => 
      documents.some(doc => 
        doc.documentType === docType && 
        doc.status === "valid"
      )
    );
  }

  private calculateOnboardingStep(documents: DqfDocumentRecord[]): number {
    const completedSteps = CORE_DQF_REQUIREMENTS.filter(docType =>
      documents.some(doc => doc.documentType === docType && doc.status !== "missing")
    ).length;
    
    return Math.floor((completedSteps / CORE_DQF_REQUIREMENTS.length) * 5) + 1;
  }

  private getMissingRequiredDocs(documents: DqfDocumentRecord[]): string[] {
    return CORE_DQF_REQUIREMENTS.filter(docType =>
      !documents.some(doc => doc.documentType === docType && doc.status === "valid")
    );
  }

  private calculateNextReviewDate(): string {
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + 30); // Monthly review
    return nextReview.toISOString();
  }

  // Mapping helper methods
  private mapRuleToIssueType(category: string): DqfBlockingIssue["type"] {
    switch (category) {
      case "document_expiry": return "expired_document";
      case "document_requirement": return "missing_required";
      case "eligibility": return "regulatory_violation";
      default: return "failed_verification";
    }
  }

  private mapRuleToAlertType(category: string): DqfComplianceAlert["type"] {
    switch (category) {
      case "document_expiry": return "expiring_soon";
      case "document_requirement": return "review_required";
      case "eligibility": return "policy_change";
      default: return "verification_failed";
    }
  }

  private getResolutionRequired(category: string): string {
    switch (category) {
      case "document_expiry": return "Upload current document";
      case "document_requirement": return "Provide required document";
      case "eligibility": return "Address regulatory violation";
      default: return "Contact compliance department";
    }
  }

  private getActionRequired(category: string): string {
    switch (category) {
      case "document_expiry": return "Renew document before expiration";
      case "document_requirement": return "Upload missing document";
      case "eligibility": return "Review compliance requirements";
      default: return "Review document status";
    }
  }

  private getRecommendation(category: string): string {
    switch (category) {
      case "document_expiry": return "Monitor expiration dates closely";
      case "document_requirement": return "Complete document collection";
      case "eligibility": return "Ensure regulatory compliance";
      default: return "Regular status review recommended";
    }
  }

  private calculateDueDate(category: string, document: DqfDocumentRecord): string {
    const dueDate = new Date();
    switch (category) {
      case "document_expiry":
        if (document.expirationDate) {
          return document.expirationDate;
        }
        dueDate.setDate(dueDate.getDate() + 7);
        break;
      case "document_requirement":
        dueDate.setDate(dueDate.getDate() + 14);
        break;
      default:
        dueDate.setDate(dueDate.getDate() + 30);
    }
    return dueDate.toISOString();
  }

  private calculateAutoResolveDate(category: string, document: DqfDocumentRecord): string | undefined {
    if (category === "document_expiry" && document.expirationDate) {
      const resolveDate = new Date(document.expirationDate);
      resolveDate.setDate(resolveDate.getDate() + 1);
      return resolveDate.toISOString();
    }
    return undefined;
  }

  private calculateEscalationDate(): string {
    const escalateDate = new Date();
    escalateDate.setDate(escalateDate.getDate() + 7);
    return escalateDate.toISOString();
  }

  private calculateMonitorUntil(): string {
    const monitorUntil = new Date();
    monitorUntil.setDate(monitorUntil.getDate() + 30);
    return monitorUntil.toISOString();
  }

  private getRecommendedAction(alertLevel: string): string {
    if (alertLevel === "critical") {
      return "Immediate renewal required";
    } else if (alertLevel === "warning") {
      return "Schedule renewal within 2 weeks";
    } else {
      return "Plan renewal within next month";
    }
  }
}
