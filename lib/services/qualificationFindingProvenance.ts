import {
  EMPLOYMENT_HISTORY_ITEM_KEY,
  classifyQualificationReasonCode,
  summarizeModeledMandatoryItems,
  type EvidenceConflict,
  type QualificationEvidenceState,
  type QualificationFindingCategory,
} from "@/lib/services/qualificationEvidenceClassification";
import {
  MANDATORY_QUALIFICATION_EVIDENCE,
  REGISTRY_OWNED_REQUIREMENT_TYPES,
} from "@/lib/services/authoritativeDriverQualificationService";
import { evaluateQualification, type QualificationInputs } from "@/lib/services/qualificationService";

/**
 * Stage 0 D-1 PR 2: additive, read-only finding provenance. Pure functions only.
 *
 * Labels each reason code returned by the unchanged authoritative evaluator with the requirement it comes from, the
 * records that support it and how they were verified. It never decides, changes or overrides a qualification or
 * movement decision, is not imported by the evaluator, `authorizeMovement` or the D-2 policy, and does not make
 * ADMINISTRATIVE classifications active: the approved mapping stays empty and the proposed one below is inert.
 *
 * Nothing is invented. A source identifier appears only when a record supports the finding; a finding whose source
 * cannot be established says so (`sourceEvidence: "UNKNOWN"`, `attribution: "UNATTRIBUTED"`) and stays UNCLASSIFIED.
 */

export const PROVENANCE_CONTRACT_VERSION = "bof-stage0-d1-provenance-v1" as const;

export type RequirementOrigin =
  | "BOF_MANDATORY_REGISTRY"
  | "BOF_EVALUATOR_RULE"
  | "DISQUALIFICATION_RULE"
  | "INTAKE_REQUIREMENT_ROW"
  | "LEGACY_STRUCTURED_RECORD_RULE"
  | "LEGACY_AGGREGATE_RULE"
  | "UNKNOWN";

export type ClassificationReason =
  | "REGISTRY_REQUIREMENT_MAPPING"
  | "EMPLOYMENT_HISTORY_RULE"
  | "DISQUALIFICATION_RULE"
  | "NO_APPROVED_MAPPING_INTAKE_REQUIREMENT"
  | "NO_APPROVED_MAPPING_STRUCTURED_RECORD"
  | "NO_APPROVED_MAPPING_AGGREGATE_RULE"
  | "INTERNAL_POLICY_FLAG_NOT_MAPPED"
  | "EVALUATOR_CONTEXT_CODE"
  | "SOURCE_UNATTRIBUTED"
  | "ADMINISTRATIVE_MAPPING_APPROVED";

/** An authoritative mapping from a registry/evaluator requirement to its identifier, origin and evidence source. */
export type MandatoryRequirementMapping = {
  /** Stable requirement identifier: the registry key (not a database id). */
  requirementId: string;
  label: string;
  origin: "BOF_MANDATORY_REGISTRY" | "BOF_EVALUATOR_RULE";
  evidenceSource: string;
  /** Provisional reference for compliance/legal review; not a legal conclusion. */
  provisionalCitation: string;
  regulatoryStatus: "PROVISIONAL_PENDING_LEGAL_REVIEW";
};

export const MANDATORY_REQUIREMENT_MAPPING: readonly MandatoryRequirementMapping[] = [
  ...MANDATORY_QUALIFICATION_EVIDENCE.map(
    (evidence): MandatoryRequirementMapping => ({
      requirementId: evidence.key,
      label: evidence.label,
      origin: "BOF_MANDATORY_REGISTRY",
      evidenceSource:
        evidence.source.kind === "DOCUMENT"
          ? `DriverDocument.type=${evidence.source.documentType}`
          : `DriverIntakeRequirement.requirementType=${evidence.source.requirementType} + satisfiedByDocumentId`,
      provisionalCitation: evidence.provisionalCitation,
      regulatoryStatus: "PROVISIONAL_PENDING_LEGAL_REVIEW",
    }),
  ),
  {
    requirementId: EMPLOYMENT_HISTORY_ITEM_KEY,
    label: "Employment history coverage (three-year lookback)",
    origin: "BOF_EVALUATOR_RULE",
    evidenceSource: "WorkHistory (ACTIVE rows)",
    provisionalCitation: "49 CFR 391.21 (period unresolved)",
    regulatoryStatus: "PROVISIONAL_PENDING_LEGAL_REVIEW",
  },
];

