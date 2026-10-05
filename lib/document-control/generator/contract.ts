import type {
  ControlledDocumentRecord,
  DigitalBehavior,
  DocumentLifecycle,
  DocumentTypeCode,
} from "@/lib/document-control/types";

export const NOT_ASSIGNED = "NOT ASSIGNED";
export const REVIEW_REQUIRED = "REVIEW REQUIRED";

export const IDENTITY_FIELDS = [
  "documentCode",
  "version",
  "owner",
  "lifecycle",
  "approvalStatus",
] as const;

export type ControlledSourceType =
  | "STATIC_CONTROLLED"
  | "GENERATED_CONTROLLED"
  | "SYSTEM_GENERATED_OPERATIONAL_EVIDENCE"
  | "EXTERNAL_REFERENCE"
  | "DEMO_SAMPLE";

export type ApprovalDisplayStatus =
  | "DRAFT"
  | "INTERNAL_REVIEW"
  | "ACTIVE"
  | "SUPERSEDED"
  | "RETIRED";

export type RevisionHistoryEntry = {
  version: string;
  date: string;
  description: string;
  author: string;
  approvalStatus: string;
};

export type ControlledDocumentMetadata = {
  documentCode: string;
  title: string;
  documentClass: DocumentTypeCode;
  version: string;
  status: string;
  approvalStatus: ApprovalDisplayStatus;
  lifecycle: DocumentLifecycle;
  effectiveDate: string;
  reviewDate: string;
  owner: string;
  steward: string;
  complianceReviewer: string;
  approver: string;
  classification: string;
  relatedPolicy: string;
  relatedSop: string;
  relatedForm: string;
  supersedes: string;
  workflow: string;
  sourceType: ControlledSourceType;
  revisionHistory: RevisionHistoryEntry[];
  controlledCopy: string;
  generatedAt: string;
  generatedBy: string;
  lastReviewedAt: string;
  nextReviewAt: string;
  appearsApproved: boolean;
  purpose: string;
};

export type ControlledIdentityOverride = Partial<{
  documentCode: string;
  version: string;
  owner: string;
  lifecycle: DocumentLifecycle;
  approvalStatus: ApprovalDisplayStatus;
}>;

export type ControlledNonIdentityInput = {
  effectiveDate?: string;
  reviewDate?: string;
  classification?: string;
  supersedes?: string;
  generatedBy?: string;
  generatedAt?: string;
  lastReviewedAt?: string;
  nextReviewAt?: string;
  revisionHistory?: RevisionHistoryEntry[];
  sourceType?: ControlledSourceType;
  isDemoSample?: boolean;
};

export class ControlledDocumentMetadataConflict extends Error {
  readonly code: string;
  readonly field: string;
  readonly registryValue: string;
  readonly suppliedValue: string;

  constructor(code: string, field: string, registryValue: string, suppliedValue: string) {
    super(
      `Controlled-document metadata conflict for ${code}: ${field} registry="${registryValue}" supplied="${suppliedValue}". Do not silently override identity.`
    );
    this.name = "ControlledDocumentMetadataConflict";
    this.code = code;
    this.field = field;
    this.registryValue = registryValue;
    this.suppliedValue = suppliedValue;
  }
}

export function approvalStatusFromLifecycle(lifecycle: DocumentLifecycle): ApprovalDisplayStatus {
  switch (lifecycle) {
    case "DRAFT":
      return "DRAFT";
    case "INTERNAL_REVIEW":
    case "COMPLIANCE_REVIEW":
    case "APPROVAL":
    case "REVISION":
      return "INTERNAL_REVIEW";
    case "ACTIVE":
      return "ACTIVE";
    case "SUPERSEDED":
      return "SUPERSEDED";
    case "ARCHIVED":
      return "RETIRED";
  }
}

export function sourceTypeFromBehavior(
  behavior: DigitalBehavior,
  isDemoSample: boolean
): ControlledSourceType {
  if (isDemoSample) return "DEMO_SAMPLE";
  switch (behavior) {
    case "STATIC_TEMPLATE":
    case "DYNAMIC_FORM":
      return "STATIC_CONTROLLED";
    case "SYSTEM_GENERATED":
    case "GENERATED_EVIDENCE":
    case "SYSTEM_RECORD":
      return "SYSTEM_GENERATED_OPERATIONAL_EVIDENCE";
    case "DRIVER_UPLOADED":
    case "EMPLOYER_UPLOADED":
      return "GENERATED_CONTROLLED";
  }
}

export function displayStatus(record: ControlledDocumentRecord): string {
  const approval = approvalStatusFromLifecycle(record.lifecycle);
  if (approval === "ACTIVE") return "ACTIVE";
  if (approval === "INTERNAL_REVIEW") return "INTERNAL REVIEW";
  if (approval === "DRAFT") return "DRAFT";
  if (approval === "SUPERSEDED") return "SUPERSEDED";
  return "RETIRED";
}
