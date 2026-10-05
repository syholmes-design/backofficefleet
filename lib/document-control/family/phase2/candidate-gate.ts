/**
 * Phase 2D candidate gate.
 *
 * The gate is a pure control function. It does not read the filesystem or Git.
 * The caller supplies source, provenance, and carrier-inspection facts.
 * UNREVIEWED becomes CANDIDATE only when every condition below passes.
 * A hold blocks promotion. It does not change the stored qualification result.
 */
import { types } from "node:util";
import { isGlobalBofCode } from "../ids";
import { PHASE2_UNREVIEWED_INSPECTION_REASONS } from "./types";

const STRICT_ISO_TIMESTAMP =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,9}))?(Z|[+-]\d{2}:\d{2})$/;

/** Full lowercase commit SHA. Symbolic refs, branches, tags, and abbreviations do not match. */
export const PHASE2_FULL_COMMIT_SHA = /^[0-9a-f]{40}$/;

/** Inspection categories that are not a recovered carrier-neutral master source. */
const CANDIDACY_BLOCKED_CATEGORIES = new Set<string>(PHASE2_UNREVIEWED_INSPECTION_REASONS);

export const PHASE2_CANDIDATE_CITATION_FIELDS = [
  "compatibilityMasterId",
  "sourcePath",
  "sourceSha1",
  "provenanceCommit",
  "decidedBy",
  "decidedAt",
  "neutralityDetermination",
  "neutralityBasis",
] as const;

export const PHASE2_NEUTRALITY_DETERMINATION = "CARRIER_NEUTRAL";

export type Phase2CandidateCitation = {
  compatibilityMasterId: string;
  sourcePath: string;
  sourceSha1: string;
  provenanceCommit: string;
  decidedBy: string;
  decidedAt: string;
  neutralityDetermination: string;
  neutralityBasis: string;
};

export const PHASE2_MASTER_REVIEW_RELEASE_FIELDS = [
  "compatibilityMasterId",
  "releasedBy",
  "releasedAt",
  "masterWorkScopeRef",
] as const;

export type Phase2MasterReviewRelease = {
  compatibilityMasterId: string;
  releasedBy: string;
  releasedAt: string;
  masterWorkScopeRef: string;
};

export const PHASE2_CANDIDACY_HOLD_CODES = [
  "IDENTITY_UNRESOLVED",
  "CATALOG_FAMILY",
  "SOURCE_BODY_MISSING",
] as const;

export type Phase2CandidacyHoldCode = (typeof PHASE2_CANDIDACY_HOLD_CODES)[number];

/** Holds block promotion. They do not change BLOCKED, UNREVIEWED, or CANDIDATE. */
export const PHASE2_CANDIDACY_HOLDS: readonly {
  compatibilityMasterId: string;
  holds: readonly Phase2CandidacyHoldCode[];
}[] = [
  { compatibilityMasterId: "BOF-DRV-002@1.0", holds: ["IDENTITY_UNRESOLVED"] },
  { compatibilityMasterId: "BOF-VEH-001@1.0", holds: ["IDENTITY_UNRESOLVED"] },
  { compatibilityMasterId: "BOF-CUS-AGR-002@1.0", holds: ["CATALOG_FAMILY", "SOURCE_BODY_MISSING"] },
  { compatibilityMasterId: "BOF-SAF-TPL-001@1.0", holds: ["CATALOG_FAMILY", "SOURCE_BODY_MISSING"] },
  { compatibilityMasterId: "BOF-DRV-FORM-001@1.0", holds: ["IDENTITY_UNRESOLVED"] },
  { compatibilityMasterId: "BOF-EQP-FORM-001@1.0", holds: ["IDENTITY_UNRESOLVED"] },
  { compatibilityMasterId: "BOF-SAF-FORM-004@1.0", holds: ["IDENTITY_UNRESOLVED"] },
];

/** Live Phase 2D registers. Both stay empty: no citation and no release is authorized. */
export const PHASE2_CANDIDATE_CITATIONS: readonly Phase2CandidateCitation[] = [];

export const PHASE2_MASTER_REVIEW_RELEASES: readonly Phase2MasterReviewRelease[] = [];

/**
 * Facts the caller resolved. The gate does not discover these.
 * carrierInspection "uninspectable" fails closed: unread bytes are not neutral.
 */
