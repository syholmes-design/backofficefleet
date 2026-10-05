/**
 * Remaining document-control lifecycle after a qualified Phase 2E review.
 *
 * One contract: genuine master identity, master approval, carrier adoption,
 * carrier canonical instance, operational record.
 * Live registers stay empty. These functions do not write them.
 * The genuine master id uses makeMasterId. It is not minted. It is rejected
 * when it equals any compatibility id on the roster, not only the reviewed row.
 * Later gates re-run the earlier gate. A caller object is not that proof.
 */
import { CONTROLLED_DOCUMENT_ROSTER } from "@/lib/document-control/registry";
import { normalizeEvidenceRef } from "../issues";
import { isCarrierId, makeInstanceId, makeMasterId } from "../ids";
import {
  adoptionPredatesSupersession,
  isMasterApproved,
  isMasterOpenForNewAdoption,
  summarizeInstanceApproval,
} from "../approval";
import { isActiveLifecycle, isInflightLifecycle } from "../versioning";
import type { CarrierInstance, DocumentRecordRef, MasterDocument } from "../types";
import { canonicalMasterIdentity, isStrictIsoTimestamp, substantiveTextBlank } from "./candidate-gate";
import {
  evaluatePhase2ECarrierPolicy,
  evaluatePhase2EMasterReview,
  type Phase2ECarrierPolicySelection,
  type Phase2EMasterReviewInput,
  type Phase2EPolicyProvision,
} from "./master-review";
import { PHASE2_ROSTER_CLASSIFICATIONS } from "./roster-classification";

const COMPATIBILITY_MASTER_IDS = new Set(
  PHASE2_ROSTER_CLASSIFICATIONS.map((row) => row.compatibilityMasterId),
);

export const LIFECYCLE_ISSUE_CODES = {
  review: "lifecycle.review",
  identity: "lifecycle.identity",
  compatibility: "lifecycle.compatibility",
  approvalMissing: "lifecycle.approval.missing",
  approvalAuthority: "lifecycle.approval.authority",
  approvalTimestamp: "lifecycle.approval.timestamp",
  approvalEvidence: "lifecycle.approval.evidence",
  approvalRegulatory: "lifecycle.approval.regulatory",
  approvalGate: "lifecycle.approval.gate",
  approvalAlready: "lifecycle.approval.already",
  masterVersion: "lifecycle.version.master",
  adoptionMaster: "lifecycle.adoption.master",
  adoptionAuthority: "lifecycle.adoption.authority",
  adoptionTimestamp: "lifecycle.adoption.timestamp",
  adoptionEvidence: "lifecycle.adoption.evidence",
  adoptionReused: "lifecycle.adoption.reused",
  adoptionSuperseded: "lifecycle.adoption.superseded",
  adoptionPolicy: "lifecycle.adoption.policy",
  instanceAdoption: "lifecycle.instance.adoption",
  instanceMaster: "lifecycle.instance.master",
  instanceVersion: "lifecycle.instance.version",
  instanceLimit: "lifecycle.instance.limit",
  recordInstance: "lifecycle.record.instance",
  recordMasterPin: "lifecycle.record.masterPin",
  recordSignature: "lifecycle.record.signature",
} as const;

export type LifecycleIssueCode = (typeof LIFECYCLE_ISSUE_CODES)[keyof typeof LIFECYCLE_ISSUE_CODES];

export type LifecycleIssue = { code: LifecycleIssueCode | string; subject: string };

/** Qualified review expressed as a MasterDocument. Not the compatibility id. Not approved. */
export type GenuineMasterRecord = {
  master: MasterDocument;
  reviewedCompatibilityMasterId: string;
  reviewer: string;
  reviewedAt: string;
  reviewEvidenceRef: string;
};

export type OperationalRecord = DocumentRecordRef & {
  signatureState: "UNSIGNED" | "SIGNED";
  actor: string | null;
  signedAt: string | null;
  evidenceRef: string | null;
};

/** Live registers. Empty. The gates do not write them. */
export const LIFECYCLE_GENUINE_MASTERS: readonly GenuineMasterRecord[] = [];
export const LIFECYCLE_MASTER_APPROVALS: readonly MasterDocument[] = [];
export const LIFECYCLE_CARRIER_ADOPTIONS: readonly GenuineMasterRecord[] = [];
export const LIFECYCLE_CANONICAL_INSTANCES: readonly CarrierInstance[] = [];
export const LIFECYCLE_OPERATIONAL_RECORDS: readonly OperationalRecord[] = [];

