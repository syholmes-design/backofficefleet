import { MANDATORY_QUALIFICATION_EVIDENCE } from "@/lib/services/authoritativeDriverQualificationService";

/**
 * Stage 0 D-1 PR 1: additive, read-only classification of qualification findings. Pure functions only.
 *
 * Nothing here decides, changes or overrides a qualification or movement decision. The authoritative evaluator
 * (getAuthoritativeDriverQualification) remains the only source of status and reason codes; this module only
 * labels the codes it returns. It is not imported by the evaluator, by authorizeMovement or by the D-2 policy.
 *
 * Two independent dimensions are kept apart:
 * - category: what kind of requirement a finding belongs to (MANDATORY / ADMINISTRATIVE / UNCLASSIFIED);
 * - evidenceState: how well the underlying evidence verifies (VERIFIED_CURRENT / PENDING / MISSING / ...).
 */

export const CLASSIFICATION_CONTRACT_VERSION = "bof-stage0-d1-classification-v1" as const;

export const QUALIFICATION_FINDING_CATEGORIES = ["MANDATORY", "ADMINISTRATIVE", "UNCLASSIFIED"] as const;
export type QualificationFindingCategory = (typeof QUALIFICATION_FINDING_CATEGORIES)[number];

export const QUALIFICATION_EVIDENCE_STATES = [
  "VERIFIED_CURRENT",
  "PENDING",
  "MISSING",
  "EXPIRED",
  "REJECTED",
  "CONFLICTING",
  "UNKNOWN",
] as const;
export type QualificationEvidenceState = (typeof QUALIFICATION_EVIDENCE_STATES)[number];

/** Worst first. An item with several signals reports the first state in this list that applies. */
const STATE_PRECEDENCE: readonly QualificationEvidenceState[] = [
  "UNKNOWN",
  "REJECTED",
  "EXPIRED",
  "CONFLICTING",
  "MISSING",
  "PENDING",
  "VERIFIED_CURRENT",
];

/** Mandatory items the evaluator models today: the registry plus the employment-history coverage rule. */
export const EMPLOYMENT_HISTORY_ITEM_KEY = "EMPLOYMENT_HISTORY" as const;
export const DISQUALIFICATION_ITEM_KEY = "DISQUALIFICATION" as const;
export const CURRENTLY_MODELED_MANDATORY_ITEM_KEYS: readonly string[] = [
  ...MANDATORY_QUALIFICATION_EVIDENCE.map((evidence) => evidence.key),
  EMPLOYMENT_HISTORY_ITEM_KEY,
  DISQUALIFICATION_ITEM_KEY,
];

const REGISTRY_SUFFIX_STATE: ReadonlyArray<readonly [string, QualificationEvidenceState]> = [
  ["_NOT_COMPLIANCE_VERIFIED", "PENDING"],
  ["_UNVERIFIED", "PENDING"],
  ["_NOT_RECORDED", "MISSING"],
  ["_MISSING", "MISSING"],
  ["_EXPIRED", "EXPIRED"],
  ["_REJECTED", "REJECTED"],
];

/** Codes produced by the evaluator's own mandatory checks that are not tied to a registry key. */
const EXACT_MANDATORY_CODES: Readonly<Record<string, { key: string; state: QualificationEvidenceState }>> = {
  WORK_HISTORY_MISSING: { key: EMPLOYMENT_HISTORY_ITEM_KEY, state: "MISSING" },
  WORK_HISTORY_INCOMPLETE: { key: EMPLOYMENT_HISTORY_ITEM_KEY, state: "PENDING" },
  DISQUALIFYING_ACCIDENT: { key: DISQUALIFICATION_ITEM_KEY, state: "REJECTED" },
  DISQUALIFYING_VIOLATION: { key: DISQUALIFICATION_ITEM_KEY, state: "REJECTED" },
  PRE_EMPLOYMENT_DRUG_TEST_REJECTED: { key: "PRE_EMPLOYMENT_DRUG_TEST", state: "REJECTED" },
};

