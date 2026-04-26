/**
 * ComplianceFlow Pro - BOF Vault Driver Qualification File System
 * 
 * This extends the existing BOF document architecture with active DQF management
 * and real-time eligibility calculation.
 */

export const DQF_DOCUMENT_TYPES = [
  // Core DQF documents (FMCSA required)
  "CDL",
  "Medical Certification", 
  "Medical Card",
  "MVR",
  "Driver Application",
  "Employment Verification",
  "I-9",
  "W-9",
  "Road Test Certificate",
  "Drug Test Result",
  "Alcohol Test Result",
  "Prior Employer Inquiry",
  "Emergency Contact",
  
  // BOF extended DQF documents
  "FMCSA Clearinghouse",
  "Safety Performance History",
  "Annual Review",
  "Training Records",
  "Vehicle Inspection Reports",
  "Incident Reports",
  
  // Optional/Supporting documents
  "TWIC Card",
  "HAZMAT Endorsement",
  "Tanker Endorsement",
  "Passport",
  "Defensive Driving Certificate",
  "Physical Examination Form",
  
  // BOF operational documents
  "Direct Deposit Form",
  "Bank Information",
  "Payroll Setup",
  "Uniform Agreement",
  "Equipment Assignment",
] as const;

export type DqfDocumentType = (typeof DQF_DOCUMENT_TYPES)[number];

export type DqfDocumentCategory = 
  | "core_dqf"           // FMCSA required DQF documents
  | "employment"         // Employment and tax documents
  | "medical"            // Medical and health certifications
  | "safety"             // Safety and testing records
  | "training"           // Training and certifications
  | "operational"        // BOF operational documents
  | "optional";          // Optional supporting documents

export type DqfDocumentStatus = 
  | "valid"              // Current and verified
  | "expiring_soon"      // Expires within 30 days
  | "expired"            // Past expiration date
  | "missing"            // Not uploaded/required
  | "review_pending"     // Awaiting human review
  | "rejected"           // Failed verification
  | "conditional"        // Valid with conditions
  | "suspended";         // Temporarily invalid

export type DqfVerificationStatus = 
  | "verified"           // System and/or human verified
  | "pending_review"     // Awaiting verification
  | "failed_verification" // Verification failed
  | "requires_update"    // Needs updated version
  | "waived"             // Officially waived
  | "exempt";            // Exempt from requirement

export type DqfReviewState = 
  | "not_started"
  | "in_review"
  | "reviewed"
  | "needs_update"
  | "escalated";

export type DqfDocumentRequirement = 
  | "required"           // Must be present and valid
  | "conditional"        // Required under certain conditions
  | "optional"           // Nice to have but not required
  | "fleet_specific";    // Specific to fleet operations

export interface DqfDocumentRecord {
  id: string;
  driverId: string;
  documentType: DqfDocumentType;
  category: DqfDocumentCategory;
  requirement: DqfDocumentRequirement;
  
  // Document metadata
  issueDate?: string;
  expirationDate?: string;
  verificationDate?: string;
  reviewDate?: string;
  
  // Status tracking
  status: DqfDocumentStatus;
  verificationStatus: DqfVerificationStatus;
  reviewState: DqfReviewState;
  
  // File references
  fileUrl?: string;
  previewUrl?: string;
  artifactUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  
  // Extracted data (from OCR/parsing)
  extractedFields?: Record<string, unknown>;
  extractionConfidence?: "high" | "medium" | "low";
  
  // Human review
  reviewNotes?: string;
  reviewerId?: string;
  reviewFlags?: string[];
  
  // Compliance flags
  blocksDispatch?: boolean;
  blocksPayment?: boolean;
  complianceAlerts?: string[];
  
  // Audit trail
  auditLog: DqfAuditEntry[];
  
  // Source tracking
  source: "driver_upload" | "admin_upload" | "system_generated" | "imported" | "legacy";
  sourceReference?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastViewedAt?: string;
}