export type Phase2CitationFacts = {
  sourcePresent: boolean;
  provenanceIsCommit: boolean;
  provenanceIsAncestor: boolean;
  provenancePathPresent: boolean;
  provenanceBlobSha1: string | null;
  /** Path the collector inspected. Must equal the citation snapshot sourcePath. */
  sourcePath: string;
  carrierInspection: "text" | "uninspectable";
  inspectedText: string | null;
  /** Byte length of the source at the provenance commit. Zero is not carrier-neutral. -1 when the blob was not read. */
  byteLength: number;
};

/** Recorded carrier identifying facts supplied by the caller. Empty names fail closed. */
export type Phase2CarrierMatchTerms = {
  names: readonly string[];
  tokens: readonly string[];
  phones: readonly string[];
  datPrefix: boolean;
};

export const PHASE2_CANDIDATE_GATE_ISSUE_CODES = {
  citationFieldMissing: "candidate.citation.fieldMissing",
  citationFieldUnexpected: "candidate.citation.fieldUnexpected",
  sourceMissing: "candidate.source.missing",
  sourceEmpty: "candidate.source.empty",
  identityInvalid: "candidate.identity.invalid",
  notPlain: "candidate.citation.notPlain",
  releaseNotPlain: "candidate.release.notPlain",
  neutralityDetermination: "candidate.neutrality.determination",
  neutralityBasis: "candidate.neutrality.basis",
  pathMismatch: "candidate.source.pathMismatch",
  hashMismatch: "candidate.source.hashMismatch",
  provenanceInvalid: "candidate.provenance.invalid",
  provenancePathMissing: "candidate.provenance.pathMissing",
  masterUnknown: "candidate.master.unknown",
  versionMismatch: "candidate.version.mismatch",
  notNeutral: "candidate.carrier.notNeutral",
  uninspectable: "candidate.carrier.uninspectable",
  categoryBlocked: "candidate.category.blocked",
  notSingleDocument: "candidate.family.notSingleDocument",
  delta: "candidate.delta",
  hold: "candidate.hold",
  collision: "candidate.collision",
  decidedByBlank: "candidate.decidedBy.blank",
  timestampInvalid: "candidate.timestamp.invalid",
  duplicateCitation: "candidate.citation.duplicate",
  releaseFieldMissing: "candidate.release.fieldMissing",
  releaseFieldUnexpected: "candidate.release.fieldUnexpected",
  releaseInvalid: "candidate.release.invalid",
  releaseScopeMissing: "candidate.release.scopeMissing",
  releaseCitationMissing: "candidate.release.citationMissing",
} as const;

export type Phase2CandidateGateIssueCode =
  (typeof PHASE2_CANDIDATE_GATE_ISSUE_CODES)[keyof typeof PHASE2_CANDIDATE_GATE_ISSUE_CODES];

export type Phase2CandidateGateIssue = {
  code: Phase2CandidateGateIssueCode;
  subject: string;
};

export type Phase2CandidateGateContext = {
  /** compatibilityMasterId values that exist on the qualification register. */
  knownMasterIds: readonly string[];
  contentPosture: string;
  /** Null when the family has no Phase 2C inspection category. */
  inspectionCategory: string | null;
  deltaFamilyKeys: readonly string[];
  collisionFamilyKeys: readonly string[];
  facts: Phase2CitationFacts;
  carrierTerms: Phase2CarrierMatchTerms;
  /**
   * Canonical family and version from the qualification row.
   * The citation master id is not used to discover this family.
   */
  canonicalFamilyKey: string;
  canonicalVersion: string;
};

function daysInMonth(year: number, month: number): number {
  const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return days[month - 1] ?? 0;
}

export function isStrictIsoTimestamp(value: string): boolean {
  const match = STRICT_ISO_TIMESTAMP.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = Number(match[6]);
  if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return false;
  if (hour > 23 || minute > 59 || second > 59) return false;
  return true;
}

/**
 * True when nothing substantive remains. Whitespace still fails.
 * Unicode format characters are not treated as content. The value is not rewritten.
 */
export function substantiveTextBlank(value: string | null | undefined): boolean {
  if (value == null) return true;
  if (value.trim() === "") return true;
  return value.replace(/\p{Cf}/gu, "").trim() === "";
}