const APPROVING_REGULATORY = ["NOT_APPLICABLE", "VERIFIED_CITED", "COMPANY_POLICY", "BEST_PRACTICE"] as const;

function issue(code: string, subject: string): LifecycleIssue {
  return { code, subject };
}

function blank(value: string | null | undefined): boolean {
  return substantiveTextBlank(value);
}

/** One read, then the Phase 2D format-character rule and the existing case fold. */
function evidenceComparisonKey(value: string | null | undefined): string | null {
  if (value == null || substantiveTextBlank(value)) return null;
  return normalizeEvidenceRef(value.replace(/\p{Cf}/gu, ""));
}

function rosterLifecycles(familyKey: string): string[] {
  return CONTROLLED_DOCUMENT_ROSTER.filter((row) => row.code === familyKey).map((row) => row.lifecycle);
}

function activeMasterCount(familyKey: string, extra: readonly MasterDocument[]): number {
  const roster = rosterLifecycles(familyKey).filter((lifecycle) => isActiveLifecycle(lifecycle)).length;
  const added = extra.filter((master) => master.familyKey === familyKey && isActiveLifecycle(master.lifecycle)).length;
  return roster + added;
}

function inflightMasterCount(familyKey: string, extra: readonly MasterDocument[]): number {
  const roster = rosterLifecycles(familyKey).filter((lifecycle) => isInflightLifecycle(lifecycle)).length;
  const added = extra.filter((master) => master.familyKey === familyKey && isInflightLifecycle(master.lifecycle)).length;
  return roster + added;
}

function unapprovedMaster(record: GenuineMasterRecord): MasterDocument {
  const reviewed = record.reviewedCompatibilityMasterId;
  return {
    masterId: record.master.masterId,
    familyKey: record.master.familyKey,
    version: record.master.version,
    title: record.master.title,
    lifecycle: "DRAFT",
    approval: {
      scope: "BOF_MASTER",
      status: "NOT_APPROVED",
      approverRole: "BOF Master Approval Authority",
      approverName: null,
      approvedAt: null,
      evidenceRef: null,
    },
    productionGate: "NEEDS_REVIEW",
    regulatoryReview: "NOT_APPLICABLE",
    owner: "BOF Master Approval Authority",
    steward: "BOF Master Approval Authority",
    complianceReviewer: "BOF Master Approval Authority",
    recommendation: "KEEP",
    overrideRules: [],
    provenance: {
      origin: "BOF_AUTHORED",
      sourceRefs: [{ kind: "OTHER", ref: reviewed, note: "Reviewed compatibility identity" }],
      note: `Phase 2E review ${record.reviewer} at ${record.reviewedAt}. Evidence ${record.reviewEvidenceRef}.`,
    },
    stableAppIds: [],
    notes: "Genuine master identity. Not the compatibility identity. Not approved.",
  };
}

