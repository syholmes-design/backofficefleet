import type { Prisma, PrismaClient } from "@prisma/client";

import {
  AUTHORITATIVE_DRIVER_QUALIFICATION_POLICY_VERSION,
  getAuthoritativeDriverQualification,
  type AuthoritativeDriverQualificationStatus,
} from "@/lib/services/authoritativeDriverQualificationService";
import {
  CLASSIFICATION_CONTRACT_VERSION,
  CURRENTLY_MODELED_MANDATORY_ITEM_KEYS,
  KNOWN_REGISTRY_GAPS,
  QUALIFICATION_EVIDENCE_STATES,
  summarizeModeledMandatoryItems,
  type EvidenceConflict,
  type ModeledMandatorySummary,
  type QualificationEvidenceState,
  type QualificationFindingCategory,
} from "@/lib/services/qualificationEvidenceClassification";

/**
 * Stage 0 D-1 PR 1: read-only driver qualification evidence inventory.
 *
 * Reads one fleet at a time, evaluates each driver with the unchanged authoritative evaluator and labels the
 * result with the additive classification contract. It writes nothing: the entry point runs in a READ ONLY,
 * REPEATABLE READ transaction, so any write attempt fails and the whole run sees one snapshot. It writes no
 * qualification snapshot, takes no advisory lock that mutates state, and its output is aggregate by default
 * (no names, emails or document contents; driver ids only when explicitly requested).
 *
 * Affiliation: the data model has one carrier affiliation per driver (Driver.fleetId). There is no multi-carrier
 * affiliation table, and data about other fleets is deliberately never read or reported.
 */

export const EVIDENCE_INVENTORY_SCHEMA_VERSION = "bof-stage0-d1-evidence-inventory-v1" as const;

type Doc = {
  id: string;
  type: string;
  status: string;
  fleetId: string;
  uploadedAt: Date;
  versionNumber: number;
  supersededAt: Date | null;
  verificationExpiresAt: Date | null;
};
type Structured = { status: string; verificationStatus: string | null; expirationDate: Date | null };
type Requirement = { requirementType: string; status: string; exceptionReason: string | null; satisfiedByDocumentId: string | null };

export type ConflictDetectionInput = {
  asOf: Date;
  documents: Doc[];
  requirements: Requirement[];
  licenses: Structured[];
  medicalQualifications: Structured[];
  drugTests: Structured[];
};

const DOCUMENT_TYPE_KEY: Record<string, string> = {
  DRIVER_LICENSE: "DRIVER_LICENSE",
  MEDICAL: "MEDICAL_CERTIFICATE",
  DRUG_TEST: "PRE_EMPLOYMENT_DRUG_TEST",
  WORK_HISTORY: "EMPLOYMENT_APPLICATION",
};
const KEY_DOCUMENT_TYPE = Object.fromEntries(Object.entries(DOCUMENT_TYPE_KEY).map(([type, key]) => [key, type]));
const REQUIREMENT_TYPE_KEY: Record<string, string> = {
  ...DOCUMENT_TYPE_KEY,
  CLEARINGHOUSE_PRE_EMPLOYMENT_QUERY: "CLEARINGHOUSE_PRE_EMPLOYMENT_QUERY",
  ROAD_TEST_OR_EQUIVALENT: "ROAD_TEST_OR_EQUIVALENT",
};
const VERIFIED = new Set(["VERIFIED", "CERTIFIED"]);

const pastAt = (date: Date | null, asOf: Date) => Boolean(date) && (date as Date).getTime() < asOf.getTime();
const documentVerifiedCurrent = (doc: Doc, asOf: Date) => VERIFIED.has(doc.status) && !pastAt(doc.verificationExpiresAt, asOf);
const documentNotCurrent = (doc: Doc, asOf: Date) => doc.status === "REJECTED" || doc.status === "EXPIRED" || pastAt(doc.verificationExpiresAt, asOf);
const structuredCurrent = (rows: Structured[], asOf: Date) =>
  rows.some((row) => row.status === "ACTIVE" && VERIFIED.has(row.verificationStatus ?? "") && !pastAt(row.expirationDate, asOf));