/** Roster version form already in use: major.minor, no padding and no suffix. */
const CANONICAL_VERSION = /^(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

/**
 * Canonical compatibility master id. Returns null unless familyKey and version
 * already match the roster identity rules. Does not trim, case-fold, or repair.
 */
export function canonicalMasterIdentity(familyKey: string, version: string): string | null {
  if (!isGlobalBofCode(familyKey) || !CANONICAL_VERSION.test(version)) return null;
  if (familyKey.includes("@") || version.includes("@")) return null;
  return `${familyKey}@${version}`;
}

function heldFamilyKey(compatibilityMasterId: string): string | null {
  const at = compatibilityMasterId.indexOf("@");
  if (at <= 0 || at !== compatibilityMasterId.lastIndexOf("@")) return null;
  const familyKey = compatibilityMasterId.slice(0, at);
  const version = compatibilityMasterId.slice(at + 1);
  if (canonicalMasterIdentity(familyKey, version) !== compatibilityMasterId) return null;
  return familyKey;
}

/** Holds are keyed by the canonical family. A malformed id is not a family. */
export function holdsForFamily(familyKey: string): readonly Phase2CandidacyHoldCode[] {
  if (!isGlobalBofCode(familyKey)) return [];
  return PHASE2_CANDIDACY_HOLDS.find((row) => heldFamilyKey(row.compatibilityMasterId) === familyKey)?.holds ?? [];
}

function push(
  issues: Phase2CandidateGateIssue[],
  code: Phase2CandidateGateIssueCode,
  subject: string,
): void {
  issues.push({ code, subject });
}

export function unexpectedOwnFields(value: object, allowed: readonly string[]): string[] {
  return Object.keys(value).filter((key) => !allowed.includes(key));
}

/** Case-sensitive admissible source extensions. Anything else is uninspectable. */
export function admissibleSourceExtension(sourcePath: string): boolean {
  const base = sourcePath.split(/[\\/]/).pop() ?? "";
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return false;
  const extension = base.slice(dot);
  return extension === ".txt" || extension === ".md";
}

type PlainFieldRead =
  | { kind: "notPlain" }
  | { kind: "fields"; unexpected: string[]; missing: string[]; values: Record<string, string> };

function readPlainFields(value: unknown, allowed: readonly string[]): PlainFieldRead {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return { kind: "notPlain" };
  if (types.isProxy(value)) return { kind: "notPlain" };
  if (Object.getPrototypeOf(value) !== Object.prototype) return { kind: "notPlain" };
  if (Object.getOwnPropertySymbols(value).length > 0) return { kind: "notPlain" };
  const names = Object.getOwnPropertyNames(value);
  for (const key of names) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (!descriptor || descriptor.get || descriptor.set || !descriptor.enumerable) return { kind: "notPlain" };
  }
  for (const key in value) {
    if (!Object.prototype.hasOwnProperty.call(value, key)) return { kind: "notPlain" };
  }
  const allow = new Set<string>(allowed);
  const unexpected = names.filter((key) => !allow.has(key));
  const values: Record<string, string> = {};
  const missing: string[] = [];
  for (const field of allowed) {
    const descriptor = Object.getOwnPropertyDescriptor(value, field);
    if (!descriptor || typeof descriptor.value !== "string") {
      missing.push(field);
      continue;
    }
    values[field] = descriptor.value;
  }
  return { kind: "fields", unexpected, missing, values };
}

/** One read of a plain citation. The result is frozen and does not alias the input. */
export function snapshotPhase2Citation(value: unknown): Phase2CandidateCitation | null {
  const read = readPlainFields(value, PHASE2_CANDIDATE_CITATION_FIELDS);
  if (read.kind !== "fields" || read.unexpected.length > 0 || read.missing.length > 0) return null;
  return Object.freeze({ ...read.values }) as Phase2CandidateCitation;
}

/** One read of a plain release. The result is frozen and does not alias the input. */
export function snapshotPhase2Release(value: unknown): Phase2MasterReviewRelease | null {
  const read = readPlainFields(value, PHASE2_MASTER_REVIEW_RELEASE_FIELDS);
  if (read.kind !== "fields" || read.unexpected.length > 0 || read.missing.length > 0) return null;
  return Object.freeze({ ...read.values }) as Phase2MasterReviewRelease;
}

