import { createAuditRecord } from "@/lib/audit";
import { ADVANCE_COMPLIANCE_POLICIES, getConfiguredAdvanceWindowDays, evaluateAdvanceComplianceTrigger, evaluateComplianceTrigger } from "@/lib/advance-compliance-rule";
import { prisma } from "@/lib/prisma";
import {
  createRequirement,
  getRequirementById,
  getRequirementsForIntake,
  getRequirementsForDriver,
  updateRequirement,
} from "@/lib/repositories/requirementRepository";
import type { DriverReviewRequirement } from "@/lib/driver-review-explanation";
import { authorizedFleetAccess, logUnauthorizedAttempt, type SessionUserLike } from "@/lib/services/intakeService";

const VALID_REQUIREMENT_TYPES = [
  "DRIVER_LICENSE",
  "MEDICAL",
  "DRUG_TEST",
  "WORK_HISTORY",
  "ACCIDENT_HISTORY",
  "VIOLATION_HISTORY",
  "IDENTITY_SUPPORTING",
  "OTHER",
] as const;

export async function getAuthorizedRequirement(user: SessionUserLike | null | undefined, requirementId: string) {
  const requirement = await getRequirementById(requirementId);
  if (!requirement) {
    return { requirement: null, allowed: false, reason: "NOT_FOUND" as const };
  }

  const access = await authorizedFleetAccess(user, requirement.driverIntake.fleetId);
  if (!access.allowed) {
    return { requirement, allowed: false, reason: "TENANT_ACCESS_DENIED" as const };
  }

  return { requirement, allowed: true, reason: undefined as string | undefined };
}

export function normalizeRequirementStatusForDocument(requirementType: string, documentStatus: string | null | undefined, verificationExpiresAt?: Date | null) {
  if (!documentStatus) {
    return "REQUIRED" as const;
  }

  if (documentStatus === "REJECTED") {
    return "REJECTED" as const;
  }

  if (documentStatus === "PENDING_VERIFICATION") {
    return "PENDING" as const;
  }

  if (documentStatus === "VERIFIED") {
    if (verificationExpiresAt && verificationExpiresAt.getTime() < Date.now()) {
      return "EXPIRED" as const;
    }
    return "SATISFIED" as const;
  }

  if (documentStatus === "EXPIRED") {
    return "EXPIRED" as const;
  }

  return "PENDING" as const;
}

