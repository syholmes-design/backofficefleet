/**
 * Phase 2E master review.
 *
 * A pure decision gate. It does not read files, Git, or a database.
 * It does not create a master, approval, adoption, instance, or record.
 * The live review register is empty. Qualification cannot set genuineBofMaster.
 *
 * The compatibility id is only the identity under review. A qualified result
 * records a separate genuine-master review state and does not relabel that id.
 * Version numbers are not assigned here.
 */
import {
  PHASE2_CANDIDATE_CITATIONS,
  PHASE2_MASTER_REVIEW_RELEASES,
  canonicalMasterIdentity,
  evaluatePhase2CandidateCitation,
  evaluatePhase2MasterReviewRelease,
  holdsForFamily,
  isStrictIsoTimestamp,
  substantiveTextBlank as evidenceBlank,
  type Phase2CandidateGateContext,
} from "./candidate-gate";
import { PHASE2_COLLISIONS } from "./collisions";
import { PHASE2_DELTA_FAMILIES } from "./delta-instances";

export const PHASE2E_REVIEW_DISPOSITIONS = [
  "GENUINE_MASTER",
  "REJECTED",
  "INSUFFICIENT_EVIDENCE",
] as const;

export type Phase2EReviewDisposition = (typeof PHASE2E_REVIEW_DISPOSITIONS)[number];

export const PHASE2E_VERSION_CHANGES = ["MAJOR", "MINOR"] as const;
export type Phase2EVersionChange = (typeof PHASE2E_VERSION_CHANGES)[number];

export const PHASE2E_AUTHORSHIPS = [
  "BOF_AUTHORED",
  "CARRIER_ORIGINATED",
  "DERIVED_FROM_INSTANCE",
] as const;

export type Phase2EAuthorship = (typeof PHASE2E_AUTHORSHIPS)[number];

export const PHASE2E_POLICY_CLASSES = [
  "BOF_MANDATORY",
  "BOF_DEFAULT_CARRIER_CONFIGURABLE",
  "CARRIER_SPECIFIC",
] as const;

export type Phase2EPolicyClass = (typeof PHASE2E_POLICY_CLASSES)[number];

/** Separate from the compatibility id. This string is not a master id. */
export const PHASE2E_GENUINE_MASTER_STATE = "GENUINE_MASTER_REVIEW_STATE" as const;

/** Eight review subjects. Each is recorded on its own. None implies another. */
export type Phase2EReviewSubjects = {
  documentIdentity: boolean;
  documentFunction: boolean;
  documentContent: boolean;
  documentVersion: boolean;
  bofAuthorship: boolean;
  carrierNeutrality: boolean;
  regulatoryRole: boolean;
  provenance: boolean;
};

export const PHASE2E_REVIEW_SUBJECT_KEYS = [
  "documentIdentity",
  "documentFunction",
  "documentContent",
  "documentVersion",
  "bofAuthorship",
  "carrierNeutrality",
  "regulatoryRole",
  "provenance",
] as const satisfies readonly (keyof Phase2EReviewSubjects)[];

export const PHASE2E_MASTER_REVIEW_ISSUE_CODES = {
  entry: "masterReview.entry",
  citation: "masterReview.citation",
  release: "masterReview.release",
  delta: "masterReview.delta",
  collision: "masterReview.collision",
  hold: "masterReview.hold",
  identity: "masterReview.identity",
  versionChange: "masterReview.versionChange",
  authorship: "masterReview.authorship",
  subjectDocumentIdentity: "masterReview.subject.documentIdentity",
  subjectDocumentFunction: "masterReview.subject.documentFunction",
  subjectDocumentContent: "masterReview.subject.documentContent",
  subjectDocumentVersion: "masterReview.subject.documentVersion",
  subjectBofAuthorship: "masterReview.subject.bofAuthorship",
  subjectCarrierNeutrality: "masterReview.subject.carrierNeutrality",
  subjectRegulatoryRole: "masterReview.subject.regulatoryRole",
  subjectProvenance: "masterReview.subject.provenance",
  reviewer: "masterReview.reviewer",
  timestamp: "masterReview.timestamp",
  rationale: "masterReview.rationale",
  evidence: "masterReview.evidence",
  rejectionRationale: "masterReview.rejectionRationale",
  insufficientRationale: "masterReview.insufficientRationale",
  rejected: "masterReview.rejected",
  disposition: "masterReview.disposition",
  approvalReview: "masterReview.approval.review",
  approvalAuthority: "masterReview.approval.authority",
  approvalTimestamp: "masterReview.approval.timestamp",
  approvalEvidence: "masterReview.approval.evidence",
  policyClass: "policy.class",
  policyMandatory: "policy.mandatory",
  policyChoice: "policy.choice",
  policyDefault: "policy.default",
  policyProvenance: "policy.provenance",
  policyEffectiveDate: "policy.effectiveDate",
  policyApproval: "policy.approval",
} as const;

