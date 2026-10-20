import { DispatchReleaseDisposition, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  AuthoritativeQualificationError,
  getAuthoritativeDriverQualification,
  type AuthoritativeDriverQualification,
} from "@/lib/services/authoritativeDriverQualificationService";
import {
  assembleReleaseInputsInTx,
  DISPATCH_RELEASE_BLOCKED_NO_ASSIGNMENT,
  evaluatePlanningEquipmentSafety,
  evaluateReleaseWithDriverQualification,
  type DispatchReleaseEvaluation,
} from "@/lib/services/dispatchReleaseService";
import { authorizedFleetAccess, type SessionUserLike } from "@/lib/services/intakeService";
import { findLoadByOperatorKey } from "@/lib/services/loadService";
import { lockDriverReadinessWrite } from "@/lib/services/readinessService";

export const MOVEMENT_AUTHORIZATION_POLICY_VERSION = "bof-stage0-movement-v1" as const;

export type MovementAuthorizationStage =
  | "PLANNING_RESERVE"
  | "RELEASE"
  | "PICKUP_ISSUE"
  | "PICKUP_VERIFY";

export type MovementAuthorizationDisposition =
  | "PLANNING_ALLOWED"
  | "PLANNING_DENIED"
  | "RELEASED"
  | "CONDITIONALLY_RELEASED"
  | "HOLD"
  | "BLOCKED";

export type MovementAuthorizationResult = {
  stage: MovementAuthorizationStage;
  allowed: boolean;
  disposition: MovementAuthorizationDisposition;
  reasonCodes: string[];
  summary: string;
  policyVersion: typeof MOVEMENT_AUTHORIZATION_POLICY_VERSION;
  qualificationSnapshotId: string | null;
  driverQualificationPolicyVersion: string | null;
  equipmentPolicyVersion: string | null;
  releaseEvaluation?: DispatchReleaseEvaluation;
};

export type MovementAuthorizationContext = {
  sessionUser: SessionUserLike;
  loadId: string;
  assignmentId?: string;
};

