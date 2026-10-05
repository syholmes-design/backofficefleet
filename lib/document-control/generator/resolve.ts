import {
  getControlledDocumentByCode,
  CONTROLLED_DOCUMENT_ROSTER,
} from "@/lib/document-control/registry";
import type { ControlledDocumentRecord } from "@/lib/document-control/types";
import {
  ControlledDocumentMetadataConflict,
  NOT_ASSIGNED,
  REVIEW_REQUIRED,
  approvalStatusFromLifecycle,
  displayStatus,
  sourceTypeFromBehavior,
  type ControlledDocumentMetadata,
  type ControlledIdentityOverride,
  type ControlledNonIdentityInput,
} from "@/lib/document-control/generator/contract";

function assigned(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : NOT_ASSIGNED;
}

function relatedOrPlaceholder(value: string | undefined): string {
  return assigned(value);
}

function assertRelatedCodeExists(field: string, code: string) {
  if (code === NOT_ASSIGNED) return;
  const found = getControlledDocumentByCode(code);
  if (!found) {
    throw new Error(`Related ${field} "${code}" is not in the controlled-document registry.`);
  }
}

export function resolveControlledDocumentMetadata(
  documentCode: string,
  identity?: ControlledIdentityOverride,
  extras?: ControlledNonIdentityInput
): ControlledDocumentMetadata {
  const record = getControlledDocumentByCode(documentCode);
  if (!record) {
    throw new Error(`Unknown controlled document code: ${documentCode}`);
  }

  const registryApproval = approvalStatusFromLifecycle(record.lifecycle);
  checkIdentity(record, identity, registryApproval);

  const relatedPolicy = relatedOrPlaceholder(record.relatedPolicy);
  const relatedSop = relatedOrPlaceholder(record.relatedSop);
  const relatedForm = relatedOrPlaceholder(record.relatedForm);
  assertRelatedCodeExists("policy", relatedPolicy);
  assertRelatedCodeExists("SOP", relatedSop);
  assertRelatedCodeExists("form", relatedForm);

  const revisionHistory = extras?.revisionHistory ?? [];
  const approvalStatus = registryApproval;
  const appearsApproved = approvalStatus === "ACTIVE";

  return {
    documentCode: record.code,
    title: record.name,
    documentClass: record.type,
    version: record.version,
    status: displayStatus(record),
    approvalStatus,
    lifecycle: record.lifecycle,
    effectiveDate: assigned(extras?.effectiveDate),
    reviewDate: assigned(extras?.reviewDate),
    owner: record.owner,
    steward: record.steward,
    complianceReviewer: record.complianceReviewer || REVIEW_REQUIRED,
    approver: record.approver,
    classification: assigned(extras?.classification),
    relatedPolicy,
    relatedSop,
    relatedForm,
    supersedes: assigned(extras?.supersedes),
    workflow: record.workflow,
    sourceType: extras?.sourceType ?? sourceTypeFromBehavior(record.digitalBehavior, extras?.isDemoSample === true),
    revisionHistory,
    controlledCopy: "Uncontrolled copy if printed",
    generatedAt: assigned(extras?.generatedAt),
    generatedBy: assigned(extras?.generatedBy),
    lastReviewedAt: assigned(extras?.lastReviewedAt),
    nextReviewAt: assigned(extras?.nextReviewAt),
    appearsApproved,
    purpose: record.purpose,
  };
}

function checkIdentity(
  record: ControlledDocumentRecord,
  identity: ControlledIdentityOverride | undefined,
  registryApproval: ReturnType<typeof approvalStatusFromLifecycle>
) {
  if (!identity) return;
  const pairs: Array<[keyof ControlledIdentityOverride, string]> = [
    ["documentCode", record.code],
    ["version", record.version],
    ["owner", record.owner],
    ["lifecycle", record.lifecycle],
    ["approvalStatus", registryApproval],
  ];
  for (const [field, registryValue] of pairs) {
    const supplied = identity[field];
    if (supplied != null && String(supplied) !== registryValue) {
      throw new ControlledDocumentMetadataConflict(record.code, field, registryValue, String(supplied));
    }
  }
}

export function listRegistryRelatedDocumentGaps(): string[] {
  const gaps: string[] = [];
  for (const row of CONTROLLED_DOCUMENT_ROSTER) {
    for (const [field, code] of [
      ["relatedPolicy", row.relatedPolicy],
      ["relatedSop", row.relatedSop],
      ["relatedForm", row.relatedForm],
    ] as const) {
      if (!code) continue;
      if (!getControlledDocumentByCode(code)) {
        gaps.push(`${row.code} ${field}=${code}`);
      }
    }
  }
  return gaps;
}