export type Phase2EMasterReviewIssueCode =
  (typeof PHASE2E_MASTER_REVIEW_ISSUE_CODES)[keyof typeof PHASE2E_MASTER_REVIEW_ISSUE_CODES];

export type Phase2EMasterReviewIssue = {
  code: Phase2EMasterReviewIssueCode;
  subject: string;
};

export type Phase2EQualificationRowRef = {
  compatibilityMasterId: string;
  familyKey: string;
  result: string;
};

/** Authoritative review history keyed by the canonical compatibility id. */
export type Phase2EStoredReview = {
  compatibilityMasterId: string;
  disposition: string;
};

export type Phase2EGenuineMasterState = {
  kind: typeof PHASE2E_GENUINE_MASTER_STATE;
  reviewedCompatibilityMasterId: string;
};

export type Phase2EMasterMetadata = {
  compatibilityMasterId: string;
  familyKey: string;
  version: string;
  versionChange: Phase2EVersionChange;
  authorship: "BOF_AUTHORED";
  subjects: Phase2EReviewSubjects;
  reviewer: string;
  reviewedAt: string;
  rationale: string;
  evidenceRef: string;
  /** The compatibility identity is not converted into a genuine master. */
  genuineBofMaster: false;
  genuineMasterState: Phase2EGenuineMasterState;
  approved: false;
};

export type Phase2EReviewResult = {
  issues: Phase2EMasterReviewIssue[];
  entered: boolean;
  disposition: Phase2EReviewDisposition | null;
  /** Always false. The compatibility roster identity is not a genuine master. */
  genuineBofMaster: false;
  genuineMasterQualified: boolean;
  approved: false;
  adoptionCreated: false;
  instanceCreated: false;
  recordCreated: false;
  metadata: Phase2EMasterMetadata | null;
};

export type Phase2EMasterReviewInput = {
  familyKey: string;
  compatibilityMasterId: string;
  version: string;
  versionChange: string;
  /** Additional blocks only. The gate also loads Delta and collision keys itself. */
  deltaFamilyKeys: readonly string[];
  collisionFamilyKeys: readonly string[];
  /**
   * Diagnostic only. NaN, negative, and positive values fail closed.
   * Zero does not make a citation or release valid.
   */
  citationIssueCount: number;
  releaseIssueCount: number;
  qualificationRows: readonly Phase2EQualificationRowRef[];
  citations: readonly object[];
  citationContext: Phase2CandidateGateContext | null;
  releases: readonly object[];
  authorship: string;
  subjects: Partial<Phase2EReviewSubjects> | null;
  reviewer: string;
  reviewedAt: string;
  disposition: string;
  rationale: string;
  evidenceRef: string;
  rejectionRationale: string | null;
  insufficientEvidenceRationale: string | null;
  /** Keyed history. A REJECTED row for this canonical id blocks a later genuine result. */
  reviewHistory: readonly Phase2EStoredReview[];
  /** Not authoritative. An empty list cannot erase reviewHistory or the live register. */
  callerHistory: readonly Phase2EStoredReview[];
};

