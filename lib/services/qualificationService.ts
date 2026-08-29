import { Prisma, QualificationDisposition } from "@prisma/client";

import { createAuditRecord } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { authorizedFleetAccess, type SessionUserLike } from "@/lib/services/intakeService";

export const QUALIFICATION_POLICY_VERSION = "bof-step9-qualification-v1" as const;

export type QualificationEvaluation = {
  status: QualificationDisposition;
  reasonCodes: string[];
  summary: string;
  policyVersion: string;
};

export type QualificationInputs = {
  driver: Awaited<ReturnType<typeof prisma.driver.findUnique>> & { fleet?: { id: string } };
  intake: Awaited<ReturnType<typeof prisma.driverIntake.findUnique>>;
  documents: Awaited<ReturnType<typeof prisma.driverDocument.findMany>>;
  requirements: Awaited<ReturnType<typeof prisma.driverIntakeRequirement.findMany>>;
  licenses: Awaited<ReturnType<typeof prisma.driverLicense.findMany>>;
  endorsements: Awaited<ReturnType<typeof prisma.driverEndorsement.findMany>>;
  medicalQualifications: Awaited<ReturnType<typeof prisma.medicalQualification.findMany>>;
  drugTests: Awaited<ReturnType<typeof prisma.drugTestRecord.findMany>>;
  workHistory: Awaited<ReturnType<typeof prisma.workHistory.findMany>>;
  accidentHistory: Awaited<ReturnType<typeof prisma.accidentHistory.findMany>>;
  violationHistory: Awaited<ReturnType<typeof prisma.violationHistory.findMany>>;
  verificationSources: Awaited<ReturnType<typeof prisma.verificationSource.findMany>>;
};

const BLOCKING_REASON_CODES = new Set([
  "DOCUMENT_REJECTED",
  "DOCUMENT_EXPIRED",
  "LICENSE_INVALID",
  "MEDICAL_EXPIRED",
  "MISSING_REQUIRED_DOCUMENT",
  "WORK_HISTORY_INCOMPLETE",
  "DISQUALIFYING_VIOLATION",
  "DISQUALIFYING_ACCIDENT",
]);

const CONDITIONAL_REASON_CODES = new Set(["REQUIREMENT_EXCEPTION"]);

const PENDING_REASON_CODES = new Set([
  "DOCUMENT_PENDING_VERIFICATION",
  "DRUG_TEST_PENDING",
  "MANUAL_REVIEW_REQUIRED",
]);

function addReason(reasons: string[], code: string) {
  if (!reasons.includes(code)) {
    reasons.push(code);
  }
}

function getLatestDocument(docs: QualificationInputs["documents"]) {
  return [...docs].sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0] ?? null;
}

function isExpired(date: Date | string | null | undefined) {
  if (!date) {
    return false;
  }
  return new Date(date).getTime() < Date.now();
}

