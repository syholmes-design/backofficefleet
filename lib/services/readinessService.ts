import { DriverReadinessState, Prisma, QualificationDisposition } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { authorizedFleetAccess, type SessionUserLike } from "@/lib/services/intakeService";
import { getLatestQualificationSnapshot } from "@/lib/services/qualificationService";

export const READINESS_POLICY_VERSION = "bof-step10-readiness-v1" as const;
export const READINESS_BLOCKED_NO_QUALIFICATION_SNAPSHOT =
  "READINESS EVALUATION BLOCKED — NO CURRENT QUALIFICATION SNAPSHOT" as const;

export type ReadinessReasonCode =
  | "QUALIFICATION_NOT_COMPLETE"
  | "QUALIFICATION_PENDING_REVIEW"
  | "MEDICAL_EXPIRING"
  | "MEDICAL_EXPIRED"
  | "LICENSE_EXPIRING"
  | "LICENSE_EXPIRED"
  | "DRUG_TEST_PENDING"
  | "DRUG_TEST_REJECTED"
  | "DISQUALIFYING_VIOLATION"
  | "DISQUALIFYING_ACCIDENT"
  | "OPERATIONAL_CREDENTIAL_MISSING"
  | "MANUAL_READINESS_REVIEW"
  | "FLEET_POLICY_BLOCK"
  | "FLEET_POLICY_CONDITIONAL";

export type ReadinessEvaluation = {
  status: DriverReadinessState;
  reasonCodes: ReadinessReasonCode[];
  summary: string;
  policyVersion: string;
};

export type ReadinessInputs = {
  driver: Awaited<ReturnType<typeof prisma.driver.findUnique>> & { fleet?: { id: string } };
  intake: Awaited<ReturnType<typeof prisma.driverIntake.findUnique>>;
  qualificationSnapshot: Awaited<ReturnType<typeof prisma.driverQualificationSnapshot.findFirst>>;
  documents: Awaited<ReturnType<typeof prisma.driverDocument.findMany>>;
  requirements: Awaited<ReturnType<typeof prisma.driverIntakeRequirement.findMany>>;
  licenses: Awaited<ReturnType<typeof prisma.driverLicense.findMany>>;
  medicalQualifications: Awaited<ReturnType<typeof prisma.medicalQualification.findMany>>;
  drugTests: Awaited<ReturnType<typeof prisma.drugTestRecord.findMany>>;
  accidentHistory: Awaited<ReturnType<typeof prisma.accidentHistory.findMany>>;
  violationHistory: Awaited<ReturnType<typeof prisma.violationHistory.findMany>>;
  verificationSources: Awaited<ReturnType<typeof prisma.verificationSource.findMany>>;
};

const BLOCKING_REASON_CODES = new Set<ReadinessReasonCode>([
  "QUALIFICATION_NOT_COMPLETE",
  "QUALIFICATION_PENDING_REVIEW",
  "MEDICAL_EXPIRED",
  "LICENSE_EXPIRED",
  "DRUG_TEST_REJECTED",
  "DISQUALIFYING_VIOLATION",
  "DISQUALIFYING_ACCIDENT",
  "OPERATIONAL_CREDENTIAL_MISSING",
  "FLEET_POLICY_BLOCK",
]);

const CONDITIONAL_REASON_CODES = new Set<ReadinessReasonCode>([
  "MEDICAL_EXPIRING",
  "LICENSE_EXPIRING",
  "DRUG_TEST_PENDING",
  "MANUAL_READINESS_REVIEW",
  "FLEET_POLICY_CONDITIONAL",
]);

const OPERATIONAL_REQUIREMENT_TYPES = new Set(["DRIVER_LICENSE", "MEDICAL", "DRUG_TEST"]);

function addReason(reasons: ReadinessReasonCode[], code: ReadinessReasonCode) {
  if (!reasons.includes(code)) {
    reasons.push(code);
  }
}

function isExpired(date: Date | string | null | undefined) {
  if (!date) {
    return false;
  }
  return new Date(date).getTime() < Date.now();
}

