import {
  DispatchAssignmentStatus,
  PickupAuthorizationStatus,
  PickupVerificationMethod,
  PickupVerificationResult,
  Prisma,
  type PickupAuthorization,
  type PickupStopReasonCode,
} from "@prisma/client";

import { createAuditRecord } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { recordOperatingProcessEvent } from "@/lib/process-intelligence/operating-event-service";
import { getOperatingProcessStore } from "@/lib/process-intelligence/runtime-store";
import { requireDispatchMutationRole } from "@/lib/services/dispatchAssignmentService";
import {
  authorizeMovement,
  createMovementAuthorizationDeniedError,
} from "@/lib/services/dispatchMovementAuthorizationService";
import {
  executeMovementReleaseInTransaction,
  recordDispatchReleaseSideEffects,
} from "@/lib/services/dispatchReleaseService";
import { authorizedFleetAccess, isServiceRole, type SessionUserLike } from "@/lib/services/intakeService";
import { findLoadByOperatorKey } from "@/lib/services/loadService";
import {
  PHASE1_PHYSICAL_VERIFICATION_NOTE,
  assertPhysicalProviderNotImplemented,
} from "@/lib/services/pickupPhysicalVerification";
import {
  PICKUP_POLICY_VERSION,
  evaluatePickupReconciliation,
  hasPresentedIdentities,
  type PickupPresentedIdentities,
} from "@/lib/services/pickupReconciliation";
import {
  generatePickupAuthorizationToken,
  hashPickupAuthorizationToken,
  pickupAuthorizationTokensMatch,
} from "@/lib/services/pickupToken";
import { rejectDemoOperationalKey } from "@/lib/uos/demo-operational-keys";

export const PICKUP_BLOCKED_NO_ASSIGNMENT = "PICKUP AUTHORIZATION BLOCKED — NO ACTIVE ASSIGNMENT" as const;
export const PICKUP_BLOCKED_MOVEMENT_AUTHORIZATION =
  "PICKUP AUTHORIZATION BLOCKED — MOVEMENT AUTHORIZATION FAILED" as const;
export const PICKUP_BLOCKED_NO_TRIP_RELEASE = "PICKUP AUTHORIZATION BLOCKED — NO TRIP RELEASE" as const;
export const PICKUP_BLOCKED_TRIP_NOT_RELEASED = "PICKUP AUTHORIZATION BLOCKED — TRIP RELEASE NOT RELEASED" as const;

const ACTIVE_PICKUP_STATUSES: PickupAuthorizationStatus[] = ["PENDING", "AUTHORIZED"];
const PHASE1_METHODS: PickupVerificationMethod[] = ["TOKEN_PRESENTATION", "MANUAL_OPERATOR"];
const DEFAULT_TTL_MS = 12 * 60 * 60 * 1000;

type PickupAuthorizationWithGraph = Prisma.PickupAuthorizationGetPayload<{
  include: {
    load: true;
    assignment: true;
    driver: true;
    tractorEquipment: true;
    trailerEquipment: true;
    verificationAttempts: true;
  };
}>;