export function establishGenuineMaster(input: {
  review: Phase2EMasterReviewInput;
  /** Explicit version. Not minted from the compatibility version. */
  genuineVersion: string;
  existingMasters?: readonly MasterDocument[];
  claimedGenuineBofMaster?: boolean;
  claimedMasterId?: string;
}): { issues: LifecycleIssue[]; record: GenuineMasterRecord | null } {
  const review = evaluatePhase2EMasterReview(input.review);
  const subject = input.review.compatibilityMasterId;
  if (!review.genuineMasterQualified || review.metadata == null || review.genuineBofMaster !== false) {
    return { issues: [...review.issues, issue(LIFECYCLE_ISSUE_CODES.review, subject)], record: null };
  }
  const reviewedId = review.metadata.genuineMasterState.reviewedCompatibilityMasterId;
  const masterId = canonicalMasterIdentity(review.metadata.familyKey, input.genuineVersion);
  const issues: LifecycleIssue[] = [];
  if (
    masterId == null ||
    masterId === reviewedId ||
    (masterId != null && COMPATIBILITY_MASTER_IDS.has(masterId)) ||
    input.claimedMasterId === reviewedId ||
    (input.claimedMasterId != null && COMPATIBILITY_MASTER_IDS.has(input.claimedMasterId)) ||
    (input.claimedMasterId != null && input.claimedMasterId !== masterId)
  ) {
    issues.push(issue(LIFECYCLE_ISSUE_CODES.compatibility, reviewedId));
  }
  if (input.claimedGenuineBofMaster === true) {
    issues.push(issue(LIFECYCLE_ISSUE_CODES.identity, reviewedId));
  }
  const familyKey = review.metadata.familyKey;
  const existing = input.existingMasters ?? [];
  if (inflightMasterCount(familyKey, existing) >= 1) issues.push(issue(LIFECYCLE_ISSUE_CODES.masterVersion, familyKey));
  if (issues.length > 0 || masterId == null) return { issues, record: null };
  const version = input.genuineVersion;
  const record: GenuineMasterRecord = {
    reviewedCompatibilityMasterId: reviewedId,
    reviewer: review.metadata.reviewer,
    reviewedAt: review.metadata.reviewedAt,
    reviewEvidenceRef: review.metadata.evidenceRef,
    master: unapprovedMaster({
      master: {
        masterId: makeMasterId(familyKey, version),
        familyKey,
        version,
        title: familyKey,
        lifecycle: "DRAFT",
        approval: {
          scope: "BOF_MASTER",
          status: "NOT_APPROVED",
          approverRole: "BOF Master Approval Authority",
          approverName: null,
          approvedAt: null,
          evidenceRef: null,
        },
        productionGate: "NEEDS_REVIEW",
        regulatoryReview: "NOT_APPLICABLE",
        owner: "BOF Master Approval Authority",
        steward: "BOF Master Approval Authority",
        complianceReviewer: "BOF Master Approval Authority",
        recommendation: "KEEP",
        overrideRules: [],
        provenance: {
          origin: "BOF_AUTHORED",
          sourceRefs: [{ kind: "OTHER", ref: reviewedId, note: "Reviewed compatibility identity" }],
          note: "",
        },
        stableAppIds: [],
        notes: "",
      },
      reviewedCompatibilityMasterId: reviewedId,
      reviewer: review.metadata.reviewer,
      reviewedAt: review.metadata.reviewedAt,
      reviewEvidenceRef: review.metadata.evidenceRef,
    }),
  };
  return { issues: [], record };
}

export type LifecycleApprovalInput = {
  review: Phase2EMasterReviewInput;
  genuineVersion: string;
  approvalAuthority: string;
  approvedAt: string;
  evidenceRef: string;
  regulatoryReview: string;
  productionGate: string;
  lifecycle: string;
  /** Authoritative supersession time. A cleared copy of the master does not erase it. */
  supersededAt?: string | null;
  existingMasters?: readonly MasterDocument[];
  claimedApproved?: boolean;
  claimedGenuineBofMaster?: boolean;
  /** Ignored as proof. Present so a hand-built record cannot be mistaken for review. */
  genuineMasters?: readonly GenuineMasterRecord[];
};