function getLatestByDate<T>(
  items: T[],
  getPrimaryDate: (item: T) => Date | string | null | undefined,
  getSecondaryDate?: (item: T) => Date | string | null | undefined,
) {
  return [...items].sort((left, right) => {
    const rightPrimary = new Date(getPrimaryDate(right) ?? 0).getTime();
    const leftPrimary = new Date(getPrimaryDate(left) ?? 0).getTime();
    if (rightPrimary !== leftPrimary) {
      return rightPrimary - leftPrimary;
    }

    const rightSecondary = new Date(getSecondaryDate?.(right) ?? 0).getTime();
    const leftSecondary = new Date(getSecondaryDate?.(left) ?? 0).getTime();
    return rightSecondary - leftSecondary;
  })[0] ?? null;
}

function getLatestDocumentForType(
  documents: ReadinessInputs["documents"],
  requirementType: string,
) {
  return getLatestByDate(
    documents.filter((document) => document.type === requirementType),
    (document) => document.uploadedAt,
    (document) => document.updatedAt,
  );
}

function getLatestLicense(licenses: ReadinessInputs["licenses"]) {
  return getLatestByDate(
    licenses,
    (license) => license.expirationDate ?? license.updatedAt,
    (license) => license.createdAt,
  );
}

function getLatestMedicalQualification(records: ReadinessInputs["medicalQualifications"]) {
  return getLatestByDate(
    records,
    (record) => record.expirationDate ?? record.updatedAt,
    (record) => record.createdAt,
  );
}

function getLatestDrugTest(records: ReadinessInputs["drugTests"]) {
  return getLatestByDate(
    records,
    (record) => record.testDate ?? record.updatedAt,
    (record) => record.createdAt,
  );
}

function hasSupportingOperationalCredential(inputs: ReadinessInputs, requirementType: string) {
  const matchingDocument = getLatestDocumentForType(inputs.documents, requirementType);
  if (matchingDocument) {
    return true;
  }

  switch (requirementType) {
    case "DRIVER_LICENSE":
      return inputs.licenses.length > 0;
    case "MEDICAL":
      return inputs.medicalQualifications.length > 0;
    case "DRUG_TEST":
      return inputs.drugTests.length > 0;
    default:
      return true;
  }
}

export async function assembleReadinessInputs(
  sessionUser: SessionUserLike | null | undefined,
  driverId: string,
  intakeId: string,
): Promise<ReadinessInputs> {
  if (!sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }

  const intake = await prisma.driverIntake.findUnique({
    where: { id: intakeId },
    include: {
      driver: true,
      fleet: true,
    },
  });

  if (!intake) {
    throw Object.assign(new Error("DriverIntake not found"), { statusCode: 404 });
  }

  const access = await authorizedFleetAccess(sessionUser, intake.fleetId);
  if (!access.allowed) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  const driver = await prisma.driver.findUnique({
    where: { id: driverId },
    include: { fleet: true },
  });

  if (!driver) {
    throw Object.assign(new Error("Driver not found"), { statusCode: 404 });
  }

  if (driver.id !== intake.driverId || driver.fleetId !== intake.fleetId) {
    throw Object.assign(new Error("Driver does not belong to the intake fleet"), { statusCode: 422 });
  }

  const qualificationSnapshot = await getLatestQualificationSnapshot(sessionUser, driverId, intakeId);
  if (!qualificationSnapshot) {
    throw Object.assign(new Error(READINESS_BLOCKED_NO_QUALIFICATION_SNAPSHOT), { statusCode: 409 });
  }

  const intakeWithFacts = await prisma.driverIntake.findUnique({
    where: { id: intakeId },
    include: {
      documents: true,
      requirements: true,
      licenses: true,
      medicalQualifications: true,
      drugTests: true,
      accidentHistory: true,
      violationHistory: true,
    },
  });

  if (!intakeWithFacts) {
    throw Object.assign(new Error("DriverIntake not found"), { statusCode: 404 });
  }

  const documentIds = intakeWithFacts.documents.map((document) => document.id);
  const licenseIds = intakeWithFacts.licenses.map((license) => license.id);
  const medicalQualificationIds = intakeWithFacts.medicalQualifications.map((record) => record.id);
  const drugTestIds = intakeWithFacts.drugTests.map((record) => record.id);
  const requirementIds = intakeWithFacts.requirements.map((requirement) => requirement.id);

  const verificationSources = await prisma.verificationSource.findMany({
    where: {
      OR: [
        { driverDocumentId: { in: documentIds.length > 0 ? documentIds : ["__none__"] } },
        { driverLicenseId: { in: licenseIds.length > 0 ? licenseIds : ["__none__"] } },
        { medicalQualificationId: { in: medicalQualificationIds.length > 0 ? medicalQualificationIds : ["__none__"] } },
        { drugTestRecordId: { in: drugTestIds.length > 0 ? drugTestIds : ["__none__"] } },
        { driverIntakeRequirementId: { in: requirementIds.length > 0 ? requirementIds : ["__none__"] } },
      ],
    },
  });

  return {
    driver,
    intake,
    qualificationSnapshot,
    documents: intakeWithFacts.documents,
    requirements: intakeWithFacts.requirements,
    licenses: intakeWithFacts.licenses,
    medicalQualifications: intakeWithFacts.medicalQualifications,
    drugTests: intakeWithFacts.drugTests,
    accidentHistory: intakeWithFacts.accidentHistory,
    violationHistory: intakeWithFacts.violationHistory,
    verificationSources,
  };
}

