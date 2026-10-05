export type {
  ControlledDocumentRecord,
  DigitalBehavior,
  DocumentFunction,
  DocumentLifecycle,
  DocumentTypeCode,
  EvidenceMedium,
  ProductionGate,
  RegulatoryReview,
  RosterRecommendation,
  VaultClass,
} from "@/lib/document-control/types";

export {
  CONTROLLED_DOCUMENT_ROSTER,
  getControlledDocumentByAppId,
  getControlledDocumentByCode,
  listDocumentsRequiringLegalReview,
  listProductionReadyDocuments,
} from "@/lib/document-control/registry";

export {
  getCabinetDocumentCoverage,
  listDuplicateControlledCodes,
  listDuplicateStableAppIds,
} from "@/lib/document-control/coverage";

export {
  isCurrentCanonicalDocument,
  listCurrentCanonicalDocuments,
  listCurrentCanonicalCodes,
  fileCabinetItemIsCurrentCanonical,
  isIsolatedGeneratedDocumentPath,
  GENERATOR_PREVIEW_SEGMENT,
  HISTORICAL_DOCUMENT_SEGMENT,
} from "@/lib/document-control/canonical-gate";

export {
  NOT_ASSIGNED,
  REVIEW_REQUIRED,
  ControlledDocumentMetadataConflict,
  resolveControlledDocumentMetadata,
  renderControlledDocumentHtml,
  listRegistryRelatedDocumentGaps,
} from "@/lib/document-control/generator";

// Phase 1 document family → master → carrier instance foundation (additive; legacy exports above unchanged)
export * from "@/lib/document-control/family";
