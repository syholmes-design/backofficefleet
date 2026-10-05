/**
 * BOF master approval vs. carrier adoption.
 *
 * These are distinct scopes and must never be conflated: a carrier adopting
 * its instance never implies BOF approval of the master.
 *
 * Versioning: master approval is VERSION-LEVEL. A genuinely approved master
 * version that has since been SUPERSEDED is still an approved version; it is
 * only closed for new adoption. An already-adopted carrier instance pinned to
 * it remains effective. Only ARCHIVED lifecycle, an explicit revocation, a
 * legal-review flag, or a non-ACTIVE production gate make a master version not
 * approved. The current master is not the effective version for every carrier.
 */
import {
  FAMILY_ISSUE_CODES as C,
  familyIssue,
  isBlank,
  normalizeEvidenceRef,
  type FamilyIssue,
} from "./issues";
import {
  MASTER_REVOCATION_REASONS,
  type CarrierInstance,
  type MasterDocument,
} from "./types";
import { REGULATORY_REVIEWS } from "@/lib/document-control/types";

/**
 * Regulatory-review values that permit BOF master approval (explicit
 * allowlist). REQUIRES_LEGAL_REVIEW, and any missing, malformed or unknown
 * value, never permits approval. Values are compared exactly; nothing is
 * normalized into an allowed value.
 */
export const APPROVING_REGULATORY_REVIEWS = [
  "NOT_APPLICABLE",
  "VERIFIED_CITED",
  "COMPANY_POLICY",
  "BEST_PRACTICE",
] as const;

/** True only for an exact APPROVING_REGULATORY_REVIEWS value. Never throws. */
export function isRegulatoryReviewApproving(value: unknown): boolean {
  return (
    typeof value === "string" &&
    (APPROVING_REGULATORY_REVIEWS as readonly string[]).includes(value)
  );
}

/** True only for an exact REGULATORY_REVIEWS value. Never throws. */
export function isRegulatoryReviewKnown(value: unknown): boolean {
  return typeof value === "string" && (REGULATORY_REVIEWS as readonly string[]).includes(value);
}

/**
 * Strict ISO-8601 date-time with an explicit timezone.
 * Date-only, timezone-less, and non-ISO strings are rejected.
 * Date.parse is not used: it accepts those forms and can roll a bad calendar
 * date into a real instant.
 */
const STRICT_ISO_TIMESTAMP =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(Z|[+-]\d{2}:\d{2})$/;

function daysInMonth(year: number, month: number): number {
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return days[month - 1] ?? 0;
}

function parseTimestamp(value: unknown): number | null {
  if (typeof value !== "string" || isBlank(value)) return null;
  const match = STRICT_ISO_TIMESTAMP.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  const fraction = match[7];
  const zone = match[8];

  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  if (hour > 23 || minute > 59 || second > 59) return null;

  let offsetMinutes = 0;
  if (zone !== "Z") {
    const offsetHour = Number(zone.slice(1, 3));
    const offsetMinute = Number(zone.slice(4, 6));
    if (offsetHour > 23 || offsetMinute > 59) return null;
    const sign = zone[0] === "+" ? 1 : -1;
    offsetMinutes = sign * (offsetHour * 60 + offsetMinute);
  }

  const milliseconds = fraction === undefined ? 0 : Number((fraction + "000").slice(0, 3));
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, second, milliseconds);
  if (!Number.isFinite(localAsUtc)) return null;
  const utc = localAsUtc - offsetMinutes * 60_000;

  const roundTrip = new Date(utc + offsetMinutes * 60_000);
  if (
    roundTrip.getUTCFullYear() !== year ||
    roundTrip.getUTCMonth() !== month - 1 ||
    roundTrip.getUTCDate() !== day ||
    roundTrip.getUTCHours() !== hour ||
    roundTrip.getUTCMinutes() !== minute ||
    roundTrip.getUTCSeconds() !== second ||
    roundTrip.getUTCMilliseconds() !== milliseconds
  ) {
    return null;
  }
  return utc;
}