export async function evaluateIntakeRequirements(intakeId: string) {
  const intake = await prisma.driverIntake.findUnique({
    where: { id: intakeId },
    include: {
      requirements: {
        include: { satisfiedByDocument: true },
      },
      documents: true,
      licenses: true,
      medicalQualifications: true,
      drugTests: true,
      driver: true,
    },
  });

  if (!intake) {
    return [];
  }

  let requirements = intake.requirements;
  const requirementSources = Object.values(ADVANCE_COMPLIANCE_POLICIES)
    .filter((policy) => policy.authoritativeCollection)
    .map((policy) => ({
      requirementType: policy.requirementType,
      label: policy.requirementLabel,
      hasDate: (intake[policy.authoritativeCollection!] as Array<{ expirationDate: Date | null }>).some((record) => record.expirationDate),
    }));
  for (const source of requirementSources) {
    if (source.hasDate && !requirements.some((requirement) => requirement.requirementType === source.requirementType)) {
      const created = await createRequirement({
        driverIntakeId: intake.id,
        requirementType: source.requirementType,
        label: source.label,
        isRequired: true,
        requiredAction: ADVANCE_COMPLIANCE_POLICIES[source.requirementType].requiredAction,
        status: "REQUIRED",
      });
      requirements = [...requirements, created];
    }
  }

  const required = await Promise.all(
    requirements.map(async (requirement) => {
      const requirementType = requirement.requirementType;
      const matching = intake.documents
        .filter(
          (document) =>
            document.driverId === intake.driverId &&
            document.fleetId === intake.fleetId &&
            document.type === requirementType,
        )
        .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

      const latestDocument = matching[0] ?? null;
      let derivedStatus: string = "REQUIRED";
      const policy = ADVANCE_COMPLIANCE_POLICIES[requirementType];
      const sourceRows = policy?.authoritativeCollection
        ? (intake[policy.authoritativeCollection] as Array<{ driverId: string; expirationDate: Date | null; status: string; verificationStatus: string | null; updatedAt: Date }>)
            .filter((record) => record.driverId === intake.driverId)
        : [];
      const sourceEvidence = [...sourceRows].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0] ?? null;
      const authoritativeExpiration = sourceEvidence?.expirationDate ?? null;
      const expiresAt = authoritativeExpiration ?? latestDocument?.verificationExpiresAt ?? requirement.expiresAt ?? null;
      const requirementAdvanceWindow = requirement.advanceWindowDays ?? getConfiguredAdvanceWindowDays(requirementType, null);

      const sourceSatisfied = Boolean(
        sourceEvidence &&
        sourceEvidence.status !== "REJECTED" &&
        sourceEvidence.verificationStatus !== "PENDING_VERIFICATION" &&
        sourceEvidence.expirationDate &&
        new Date(sourceEvidence.expirationDate).getTime() >= Date.now(),
      );

      if (requirement.exceptionReason && requirement.exceptionReason.trim().length > 0) {
        derivedStatus = "EXCEPTION";
      } else if (!latestDocument && sourceSatisfied) {
        derivedStatus = "SATISFIED";
      } else if (!latestDocument) {
        derivedStatus = "REQUIRED";
      } else if (latestDocument.status === "REJECTED") {
        derivedStatus = "REJECTED";
      } else if (latestDocument.status === "PENDING_VERIFICATION" || latestDocument.status === "RECEIVED") {
        derivedStatus = "PENDING";
      } else if (latestDocument.status === "VERIFIED") {
        if (latestDocument.verificationExpiresAt && latestDocument.verificationExpiresAt.getTime() < Date.now()) {
          derivedStatus = "EXPIRED";
        } else {
          derivedStatus = "SATISFIED";
        }
      } else if (latestDocument.status === "EXPIRED") {
        derivedStatus = "EXPIRED";
      }

      const triggerPolicy = policy
        ? { ...policy, defaultAdvanceWindowDays: requirementAdvanceWindow }
        : null;
      const triggerEvaluation = triggerPolicy
        ? evaluateComplianceTrigger(triggerPolicy, { expirationDate: expiresAt, dueDate: requirement.dueDate }, new Date())
        : evaluateAdvanceComplianceTrigger(requirementType, expiresAt, requirementAdvanceWindow, new Date());
      const evaluatedTriggerDate = "triggerAt" in triggerEvaluation ? triggerEvaluation.triggerAt : triggerEvaluation.triggerDate;

      const replacementVerified = Boolean(
        latestDocument?.status === "VERIFIED" &&
        requirement.affirmationStatus === "AFFIRMED" &&
        requirement.affirmationTimestamp &&
        new Date(latestDocument.uploadedAt).getTime() >= new Date(requirement.affirmationTimestamp).getTime(),
      );
      const isResolved = replacementVerified && derivedStatus === "SATISFIED";
      const nextActionStatus = isResolved
        ? "RESOLVED"
        : latestDocument &&
            (latestDocument.status === "PENDING_VERIFICATION" || latestDocument.status === "RECEIVED") &&
            requirement.affirmationStatus === "AFFIRMED"
          ? "DOCUMENT_SUBMITTED"
        : triggerEvaluation.isTriggered && derivedStatus !== "EXPIRED" && derivedStatus !== "REJECTED" && requirement.affirmationStatus !== "AFFIRMED"
          ? "ACTION_REQUIRED"
          : requirement.actionStatus ?? null;

      const saved = await updateRequirement(requirement.id, {
        status: derivedStatus as never,
        advanceWindowDays: requirementAdvanceWindow,
        triggerDate: evaluatedTriggerDate,
        requiredAction: triggerEvaluation.requiredAction,
        actionStatus: nextActionStatus,
        verificationStatus: isResolved
          ? "VERIFIED"
          : latestDocument?.status === "PENDING_VERIFICATION" || latestDocument?.status === "RECEIVED"
            ? "PENDING_VERIFICATION"
            : requirement.verificationStatus,
        verificationTimestamp: isResolved ? (requirement.verificationTimestamp ?? new Date()) : requirement.verificationTimestamp,
        resolutionStatus: isResolved ? "RESOLVED" : requirement.resolutionStatus,
        resolvedAt: isResolved ? (requirement.resolvedAt ?? new Date()) : requirement.resolvedAt,
        resolutionNotes: isResolved ? `Verified replacement evidence linked to the ${requirement.label} obligation.` : requirement.resolutionNotes,
        satisfiedByDocumentId: latestDocument && (latestDocument.status === "VERIFIED" || latestDocument.status === "PENDING_VERIFICATION") ? latestDocument.id : (requirement.satisfiedByDocumentId ?? null),
      });

      if (isResolved && requirement.resolutionStatus !== "RESOLVED") {
        await createAuditRecord({
          actorId: null,
          actorEmail: null,
          tenantId: intake.fleetId,
          action: "UPDATED",
          entityType: "DriverIntakeRequirement",
          entityId: requirement.id,
          details: { event: "requirement.resolved", driverId: intake.driverId, requirementType, satisfiedByDocumentId: latestDocument?.id },
          metadata: { source: "requirement-evaluator" },
        });
      }

      if (triggerEvaluation.isTriggered && requirement.actionStatus !== "ACTION_REQUIRED" && !isResolved) {
        await createAuditRecord({
          actorId: null,
          actorEmail: null,
          tenantId: intake.fleetId,
          action: "UPDATED",
          entityType: "DriverIntakeRequirement",
          entityId: requirement.id,
          details: { event: "requirement.advance_triggered", driverId: intake.driverId, requirementType, triggerDate: evaluatedTriggerDate?.toISOString(), advanceWindowDays: requirementAdvanceWindow },
          metadata: { source: "requirement-evaluator" },
        });
      }

      return saved;
    }),
  );

  return required;
}

