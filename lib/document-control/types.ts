/**
 * BOF controlled-document model.
 * Document-system only. Does not authorize operational state.
 */

export const DOCUMENT_FUNCTIONS = [
  "SAF",
  "DRV",
  "OPS",
  "EQP",
  "HR",
  "ONB",
  "FIN",
  "CUS",
  "CAR",
  "SEC",
  "IT",
  "GOV",
] as const;

export const DOCUMENT_TYPES = [
  "POL",
  "SOP",
  "FORM",
  "CHK",
  "WI",
  "GUIDE",
  "TPL",
  "ACK",
  "REF",
  "AGR",
  "REC",
  "EVD",
] as const;

export const DOCUMENT_LIFECYCLES = [
  "DRAFT",
  "INTERNAL_REVIEW",
  "COMPLIANCE_REVIEW",
  "APPROVAL",
  "ACTIVE",
  "REVISION",
  "SUPERSEDED",
  "ARCHIVED",
] as const;

export const DIGITAL_BEHAVIORS = [
  "STATIC_TEMPLATE",
  "SYSTEM_GENERATED",
  "DYNAMIC_FORM",
  "DRIVER_UPLOADED",
  "EMPLOYER_UPLOADED",
  "SYSTEM_RECORD",
  "GENERATED_EVIDENCE",
] as const;

export const VAULT_CLASSES = [
  "DRIVER_OWNED",
  "EMPLOYER_RECORD",
  "OPERATIONAL_RECORD",
  "COMPLIANCE_RECORD",
  "FINANCIAL_RECORD",
  "SYSTEM_GENERATED_RECORD",
] as const;

export const RECOMMENDATIONS = [
  "KEEP",
  "UPGRADE",
  "REPLACE",
  "MERGE",
  "CONSOLIDATE",
  "RETIRE",
  "DEPRECATE",
  "CREATE",
] as const;

export const EVIDENCE_MEDIA = ["DIGITAL_FIRST", "PAPER_FIRST", "HYBRID"] as const;

export const REGULATORY_REVIEWS = [
  "NOT_APPLICABLE",
  "VERIFIED_CITED",
  "COMPANY_POLICY",
  "BEST_PRACTICE",
  "REQUIRES_LEGAL_REVIEW",
] as const;

export type DocumentFunction = (typeof DOCUMENT_FUNCTIONS)[number];
export type DocumentTypeCode = (typeof DOCUMENT_TYPES)[number];
export type DocumentLifecycle = (typeof DOCUMENT_LIFECYCLES)[number];
export type DigitalBehavior = (typeof DIGITAL_BEHAVIORS)[number];
export type VaultClass = (typeof VAULT_CLASSES)[number];
export type RosterRecommendation = (typeof RECOMMENDATIONS)[number];
export type RegulatoryReview = (typeof REGULATORY_REVIEWS)[number];
export type EvidenceMedium = (typeof EVIDENCE_MEDIA)[number];
export type ProductionGate = "ACTIVE" | "NEEDS_REVIEW" | "NOT_CHANGED";

export type ControlledDocumentRecord = {
  code: string;
  name: string;
  function: DocumentFunction;
  type: DocumentTypeCode;
  purpose: string;
  owner: string;
  steward: string;
  complianceReviewer: string;
  approver: string;
  relatedPolicy?: string;
  relatedSop?: string;
  relatedForm?: string;
  evidenceMedium?: EvidenceMedium;
  workflow: string;
  user: string;
  digitalBehavior: DigitalBehavior;
  vaultClass: VaultClass;
  lifecycle: DocumentLifecycle;
  version: string;
  stableAppIds: string[];
  href?: string;
  recommendation: RosterRecommendation;
  regulatoryReview: RegulatoryReview;
  productionGate: ProductionGate;
  notes: string;
};