export type Phase2RegisterClassification =
  | { status: "valid"; masterId: string; values: Record<string, string> }
  | { status: "invalid"; masterId: string; blocksRegister: boolean }
  | { status: "unreadable" };

/**
 * True only when the string is already familyKey@major.minor.
 * Spacing, case, version padding, and extra characters do not match.
 */
function exactCanonicalMasterId(value: string): boolean {
  const at = value.indexOf("@");
  if (at <= 0 || at !== value.lastIndexOf("@")) return false;
  return canonicalMasterIdentity(value.slice(0, at), value.slice(at + 1)) === value;
}

/**
 * A register entry is valid only when its master id is an exact canonical
 * identity. When known canonical ids are supplied, the value must be one of
 * them. Blank ids stay unreadable. A readable noncanonical or orphan id is
 * invalid, keeps its raw text, and blocks the register instead of being repaired.
 */
export function classifyPhase2RegisterEntry(
  value: unknown,
  allowed: readonly string[],
  knownCanonicalIds?: readonly string[],
): Phase2RegisterClassification {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return { status: "unreadable" };
  if (types.isProxy(value)) return { status: "unreadable" };
  const idDescriptor = Object.getOwnPropertyDescriptor(value, "compatibilityMasterId");
  const rawId = idDescriptor && !idDescriptor.get && !idDescriptor.set && typeof idDescriptor.value === "string" ? idDescriptor.value : null;
  const masterId = rawId != null && rawId.trim() !== "" ? rawId : null;
  const read = readPlainFields(value, allowed);
  const recognized =
    masterId != null &&
    exactCanonicalMasterId(masterId) &&
    (knownCanonicalIds == null || knownCanonicalIds.includes(masterId));
  if (read.kind === "fields" && read.unexpected.length === 0 && read.missing.length === 0 && recognized && masterId != null) {
    return { status: "valid", masterId, values: { ...read.values } };
  }
  if (masterId != null && recognized) return { status: "invalid", masterId, blocksRegister: false };
  if (masterId != null) return { status: "invalid", masterId, blocksRegister: true };
  return { status: "unreadable" };
}

function splitMasterId(masterId: string): { familyKey: string; version: string } | null {
  const at = masterId.lastIndexOf("@");
  if (at <= 0 || at === masterId.length - 1) return null;
  return { familyKey: masterId.slice(0, at), version: masterId.slice(at + 1) };
}

function isSafeRelativePath(sourcePath: string): boolean {
  if (sourcePath.includes("\0") || sourcePath.includes("\\")) return false;
  if (sourcePath.startsWith("/")) return false;
  if (/^[A-Za-z]:\//.test(sourcePath)) return false;
  const parts = sourcePath.split("/");
  return parts.length > 0 && parts.every((part) => part !== "" && part !== "." && part !== "..");
}

/**
 * Ordinary ASCII separators only. This is not applied to uninspectable text.
 * It does not remove characters that could hide an identifier.
 */
export function foldCarrierText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/ +/g, " ")
    .trim();
}

/**
 * Approved safe-input class: non-empty ASCII plain text.
 * Tab, CR, and LF are ordinary whitespace. Markup, entities, controls,
 * format characters, and non-ASCII text are outside the class.
 */
export function plainTextInspectability(value: string): "plain" | "empty" | "uninspectable" {
  if (value.length === 0 || value.trim().length === 0) return "empty";
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    const ordinary = code === 0x09 || code === 0x0a || code === 0x0d || (code >= 0x20 && code <= 0x7e);
    if (!ordinary) return "uninspectable";
  }
  if (/[<>&]/.test(value)) return "uninspectable";
  return "plain";
}

function containsPhrase(text: string, phrase: string): boolean {
  const hay = ` ${foldCarrierText(text)} `;
  const needle = ` ${foldCarrierText(phrase)} `;
  if (needle.trim() === "") return false;
  return hay.includes(needle);
}