export async function createDriverRequirementRecord(input: {
  sessionUser: SessionUserLike | null | undefined;
  intakeId: string;
  payload: {
    requirementType?: string;
    label?: string;
    isRequired?: boolean;
    dueDate?: string | null;
    expiresAt?: string | null;
    advanceWindowDays?: number | null;
    requiredAction?: string | null;
    exceptionReason?: string | null;
  };
}) {
  if (!input.sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }

  const intake = await prisma.driverIntake.findUnique({
    where: { id: input.intakeId },
    include: { driver: true, fleet: true },
  });

  if (!intake) {
    throw Object.assign(new Error("DriverIntake not found"), { statusCode: 404 });
  }

  const access = await authorizedFleetAccess(input.sessionUser, intake.fleetId);
  if (!access.allowed) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  const requirementType = input.payload.requirementType ?? "OTHER";
  if (!VALID_REQUIREMENT_TYPES.includes(requirementType as (typeof VALID_REQUIREMENT_TYPES)[number])) {
    throw Object.assign(new Error("Invalid requirement type"), { statusCode: 422 });
  }

  if (!input.payload.label || input.payload.label.trim().length === 0) {
    throw Object.assign(new Error("label is required"), { statusCode: 422 });
  }

  const advanceWindowDays = typeof input.payload.advanceWindowDays === "number" ? input.payload.advanceWindowDays : null;
  const requiredAction = input.payload.requiredAction ?? null;
  const requirement = await createRequirement({
    driverIntakeId: intake.id,
    requirementType,
    label: input.payload.label,
    isRequired: input.payload.isRequired ?? true,
    dueDate: input.payload.dueDate ? new Date(input.payload.dueDate) : null,
    expiresAt: input.payload.expiresAt ? new Date(input.payload.expiresAt) : null,
    advanceWindowDays,
    triggerDate: null,
    requiredAction,
    actionStatus: null,
    exceptionReason: input.payload.exceptionReason ?? null,
    status: "REQUIRED",
  });

  await evaluateIntakeRequirements(intake.id);

  await createAuditRecord({
    actorId: input.sessionUser.id,
    actorEmail: input.sessionUser.email ?? null,
    tenantId: intake.fleetId,
    action: "CREATED",
    entityType: "DriverIntakeRequirement",
    entityId: requirement.id,
    details: { event: "requirement.created", intakeId: intake.id, requirementType, label: requirement.label },
    metadata: { source: "requirement-api" },
  });

  return requirement;
}

export async function affirmRequirementAction(input: {
  sessionUser: SessionUserLike | null | undefined;
  requirementId: string;
}) {
  if (!input.sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }

  const accessResult = await getAuthorizedRequirement(input.sessionUser, input.requirementId);
  if (!accessResult.requirement) throw Object.assign(new Error("Requirement not found"), { statusCode: 404 });
  if (!accessResult.allowed) throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  const requirement = accessResult.requirement;
  const intake = requirement.driverIntake;

  const affirmedAt = new Date();
  const updated = await updateRequirement(requirement.id, {
    affirmationStatus: "AFFIRMED",
    affirmationTimestamp: affirmedAt,
    affirmedBy: input.sessionUser.id,
    actionStatus: requirement.requirementType === "MEDICAL" ? "AWAITING_MEDICAL_CARD" : "AWAITING_EVIDENCE",
    resolutionStatus: "OPEN",
  });

  await createAuditRecord({
    actorId: input.sessionUser.id,
    actorEmail: input.sessionUser.email ?? null,
    tenantId: intake.fleetId,
    action: "UPDATED",
    entityType: "DriverIntakeRequirement",
    entityId: requirement.id,
    details: { event: "requirement.action_affirmed", driverId: intake.driverId, requirementType: requirement.requirementType, affirmationTimestamp: affirmedAt.toISOString() },
    metadata: { source: "requirement-action-api" },
  });

  return updated;
}