export interface DqfAuditEntry {
  id: string;
  timestamp: string;
  action: "created" | "updated" | "viewed" | "verified" | "rejected" | "exported" | "reviewed";
  userId?: string;
  userType: "driver" | "admin" | "system" | "auditor";
  details: string;
  metadata?: Record<string, any>;
}

// Driver compliance state machine
export type DqfComplianceState = 
  | "Active"              // Fully qualified and ready
  | "Pending_Onboarding"  // New driver, completing DQF setup
  | "Grace_Period"        // Temporary allowance for expiring docs
  | "Compliance_Alert"    // Minor issues, monitor closely
  | "Compliance_Warning"  // Serious issues, action required
  | "Restricted"          // Limited dispatch eligibility
  | "Disqualified"        // Not eligible for dispatch
  | "Suspended"           // Temporary suspension
  | "Under_Review";       // Manual review in progress

export type DqfEligibilityState = 
  | "Fully_Eligible"      // Can dispatch any load type
  | "Conditionally_Eligible" // Can dispatch with restrictions
  | "Limited_Eligibility" // Only specific load types
  | "Not_Eligible"        // Cannot dispatch
  | "Emergency_Only";     // Emergency situations only

export interface DqfDriverComplianceProfile {
  driverId: string;
  driverName: string;
  
  // Overall state
  complianceState: DqfComplianceState;
  eligibilityState: DqfEligibilityState;
  
  // State machine timing
  stateEffectiveDate: string;
  gracePeriodEnds?: string;
  reviewRequiredBy?: string;
  
  // Document summary
  totalDocuments: number;
  validDocuments: number;
  expiringDocuments: number;
  expiredDocuments: number;
  missingDocuments: number;
  pendingDocuments: number;
  
  // Critical issues
  blockingIssues: DqfBlockingIssue[];
  complianceAlerts: DqfComplianceAlert[];
  warnings: DqfComplianceWarning[];
  
  // Eligibility factors
  dispatchRestrictions: string[];
  vehicleRestrictions: string[];
  geographicRestrictions?: string[];
  hourRestrictions?: string;
  
  // Audit and verification
  lastAuditDate?: string;
  auditScore?: number;
  verificationLevel: "basic" | "enhanced" | "premium";
  
  // Onboarding status
  onboardingComplete: boolean;
  onboardingStep?: number;
  onboardingRequiredDocs: string[];
  
  // Timestamps
  calculatedAt: string;
  nextReviewDate: string;
}

export interface DqfBlockingIssue {
  id: string;
  type: "expired_document" | "missing_required" | "failed_verification" | "regulatory_violation";
  severity: "critical" | "high";
  description: string;
  documentType?: DqfDocumentType;
  documentId?: string;
  blocksDispatch: boolean;
  blocksPayment: boolean;
  resolutionRequired: string;
  dueDate?: string;
  autoResolveDate?: string;
}

export interface DqfComplianceAlert {
  id: string;
  type: "expiring_soon" | "review_required" | "verification_failed" | "policy_change";
  severity: "medium" | "low";
  description: string;
  documentType?: DqfDocumentType;
  documentId?: string;
  actionRequired: string;
  dueDate?: string;
  autoEscalateDate?: string;
}

export interface DqfComplianceWarning {
  id: string;
  type: "conditional_approval" | "monitoring_required" | "documentation_gap";
  description: string;
  recommendation: string;
  monitorUntil?: string;
}

// Employer inquiry tracking
export interface DqfEmployerInquiry {
  id: string;
  driverId: string;
  priorEmployer: string;
  contactName?: string;
  contactTitle?: string;
  phoneNumber?: string;
  email?: string;
  fax?: string;
  
  // Inquiry attempts
  attempts: DqfInquiryAttempt[];
  
  // Status
  status: "in_progress" | "completed" | "good_faith_effort" | "failed" | "waived";
  
  // Results
  responseReceived: boolean;
  responseDate?: string;
  responseSummary?: string;
  concernsIdentified?: string[];
  
  // Documentation
  responseFileUrl?: string;
  certificateUrl?: string;
  