export function evaluateReadiness(inputs: ReadinessInputs): ReadinessEvaluation {
  const readinessReasons: ReadinessReasonCode[] = [];
  const add = (reasonCode: ReadinessReasonCode) => addReason(readinessReasons, reasonCode);

  const qualificationStatus = inputs.qualificationSnapshot?.status as QualificationDisposition | null;

  if (qualificationStatus === "NOT_QUALIFIED") {
    add("QUALIFICATION_NOT_COMPLETE");
  } else if (qualificationStatus === "PENDING_REVIEW") {
    add("QUALIFICATION_PENDING_REVIEW");
  } else if (qualificationStatus === "CONDITIONALLY_QUALIFIED") {
    add("MANUAL_READINESS_REVIEW");
  }

  const requiredOperationalTypes = inputs.requirements
    .filter(
      (requirement) =>
        requirement.isRequired &&
        OPERATIONAL_REQUIREMENT_TYPES.has(requirement.requirementType) &&
        requirement.status !== "EXCEPTION" &&
        !(requirement.exceptionReason && requirement.exceptionReason.trim().length > 0),
    )
    .map((requirement) => requirement.requirementType);

  for (const requirementType of requiredOperationalTypes) {
    if (!hasSupportingOperationalCredential(inputs, requirementType)) {
      add("OPERATIONAL_CREDENTIAL_MISSING");
    }
  }

  if (requiredOperationalTypes.includes("DRIVER_LICENSE")) {
    const latestLicense = getLatestLicense(inputs.licenses);
    const latestLicenseDocument = getLatestDocumentForType(inputs.documents, "DRIVER_LICENSE");

    if (
      (latestLicense && (latestLicense.status === "EXPIRED" || isExpired(latestLicense.expirationDate))) ||
      (latestLicenseDocument &&
        (latestLicenseDocument.status === "EXPIRED" || isExpired(latestLicenseDocument.verificationExpiresAt)))
    ) {
      add("LICENSE_EXPIRED");
    }
  }

  if (requiredOperationalTypes.includes("MEDICAL")) {
    const latestMedical = getLatestMedicalQualification(inputs.medicalQualifications);
    const latestMedicalDocument = getLatestDocumentForType(inputs.documents, "MEDICAL");

    if (
      (latestMedical && (latestMedical.status === "EXPIRED" || isExpired(latestMedical.expirationDate))) ||
      (latestMedicalDocument &&
        (latestMedicalDocument.status === "EXPIRED" || isExpired(latestMedicalDocument.verificationExpiresAt)))
    ) {
      add("MEDICAL_EXPIRED");
    }
  }

  if (requiredOperationalTypes.includes("DRUG_TEST")) {
    const latestDrugTest = getLatestDrugTest(inputs.drugTests);
    if (latestDrugTest?.status === "REJECTED" || latestDrugTest?.verificationStatus === "REJECTED") {
      add("DRUG_TEST_REJECTED");
    } else if (
      latestDrugTest &&
      (latestDrugTest.status === "PENDING" || latestDrugTest.verificationStatus === "PENDING_VERIFICATION")
    ) {
      add("DRUG_TEST_PENDING");
    }
  }

  if (inputs.accidentHistory.some((record) => record.status === "REJECTED")) {
    add("DISQUALIFYING_ACCIDENT");
  }

  if (inputs.violationHistory.some((record) => record.status === "REJECTED")) {
    add("DISQUALIFYING_VIOLATION");
  }

  if (
    inputs.verificationSources.some((source) => source.verificationStatus === "PENDING_VERIFICATION") ||
    inputs.documents.some((document) => document.status === "PENDING_VERIFICATION" || document.status === "RECEIVED") ||
    inputs.licenses.some((license) => license.verificationStatus === "PENDING_VERIFICATION") ||
    inputs.medicalQualifications.some((record) => record.verificationStatus === "PENDING_VERIFICATION")
  ) {
    add("MANUAL_READINESS_REVIEW");
  }

  let status: DriverReadinessState = "READY";
  const hasBlocking = readinessReasons.some((reasonCode) => BLOCKING_REASON_CODES.has(reasonCode));
  const hasConditional = readinessReasons.some((reasonCode) => CONDITIONAL_REASON_CODES.has(reasonCode));

  if (hasBlocking) {
    status = "NOT_READY";
  } else if (hasConditional) {
    status = "CONDITIONAL";
  }

  const summary =
    status === "READY"
      ? "Driver satisfies the current readiness rules."
      : status === "CONDITIONAL"
        ? "Driver is conditionally ready under the current readiness policy."
        : "Driver does not satisfy the current readiness rules.";

  return {
    status,
    reasonCodes: readinessReasons,
    summary: readinessReasons.length > 0 ? `${summary} Reasons: ${readinessReasons.join(", ")}.` : summary,
    policyVersion: READINESS_POLICY_VERSION,
  };
}