export async function affirmMedicalRenewalAppointment(input: {
  sessionUser: SessionUserLike | null | undefined;
  driverId: string;
}) {
  if (!input.sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
  const intake = await prisma.driverIntake.findFirst({
    where: { driverId: input.driverId },
    include: { requirements: true },
    orderBy: { createdAt: "desc" },
  });
  const requirement = intake?.requirements.find((item) => item.requirementType === "MEDICAL");
  if (!requirement) throw Object.assign(new Error("Medical requirement not found"), { statusCode: 404 });
  return affirmRequirementAction({ sessionUser: input.sessionUser, requirementId: requirement.id });
}

export async function listDriverRequirementsForIntake(user: SessionUserLike | null | undefined, intakeId: string) {
  if (!user?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }

  const intake = await prisma.driverIntake.findUnique({
    where: { id: intakeId },
    include: { driver: true, fleet: true },
  });

  if (!intake) {
    throw Object.assign(new Error("DriverIntake not found"), { statusCode: 404 });
  }

  const access = await authorizedFleetAccess(user, intake.fleetId);
  if (!access.allowed) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  const records = await getRequirementsForIntake(intakeId);
  return records;
}

export async function listDriverRequirementsForFleet(
  user: SessionUserLike | null | undefined,
  driverId: string,
  fleetId: string,
): Promise<DriverReviewRequirement[]> {
  if (!user?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }

  const access = await authorizedFleetAccess(user, fleetId);
  if (!access.allowed) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  const rows = await getRequirementsForDriver(driverId, fleetId);
  return rows.map((row) => ({
    id: row.id,
    driverId: row.driverIntake.driverId,
    requirementType: row.requirementType,
    label: row.label,
    dueDate: row.dueDate?.toISOString() ?? null,
    actionStatus: row.actionStatus,
    requiredAction: row.requiredAction,
    resolutionStatus: row.resolutionStatus,
  }));
}

export async function updateDriverRequirementRecord(input: {
  sessionUser: SessionUserLike | null | undefined;
  requirementId: string;
  payload: {
    label?: string;
    isRequired?: boolean;
    dueDate?: string | null;
    expiresAt?: string | null;
    advanceWindowDays?: number | null;
    requiredAction?: string | null;
    exceptionReason?: string | null;
  };
}) {
  if (!input.sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }

  const { requirement, allowed } = await getAuthorizedRequirement(input.sessionUser, input.requirementId);
  if (!requirement) {
    throw Object.assign(new Error("Requirement not found"), { statusCode: 404 });
  }
  if (!allowed) {
    await logUnauthorizedAttempt(input.sessionUser, requirement.driverIntake.fleetId, requirement.driverIntakeId, "TENANT_ACCESS_DENIED");
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  const allowedFields = ["label", "isRequired", "dueDate", "expiresAt", "advanceWindowDays", "requiredAction", "exceptionReason"];
  const invalidKeys = Object.keys(input.payload).filter((key) => !allowedFields.includes(key));
  if (invalidKeys.length > 0) {
    throw Object.assign(new Error(`Invalid fields: ${invalidKeys.join(", ")}`), { statusCode: 422 });
  }

  const updated = await updateRequirement(requirement.id, {
    label: input.payload.label,
    isRequired: input.payload.isRequired,
    dueDate: input.payload.dueDate !== undefined ? (input.payload.dueDate ? new Date(input.payload.dueDate) : null) : undefined,
    expiresAt: input.payload.expiresAt !== undefined ? (input.payload.expiresAt ? new Date(input.payload.expiresAt) : null) : undefined,
    advanceWindowDays: input.payload.advanceWindowDays,
    requiredAction: input.payload.requiredAction,
    exceptionReason: input.payload.exceptionReason,
    triggerDate: input.payload.expiresAt ? new Date(input.payload.expiresAt) : requirement.triggerDate,
  });

  await evaluateIntakeRequirements(requirement.driverIntakeId);

  await createAuditRecord({
    actorId: input.sessionUser.id,
    actorEmail: input.sessionUser.email ?? null,
    tenantId: requirement.driverIntake.fleetId,
    action: "UPDATED",
    entityType: "DriverIntakeRequirement",
    entityId: updated.id,
    details: { event: "requirement.updated", previousStatus: requirement.status, nextStatus: updated.status },
    metadata: { source: "requirement-api" },
  });

  return updated;
}