/** Independently established disqualification rules in the evaluator. */
export const DISQUALIFICATION_RULES: readonly { code: string; evidenceSource: string }[] = [
  { code: "DISQUALIFYING_ACCIDENT", evidenceSource: "AccidentHistory.status=REJECTED" },
  { code: "DISQUALIFYING_VIOLATION", evidenceSource: "ViolationHistory.status=REJECTED" },
  { code: "PRE_EMPLOYMENT_DRUG_TEST_REJECTED", evidenceSource: "DrugTestRecord.status|verificationStatus=REJECTED" },
];

/**
 * PROPOSED administrative mapping for BOF compliance review. INERT: nothing consults it, the approved mapping
 * (`APPROVED_ADMINISTRATIVE_CLASSIFICATIONS`) is empty, and no decision depends on it. A proposal is not an approval.
 */
export type ProposedAdministrativeEntry = {
  requirementType: string;
  evidenceSource: string;
  proposal: "CANDIDATE_ADMINISTRATIVE" | "KEEP_UNCLASSIFIED" | "REQUIRES_LEGAL_DETERMINATION" | "REQUIRES_CARRIER_POLICY_SOURCE";
  rationale: string;
  questionsForReview: string[];
};
export const PROPOSED_ADMINISTRATIVE_MAPPING: readonly ProposedAdministrativeEntry[] = [
  {
    requirementType: "IDENTITY_SUPPORTING",
    evidenceSource: "DriverIntakeRequirement(requirementType=IDENTITY_SUPPORTING) + DriverDocument.type=IDENTITY_SUPPORTING",
    proposal: "REQUIRES_LEGAL_DETERMINATION",
    rationale: "Supports identity checks; may be an administrative onboarding item or may support a mandatory credential check.",
    questionsForReview: ["Is identity documentation required by any applicable rule for this carrier?", "Does it gate any mandatory registry item?"],
  },
  {
    requirementType: "OTHER",
    evidenceSource: "DriverIntakeRequirement(requirementType=OTHER, label)",
    proposal: "KEEP_UNCLASSIFIED",
    rationale: "A generic type carries no meaning; classification would have to come from the free-text label, which is not authoritative.",
    questionsForReview: ["Should OTHER requirements be classified individually by an approved label list?"],
  },
  {
    requirementType: "ACCIDENT_HISTORY",
    evidenceSource: "DriverIntakeRequirement(requirementType=ACCIDENT_HISTORY) + DriverDocument.type=ACCIDENT_HISTORY",
    proposal: "REQUIRES_LEGAL_DETERMINATION",
    rationale: "Related to the safety-performance-history inquiry and disqualification checks; likely mandatory-adjacent, not administrative.",
    questionsForReview: ["Is the document itself a regulatory record or an internal summary?"],
  },
  {
    requirementType: "VIOLATION_HISTORY",
    evidenceSource: "DriverIntakeRequirement(requirementType=VIOLATION_HISTORY) + DriverDocument.type=VIOLATION_HISTORY",
    proposal: "REQUIRES_LEGAL_DETERMINATION",
    rationale: "Related to annual driving-record review (potential registry gap) and disqualification checks.",
    questionsForReview: ["Does this record satisfy the annual MVR review, if that is confirmed mandatory?"],
  },
  {
    requirementType: "CARRIER_ORIENTATION",
    evidenceSource: "DriverIntakeRequirement(requirementType=CARRIER_ORIENTATION) (appears in test fixtures only)",
    proposal: "REQUIRES_CARRIER_POLICY_SOURCE",
    rationale: "Carrier-specific; no authoritative carrier policy source exists in the data model.",
    questionsForReview: ["Where does a carrier's requirement list live, and who approves it?"],
  },
  {
    requirementType: "(exception on a non-registry requirement)",
    evidenceSource: "DriverIntakeRequirement.exceptionReason",
    proposal: "KEEP_UNCLASSIFIED",
    rationale: "REQUIREMENT_EXCEPTION is movement-permitted today but only applies to a requirement whose own classification is unknown.",
    questionsForReview: ["May an exception be administrative only when the underlying requirement is approved administrative?"],
  },
];

// --------------------------------------------------------------------------- source references