/**
 * Approved mapping from a reason code to an ADMINISTRATIVE requirement and its evidence source.
 * INTENTIONALLY EMPTY: no mapping has been approved (D-1 PR 1 authorization §3). Generic legacy codes
 * (MISSING_REQUIRED_DOCUMENT, DOCUMENT_PENDING_VERIFICATION, DRUG_TEST_PENDING, MANUAL_REVIEW_REQUIRED,
 * QUALIFICATION_RULES_NOT_MET, REQUIREMENT_EXCEPTION, ...) are raised for mandatory and non-mandatory evidence
 * alike and must never be treated as administrative by inference.
 */
export const APPROVED_ADMINISTRATIVE_CLASSIFICATIONS: ReadonlyMap<string, { evidenceKey: string; approvedBy: string }> = new Map();

export type ClassifiedFinding = {
  code: string;
  category: QualificationFindingCategory;
  /** Registry key / modeled item for MANDATORY and ADMINISTRATIVE findings; null when UNCLASSIFIED. */
  evidenceKey: string | null;
  evidenceState: QualificationEvidenceState;
};

/** Labels one evaluator reason code. Anything it cannot attribute to a modeled item is UNCLASSIFIED / UNKNOWN. */
export function classifyQualificationReasonCode(code: string): ClassifiedFinding {
  const approved = APPROVED_ADMINISTRATIVE_CLASSIFICATIONS.get(code);
  if (approved) return { code, category: "ADMINISTRATIVE", evidenceKey: approved.evidenceKey, evidenceState: "PENDING" };

  const exact = EXACT_MANDATORY_CODES[code];
  if (exact) return { code, category: "MANDATORY", evidenceKey: exact.key, evidenceState: exact.state };

  for (const evidence of MANDATORY_QUALIFICATION_EVIDENCE) {
    for (const [suffix, state] of REGISTRY_SUFFIX_STATE) {
      if (code === `${evidence.key}${suffix}`) return { code, category: "MANDATORY", evidenceKey: evidence.key, evidenceState: state };
    }
  }
  return { code, category: "UNCLASSIFIED", evidenceKey: null, evidenceState: "UNKNOWN" };
}

export type EvidenceConflictKind =
  | "MULTIPLE_CURRENT_VERSIONS"
  | "STRUCTURED_RECORD_CONTRADICTS_DOCUMENT"
  | "REQUIREMENT_CLAIMS_SATISFIED_WITHOUT_VERIFIED_DOCUMENT"
  | "WAIVER_ON_MANDATORY_ITEM";

export type EvidenceConflict = { evidenceKey: string; kind: EvidenceConflictKind };

export const KNOWN_REGISTRY_GAPS: ReadonlyArray<{ id: string; description: string; reference: string }> = [
  {
    id: "ANNUAL_MVR_REVIEW",
    description: "Annual motor-vehicle-record inquiry and driver review is not a modeled mandatory item; it may be a registry gap.",
    reference: "49 CFR 391.25 (provisional; regulatory validation required)",
  },
  {
    id: "SAFETY_PERFORMANCE_HISTORY_PERIOD",
    description: "Employment history uses a three-year lookback; the exact safety-performance-history period is unresolved.",
    reference: "49 CFR 391.21 / 391.23 (provisional; regulatory validation required)",
  },
  {
    id: "MEDICAL_EXAMINER_VERIFICATION",
    description: "Whether a certificate copy suffices or National Registry verification is required is unresolved.",
    reference: "49 CFR 391.41-391.51 (provisional; regulatory validation required)",
  },
  {
    id: "CLEARINGHOUSE_RECURRING_QUERY",
    description: "Only the pre-employment Clearinghouse query is modeled; recurring annual query is not.",
    reference: "49 CFR 382.701 (provisional; regulatory validation required)",
  },
  {
    id: "ENDORSEMENT_APPLICABILITY",
    description: "Endorsement requirements depend on load and equipment and are not modeled as mandatory items.",
    reference: "49 CFR 383 subpart F (provisional; regulatory validation required)",
  },
  {
    id: "DQ_FILE_COMPLETENESS",
    description: "Driver qualification file completeness and retention are not modeled as a single item.",
    reference: "49 CFR 391.51 (provisional; regulatory validation required)",
  },
] as const;

export type ModeledMandatoryItem = { key: string; evidenceState: QualificationEvidenceState };

