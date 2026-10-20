import type { Prisma } from "@prisma/client";

import { evaluateQualification, type QualificationInputs } from "@/lib/services/qualificationService";

/**
 * Stage 0 authoritative driver qualification (BOF-STAGE0-RECONCILED-INTEGRATION-CONTRACT.md §1).
 *
 * The only driver input to movement authorization. It re-reads the driver's current qualification evidence
 * inside the caller's transaction and never reads DriverReadinessScore or stored qualification snapshots,
 * so no manual review, waiver or stale score can make a driver qualified. Read-only: it writes nothing.
 *
 * Status meaning:
 * - QUALIFIED: every mandatory item is documented, compliance-verified and current.
 * - CONDITIONAL: every mandatory item is satisfied; only internal BOF/fleet policy items are open.
 * - PENDING_COMPLIANCE: a mandatory item is missing, unverified or awaiting BOF Compliance determination.
 * - NOT_QUALIFIED: a mandatory item is expired or rejected, or a disqualifying record exists.
 * Only QUALIFIED, and CONDITIONAL with conditionalMovementPermitted, may support movement.
 *
 * The regulatory classification behind MANDATORY_QUALIFICATION_EVIDENCE is provisional and pending qualified
 * compliance/legal review; citations are references for that review, not legal conclusions.
 */

export const AUTHORITATIVE_DRIVER_QUALIFICATION_POLICY_VERSION = "bof-stage0-driver-qualification-v1" as const;

export type AuthoritativeDriverQualificationStatus = "QUALIFIED" | "CONDITIONAL" | "PENDING_COMPLIANCE" | "NOT_QUALIFIED";

export type AuthoritativeDriverQualification = {
  status: AuthoritativeDriverQualificationStatus;
  /** Always null: this evaluator is read-only and writes no snapshot. Movement records the determination in its own audit. */
  qualificationSnapshotId: string | null;
  reasonCodes: string[];
  summary: string;
  policyVersion: string;
  /** Required for CONDITIONAL movement authorization. False for PENDING_COMPLIANCE and NOT_QUALIFIED. */
  conditionalMovementPermitted: boolean;
  evaluatedAt: Date;
};

/** Thrown when evaluation cannot complete. Callers must treat it as a denial (fail closed). */
export class AuthoritativeQualificationError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = "AuthoritativeQualificationError";
  }
}

type EvidenceSource =
  | { kind: "DOCUMENT"; documentType: "DRIVER_LICENSE" | "MEDICAL" | "DRUG_TEST" | "WORK_HISTORY" }
  | { kind: "DETERMINATION"; requirementType: string };

export type MandatoryEvidence = {
  /** Stable evidence identifier used in reason codes (`<key>_MISSING`, `<key>_EXPIRED`, …). */
  key: string;
  label: string;
  source: EvidenceSource;
  /** Provisional reference for compliance/legal review. */
  provisionalCitation: string;
};

/**
 * Mandatory evidence registry (contract C4). Every entry is required whether or not the intake has a
 * requirement row for it, and none can be waived through exceptionReason or isRequired=false.
 * DETERMINATION entries are DriverIntakeRequirement rows of that requirementType, satisfied only by a
 * linked document (satisfiedByDocumentId) verified by BOF Compliance.
 */