/** Live Phase 2E registers. Empty. Review does not write these. */
export const PHASE2E_MASTER_REVIEWS: readonly Phase2EStoredReview[] = [];
export const PHASE2E_MASTER_APPROVALS: readonly {
  compatibilityMasterId: string;
  approvalAuthority: string;
  approvedAt: string;
  evidenceRef: string;
}[] = [];

/** BOF-controlled provision. The carrier selection cannot replace these fields. */
export type Phase2EPolicyProvision = {
  classification: string;
  bofDefault: string | null;
  permittedChoices: readonly string[];
  overridePermitted: boolean;
  additionalApprovalRequired: boolean;
};

/** Carrier selection only. It has no BOF default, permitted set, or override flag. */
export type Phase2ECarrierPolicySelection = {
  selectedValue: string | null;
  selectionProvenance: string | null;
  effectiveDate: string | null;
  approvalEvidenceRef: string | null;
};

export const PHASE2E_CARRIER_POLICY_SELECTIONS: readonly Phase2ECarrierPolicySelection[] = [];

const PHASE2E_DELTA_FAMILY_KEYS: readonly string[] = PHASE2_DELTA_FAMILIES.map((family) => family.familyKey);

const SUBJECT_CODES: Record<keyof Phase2EReviewSubjects, Phase2EMasterReviewIssueCode> = {
  documentIdentity: PHASE2E_MASTER_REVIEW_ISSUE_CODES.subjectDocumentIdentity,
  documentFunction: PHASE2E_MASTER_REVIEW_ISSUE_CODES.subjectDocumentFunction,
  documentContent: PHASE2E_MASTER_REVIEW_ISSUE_CODES.subjectDocumentContent,
  documentVersion: PHASE2E_MASTER_REVIEW_ISSUE_CODES.subjectDocumentVersion,
  bofAuthorship: PHASE2E_MASTER_REVIEW_ISSUE_CODES.subjectBofAuthorship,
  carrierNeutrality: PHASE2E_MASTER_REVIEW_ISSUE_CODES.subjectCarrierNeutrality,
  regulatoryRole: PHASE2E_MASTER_REVIEW_ISSUE_CODES.subjectRegulatoryRole,
  provenance: PHASE2E_MASTER_REVIEW_ISSUE_CODES.subjectProvenance,
};

function issue(code: Phase2EMasterReviewIssueCode, subject: string): Phase2EMasterReviewIssue {
  return { code, subject };
}

function closed(issues: Phase2EMasterReviewIssue[]): Phase2EReviewResult {
  return {
    issues,
    entered: false,
    disposition: null,
    genuineBofMaster: false,
    genuineMasterQualified: false,
    approved: false,
    adoptionCreated: false,
    instanceCreated: false,
    recordCreated: false,
    metadata: null,
  };
}

function isDisposition(value: string): value is Phase2EReviewDisposition {
  return (PHASE2E_REVIEW_DISPOSITIONS as readonly string[]).includes(value);
}

function isVersionChange(value: string): value is Phase2EVersionChange {
  return (PHASE2E_VERSION_CHANGES as readonly string[]).includes(value);
}

function isAuthorship(value: string): value is Phase2EAuthorship {
  return (PHASE2E_AUTHORSHIPS as readonly string[]).includes(value);
}

function countRejects(count: number): boolean {
  return typeof count !== "number" || !Number.isFinite(count) || count < 0 || count > 0;
}

function compatibilityIdOf(value: object): string | null {
  const id = (value as { compatibilityMasterId?: unknown }).compatibilityMasterId;
  return typeof id === "string" ? id : null;
}

function unresolvedCollisionFamilyKeys(): readonly string[] {
  return PHASE2_COLLISIONS.filter((collision) => collision.status === "UNRESOLVED").flatMap((collision) =>
    collision.distinctDocuments.flatMap((document) => (document.familyKey == null ? [] : [document.familyKey])),
  );
}

function mergedKeys(internal: readonly string[], supplied: readonly string[], extra: readonly string[]): string[] {
  return [...new Set([...internal, ...supplied, ...extra])];
}