export type ModeledMandatorySummary = {
  contractVersion: typeof CLASSIFICATION_CONTRACT_VERSION;
  items: ModeledMandatoryItem[];
  findings: ClassifiedFinding[];
  conflicts: EvidenceConflict[];
  /**
   * True only when every currently modeled mandatory item is VERIFIED_CURRENT, no disqualification exists, no
   * conflict was found and no finding is UNCLASSIFIED. It says nothing about requirements the registry does not
   * model, and it is never a movement authorization or a soft-override input.
   */
  allCurrentlyModeledMandatoryItemsVerified: boolean;
  /** Always NOT_ESTABLISHED: completeness of the mandatory registry has not been independently established. */
  regulatoryCompleteness: "NOT_ESTABLISHED";
  knownRegistryGaps: typeof KNOWN_REGISTRY_GAPS;
  authorizesMovement: false;
  enablesSoftOverride: false;
  /** Why the positive determination was withheld; empty when it is true. */
  withheldBecause: string[];
};

function worst(states: QualificationEvidenceState[]): QualificationEvidenceState {
  for (const state of STATE_PRECEDENCE) if (states.includes(state)) return state;
  return "UNKNOWN";
}

/**
 * Summarizes the evaluator's reason codes (plus detected evidence conflicts) per modeled mandatory item.
 * `reasonCodes === null` means the evaluation did not complete: every item is UNKNOWN and the result is negative.
 * Absence of a finding is treated as VERIFIED_CURRENT only because the evaluator itself reported none; the
 * evaluator remains the sole authority for that.
 */
export function summarizeModeledMandatoryItems(
  reasonCodes: readonly string[] | null,
  conflicts: readonly EvidenceConflict[] = [],
): ModeledMandatorySummary {
  const findings = (reasonCodes ?? []).map(classifyQualificationReasonCode);
  const sortedConflicts = [...conflicts].sort((a, b) => a.evidenceKey.localeCompare(b.evidenceKey) || a.kind.localeCompare(b.kind));
  const items: ModeledMandatoryItem[] = CURRENTLY_MODELED_MANDATORY_ITEM_KEYS.map((key) => {
    if (reasonCodes === null) return { key, evidenceState: "UNKNOWN" };
    const states: QualificationEvidenceState[] = findings
      .filter((finding) => finding.category === "MANDATORY" && finding.evidenceKey === key)
      .map((finding) => finding.evidenceState);
    if (sortedConflicts.some((conflict) => conflict.evidenceKey === key)) states.push("CONFLICTING");
    return { key, evidenceState: states.length === 0 ? "VERIFIED_CURRENT" : worst(states) };
  });

  const withheldBecause: string[] = [];
  if (reasonCodes === null) withheldBecause.push("EVALUATION_INCOMPLETE");
  for (const item of items) if (item.evidenceState !== "VERIFIED_CURRENT") withheldBecause.push(`${item.key}:${item.evidenceState}`);
  for (const finding of findings) if (finding.category === "UNCLASSIFIED") withheldBecause.push(`UNCLASSIFIED:${finding.code}`);
  for (const finding of findings) if (finding.category === "ADMINISTRATIVE") withheldBecause.push(`ADMINISTRATIVE_OPEN:${finding.code}`);

  return {
    contractVersion: CLASSIFICATION_CONTRACT_VERSION,
    items,
    findings,
    conflicts: sortedConflicts,
    allCurrentlyModeledMandatoryItemsVerified: withheldBecause.length === 0,
    regulatoryCompleteness: "NOT_ESTABLISHED",
    knownRegistryGaps: KNOWN_REGISTRY_GAPS,
    authorizesMovement: false,
    enablesSoftOverride: false,
    withheldBecause,
  };
}

/** Category lookup for D-2 style consumers: only a fully classified MANDATORY/ADMINISTRATIVE code may ever be considered. UNCLASSIFIED never qualifies. */
export function isEligibleForSoftPolicyConsideration(finding: ClassifiedFinding): boolean {
  return finding.category === "ADMINISTRATIVE" && APPROVED_ADMINISTRATIVE_CLASSIFICATIONS.has(finding.code);
}