function alphanumericProjection(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function containsProjected(text: string, phrase: string): boolean {
  const needle = alphanumericProjection(phrase);
  if (needle.length < 6) return false;
  return alphanumericProjection(text).includes(needle);
}

function containsIsolatedWord(text: string, word: string): boolean {
  const bounded = new RegExp(`(?:^|[^a-z0-9])${word}(?:[^a-z0-9]|$)`, "i");
  if (bounded.test(text)) return true;
  const body = [...word].map((character) => `${character}(?![a-z0-9])`).join("[^a-z0-9]+");
  return new RegExp(`(?:^|[^a-z0-9])${body}`, "i").test(text);
}

const PHONE_SEPARATOR = /^[ \t().+\-]*$/;

/**
 * Digit runs, plus every contiguous join of runs that are separated only by
 * phone punctuation. A longer unrelated run is not split, and an adjacent
 * group is not glued onto the only candidate.
 */
function numericCandidates(text: string): string[] {
  const found = new Set<string>();
  const groups: { digits: string; start: number; end: number }[] = [];
  for (const match of text.matchAll(/\d+/g)) {
    const start = match.index ?? 0;
    groups.push({ digits: match[0], start, end: start + match[0].length });
  }
  let chainStart = 0;
  const flush = (chainEnd: number) => {
    for (let left = chainStart; left < chainEnd; left += 1) {
      let joined = "";
      for (let right = left; right < chainEnd; right += 1) {
        joined += groups[right].digits;
        found.add(joined);
      }
    }
  };
  for (let index = 0; index < groups.length; index += 1) {
    const last = index === groups.length - 1;
    const between = last ? "" : text.slice(groups[index].end, groups[index + 1].start);
    if (last || !PHONE_SEPARATOR.test(between)) {
      flush(index + 1);
      chainStart = index + 1;
    }
  }
  return [...found];
}

function containsDigits(text: string, raw: string, countryCode: boolean): boolean {
  const token = raw.replace(/\D/g, "");
  if (token.length < 6) return false;
  for (const candidate of numericCandidates(text)) {
    if (candidate === token) return true;
    if (countryCode && candidate === `1${token}`) return true;
  }
  return false;
}

function containsDatCode(text: string): boolean {
  return /dat[^a-z0-9]+[a-z0-9]/i.test(text);
}

/**
 * Automated carrier screen. Encoded, separator-free DAT, and unrecorded
 * variants are outside this screen. Condition 4A already rejects those
 * representations when they are not admissible plain text.
 */
export function textIdentifiesRecordedCarrier(text: string, terms: Phase2CarrierMatchTerms): boolean {
  for (const name of terms.names) {
    if (containsPhrase(text, name) || containsProjected(text, name)) return true;
    for (const word of name.toLowerCase().match(/[a-z]{5,}/g) ?? []) {
      if (containsIsolatedWord(text, word)) return true;
    }
  }
  if (terms.datPrefix && containsDatCode(text)) return true;
  for (const token of terms.tokens) {
    const digits = token.replace(/\D/g, "");
    if (digits.length >= 6 && digits === token.replace(/\s/g, "") && /^\d+$/.test(digits)) {
      if (containsDigits(text, digits, false)) return true;
      continue;
    }
    if (containsPhrase(text, token) || containsProjected(text, token)) return true;
  }
  for (const phone of terms.phones) {
    if (containsPhrase(text, phone) || containsDigits(text, phone, true)) return true;
  }
  return false;
}

/** Printable ASCII basis that names the review, the origin, and the neutrality conclusion. */
export function neutralityBasisAccepted(value: string): boolean {
  if (value.length === 0 || value !== value.trim()) return false;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 0x20 || code > 0x7e) return false;
  }
  const reviewed = value.toLowerCase().includes("reviewed");
  const origin = value.includes("BOF-authored") || value.includes("carrier-originated");
  const why = value.toLowerCase().includes("carrier-neutral");
  return reviewed && origin && why;
}

/** Carrier matching runs only on plain text. Everything else is uninspectable or empty. */
export function classifyCarrierText(
  text: string,
  terms: Phase2CarrierMatchTerms,
): "carrier" | "neutral" | "empty" | "uninspectable" {
  const inspectability = plainTextInspectability(text);
  if (inspectability !== "plain") return inspectability;
  return textIdentifiesRecordedCarrier(text, terms) ? "carrier" : "neutral";
}

/**
 * Seven-part threshold. An empty issue list is the only pass.
 * Implementer prose is not an input and cannot satisfy a part.
 */