function citationFails(input: Phase2EMasterReviewInput, canonicalId: string): boolean {
  const live = PHASE2_CANDIDATE_CITATIONS.filter((citation) => citation.compatibilityMasterId === canonicalId);
  const supplied = input.citations.filter((citation) => compatibilityIdOf(citation) === canonicalId);
  const set = [...live, ...supplied];
  if (set.length !== 1 || input.citationContext == null) return true;
  const context: Phase2CandidateGateContext = {
    ...input.citationContext,
    deltaFamilyKeys: mergedKeys(
      PHASE2E_DELTA_FAMILY_KEYS,
      input.citationContext.deltaFamilyKeys,
      input.deltaFamilyKeys,
    ),
    collisionFamilyKeys: mergedKeys(
      unresolvedCollisionFamilyKeys(),
      input.citationContext.collisionFamilyKeys,
      input.collisionFamilyKeys,
    ),
  };
  return evaluatePhase2CandidateCitation(set[0], context).length > 0;
}

function releaseFails(input: Phase2EMasterReviewInput, canonicalId: string, citationOk: boolean): boolean {
  const live = PHASE2_MASTER_REVIEW_RELEASES.filter((release) => release.compatibilityMasterId === canonicalId);
  const supplied = input.releases.filter((release) => compatibilityIdOf(release) === canonicalId);
  const set = [...live, ...supplied];
  if (set.length !== 1) return true;
  return evaluatePhase2MasterReviewRelease(set[0], citationOk).length > 0;
}

function releasedRow(input: Phase2EMasterReviewInput, canonicalId: string): boolean {
  const rows = input.qualificationRows.filter((row) => row.compatibilityMasterId === canonicalId);
  return rows.length === 1 && rows[0]?.familyKey === input.familyKey && rows[0]?.result === "RELEASED_TO_MASTER_REVIEW";
}

/**
 * Enter master review only from a still-valid RELEASED_TO_MASTER_REVIEW row.
 * Citation and release validity come from the Phase 2D evaluators.
 * A qualified result does not approve, adopt, instantiate, or relabel the compatibility id.
 */