  // Good faith effort
  goodFaithEffortDeclared?: boolean;
  goodFaithEffortDate?: string;
  goodFaithEffortJustification?: string;
  
  // Timestamps
  createdAt: string;
  completedAt?: string;
  nextAttemptDate?: string;
}

export interface DqfInquiryAttempt {
  id: string;
  attemptNumber: number;
  method: "phone" | "email" | "fax" | "mail" | "portal";
  contactInfo: string;
  attemptedAt: string;
  result: "contact_made" | "no_answer" | "wrong_number" | "email_bounced" | "fax_failed" | "left_message";
  notes?: string;
  followUpRequired?: boolean;
  nextAttemptDate?: string;
}

// Expiration tracking
export interface DqfExpirationAlert {
  id: string;
  driverId: string;
  documentId: string;
  documentType: DqfDocumentType;
  documentTitle: string;
  expirationDate: string;
  daysUntilExpiration: number;
  alertLevel: "critical" | "warning" | "notice";
  autoEmailSent: boolean;
  lastNotifiedAt?: string;
  escalationLevel: number;
  requiresAction: boolean;
  recommendedAction: string;
}

// Audit export structures
export interface DqfAuditPackage {
  id: string;
  driverId: string;
  driverName: string;
  packageType: "full_dqf" | "compliance_summary" | "audit_response" | "investigation";
  generatedAt: string;
  generatedBy: string;
  generatedFor?: string; // Auditor name/reference
  
  // Package contents
  documents: DqfPackageDocument[];
  complianceSummary: DqfComplianceSummary;
  auditTrail: DqfAuditEntry[];
  certifications: DqfCertification[];
  
  // Export options
  exportFormat: "pdf" | "html" | "zip";
  exportUrl?: string;
  downloadExpiry?: string;
  
  // Metadata
  includesConfidential: boolean;
  watermarkText?: string;
  accessLevel: "public" | "confidential" | "restricted";
}

export interface DqfPackageDocument {
  documentId: string;
  documentType: DqfDocumentType;
  title: string;
  status: DqfDocumentStatus;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  includeInExport: boolean;
  redactionLevel: "none" | "partial" | "full";
}

export interface DqfComplianceSummary {
  overallStatus: DqfComplianceState;
  eligibilityStatus: DqfEligibilityState;
  documentCounts: {
    total: number;
    valid: number;
    expired: number;
    missing: number;
    pending: number;
  };
  blockingIssues: number;
  complianceAlerts: number;
  lastUpdated: string;
  reviewedBy?: string;
  reviewDate?: string;
}

export interface DqfCertification {
  id: string;
  type: "compliance_review" | "audit_certification" | "good_faith_effort" | "waiver_certification";
  title: string;
  issuedBy: string;
  issuedAt: string;
  validUntil?: string;
  certificateUrl: string;
  referenceNumber?: string;
  notes?: string;
}

// Rule engine types
export interface DqfComplianceRule {
  id: string;
  name: string;
  description: string;
  category: "document_expiry" | "document_requirement" | "eligibility" | "escalation";
  
  // Rule conditions
  conditions: DqfRuleCondition[];
  
  // Rule actions
  actions: DqfRuleAction[];
  
  // Rule metadata
  severity: "low" | "medium" | "high" | "critical";
  enabled: boolean;
  priority: number;
  
  // Rule timing
  effectiveDate: string;
  expiryDate?: string;
  
  // Rule versioning
  version: string;
  lastUpdated: string;
  updatedBy: string;
}

export interface DqfRuleCondition {
  field: string; // e.g., "documentStatus", "daysUntilExpiration"
  operator: "equals" | "not_equals" | "greater_than" | "less_than" | "contains" | "in" | "not_in";
  value: any;
  logicalOperator?: "and" | "or";
}

export interface DqfRuleAction {
  type: "set_state" | "create_alert" | "create_blocking_issue" | "create_warning" | "send_notification" | "escalate";
  parameters: Record<string, any>;
  delay?: number; // Delay in hours before executing
}