export function evaluatePhase2CandidateCitation(
  citation: object,
  context: Phase2CandidateGateContext,
): Phase2CandidateGateIssue[] {
  const issues: Phase2CandidateGateIssue[] = [];
  const C = PHASE2_CANDIDATE_GATE_ISSUE_CODES;
  const read = readPlainFields(citation, PHASE2_CANDIDATE_CITATION_FIELDS);
  if (read.kind === "notPlain") {
    push(issues, C.notPlain, "(citation)");
    return issues;
  }
  const subject = read.values.compatibilityMasterId || "(citation)";
  for (const extra of read.unexpected) push(issues, C.citationFieldUnexpected, `${subject}:${extra}`);
  for (const field of read.missing) push(issues, C.citationFieldMissing, `${subject}:${field}`);
  for (const field of PHASE2_CANDIDATE_CITATION_FIELDS) {
    const value = read.values[field];
    if (value != null && field !== "decidedBy" && value.trim() === "") {
      push(issues, C.citationFieldMissing, `${subject}:${field}`);
    }
  }
  if (issues.length > 0) return issues;

  const snapshot = Object.freeze({ ...read.values }) as Phase2CandidateCitation;
  const compatibilityMasterId = snapshot.compatibilityMasterId;
  const sourcePath = snapshot.sourcePath;
  const sourceSha1 = snapshot.sourceSha1;
  const provenanceCommit = snapshot.provenanceCommit;
  const decidedBy = snapshot.decidedBy;
  const decidedAt = snapshot.decidedAt;
  const expectedMasterId = canonicalMasterIdentity(context.canonicalFamilyKey, context.canonicalVersion);
  const identityAgreed = expectedMasterId != null && compatibilityMasterId === expectedMasterId;
  if (!identityAgreed) push(issues, C.identityInvalid, compatibilityMasterId);

  const parsed = identityAgreed ? splitMasterId(compatibilityMasterId) : null;
  const knownFamily = parsed
    ? context.knownMasterIds.filter((id) => splitMasterId(id)?.familyKey === parsed.familyKey)
    : [];

  if (!identityAgreed || !parsed || knownFamily.length === 0) {
    if (identityAgreed) push(issues, C.masterUnknown, compatibilityMasterId);
  } else if (!context.knownMasterIds.includes(compatibilityMasterId)) {
    push(issues, C.versionMismatch, compatibilityMasterId);
  }
  if (parsed && context.deltaFamilyKeys.includes(parsed.familyKey)) {
    push(issues, C.delta, compatibilityMasterId);
  }
  if (parsed && context.collisionFamilyKeys.includes(parsed.familyKey)) {
    push(issues, C.collision, compatibilityMasterId);
  }
  const holdFamily = isGlobalBofCode(context.canonicalFamilyKey) ? context.canonicalFamilyKey : "";
  for (const hold of holdsForFamily(holdFamily)) {
    push(issues, C.hold, `${context.canonicalFamilyKey}:${hold}`);
  }
  if (holdsForFamily(holdFamily).includes("CATALOG_FAMILY")) {
    push(issues, C.notSingleDocument, context.canonicalFamilyKey);
  }
  if (context.inspectionCategory != null && CANDIDACY_BLOCKED_CATEGORIES.has(context.inspectionCategory)) {
    push(issues, C.categoryBlocked, `${compatibilityMasterId}:${context.inspectionCategory}`);
  }
  if (context.contentPosture !== "UNCLASSIFIED") {
    push(issues, C.categoryBlocked, `${compatibilityMasterId}:${context.contentPosture}`);
  }
  if (substantiveTextBlank(decidedBy)) push(issues, C.decidedByBlank, compatibilityMasterId);
  if (!isStrictIsoTimestamp(decidedAt)) push(issues, C.timestampInvalid, compatibilityMasterId);

  if (!isSafeRelativePath(sourcePath) || !context.facts.sourcePresent) {
    push(issues, C.sourceMissing, sourcePath);
  }

  const fullSha = PHASE2_FULL_COMMIT_SHA.test(provenanceCommit);
  if (!fullSha || !context.facts.provenanceIsCommit || !context.facts.provenanceIsAncestor) {
    push(issues, C.provenanceInvalid, provenanceCommit);
  } else if (!context.facts.provenancePathPresent || context.facts.provenanceBlobSha1 == null) {
    push(issues, C.provenancePathMissing, `${provenanceCommit}:${sourcePath}`);
  } else if (context.facts.provenanceBlobSha1 !== sourceSha1.toLowerCase()) {
    push(issues, C.hashMismatch, sourcePath);
  }

  if (context.facts.sourcePath !== sourcePath) push(issues, C.pathMismatch, sourcePath);

  let readyForHuman = false;
  if (
    !admissibleSourceExtension(sourcePath) ||
    context.carrierTerms.names.length === 0 ||
    context.facts.carrierInspection !== "text" ||
    context.facts.inspectedText == null
  ) {
    push(issues, C.uninspectable, sourcePath);
  } else {
    const carrierClass = classifyCarrierText(context.facts.inspectedText, context.carrierTerms);
    if (context.facts.byteLength === 0 || carrierClass === "empty") push(issues, C.sourceEmpty, sourcePath);
    else if (carrierClass === "uninspectable") push(issues, C.uninspectable, sourcePath);
    else if (carrierClass === "carrier") push(issues, C.notNeutral, sourcePath);
    else readyForHuman = true;
  }

  if (readyForHuman) {
    if (snapshot.neutralityDetermination !== PHASE2_NEUTRALITY_DETERMINATION) {
      push(issues, C.neutralityDetermination, compatibilityMasterId);
    }
    if (!neutralityBasisAccepted(snapshot.neutralityBasis)) {
      push(issues, C.neutralityBasis, compatibilityMasterId);
    }
  }

  return issues;
}