export function evaluatePhase2EMasterReview(input: Phase2EMasterReviewInput): Phase2EReviewResult {
  const subjectId = input.compatibilityMasterId;
  const canonical = canonicalMasterIdentity(input.familyKey, input.version);
  const entry: Phase2EMasterReviewIssue[] = [];
  if (canonical == null || canonical !== input.compatibilityMasterId || !releasedRow(input, canonical)) {
    entry.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.entry, subjectId));
  }
  const identityOk = canonical != null && canonical === input.compatibilityMasterId;
  if (!identityOk) entry.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.identity, subjectId));

  const citationInvalid = !identityOk || citationFails(input, canonical ?? subjectId);
  if (citationInvalid || countRejects(input.citationIssueCount)) {
    entry.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.citation, subjectId));
  }
  const citationOk = identityOk && !citationFails(input, canonical ?? subjectId);
  if (!citationOk || releaseFails(input, canonical ?? subjectId, citationOk) || countRejects(input.releaseIssueCount)) {
    entry.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.release, subjectId));
  }

  const deltaKeys = mergedKeys(PHASE2E_DELTA_FAMILY_KEYS, [], input.deltaFamilyKeys);
  const collisionKeys = mergedKeys(unresolvedCollisionFamilyKeys(), [], input.collisionFamilyKeys);
  if (deltaKeys.includes(input.familyKey)) {
    entry.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.delta, input.familyKey));
  }
  if (collisionKeys.includes(input.familyKey)) {
    entry.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.collision, input.familyKey));
  }
  if (holdsForFamily(input.familyKey).length > 0) {
    entry.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.hold, input.familyKey));
  }

  const recordedRejection =
    canonical != null &&
    [...PHASE2E_MASTER_REVIEWS, ...input.reviewHistory].some(
      (record) => record.compatibilityMasterId === canonical && record.disposition === "REJECTED",
    );
  if (recordedRejection) entry.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.rejected, subjectId));
  const callerRejectionForOtherId = input.callerHistory.some(
    (record) => record.disposition === "REJECTED" && record.compatibilityMasterId !== canonical,
  );
  if (callerRejectionForOtherId && canonical == null) {
    entry.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.identity, subjectId));
  }
  if (entry.length > 0) return closed(entry);

  const issues: Phase2EMasterReviewIssue[] = [];
  if (!isDisposition(input.disposition)) {
    issues.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.disposition, input.disposition));
  }
  if (evidenceBlank(input.reviewer)) issues.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.reviewer, subjectId));
  if (!isStrictIsoTimestamp(input.reviewedAt)) {
    issues.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.timestamp, input.reviewedAt));
  }
  if (evidenceBlank(input.rationale)) issues.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.rationale, subjectId));
  if (evidenceBlank(input.evidenceRef)) issues.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.evidence, subjectId));
  if (!isAuthorship(input.authorship) || (input.disposition === "GENUINE_MASTER" && input.authorship !== "BOF_AUTHORED")) {
    issues.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.authorship, input.authorship));
  }

  if (input.disposition === "REJECTED") {
    if (evidenceBlank(input.rejectionRationale)) {
      issues.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.rejectionRationale, subjectId));
    }
  }
  if (input.disposition === "INSUFFICIENT_EVIDENCE") {
    if (evidenceBlank(input.insufficientEvidenceRationale)) {
      issues.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.insufficientRationale, subjectId));
    }
  }

  const subjects = input.subjects;
  const affirmed: Partial<Phase2EReviewSubjects> = {};
  for (const key of PHASE2E_REVIEW_SUBJECT_KEYS) {
    const value = subjects?.[key] === true;
    affirmed[key] = value;
    if (input.disposition === "GENUINE_MASTER" && !value) {
      issues.push(issue(SUBJECT_CODES[key], subjectId));
    }
  }

  if (input.disposition === "GENUINE_MASTER" && !isVersionChange(input.versionChange)) {
    issues.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.versionChange, input.versionChange));
  }

  if (issues.length > 0 || !isDisposition(input.disposition) || canonical == null) {
    return {
      issues,
      entered: true,
      disposition: null,
      genuineBofMaster: false,
      genuineMasterQualified: false,
      approved: false,
      adoptionCreated: false,
      instanceCreated: false,
      recordCreated: false,
      metadata: null,
    };
  }

  let metadata: Phase2EMasterMetadata | null = null;
  if (input.disposition === "GENUINE_MASTER" && isVersionChange(input.versionChange) && input.authorship === "BOF_AUTHORED") {
    metadata = {
      compatibilityMasterId: canonical,
      familyKey: input.familyKey,
      version: input.version,
      versionChange: input.versionChange,
      authorship: "BOF_AUTHORED",
      subjects: affirmed as Phase2EReviewSubjects,
      reviewer: input.reviewer,
      reviewedAt: input.reviewedAt,
      rationale: input.rationale,
      evidenceRef: input.evidenceRef,
      genuineBofMaster: false,
      genuineMasterState: {
        kind: PHASE2E_GENUINE_MASTER_STATE,
        reviewedCompatibilityMasterId: canonical,
      },
      approved: false,
    };
  }

  return {
    issues: [],
    entered: true,
    disposition: input.disposition,
    genuineBofMaster: false,
    genuineMasterQualified: metadata != null,
    approved: false,
    adoptionCreated: false,
    instanceCreated: false,
    recordCreated: false,
    metadata,
  };
}

export type Phase2EMasterApprovalInput = {
  review: Phase2EReviewResult;
  approvalAuthority: string;
  approvedAt: string;
  evidenceRef: string;
};

export type Phase2EMasterApprovalResult = {
  issues: Phase2EMasterReviewIssue[];
  approved: boolean;
  genuineBofMaster: false;
  genuineMasterQualified: boolean;
  adoptionCreated: false;
  instanceCreated: false;
  recordCreated: false;
};