export function evaluateMasterApproval(input: LifecycleApprovalInput): { issues: LifecycleIssue[]; master: MasterDocument | null } {
  const approvalEvidence = input.evidenceRef;
  const approvalAuthority = input.approvalAuthority;
  const approvedAt = input.approvedAt;
  const supersededAt = input.supersededAt ?? null;
  const established = establishGenuineMaster({
    review: input.review,
    genuineVersion: input.genuineVersion,
    existingMasters: input.existingMasters,
    claimedGenuineBofMaster: input.claimedGenuineBofMaster,
  });
  const record = established.record;
  const subject = record?.master.masterId ?? input.review.compatibilityMasterId;
  const issues: LifecycleIssue[] = [...established.issues];
  if (record == null || record.master.masterId !== makeMasterId(record.master.familyKey, record.master.version)) {
    issues.push(issue(LIFECYCLE_ISSUE_CODES.approvalMissing, subject));
  }
  if (record != null && record.master.masterId === record.reviewedCompatibilityMasterId) {
    issues.push(issue(LIFECYCLE_ISSUE_CODES.compatibility, record.reviewedCompatibilityMasterId));
  }
  if (blank(approvalAuthority)) issues.push(issue(LIFECYCLE_ISSUE_CODES.approvalAuthority, subject));
  if (!isStrictIsoTimestamp(approvedAt)) issues.push(issue(LIFECYCLE_ISSUE_CODES.approvalTimestamp, approvedAt));
  if (blank(approvalEvidence)) issues.push(issue(LIFECYCLE_ISSUE_CODES.approvalEvidence, subject));
  if (!(APPROVING_REGULATORY as readonly string[]).includes(input.regulatoryReview)) {
    issues.push(issue(LIFECYCLE_ISSUE_CODES.approvalRegulatory, input.regulatoryReview));
  }
  if (input.productionGate !== "ACTIVE" || input.lifecycle !== "ACTIVE") {
    issues.push(issue(LIFECYCLE_ISSUE_CODES.approvalGate, subject));
  }
  if (supersededAt != null && supersededAt !== "" && !isStrictIsoTimestamp(supersededAt)) {
    issues.push(issue(LIFECYCLE_ISSUE_CODES.adoptionSuperseded, subject));
  }
  if (input.claimedApproved === true) issues.push(issue(LIFECYCLE_ISSUE_CODES.approvalMissing, subject));
  const familyKey = record?.master.familyKey ?? input.review.familyKey;
  if (activeMasterCount(familyKey, input.existingMasters ?? []) >= 1) {
    issues.push(issue(LIFECYCLE_ISSUE_CODES.masterVersion, familyKey));
  }
  if (issues.length > 0 || record == null) return { issues, master: null };
  const master: MasterDocument = {
    ...record.master,
    lifecycle: "ACTIVE",
    productionGate: "ACTIVE",
    regulatoryReview: input.regulatoryReview as MasterDocument["regulatoryReview"],
    supersededAt: supersededAt != null && supersededAt !== "" ? supersededAt : null,
    approval: {
      scope: "BOF_MASTER",
      status: "APPROVED",
      approverRole: approvalAuthority,
      approverName: approvalAuthority,
      approvedAt,
      evidenceRef: approvalEvidence,
      revocation: null,
    },
  };
  if (!isMasterApproved(master) || !isMasterOpenForNewAdoption(master)) {
    return { issues: [issue(LIFECYCLE_ISSUE_CODES.approvalGate, master.masterId)], master: null };
  }
  return { issues: [], master };
}

function timingBlocksAdoption(master: MasterDocument, adoptedAt: string): boolean {
  if (master.lifecycle === "SUPERSEDED") return true;
  if (master.supersededAt == null || master.supersededAt === "") return false;
  if (!isStrictIsoTimestamp(master.supersededAt) || !isStrictIsoTimestamp(adoptedAt)) return true;
  const probe = {
    ...master,
    lifecycle: "SUPERSEDED" as const,
  };
  const instance = {
    adoption: { adoptedAt },
  } as CarrierInstance;
  return !adoptionPredatesSupersession(probe, instance);
}

export type LifecycleAdoptionInput = LifecycleApprovalInput & {
  carrierId: string;
  adoptionAuthority: string;
  adoptedAt: string;
  adoptionEvidenceRef: string;
  policy?: readonly { provision: Phase2EPolicyProvision; selection: Phase2ECarrierPolicySelection }[];
  /** Convenience copy. Disagreement with the re-run approval fails closed. */
  claimedMaster?: MasterDocument | null;
};