function requireSessionUser(sessionUser: SessionUserLike | null | undefined) {
  if (!sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
}

function accessibleFleetIds(sessionUser: SessionUserLike) {
  return (sessionUser.memberships ?? [])
    .filter((membership) => membership.status !== "INACTIVE" && membership.status !== "INVITED")
    .map((membership) => membership.fleetId)
    .filter(Boolean);
}

async function logUnauthorizedPickupAccess(
  sessionUser: SessionUserLike | null | undefined,
  fleetId: string | null,
  entityId: string | null,
  reason: string,
) {
  await createAuditRecord({
    actorId: sessionUser?.id ?? null,
    actorEmail: sessionUser?.email ?? null,
    tenantId: fleetId,
    action: "ACCESS_DENIED",
    entityType: "PickupAuthorization",
    entityId,
    details: { event: "unauthorized pickup access", reason },
    metadata: { source: "pickup-authorization-service" },
  });
}

function toPublicAuthorization(row: PickupAuthorization | PickupAuthorizationWithGraph) {
  return {
    id: row.id,
    fleetId: row.fleetId,
    loadId: row.loadId,
    assignmentId: row.assignmentId,
    driverId: row.driverId,
    tractorEquipmentId: row.tractorEquipmentId,
    trailerEquipmentId: row.trailerEquipmentId,
    dispatchReleaseId: row.dispatchReleaseId,
    driverReadinessScoreId: row.driverReadinessScoreId,
    status: row.status,
    pickupWindowStart: row.pickupWindowStart,
    pickupWindowEnd: row.pickupWindowEnd,
    expiresAt: row.expiresAt,
    releasedAt: row.releasedAt,
    stoppedAt: row.stoppedAt,
    cancelledAt: row.cancelledAt,
    reason: row.reason,
    reasonCodes: row.reasonCodes,
    policyVersion: row.policyVersion,
    physicalIdentityClass: row.physicalIdentityClass,
    physicalEquipmentClass: row.physicalEquipmentClass,
    createdByUserId: row.createdByUserId,
    cancelledByUserId: row.cancelledByUserId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    physicalVerificationNote: PHASE1_PHYSICAL_VERIFICATION_NOTE,
  };
}

function toPublicAttempt(row: Prisma.PickupVerificationAttemptGetPayload<object>) {
  return {
    id: row.id,
    pickupAuthorizationId: row.pickupAuthorizationId,
    fleetId: row.fleetId,
    method: row.method,
    result: row.result,
    presentedTokenValid: row.presentedTokenValid,
    presentedDriverId: row.presentedDriverId,
    presentedTractorEquipmentId: row.presentedTractorEquipmentId,
    presentedTrailerEquipmentId: row.presentedTrailerEquipmentId,
    presentedLoadId: row.presentedLoadId,
    presentedAuthorizationId: row.presentedAuthorizationId,
    reason: row.reason,
    reasonCodes: row.reasonCodes,
    physicalVerificationPerformed: row.physicalVerificationPerformed,
    actorUserId: row.actorUserId,
    createdAt: row.createdAt,
  };
}

async function recordPickupEvent(
  sessionUser: SessionUserLike,
  input: {
    fleetId: string;
    loadId: string;
    authorizationId: string;
    eventType: "PICKUP_AUTHORIZATION_CREATED" | "PICKUP_VERIFICATION_RECORDED" | "PICKUP_RELEASED" | "PICKUP_STOPPED";
    entityType: string;
    entityId: string;
    priorState?: string | null;
    resultingState: string;
    decisionResult: string;
    decisionReason: string;
    relatedRecordType: string;
    relatedRecordId: string;
  },
) {
  await recordOperatingProcessEvent(getOperatingProcessStore(), sessionUser, {
    fleetId: input.fleetId,
    loadId: input.loadId,
    entityType: input.entityType,
    entityId: input.entityId,
    eventType: input.eventType,
    processStage: "RELEASE",
    eventTimestamp: new Date(),
    actorId: sessionUser.id ?? null,
    actorType: "USER",
    relatedRecordType: input.relatedRecordType,
    relatedRecordId: input.relatedRecordId,
    lineage: { sourceSystem: "BOF", sourceRecordId: input.relatedRecordId },
    decisionType: "PICKUP_RELEASE",
    decisionResult: input.decisionResult,
    decisionReason: input.decisionReason,
    decisionOwner: sessionUser.id ?? null,
    priorState: input.priorState,
    resultingState: input.resultingState,
    operationalConsequence:
      input.resultingState === "RELEASED"
        ? "Pickup may proceed under Phase 1 record-identity match. Physical dock identity was not verified."
        : input.resultingState === "STOPPED"
          ? "Pickup is stopped."
          : "Pickup authorization recorded.",
  });
}

async function getAuthorizedPickup(
  sessionUser: SessionUserLike | null | undefined,
  authorizationId: string,
) {
  const authorization = await prisma.pickupAuthorization.findUnique({
    where: { id: authorizationId },
    include: {
      load: true,
      assignment: true,
      driver: true,
      tractorEquipment: true,
      trailerEquipment: true,
      verificationAttempts: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!authorization) {
    return { authorization: null, allowed: false as const, reason: "NOT_FOUND" as const };
  }
  const access = await authorizedFleetAccess(sessionUser, authorization.fleetId);
  if (!access.allowed) {
    return { authorization, allowed: false as const, reason: access.reason ?? "TENANT_ACCESS_DENIED" };
  }
  return { authorization, allowed: true as const, reason: undefined as string | undefined };
}

function resolveExpiresAt(pickupWindowEnd: Date | null, now: Date) {
  if (pickupWindowEnd && pickupWindowEnd.getTime() > now.getTime()) {
    return pickupWindowEnd;
  }
  return new Date(now.getTime() + DEFAULT_TTL_MS);
}

async function expireIfNeeded(authorization: PickupAuthorizationWithGraph) {
  if (!ACTIVE_PICKUP_STATUSES.includes(authorization.status)) {
    return authorization;
  }
  if (authorization.expiresAt.getTime() > Date.now()) {
    return authorization;
  }
  return prisma.pickupAuthorization.update({
    where: { id: authorization.id },
    data: {
      status: "EXPIRED",
      reason: "Authorization window expired",
      reasonCodes: ["EXPIRED"] as Prisma.InputJsonValue,
    },
    include: {
      load: true,
      assignment: true,
      driver: true,
      tractorEquipment: true,
      trailerEquipment: true,
      verificationAttempts: { orderBy: { createdAt: "asc" } },
    },
  });
}

function writeAttemptData(input: {
  authorizationId: string;
  fleetId: string;
  method: PickupVerificationMethod;
  result: PickupVerificationResult;
  presentedTokenValid: boolean;
  presented: PickupPresentedIdentities;
  reason: string;
  reasonCodes: PickupStopReasonCode[] | string[];
  actorUserId: string | null;
}) {
  return {
    pickupAuthorizationId: input.authorizationId,
    fleetId: input.fleetId,
    method: input.method,
    result: input.result,
    presentedTokenValid: input.presentedTokenValid,
    presentedDriverId: input.presented.driverId?.trim() || null,
    presentedTractorEquipmentId: input.presented.tractorEquipmentId?.trim() || null,
    presentedTrailerEquipmentId: input.presented.trailerEquipmentId?.trim() || null,
    presentedLoadId: input.presented.loadId?.trim() || null,
    presentedAuthorizationId: input.presented.authorizationId?.trim() || null,
    reason: input.reason,
    reasonCodes: input.reasonCodes as Prisma.InputJsonValue,
    physicalVerificationPerformed: false,
    actorUserId: input.actorUserId,
  };
}

async function writeAttempt(
  input: Parameters<typeof writeAttemptData>[0],
  db: Prisma.TransactionClient | typeof prisma = prisma,
) {
  return db.pickupVerificationAttempt.create({ data: writeAttemptData(input) });
}

const pickupAuthorizationGraphInclude = {
  load: true,
  assignment: true,
  driver: true,
  tractorEquipment: true,
  trailerEquipment: true,
  verificationAttempts: { orderBy: { createdAt: "asc" as const } },
} satisfies Prisma.PickupAuthorizationInclude;

export async function issuePickupAuthorization(sessionUser: SessionUserLike | null | undefined, loadId: string) {
  requireSessionUser(sessionUser);
  rejectDemoOperationalKey(loadId, "loadId");
  const actorId = sessionUser!.id as string;

  const load = await findLoadByOperatorKey(loadId);
  if (!load) {
    throw Object.assign(new Error("Load not found"), { statusCode: 404 });
  }

  const assignment = await prisma.dispatchAssignment.findFirst({
    where: { loadId: load.id, status: DispatchAssignmentStatus.ACTIVE },
  });
  if (!assignment) {
    throw Object.assign(new Error(PICKUP_BLOCKED_NO_ASSIGNMENT), { statusCode: 409 });
  }

  const now = new Date();
  const token = generatePickupAuthorizationToken();
  const tokenHash = hashPickupAuthorizationToken(token);

  const txResult = await prisma.$transaction(async (tx) => {
    await requireDispatchMutationRole(tx, sessionUser, load.fleetId, load.id);

    const releaseResult = await executeMovementReleaseInTransaction(tx, sessionUser!, loadId, "PICKUP_ISSUE", {
      assignmentId: assignment.id,
    });
    if (!releaseResult.movement.allowed) {
      throw createMovementAuthorizationDeniedError(releaseResult.movement);
    }

    await tx.pickupAuthorization.updateMany({
      where: { loadId: load.id, status: { in: ACTIVE_PICKUP_STATUSES } },
      data: {
        status: "CANCELLED",
        cancelledAt: now,
        cancelledByUserId: actorId,
        reason: "Superseded by a new pickup authorization",
        reasonCodes: ["CANCELLED"] as Prisma.InputJsonValue,
      },
    });

    const created = await tx.pickupAuthorization.create({
      data: {
        fleetId: load.fleetId,
        loadId: load.id,
        assignmentId: assignment.id,
        driverId: assignment.driverId,
        tractorEquipmentId: assignment.tractorEquipmentId,
        trailerEquipmentId: assignment.trailerEquipmentId,
        dispatchReleaseId: releaseResult.release.id,
        driverReadinessScoreId: releaseResult.release.driverReadinessScoreId,
        status: "PENDING",
        tokenHash,
        pickupWindowStart: load.pickupWindowStart,
        pickupWindowEnd: load.pickupWindowEnd,
        expiresAt: resolveExpiresAt(load.pickupWindowEnd, now),
        policyVersion: PICKUP_POLICY_VERSION,
        physicalIdentityClass: "UNVERIFIED",
        physicalEquipmentClass: "UNVERIFIED",
        createdByUserId: actorId,
      },
      include: pickupAuthorizationGraphInclude,
    });

    return { ...releaseResult, created, token };
  });

  const { movement, release: tripRelease, inputs, evaluation, created } = txResult;

  await recordDispatchReleaseSideEffects(
    sessionUser!,
    inputs,
    tripRelease,
    evaluation,
    inputs.readiness.id,
    movement,
  );

  await createAuditRecord({
    actorId,
    actorEmail: sessionUser!.email ?? null,
    tenantId: load.fleetId,
    action: "CREATED",
    entityType: "PickupAuthorization",
    entityId: created.id,
    details: {
      event: "pickup.authorization_created",
      loadId: load.id,
      assignmentId: assignment.id,
      driverId: assignment.driverId,
      tractorEquipmentId: assignment.tractorEquipmentId,
      trailerEquipmentId: assignment.trailerEquipmentId,
      dispatchReleaseId: tripRelease.id,
      movementPolicyVersion: movement.policyVersion,
      driverQualificationStatus: movement.driverQualificationStatus,
      movementReasonCodes: movement.reasonCodes,
      status: created.status,
      physicalVerification: false,
    },
    metadata: { source: "pickup-authorization-service" },
  });

  await recordPickupEvent(sessionUser!, {
    fleetId: load.fleetId,
    loadId: load.id,
    authorizationId: created.id,
    eventType: "PICKUP_AUTHORIZATION_CREATED",
    entityType: "PickupAuthorization",
    entityId: created.id,
    resultingState: "PENDING",
    decisionResult: "PENDING",
    decisionReason: "Pickup authorization issued against active DispatchAssignment",
    relatedRecordType: "PickupAuthorization",
    relatedRecordId: created.id,
  });

  return {
    authorization: toPublicAuthorization(created),
    expected: {
      loadId: created.loadId,
      driverId: created.driverId,
      tractorEquipmentId: created.tractorEquipmentId,
      trailerEquipmentId: created.trailerEquipmentId,
      assignmentId: created.assignmentId,
      fleetId: created.fleetId,
      pickupWindowStart: created.pickupWindowStart,
      pickupWindowEnd: created.pickupWindowEnd,
    },
    credential: {
      token,
      warning: "Shown once. This credential is not a database ID and cannot be recovered.",
    },
    physicalVerificationNote: PHASE1_PHYSICAL_VERIFICATION_NOTE,
  };
}

export async function getPickupAuthorization(sessionUser: SessionUserLike | null | undefined, authorizationId: string) {
  requireSessionUser(sessionUser);
  const { authorization, allowed, reason } = await getAuthorizedPickup(sessionUser, authorizationId);
  if (!authorization) {
    throw Object.assign(new Error("Pickup authorization not found"), { statusCode: 404 });
  }
  if (!allowed) {
    await logUnauthorizedPickupAccess(sessionUser, authorization.fleetId, authorization.id, reason);
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }
  const current = await expireIfNeeded(authorization);
  return {
    authorization: toPublicAuthorization(current),
    expected: {
      loadId: current.loadId,
      driverId: current.driverId,
      tractorEquipmentId: current.tractorEquipmentId,
      trailerEquipmentId: current.trailerEquipmentId,
      assignmentId: current.assignmentId,
      fleetId: current.fleetId,
      pickupWindowStart: current.pickupWindowStart,
      pickupWindowEnd: current.pickupWindowEnd,
    },
    attempts: current.verificationAttempts.map(toPublicAttempt),
    physicalVerificationNote: PHASE1_PHYSICAL_VERIFICATION_NOTE,
  };
}

export async function listPickupAuthorizations(
  sessionUser: SessionUserLike | null | undefined,
  loadId?: string | null,
) {
  requireSessionUser(sessionUser);
  const actor = sessionUser as SessionUserLike & { id: string };
  const where: Prisma.PickupAuthorizationWhereInput = {};
  if (loadId) {
    const load = await findLoadByOperatorKey(loadId);
    if (!load) {
      throw Object.assign(new Error("Load not found"), { statusCode: 404 });
    }
    const access = await authorizedFleetAccess(sessionUser, load.fleetId);
    if (!access.allowed) {
      await logUnauthorizedPickupAccess(sessionUser, load.fleetId, load.id, access.reason ?? "TENANT_ACCESS_DENIED");
      throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
    }
    where.loadId = load.id;
  } else if (!isServiceRole(actor, ["BOF_OPERATIONS", "BOF_COMPLIANCE_REVIEW"])) {
    const fleetIds = accessibleFleetIds(actor);
    if (fleetIds.length === 0) return [];
    where.fleetId = { in: fleetIds };
  }

  const rows = await prisma.pickupAuthorization.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    take: 50,
    include: {
      verificationAttempts: { orderBy: { createdAt: "desc" }, take: 1 },
      physicalReconciliation: true,
    },
  });
  return rows.map((row) => ({
    ...toPublicAuthorization(row),
    latestAttempt: row.verificationAttempts[0] ? toPublicAttempt(row.verificationAttempts[0]) : null,
    physicalDisposition: row.physicalReconciliation?.disposition ?? "PENDING",
    physicalException: row.physicalReconciliation?.disposition === "STOP",
  }));
}

export async function cancelPickupAuthorization(
  sessionUser: SessionUserLike | null | undefined,
  authorizationId: string,
  reason?: string | null,
) {
  requireSessionUser(sessionUser);
  const actorId = sessionUser!.id as string;
  const { authorization, allowed, reason: accessReason } = await getAuthorizedPickup(sessionUser, authorizationId);
  if (!authorization) {
    throw Object.assign(new Error("Pickup authorization not found"), { statusCode: 404 });
  }
  if (!allowed) {
    await logUnauthorizedPickupAccess(sessionUser, authorization.fleetId, authorization.id, accessReason);
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }
  await requireDispatchMutationRole(prisma, sessionUser, authorization.fleetId, authorization.id);
  if (!ACTIVE_PICKUP_STATUSES.includes(authorization.status)) {
    throw Object.assign(new Error(`Authorization cannot be cancelled from ${authorization.status}`), { statusCode: 409 });
  }

  const updated = await prisma.pickupAuthorization.update({
    where: { id: authorization.id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelledByUserId: actorId,
      reason: reason?.trim() || "Cancelled by operator",
      reasonCodes: ["CANCELLED"] as Prisma.InputJsonValue,
    },
    include: {
      load: true,
      assignment: true,
      driver: true,
      tractorEquipment: true,
      trailerEquipment: true,
      verificationAttempts: { orderBy: { createdAt: "asc" } },
    },
  });

  await createAuditRecord({
    actorId,
    actorEmail: sessionUser!.email ?? null,
    tenantId: updated.fleetId,
    action: "UPDATED",
    entityType: "PickupAuthorization",
    entityId: updated.id,
    details: { event: "pickup.cancelled", status: "CANCELLED", reason: updated.reason },
    metadata: { source: "pickup-authorization-service" },
  });

  return {
    authorization: toPublicAuthorization(updated),
    attempts: updated.verificationAttempts.map(toPublicAttempt),
  };
}

export async function verifyPickupAuthorization(
  sessionUser: SessionUserLike | null | undefined,
  authorizationId: string,
  input: {
    token: string;
    method?: PickupVerificationMethod | string | null;
    presented?: PickupPresentedIdentities;
  },
) {
  requireSessionUser(sessionUser);
  const actorId = sessionUser!.id as string;
  const method = (input.method ?? "TOKEN_PRESENTATION") as PickupVerificationMethod;
  if (!PHASE1_METHODS.includes(method)) {
    assertPhysicalProviderNotImplemented(method as never);
  }

  const { authorization, allowed, reason: accessReason } = await getAuthorizedPickup(sessionUser, authorizationId);
  if (!authorization) {
    throw Object.assign(new Error("Pickup authorization not found"), { statusCode: 404 });
  }
  if (!allowed) {
    await logUnauthorizedPickupAccess(sessionUser, authorization.fleetId, authorization.id, accessReason);
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }
  await requireDispatchMutationRole(prisma, sessionUser, authorization.fleetId, authorization.id);

  const presented: PickupPresentedIdentities = input.presented ?? {};
  const current = await expireIfNeeded(authorization);
  const tokenValid = typeof input.token === "string" && pickupAuthorizationTokensMatch(input.token, current.tokenHash);

  const reject = async (
    status: PickupAuthorizationStatus | null,
    result: PickupVerificationResult,
    reasonCodes: PickupStopReasonCode[],
    reason: string,
    httpStatus: number,
  ): Promise<never> => {
    const attempt = await writeAttempt({
      authorizationId: current.id,
      fleetId: current.fleetId,
      method,
      result,
      presentedTokenValid: tokenValid,
      presented,
      reason,
      reasonCodes,
      actorUserId: actorId,
    });
    let updated = current;
    if (status && ACTIVE_PICKUP_STATUSES.includes(current.status)) {
      updated = await prisma.pickupAuthorization.update({
        where: { id: current.id },
        data: {
          status,
          stoppedAt: status === "STOPPED" ? new Date() : current.stoppedAt,
          reason,
          reasonCodes: reasonCodes as Prisma.InputJsonValue,
        },
        include: {
          load: true,
          assignment: true,
          driver: true,
          tractorEquipment: true,
          trailerEquipment: true,
          verificationAttempts: { orderBy: { createdAt: "asc" } },
        },
      });
    }
    await createAuditRecord({
      actorId,
      actorEmail: sessionUser!.email ?? null,
      tenantId: current.fleetId,
      action: "UPDATED",
      entityType: "PickupAuthorization",
      entityId: current.id,
      details: {
        event: "pickup.verification_attempt",
        result,
        reason,
        reasonCodes,
        method,
        physicalVerificationPerformed: false,
      },
      metadata: { source: "pickup-authorization-service" },
    });
    await recordPickupEvent(sessionUser!, {
      fleetId: current.fleetId,
      loadId: current.loadId,
      authorizationId: current.id,
      eventType: status === "STOPPED" ? "PICKUP_STOPPED" : "PICKUP_VERIFICATION_RECORDED",
      entityType: "PickupVerificationAttempt",
      entityId: attempt.id,
      priorState: current.status,
      resultingState: updated.status,
      decisionResult: result,
      decisionReason: reason,
      relatedRecordType: "PickupVerificationAttempt",
      relatedRecordId: attempt.id,
    });
    const error = Object.assign(new Error(reason), {
      statusCode: httpStatus,
      payload: {
        authorization: toPublicAuthorization(updated),
        attempt: toPublicAttempt(attempt),
        physicalVerificationNote: PHASE1_PHYSICAL_VERIFICATION_NOTE,
      },
    });
    throw error;
  };

  if (!tokenValid) {
    await reject(null, "REJECTED", ["TOKEN_INVALID"], "Pickup credential is invalid", 409);
  }

  if (current.status === "RELEASED") {
    await reject(null, "REJECTED", ["REUSED"], "Authorization already RELEASED", 409);
  }
  if (current.status === "STOPPED") {
    await reject(null, "REJECTED", ["REUSED"], "Authorization already STOPPED", 409);
  }
  if (current.status === "CANCELLED") {
    await reject(null, "REJECTED", ["CANCELLED"], "Authorization is CANCELLED", 409);
  }
  if (current.status === "EXPIRED") {
    await reject(null, "REJECTED", ["EXPIRED"], "Authorization is EXPIRED", 409);
  }

  const assignment = await prisma.dispatchAssignment.findUnique({ where: { id: current.assignmentId } });
  if (!assignment || assignment.status !== DispatchAssignmentStatus.ACTIVE) {
    await reject("STOPPED", "STOPPED", ["NO_ACTIVE_ASSIGNMENT"], "Active DispatchAssignment is no longer present", 409);
  }
  if (
    assignment &&
    (assignment.driverId !== current.driverId ||
      assignment.tractorEquipmentId !== current.tractorEquipmentId ||
      (assignment.trailerEquipmentId ?? null) !== (current.trailerEquipmentId ?? null) ||
      assignment.loadId !== current.loadId)
  ) {
    await reject("STOPPED", "STOPPED", ["ASSIGNMENT_DRIFT"], "DispatchAssignment identities drifted from this authorization", 409);
  }

  type VerifyCommitResult =
    | {
        kind: "movement_denied";
        attempt: Awaited<ReturnType<typeof writeAttempt>>;
        updated: PickupAuthorizationWithGraph;
        reason: string;
        reasonCodes: PickupStopReasonCode[];
      }
    | {
        kind: "authorized";
        attempt: Awaited<ReturnType<typeof writeAttempt>>;
        updated: PickupAuthorizationWithGraph;
      }
    | {
        kind: "reconciliation_denied";
        attempt: Awaited<ReturnType<typeof writeAttempt>>;
        updated: PickupAuthorizationWithGraph;
        reason: string;
        reasonCodes: PickupStopReasonCode[];
      }
    | {
        kind: "released";
        attempt: Awaited<ReturnType<typeof writeAttempt>>;
        updated: PickupAuthorizationWithGraph;
        decisionSummary: string;
      };

  const commitResult = await prisma.$transaction(async (tx): Promise<VerifyCommitResult> => {
    await requireDispatchMutationRole(tx, sessionUser, current.fleetId, current.id);

    const movement = await authorizeMovement(tx, "PICKUP_VERIFY", {
      sessionUser: sessionUser!,
      loadId: current.loadId,
      assignmentId: current.assignmentId,
    });
    // Stage 0 I-7: authorizeMovement holds the driver qualification lock. Re-read the authorization under it, so
    // a cancellation committed by movement invalidation while this request waited is not overwritten.
    const locked = await tx.pickupAuthorization.findUnique({ where: { id: current.id }, select: { status: true } });
    if (!locked || !ACTIVE_PICKUP_STATUSES.includes(locked.status)) {
      throw Object.assign(new Error(`Pickup authorization is ${locked?.status ?? "missing"}`), { statusCode: 409 });
    }
    if (!movement.allowed) {
      const reason = movement.summary || PICKUP_BLOCKED_MOVEMENT_AUTHORIZATION;
      const reasonCodes: PickupStopReasonCode[] = movement.reasonCodes.includes("NO_TRIP_RELEASE")
        ? ["NO_TRIP_RELEASE"]
        : (movement.reasonCodes as PickupStopReasonCode[]);
      const attempt = await writeAttempt(
        {
          authorizationId: current.id,
          fleetId: current.fleetId,
          method,
          result: "STOPPED",
          presentedTokenValid: tokenValid,
          presented,
          reason,
          reasonCodes,
          actorUserId: actorId,
        },
        tx,
      );
      const updated = await tx.pickupAuthorization.update({
        where: { id: current.id },
        data: {
          status: "STOPPED",
          stoppedAt: new Date(),
          reason,
          reasonCodes: reasonCodes as Prisma.InputJsonValue,
        },
        include: pickupAuthorizationGraphInclude,
      });
      return { kind: "movement_denied", attempt, updated, reason, reasonCodes };
    }

    if (!hasPresentedIdentities(presented)) {
      const attempt = await writeAttempt(
        {
          authorizationId: current.id,
          fleetId: current.fleetId,
          method,
          result: "AUTHORIZED",
          presentedTokenValid: true,
          presented,
          reason: "Credential accepted. Awaiting presented identities for reconciliation.",
          reasonCodes: [],
          actorUserId: actorId,
        },
        tx,
      );
      const updated = await tx.pickupAuthorization.update({
        where: { id: current.id },
        data: { status: "AUTHORIZED" },
        include: pickupAuthorizationGraphInclude,
      });
      return { kind: "authorized", attempt, updated };
    }

    const decision = evaluatePickupReconciliation(
      {
        authorizationId: current.id,
        loadId: current.loadId,
        driverId: current.driverId,
        tractorEquipmentId: current.tractorEquipmentId,
        trailerEquipmentId: current.trailerEquipmentId,
      },
      { ...presented, authorizationId: presented.authorizationId ?? authorizationId },
    );

    if (!decision.match) {
      const attempt = await writeAttempt(
        {
          authorizationId: current.id,
          fleetId: current.fleetId,
          method,
          result: "STOPPED",
          presentedTokenValid: true,
          presented: { ...presented, authorizationId: presented.authorizationId ?? current.id },
          reason: decision.summary,
          reasonCodes: decision.reasonCodes,
          actorUserId: actorId,
        },
        tx,
      );
      const updated = await tx.pickupAuthorization.update({
        where: { id: current.id },
        data: {
          status: "STOPPED",
          stoppedAt: new Date(),
          reason: decision.summary,
          reasonCodes: decision.reasonCodes as Prisma.InputJsonValue,
        },
        include: pickupAuthorizationGraphInclude,
      });
      return {
        kind: "reconciliation_denied",
        attempt,
        updated,
        reason: decision.summary,
        reasonCodes: decision.reasonCodes,
      };
    }

    const attempt = await writeAttempt(
      {
        authorizationId: current.id,
        fleetId: current.fleetId,
        method,
        result: "RELEASED",
        presentedTokenValid: true,
        presented: { ...presented, authorizationId: presented.authorizationId ?? current.id },
        reason: decision.summary,
        reasonCodes: [],
        actorUserId: actorId,
      },
      tx,
    );
    const updated = await tx.pickupAuthorization.update({
      where: { id: current.id },
      data: {
        status: "RELEASED",
        releasedAt: new Date(),
        reason: decision.summary,
        reasonCodes: [] as Prisma.InputJsonValue,
      },
      include: pickupAuthorizationGraphInclude,
    });
    return { kind: "released", attempt, updated, decisionSummary: decision.summary };
  });

  if (commitResult.kind === "movement_denied" || commitResult.kind === "reconciliation_denied") {
    await createAuditRecord({
      actorId,
      actorEmail: sessionUser!.email ?? null,
      tenantId: current.fleetId,
      action: "UPDATED",
      entityType: "PickupAuthorization",
      entityId: current.id,
      details: {
        event: "pickup.verification_attempt",
        result: "STOPPED",
        reason: commitResult.reason,
        reasonCodes: commitResult.reasonCodes,
        method,
        physicalVerificationPerformed: false,
      },
      metadata: { source: "pickup-authorization-service" },
    });
    await recordPickupEvent(sessionUser!, {
      fleetId: current.fleetId,
      loadId: current.loadId,
      authorizationId: current.id,
      eventType: "PICKUP_STOPPED",
      entityType: "PickupVerificationAttempt",
      entityId: commitResult.attempt.id,
      priorState: current.status,
      resultingState: commitResult.updated.status,
      decisionResult: "STOPPED",
      decisionReason: commitResult.reason,
      relatedRecordType: "PickupVerificationAttempt",
      relatedRecordId: commitResult.attempt.id,
    });
    throw Object.assign(new Error(commitResult.reason), {
      statusCode: 409,
      payload: {
        authorization: toPublicAuthorization(commitResult.updated),
        attempt: toPublicAttempt(commitResult.attempt),
        physicalVerificationNote: PHASE1_PHYSICAL_VERIFICATION_NOTE,
      },
    });
  }

  if (commitResult.kind === "authorized") {
    const { attempt, updated } = commitResult;
    await createAuditRecord({
      actorId,
      actorEmail: sessionUser!.email ?? null,
      tenantId: current.fleetId,
      action: "UPDATED",
      entityType: "PickupAuthorization",
      entityId: current.id,
      details: { event: "pickup.authorized", method, physicalVerificationPerformed: false },
      metadata: { source: "pickup-authorization-service" },
    });
    await recordPickupEvent(sessionUser!, {
      fleetId: current.fleetId,
      loadId: current.loadId,
      authorizationId: current.id,
      eventType: "PICKUP_VERIFICATION_RECORDED",
      entityType: "PickupVerificationAttempt",
      entityId: attempt.id,
      priorState: current.status,
      resultingState: "AUTHORIZED",
      decisionResult: "AUTHORIZED",
      decisionReason: "Credential accepted pending identity reconciliation",
      relatedRecordType: "PickupVerificationAttempt",
      relatedRecordId: attempt.id,
    });
    return {
      authorization: toPublicAuthorization(updated),
      attempt: toPublicAttempt(attempt),
      physicalVerificationNote: PHASE1_PHYSICAL_VERIFICATION_NOTE,
    };
  }

  const { attempt, updated, decisionSummary } = commitResult;
  await createAuditRecord({
    actorId,
    actorEmail: sessionUser!.email ?? null,
    tenantId: current.fleetId,
    action: "UPDATED",
    entityType: "PickupAuthorization",
    entityId: current.id,
    details: {
      event: "pickup.released",
      method,
      physicalVerificationPerformed: false,
      physicalIdentityClass: "UNVERIFIED",
      physicalEquipmentClass: "UNVERIFIED",
    },
    metadata: { source: "pickup-authorization-service" },
  });
  await recordPickupEvent(sessionUser!, {
    fleetId: current.fleetId,
    loadId: current.loadId,
    authorizationId: current.id,
    eventType: "PICKUP_RELEASED",
    entityType: "PickupAuthorization",
    entityId: current.id,
    priorState: current.status,
    resultingState: "RELEASED",
    decisionResult: "RELEASED",
    decisionReason: decisionSummary,
    relatedRecordType: "PickupVerificationAttempt",
    relatedRecordId: attempt.id,
  });

  return {
    authorization: toPublicAuthorization(updated),
    attempt: toPublicAttempt(attempt),
    physicalVerificationNote: PHASE1_PHYSICAL_VERIFICATION_NOTE,
  };
}

export async function listPickupAuthorizationsForSpine(sessionUser: SessionUserLike | null | undefined) {
  const rows = await listPickupAuthorizations(sessionUser);
  return rows.slice(0, 25).map((row) => ({
    id: row.id,
    loadId: row.loadId,
    fleetId: row.fleetId,
    driverId: row.driverId,
    status: row.status,
    reason: row.reason,
    expiresAt: row.expiresAt,
    releasedAt: row.releasedAt,
    stoppedAt: row.stoppedAt,
    updatedAt: row.updatedAt,
    physicalDisposition: row.physicalDisposition,
    physicalException: row.physicalException,
  }));
}
