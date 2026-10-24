import type { Prisma, PrismaClient } from "@prisma/client";

import { getAuthoritativeDriverQualification } from "@/lib/services/authoritativeDriverQualificationService";
import { detectEvidenceConflicts } from "@/lib/services/driverQualificationEvidenceInventoryService";
import {
  PROVENANCE_CONTRACT_VERSION,
  buildQualificationProvenance,
  type DriverQualificationProvenance,
  type ProvenanceRows,
} from "@/lib/services/qualificationFindingProvenance";
import type { QualificationInputs } from "@/lib/services/qualificationService";

/**
 * Stage 0 D-1 PR 2: read-only loader for finding provenance. Reads one driver (or one fleet) inside the caller's
 * transaction, runs the unchanged authoritative evaluator, and labels its result. Writes nothing, takes no lock,
 * stores nothing, and never feeds back into any decision.
 */

const INTAKE_RELATIONS = ["documents", "requirements", "licenses", "endorsements", "medicalQualifications", "drugTests", "workHistory", "accidentHistory", "violationHistory"] as const;

export type DriverProvenanceReport = {
  driverId: string;
  fleetId: string;
  qualificationStatus: string | "UNKNOWN";
  evaluationCompleted: boolean;
  provenance: DriverQualificationProvenance;
};

/** Provenance for one driver of one fleet. Throws if the driver is not in that fleet (fail closed). */
export async function loadDriverQualificationProvenance(
  tx: Prisma.TransactionClient,
  driverId: string,
  fleetId: string,
  asOf: Date = new Date(),
): Promise<DriverProvenanceReport> {
  if (!driverId?.trim() || !fleetId?.trim()) throw new Error("driverId and fleetId are required");
  const driver = await tx.driver.findUnique({ where: { id: driverId } });
  if (!driver || driver.fleetId !== fleetId) throw new Error("Driver not found in this fleet");

  let reasonCodes: string[] | null = null;
  let qualificationStatus = "UNKNOWN";
  try {
    const evaluation = await getAuthoritativeDriverQualification(tx, driverId, fleetId);
    reasonCodes = evaluation.reasonCodes;
    qualificationStatus = evaluation.status;
  } catch {
    // Fail closed: an evaluation that could not complete leaves every item UNKNOWN.
  }

  const intake = await tx.driverIntake.findFirst({
    where: { driverId, fleetId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: {
      documents: true, requirements: true, licenses: true, endorsements: true, medicalQualifications: true,
      drugTests: true, workHistory: true, accidentHistory: true, violationHistory: true,
    },
  });
  const ids = (rows: Array<{ id: string }>) => (rows.length > 0 ? rows.map((row) => row.id) : ["__none__"]);
  const verificationSources = intake
    ? await tx.verificationSource.findMany({
        where: {
          OR: [
            { driverDocumentId: { in: ids(intake.documents) } },
            { driverLicenseId: { in: ids(intake.licenses) } },
            { medicalQualificationId: { in: ids(intake.medicalQualifications) } },
            { drugTestRecordId: { in: ids(intake.drugTests) } },
            { driverIntakeRequirementId: { in: ids(intake.requirements) } },
          ],
        },
      })
    : [];

  const rows: ProvenanceRows = {
    fleetId,
    documents: intake?.documents ?? [],
    requirements: intake?.requirements ?? [],
    licenses: intake?.licenses ?? [],
    medicalQualifications: intake?.medicalQualifications ?? [],
    drugTests: intake?.drugTests ?? [],
    workHistory: intake?.workHistory ?? [],
    accidentHistory: intake?.accidentHistory ?? [],
    violationHistory: intake?.violationHistory ?? [],
    verificationSources,
  };
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
  const intakeRecord: Record<string, unknown> | null = intake ? { ...intake } : null;
  if (intakeRecord) for (const key of INTAKE_RELATIONS) delete intakeRecord[key];
  const legacyInputs = intake
    ? ({
        driver,
        intake: intakeRecord,
        documents: intake.documents,
        requirements: intake.requirements,
        licenses: intake.licenses,
        endorsements: intake.endorsements,
        medicalQualifications: intake.medicalQualifications,
        drugTests: intake.drugTests,
        workHistory: intake.workHistory,
        accidentHistory: intake.accidentHistory,
        violationHistory: intake.violationHistory,
        verificationSources,
      } as unknown as QualificationInputs)
    : null;

  return {
    driverId,
    fleetId,
    qualificationStatus,
    evaluationCompleted: reasonCodes !== null,
    provenance: buildQualificationProvenance({ reasonCodes, conflicts, rows, legacyInputs }),
  };
}

export type FleetProvenanceSummary = {
  contractVersion: typeof PROVENANCE_CONTRACT_VERSION;
  fleetId: string;
  readOnly: true;
  drivers: number;
  administrativeClassificationActive: false;
  regulatoryCompleteness: "NOT_ESTABLISHED";
  /** category|classificationReason -> number of findings */
  findings: Record<string, number>;
  /** attribution|sourceEvidence -> number of findings */
  attribution: Record<string, number>;
  /** requirementId -> provenanceState -> drivers; every state present */
  itemProvenance: Record<string, Record<string, number>>;
};

const PROVENANCE_STATES = ["VERIFIED", "INCOMPLETE", "NOT_VERIFIED", "MISSING", "CONFLICTING"] as const;

/** Aggregate counts for one fleet. Read-only; no ids, names or emails in the output. */
export async function buildFleetProvenanceSummary(tx: Prisma.TransactionClient, fleetId: string): Promise<FleetProvenanceSummary> {
  if (!fleetId?.trim()) throw new Error("fleetId is required: the summary is scoped to exactly one fleet");
  const fleet = await tx.fleet.findUnique({ where: { id: fleetId }, select: { id: true } });
  if (!fleet) throw new Error("Fleet not found");
  const drivers = await tx.driver.findMany({ where: { fleetId }, orderBy: { id: "asc" }, select: { id: true } });
  const findings = new Map<string, number>();
  const attribution = new Map<string, number>();
  const items = new Map<string, Record<string, number>>();
  const bump = (map: Map<string, number>, key: string) => map.set(key, (map.get(key) ?? 0) + 1);

  for (const { id } of drivers) {
    const report = await loadDriverQualificationProvenance(tx, id, fleetId);
    for (const finding of report.provenance.findings) {
      bump(findings, `${finding.category}|${finding.classificationReason}`);
      bump(attribution, `${finding.attribution}|${finding.sourceEvidence}`);
    }
    for (const item of report.provenance.items) {
      const row = items.get(item.requirementId) ?? Object.fromEntries(PROVENANCE_STATES.map((state) => [state, 0]));
      row[item.provenanceState] += 1;
      items.set(item.requirementId, row);
    }
  }
  const sorted = <T,>(map: Map<string, T>) => Object.fromEntries([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
  return {
    contractVersion: PROVENANCE_CONTRACT_VERSION,
    fleetId,
    readOnly: true,
    drivers: drivers.length,
    administrativeClassificationActive: false,
    regulatoryCompleteness: "NOT_ESTABLISHED",
    findings: sorted(findings),
    attribution: sorted(attribution),
    itemProvenance: sorted(items),
  };
}

/** Runs the fleet summary in a READ ONLY, REPEATABLE READ transaction; a write inside it fails at the database. */
export function runFleetProvenanceSummary(prisma: PrismaClient, fleetId: string) {
  return prisma.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe("SET TRANSACTION READ ONLY");
      return buildFleetProvenanceSummary(tx, fleetId);
    },
    { isolationLevel: "RepeatableRead", maxWait: 10_000, timeout: 300_000 },
  );
}