export function evaluateCarrierAdoption(input: LifecycleAdoptionInput): { issues: LifecycleIssue[]; master: MasterDocument | null } {
  const adoptionEvidence = input.adoptionEvidenceRef;
  const adoptedAt = input.adoptedAt;
  const adoptionAuthority = input.adoptionAuthority;
  const claimedEvidence = input.claimedMaster?.approval?.evidenceRef ?? null;
  const claimedSuperseded = input.claimedMaster?.supersededAt ?? null;
  const approved = evaluateMasterApproval(input);
  const master = approved.master;
  const subject = master?.masterId ?? "(adoption)";
  const issues: LifecycleIssue[] = [...approved.issues];
  if (master == null || !isMasterApproved(master) || !isMasterOpenForNewAdoption(master)) {
    issues.push(issue(LIFECYCLE_ISSUE_CODES.adoptionMaster, subject));
  }
  if (!isCarrierId(input.carrierId)) issues.push(issue(LIFECYCLE_ISSUE_CODES.adoptionMaster, input.carrierId));
  if (blank(adoptionAuthority)) issues.push(issue(LIFECYCLE_ISSUE_CODES.adoptionAuthority, subject));
  if (!isStrictIsoTimestamp(adoptedAt)) issues.push(issue(LIFECYCLE_ISSUE_CODES.adoptionTimestamp, adoptedAt));
  if (blank(adoptionEvidence)) issues.push(issue(LIFECYCLE_ISSUE_CODES.adoptionEvidence, subject));
  const approvalKey = evidenceComparisonKey(master?.approval.evidenceRef);
  const adoptionKey = evidenceComparisonKey(adoptionEvidence);
  const claimedKey = evidenceComparisonKey(claimedEvidence);
  if (approvalKey != null && (approvalKey === adoptionKey || (claimedKey != null && claimedKey === adoptionKey))) {
    issues.push(issue(LIFECYCLE_ISSUE_CODES.adoptionReused, subject));
  }
  if (input.claimedMaster != null && approvalKey != null && claimedKey !== approvalKey) {
    issues.push(issue(LIFECYCLE_ISSUE_CODES.adoptionReused, subject));
  }
  const authoritativeSuperseded = master?.supersededAt ?? null;
  if (input.claimedMaster != null && (claimedSuperseded ?? "") !== (authoritativeSuperseded ?? "")) {
    issues.push(issue(LIFECYCLE_ISSUE_CODES.adoptionSuperseded, subject));
  }
  if (master != null && isStrictIsoTimestamp(adoptedAt) && timingBlocksAdoption(master, adoptedAt)) {
    issues.push(issue(LIFECYCLE_ISSUE_CODES.adoptionSuperseded, subject));
  }
  for (const pair of input.policy ?? []) {
    if (evaluatePhase2ECarrierPolicy(pair.provision, pair.selection).length > 0) {
      issues.push(issue(LIFECYCLE_ISSUE_CODES.adoptionPolicy, pair.provision.classification));
    }
  }
  if (issues.length > 0 || master == null) return { issues, master: null };
  return { issues: [], master };
}

export type LifecycleInstanceInput = LifecycleAdoptionInput & {
  instanceVersion: string;
  existingInstances?: readonly CarrierInstance[];
  claimedEffective?: boolean;
  claimedAdoptionStatus?: string;
};

export function evaluateCanonicalInstance(input: LifecycleInstanceInput): { issues: LifecycleIssue[]; instance: CarrierInstance | null } {
  const instanceVersion = input.instanceVersion;
  const adoptionAuthority = input.adoptionAuthority;
  const adoptedAt = input.adoptedAt;
  const adoptionEvidence = input.adoptionEvidenceRef;
  const adopted = evaluateCarrierAdoption(input);
  const master = adopted.master;
  const subject = input.carrierId;
  const issues: LifecycleIssue[] = [...adopted.issues];
  if (master == null) issues.push(issue(LIFECYCLE_ISSUE_CODES.instanceAdoption, subject));
  if (blank(instanceVersion) || instanceVersion.includes("@")) {
    issues.push(issue(LIFECYCLE_ISSUE_CODES.instanceVersion, instanceVersion));
  }
  if (master == null || !isCarrierId(input.carrierId)) {
    return { issues, instance: null };
  }
  const instanceId = makeInstanceId(master.familyKey, input.carrierId);
  const existing = input.existingInstances ?? [];
  if (existing.some((item) => item.instanceId === instanceId && isActiveLifecycle(item.lifecycle))) {
    issues.push(issue(LIFECYCLE_ISSUE_CODES.instanceLimit, instanceId));
  }
  if (issues.length > 0) return { issues, instance: null };
  const instance: CarrierInstance = {
    instanceId,
    familyKey: master.familyKey,
    carrierId: input.carrierId,
    masterId: master.masterId,
    instanceVersion,
    localCode: null,
    localTitle: master.familyKey,
    lifecycle: "ACTIVE",
    adoption: {
      scope: "CARRIER_ADOPTION",
      carrierId: input.carrierId,
      status: "ADOPTED",
      adoptedByName: adoptionAuthority,
      adoptedByTitle: adoptionAuthority,
      adoptedAt,
      evidenceRef: adoptionEvidence,
    },
    overrides: [],
    provenance: {
      origin: "BOF_AUTHORED",
      sourceRefs: [{ kind: "OTHER", ref: master.masterId, note: "Pinned master version" }],
      note: "Carrier canonical instance. Master text is not rewritten.",
    },
    stableAppIds: [],
  };
  const summary = summarizeInstanceApproval(master, instance);
  if (!summary.instanceEffective || instance.masterId !== master.masterId) {
    return { issues: [issue(LIFECYCLE_ISSUE_CODES.instanceMaster, instance.instanceId)], instance: null };
  }
  return { issues: [], instance };
}