export type SourceKind =
  | "DRIVER_DOCUMENT"
  | "DRIVER_INTAKE_REQUIREMENT"
  | "DRIVER_LICENSE"
  | "MEDICAL_QUALIFICATION"
  | "DRUG_TEST_RECORD"
  | "WORK_HISTORY"
  | "ACCIDENT_HISTORY"
  | "VIOLATION_HISTORY"
  | "VERIFICATION_SOURCE";

export type VerificationSourceRef = {
  id: string;
  providerName: string;
  providerType: string | null;
  verificationMethod: string;
  verificationStatus: string;
  isCertifiedProvider: boolean;
  verifiedAt: string | null;
};

export type SourceRef = {
  kind: SourceKind;
  id: string;
  /** The record's own status; null when the model has none. */
  status: string | null;
  verification: {
    verificationStatus: string | null;
    verifiedByUserId: string | null;
    certifiedByUserId: string | null;
    verificationSources: VerificationSourceRef[];
  } | null;
  /** ISO timestamps recorded on the record, null when absent. Keys are the record's own field names. */
  timestamps: Record<string, string | null>;
  origin: RequirementOrigin;
  /** False when the record belongs to a different fleet than the driver. */
  fleetMatchesDriver: boolean;
};

type Row = Record<string, unknown> & { id: string };
export type ProvenanceRows = {
  fleetId: string;
  documents: Row[];
  requirements: Row[];
  licenses: Row[];
  medicalQualifications: Row[];
  drugTests: Row[];
  workHistory: Row[];
  accidentHistory: Row[];
  violationHistory: Row[];
  verificationSources: Row[];
};

const iso = (value: unknown) => (value instanceof Date ? value.toISOString() : null);
const text = (value: unknown) => (typeof value === "string" ? value : null);