function reviewSeparatesGenuineMaster(review: Phase2EReviewResult): boolean {
  const metadata = review.metadata;
  if (metadata == null) return false;
  const canonical = canonicalMasterIdentity(metadata.familyKey, metadata.version);
  const state = metadata.genuineMasterState;
  return (
    review.disposition === "GENUINE_MASTER" &&
    review.entered === true &&
    review.issues.length === 0 &&
    review.genuineBofMaster === false &&
    review.genuineMasterQualified === true &&
    review.approved === false &&
    metadata.approved === false &&
    metadata.authorship === "BOF_AUTHORED" &&
    metadata.genuineBofMaster === false &&
    state.kind === PHASE2E_GENUINE_MASTER_STATE &&
    state.kind !== metadata.compatibilityMasterId &&
    state.reviewedCompatibilityMasterId === metadata.compatibilityMasterId &&
    canonical === metadata.compatibilityMasterId &&
    PHASE2E_REVIEW_SUBJECT_KEYS.every((key) => metadata.subjects?.[key] === true)
  );
}

/** A separate decision. genuineBofMaster true on the review is not proof. */
export function evaluatePhase2EMasterApproval(input: Phase2EMasterApprovalInput): Phase2EMasterApprovalResult {
  const subjectId = input.review.metadata?.compatibilityMasterId ?? "(approval)";
  const issues: Phase2EMasterReviewIssue[] = [];
  if (!reviewSeparatesGenuineMaster(input.review)) {
    issues.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.approvalReview, subjectId));
  }
  if (evidenceBlank(input.approvalAuthority)) {
    issues.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.approvalAuthority, subjectId));
  }
  if (!isStrictIsoTimestamp(input.approvedAt)) {
    issues.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.approvalTimestamp, input.approvedAt));
  }
  if (evidenceBlank(input.evidenceRef)) {
    issues.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.approvalEvidence, subjectId));
  }
  const approved = issues.length === 0;
  return {
    issues,
    approved,
    genuineBofMaster: false,
    genuineMasterQualified: approved,
    adoptionCreated: false,
    instanceCreated: false,
    recordCreated: false,
  };
}

/**
 * Compare a carrier selection with a BOF provision.
 * Fields on the selection cannot replace the provision.
 */
export function evaluatePhase2ECarrierPolicy(
  provision: Phase2EPolicyProvision,
  selection: Phase2ECarrierPolicySelection,
): Phase2EMasterReviewIssue[] {
  const issues: Phase2EMasterReviewIssue[] = [];
  const subject = provision.classification;
  if (!(PHASE2E_POLICY_CLASSES as readonly string[]).includes(provision.classification)) {
    issues.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.policyClass, subject));
    return issues;
  }
  if (provision.classification === "BOF_MANDATORY") {
    if (provision.overridePermitted) issues.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.policyMandatory, subject));
    if (provision.bofDefault == null || provision.bofDefault.trim() === "") {
      issues.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.policyDefault, subject));
    }
    if (selection.selectedValue != null && selection.selectedValue !== provision.bofDefault) {
      issues.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.policyMandatory, subject));
    }
    return issues;
  }
  if (
    provision.classification === "BOF_DEFAULT_CARRIER_CONFIGURABLE" &&
    (provision.bofDefault == null || !provision.permittedChoices.includes(provision.bofDefault))
  ) {
    issues.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.policyDefault, subject));
  }
  if (provision.permittedChoices.length === 0 || selection.selectedValue == null) {
    issues.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.policyChoice, subject));
    return issues;
  }
  if (!provision.overridePermitted && selection.selectedValue !== provision.bofDefault) {
    issues.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.policyMandatory, subject));
  }
  if (!provision.permittedChoices.includes(selection.selectedValue)) {
    issues.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.policyChoice, subject));
  }
  if (evidenceBlank(selection.selectionProvenance)) {
    issues.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.policyProvenance, subject));
  }
  if (selection.effectiveDate == null || !isStrictIsoTimestamp(selection.effectiveDate)) {
    issues.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.policyEffectiveDate, subject));
  }
  const changed = selection.selectedValue !== provision.bofDefault;
  if (provision.additionalApprovalRequired && changed && evidenceBlank(selection.approvalEvidenceRef)) {
    issues.push(issue(PHASE2E_MASTER_REVIEW_ISSUE_CODES.policyApproval, subject));
  }
  return issues;
}