const structuredNotCurrent = (rows: Structured[], asOf: Date) =>
  rows.length > 0 && rows.every((row) => row.status === "EXPIRED" || row.status === "REJECTED" || pastAt(row.expirationDate, asOf));

/** The newest non-superseded document of a type (same rule as the evaluator). */
function currentDocument(documents: Doc[], type: string) {
  return (
    documents
      .filter((doc) => doc.type === type && !doc.supersededAt)
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime() || b.versionNumber - a.versionNumber)[0] ?? null
  );
}

/**
 * Pure. Reports only objective contradictions between records; it never upgrades evidence. Document "verified"
 * here is status-based and does not apply the evaluator's compliance-verifier rule, so a contradiction reported
 * here is additional to, not a substitute for, the evaluator's own findings.
 */
export function detectEvidenceConflicts(input: ConflictDetectionInput): EvidenceConflict[] {
  const { asOf, documents } = input;
  const found = new Map<string, EvidenceConflict>();
  const add = (evidenceKey: string, kind: EvidenceConflict["kind"]) => found.set(`${evidenceKey}|${kind}`, { evidenceKey, kind });

  for (const [type, key] of Object.entries(DOCUMENT_TYPE_KEY)) {
    const live = documents.filter((doc) => doc.type === type && !doc.supersededAt);
    if (live.length > 1 && new Set(live.map((doc) => doc.status)).size > 1) add(key, "MULTIPLE_CURRENT_VERSIONS");
  }

  const structured: Array<[string, Structured[]]> = [
    ["DRIVER_LICENSE", input.licenses],
    ["MEDICAL_CERTIFICATE", input.medicalQualifications],
    ["PRE_EMPLOYMENT_DRUG_TEST", input.drugTests],
  ];
  for (const [key, rows] of structured) {
    const doc = currentDocument(documents, KEY_DOCUMENT_TYPE[key]);
    if (!doc) continue;
    if (documentVerifiedCurrent(doc, asOf) && structuredNotCurrent(rows, asOf)) add(key, "STRUCTURED_RECORD_CONTRADICTS_DOCUMENT");
    if (documentNotCurrent(doc, asOf) && structuredCurrent(rows, asOf)) add(key, "STRUCTURED_RECORD_CONTRADICTS_DOCUMENT");
  }

  for (const requirement of input.requirements) {
    const key = REQUIREMENT_TYPE_KEY[requirement.requirementType];
    if (!key) continue;
    if (requirement.status === "EXCEPTION" || (requirement.exceptionReason ?? "").trim() !== "") add(key, "WAIVER_ON_MANDATORY_ITEM");
    if (requirement.status === "SATISFIED") {
      const linked = KEY_DOCUMENT_TYPE[key]
        ? currentDocument(documents, KEY_DOCUMENT_TYPE[key])
        : documents.find((doc) => doc.id === requirement.satisfiedByDocumentId) ?? null;
      if (!linked || !documentVerifiedCurrent(linked, asOf)) add(key, "REQUIREMENT_CLAIMS_SATISFIED_WITHOUT_VERIFIED_DOCUMENT");
    }
  }
  return [...found.values()].sort((a, b) => a.evidenceKey.localeCompare(b.evidenceKey) || a.kind.localeCompare(b.kind));
}

export type DriverEvidenceRecord = {
  driverId: string;
  driverStatus: string;
  /** The driver's only carrier affiliation in the data model. */
  affiliation: { fleetId: string; driverId: string; driverStatus: string; userLinked: boolean; activeFleetMembership: boolean };
  /** UNKNOWN when the evaluation did not complete. */
  qualificationStatus: AuthoritativeDriverQualificationStatus | "UNKNOWN";
  evaluationCompleted: boolean;
  intakeCount: number;
  priorCertificationContradicted: boolean;
  crossFleetEvidenceRows: number;
  summary: ModeledMandatorySummary;
};