/**
 * True only when the instance's carrier adoption is provably dated BEFORE the
 * master's supersededAt, i.e. it is an EXISTING adoption made while the master
 * was still open. Missing or unparseable timestamps are never treated as
 * proof (fail closed). Never throws.
 */
export function adoptionPredatesSupersession(
  master: MasterDocument,
  instance: CarrierInstance,
): boolean {
  const supersededAt = parseTimestamp(master.supersededAt);
  const adoptedAt = parseTimestamp(instance.adoption?.adoptedAt);
  return supersededAt !== null && adoptedAt !== null && adoptedAt < supersededAt;
}

/**
 * True when the instance targets a SUPERSEDED master and is not a provable
 * pre-supersession adoption: an adoption on or after supersededAt (or one
 * whose timing cannot be established) is a NEW adoption, which is prohibited.
 */
export function isNewAdoptionAgainstSupersededMaster(
  master: MasterDocument,
  instance: CarrierInstance,
): boolean {
  return master.lifecycle === "SUPERSEDED" && !adoptionPredatesSupersession(master, instance);
}

export type ApprovalSummary = {
  masterApproved: boolean;
  masterOpenForNewAdoption: boolean;
  masterSuperseded: boolean;
  carrierAdopted: boolean;
  instanceEffective: boolean;
  masterApprovalSource: "BOF_MASTER" | "NONE";
  reasons: string[];
};

/** approverName, approvedAt and evidenceRef are all non-blank. */
export function hasMasterApprovalEvidence(master: MasterDocument): boolean {
  const a = master.approval;
  return !isBlank(a.approverName) && !isBlank(a.approvedAt) && !isBlank(a.evidenceRef);
}

/** adoptedByName, adoptedAt and evidenceRef are all non-blank. */
export function hasAdoptionEvidence(instance: CarrierInstance): boolean {
  const a = instance.adoption;
  return !isBlank(a.adoptedByName) && !isBlank(a.adoptedAt) && !isBlank(a.evidenceRef);
}

export function isMasterRevoked(master: MasterDocument): boolean {
  return master.approval.revocation != null;
}

/**
 * VERSION-LEVEL approval, computed ONLY from the master document.
 * SUPERSEDED versions that were genuinely approved remain approved.
 */
export function isMasterApproved(master: MasterDocument): boolean {
  return (
    master.approval.scope === "BOF_MASTER" &&
    master.approval.status === "APPROVED" &&
    hasMasterApprovalEvidence(master) &&
    !isMasterRevoked(master) &&
    isRegulatoryReviewApproving(master.regulatoryReview) &&
    master.productionGate === "ACTIVE" &&
    (master.lifecycle === "ACTIVE" || master.lifecycle === "SUPERSEDED")
  );
}

/** Approved AND the current (ACTIVE) master version. */
export function isMasterOpenForNewAdoption(master: MasterDocument): boolean {
  return isMasterApproved(master) && master.lifecycle === "ACTIVE";
}

export function isCarrierAdopted(instance: CarrierInstance): boolean {
  return (
    instance.adoption.scope === "CARRIER_ADOPTION" &&
    instance.adoption.status === "ADOPTED" &&
    instance.adoption.carrierId === instance.carrierId &&
    hasAdoptionEvidence(instance)
  );
}

function masterApprovalReasons(master: MasterDocument): string[] {
  const reasons: string[] = [];
  if (master.approval.scope !== "BOF_MASTER") {
    reasons.push(`master approval scope is "${String(master.approval.scope)}", not BOF_MASTER`);
  }
  if (master.approval.status !== "APPROVED") {
    reasons.push(`BOF master approval status is ${master.approval.status}`);
  } else if (!hasMasterApprovalEvidence(master)) {
    reasons.push("BOF master approval lacks approverName, approvedAt or evidenceRef");
  }
  if (isMasterRevoked(master)) {
    reasons.push("master approval has been revoked");
  }
  if (master.lifecycle !== "ACTIVE" && master.lifecycle !== "SUPERSEDED") {
    reasons.push(`master lifecycle is ${master.lifecycle}`);
  }
  if (master.productionGate !== "ACTIVE") {
    reasons.push(`master production gate is ${master.productionGate}`);
  }
  if (master.regulatoryReview === "REQUIRES_LEGAL_REVIEW") {
    reasons.push("master requires legal review");
  } else if (!isRegulatoryReviewApproving(master.regulatoryReview)) {
    reasons.push(`master regulatoryReview "${String(master.regulatoryReview)}" is not an approving value`);
  }
  return reasons;
}