export const MANDATORY_QUALIFICATION_EVIDENCE: readonly MandatoryEvidence[] = [
  {
    key: "DRIVER_LICENSE",
    label: "Commercial driver's license",
    source: { kind: "DOCUMENT", documentType: "DRIVER_LICENSE" },
    provisionalCitation: "49 CFR 383.23; 391.11(b)(5)",
  },
  {
    key: "MEDICAL_CERTIFICATE",
    label: "Medical examiner's certificate",
    source: { kind: "DOCUMENT", documentType: "MEDICAL" },
    provisionalCitation: "49 CFR 391.41; 391.43",
  },
  {
    key: "PRE_EMPLOYMENT_DRUG_TEST",
    label: "Pre-employment controlled-substances test (verified negative)",
    source: { kind: "DOCUMENT", documentType: "DRUG_TEST" },
    provisionalCitation: "49 CFR 382.301(a)",
  },
  {
    key: "EMPLOYMENT_APPLICATION",
    label: "Employment application and employment-history evidence",
    source: { kind: "DOCUMENT", documentType: "WORK_HISTORY" },
    provisionalCitation: "49 CFR 391.21",
  },
  {
    key: "CLEARINGHOUSE_PRE_EMPLOYMENT_QUERY",
    label: "Drug & Alcohol Clearinghouse pre-employment full query",
    source: { kind: "DETERMINATION", requirementType: "CLEARINGHOUSE_PRE_EMPLOYMENT_QUERY" },
    provisionalCitation: "49 CFR 382.701(a)",
  },
  {
    key: "ROAD_TEST_OR_EQUIVALENT",
    label: "Road test or accepted equivalent",
    source: { kind: "DETERMINATION", requirementType: "ROAD_TEST_OR_EQUIVALENT" },
    provisionalCitation: "49 CFR 391.31; 391.33",
  },
];

/** Requirement types owned by the registry; the shared evaluator skips their rows and any waiver on them. */
export const REGISTRY_OWNED_REQUIREMENT_TYPES: ReadonlySet<string> = new Set([
  "DRIVER_LICENSE",
  "MEDICAL",
  "DRUG_TEST",
  "WORK_HISTORY",
  "CLEARINGHOUSE_PRE_EMPLOYMENT_QUERY",
  "ROAD_TEST_OR_EQUIVALENT",
]);

/** Employment history must reach back this far from the intake date (49 CFR 391.21(b)(10), provisional). */
export const EMPLOYMENT_HISTORY_LOOKBACK_YEARS = 3;
/** Internal BOF review flag (owner decision), not a legal threshold: longer gaps need documented compliance review. */
export const EMPLOYMENT_GAP_REVIEW_DAYS = 30;

/** CONDITIONAL reasons that are internal policy items and may support movement. Anything else denies it. */
const MOVEMENT_PERMITTED_CONDITIONS = new Set(["REQUIREMENT_EXCEPTION", "WORK_HISTORY_GAP_REVIEW_REQUIRED"]);

const VERIFIED_DOCUMENT_STATUSES = new Set(["VERIFIED", "CERTIFIED"]);
const COMPLIANCE_REVIEW_ROLE = "BOF_COMPLIANCE_REVIEW";
const DAY_MS = 86_400_000;

const STATUS_SEVERITY: Record<AuthoritativeDriverQualificationStatus, number> = {
  QUALIFIED: 0,
  CONDITIONAL: 1,
  PENDING_COMPLIANCE: 2,
  NOT_QUALIFIED: 3,
};

type Finding = { code: string; status: Exclude<AuthoritativeDriverQualificationStatus, "QUALIFIED"> };
type DocumentRow = QualificationInputs["documents"][number];

function mostRestrictive(findings: Finding[]): AuthoritativeDriverQualificationStatus {
  return findings.reduce<AuthoritativeDriverQualificationStatus>(
    (worst, finding) => (STATUS_SEVERITY[finding.status] > STATUS_SEVERITY[worst] ? finding.status : worst),
    "QUALIFIED",
  );
}

function isPast(date: Date | null | undefined, asOf: Date) {
  return Boolean(date) && new Date(date as Date).getTime() < asOf.getTime();
}

/** The current version of a document type: newest upload that has not been superseded. */
function currentDocument(documents: DocumentRow[], type: string) {
  return (
    documents
      .filter((document) => document.type === type && !document.supersededAt)
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime() || b.versionNumber - a.versionNumber)[0] ?? null
  );
}

/**
 * Evaluates one document against the mandatory rules: present, compliance-verified, not rejected, not expired.
 * `complianceVerifierIds` holds users with an ACTIVE BOF_COMPLIANCE_REVIEW membership in the driver's fleet.
 */
