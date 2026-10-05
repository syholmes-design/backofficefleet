/**
 * Phase 2B genuine-master qualification register.
 *
 * One row per compatibility master, plus one BLOCKED row per Delta family.
 * A row is a governance posture. It does not create a master, approve a
 * master, adopt a carrier instance, or create a record.
 *
 * CANDIDATE is allowed only when a citation passes the candidate gate.
 * The live citation list is empty. Blocking postures cannot be promoted.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DELTA_ADVANCED_TRUCKING_PROFILE } from "../carriers/delta-advanced-trucking";
import {
  admissibleSourceExtension,
  PHASE2_CANDIDATE_CITATION_FIELDS,
  PHASE2_CANDIDATE_CITATIONS,
  PHASE2_MASTER_REVIEW_RELEASE_FIELDS,
  PHASE2_FULL_COMMIT_SHA,
  canonicalMasterIdentity,
  classifyPhase2RegisterEntry,
  evaluatePhase2CandidateCitation,
  evaluatePhase2MasterReviewRelease,
  holdsForFamily,
  type Phase2CandidateCitation,
  type Phase2CandidateGateContext,
  type Phase2CarrierMatchTerms,
  type Phase2CitationFacts,
  type Phase2MasterReviewRelease,
} from "./candidate-gate";
import { PHASE2_COLLISIONS } from "./collisions";
import { PHASE2_DELTA_FAMILIES } from "./delta-instances";
import { PHASE2_ROSTER_CLASSIFICATIONS } from "./roster-classification";
import {
  PHASE2_QUALIFICATION_BLOCKING_POSTURES,
  PHASE2_UNREVIEWED_INSPECTION_REASONS,
} from "./types";
import type {
  Phase2CompatibilityQualification,
  Phase2ContentPosture,
  Phase2DeltaFamilyQualification,
  Phase2QualificationResult,
  Phase2RosterClassification,
  Phase2UnreviewedEvidenceInspection,
} from "./types";

export const PHASE2_DELTA_QUALIFICATION_FAMILY_KEYS = [
  "BOF-OPS-006",
  "BOF-OPS-007",
  "BOF-OPS-008",
  "BOF-OPS-009",
  "BOF-PAY-001",
  "BOF-PAY-002",
] as const;

export const PHASE2_QUALIFICATION_ISSUE_CODES = {
  missingRow: "qualification.row.missing",
  duplicateRow: "qualification.row.duplicate",
  unknownRow: "qualification.row.unknown",
  identityMismatch: "qualification.identity.mismatch",
  blockedRequired: "qualification.blocked.required",
  deltaMissing: "qualification.delta.missing",
  deltaDuplicate: "qualification.delta.duplicate",
  deltaNotBlocked: "qualification.delta.notBlocked",
  deltaMasterId: "qualification.delta.masterId",
  deltaExtra: "qualification.delta.extra",
  deltaOnCompatibilityRegister: "qualification.delta.onCompatibilityRegister",
  resultUnexpected: "qualification.result.unexpected",
  candidateSourceMissing: "qualification.candidate.sourceMissing",
  candidateSourceAbsent: "qualification.candidate.sourceAbsent",
  candidateOnBlocked: "qualification.candidate.onBlockedPosture",
  candidateOnDelta: "qualification.candidate.onDelta",
  candidateApproved: "qualification.candidate.approved",
  candidateInstance: "qualification.candidate.instance",
  candidateAdoption: "qualification.candidate.adoption",
  candidateRecord: "qualification.candidate.record",
  candidateEffective: "qualification.candidate.effective",
  candidateHeld: "qualification.candidate.held",
  candidateGate: "qualification.candidate.gate",
  sourceRefMismatch: "qualification.sourceRef.mismatch",
  identityInvalid: "qualification.identity.invalid",
  citationDuplicate: "qualification.citation.duplicate",
  citationMalformed: "qualification.citation.malformed",
  releaseDuplicate: "qualification.release.duplicate",
  releaseMalformed: "qualification.release.malformed",
  releaseCitationMissing: "qualification.release.citationMissing",
  releaseMissing: "qualification.release.missing",
  genuineBofMaster: "qualification.genuineBofMaster",
  unreviewedSource: "qualification.unreviewed.source",
  masterApproved: "qualification.master.approved",
  recordPresent: "qualification.record.present",
} as const;

export type Phase2QualificationIssueCode =
  (typeof PHASE2_QUALIFICATION_ISSUE_CODES)[keyof typeof PHASE2_QUALIFICATION_ISSUE_CODES];

export type Phase2QualificationIssue = {
  code: Phase2QualificationIssueCode;
  subject: string;
};

/** Cited recovered carrier-neutral source. Empty unless such a source already exists. */
export type Phase2CandidateSourceCitation = {
  familyKey: string;
  /** Repository-relative path. Must already exist. Not approval evidence. */
  sourceRef: string;
};

export const PHASE2_CANDIDATE_SOURCE_CITATIONS: readonly Phase2CandidateSourceCitation[] = [];

const BLOCKING_POSTURES = new Set<string>(PHASE2_QUALIFICATION_BLOCKING_POSTURES);

const deltaFamilyKeySet = new Set<string>(PHASE2_DELTA_FAMILIES.map((family) => family.familyKey));
const expectedDeltaKeySet = new Set<string>(PHASE2_DELTA_QUALIFICATION_FAMILY_KEYS);
if (
  deltaFamilyKeySet.size !== expectedDeltaKeySet.size ||
  PHASE2_DELTA_QUALIFICATION_FAMILY_KEYS.some((key) => !deltaFamilyKeySet.has(key))
) {
  throw new Error(
    `Delta qualification keys do not match PHASE2_DELTA_FAMILIES (${[...deltaFamilyKeySet].join(", ")})`,
  );
}