function carrierAdoptionReasons(instance: CarrierInstance): string[] {
  const reasons: string[] = [];
  const a = instance.adoption;
  if (a.scope !== "CARRIER_ADOPTION") {
    reasons.push(`adoption scope is "${String(a.scope)}", not CARRIER_ADOPTION`);
  }
  if (a.status !== "ADOPTED") {
    reasons.push(`carrier adoption status is ${a.status}`);
  } else if (!hasAdoptionEvidence(instance)) {
    reasons.push("carrier adoption lacks adoptedByName, adoptedAt or evidenceRef");
  }
  if (a.carrierId !== instance.carrierId) {
    reasons.push(
      `adoption carrierId "${a.carrierId}" does not match instance carrierId "${instance.carrierId}"`,
    );
  }
  return reasons;
}

export function summarizeInstanceApproval(
  master: MasterDocument | null,
  instance: CarrierInstance,
): ApprovalSummary {
  const reasons: string[] = [];

  // masterApproved derives from the master only; never from instance.adoption.
  let masterApproved = false;
  let masterOpenForNewAdoption = false;
  let masterSuperseded = false;
  if (master === null) {
    reasons.push("BOF master not yet authored");
  } else {
    masterApproved = isMasterApproved(master);
    masterOpenForNewAdoption = isMasterOpenForNewAdoption(master);
    masterSuperseded = master.lifecycle === "SUPERSEDED";
    if (!masterApproved) reasons.push(...masterApprovalReasons(master));
  }

  const carrierAdopted = isCarrierAdopted(instance);
  if (!carrierAdopted) reasons.push(...carrierAdoptionReasons(instance));

  const pinned = master !== null && master.masterId === instance.masterId;
  if (master !== null && !pinned) {
    reasons.push(`instance is pinned to ${instance.masterId ?? "no master"}, not ${master.masterId}`);
  }

  if (instance.lifecycle !== "ACTIVE") {
    reasons.push(`instance lifecycle is ${instance.lifecycle}`);
  }

  // An existing adoption pinned to a superseded master stays effective; a new
  // adoption (on/after supersededAt, or of unprovable timing) never does.
  const newAdoptionOfSuperseded =
    master !== null && pinned && isNewAdoptionAgainstSupersededMaster(master, instance);
  if (newAdoptionOfSuperseded) {
    reasons.push(
      "adoption is not provably dated before the master's supersededAt (new adoption against a superseded master)",
    );
  }

  const instanceEffective =
    masterApproved &&
    carrierAdopted &&
    instance.lifecycle === "ACTIVE" &&
    pinned &&
    !newAdoptionOfSuperseded;

  return {
    masterApproved,
    masterOpenForNewAdoption,
    masterSuperseded,
    carrierAdopted,
    instanceEffective,
    masterApprovalSource: masterApproved ? "BOF_MASTER" : "NONE",
    reasons,
  };
}