export function citationRegisterIssues(citations: readonly unknown[]): Phase2CandidateGateIssue[] {
  const issues: Phase2CandidateGateIssue[] = [];
  const seen = new Set<string>();
  for (const citation of citations) {
    const entry = classifyPhase2RegisterEntry(citation, PHASE2_CANDIDATE_CITATION_FIELDS);
    if (entry.status === "unreadable") {
      push(issues, PHASE2_CANDIDATE_GATE_ISSUE_CODES.notPlain, "(citation)");
      continue;
    }
    if (seen.has(entry.masterId)) {
      push(issues, PHASE2_CANDIDATE_GATE_ISSUE_CODES.duplicateCitation, entry.masterId);
    }
    seen.add(entry.masterId);
    if (entry.status === "invalid") {
      push(issues, PHASE2_CANDIDATE_GATE_ISSUE_CODES.notPlain, entry.masterId);
    }
  }
  return issues;
}

export function evaluatePhase2MasterReviewRelease(
  release: object,
  citationOk: boolean,
): Phase2CandidateGateIssue[] {
  const issues: Phase2CandidateGateIssue[] = [];
  const C = PHASE2_CANDIDATE_GATE_ISSUE_CODES;
  const read = readPlainFields(release, PHASE2_MASTER_REVIEW_RELEASE_FIELDS);
  if (read.kind === "notPlain") {
    push(issues, C.releaseNotPlain, "(release)");
    return issues;
  }
  const subject = read.values.compatibilityMasterId || "(release)";
  for (const extra of read.unexpected) push(issues, C.releaseFieldUnexpected, `${subject}:${extra}`);
  for (const field of PHASE2_MASTER_REVIEW_RELEASE_FIELDS) {
    const value = read.values[field];
    const blank =
      field === "releasedBy" || field === "masterWorkScopeRef"
        ? substantiveTextBlank(value)
        : value == null || value.trim() === "";
    if (blank) {
      const code = field === "masterWorkScopeRef" ? C.releaseScopeMissing : C.releaseFieldMissing;
      push(issues, code, `${subject}:${field}`);
    }
  }
  if (issues.length > 0) {
    if (!citationOk) push(issues, C.releaseCitationMissing, subject);
    return issues;
  }
  const snapshot = Object.freeze({ ...read.values }) as Phase2MasterReviewRelease;
  if (!citationOk) push(issues, C.releaseCitationMissing, subject);
  const releasedBy = snapshot.releasedBy;
  const releasedAt = snapshot.releasedAt;
  if (substantiveTextBlank(releasedBy)) push(issues, C.releaseInvalid, subject);
  if (releasedAt != null && releasedAt.trim() !== "" && !isStrictIsoTimestamp(releasedAt)) {
    push(issues, C.releaseInvalid, subject);
  }
  return issues;
}