export type DriverQualificationEvidenceInventory = {
  schemaVersion: typeof EVIDENCE_INVENTORY_SCHEMA_VERSION;
  classificationContractVersion: typeof CLASSIFICATION_CONTRACT_VERSION;
  evaluatorPolicyVersion: string;
  fleetId: string;
  /** Clock used for conflict detection; the evaluator uses the execution time. Excluded from reproducibility comparisons. */
  asOf: string;
  readOnly: true;
  regulatoryCompleteness: "NOT_ESTABLISHED";
  knownRegistryGaps: typeof KNOWN_REGISTRY_GAPS;
  totals: {
    drivers: number;
    byDriverStatus: Record<string, number>;
    byQualificationStatus: Record<string, number>;
    withoutIntake: number;
    withMultipleIntakes: number;
    evaluationFailed: number;
    allCurrentlyModeledMandatoryItemsVerified: number;
    notAllCurrentlyModeledMandatoryItemsVerified: number;
    priorCertificationContradicted: number;
    crossFleetEvidenceRows: number;
  };
  /** item key -> evidence state -> driver count. Every item and every state is present (zero is explicit). */
  itemStates: Record<string, Record<QualificationEvidenceState, number>>;
  reasonCodes: Record<string, { drivers: number; category: QualificationFindingCategory }>;
  conflicts: Record<string, number>;
  drivers?: DriverEvidenceRecord[];
};

const sortedRecord = <T,>(entries: Iterable<[string, T]>): Record<string, T> =>
  Object.fromEntries([...entries].sort(([a], [b]) => a.localeCompare(b)));
const bump = (map: Map<string, number>, key: string) => map.set(key, (map.get(key) ?? 0) + 1);

export type InventoryOptions = {
  fleetId: string;
  includeDrivers?: boolean;
  /** Restricts the run to these drivers of the fleet (ids from other fleets simply match nothing). Absent = whole fleet. */
  driverIds?: readonly string[];
  /** Conflict-detection clock. Defaults to now; tests pass a fixed value. */
  asOf?: Date;
};

