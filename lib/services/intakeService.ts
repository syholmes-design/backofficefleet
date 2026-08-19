import { createAuditRecord } from "@/lib/audit";
import { requireFleetAccess, isServiceRole, canAccessFleet, isFleetBoundaryValid, hasRole } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { createIntake, createStageAudit, getDriverById, getIntakeById, listIntakesForFleet, updateIntake } from "@/lib/repositories/intakeRepository";

const SERVICE_ROLE_CODES = ["BOF_OPERATIONS", "BOF_COMPLIANCE_REVIEW"] as const;
const VALID_STAGES = [
  "NEW",
  "IDENTITY_REVIEW",
  "DOCUMENT_COLLECTION",
  "QUALIFICATION_REVIEW",
  "COMPLIANCE_REVIEW",
  "READY_FOR_APPROVAL",
  "APPROVED",
  "REJECTED",
] as const;
const VALID_STATUSES = [
  "DRAFT",
  "SUBMITTED",
  "IN_REVIEW",
  "NEEDS_ATTENTION",
  "READY_FOR_APPROVAL",
  "APPROVED",
  "REJECTED",
  "ARCHIVED",
] as const;

export type SessionUserLike = {
  id?: string;
  email?: string | null;
  memberships?: Array<{ fleetId: string; roleCode: string; status?: string }>;
};

const stageTransitionMap: Record<string, string[]> = {
  NEW: ["IDENTITY_REVIEW", "REJECTED"],
  IDENTITY_REVIEW: ["DOCUMENT_COLLECTION", "REJECTED"],
  DOCUMENT_COLLECTION: ["QUALIFICATION_REVIEW", "REJECTED"],
  QUALIFICATION_REVIEW: ["COMPLIANCE_REVIEW", "REJECTED"],
  COMPLIANCE_REVIEW: ["READY_FOR_APPROVAL", "REJECTED"],
  READY_FOR_APPROVAL: ["APPROVED", "REJECTED"],
  APPROVED: [],
  REJECTED: [],
};

const statusTransitionMap: Record<string, string[]> = {
  DRAFT: ["SUBMITTED", "ARCHIVED"],
  SUBMITTED: ["IN_REVIEW", "READY_FOR_APPROVAL", "REJECTED"],
  IN_REVIEW: ["NEEDS_ATTENTION", "READY_FOR_APPROVAL", "REJECTED"],
  NEEDS_ATTENTION: ["IN_REVIEW", "READY_FOR_APPROVAL", "REJECTED"],
  READY_FOR_APPROVAL: ["APPROVED", "REJECTED"],
  APPROVED: [],
  REJECTED: [],
  ARCHIVED: [],
};

export function getStageTransitionError(currentStage: string, nextStage: string): string | null {
  if (currentStage === nextStage) {
    return null;
  }

  const allowed = stageTransitionMap[currentStage] ?? [];
  if (nextStage && allowed.includes(nextStage)) {
    return null;
  }
  return `Illegal DriverIntake stage transition from ${currentStage} to ${nextStage}`;
}

export function getStatusTransitionError(currentStatus: string, nextStatus: string): string | null {
  if (currentStatus === nextStatus) {
    return null;
  }

  const allowed = statusTransitionMap[currentStatus] ?? [];
  if (nextStatus && allowed.includes(nextStatus)) {
    return null;
  }
  return `Illegal DriverIntake status transition from ${currentStatus} to ${nextStatus}`;
}

export function isValidStage(value: string): value is (typeof VALID_STAGES)[number] {
  return (VALID_STAGES as readonly string[]).includes(value);
}

export function isValidStatus(value: string): value is (typeof VALID_STATUSES)[number] {
  return (VALID_STATUSES as readonly string[]).includes(value);
}

export async function authorizedFleetAccess(user: SessionUserLike | null | undefined, fleetId: string) {
  if (!user?.id) {
    return { allowed: false, reason: "AUTH_REQUIRED" as const };
  }

  if (requireFleetAccess(user, fleetId).allowed) {
    return { allowed: true, reason: undefined as string | undefined };
  }

  if (isServiceRole(user, [...SERVICE_ROLE_CODES])) {
    return { allowed: true, reason: undefined as string | undefined };
  }

  const aggregatorMembership = await prisma.aggregatorMembership.findFirst({
    where: {
      userId: user.id,
      status: "ACTIVE",
      aggregator: {
        aggregatorFleets: {
          some: {
            fleetId,
            status: "ACTIVE",
          },
        },
      },
    },
    select: { id: true },
  });

  if (aggregatorMembership) {
    return { allowed: true, reason: undefined as string | undefined };
  }

  return { allowed: false, reason: "TENANT_ACCESS_DENIED" as const };
}

