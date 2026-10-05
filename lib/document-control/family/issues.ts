/**
 * Structured validation issues for the BOF document family graph.
 *
 * Every validator in family/ returns FamilyIssue objects tagged with a stable
 * code from FAMILY_ISSUE_CODES. Classification never depends on message text:
 * `message` is for humans only and may be reworded freely.
 *
 * Codes are part of the public contract. Never rename or reuse a code.
 */

export const FAMILY_ISSUE_CODES = {
  // Family
  familyKeyUnique: "family.key.unique",
  familyKeyFormat: "family.key.format",
  familyAliasFormat: "family.alias.format",
  familyAliasCollidesWithKey: "family.alias.collidesWithKey",
  familyAliasDuplicate: "family.alias.duplicate",

  // Master
  masterFamilyMissing: "master.family.missing",
  masterIdFormat: "master.id.format",
  masterIdUnique: "master.id.unique",
  masterSupersedesMissing: "master.supersedes.missing",
  masterSupersedesFamilyMismatch: "master.supersedes.familyMismatch",
  /** At most one ACTIVE master per family. */
  masterCurrentUnique: "master.current.unique",
  /** At most one in-flight (DRAFT..REVISION) master per family. */
  masterInflightUnique: "master.inflight.unique",
  masterApprovalScope: "master.approval.scope",
  /** approval.status APPROVED without approverName, approvedAt and evidenceRef. */
  masterApprovalEvidenceMissing: "master.approval.evidenceMissing",
  masterApprovalRevocationInvalid: "master.approval.revocationInvalid",
  /** regulatoryReview is missing, non-string, or not one of REGULATORY_REVIEWS. */
  masterRegulatoryReviewInvalid: "master.regulatoryReview.invalid",

  // Carrier
  carrierIdUnique: "carrier.id.unique",
  carrierIdFormat: "carrier.id.format",
  carrierFleetSlugUnique: "carrier.fleetSlug.unique",
  carrierFleetIdUnique: "carrier.fleetId.unique",
  /** CONFLICTING or NOT_RECORDED fact that still carries a value. */
  carrierFactValueWithoutRecorded: "carrier.fact.valueWithoutRecorded",
  /** RECORDED fact with a null/blank value. */
  carrierFactRecordedWithoutValue: "carrier.fact.recordedWithoutValue",
  /** conflictingValues on a non-CONFLICTING fact, or CONFLICTING with fewer than 2 candidates. */
  carrierFactCandidatesInvalid: "carrier.fact.candidatesInvalid",
  carrierFactConflicting: "carrier.fact.conflicting",
  carrierFactNotRecorded: "carrier.fact.notRecorded",

  // Instance
  instanceIdFormat: "instance.id.format",
  instanceVersionUnique: "instance.version.unique",
  instanceFamilyMissing: "instance.family.missing",
  instanceCarrierMissing: "instance.carrier.missing",
  instanceMasterMissing: "instance.master.missing",
  instanceMasterStale: "instance.master.stale",
  instanceMasterNotAuthored: "instance.master.notAuthored",
  /** A not-yet-adopted instance pinned to a SUPERSEDED master (closed for new adoption). */
  instanceMasterSupersededForNewAdoption: "instance.master.supersededForNewAdoption",
  /** At most one ACTIVE instance per (family, carrier). */
  instanceCurrentUnique: "instance.current.unique",
  /** At most one in-flight (DRAFT..REVISION) instance per (family, carrier). */
  instanceInflightUnique: "instance.inflight.unique",
  instanceSupersedesMissing: "instance.supersedes.missing",

  // Local codes
  localCodeUniqueInCarrier: "localCode.unique.inCarrier",
  localCodeGlobalFormat: "localCode.globalFormat",
  localCodeEqualsFamilyKey: "localCode.equalsFamilyKey",

  // Provenance
  provenanceOriginInvalid: "provenance.origin.invalid",
  provenanceSourceRefInvalid: "provenance.sourceRef.invalid",
  provenanceCarrierOriginatedNoSources: "provenance.carrierOriginated.noSources",
  provenanceDerivedMissingTarget: "provenance.derived.missingTarget",
  provenanceDerivedMissingVersion: "provenance.derived.missingVersion",
  provenanceDerivedUnexpectedTarget: "provenance.derived.unexpectedTarget",
  provenanceDerivedTargetNotFound: "provenance.derived.targetNotFound",
  provenanceDerivedTargetVersionNotFound: "provenance.derived.targetVersionNotFound",
  /** Cited instance exists, but not in the family of the document that cites it. */
  provenanceDerivedFamilyMismatch: "provenance.derived.familyMismatch",
  provenanceInvalid: "provenance.invalid",

  // Approval / adoption
  approvalEvidenceReused: "approval.evidence.reused",
  /** evidenceRef present but empty/whitespace (master approval or carrier adoption). */
  approvalEvidenceEmpty: "approval.evidence.empty",
  approvalScopeInvalid: "approval.scope.invalid",
  approvalAdoptionCarrierMismatch: "approval.adoption.carrierMismatch",
  /** adoption.status ADOPTED without adoptedByName, adoptedAt and evidenceRef. */
  approvalAdoptionEvidenceMissing: "approval.adoption.evidenceMissing",
  approvalInstanceActiveNotEffective: "approval.instance.activeNotEffective",
  approvalMasterSource: "approval.masterApproval.source",
  approvalMasterDerivedFromMaster: "approval.masterApproval.derivedFromMaster",
  approvalAdoptionImpliesMasterApproval: "approval.adoption.impliesMasterApproval",

  // Overrides
  overrideRegulatory: "override.regulatory",
  overrideUndeclared: "override.undeclared",
  overrideNotAllowed: "override.notAllowed",
  overrideNoMaster: "override.noMaster",
  overrideDuplicatePath: "override.duplicatePath",
  overrideMasterMismatch: "override.masterMismatch",
  overrideInvalid: "override.invalid",

  // Records
  recordIdUnique: "record.id.unique",
  recordInstanceMissing: "record.instance.missing",
  recordInstanceVersionEmpty: "record.instanceVersion.empty",
  /** Record pinned to an instance version that does not exist. ERROR. */
  recordInstanceVersionUnknown: "record.instanceVersion.unknown",
} as const;

export type FamilyIssueCode = (typeof FAMILY_ISSUE_CODES)[keyof typeof FAMILY_ISSUE_CODES];

export type FamilyIssueSeverity = "error" | "warning";

export type FamilyIssue = {
  code: FamilyIssueCode;
  severity: FamilyIssueSeverity;
  subject: string;
  message: string;
};

export function familyIssue(
  code: FamilyIssueCode,
  severity: FamilyIssueSeverity,
  subject: string,
  message: string,
): FamilyIssue {
  return { code, severity, subject, message };
}

/** True for null, undefined, or a string that is empty after trimming. */
export function isBlank(value: string | null | undefined): boolean {
  return value === null || value === undefined || value.trim() === "";
}

/**
 * Canonical form of an evidence reference for comparison (reuse detection).
 * Trims and lower-cases; returns null for null/undefined/blank.
 */
export function normalizeEvidenceRef(ref: string | null | undefined): string | null {
  if (isBlank(ref)) return null;
  return (ref as string).trim().toLowerCase();
}