/** Structural checks on a master's BOF approval block. */
export function validateMasterApproval(master: MasterDocument): FamilyIssue[] {
  const issues: FamilyIssue[] = [];
  const subject = master.masterId;
  const a = master.approval;

  if (a.scope !== "BOF_MASTER") {
    issues.push(
      familyIssue(
        C.masterApprovalScope,
        "error",
        subject,
        `master approval scope must be BOF_MASTER (got "${String(a.scope)}")`,
      ),
    );
  }
  if (
    a.status === "APPROVED" &&
    (isBlank(a.approverName) || isBlank(a.approvedAt) || isBlank(a.evidenceRef))
  ) {
    issues.push(
      familyIssue(
        C.masterApprovalEvidenceMissing,
        "error",
        subject,
        "master approval status is APPROVED but approverName, approvedAt or evidenceRef is missing",
      ),
    );
  }
  if (a.evidenceRef !== null && a.evidenceRef !== undefined && isBlank(a.evidenceRef)) {
    issues.push(
      familyIssue(C.approvalEvidenceEmpty, "error", subject, "master approval evidenceRef is empty"),
    );
  }
  if (!isRegulatoryReviewKnown(master.regulatoryReview)) {
    issues.push(
      familyIssue(
        C.masterRegulatoryReviewInvalid,
        "error",
        subject,
        `master regulatoryReview ${JSON.stringify(master.regulatoryReview) ?? "undefined"} is not a recognized value`,
      ),
    );
  }
  const rev = a.revocation;
  if (rev != null) {
    const reasonValid = (MASTER_REVOCATION_REASONS as readonly string[]).includes(
      rev.reason as string,
    );
    if (!reasonValid || isBlank(rev.revokedAt)) {
      issues.push(
        familyIssue(
          C.masterApprovalRevocationInvalid,
          "error",
          subject,
          "master approval revocation requires a valid reason and a non-blank revokedAt",
        ),
      );
    }
  }
  return issues;
}

/**
 * Checks that carrier adoption is structurally sound and kept separate from
 * BOF master approval. Each condition yields its own independently coded issue.
 */
export function validateApprovalSeparation(
  master: MasterDocument | null,
  instance: CarrierInstance,
): FamilyIssue[] {
  const issues: FamilyIssue[] = [];
  const subject = `${instance.instanceId}@${instance.instanceVersion}`;
  const a = instance.adoption;

  if (a.scope !== "CARRIER_ADOPTION") {
    issues.push(
      familyIssue(
        C.approvalScopeInvalid,
        "error",
        subject,
        `adoption scope must be CARRIER_ADOPTION (got "${String(a.scope)}")`,
      ),
    );
  }
  if (a.carrierId !== instance.carrierId) {
    issues.push(
      familyIssue(
        C.approvalAdoptionCarrierMismatch,
        "error",
        subject,
        `adoption carrierId "${a.carrierId}" does not match instance carrierId "${instance.carrierId}"`,
      ),
    );
  }
  if (
    a.status === "ADOPTED" &&
    (isBlank(a.adoptedByName) || isBlank(a.adoptedAt) || isBlank(a.evidenceRef))
  ) {
    issues.push(
      familyIssue(
        C.approvalAdoptionEvidenceMissing,
        "error",
        subject,
        "adoption status is ADOPTED but adoptedByName, adoptedAt or evidenceRef is missing",
      ),
    );
  }
  if (a.evidenceRef !== null && a.evidenceRef !== undefined && isBlank(a.evidenceRef)) {
    issues.push(
      familyIssue(C.approvalEvidenceEmpty, "error", subject, "carrier adoption evidenceRef is empty"),
    );
  }

  if (master !== null) {
    const masterEv = normalizeEvidenceRef(master.approval.evidenceRef);
    const adoptionEv = normalizeEvidenceRef(a.evidenceRef);
    if (masterEv !== null && adoptionEv !== null && masterEv === adoptionEv) {
      issues.push(
        familyIssue(
          C.approvalEvidenceReused,
          "error",
          subject,
          `carrier adoption evidence is reused as BOF master approval evidence for ${master.masterId}`,
        ),
      );
    }
  }

  if (instance.lifecycle === "ACTIVE" && !summarizeInstanceApproval(master, instance).instanceEffective) {
    issues.push(
      familyIssue(
        C.approvalInstanceActiveNotEffective,
        "error",
        subject,
        "instance lifecycle is ACTIVE but the instance is not effective",
      ),
    );
  }

  return issues;
}