export function evaluateInflightInstance(input: {
  familyKey: string;
  carrierId: string;
  instanceVersion: string;
  existingInstances?: readonly CarrierInstance[];
}): { issues: LifecycleIssue[]; instance: CarrierInstance | null } {
  if (!isCarrierId(input.carrierId) || blank(input.instanceVersion)) {
    return { issues: [issue(LIFECYCLE_ISSUE_CODES.instanceVersion, input.instanceVersion)], instance: null };
  }
  const instanceId = makeInstanceId(input.familyKey, input.carrierId);
  const existing = input.existingInstances ?? [];
  if (existing.some((item) => item.instanceId === instanceId && isInflightLifecycle(item.lifecycle))) {
    return { issues: [issue(LIFECYCLE_ISSUE_CODES.instanceLimit, instanceId)], instance: null };
  }
  return {
    issues: [],
    instance: {
      instanceId,
      familyKey: input.familyKey,
      carrierId: input.carrierId,
      masterId: null,
      instanceVersion: input.instanceVersion,
      localCode: null,
      localTitle: input.familyKey,
      lifecycle: "DRAFT",
      adoption: {
        scope: "CARRIER_ADOPTION",
        carrierId: input.carrierId,
        status: "NOT_ADOPTED",
        adoptedByName: null,
        adoptedByTitle: null,
        adoptedAt: null,
        evidenceRef: null,
      },
      overrides: [],
      provenance: { origin: "BOF_AUTHORED", sourceRefs: [], note: "In-flight instance. Not adopted." },
      stableAppIds: [],
    },
  };
}

export function evaluateOperationalRecord(input: LifecycleInstanceInput & {
  instances?: readonly CarrierInstance[];
  masters?: readonly MasterDocument[];
  recordId: string;
  pinnedInstanceId: string | null;
  pinnedInstanceVersion: string | null;
  masterId?: string | null;
  kind: string;
  actor: string | null;
  signedAt: string | null;
  recordEvidenceRef?: string | null;
}): { issues: LifecycleIssue[]; record: OperationalRecord | null } {
  const issues: LifecycleIssue[] = [];
  if (input.pinnedInstanceId == null || input.pinnedInstanceVersion == null) {
    issues.push(issue(LIFECYCLE_ISSUE_CODES.recordMasterPin, input.masterId ?? "(record)"));
    return { issues, record: null };
  }
  const created = evaluateCanonicalInstance(input);
  const instance = created.instance;
  if (
    instance == null ||
    instance.instanceId !== input.pinnedInstanceId ||
    instance.instanceVersion !== input.pinnedInstanceVersion
  ) {
    return {
      issues: [...created.issues, issue(LIFECYCLE_ISSUE_CODES.recordInstance, input.pinnedInstanceVersion)],
      record: null,
    };
  }
  if (blank(input.recordId)) issues.push(issue(LIFECYCLE_ISSUE_CODES.recordSignature, input.recordId));
  const signed = input.kind === "SIGNED";
  const signatureEvidence = input.recordEvidenceRef ?? null;
  if (signed && (blank(input.actor) || input.signedAt == null || !isStrictIsoTimestamp(input.signedAt) || blank(signatureEvidence))) {
    issues.push(issue(LIFECYCLE_ISSUE_CODES.recordSignature, input.recordId));
  }
  if (input.kind !== "FILLED" && input.kind !== "SIGNED" && input.kind !== "SAMPLE") {
    issues.push(issue(LIFECYCLE_ISSUE_CODES.recordSignature, input.kind));
  }
  if (issues.length > 0) return { issues, record: null };
  return {
    issues: [],
    record: {
      recordId: input.recordId,
      kind: input.kind as OperationalRecord["kind"],
      instanceId: instance.instanceId,
      instanceVersion: instance.instanceVersion,
      signatureState: signed ? "SIGNED" : "UNSIGNED",
      actor: input.actor,
      signedAt: input.signedAt,
      evidenceRef: signatureEvidence,
    },
  };
}
