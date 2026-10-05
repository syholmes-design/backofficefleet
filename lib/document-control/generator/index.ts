export {
  NOT_ASSIGNED,
  REVIEW_REQUIRED,
  IDENTITY_FIELDS,
  ControlledDocumentMetadataConflict,
  approvalStatusFromLifecycle,
  sourceTypeFromBehavior,
  displayStatus,
  type ApprovalDisplayStatus,
  type ControlledDocumentMetadata,
  type ControlledIdentityOverride,
  type ControlledNonIdentityInput,
  type ControlledSourceType,
  type RevisionHistoryEntry,
} from "@/lib/document-control/generator/contract";

export {
  resolveControlledDocumentMetadata,
  listRegistryRelatedDocumentGaps,
} from "@/lib/document-control/generator/resolve";

export {
  renderControlledDocumentHtml,
  type RenderControlledDocumentInput,
} from "@/lib/document-control/generator/render";

export {
  extractDocumentInnerHtml,
  scopeLegacyCssToDocBody,
} from "@/lib/document-control/generator/scope-legacy-css";

export {
  escapeHtml,
  renderControlledHeader,
  renderControlledFooter,
  renderMetadataBlock,
  renderRevisionHistory,
  renderApprovalBlock,
  renderRelatedDocuments,
  renderStatusChip,
} from "@/lib/document-control/generator/partials";