function qualificationNote(
  familyKey: string,
  posture: Phase2ContentPosture,
  result: Phase2QualificationResult,
): string {
  if (result === "BLOCKED") {
    return `${familyKey} content posture is ${posture}. Qualification is BLOCKED. genuineBofMaster stays false. This row does not approve the compatibility master.`;
  }
  if (result === "CANDIDATE") {
    return `${familyKey} cites an existing recovered carrier-neutral source. Qualification is CANDIDATE only. genuineBofMaster stays false. The master is not approved, not adopted, and not effective.`;
  }
  if (result === "RELEASED_TO_MASTER_REVIEW") {
    return `${familyKey} is released to a separately authorized master-review workflow. This is not a master, not approval, not adoption, not effectiveness, and not a record.`;
  }
  return `${familyKey} has no cited recovered carrier-neutral source. The compatibility projection, family key, href, lifecycle, stableAppId, and File Cabinet id are not candidate evidence. Qualification is UNREVIEWED. genuineBofMaster stays false.`;
}

function unresolvedCollisionFamilyKeys(): string[] {
  return PHASE2_COLLISIONS.filter((collision) => collision.status === "UNRESOLVED").flatMap((collision) =>
    collision.distinctDocuments.flatMap((document) => (document.familyKey == null ? [] : [document.familyKey])),
  );
}

const qualificationRepoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");

function pushRecorded(target: string[], value: unknown, minimum: number): void {
  if (typeof value !== "string") return;
  const trimmed = value.trim();
  if (trimmed.length >= minimum) target.push(trimmed);
}

/** Recorded Delta facts only. Conflicting candidates are included. Empty and generic prefixes are not. */
export function recordedDeltaCarrierTerms(): Phase2CarrierMatchTerms {
  const profile = DELTA_ADVANCED_TRUCKING_PROFILE;
  const names: string[] = [];
  pushRecorded(names, profile.legalName.value, 1);
  pushRecorded(names, profile.dba.value, 1);
  const tokens: string[] = [];
  const phones: string[] = [];
  for (const entry of profile.usdot.conflictingValues ?? []) pushRecorded(tokens, entry.value, 6);
  for (const entry of profile.mc.conflictingValues ?? []) pushRecorded(tokens, entry.value, 6);
  for (const entry of profile.address.conflictingValues ?? []) {
    pushRecorded(names, entry.value.street, 8);
  }
  for (const entry of profile.contacts.conflictingValues ?? []) {
    if (!Array.isArray(entry.value)) continue;
    for (const contact of entry.value) {
      pushRecorded(tokens, contact.email, 6);
      pushRecorded(phones, contact.phone, 7);
      pushRecorded(names, contact.name, 5);
    }
  }
  const datPrefix = (profile.localCodePrefix.conflictingValues ?? []).some((entry) => entry.value === "DAT");
  return { names, tokens, phones, datPrefix };
}

