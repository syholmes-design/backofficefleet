import {
  OperationalChatParticipantRole,
  type OperatingOwnerTeam,
  type PickupAuthorizationStatus,
  type Prisma,
} from "@prisma/client";

import { createAuditRecord } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import {
  AuthoritativeQualificationError,
  getAuthoritativeDriverQualification,
} from "@/lib/services/authoritativeDriverQualificationService";
import {
  composeMovementAuthorization,
  composePlanningAuthorization,
  type MovementAuthorizationResult,
} from "@/lib/services/dispatchMovementAuthorizationService";
import { assembleReleaseInputsInTx, writeDispatchReleaseInTx } from "@/lib/services/dispatchReleaseService";
import type { SessionUserLike } from "@/lib/services/intakeService";
import { lockDriverReadinessWrite } from "@/lib/services/readinessService";

/**
 * Stage 0 I-7: when a driver stops being eligible to move, authorizations already issued for that driver stop
 * counting (contract §5). Nothing is deleted and nothing is reinstated automatically:
 *
 * | Assignment state at the change          | Consequence                                                         |
 * | --------------------------------------- | ------------------------------------------------------------------- |
 * | ASSIGNED (no movement-authorizing release) | assignment kept; hold exception opened or updated; Dispatch + Compliance notified |
 * | RELEASED (no pickup issued)             | BLOCKED release appended after the kept release; exception             |
 * | PICKUP_ISSUED (PENDING / AUTHORIZED)    | pickup CANCELLED with an audited reason; BLOCKED release; exception    |
 * | IN_MOTION (a pickup was RELEASED)        | history kept, no automatic stop; CRITICAL escalation to Dispatch, Compliance and carrier management, with a documented operational disposition required |
 *
 * Corrected qualification needs a fresh RELEASE and a new pickup authorization through authorizeMovement.
 *
 * `invalidateAssignmentMovementAuthorization` is the shared step for driver (I-7) and equipment (I-8, Cursor)
 * triggers; it re-evaluates with the existing evaluators and never decides eligibility itself.
 */

export const DRIVER_QUALIFICATION_MOVEMENT_HOLD = "DRIVER_QUALIFICATION_MOVEMENT_HOLD" as const;

export type MovementInvalidationState = "ASSIGNED" | "RELEASED" | "PICKUP_ISSUED" | "IN_MOTION";

export type MovementInvalidationActor = { id: string; email?: string | null };

export type MovementInvalidationCause = {
  /** OperatingException.exceptionType, e.g. DRIVER_QUALIFICATION_MOVEMENT_HOLD (I-7) or the I-8 equipment hold. */
  exceptionType: string;
  /** What changed, recorded on cancelled pickups and in the audit trail (e.g. DOCUMENT_STATUS_CHANGED). */
  trigger: string;
  /** Team that must correct the underlying eligibility (COMPLIANCE for drivers, SAFETY for equipment). */
  correctiveOwnerTeam: OperatingOwnerTeam;
  correctiveActionType: string;
  summary: string;
};

export type MovementInvalidationOutcome = {
  assignmentId: string;
  fleetId: string;
  state: MovementInvalidationState;
  reasonCodes: string[];
  appendedReleaseId: string | null;
  cancelledPickupIds: string[];
  exceptionId: string;
  exceptionCreated: boolean;
  notifiedUserIds: string[];
};