export async function getAuthorizedIntake(user: SessionUserLike | null | undefined, intakeId: string) {
  const intake = await getIntakeById(intakeId);
  if (!intake) {
    return { intake: null, allowed: false, reason: "NOT_FOUND" as const };
  }

  const access = await authorizedFleetAccess(user, intake.fleetId);
  if (!access.allowed) {
    return { intake, allowed: false, reason: "TENANT_ACCESS_DENIED" as const };
  }

  return { intake, allowed: true, reason: undefined as string | undefined };
}

export async function createDriverIntakeRecord(input: {
  sessionUser: SessionUserLike | null | undefined;
  driverId: string;
  fleetId: string;
  intakeSource?: string;
  intakeChannel?: string;
}) {
  if (!input.sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }

  const access = await authorizedFleetAccess(input.sessionUser, input.fleetId);
  if (!access.allowed) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  const driver = await getDriverById(input.driverId);
  if (!driver) {
    throw Object.assign(new Error("Driver not found"), { statusCode: 404 });
  }

  if (driver.fleetId !== input.fleetId) {
    throw Object.assign(new Error("Driver does not belong to this fleet"), { statusCode: 422 });
  }

  const intake = await createIntake({
    driverId: driver.id,
    fleetId: input.fleetId,
    createdByUserId: input.sessionUser.id,
    intakeSource: input.intakeSource ?? "PORTAL",
    intakeChannel: input.intakeChannel ?? "WEB",
    stage: "NEW",
    status: "DRAFT",
  });

  await createStageAudit(intake.id, "NEW", "DRAFT", input.sessionUser.id, "Driver intake created");

  await createAuditRecord({
    actorId: input.sessionUser.id,
    actorEmail: input.sessionUser.email ?? null,
    tenantId: input.fleetId,
    action: "CREATED",
    entityType: "DriverIntake",
    entityId: intake.id,
    details: { event: "intake.created", stage: "NEW", status: "DRAFT" },
    metadata: { source: "driver-intake-api" },
  });

  return intake;
}

export async function listDriverIntakesForUser(
  user: SessionUserLike | null | undefined,
  fleetId: string,
  filters: {
    status?: string | null;
    stage?: string | null;
    driverId?: string | null;
  } = {},
) {
  const access = await authorizedFleetAccess(user, fleetId);
  if (!access.allowed) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  return listIntakesForFleet(fleetId, filters);
}

