/**
 * Compatibility barrel. Canonical roster: lib/document-control.
 */
export {
  CONTROLLED_DOCUMENT_ROSTER,
  getControlledDocumentByAppId,
  getControlledDocumentByCode,
  listDocumentsRequiringLegalReview,
  listProductionReadyDocuments,
} from "@/lib/document-control";

export type {
  ControlledDocumentRecord,
  DigitalBehavior,
  DocumentFunction,
  DocumentLifecycle,
  DocumentTypeCode,
  ProductionGate,
  RegulatoryReview,
  RosterRecommendation,
  VaultClass,
} from "@/lib/document-control";

export const DOCUMENT_GOVERNANCE = {
  owner: "Accountable for substantive accuracy and business purpose (content ownership).",
  steward: "Maintains metadata, revision history, and controlled distribution (document administration).",
  complianceReviewer: "Reviews regulatory statements when the document contains legal requirements.",
  approver: "Authorizes the document for operational use. Upload is not approval.",
} as const;

export const PRESERVED_APPLICATION_DEPENDENCIES = [
  "lib/operations-file-cabinet.ts item.id values",
  "public/generated/company-operations-vault hrefs used by acknowledgments and settlements",
  "scripts/templates/** used by generate-load-docs / generate-driver-docs",
  "lib/load-intake documentType keys",
  "BOF-SAF-2026.2 string in generate-secondary-driver-docs.mjs",
  "Recruiting v2 documentCode records",
  "DAT-MSA-001",
  "Secure Pickup / FMCSA / Samba / Prisma / LIVE spine — out of scope",
] as const;