function verificationSourcesFor(rows: ProvenanceRows, field: string, id: string): VerificationSourceRef[] {
  return rows.verificationSources
    .filter((source) => source[field] === id)
    .map((source) => ({
      id: source.id,
      providerName: String(source.providerName),
      providerType: text(source.providerType),
      verificationMethod: String(source.verificationMethod),
      verificationStatus: String(source.verificationStatus),
      isCertifiedProvider: Boolean(source.isCertifiedProvider),
      verifiedAt: iso(source.verifiedAt),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

function documentRef(rows: ProvenanceRows, row: Row, origin: RequirementOrigin): SourceRef {
  return {
    kind: "DRIVER_DOCUMENT",
    id: row.id,
    status: text(row.status),
    verification: {
      verificationStatus: text(row.status),
      verifiedByUserId: text(row.verifiedByUserId),
      certifiedByUserId: text(row.certifiedByUserId),
      verificationSources: verificationSourcesFor(rows, "driverDocumentId", row.id),
    },
    timestamps: {
      uploadedAt: iso(row.uploadedAt),
      verifiedAt: iso(row.verifiedAt),
      verifiedFromSourceAt: iso(row.verifiedFromSourceAt),
      certifiedAt: iso(row.certifiedAt),
      verificationExpiresAt: iso(row.verificationExpiresAt),
      supersededAt: iso(row.supersededAt),
    },
    origin,
    fleetMatchesDriver: row.fleetId === rows.fleetId,
  };
}

function structuredRef(rows: ProvenanceRows, kind: SourceKind, field: string, row: Row, origin: RequirementOrigin): SourceRef {
  return {
    kind,
    id: row.id,
    status: text(row.status),
    verification:
      "verificationStatus" in row
        ? {
            verificationStatus: text(row.verificationStatus),
            verifiedByUserId: null,
            certifiedByUserId: null,
            verificationSources: verificationSourcesFor(rows, field, row.id),
          }
        : null,
    timestamps: {
      createdAt: iso(row.createdAt),
      updatedAt: iso(row.updatedAt),
      expirationDate: iso(row.expirationDate),
      testDate: iso(row.testDate),
      startDate: iso(row.startDate),
      endDate: iso(row.endDate),
    },
    origin,
    // Structured records carry no fleet column; they belong to the driver's intake, which is fleet-scoped.
    fleetMatchesDriver: true,
  };
}

function requirementRef(rows: ProvenanceRows, row: Row, origin: RequirementOrigin): SourceRef {
  return {
    kind: "DRIVER_INTAKE_REQUIREMENT",
    id: row.id,
    status: text(row.status),
    verification: {
      verificationStatus: text(row.verificationStatus),
      verifiedByUserId: null,
      certifiedByUserId: null,
      verificationSources: verificationSourcesFor(rows, "driverIntakeRequirementId", row.id),
    },
    timestamps: {
      verificationTimestamp: iso(row.verificationTimestamp),
      resolvedAt: iso(row.resolvedAt),
      expiresAt: iso(row.expiresAt),
      dueDate: iso(row.dueDate),
    },
    origin,
    fleetMatchesDriver: true,
  };
}

const sortRefs = (refs: SourceRef[]) =>
  [...new Map(refs.map((ref) => [`${ref.kind}:${ref.id}`, ref])).values()].sort((a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id));

/** Same selection rule as the evaluator: newest non-superseded document of a type. */
function currentDocumentRow(rows: ProvenanceRows, type: string): Row | null {
  return (
    rows.documents
      .filter((doc) => doc.type === type && !doc.supersededAt)
      .sort(
        (a, b) =>
          (b.uploadedAt as Date).getTime() - (a.uploadedAt as Date).getTime() || (b.versionNumber as number) - (a.versionNumber as number),
      )[0] ?? null
  );
}

// --------------------------------------------------------------------------- legacy replay

const LEGACY_OPTIONS = { registryOwnedRequirementTypes: REGISTRY_OWNED_REQUIREMENT_TYPES, skipWorkHistoryCheck: true } as const;

/**
 * Attributes legacy (non-registry) reason codes to records by re-running the unchanged legacy evaluator on one record
 * at a time. A code is attributed to a record only if the evaluator itself emits it for that record alone.
 */
function replayLegacyAttribution(inputs: QualificationInputs, rows: ProvenanceRows): Map<string, SourceRef[]> {
  const result = new Map<string, SourceRef[]>();
  const empty = {
    requirements: [], documents: [], licenses: [], endorsements: [], medicalQualifications: [], drugTests: [],
    workHistory: [], accidentHistory: [], violationHistory: [], verificationSources: [],
  };
  const run = (unit: Partial<QualificationInputs>) =>
    evaluateQualification({ ...inputs, ...empty, ...unit } as QualificationInputs, LEGACY_OPTIONS).reasonCodes;
  const attribute = (codes: string[], ref: SourceRef) => {
    for (const code of codes) result.set(code, [...(result.get(code) ?? []), ref]);
  };
  const raw = inputs as unknown as {
    requirements: Row[]; documents: Row[]; licenses: Row[]; medicalQualifications: Row[]; drugTests: Row[]; verificationSources: Row[];
  };

  for (const requirement of raw.requirements) {
    if (REGISTRY_OWNED_REQUIREMENT_TYPES.has(String(requirement.requirementType))) continue;
    const related = raw.documents.filter((doc) => doc.type === requirement.requirementType);
    attribute(run({ requirements: [requirement], documents: related } as unknown as Partial<QualificationInputs>), requirementRef(rows, requirement, "INTAKE_REQUIREMENT_ROW"));
  }
  for (const license of raw.licenses) {
    attribute(run({ licenses: [license] } as unknown as Partial<QualificationInputs>), structuredRef(rows, "DRIVER_LICENSE", "driverLicenseId", license, "LEGACY_STRUCTURED_RECORD_RULE"));
  }
  for (const medical of raw.medicalQualifications) {
    const medicalDocs = raw.documents.filter((doc) => doc.type === "MEDICAL");
    attribute(run({ medicalQualifications: [medical], documents: medicalDocs } as unknown as Partial<QualificationInputs>), structuredRef(rows, "MEDICAL_QUALIFICATION", "medicalQualificationId", medical, "LEGACY_STRUCTURED_RECORD_RULE"));
  }
  for (const test of raw.drugTests) {
    attribute(run({ drugTests: [test] } as unknown as Partial<QualificationInputs>), structuredRef(rows, "DRUG_TEST_RECORD", "drugTestRecordId", test, "LEGACY_STRUCTURED_RECORD_RULE"));
  }
  for (const document of raw.documents) {
    attribute(run({ documents: [document] } as unknown as Partial<QualificationInputs>), documentRef(rows, document, "LEGACY_AGGREGATE_RULE"));
  }
  for (const source of raw.verificationSources) {
    const ref: SourceRef = {
      kind: "VERIFICATION_SOURCE", id: source.id, status: text(source.verificationStatus),
      verification: { verificationStatus: text(source.verificationStatus), verifiedByUserId: text(source.verifiedByUserId), certifiedByUserId: null, verificationSources: [] },
      timestamps: { verifiedAt: iso(source.verifiedAt), createdAt: iso(source.createdAt) },
      origin: "LEGACY_AGGREGATE_RULE", fleetMatchesDriver: true,
    };
    attribute(run({ verificationSources: [source] } as unknown as Partial<QualificationInputs>), ref);
  }
  return result;
}

// --------------------------------------------------------------------------- findings

export type FindingProvenance = {
  code: string;
  category: QualificationFindingCategory;
  classificationReason: ClassificationReason;
  evidenceState: QualificationEvidenceState;
  /** Requirement identifier when an authoritative mapping applies; otherwise null. */
  requirementId: string | null;
  origins: RequirementOrigin[];
  /** AUTHORITATIVE_MAPPING: registry/rule; RULE_REPLAY: legacy evaluator emitted it for the listed records; UNATTRIBUTED: unknown. */
  attribution: "AUTHORITATIVE_MAPPING" | "RULE_REPLAY" | "UNATTRIBUTED";
  /** RECORDED: records listed; NONE_RECORDED: the finding is about absent evidence; UNKNOWN: source could not be established. */
  sourceEvidence: "RECORDED" | "NONE_RECORDED" | "UNKNOWN";
  sources: SourceRef[];
  /** Registry requirement a legacy finding merely resembles. A hint for reviewers; it never makes the finding mandatory. */
  relatedRegistryRequirementHint: string | null;
};

const CONTEXT_CODES = new Set(["DRIVER_CONTEXT_REQUIRED", "DRIVER_NOT_FOUND", "DRIVER_FLEET_MISMATCH", "QUALIFICATION_RECORDS_MISSING"]);
const INTERNAL_POLICY_CODES = new Set(["WORK_HISTORY_GAP_REVIEW_REQUIRED"]);
const STRUCTURED_HINT: Record<string, string> = {
  DRIVER_LICENSE: "DRIVER_LICENSE", MEDICAL_QUALIFICATION: "MEDICAL_CERTIFICATE", DRUG_TEST_RECORD: "PRE_EMPLOYMENT_DRUG_TEST",
};

function registrySources(rows: ProvenanceRows, key: string): SourceRef[] {
  const evidence = MANDATORY_QUALIFICATION_EVIDENCE.find((item) => item.key === key);
  if (!evidence) return [];
  if (evidence.source.kind === "DOCUMENT") {
    const doc = currentDocumentRow(rows, evidence.source.documentType);
    return doc ? [documentRef(rows, doc, "BOF_MANDATORY_REGISTRY")] : [];
  }
  const requirementType = evidence.source.requirementType;
  const refs: SourceRef[] = [];
  for (const requirement of rows.requirements.filter((row) => row.requirementType === requirementType)) {
    refs.push(requirementRef(rows, requirement, "BOF_MANDATORY_REGISTRY"));
    const linked = rows.documents.find((doc) => doc.id === requirement.satisfiedByDocumentId);
    if (linked) refs.push(documentRef(rows, linked, "BOF_MANDATORY_REGISTRY"));
  }
  return sortRefs(refs);
}

function mandatoryFinding(code: string, rows: ProvenanceRows): FindingProvenance | null {
  const base = classifyQualificationReasonCode(code);
  if (base.category !== "MANDATORY" || !base.evidenceKey) return null;
  const key = base.evidenceKey;
  let sources: SourceRef[] = [];
  let origin: RequirementOrigin = "BOF_MANDATORY_REGISTRY";
  let reason: ClassificationReason = "REGISTRY_REQUIREMENT_MAPPING";

  if (key === EMPLOYMENT_HISTORY_ITEM_KEY) {
    origin = "BOF_EVALUATOR_RULE";
    reason = "EMPLOYMENT_HISTORY_RULE";
    sources = rows.workHistory.filter((row) => row.status === "ACTIVE").map((row) => structuredRef(rows, "WORK_HISTORY", "", row, origin));
  } else if (key === "DISQUALIFICATION") {
    origin = "DISQUALIFICATION_RULE";
    reason = "DISQUALIFICATION_RULE";
    sources =
      code === "DISQUALIFYING_ACCIDENT"
        ? rows.accidentHistory.filter((row) => row.status === "REJECTED").map((row) => structuredRef(rows, "ACCIDENT_HISTORY", "", row, origin))
        : rows.violationHistory.filter((row) => row.status === "REJECTED").map((row) => structuredRef(rows, "VIOLATION_HISTORY", "", row, origin));
  } else {
    sources = registrySources(rows, key);
    if (code === "PRE_EMPLOYMENT_DRUG_TEST_REJECTED") {
      origin = "DISQUALIFICATION_RULE";
      reason = "DISQUALIFICATION_RULE";
      sources = rows.drugTests
        .filter((row) => row.status === "REJECTED" || row.verificationStatus === "REJECTED")
        .map((row) => structuredRef(rows, "DRUG_TEST_RECORD", "drugTestRecordId", row, origin));
    }
  }
  const sorted = sortRefs(sources);
  return {
    code,
    category: "MANDATORY",
    classificationReason: reason,
    evidenceState: base.evidenceState,
    requirementId: key === "DISQUALIFICATION" ? code : key,
    origins: [origin],
    attribution: "AUTHORITATIVE_MAPPING",
    // A finding about absent evidence has no record to point to; that is stated, not filled in.
    sourceEvidence: sorted.length > 0 ? "RECORDED" : "NONE_RECORDED",
    sources: sorted,
    relatedRegistryRequirementHint: null,
  };
}

function legacyOrUnknownFinding(code: string, replay: Map<string, SourceRef[]>): FindingProvenance {
  const base = classifyQualificationReasonCode(code);
  if (base.category === "ADMINISTRATIVE") {
    // Reachable only once a mapping is approved in APPROVED_ADMINISTRATIVE_CLASSIFICATIONS (empty in PR 2).
    const sources = sortRefs(replay.get(code) ?? []);
    return { code, category: "ADMINISTRATIVE", classificationReason: "ADMINISTRATIVE_MAPPING_APPROVED", evidenceState: base.evidenceState, requirementId: base.evidenceKey, origins: ["INTAKE_REQUIREMENT_ROW"], attribution: "AUTHORITATIVE_MAPPING", sourceEvidence: sources.length > 0 ? "RECORDED" : "UNKNOWN", sources, relatedRegistryRequirementHint: null };
  }
  if (CONTEXT_CODES.has(code)) {
    return { code, category: base.category, classificationReason: "EVALUATOR_CONTEXT_CODE", evidenceState: base.evidenceState, requirementId: null, origins: ["UNKNOWN"], attribution: "UNATTRIBUTED", sourceEvidence: "UNKNOWN", sources: [], relatedRegistryRequirementHint: null };
  }
  const sources = sortRefs(replay.get(code) ?? []);
  const origins = [...new Set(sources.map((source) => source.origin))].sort() as RequirementOrigin[];
  const hint = [...new Set(sources.map((source) => STRUCTURED_HINT[source.kind]).filter((x): x is string => Boolean(x)))].sort();
  let classificationReason: ClassificationReason = "SOURCE_UNATTRIBUTED";
  if (INTERNAL_POLICY_CODES.has(code)) classificationReason = "INTERNAL_POLICY_FLAG_NOT_MAPPED";
  else if (origins.includes("INTAKE_REQUIREMENT_ROW")) classificationReason = "NO_APPROVED_MAPPING_INTAKE_REQUIREMENT";
  else if (origins.includes("LEGACY_STRUCTURED_RECORD_RULE")) classificationReason = "NO_APPROVED_MAPPING_STRUCTURED_RECORD";
  else if (origins.includes("LEGACY_AGGREGATE_RULE")) classificationReason = "NO_APPROVED_MAPPING_AGGREGATE_RULE";
  const attributed = sources.length > 0 || INTERNAL_POLICY_CODES.has(code);
  return {
    code,
    // Never mandatory or administrative by wording or by attribution alone: no approved mapping exists.
    category: "UNCLASSIFIED",
    classificationReason,
    evidenceState: "UNKNOWN",
    requirementId: null,
    origins: INTERNAL_POLICY_CODES.has(code) ? ["BOF_EVALUATOR_RULE"] : origins.length > 0 ? origins : ["UNKNOWN"],
    attribution: sources.length > 0 ? "RULE_REPLAY" : "UNATTRIBUTED",
    sourceEvidence: sources.length > 0 ? "RECORDED" : attributed ? "NONE_RECORDED" : "UNKNOWN",
    sources,
    relatedRegistryRequirementHint: hint.length > 0 ? hint.join(",") : null,
  };
}

export type ItemProvenance = {
  requirementId: string;
  origin: RequirementOrigin;
  provisionalCitation: string;
  evidenceState: QualificationEvidenceState;
  /**
   * VERIFIED: current evidence with a recorded verifier and verification time. INCOMPLETE: current evidence whose
   * verifier or time is not recorded. NOT_VERIFIED: a record exists but the evaluator does not accept it.
   * MISSING: no record. CONFLICTING: records contradict. Only VERIFIED is verified provenance.
   */
  provenanceState: "VERIFIED" | "INCOMPLETE" | "NOT_VERIFIED" | "MISSING" | "CONFLICTING";
  sources: SourceRef[];
};

export type DriverQualificationProvenance = {
  contractVersion: typeof PROVENANCE_CONTRACT_VERSION;
  administrativeClassificationActive: false;
  regulatoryCompleteness: "NOT_ESTABLISHED";
  authorizesMovement: false;
  enablesSoftOverride: false;
  findings: FindingProvenance[];
  items: ItemProvenance[];
  conflicts: EvidenceConflict[];
};

function itemProvenance(rows: ProvenanceRows, mapping: MandatoryRequirementMapping, state: QualificationEvidenceState): ItemProvenance {
  const key = mapping.requirementId;
  const sources =
    key === EMPLOYMENT_HISTORY_ITEM_KEY
      ? sortRefs(rows.workHistory.filter((row) => row.status === "ACTIVE").map((row) => structuredRef(rows, "WORK_HISTORY", "", row, mapping.origin)))
      : registrySources(rows, key);
  let provenanceState: ItemProvenance["provenanceState"];
  if (state === "CONFLICTING" || sources.some((source) => !source.fleetMatchesDriver)) provenanceState = "CONFLICTING";
  else if (sources.length === 0) provenanceState = "MISSING";
  else if (state !== "VERIFIED_CURRENT") provenanceState = "NOT_VERIFIED";
  else if (key === EMPLOYMENT_HISTORY_ITEM_KEY) provenanceState = "INCOMPLETE"; // WorkHistory rows carry no verification fields
  else {
    const documents = sources.filter((source) => source.kind === "DRIVER_DOCUMENT");
    const complete = documents.some((source) => {
      const certified = source.status === "CERTIFIED";
      const by = certified ? source.verification?.certifiedByUserId ?? source.verification?.verifiedByUserId : source.verification?.verifiedByUserId;
      const at = certified ? source.timestamps.certifiedAt ?? source.timestamps.verifiedAt : source.timestamps.verifiedAt;
      return Boolean(by) && Boolean(at);
    });
    provenanceState = complete ? "VERIFIED" : "INCOMPLETE";
  }
  return { requirementId: key, origin: mapping.origin, provisionalCitation: mapping.provisionalCitation, evidenceState: state, provenanceState, sources };
}

/**
 * Pure. `reasonCodes` and `conflicts` come from the unchanged evaluator and PR 1 conflict detection; `inputs` is the
 * same record set the evaluator used. Returns provenance only; status and reason codes are never altered.
 */
export function buildQualificationProvenance(args: {
  reasonCodes: readonly string[] | null;
  conflicts: readonly EvidenceConflict[];
  rows: ProvenanceRows;
  legacyInputs: QualificationInputs | null;
}): DriverQualificationProvenance {
  const { reasonCodes, rows } = args;
  const summary = summarizeModeledMandatoryItems(reasonCodes, args.conflicts);
  const replay = args.legacyInputs && args.legacyInputs.intake ? replayLegacyAttribution(args.legacyInputs, rows) : new Map<string, SourceRef[]>();
  const findings = [...(reasonCodes ?? [])]
    .map((code) => mandatoryFinding(code, rows) ?? legacyOrUnknownFinding(code, replay))
    .sort((a, b) => a.code.localeCompare(b.code));
  const items = MANDATORY_REQUIREMENT_MAPPING.map((mapping) => {
    const state = summary.items.find((item) => item.key === mapping.requirementId)?.evidenceState ?? "UNKNOWN";
    return itemProvenance(rows, mapping, state);
  });
  return {
    contractVersion: PROVENANCE_CONTRACT_VERSION,
    administrativeClassificationActive: false,
    regulatoryCompleteness: "NOT_ESTABLISHED",
    authorizesMovement: false,
    enablesSoftOverride: false,
    findings,
    items,
    conflicts: summary.conflicts,
  };
}