function requireSessionUser(sessionUser: SessionUserLike | null | undefined) {
  if (!sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
}

function uniqueReasonCodes(codes: string[]) {
  return [...new Set(codes.filter((code) => code.length > 0))];
}

function planningDriverBlocks(driverQualification: AuthoritativeDriverQualification): boolean {
  return (
    driverQualification.status === "NOT_QUALIFIED" ||
    driverQualification.status === "PENDING_COMPLIANCE" ||
    (driverQualification.status === "CONDITIONAL" && !driverQualification.conditionalMovementPermitted)
  );
}

function mapReleaseDispositionToMovement(
  releaseDisposition: DispatchReleaseDisposition,
): MovementAuthorizationDisposition {
  switch (releaseDisposition) {
    case "RELEASED":
      return "RELEASED";
    case "CONDITIONALLY_RELEASED":
      return "CONDITIONALLY_RELEASED";
    case "HOLD":
      return "HOLD";
    default:
      return "BLOCKED";
  }
}

function movementAllowedForReleaseDisposition(disposition: DispatchReleaseDisposition): boolean {
  return disposition === "RELEASED" || disposition === "CONDITIONALLY_RELEASED";
}

export function composeMovementAuthorization(
  stage: MovementAuthorizationStage,
  driverQualification: AuthoritativeDriverQualification,
  releaseInputs: Parameters<typeof evaluateReleaseWithDriverQualification>[0],
): MovementAuthorizationResult {
  const driverReasons = [...driverQualification.reasonCodes];

  if (stage === "PLANNING_RESERVE") {
    const planningEquipment = evaluatePlanningEquipmentSafety(releaseInputs);
    const driverBlocked = planningDriverBlocks(driverQualification);
    const equipmentBlocked = planningEquipment.blocked;
    const reasonCodes = uniqueReasonCodes([
      ...driverReasons,
      ...planningEquipment.reasonCodes,
      ...(driverBlocked ? ["DRIVER_PLANNING_DENIED"] : []),
      ...(equipmentBlocked ? ["EQUIPMENT_PLANNING_DENIED"] : []),
    ]);
    const allowed = !driverBlocked && !equipmentBlocked;
    return {
      stage,
      allowed,
      disposition: allowed ? "PLANNING_ALLOWED" : "PLANNING_DENIED",
      reasonCodes,
      summary: allowed
        ? "Planning reservation is permitted under Stage 0 movement policy."
        : "Planning reservation is denied under Stage 0 movement policy.",
      policyVersion: MOVEMENT_AUTHORIZATION_POLICY_VERSION,
      qualificationSnapshotId: driverQualification.qualificationSnapshotId,
      driverQualificationPolicyVersion: driverQualification.policyVersion,
      equipmentPolicyVersion: null,
    };
  }

  const releaseEvaluation = evaluateReleaseWithDriverQualification(releaseInputs, driverQualification);
  const reasonCodes = uniqueReasonCodes([
    ...driverReasons,
    ...releaseEvaluation.reasonCodes,
  ]);
  const allowed = movementAllowedForReleaseDisposition(releaseEvaluation.disposition);

  return {
    stage,
    allowed,
    disposition: mapReleaseDispositionToMovement(releaseEvaluation.disposition),
    reasonCodes,
    summary: releaseEvaluation.summary,
    policyVersion: MOVEMENT_AUTHORIZATION_POLICY_VERSION,
    qualificationSnapshotId: driverQualification.qualificationSnapshotId,
    driverQualificationPolicyVersion: driverQualification.policyVersion,
    equipmentPolicyVersion: releaseEvaluation.policyVersion,
    releaseEvaluation,
  };
}

function qualificationEvaluationFailedResult(
  stage: MovementAuthorizationStage,
  message: string,
): MovementAuthorizationResult {
  return {
    stage,
    allowed: false,
    disposition: stage === "PLANNING_RESERVE" ? "PLANNING_DENIED" : "BLOCKED",
    reasonCodes: ["QUALIFICATION_EVALUATION_FAILED"],
    summary: message,
    policyVersion: MOVEMENT_AUTHORIZATION_POLICY_VERSION,
    qualificationSnapshotId: null,
    driverQualificationPolicyVersion: null,
    equipmentPolicyVersion: null,
  };
}

export async function authorizeMovement(
  tx: Prisma.TransactionClient,
  stage: MovementAuthorizationStage,
  context: MovementAuthorizationContext,
): Promise<MovementAuthorizationResult> {
  requireSessionUser(context.sessionUser);

  const load = await findLoadByOperatorKey(context.loadId);
  if (!load) {
    throw Object.assign(new Error("Load not found"), { statusCode: 404 });
  }

  const access = await authorizedFleetAccess(context.sessionUser, load.fleetId);
  if (!access.allowed) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  const assignment = await tx.dispatchAssignment.findFirst({
    where: {
      loadId: load.id,
      status: "ACTIVE",
      ...(context.assignmentId ? { id: context.assignmentId } : {}),
    },
    include: {
      load: true,
      driver: { select: { id: true, fleetId: true } },
      tractorEquipment: true,
      trailerEquipment: true,
    },
    orderBy: [{ assignedAt: "desc" }, { createdAt: "desc" }],
  });

  if (!assignment) {
    throw Object.assign(new Error(DISPATCH_RELEASE_BLOCKED_NO_ASSIGNMENT), { statusCode: 409 });
  }

  if (assignment.fleetId !== load.fleetId) {
    throw Object.assign(new Error("Assignment fleet does not match load fleet"), { statusCode: 422 });
  }

  const driverId = assignment.driverId;
  const fleetId = assignment.fleetId;

  await lockDriverReadinessWrite(tx, driverId);

  let driverQualification: AuthoritativeDriverQualification;
  try {
    driverQualification = await getAuthoritativeDriverQualification(tx, driverId, fleetId);
  } catch (error) {
    if (error instanceof AuthoritativeQualificationError) {
      return qualificationEvaluationFailedResult(stage, error.message);
    }
    throw error;
  }

  const releaseInputs = await assembleReleaseInputsInTx(tx, load, assignment);
  return composeMovementAuthorization(stage, driverQualification, releaseInputs);
}

export async function authorizeMovementForLoad(
  sessionUser: SessionUserLike,
  loadId: string,
  stage: MovementAuthorizationStage,
  assignmentId?: string,
): Promise<MovementAuthorizationResult> {
  return prisma.$transaction(async (tx) =>
    authorizeMovement(tx, stage, { sessionUser, loadId, assignmentId }),
  );
}

/** Legacy non-transactional helper — prefer authorizeMovement inside caller transactions. */
export async function requireMovementAuthorization(
  sessionUser: SessionUserLike,
  loadId: string,
  stage: MovementAuthorizationStage = "RELEASE",
): Promise<MovementAuthorizationResult> {
  const result = await authorizeMovementForLoad(sessionUser, loadId, stage);
  if (!result.allowed) {
    throw Object.assign(new Error(result.summary), {
      statusCode: 409,
      payload: { result },
    });
  }
  return result;
}