const LIVE_PICKUP_STATUSES: PickupAuthorizationStatus[] = ["PENDING", "AUTHORIZED"];
const MOVEMENT_RELEASE_DISPOSITIONS = new Set(["RELEASED", "CONDITIONALLY_RELEASED"]);
const OPEN_EXCEPTION_STATUSES = ["OPEN", "IN_PROGRESS"] as const;
const SEVERITY_RANK: Record<string, number> = { MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
const SEVERITY_BY_STATE: Record<MovementInvalidationState, string> = {
  ASSIGNED: "MEDIUM",
  RELEASED: "HIGH",
  PICKUP_ISSUED: "HIGH",
  IN_MOTION: "CRITICAL",
};

/** Fleet roles notified of a movement hold, by the chat participant role they take on the escalation thread. */
const NOTIFIED_ROLES: Record<string, OperationalChatParticipantRole> = {
  DISPATCH: OperationalChatParticipantRole.DISPATCH,
  FLEET_OPERATIONS: OperationalChatParticipantRole.DISPATCH,
  FLEET_MANAGER: OperationalChatParticipantRole.FLEET_MANAGER,
  BOF_OPERATIONS: OperationalChatParticipantRole.BOF_OPERATIONS,
  BOF_COMPLIANCE_REVIEW: OperationalChatParticipantRole.SAFETY,
  FLEET_ADMIN: OperationalChatParticipantRole.FLEET_OWNER,
};

function uniqueCodes(codes: string[]) {
  return [...new Set(codes.filter((code) => code.length > 0))];
}

function consequenceFor(state: MovementInvalidationState) {
  switch (state) {
    case "IN_MOTION":
      return "Shipment is already moving under an authorization that is no longer valid. Dispatch must record the operational disposition; nothing was stopped automatically.";
    case "PICKUP_ISSUED":
      return "Issued pickup authorization was cancelled and the trip release blocked. A new release and pickup authorization are required after correction.";
    case "RELEASED":
      return "Trip release was blocked. A new release and pickup authorization are required after correction.";
    default:
      return "Assignment is held: release and pickup will be refused until eligibility is restored. Dispatch may reassign.";
  }
}

/**
 * Shared invalidation step for one ACTIVE assignment. The caller must hold the lock that serializes the
 * triggering change with movement authorization (the driver qualification lock for qualification changes).
 * Returns null when the assignment is no longer ACTIVE or the current evaluation still authorizes movement.
 */
export async function invalidateAssignmentMovementAuthorization(
  tx: Prisma.TransactionClient,
  input: { assignmentId: string; actor: MovementInvalidationActor; cause: MovementInvalidationCause },
): Promise<MovementInvalidationOutcome | null> {
  const { actor, cause } = input;
  const assignment = await tx.dispatchAssignment.findUnique({
    where: { id: input.assignmentId },
    include: {
      load: true,
      driver: { select: { id: true, fleetId: true } },
      tractorEquipment: true,
      trailerEquipment: true,
    },
  });
  if (!assignment || assignment.status !== "ACTIVE") return null;

  const pickups = await tx.pickupAuthorization.findMany({
    where: { assignmentId: assignment.id, fleetId: assignment.fleetId },
    select: { id: true, status: true },
  });
  const latestRelease = await tx.dispatchRelease.findFirst({
    where: { assignmentId: assignment.id, fleetId: assignment.fleetId },
    orderBy: [{ evaluatedAt: "desc" }, { createdAt: "desc" }],
    select: { id: true, disposition: true },
  });
  const livePickupIds = pickups.filter((pickup) => LIVE_PICKUP_STATUSES.includes(pickup.status)).map((pickup) => pickup.id);
  const inMotion = pickups.some((pickup) => pickup.status === "RELEASED");
  const releaseAuthorizesMovement = Boolean(latestRelease && MOVEMENT_RELEASE_DISPOSITIONS.has(latestRelease.disposition));
  const state: MovementInvalidationState = inMotion
    ? "IN_MOTION"
    : livePickupIds.length > 0
      ? "PICKUP_ISSUED"
      : releaseAuthorizesMovement
        ? "RELEASED"
        : "ASSIGNED";

  // Re-evaluate with the authoritative evaluators. Evaluation failure is a denial (fail closed).
  let movement: MovementAuthorizationResult | null = null;
  let inputs: Awaited<ReturnType<typeof assembleReleaseInputsInTx>> | null = null;
  let reasonCodes: string[];
  try {
    const qualification = await getAuthoritativeDriverQualification(tx, assignment.driverId, assignment.fleetId);
    inputs = await assembleReleaseInputsInTx(tx, assignment.load, assignment);
    movement = composeMovementAuthorization("RELEASE", qualification, inputs);
    if (movement.allowed) return null;
    reasonCodes = movement.reasonCodes;
  } catch (error) {
    const evaluationFailed = error instanceof AuthoritativeQualificationError;
    const statusCode = (error as { statusCode?: number } | null)?.statusCode;
    if (!evaluationFailed && statusCode !== 409) throw error;
    reasonCodes = [evaluationFailed ? "QUALIFICATION_EVALUATION_FAILED" : "RELEASE_INPUTS_UNAVAILABLE"];
  }
  reasonCodes = uniqueCodes([cause.trigger, ...reasonCodes]);

  // RELEASED and later: append the blocked evaluation after the kept release, so no stale release authorizes.
  let appendedReleaseId: string | null = null;
  if (releaseAuthorizesMovement && movement?.releaseEvaluation && inputs) {
    const appended = await writeDispatchReleaseInTx(tx, actor, inputs, movement.releaseEvaluation);
    appendedReleaseId = appended.id;
  }

  // Issued or authorized pickups are cancelled; a RELEASED (moving) pickup is history and is not rewritten.
  // Each update is conditional on the pickup still being live: one closed concurrently (e.g. an operator
  // cancellation, which does not take the driver lock) is left as it is, and the triggering write still commits.
  const cancelledPickupIds: string[] = [];
  const cancelledAt = new Date();
  for (const pickupId of livePickupIds) {
    const cancelled = await tx.pickupAuthorization.updateMany({
      where: { id: pickupId, status: { in: LIVE_PICKUP_STATUSES } },
      data: {
        status: "CANCELLED",
        cancelledAt,
        cancelledByUserId: actor.id,
        reason: cause.summary,
        reasonCodes: reasonCodes as Prisma.InputJsonValue,
      },
    });
    if (cancelled.count === 1) cancelledPickupIds.push(pickupId);
  }
  if (cancelledPickupIds.length > 0) {
    for (const pickupId of cancelledPickupIds) {
      await createAuditRecord({
        actorId: actor.id,
        actorEmail: actor.email ?? null,
        tenantId: assignment.fleetId,
        action: "UPDATED",
        entityType: "PickupAuthorization",
        entityId: pickupId,
        details: { event: "pickup.cancelled", status: "CANCELLED", reason: cause.summary, reasonCodes, trigger: cause.trigger, assignmentId: assignment.id },
        metadata: { source: "movement-invalidation-service" },
      }, tx);
    }
  }

  const exception = await openOrUpdateHoldException(tx, {
    assignment,
    actor,
    cause,
    state,
    reasonCodes,
    changed: appendedReleaseId !== null || cancelledPickupIds.length > 0,
  });

  await createAuditRecord({
    actorId: actor.id,
    actorEmail: actor.email ?? null,
    tenantId: assignment.fleetId,
    action: "UPDATED",
    entityType: "DispatchAssignment",
    entityId: assignment.id,
    details: {
      event: "movement.authorization_invalidated",
      state,
      trigger: cause.trigger,
      exceptionType: cause.exceptionType,
      reasonCodes,
      loadId: assignment.loadId,
      driverId: assignment.driverId,
      previousReleaseId: latestRelease?.id ?? null,
      appendedReleaseId,
      cancelledPickupIds,
      exceptionId: exception.id,
      assignmentRetained: true,
    },
    metadata: { source: "movement-invalidation-service" },
  }, tx);

  return {
    assignmentId: assignment.id,
    fleetId: assignment.fleetId,
    state,
    reasonCodes,
    appendedReleaseId,
    cancelledPickupIds,
    exceptionId: exception.id,
    exceptionCreated: exception.created,
    notifiedUserIds: exception.notifiedUserIds,
  };
}

async function openOrUpdateHoldException(
  tx: Prisma.TransactionClient,
  input: {
    assignment: { id: string; fleetId: string; loadId: string; driverId: string };
    actor: MovementInvalidationActor;
    cause: MovementInvalidationCause;
    state: MovementInvalidationState;
    reasonCodes: string[];
    changed: boolean;
  },
) {
  const { assignment, actor, cause, state } = input;
  const severity = SEVERITY_BY_STATE[state];
  const deviation = `${cause.summary} Reason codes: ${input.reasonCodes.join(", ")}.`;
  const consequence = consequenceFor(state);

  const existing = await tx.operatingException.findFirst({
    where: {
      fleetId: assignment.fleetId,
      entityType: "DispatchAssignment",
      entityId: assignment.id,
      exceptionType: cause.exceptionType,
      status: { in: [...OPEN_EXCEPTION_STATUSES] },
    },
    orderBy: { createdAt: "desc" },
  });

  let exceptionId: string;
  let created = false;
  let escalated = false;
  if (!existing) {
    const row = await tx.operatingException.create({
      data: {
        fleetId: assignment.fleetId,
        loadId: assignment.loadId,
        entityType: "DispatchAssignment",
        entityId: assignment.id,
        processStage: state === "ASSIGNED" ? "DISPATCH" : "RELEASE",
        exceptionType: cause.exceptionType,
        deviation,
        consequence,
        severity,
        ownerTeam: "DISPATCH",
        ownerUserId: null,
        dueAt: state === "IN_MOTION" ? new Date() : null,
      },
    });
    exceptionId = row.id;
    created = true;
  } else {
    exceptionId = existing.id;
    escalated = (SEVERITY_RANK[severity] ?? 0) > (SEVERITY_RANK[existing.severity] ?? 0);
    // Repeated detection of the same condition (e.g. the scheduled sweep) leaves the exception as it is.
    if (!input.changed && !escalated) {
      return { id: exceptionId, created, notifiedUserIds: [] as string[] };
    }
    await tx.operatingException.update({
      where: { id: existing.id },
      data: {
        severity: escalated ? severity : existing.severity,
        deviation,
        consequence,
        processStage: state === "ASSIGNED" ? existing.processStage : "RELEASE",
        recurrenceCount: { increment: 1 },
        ...(state === "IN_MOTION" && !existing.dueAt ? { dueAt: new Date() } : {}),
      },
    });
  }

  // Corrective actions: Dispatch holds or reassigns (or, once moving, records the operational disposition);
  // the eligibility owner corrects the cause. Existing open actions of the same type are not duplicated.
  const requiredActions: Array<{ actionType: string; team: OperatingOwnerTeam }> = [
    { actionType: state === "IN_MOTION" ? "DOCUMENT_OPERATIONAL_DISPOSITION" : "HOLD_OR_REASSIGN_LOAD", team: "DISPATCH" },
    { actionType: cause.correctiveActionType, team: cause.correctiveOwnerTeam },
  ];
  for (const required of requiredActions) {
    const present = await tx.operatingCorrectiveAction.findFirst({
      where: { exceptionId, fleetId: assignment.fleetId, actionType: required.actionType, status: { not: "VERIFIED" } },
      select: { id: true },
    });
    if (!present) {
      await tx.operatingCorrectiveAction.create({
        data: {
          fleetId: assignment.fleetId,
          exceptionId,
          loadId: assignment.loadId,
          actionType: required.actionType,
          assignedOwnerTeam: required.team,
          status: "ASSIGNED",
        },
      });
    }
  }

  await createAuditRecord({
    actorId: actor.id,
    actorEmail: actor.email ?? null,
    tenantId: assignment.fleetId,
    action: created ? "CREATED" : "UPDATED",
    entityType: "OperatingException",
    entityId: exceptionId,
    details: { event: created ? "exception.opened" : "exception.updated", exceptionType: cause.exceptionType, state, severity, assignmentId: assignment.id },
    metadata: { source: "movement-invalidation-service" },
  }, tx);

  const notifiedUserIds = await notifyFleetResponders(tx, { assignment, actor, cause, state, exceptionId, deviation, consequence });
  return { id: exceptionId, created, notifiedUserIds };
}

/**
 * Dispatch, Compliance/Safety and carrier management are notified through the existing operational chat:
 * one SAFETY_COMPLIANCE_THREAD per exception, with participants drawn from ACTIVE memberships of the
 * assignment's own fleet only.
 */
async function notifyFleetResponders(
  tx: Prisma.TransactionClient,
  input: {
    assignment: { id: string; fleetId: string; loadId: string };
    actor: MovementInvalidationActor;
    cause: MovementInvalidationCause;
    state: MovementInvalidationState;
    exceptionId: string;
    deviation: string;
    consequence: string;
  },
) {
  const { assignment, actor } = input;
  const memberships = await tx.fleetMembership.findMany({
    where: {
      fleetId: assignment.fleetId,
      status: "ACTIVE",
      user: { status: "ACTIVE" },
      role: { code: { in: Object.keys(NOTIFIED_ROLES) } },
    },
    select: { userId: true, role: { select: { code: true } } },
  });
  const recipients = new Map<string, OperationalChatParticipantRole>();
  for (const membership of memberships) {
    recipients.set(membership.userId, NOTIFIED_ROLES[membership.role.code]);
  }

  let thread = await tx.operationalChatThread.findFirst({
    where: { tenantId: assignment.fleetId, recordType: "EXCEPTION", recordId: input.exceptionId },
    select: { id: true },
  });
  if (!thread) {
    thread = await tx.operationalChatThread.create({
      data: {
        tenantId: assignment.fleetId,
        type: "SAFETY_COMPLIANCE_THREAD",
        visibility: "INTERNAL",
        subject: `${input.cause.exceptionType}: load ${assignment.loadId}`,
        recordType: "EXCEPTION",
        recordId: input.exceptionId,
        nextAction: input.state === "IN_MOTION" ? "Record the operational disposition for the moving shipment" : "Hold or reassign the load; correct eligibility",
        createdById: actor.id,
      },
      select: { id: true },
    });
  }
  const threadId = thread.id;
  const existingParticipants = new Set(
    (await tx.operationalChatParticipant.findMany({ where: { threadId }, select: { userId: true } })).map((row) => row.userId),
  );
  const actorRole = recipients.get(actor.id) ?? OperationalChatParticipantRole.BOF_OPERATIONS;
  const participants = new Map(recipients);
  participants.set(actor.id, actorRole);
  const toAdd = [...participants.entries()].filter(([userId]) => !existingParticipants.has(userId));
  if (toAdd.length > 0) {
    await tx.operationalChatParticipant.createMany({
      data: toAdd.map(([userId, role]) => ({ threadId, tenantId: assignment.fleetId, userId, role, addedById: actor.id })),
      skipDuplicates: true,
    });
  }

  const message = await tx.operationalChatMessage.create({
    data: {
      threadId,
      tenantId: assignment.fleetId,
      senderId: actor.id,
      visibility: "INTERNAL",
      body: `${input.state === "IN_MOTION" ? "ESCALATION — shipment in motion. " : ""}${input.deviation} ${input.consequence}`,
    },
    select: { id: true },
  });
  const notifiedUserIds = [...recipients.keys()].filter((userId) => userId !== actor.id);
  if (notifiedUserIds.length > 0) {
    await tx.operationalChatNotification.createMany({
      data: notifiedUserIds.map((userId) => ({
        tenantId: assignment.fleetId,
        userId,
        threadId,
        messageId: message.id,
        kind: input.state === "IN_MOTION" ? "MOVEMENT_IN_MOTION_ESCALATION" : "MOVEMENT_AUTHORIZATION_HOLD",
      })),
    });
  }
  return notifiedUserIds;
}

/**
 * Driver trigger (I-7). Called inside the transaction that changed the driver's qualification evidence, with the
 * driver qualification lock held, so no release or pickup decision can interleave between the change and its
 * consequences. Re-evaluates with getAuthoritativeDriverQualification and acts only when the driver policy of
 * the movement service denies the driver.
 */
export async function invalidateDriverMovementAuthorizations(
  tx: Prisma.TransactionClient,
  input: { driverId: string; actor: MovementInvalidationActor; trigger: string },
): Promise<MovementInvalidationOutcome[]> {
  await lockDriverReadinessWrite(tx, input.driverId);
  const assignments = await tx.dispatchAssignment.findMany({
    where: { driverId: input.driverId, status: "ACTIVE" },
    include: { tractorEquipment: true, trailerEquipment: true },
    orderBy: { assignedAt: "asc" },
  });
  if (assignments.length === 0) return [];

  const outcomes: MovementInvalidationOutcome[] = [];
  for (const assignment of assignments) {
    let summary: string;
    try {
      const qualification = await getAuthoritativeDriverQualification(tx, assignment.driverId, assignment.fleetId);
      const driverPolicy = composePlanningAuthorization(qualification, {
        tractor: assignment.tractorEquipment,
        trailer: assignment.trailerEquipment,
      });
      if (!driverPolicy.reasonCodes.includes("DRIVER_PLANNING_DENIED")) continue;
      summary = `Driver qualification is ${qualification.status}; movement authorization is no longer valid.`;
    } catch (error) {
      if (!(error instanceof AuthoritativeQualificationError)) throw error;
      summary = "Driver qualification could not be evaluated; movement authorization is no longer valid.";
    }
    const outcome = await invalidateAssignmentMovementAuthorization(tx, {
      assignmentId: assignment.id,
      actor: input.actor,
      cause: {
        exceptionType: DRIVER_QUALIFICATION_MOVEMENT_HOLD,
        trigger: input.trigger,
        correctiveOwnerTeam: "COMPLIANCE",
        correctiveActionType: "RESOLVE_DRIVER_QUALIFICATION",
        summary,
      },
    });
    if (outcome) outcomes.push(outcome);
  }
  return outcomes;
}

const SWEEP_ROLE_CODES = ["BOF_OPERATIONS", "BOF_COMPLIANCE_REVIEW"];

/**
 * Scheduled detection of qualifications that lapse without a write (credential expiry). Re-evaluates every
 * driver on an ACTIVE assignment in the fleets where the actor holds an ACTIVE BOF_OPERATIONS or
 * BOF_COMPLIANCE_REVIEW membership (read from the database), each under its driver qualification lock.
 */
export async function sweepDriverQualificationInvalidations(
  actor: SessionUserLike | null | undefined,
  options: { fleetIds?: string[] } = {},
) {
  if (!actor?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
  const memberships = await prisma.fleetMembership.findMany({
    where: { userId: actor.id, status: "ACTIVE", user: { status: "ACTIVE" }, role: { code: { in: SWEEP_ROLE_CODES } } },
    select: { fleetId: true },
  });
  const authorizedFleetIds = new Set(memberships.map((membership) => membership.fleetId));
  const fleetIds = options.fleetIds ? options.fleetIds.filter((fleetId) => authorizedFleetIds.has(fleetId)) : [...authorizedFleetIds];
  if (fleetIds.length === 0 || (options.fleetIds && fleetIds.length !== options.fleetIds.length)) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  const drivers = await prisma.dispatchAssignment.findMany({
    where: { fleetId: { in: fleetIds }, status: "ACTIVE" },
    distinct: ["driverId"],
    select: { driverId: true },
  });
  const invalidated: MovementInvalidationOutcome[] = [];
  for (const { driverId } of drivers) {
    const outcomes = await prisma.$transaction((tx) =>
      invalidateDriverMovementAuthorizations(tx, {
        driverId,
        actor: { id: actor.id!, email: actor.email ?? null },
        trigger: "QUALIFICATION_SCHEDULED_REVIEW",
      }),
    );
    invalidated.push(...outcomes);
  }
  return { fleetIds, driversEvaluated: drivers.length, invalidated };
}