function evaluateEvidenceDocument(
  key: string,
  document: DocumentRow | null,
  context: { asOf: Date; complianceVerifierIds: ReadonlySet<string>; driverUserId: string | null },
): Finding[] {
  if (!document) return [{ code: `${key}_MISSING`, status: "PENDING_COMPLIANCE" }];
  if (document.status === "REJECTED") return [{ code: `${key}_REJECTED`, status: "NOT_QUALIFIED" }];
  if (document.status === "EXPIRED" || isPast(document.verificationExpiresAt, context.asOf)) {
    return [{ code: `${key}_EXPIRED`, status: "NOT_QUALIFIED" }];
  }
  if (!VERIFIED_DOCUMENT_STATUSES.has(document.status)) return [{ code: `${key}_UNVERIFIED`, status: "PENDING_COMPLIANCE" }];
  const verifierId = document.status === "CERTIFIED" ? document.certifiedByUserId ?? document.verifiedByUserId : document.verifiedByUserId;
  const verifiedByCompliance =
    Boolean(verifierId) && context.complianceVerifierIds.has(verifierId as string) && verifierId !== context.driverUserId;
  if (!verifiedByCompliance) return [{ code: `${key}_NOT_COMPLIANCE_VERIFIED`, status: "PENDING_COMPLIANCE" }];
  return [];
}

type WorkHistoryRow = QualificationInputs["workHistory"][number];

/**
 * Employment-history rules (V6): only ACTIVE rows count; they must reach back the lookback period from the
 * intake date; internal gaps longer than the review threshold are a policy flag, not a disqualification.
 */
function evaluateEmploymentHistory(rows: WorkHistoryRow[], anchor: Date): Finding[] {
  const active = rows.filter((row) => row.status === "ACTIVE");
  if (active.length === 0) return [{ code: "WORK_HISTORY_MISSING", status: "PENDING_COMPLIANCE" }];
  if (active.some((row) => !row.startDate)) return [{ code: "WORK_HISTORY_INCOMPLETE", status: "PENDING_COMPLIANCE" }];

  const windowStart = new Date(anchor);
  windowStart.setUTCFullYear(windowStart.getUTCFullYear() - EMPLOYMENT_HISTORY_LOOKBACK_YEARS);
  const spans = active
    .map((row) => ({
      start: Math.max((row.startDate as Date).getTime(), windowStart.getTime()),
      end: Math.min((row.endDate ?? anchor).getTime(), anchor.getTime()),
    }))
    .filter((span) => span.end > span.start)
    .sort((a, b) => a.start - b.start);
  if (spans.length === 0) return [{ code: "WORK_HISTORY_INCOMPLETE", status: "PENDING_COMPLIANCE" }];

  const findings: Finding[] = [];
  const reviewMs = EMPLOYMENT_GAP_REVIEW_DAYS * DAY_MS;
  // Records that do not reach back to the start of the lookback period are incomplete.
  if (spans[0].start - windowStart.getTime() > reviewMs) {
    findings.push({ code: "WORK_HISTORY_INCOMPLETE", status: "PENDING_COMPLIANCE" });
  }
  let coveredUntil = spans[0].end;
  let longestGap = 0;
  for (const span of spans.slice(1)) {
    if (span.start > coveredUntil) longestGap = Math.max(longestGap, span.start - coveredUntil);
    coveredUntil = Math.max(coveredUntil, span.end);
  }
  longestGap = Math.max(longestGap, anchor.getTime() - coveredUntil);
  if (longestGap > reviewMs) findings.push({ code: "WORK_HISTORY_GAP_REVIEW_REQUIRED", status: "CONDITIONAL" });
  return findings;
}

const LEGACY_STATUS: Record<string, AuthoritativeDriverQualificationStatus> = {
  QUALIFIED: "QUALIFIED",
  CONDITIONALLY_QUALIFIED: "CONDITIONAL",
  PENDING_REVIEW: "PENDING_COMPLIANCE",
  NOT_QUALIFIED: "NOT_QUALIFIED",
};