export async function assembleQualificationInputs(
  sessionUser: SessionUserLike | null | undefined,
  driverId: string,
  intakeId: string,
): Promise<QualificationInputs> {
  if (!sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }

  const intake = await prisma.driverIntake.findUnique({
    where: { id: intakeId },
    include: {
      driver: true,
      fleet: true,
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

  const documentIds = intake.documents.map((document) => document.id);
  const licenseIds = intake.licenses.map((license) => license.id);
  const medicalQualificationIds = intake.medicalQualifications.map((record) => record.id);
  const drugTestIds = intake.drugTests.map((record) => record.id);
  const requirementIds = intake.requirements.map((requirement) => requirement.id);

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
  };
}

export function evaluateQualification(inputs: QualificationInputs): QualificationEvaluation {
  const intake = inputs.intake;
  if (!intake) {
    return {
      status: "PENDING_REVIEW",
      reasonCodes: ["MANUAL_REVIEW_REQUIRED"],
      summary: "Qualification could not be evaluated because the intake context is unavailable. Reasons: MANUAL_REVIEW_REQUIRED.",
      policyVersion: QUALIFICATION_POLICY_VERSION,
    };
  }

  const reasons: string[] = [];

  const add = (reasonCode: string) => addReason(reasons, reasonCode);

  for (const requirement of inputs.requirements) {
    if (requirement.exceptionReason && requirement.exceptionReason.trim().length > 0) {
      add("REQUIREMENT_EXCEPTION");
      continue;
    }

    const relatedDocuments = inputs.documents.filter(
      (document) =>
        document.driverId === inputs.driver.id &&
        document.driverIntakeId === intake.id &&
        document.fleetId === intake.fleetId &&
        document.type === requirement.requirementType,
    );

    const latestDocument = getLatestDocument(relatedDocuments);

    if (!latestDocument) {
      add("MISSING_REQUIRED_DOCUMENT");
      continue;
    }

    if (latestDocument.status === "REJECTED") {
      add("DOCUMENT_REJECTED");
      continue;
    }

    if (latestDocument.status === "PENDING_VERIFICATION" || latestDocument.status === "RECEIVED") {
      add("DOCUMENT_PENDING_VERIFICATION");
      continue;
    }

    if (latestDocument.status === "EXPIRED" || isExpired(latestDocument.verificationExpiresAt)) {
      add("DOCUMENT_EXPIRED");
      continue;
    }

    if (latestDocument.status === "VERIFIED" || latestDocument.status === "CERTIFIED") {
      continue;
    }
  }

  for (const license of inputs.licenses) {
    if (license.verificationStatus === "REJECTED" || license.status === "REJECTED") {
      add("LICENSE_INVALID");
      continue;
    }

    if (license.verificationStatus === "PENDING_VERIFICATION" || license.status === "PENDING") {
      add("DOCUMENT_PENDING_VERIFICATION");
      continue;
    }

    if (license.status === "EXPIRED" || isExpired(license.expirationDate)) {
      add("DOCUMENT_EXPIRED");
      add("LICENSE_INVALID");
    }
  }

  for (const medical of inputs.medicalQualifications) {
    const replacementDocument = getLatestDocument(
      inputs.documents.filter(
        (document) =>
          document.driverId === inputs.driver.id &&
          document.driverIntakeId === intake.id &&
          document.fleetId === intake.fleetId &&
          document.type === "MEDICAL" &&
          document.status === "VERIFIED",
      ),
    );
    if (
      replacementDocument &&
      new Date(replacementDocument.uploadedAt).getTime() >= new Date(medical.updatedAt).getTime() &&
      !isExpired(replacementDocument.verificationExpiresAt)
    ) {
      continue;
    }
    if (medical.status === "REJECTED") {
      add("LICENSE_INVALID");
      continue;
    }

    if (medical.verificationStatus === "PENDING_VERIFICATION") {
      add("DOCUMENT_PENDING_VERIFICATION");
      continue;
    }

    if (medical.status === "EXPIRED" || isExpired(medical.expirationDate)) {
      add("MEDICAL_EXPIRED");
    }
  }

  for (const test of inputs.drugTests) {
    if (test.verificationStatus === "PENDING_VERIFICATION" || test.status === "PENDING") {
      add("DRUG_TEST_PENDING");
    }

    if (test.status === "REJECTED") {
      add("LICENSE_INVALID");
    }
  }

  if (inputs.workHistory.length === 0) {
    add("WORK_HISTORY_INCOMPLETE");
  }

  if (inputs.accidentHistory.some((record) => record.status === "REJECTED")) {
    add("DISQUALIFYING_ACCIDENT");
  }

  if (inputs.violationHistory.some((record) => record.status === "REJECTED")) {
    add("DISQUALIFYING_VIOLATION");
  }

  if (
    inputs.requirements.some((requirement) => requirement.exceptionReason && requirement.exceptionReason.trim().length > 0) &&
    !reasons.some((reason) => BLOCKING_REASON_CODES.has(reason))
  ) {
    add("REQUIREMENT_EXCEPTION");
  }

  if (
    inputs.verificationSources.some((source) => source.verificationStatus === "PENDING_VERIFICATION") ||
    inputs.documents.some((document) => document.status === "PENDING_VERIFICATION") ||
    inputs.licenses.some((license) => license.verificationStatus === "PENDING_VERIFICATION") ||
    inputs.medicalQualifications.some((medical) => medical.verificationStatus === "PENDING_VERIFICATION") ||
    inputs.drugTests.some((test) => test.verificationStatus === "PENDING_VERIFICATION")
  ) {
    add("MANUAL_REVIEW_REQUIRED");
  }

  let status: QualificationDisposition = "QUALIFIED";
  const hasBlocking = reasons.some((reason) => BLOCKING_REASON_CODES.has(reason));
  const hasConditional = reasons.some((reason) => CONDITIONAL_REASON_CODES.has(reason));
  const hasPending = reasons.some((reason) => PENDING_REASON_CODES.has(reason));

  if (hasBlocking) {
    status = "NOT_QUALIFIED";
  } else if (hasConditional) {
    status = "CONDITIONALLY_QUALIFIED";
  } else if (hasPending) {
    status = "PENDING_REVIEW";
  }

  const summary =
    status === "QUALIFIED"
      ? "Driver satisfies the current qualification rules."
      : status === "CONDITIONALLY_QUALIFIED"
        ? "Driver is conditionally qualified under the current policy."
        : status === "PENDING_REVIEW"
          ? "Qualification is pending review because evidence requires additional verification."
          : "Driver does not satisfy the current qualification rules.";

  return {
    status,
    reasonCodes: reasons,
    summary: reasons.length > 0 ? `${summary} Reasons: ${reasons.join(", ")}.` : summary,
    policyVersion: QUALIFICATION_POLICY_VERSION,
  };
}

export async function writeQualificationSnapshot(
  sessionUser: SessionUserLike | null | undefined,
  driverId: string,
  intakeId: string,
  fleetId: string,
  evaluation: QualificationEvaluation,
) {
  return prisma.driverQualificationSnapshot.create({
    data: {
      driverId,
      driverIntakeId: intakeId,
      fleetId,
      evaluatedAt: new Date(),
      evaluatedByUserId: sessionUser?.id ?? null,
      status: evaluation.status,
      policyVersion: evaluation.policyVersion,
      summary: evaluation.summary,
      reasonCodes: evaluation.reasonCodes as Prisma.InputJsonValue,
    },
  });
}

export async function getLatestQualificationSnapshot(
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

  return prisma.driverQualificationSnapshot.findFirst({
    where: {
      driverId,
      driverIntakeId: intakeId,
      fleetId: intake.fleetId,
    },
    orderBy: [{ evaluatedAt: "desc" }, { createdAt: "desc" }],
  });
}

export async function createQualificationEvaluation(
  sessionUser: SessionUserLike | null | undefined,
  driverId: string,
  intakeId: string,
) {
  if (!sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }

  const inputs = await assembleQualificationInputs(sessionUser, driverId, intakeId);
  const evaluation = evaluateQualification(inputs);
  const intake = inputs.intake;

  if (!intake) {
    throw Object.assign(new Error("DriverIntake not found"), { statusCode: 404 });
  }

  const snapshot = await writeQualificationSnapshot(sessionUser, driverId, intakeId, intake.fleetId, evaluation);

  const auditEventName =
    evaluation.status === "QUALIFIED"
      ? "qualification.passed"
      : evaluation.status === "CONDITIONALLY_QUALIFIED"
        ? evaluation.reasonCodes.includes("REQUIREMENT_EXCEPTION")
          ? "qualification.exception"
          : "qualification.conditionally_qualified"
        : evaluation.status === "NOT_QUALIFIED"
          ? "qualification.failed"
          : "qualification.evaluated";

  await createAuditRecord({
    actorId: sessionUser.id,
    actorEmail: sessionUser.email ?? null,
    tenantId: intake.fleetId,
    action: "CREATED",
    entityType: "DriverQualificationSnapshot",
    entityId: snapshot.id,
    details: {
      event: auditEventName,
      driverId,
      intakeId,
      qualificationStatus: evaluation.status,
      reasonCodes: evaluation.reasonCodes,
      policyVersion: evaluation.policyVersion,
    },
    metadata: { source: "qualification-api" },
  });

  return {
    ...snapshot,
    qualificationStatus: evaluation.status,
    policyVersion: evaluation.policyVersion,
    reasonCodes: evaluation.reasonCodes,
    summary: evaluation.summary,
    status: snapshot.status,
  };
}