export async function writeReadinessScore(
  sessionUser: SessionUserLike | null | undefined,
  driverId: string,
  intakeId: string,
  fleetId: string,
  evaluation: ReadinessEvaluation,
) {
  return prisma.driverReadinessScore.create({
    data: {
      driverId,
      driverIntakeId: intakeId,
      fleetId,
      evaluatedAt: new Date(),
      evaluatedByUserId: sessionUser?.id ?? null,
      status: evaluation.status,
      summary: evaluation.summary,
      reasonCodes: evaluation.reasonCodes as Prisma.InputJsonValue,
      policyVersion: evaluation.policyVersion,
    },
  });
}

export async function getLatestReadinessScore(
  sessionUser: SessionUserLike | null | undefined,
  driverId: string,
  intakeId: string,
) {
  if (!sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }

  const intake = await prisma.driverIntake.findUnique({
    where: { id: intakeId },
    include: { driver: true, fleet: true },
  });

  if (!intake) {
    throw Object.assign(new Error("DriverIntake not found"), { statusCode: 404 });
  }

  if (intake.driverId !== driverId) {
    throw Object.assign(new Error("Driver does not belong to the intake"), { statusCode: 422 });
  }

  const access = await authorizedFleetAccess(sessionUser, intake.fleetId);
  if (!access.allowed) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  return prisma.driverReadinessScore.findFirst({
    where: {
      driverId,
      driverIntakeId: intakeId,
      fleetId: intake.fleetId,
    },
    orderBy: [{ evaluatedAt: "desc" }, { createdAt: "desc" }],
  });
}