/** Builds the inventory on a caller-provided (ideally read-only) transaction. Performs reads only. */
export async function buildDriverQualificationEvidenceInventory(
  tx: Prisma.TransactionClient,
  options: InventoryOptions,
): Promise<DriverQualificationEvidenceInventory> {
  const fleetId = options.fleetId?.trim();
  if (!fleetId) throw new Error("fleetId is required: the inventory is scoped to exactly one fleet");
  const asOf = options.asOf ?? new Date();

  const fleet = await tx.fleet.findUnique({ where: { id: fleetId }, select: { id: true } });
  if (!fleet) throw new Error("Fleet not found");

  const drivers = await tx.driver.findMany({
    where: { fleetId, ...(options.driverIds ? { id: { in: [...options.driverIds] } } : {}) },
    orderBy: { id: "asc" },
    select: { id: true, fleetId: true, status: true, userId: true },
  });

  const byDriverStatus = new Map<string, number>();
  const byQualificationStatus = new Map<string, number>();
  const reasonCodes = new Map<string, { drivers: number; category: QualificationFindingCategory }>();
  const conflictCounts = new Map<string, number>();
  const itemStates = new Map<string, Record<QualificationEvidenceState, number>>(
    CURRENTLY_MODELED_MANDATORY_ITEM_KEYS.map((key) => [key, Object.fromEntries(QUALIFICATION_EVIDENCE_STATES.map((s) => [s, 0])) as Record<QualificationEvidenceState, number>]),
  );
  const records: DriverEvidenceRecord[] = [];
  const totals = {
    withoutIntake: 0, withMultipleIntakes: 0, evaluationFailed: 0, verified: 0, notVerified: 0, contradicted: 0, crossFleet: 0,
  };

  for (const driver of drivers) {
    bump(byDriverStatus, driver.status);

    // Queries run one at a time: they share the transaction's single connection.
    const intakeCount = await tx.driverIntake.count({ where: { driverId: driver.id, fleetId } });
    const intake = await tx.driverIntake.findFirst({
      where: { driverId: driver.id, fleetId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      include: { documents: true, requirements: true, licenses: true, medicalQualifications: true, drugTests: true },
    });
    if (intakeCount === 0) totals.withoutIntake += 1;
    if (intakeCount > 1) totals.withMultipleIntakes += 1;

    let evaluation: Awaited<ReturnType<typeof getAuthoritativeDriverQualification>> | null = null;
    try {
      evaluation = await getAuthoritativeDriverQualification(tx, driver.id, fleetId);
    } catch {
      // Fail closed: an evaluation that could not complete is UNKNOWN, never a pass.
      totals.evaluationFailed += 1;
    }

    const conflicts = intake
      ? detectEvidenceConflicts({
          asOf,
          documents: intake.documents,
          requirements: intake.requirements,
          licenses: intake.licenses,
          medicalQualifications: intake.medicalQualifications,
          drugTests: intake.drugTests,
        })
      : [];
    const summary = summarizeModeledMandatoryItems(evaluation ? evaluation.reasonCodes : null, conflicts);
    const qualificationStatus = evaluation ? evaluation.status : "UNKNOWN";
    bump(byQualificationStatus, qualificationStatus);

    const priorCertificationContradicted = Boolean(intake?.isComplianceCertified) && qualificationStatus !== "QUALIFIED" && qualificationStatus !== "CONDITIONAL";
    const crossFleetEvidenceRows = intake ? intake.documents.filter((doc) => doc.fleetId !== fleetId).length : 0;
    if (priorCertificationContradicted) totals.contradicted += 1;
    totals.crossFleet += crossFleetEvidenceRows;
    if (summary.allCurrentlyModeledMandatoryItemsVerified) totals.verified += 1;
    else totals.notVerified += 1;

    for (const item of summary.items) (itemStates.get(item.key) as Record<QualificationEvidenceState, number>)[item.evidenceState] += 1;
    for (const finding of summary.findings) {
      const existing = reasonCodes.get(finding.code);
      reasonCodes.set(finding.code, { drivers: (existing?.drivers ?? 0) + 1, category: finding.category });
    }
    for (const conflict of summary.conflicts) bump(conflictCounts, `${conflict.evidenceKey}:${conflict.kind}`);

    if (options.includeDrivers) {
      const membership = driver.userId
        ? await tx.fleetMembership.count({ where: { userId: driver.userId, fleetId, status: "ACTIVE" } })
        : 0;
      records.push({
        driverId: driver.id,
        driverStatus: driver.status,
        affiliation: {
          fleetId,
          driverId: driver.id,
          driverStatus: driver.status,
          userLinked: Boolean(driver.userId),
          activeFleetMembership: membership > 0,
        },
        qualificationStatus,
        evaluationCompleted: evaluation !== null,
        intakeCount,
        priorCertificationContradicted,
        crossFleetEvidenceRows,
        summary,
      });
    }
  }

  return {
    schemaVersion: EVIDENCE_INVENTORY_SCHEMA_VERSION,
    classificationContractVersion: CLASSIFICATION_CONTRACT_VERSION,
    evaluatorPolicyVersion: AUTHORITATIVE_DRIVER_QUALIFICATION_POLICY_VERSION,
    fleetId,
    asOf: asOf.toISOString(),
    readOnly: true,
    regulatoryCompleteness: "NOT_ESTABLISHED",
    knownRegistryGaps: KNOWN_REGISTRY_GAPS,
    totals: {
      drivers: drivers.length,
      byDriverStatus: sortedRecord(byDriverStatus),
      byQualificationStatus: sortedRecord(byQualificationStatus),
      withoutIntake: totals.withoutIntake,
      withMultipleIntakes: totals.withMultipleIntakes,
      evaluationFailed: totals.evaluationFailed,
      allCurrentlyModeledMandatoryItemsVerified: totals.verified,
      notAllCurrentlyModeledMandatoryItemsVerified: totals.notVerified,
      priorCertificationContradicted: totals.contradicted,
      crossFleetEvidenceRows: totals.crossFleet,
    },
    itemStates: sortedRecord(itemStates),
    reasonCodes: sortedRecord(reasonCodes),
    conflicts: sortedRecord(conflictCounts),
    ...(options.includeDrivers ? { drivers: records } : {}),
  };
}

/**
 * Runs the inventory in a READ ONLY, REPEATABLE READ transaction. A write inside it fails at the database.
 * This is the only supported entry point for operators and scripts.
 */
export function runDriverQualificationEvidenceInventory(prisma: PrismaClient, options: InventoryOptions) {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
      return buildDriverQualificationEvidenceInventory(tx, options);
    },
    { isolationLevel: "RepeatableRead", maxWait: 10_000, timeout: 300_000 },
  );
}