function gitBytes(args: string[]): Buffer | null {
  try {
    return execFileSync("git", args, { cwd: qualificationRepoRoot, stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return null;
  }
}

function isSafeCitationPath(sourcePath: string): boolean {
  if (sourcePath.includes("\0") || sourcePath.includes("\\") || sourcePath.startsWith("/")) return false;
  if (/^[A-Za-z]:\//.test(sourcePath)) return false;
  return sourcePath.split("/").every((part) => part !== "" && part !== "." && part !== "..");
}

/**
 * Resolves filesystem and Git facts for the gate. The gate itself does not do this.
 * A commit string that is not a full lowercase SHA is not resolved.
 */
export function collectPhase2CitationFacts(citation: {
  sourcePath: string;
  provenanceCommit: string;
}): Phase2CitationFacts {
  const sourcePath = citation.sourcePath;
  const provenanceCommit = citation.provenanceCommit;
  const safePath = isSafeCitationPath(sourcePath);
  const absolute = safePath ? path.resolve(qualificationRepoRoot, sourcePath) : "";
  const sourcePresent = safePath && existsSync(absolute);
  const fullSha = PHASE2_FULL_COMMIT_SHA.test(provenanceCommit);
  let provenanceIsCommit = false;
  let provenanceIsAncestor = false;
  let provenancePathPresent = false;
  let provenanceBlobSha1: string | null = null;
  let blob: Buffer | null = null;
  if (fullSha && safePath) {
    const objectType = gitBytes(["cat-file", "-t", provenanceCommit])?.toString("utf8").trim();
    provenanceIsCommit = objectType === "commit";
    if (provenanceIsCommit) {
      provenanceIsAncestor = gitBytes(["merge-base", "--is-ancestor", provenanceCommit, "HEAD"]) != null;
      blob = gitBytes(["cat-file", "blob", `${provenanceCommit}:${sourcePath}`]);
      provenancePathPresent = blob != null;
      if (blob) provenanceBlobSha1 = createHash("sha1").update(blob).digest("hex");
    }
  }
  const classified = classifySourceBytes(sourcePath, blob);
  return {
    sourcePresent,
    provenanceIsCommit,
    provenanceIsAncestor,
    provenancePathPresent,
    provenanceBlobSha1,
    sourcePath,
    carrierInspection: classified.carrierInspection,
    inspectedText: classified.inspectedText,
    byteLength: classified.byteLength,
  };
}

/** Byte class used before any carrier matching. Invalid or non-text bytes stay uninspectable. */
export function classifySourceBytes(
  sourcePath: string,
  blob: Buffer | null,
): Pick<Phase2CitationFacts, "carrierInspection" | "inspectedText" | "byteLength"> {
  let utf8Ok = false;
  if (blob != null) {
    try {
      new TextDecoder("utf-8", { fatal: true }).decode(blob);
      utf8Ok = true;
    } catch {
      utf8Ok = false;
    }
  }
  const admissible = admissibleSourceExtension(sourcePath) && blob != null && utf8Ok && !blob.includes(0);
  const carrierInspection = admissible ? "text" : "uninspectable";
  return {
    carrierInspection,
    inspectedText: carrierInspection === "text" && blob ? blob.toString("utf8") : null,
    byteLength: blob?.length ?? -1,
  };
}

function versionForFamily(familyKey: string, masterId: string): string {
  const prefix = `${familyKey}@`;
  if (!masterId.startsWith(prefix)) return "";
  const version = masterId.slice(prefix.length);
  return canonicalMasterIdentity(familyKey, version) === masterId ? version : "";
}

function citationGateContext(
  familyKey: string,
  compatibilityMasterId: string,
  contentPosture: string,
  knownMasterIds: readonly string[],
  deltaFamilyKeys: readonly string[],
  facts: Phase2CitationFacts,
): Phase2CandidateGateContext {
  const inspection = PHASE2_UNREVIEWED_EVIDENCE_INSPECTIONS.find(
    (item) => item.compatibilityMasterId === compatibilityMasterId,
  );
  return {
    knownMasterIds,
    contentPosture,
    inspectionCategory: inspection?.reasonCategory ?? null,
    deltaFamilyKeys,
    collisionFamilyKeys: unresolvedCollisionFamilyKeys(),
    facts,
    carrierTerms: recordedDeltaCarrierTerms(),
    canonicalFamilyKey: familyKey,
    canonicalVersion: versionForFamily(familyKey, compatibilityMasterId),
  };
}

type IndexedRegister<T> = {
  unreadable: boolean;
  invalidCounts: Map<string, number>;
  valid: Map<string, T[]>;
};

function indexRegisterEntries<T>(
  entries: readonly unknown[],
  allowed: readonly string[],
  knownCanonicalIds: readonly string[],
  freeze: (values: Record<string, string>) => T,
): IndexedRegister<T> {
  const invalidCounts = new Map<string, number>();
  const valid = new Map<string, T[]>();
  let unreadable = false;
  for (const entry of entries) {
    const classified = classifyPhase2RegisterEntry(entry, allowed, knownCanonicalIds);
    if (classified.status === "unreadable") {
      unreadable = true;
      continue;
    }
    if (classified.status === "invalid") {
      invalidCounts.set(classified.masterId, (invalidCounts.get(classified.masterId) ?? 0) + 1);
      if (classified.blocksRegister) unreadable = true;
      continue;
    }
    const snapshot = freeze(classified.values);
    const list = valid.get(classified.masterId) ?? [];
    list.push(snapshot);
    valid.set(classified.masterId, list);
  }
  return { unreadable, invalidCounts, valid };
}

function soleSnapshot<T>(index: IndexedRegister<T>, masterId: string): T | undefined {
  if (index.unreadable || (index.invalidCounts.get(masterId) ?? 0) > 0) return undefined;
  const matches = index.valid.get(masterId) ?? [];
  return matches.length === 1 ? matches[0] : undefined;
}

function reportRegisterIndex(
  issues: Phase2QualificationIssue[],
  index: IndexedRegister<unknown>,
  malformedCode: Phase2QualificationIssueCode,
  duplicateCode: Phase2QualificationIssueCode,
): void {
  if (index.unreadable) push(issues, malformedCode, "(unreadable)");
  const masterIds = new Set<string>([...index.invalidCounts.keys(), ...index.valid.keys()]);
  for (const masterId of masterIds) {
    const invalid = index.invalidCounts.get(masterId) ?? 0;
    const validCount = index.valid.get(masterId)?.length ?? 0;
    if (invalid > 0) push(issues, malformedCode, masterId);
    if (invalid + validCount > 1) push(issues, duplicateCode, masterId);
  }
}

export function buildCompatibilityQualifications(
  classifications: readonly Phase2RosterClassification[],
  legacyCitations: readonly Phase2CandidateSourceCitation[] = PHASE2_CANDIDATE_SOURCE_CITATIONS,
  citations: readonly unknown[] = PHASE2_CANDIDATE_CITATIONS,
): Phase2CompatibilityQualification[] {
  const citedByFamily = new Map<string, string>();
  for (const citation of legacyCitations) {
    if (citedByFamily.has(citation.familyKey)) {
      throw new Error(`duplicate candidate citation for ${citation.familyKey}`);
    }
    if (citation.sourceRef.trim() === "") {
      throw new Error(`blank candidate source for ${citation.familyKey}`);
    }
    citedByFamily.set(citation.familyKey, citation.sourceRef);
  }
  const knownCanonicalIds = classifications.map((item) => item.compatibilityMasterId);
  const citationIndex = indexRegisterEntries(citations, PHASE2_CANDIDATE_CITATION_FIELDS, knownCanonicalIds, (values) =>
    Object.freeze({ ...values }) as Phase2CandidateCitation,
  );

  return classifications.map((classification) => {
    const blocking = BLOCKING_POSTURES.has(classification.contentPosture);
    const citation = soleSnapshot(citationIndex, classification.compatibilityMasterId);
    let promoted = false;
    if (!blocking && citation) {
      const gateIssues = evaluatePhase2CandidateCitation(
        citation,
        citationGateContext(
          classification.familyKey,
          classification.compatibilityMasterId,
          classification.contentPosture,
          classifications.map((item) => item.compatibilityMasterId),
          PHASE2_DELTA_QUALIFICATION_FAMILY_KEYS,
          collectPhase2CitationFacts(citation),
        ),
      );
      promoted = gateIssues.length === 0;
    }
    const result: Phase2QualificationResult = blocking ? "BLOCKED" : promoted ? "CANDIDATE" : "UNREVIEWED";
    return {
      compatibilityMasterId: classification.compatibilityMasterId,
      familyKey: classification.familyKey,
      result,
      contentPosture: classification.contentPosture,
      sourceRef: result === "CANDIDATE" ? (citation?.sourcePath ?? null) : null,
      note: qualificationNote(classification.familyKey, classification.contentPosture, result),
    };
  });
}

export const PHASE2_COMPATIBILITY_QUALIFICATIONS: readonly Phase2CompatibilityQualification[] =
  buildCompatibilityQualifications(PHASE2_ROSTER_CLASSIFICATIONS);

export const PHASE2_DELTA_FAMILY_QUALIFICATIONS: readonly Phase2DeltaFamilyQualification[] =
  PHASE2_DELTA_QUALIFICATION_FAMILY_KEYS.map((familyKey) => ({
    compatibilityMasterId: null,
    familyKey,
    result: "BLOCKED" as const,
    sourceRef: null,
    note: `${familyKey} is a carrier-originated Delta family with no compatibility master. Qualification is BLOCKED. This row does not create a master, assign a local code, or resolve the global family-key question.`,
  }));

export type Phase2QualificationRegisterInput = {
  classifications: readonly {
    familyKey: string;
    compatibilityMasterId: string;
    genuineBofMaster: boolean;
    contentPosture: string;
  }[];
  compatibilityRows: readonly {
    compatibilityMasterId: string;
    familyKey: string;
    result: string;
    contentPosture: string;
    sourceRef: string | null;
  }[];
  deltaRows: readonly {
    compatibilityMasterId: string | null;
    familyKey: string;
    result: string;
    sourceRef: string | null;
  }[];
  deltaFamilyKeys: readonly string[];
  sourceExists: (sourceRef: string) => boolean;
  masters: readonly { familyKey: string; masterId: string; approvalStatus: string }[];
  instanceFamilyKeys: readonly string[];
  adoptedFamilyKeys: readonly string[];
  effectiveFamilyKeys: readonly string[];
  recordCount: number;
  /** When set, record rules are scoped to each record's family. recordCount is then ignored. */
  records?: readonly { familyKey: string }[];
  candidateCitations?: readonly unknown[];
  masterReviewReleases?: readonly unknown[];
};

function push(
  issues: Phase2QualificationIssue[],
  code: Phase2QualificationIssueCode,
  subject: string,
): void {
  issues.push({ code, subject });
}

export function validatePhase2QualificationRegister(
  input: Phase2QualificationRegisterInput,
): Phase2QualificationIssue[] {
  const issues: Phase2QualificationIssue[] = [];
  const Q = PHASE2_QUALIFICATION_ISSUE_CODES;
  const deltaKeys = new Set(input.deltaFamilyKeys);

  const classificationsById = new Map<string, (typeof input.classifications)[number]>();
  for (const classification of input.classifications) {
    if (classification.genuineBofMaster !== false) {
      push(issues, Q.genuineBofMaster, classification.compatibilityMasterId);
    }
    if (classificationsById.has(classification.compatibilityMasterId)) {
      push(issues, Q.duplicateRow, classification.compatibilityMasterId);
    }
    classificationsById.set(classification.compatibilityMasterId, classification);
  }

  const rowsById = new Map<string, (typeof input.compatibilityRows)[number][]>();
  for (const row of input.compatibilityRows) {
    const list = rowsById.get(row.compatibilityMasterId) ?? [];
    list.push(row);
    rowsById.set(row.compatibilityMasterId, list);
  }

  for (const [masterId, classification] of classificationsById) {
    const rows = rowsById.get(masterId) ?? [];
    if (rows.length === 0) {
      push(issues, Q.missingRow, masterId);
      continue;
    }
    if (rows.length > 1) push(issues, Q.duplicateRow, masterId);
    const row = rows[0];
    if (
      row.familyKey !== classification.familyKey ||
      row.contentPosture !== classification.contentPosture
    ) {
      push(issues, Q.identityMismatch, masterId);
    }
    if (deltaKeys.has(row.familyKey)) {
      push(issues, Q.deltaOnCompatibilityRegister, row.familyKey);
    }
  }

  for (const masterId of rowsById.keys()) {
    if (!classificationsById.has(masterId)) push(issues, Q.unknownRow, masterId);
  }

  const mastersById = new Map(input.masters.map((master) => [master.masterId, master]));
  const registeredFamilies = new Set(input.classifications.map((row) => row.familyKey));
  const releasedFamilies = new Set(
    input.compatibilityRows
      .filter((row) => row.result === "RELEASED_TO_MASTER_REVIEW")
      .map((row) => row.familyKey),
  );
  for (const master of input.masters) {
    if (master.approvalStatus !== "APPROVED") continue;
    const registered = registeredFamilies.has(master.familyKey);
    const released = releasedFamilies.has(master.familyKey);
    const delta = deltaKeys.has(master.familyKey);
    if ((registered && !released) || delta) push(issues, Q.masterApproved, master.masterId);
  }

  const instanceFamilies = new Set(input.instanceFamilyKeys);
  const adoptedFamilies = new Set(input.adoptedFamilyKeys);
  const effectiveFamilies = new Set(input.effectiveFamilyKeys);
  const knownCanonicalIds = input.classifications.map((row) => row.compatibilityMasterId);
  const citationIndex = indexRegisterEntries(
    input.candidateCitations ?? [],
    PHASE2_CANDIDATE_CITATION_FIELDS,
    knownCanonicalIds,
    (values) => Object.freeze({ ...values }) as Phase2CandidateCitation,
  );
  const releaseIndex = indexRegisterEntries(
    input.masterReviewReleases ?? [],
    PHASE2_MASTER_REVIEW_RELEASE_FIELDS,
    knownCanonicalIds,
    (values) => Object.freeze({ ...values }) as Phase2MasterReviewRelease,
  );
  reportRegisterIndex(issues, citationIndex, Q.citationMalformed, Q.citationDuplicate);
  reportRegisterIndex(issues, releaseIndex, Q.releaseMalformed, Q.releaseDuplicate);
  let candidateCount = 0;

  function citationForRow(masterId: string): Phase2CandidateCitation | undefined {
    return soleSnapshot(citationIndex, masterId);
  }

  function releaseForRow(masterId: string): Phase2MasterReviewRelease | undefined {
    return soleSnapshot(releaseIndex, masterId);
  }

  for (const row of input.compatibilityRows) {
    const master = mastersById.get(row.compatibilityMasterId);
    if (!master || master.familyKey !== row.familyKey) {
      push(issues, Q.identityMismatch, row.compatibilityMasterId);
    }
    if (deltaKeys.has(row.familyKey)) {
      push(issues, Q.candidateOnDelta, row.familyKey);
    }

    if (row.result === "CANDIDATE" || row.result === "RELEASED_TO_MASTER_REVIEW") {
      if (versionForFamily(row.familyKey, row.compatibilityMasterId) === "") {
        push(issues, Q.identityInvalid, row.compatibilityMasterId);
      }
      if (holdsForFamily(row.familyKey).length > 0) {
        push(issues, Q.candidateHeld, row.compatibilityMasterId);
      }
    }

    if (BLOCKING_POSTURES.has(row.contentPosture)) {
      if (row.result !== "BLOCKED" || row.sourceRef !== null) {
        push(issues, Q.blockedRequired, row.compatibilityMasterId);
      }
      if (row.result === "CANDIDATE") {
        push(issues, Q.candidateOnBlocked, row.compatibilityMasterId);
      }
      continue;
    }

    if (row.contentPosture !== "UNCLASSIFIED") {
      push(issues, Q.resultUnexpected, row.compatibilityMasterId);
      continue;
    }

    if (row.result === "RELEASED_TO_MASTER_REVIEW") {
      const citation = citationForRow(row.compatibilityMasterId);
      const release = releaseForRow(row.compatibilityMasterId);
      const citationIssues = citation
        ? evaluatePhase2CandidateCitation(
            citation,
            citationGateContext(
              row.familyKey,
              row.compatibilityMasterId,
              row.contentPosture,
              input.classifications.map((item) => item.compatibilityMasterId),
              input.deltaFamilyKeys,
              collectPhase2CitationFacts(citation),
            ),
          )
        : [{ code: "missing" }];
      if (!citation || citationIssues.length > 0) push(issues, Q.releaseCitationMissing, row.compatibilityMasterId);
      if (citation && row.sourceRef !== citation.sourcePath) {
        push(issues, Q.sourceRefMismatch, row.compatibilityMasterId);
      }
      const releaseIssues = release ? evaluatePhase2MasterReviewRelease(release, citationIssues.length === 0) : [];
      if (!release || releaseIssues.length > 0) push(issues, Q.releaseMissing, row.compatibilityMasterId);
      if (instanceFamilies.has(row.familyKey)) push(issues, Q.candidateInstance, row.familyKey);
      if (adoptedFamilies.has(row.familyKey)) push(issues, Q.candidateAdoption, row.familyKey);
      if (effectiveFamilies.has(row.familyKey)) push(issues, Q.candidateEffective, row.familyKey);
      continue;
    }

    if (row.result === "UNREVIEWED") {
      if (row.sourceRef !== null) push(issues, Q.unreviewedSource, row.compatibilityMasterId);
      continue;
    }

    if (row.result !== "CANDIDATE") {
      push(issues, Q.resultUnexpected, row.compatibilityMasterId);
      continue;
    }

    candidateCount += 1;
    const sourceRef = row.sourceRef;
    if (sourceRef == null || sourceRef.trim() === "") {
      push(issues, Q.candidateSourceMissing, row.compatibilityMasterId);
    } else if (!input.sourceExists(sourceRef)) {
      push(issues, Q.candidateSourceAbsent, row.compatibilityMasterId);
    }
    const citation = citationForRow(row.compatibilityMasterId);
    const gateIssues = citation
      ? evaluatePhase2CandidateCitation(
          citation,
          citationGateContext(
            row.familyKey,
            row.compatibilityMasterId,
            row.contentPosture,
            input.classifications.map((item) => item.compatibilityMasterId),
            input.deltaFamilyKeys,
            collectPhase2CitationFacts(citation),
          ),
        )
      : [{ code: "missing" }];
    if (!citation || gateIssues.length > 0) push(issues, Q.candidateGate, row.compatibilityMasterId);
    if (citation && sourceRef !== citation.sourcePath) {
      push(issues, Q.sourceRefMismatch, row.compatibilityMasterId);
    }
    if (master?.approvalStatus === "APPROVED") {
      push(issues, Q.candidateApproved, row.compatibilityMasterId);
    }
    if (instanceFamilies.has(row.familyKey)) {
      push(issues, Q.candidateInstance, row.familyKey);
    }
    if (adoptedFamilies.has(row.familyKey)) {
      push(issues, Q.candidateAdoption, row.familyKey);
    }
    if (effectiveFamilies.has(row.familyKey)) {
      push(issues, Q.candidateEffective, row.familyKey);
    }
  }

  if (input.records) {
    const candidateFamilies = new Set(
      input.compatibilityRows.filter((row) => row.result === "CANDIDATE").map((row) => row.familyKey),
    );
    for (const record of input.records) {
      const registered = registeredFamilies.has(record.familyKey);
      const released = releasedFamilies.has(record.familyKey);
      const delta = deltaKeys.has(record.familyKey);
      if ((registered && !released) || delta) push(issues, Q.recordPresent, record.familyKey);
      if (candidateFamilies.has(record.familyKey)) push(issues, Q.candidateRecord, record.familyKey);
    }
  } else {
    if (input.recordCount !== 0) push(issues, Q.recordPresent, `records=${input.recordCount}`);
    if (candidateCount > 0 && input.recordCount !== 0) {
      push(issues, Q.candidateRecord, `records=${input.recordCount}`);
    }
  }

  const deltaRowsByKey = new Map<string, (typeof input.deltaRows)[number][]>();
  for (const row of input.deltaRows) {
    const list = deltaRowsByKey.get(row.familyKey) ?? [];
    list.push(row);
    deltaRowsByKey.set(row.familyKey, list);
  }

  for (const familyKey of input.deltaFamilyKeys) {
    const rows = deltaRowsByKey.get(familyKey) ?? [];
    if (rows.length === 0) {
      push(issues, Q.deltaMissing, familyKey);
      continue;
    }
    if (rows.length > 1) push(issues, Q.deltaDuplicate, familyKey);
    const row = rows[0];
    if (row.compatibilityMasterId !== null) push(issues, Q.deltaMasterId, familyKey);
    if (row.result !== "BLOCKED" || row.sourceRef !== null) {
      push(issues, Q.deltaNotBlocked, familyKey);
    }
    if (row.result === "CANDIDATE") push(issues, Q.candidateOnDelta, familyKey);
  }

  for (const familyKey of deltaRowsByKey.keys()) {
    if (!deltaKeys.has(familyKey)) push(issues, Q.deltaExtra, familyKey);
  }

  return issues;
}

const INSPECTION_REASONS = new Set<string>(PHASE2_UNREVIEWED_INSPECTION_REASONS);

/**
 * One inspection per UNREVIEWED compatibility master. The result is unchanged.
 * Artifact strings are the existing roster href, or the roster file that holds
 * the note when that record has no href. None of these is a CANDIDATE citation.
 */
export const PHASE2_UNREVIEWED_EVIDENCE_INSPECTIONS: readonly Phase2UnreviewedEvidenceInspection[] = [
  {
    compatibilityMasterId: "BOF-SAF-SOP-002@3.1",
    result: "UNREVIEWED",
    artifactsExamined: ["/generated/company-operations-vault/DAT_SOP_CLM_001_Rev3_1.pdf"],
    reasonCategory: "carrier-identified file",
    reason: "Roster note: Preserve DAT_SOP_CLM_001 filename. Code is an overlay alias; do not rename the PDF.",
  },
  {
    compatibilityMasterId: "BOF-ONB-CHK-001@1.1",
    result: "UNREVIEWED",
    artifactsExamined: [
      "/generated/company-operations-vault/hr-templates/new-driver-onboarding-checklist.html",
      "lib/document-control/registry.ts",
    ],
    reasonCategory: "carrier-identified file",
    reason: "The examined href file is titled \"Delta Advanced Trucking, Inc. New Driver Onboarding Checklist\" and carries Document ID DAT_HR_ONBOARD_001. Registry note (verbatim): \"Separated recruitment/onboarding from qualification/readiness. I-9/W-9 remain structured/government forms.\"",
  },
  {
    compatibilityMasterId: "BOF-HR-ACK-001@1.1",
    result: "UNREVIEWED",
    artifactsExamined: [
      "/generated/company-operations-vault/hr-templates/driver-policy-acknowledgment-form.html",
      "lib/document-control/registry.ts",
    ],
    reasonCategory: "carrier-identified file",
    reason: "The examined href file is titled \"Delta Advanced Trucking, Inc. Driver Policy Acknowledgment Form\" and carries Document ID DAT_HR_POLICY_ACK_001. Registry note (verbatim): \"Must cite BOF-SAF-POL-001 and other vault codes, not generic 'Safety Form'.\"",
  },
  {
    compatibilityMasterId: "BOF-DRV-REC-001@1.0",
    result: "UNREVIEWED",
    artifactsExamined: ["/generated/templates/driver-docs/cdl-template.html"],
    reasonCategory: "government or third-party form",
    reason: "Roster note: Template is a capture aid, not a substitute for the CDL itself.",
  },
  {
    compatibilityMasterId: "BOF-DRV-REC-002@1.0",
    result: "UNREVIEWED",
    artifactsExamined: ["/generated/templates/driver-docs/medical-card-template.html"],
    reasonCategory: "government or third-party form",
    reason: "Roster note: MCSA-5876 is a government form. Do not replace with a BOF lookalike as if it were the official certificate.",
  },
  {
    compatibilityMasterId: "BOF-DRV-REC-003@1.0",
    result: "UNREVIEWED",
    artifactsExamined: ["/generated/templates/driver-docs/mvr-template.html"],
    reasonCategory: "government or third-party form",
    reason: "Roster note: MVR content is issued by the State. BOF stores review outcome.",
  },
  {
    compatibilityMasterId: "BOF-DRV-REC-004@1.0",
    result: "UNREVIEWED",
    artifactsExamined: ["/generated/templates/driver-docs/fmcsa-compliance-template.html"],
    reasonCategory: "government or third-party form",
    reason: "Roster note: Do not invent Clearinghouse results. Structured query status in BOF is preferred over a duplicate Word form.",
  },
  {
    compatibilityMasterId: "BOF-HR-FORM-009@official",
    result: "UNREVIEWED",
    artifactsExamined: ["/generated/templates/driver-docs/i9-template.html"],
    reasonCategory: "government or third-party form",
    reason: "Roster note: Official USCIS form. BOF template is a demo placeholder and must not be treated as the current official I-9.",
  },
  {
    compatibilityMasterId: "BOF-FIN-FORM-009@official",
    result: "UNREVIEWED",
    artifactsExamined: ["/generated/templates/driver-docs/w9-template.html"],
    reasonCategory: "government or third-party form",
    reason: "Roster note: Official IRS form. Do not replace with a BOF-branded substitute.",
  },
  {
    compatibilityMasterId: "BOF-OPS-EVD-001@1.0",
    result: "UNREVIEWED",
    artifactsExamined: ["lib/document-control/registry.ts"],
    reasonCategory: "operational evidence rather than a master body",
    reason: "Roster note: DOCUMENT → keep as generated evidence. Do not duplicate as a blank Word form.",
  },
  {
    compatibilityMasterId: "BOF-OPS-EVD-002@1.0",
    result: "UNREVIEWED",
    artifactsExamined: ["lib/document-control/registry.ts"],
    reasonCategory: "operational evidence rather than a master body",
    reason: "Roster note: Structured load record remains authoritative; BOL is evidence.",
  },
  {
    compatibilityMasterId: "BOF-SEC-EVD-001@existing",
    result: "UNREVIEWED",
    artifactsExamined: ["lib/document-control/registry.ts"],
    reasonCategory: "operational evidence rather than a master body",
    reason: "Roster note: Do not create a parallel Secure Pickup form pack. Evidence belongs to the existing workflow.",
  },
  {
    compatibilityMasterId: "BOF-CUS-AGR-001@1.0",
    result: "UNREVIEWED",
    artifactsExamined: ["/generated/agreements/DAT-MSA-001/delta-advanced-trucking-master-services-agreement.pdf"],
    reasonCategory: "carrier-identified file",
    reason: "Roster note: Preserve DAT-MSA-001 identifier. Inspection assessment: The examined href is the Delta agreement PDF.",
  },
  {
    compatibilityMasterId: "BOF-SAF-POL-002@0.1",
    result: "UNREVIEWED",
    artifactsExamined: ["/generated/company-operations-vault/11-drug-alcohol-testing-policy.html"],
    reasonCategory: "generated compatibility projection",
    reason: "Registry note (verbatim): \"Does not overwrite 11-information-security-governance-policy.html. Random rates omitted until current FMCSA notice is confirmed.\" Inspection assessment: the examined file is the roster href; it was introduced in commit 5a6fccbd and no script under scripts/ references it.",
  },
  {
    compatibilityMasterId: "BOF-DRV-FORM-001@1.0",
    result: "UNREVIEWED",
    artifactsExamined: ["lib/document-control/phase2-roster.ts"],
    reasonCategory: "superseded historical alias",
    reason: "Roster note: SUPERSEDED by BOF-DRV-002. Historical code retained for audit.",
  },
  {
    compatibilityMasterId: "BOF-DRV-FORM-002@1.0",
    result: "UNREVIEWED",
    artifactsExamined: ["/generated/company-operations-vault/bof-drv-form-002-new-hire-hos-statement.html"],
    reasonCategory: "generated compatibility projection",
    reason: "Roster note (verbatim): \"Cites 395.8 first-use statement. Not an ELD and not a hours calculator. Exceptions flagged.\" Inspection assessment: the examined file is the roster href; it was introduced in commit 5a6fccbd and no script under scripts/ references it.",
  },
  {
    compatibilityMasterId: "BOF-DRV-FORM-003@1.0",
    result: "UNREVIEWED",
    artifactsExamined: [
      "/generated/drivers/DRV-001/driver-application.html",
      "lib/operations-file-cabinet.ts",
      "lib/document-control/phase2-roster.ts",
    ],
    reasonCategory: "demo or sample",
    reason: "File Cabinet entry driver-application (this record's stableAppId) is in section \"Completed Demo Samples\" with isCompletedSample: true. Its href file is completed with the John Carter sample applicant. Roster note (verbatim): \"Preserve existing application identity. Content upgrade deferred (Tier 3).\"",
  },
  {
    compatibilityMasterId: "BOF-EQP-FORM-001@1.0",
    result: "UNREVIEWED",
    artifactsExamined: ["lib/document-control/phase2-roster.ts"],
    reasonCategory: "superseded historical alias",
    reason: "Roster note: SUPERSEDED by BOF-VEH-001. Historical code retained for audit.",
  },
  {
    compatibilityMasterId: "BOF-SAF-FORM-004@1.0",
    result: "UNREVIEWED",
    artifactsExamined: ["lib/document-control/phase2-roster.ts"],
    reasonCategory: "superseded historical alias",
    reason: "Roster note: SUPERSEDED by BOF-DRV-003. Historical code retained for audit.",
  },
  {
    compatibilityMasterId: "BOF-DRV-REC-005@1.0",
    result: "UNREVIEWED",
    artifactsExamined: ["lib/document-control/phase2-roster.ts"],
    reasonCategory: "demo or sample",
    reason: "Roster note: John Carter copy is a DEMO sample, not LIVE evidence.",
  },
  {
    compatibilityMasterId: "BOF-DRV-REC-006@1.0",
    result: "UNREVIEWED",
    artifactsExamined: ["lib/document-control/phase2-roster.ts"],
    reasonCategory: "demo or sample",
    reason: "Roster note: Do not duplicate settlement math. Sample is DEMO.",
  },
  {
    compatibilityMasterId: "BOF-DRV-REC-007@1.0",
    result: "UNREVIEWED",
    artifactsExamined: ["lib/document-control/phase2-roster.ts"],
    reasonCategory: "demo or sample",
    reason: "Roster note: Sample is DEMO.",
  },
  {
    compatibilityMasterId: "BOF-DRV-REC-008@1.0",
    result: "UNREVIEWED",
    artifactsExamined: ["lib/document-control/phase2-roster.ts"],
    reasonCategory: "demo or sample",
    reason: "Roster note: Sample is DEMO.",
  },
  {
    compatibilityMasterId: "BOF-DRV-REC-009@1.0",
    result: "UNREVIEWED",
    artifactsExamined: ["lib/document-control/phase2-roster.ts"],
    reasonCategory: "demo or sample",
    reason: "Roster note: Incident history sample is DEMO.",
  },
  {
    compatibilityMasterId: "BOF-OPS-FORM-001@1.0",
    result: "UNREVIEWED",
    artifactsExamined: ["lib/document-control/phase2-roster.ts"],
    reasonCategory: "superseded historical alias",
    reason: "Roster note: SUPERSEDED by BOF-OPS-001. Historical code retained for audit.",
  },
  {
    compatibilityMasterId: "BOF-OPS-EVD-004@1.0",
    result: "UNREVIEWED",
    artifactsExamined: ["lib/document-control/phase2-roster.ts"],
    reasonCategory: "demo or sample",
    reason: "Roster note: DEMO / generated samples. Not LIVE operational evidence.",
  },
  {
    compatibilityMasterId: "BOF-SAF-FORM-005@1.0",
    result: "UNREVIEWED",
    artifactsExamined: ["lib/document-control/phase2-roster.ts"],
    reasonCategory: "demo or sample",
    reason: "Roster note: L003 files are DEMO samples.",
  },
  {
    compatibilityMasterId: "BOF-CUS-AGR-002@1.0",
    result: "UNREVIEWED",
    artifactsExamined: ["lib/document-control/phase2-roster.ts"],
    reasonCategory: "generated compatibility projection",
    reason: "Roster note: Tier 2/legal upgrade deferred. Preserve IDs and hrefs. Inspection assessment: No recovered carrier-neutral body is identified.",
  },
  {
    compatibilityMasterId: "BOF-HR-FORM-001@1.0",
    result: "UNREVIEWED",
    artifactsExamined: ["lib/document-control/phase2-roster.ts"],
    reasonCategory: "demo or sample",
    reason: "Roster note: Named-employee files are DEMO samples, not LIVE HR evidence.",
  },
  {
    compatibilityMasterId: "BOF-SAF-TPL-001@1.0",
    result: "UNREVIEWED",
    artifactsExamined: ["lib/document-control/phase2-roster.ts"],
    reasonCategory: "generated compatibility projection",
    reason: "Roster note: Do not fabricate certificates. Inspection assessment: No recovered carrier-neutral certificate body is identified.",
  },
  {
    compatibilityMasterId: "BOF-GOV-REF-001@1.0",
    result: "UNREVIEWED",
    artifactsExamined: ["lib/document-control/phase2-roster.ts"],
    reasonCategory: "external reference",
    reason: "Roster note: External links. Official eCFR / FMCSA sites control.",
  },
  {
    compatibilityMasterId: "BOF-FIN-EVD-001@1.0",
    result: "UNREVIEWED",
    artifactsExamined: ["lib/document-control/phase2-roster.ts"],
    reasonCategory: "demo or sample",
    reason: "Roster note: DEMO sample.",
  },
  {
    compatibilityMasterId: "BOF-DRV-002@1.0",
    result: "UNREVIEWED",
    artifactsExamined: ["/generated/company-operations-vault/bof-drv-form-001-annual-driving-record-review.html"],
    reasonCategory: "generated compatibility projection",
    reason: "Roster note (verbatim excerpts): \"Blank form recovered from commit 5a6fccbd.\" and \"Design QA complete; formal document-control/legal review still required.\" Inspection assessment: the examined file is the roster href, a blank form whose header code block lists BOF-DRV-002, Version 1.0, and INTERNAL REVIEW; it was introduced in commit 5a6fccbd and no script under scripts/ references it. It is not a separately recovered pre-existing carrier-neutral master source, so it is not cited as a candidate source in Phase 2C.",
  },
  {
    compatibilityMasterId: "BOF-VEH-001@1.0",
    result: "UNREVIEWED",
    artifactsExamined: ["/generated/company-operations-vault/bof-eqp-form-001-periodic-vehicle-inspection.html"],
    reasonCategory: "generated compatibility projection",
    reason: "Roster note (verbatim excerpts): \"Blank form recovered from commit 5a6fccbd.\" and \"Design QA complete; formal document-control/legal review still required.\" Inspection assessment: the examined file is the roster href, a blank form whose header code block lists BOF-VEH-001, Version 1.0, and INTERNAL REVIEW; it was introduced in commit 5a6fccbd and no script under scripts/ references it. It is not a separately recovered pre-existing carrier-neutral master source, so it is not cited as a candidate source in Phase 2C.",
  },
];

export const PHASE2_INSPECTION_ISSUE_CODES = {
  missing: "inspection.missing",
  duplicate: "inspection.duplicate",
  unknown: "inspection.unknown",
  result: "inspection.result",
  onBlocked: "inspection.onBlocked",
  onDelta: "inspection.onDelta",
  artifact: "inspection.artifact",
  reason: "inspection.reason",
  approvalEvidence: "inspection.approvalEvidence",
  adoptionEvidence: "inspection.adoptionEvidence",
} as const;

export type Phase2InspectionIssueCode =
  (typeof PHASE2_INSPECTION_ISSUE_CODES)[keyof typeof PHASE2_INSPECTION_ISSUE_CODES];

export type Phase2InspectionIssue = {
  code: Phase2InspectionIssueCode;
  subject: string;
};

export type Phase2UnreviewedInspectionInput = {
  compatibilityMasterId: string;
  result: string;
  artifactsExamined: readonly string[];
  reasonCategory: string;
  reason: string;
  approvalEvidenceRef?: string | null;
  adoptionEvidenceRef?: string | null;
};

function pushInspection(
  issues: Phase2InspectionIssue[],
  code: Phase2InspectionIssueCode,
  subject: string,
): void {
  issues.push({ code, subject });
}

export function validatePhase2UnreviewedInspections(input: {
  inspections: readonly Phase2UnreviewedInspectionInput[];
  unreviewedMasterIds: readonly string[];
  blockedMasterIds: readonly string[];
  deltaFamilyKeys: readonly string[];
}): Phase2InspectionIssue[] {
  const issues: Phase2InspectionIssue[] = [];
  const I = PHASE2_INSPECTION_ISSUE_CODES;
  const unreviewed = new Set(input.unreviewedMasterIds);
  const blocked = new Set(input.blockedMasterIds);
  const byId = new Map<string, Phase2UnreviewedInspectionInput[]>();

  for (const inspection of input.inspections) {
    const list = byId.get(inspection.compatibilityMasterId) ?? [];
    list.push(inspection);
    byId.set(inspection.compatibilityMasterId, list);
  }

  for (const masterId of unreviewed) {
    const rows = byId.get(masterId) ?? [];
    if (rows.length === 0) pushInspection(issues, I.missing, masterId);
    if (rows.length > 1) pushInspection(issues, I.duplicate, masterId);
  }

  for (const [masterId, rows] of byId) {
    if (rows.length > 1 && !unreviewed.has(masterId)) {
      pushInspection(issues, I.duplicate, masterId);
    }
    if (!unreviewed.has(masterId)) pushInspection(issues, I.unknown, masterId);
    if (blocked.has(masterId)) pushInspection(issues, I.onBlocked, masterId);
    if (input.deltaFamilyKeys.some((key) => masterId === key || masterId.startsWith(`${key}@`))) {
      pushInspection(issues, I.onDelta, masterId);
    }
    for (const inspection of rows) {
      if (inspection.result !== "UNREVIEWED") pushInspection(issues, I.result, masterId);
      if (
        inspection.artifactsExamined.length === 0 ||
        inspection.artifactsExamined.some((artifact) => artifact.trim() === "")
      ) {
        pushInspection(issues, I.artifact, masterId);
      }
      if (!INSPECTION_REASONS.has(inspection.reasonCategory) || inspection.reason.trim() === "") {
        pushInspection(issues, I.reason, masterId);
      }
      if (inspection.approvalEvidenceRef != null && inspection.approvalEvidenceRef.trim() !== "") {
        pushInspection(issues, I.approvalEvidence, masterId);
      }
      if (inspection.adoptionEvidenceRef != null && inspection.adoptionEvidenceRef.trim() !== "") {
        pushInspection(issues, I.adoptionEvidence, masterId);
      }
    }
  }

  return issues;
}