export async function updateDriverIntakeRecord(input: {
  sessionUser: SessionUserLike | null | undefined;
  intakeId: string;
  payload: {
    stage?: string;
    status?: string;
    submittedAt?: string | null;
    approvedAt?: string | null;
    rejectedAt?: string | null;
    notes?: string | null;
  };
}) {
  if (!input.sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }

  const { intake, allowed } = await getAuthorizedIntake(input.sessionUser, input.intakeId);
  if (!intake) {
    throw Object.assign(new Error("Not found"), { statusCode: 404 });
  }
  if (!allowed) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  const nextStage = input.payload.stage ?? intake.stage;
  const nextStatus = input.payload.status ?? intake.status;

  if (!isValidStage(nextStage)) {
    throw Object.assign(new Error("Invalid stage"), { statusCode: 422 });
  }

  if (!isValidStatus(nextStatus)) {
    throw Object.assign(new Error("Invalid status"), { statusCode: 422 });
  }

  const stageError = getStageTransitionError(intake.stage, nextStage);
  if (stageError) {
    throw Object.assign(new Error(stageError), { statusCode: 422 });
  }

  const statusError = getStatusTransitionError(intake.status, nextStatus);
  if (statusError) {
    throw Object.assign(new Error(statusError), { statusCode: 422 });
  }

  const updateData: {
    stage?: string;
    status?: string;
    submittedAt?: Date | null;
    approvedAt?: Date | null;
    approvedByUserId?: string | null;
    rejectedAt?: Date | null;
    rejectedByUserId?: string | null;
    notes?: string | null;
  } = {};

  if (input.payload.stage) {
    updateData.stage = nextStage;
  }

  if (input.payload.status) {
    updateData.status = nextStatus;
  }

  if (input.payload.notes !== undefined) {
    updateData.notes = input.payload.notes;
  }

  const now = new Date();
  if (nextStatus === "SUBMITTED" && !intake.submittedAt) {
    updateData.submittedAt = now;
  }

  if (nextStatus === "APPROVED" && !intake.approvedAt) {
    updateData.approvedAt = now;
    updateData.approvedByUserId = input.sessionUser.id;
  }

  if (nextStatus === "REJECTED" && !intake.rejectedAt) {
    updateData.rejectedAt = now;
    updateData.rejectedByUserId = input.sessionUser.id;
  }

  const updated = await updateIntake(intake.id, updateData);

  if (nextStage !== intake.stage) {
    await createStageAudit(intake.id, nextStage, nextStatus, input.sessionUser.id, input.payload.notes ?? "Stage updated");
  }

  await createAuditRecord({
    actorId: input.sessionUser.id,
    actorEmail: input.sessionUser.email ?? null,
    tenantId: intake.fleetId,
    action: "UPDATED",
    entityType: "DriverIntake",
    entityId: intake.id,
    details: {
      event: "intake.updated",
      previousStage: intake.stage,
      nextStage,
      previousStatus: intake.status,
      nextStatus,
      submitted: nextStatus === "SUBMITTED" && !intake.submittedAt,
      approved: nextStatus === "APPROVED" && !intake.approvedAt,
      rejected: nextStatus === "REJECTED" && !intake.rejectedAt,
    },
    metadata: { source: "driver-intake-api", userRole: input.sessionUser.memberships?.[0]?.roleCode ?? null },
  });

  if (nextStatus === "SUBMITTED" && !intake.submittedAt) {
    await createAuditRecord({
      actorId: input.sessionUser.id,
      actorEmail: input.sessionUser.email ?? null,
      tenantId: intake.fleetId,
      action: "UPDATED",
      entityType: "DriverIntake",
      entityId: intake.id,
      details: { event: "intake.submitted", stage: nextStage, status: nextStatus },
      metadata: { source: "driver-intake-api" },
    });
  }

  if (nextStatus === "APPROVED" && !intake.approvedAt) {
    await createAuditRecord({
      actorId: input.sessionUser.id,
      actorEmail: input.sessionUser.email ?? null,
      tenantId: intake.fleetId,
      action: "UPDATED",
      entityType: "DriverIntake",
      entityId: intake.id,
      details: { event: "intake.approved", stage: nextStage, status: nextStatus },
      metadata: { source: "driver-intake-api" },
    });
  }

  if (nextStatus === "REJECTED" && !intake.rejectedAt) {
    await createAuditRecord({
      actorId: input.sessionUser.id,
      actorEmail: input.sessionUser.email ?? null,
      tenantId: intake.fleetId,
      action: "UPDATED",
      entityType: "DriverIntake",
      entityId: intake.id,
      details: { event: "intake.rejected", stage: nextStage, status: nextStatus },
      metadata: { source: "driver-intake-api" },
    });
  }

  return updated;
}

export async function logUnauthorizedAttempt(
  user: SessionUserLike | null | undefined,
  requestedFleetId: string | null,
  intakeId: string | null,
  reason: string,
) {
  await createAuditRecord({
    actorId: user?.id ?? null,
    actorEmail: user?.email ?? null,
    tenantId: requestedFleetId ?? null,
    action: "ACCESS_DENIED",
    entityType: "DriverIntake",
    entityId: intakeId ?? null,
    details: { event: "unauthorized.access", reason },
    metadata: { source: "driver-intake-api" },
  });
}

export async function validateIntakeAccess(user: SessionUserLike | null | undefined, fleetId: string) {
  const access = await authorizedFleetAccess(user, fleetId);
  if (!access.allowed) {
    return { allowed: false, reason: access.reason };
  }

  return { allowed: true, reason: undefined };
}

export { canAccessFleet, hasRole, isFleetBoundaryValid, isServiceRole, requireFleetAccess };