function summarize(status: AuthoritativeDriverQualificationStatus, reasonCodes: string[]) {
  const base =
    status === "QUALIFIED"
      ? "Driver satisfies all mandatory qualification requirements."
      : status === "CONDITIONAL"
        ? "Driver satisfies all mandatory qualification requirements; internal policy items remain open."
        : status === "PENDING_COMPLIANCE"
          ? "Mandatory qualification evidence is missing or awaiting BOF Compliance determination."
          : "Driver is not qualified: mandatory qualification evidence is expired, rejected or disqualifying.";
  return reasonCodes.length > 0 ? `${base} Reasons: ${reasonCodes.join(", ")}.` : base;
}

function determination(
  findings: Finding[],
  evaluatedAt: Date,
): AuthoritativeDriverQualification {
  const status = mostRestrictive(findings);
  const reasonCodes = [...new Set(findings.map((finding) => finding.code))];
  const conditionalMovementPermitted =
    status === "QUALIFIED" ||
    (status === "CONDITIONAL" && findings.every((finding) => MOVEMENT_PERMITTED_CONDITIONS.has(finding.code)));
  return {
    status,
    qualificationSnapshotId: null,
    reasonCodes,
    summary: summarize(status, reasonCodes),
    policyVersion: AUTHORITATIVE_DRIVER_QUALIFICATION_POLICY_VERSION,
    conditionalMovementPermitted,
    evaluatedAt,
  };
}

/**
 * MUST be called inside the movement transaction when one exists (contract §1.1). Callers take
 * lockDriverReadinessWrite(tx, driverId) first. Throws AuthoritativeQualificationError on any read failure;
 * a thrown error must be treated as a denial.
 */
export async function getAuthoritativeDriverQualification(
  tx: Prisma.TransactionClient,
  driverId: string,
  fleetId: string,
): Promise<AuthoritativeDriverQualification> {
  const evaluatedAt = new Date();
  if (!driverId?.trim() || !fleetId?.trim()) {
    return determination([{ code: "DRIVER_CONTEXT_REQUIRED", status: "NOT_QUALIFIED" }], evaluatedAt);
  }

  try {
    const driver = await tx.driver.findUnique({ where: { id: driverId }, include: { fleet: true } });
    if (!driver) return determination([{ code: "DRIVER_NOT_FOUND", status: "NOT_QUALIFIED" }], evaluatedAt);
    // Fleet boundary: a driver is evaluated only within its own fleet.
    if (driver.fleetId !== fleetId) return determination([{ code: "DRIVER_FLEET_MISMATCH", status: "NOT_QUALIFIED" }], evaluatedAt);

    const findings: Finding[] = [];

    // Disqualifying records count across every intake of the driver, not only the latest.
    // Queries run one at a time: they share the caller's transaction connection.
    const disqualifyingAccidents = await tx.accidentHistory.count({ where: { driverId, status: "REJECTED" } });
    const disqualifyingViolations = await tx.violationHistory.count({ where: { driverId, status: "REJECTED" } });
    if (disqualifyingAccidents > 0) findings.push({ code: "DISQUALIFYING_ACCIDENT", status: "NOT_QUALIFIED" });
    if (disqualifyingViolations > 0) findings.push({ code: "DISQUALIFYING_VIOLATION", status: "NOT_QUALIFIED" });

    const intake = await tx.driverIntake.findFirst({
      where: { driverId, fleetId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: {
        documents: true,
        requirements: true,
        licenses: true,
        endorsements: true,
        medicalQualifications: true,
        drugTests: true,
        workHistory: true,
        accidentHistory: true,
        violationHistory: true,
      },
    });
    if (!intake) {
      findings.push({ code: "QUALIFICATION_RECORDS_MISSING", status: "PENDING_COMPLIANCE" });
      return determination(findings, evaluatedAt);
    }

    const { documents, requirements, licenses, endorsements, medicalQualifications, drugTests, workHistory, accidentHistory, violationHistory, ...intakeRecord } = intake;
    const ids = (rows: Array<{ id: string }>) => (rows.length > 0 ? rows.map((row) => row.id) : ["__none__"]);
    const verificationSources = await tx.verificationSource.findMany({
      where: {
        OR: [
          { driverDocumentId: { in: ids(documents) } },
          { driverLicenseId: { in: ids(licenses) } },
          { medicalQualificationId: { in: ids(medicalQualifications) } },
          { drugTestRecordId: { in: ids(drugTests) } },
          { driverIntakeRequirementId: { in: ids(requirements) } },
        ],
      },
    });
    // Verifiers count only while they hold an ACTIVE BOF_COMPLIANCE_REVIEW membership in this fleet.
    const complianceMembers = await tx.fleetMembership.findMany({
      where: { fleetId, status: "ACTIVE", role: { code: COMPLIANCE_REVIEW_ROLE }, user: { status: "ACTIVE" } },
      select: { userId: true },
    });
    const evidenceContext = {
      asOf: evaluatedAt,
      complianceVerifierIds: new Set(complianceMembers.map((member) => member.userId)),
      driverUserId: driver.userId ?? null,
    };

    // Existing shared rules for everything the registry does not own (other requirement rows, structured
    // license/medical/drug-test records, pending verifications). Waivers on registry types are ignored.
    const legacy = evaluateQualification(
      {
        driver,
        intake: intakeRecord,
        documents,
        requirements,
        licenses,
        endorsements,
        medicalQualifications,
        drugTests,
        workHistory,
        accidentHistory,
        violationHistory,
        verificationSources,
      } as unknown as QualificationInputs,
      { registryOwnedRequirementTypes: REGISTRY_OWNED_REQUIREMENT_TYPES, skipWorkHistoryCheck: true },
    );
    const legacyStatus = LEGACY_STATUS[legacy.status] ?? "NOT_QUALIFIED";
    if (legacyStatus !== "QUALIFIED") {
      const codes = legacy.reasonCodes.length > 0 ? legacy.reasonCodes : ["QUALIFICATION_RULES_NOT_MET"];
      for (const code of codes) findings.push({ code, status: legacyStatus as Finding["status"] });
    }

    // Mandatory evidence registry (V5): required whether or not a requirement row exists.
    for (const evidence of MANDATORY_QUALIFICATION_EVIDENCE) {
      if (evidence.source.kind === "DOCUMENT") {
        findings.push(...evaluateEvidenceDocument(evidence.key, currentDocument(documents, evidence.source.documentType), evidenceContext));
        continue;
      }
      const requirementType = evidence.source.requirementType;
      const rows = requirements.filter((requirement) => requirement.requirementType === requirementType);
      if (rows.length === 0) {
        findings.push({ code: `${evidence.key}_NOT_RECORDED`, status: "PENDING_COMPLIANCE" });
        continue;
      }
      // A determination counts only through its linked, compliance-verified document on this intake.
      const linked = rows
        .map((row) => documents.find((document) => document.id === row.satisfiedByDocumentId) ?? null)
        .filter((document): document is DocumentRow => document !== null);
      if (linked.length === 0) {
        findings.push({ code: `${evidence.key}_NOT_RECORDED`, status: "PENDING_COMPLIANCE" });
        continue;
      }
      const results = linked.map((document) => evaluateEvidenceDocument(evidence.key, document, evidenceContext));
      const satisfied = results.find((result) => result.length === 0);
      if (!satisfied) findings.push(...results.flat());
    }

    // Drug-test results recorded as structured records also block when rejected or still pending.
    const latestDrugTest = [...drugTests].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0];
    if (latestDrugTest?.status === "REJECTED" || latestDrugTest?.verificationStatus === "REJECTED") {
      findings.push({ code: "PRE_EMPLOYMENT_DRUG_TEST_REJECTED", status: "NOT_QUALIFIED" });
    }

    // Employment history (V6).
    findings.push(...evaluateEmploymentHistory(workHistory, intakeRecord.submittedAt ?? intakeRecord.createdAt));

    return determination(findings, evaluatedAt);
  } catch (error) {
    throw new AuthoritativeQualificationError("Driver qualification could not be evaluated", error);
  }
}
