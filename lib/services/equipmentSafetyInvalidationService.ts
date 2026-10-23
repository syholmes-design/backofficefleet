import {
  type Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  assembleReleaseInputsInTx,
  evaluateEquipmentSafety,
  type EquipmentSafetyEvaluation,
} from "@/lib/services/dispatchReleaseService";
import {
  invalidateAssignmentMovementAuthorization,
  type MovementInvalidationActor,
  type MovementInvalidationOutcome,
} from "@/lib/services/driverMovementInvalidationService";
import { lockDriverReadinessWrite } from "@/lib/services/readinessService";

export const EQUIPMENT_SAFETY_MOVEMENT_HOLD = "EQUIPMENT_SAFETY_MOVEMENT_HOLD" as const;

export type EquipmentInvalidationActor = MovementInvalidationActor;

export type EquipmentInvalidationTrigger =
  | "EQUIPMENT_STATUS_CHANGED"
  | "EQUIPMENT_OUT_OF_SERVICE"
  | "EQUIPMENT_UNAVAILABLE"
  | "CONDITION_THREAD_CREATED"
  | "CONDITION_THREAD_REOPENED"
  | "PRETRIP_DEFECT_RECORDED"
  | "PRETRIP_BLOCKING_DEFECT"
  | "PRETRIP_DEFECT";

const EQUIPMENT_REGRESSION_REASON_CODES = new Set([
  "TRUCK_OUT_OF_SERVICE",
  "TRUCK_UNAVAILABLE",
  "SAFETY_CRITICAL_CONDITION",
  "SAFETY_BLOCK",
  "PRETRIP_DEFECT",
]);

/**
 * Returns true if the equipment evaluation contains any blocking equipment defects or status disqualifications,
 * distinguishing actual safety regressions from routine incomplete pre-trips on newly assigned loads.
 */
export function hasEquipmentSafetyRegression(
  evaluation: Pick<EquipmentSafetyEvaluation, "reasonCodes">,
): boolean {
  return evaluation.reasonCodes.some((code) => EQUIPMENT_REGRESSION_REASON_CODES.has(code));
}

/**
 * Takes a PostgreSQL transaction-scoped advisory lock on an equipment record.
 * Serializes equipment modifications with movement authorizations (authorizeMovement).
 */
export async function lockEquipmentSafetyWrite(db: Prisma.TransactionClient, equipmentId: string): Promise<void> {
  await db.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`bof-equipment-safety:${equipmentId}`}))`;
}

/**
 * Takes PostgreSQL transaction-scoped advisory locks on multiple equipment records in deterministic (lexicographical) order.
 * This guarantees deadlock-free locking when multiple equipment (e.g. tractor and trailer) are locked together.
 */
export async function lockEquipmentSafetyWrites(
  db: Prisma.TransactionClient,
  equipmentIds: (string | null | undefined)[],
): Promise<void> {
  const uniqueSorted = [...new Set(equipmentIds.filter((id): id is string => Boolean(id && id.trim())))].sort();
  for (const id of uniqueSorted) {
    await lockEquipmentSafetyWrite(db, id);
  }
}

/**
 * Invalidates movement authorizations on ACTIVE assignments referencing the given equipment IDs.
 * Called inside the transaction holding the equipment safety lock(s).
 */
export async function invalidateEquipmentMovementAuthorizations(
  tx: Prisma.TransactionClient,
  input: {
    equipmentIds: string[];
    actor: EquipmentInvalidationActor;
    trigger: EquipmentInvalidationTrigger | string;
    summary?: string;
  },
): Promise<MovementInvalidationOutcome[]> {
  const equipmentIds = [...new Set(input.equipmentIds.filter((id): id is string => Boolean(id && id.trim())))];
  if (equipmentIds.length === 0) return [];

  await lockEquipmentSafetyWrites(tx, equipmentIds);

  const assignments = await tx.dispatchAssignment.findMany({
    where: {
      status: "ACTIVE",
      OR: [
        { tractorEquipmentId: { in: equipmentIds } },
        { trailerEquipmentId: { in: equipmentIds } },
      ],
    },
    include: {
      load: true,
      driver: { select: { id: true, fleetId: true } },
      tractorEquipment: true,
      trailerEquipment: true,
    },
    orderBy: { assignedAt: "asc" },
  });

  if (assignments.length === 0) return [];

  const outcomes: MovementInvalidationOutcome[] = [];

  for (const assignment of assignments) {
    const latestRelease = await tx.dispatchRelease.findFirst({
      where: { assignmentId: assignment.id, fleetId: assignment.fleetId },
      orderBy: [{ evaluatedAt: "desc" }, { createdAt: "desc" }],
      select: { id: true, disposition: true },
    });
    const livePickups = await tx.pickupAuthorization.findMany({
      where: {
        assignmentId: assignment.id,
        fleetId: assignment.fleetId,
        status: { in: ["PENDING", "AUTHORIZED", "RELEASED"] },
      },
      select: { id: true, status: true },
    });
    const releaseAuthorizes = Boolean(
      latestRelease && ["RELEASED", "CONDITIONALLY_RELEASED"].includes(latestRelease.disposition),
    );
    const hasLiveOrMovingPickups = livePickups.length > 0;

    try {
      const inputs = await assembleReleaseInputsInTx(tx, assignment.load, assignment);
      const equipmentEval = evaluateEquipmentSafety(inputs);
      const equipmentBlocksMovement = equipmentEval.blocked || equipmentEval.hold;
      if (!equipmentBlocksMovement) {
        continue;
      }
      // On ASSIGNED (not yet released, no live pickups), only act on equipment regressions — not routine
      // PRETRIP_INCOMPLETE unrelated to this equipment mutation.
      if (!releaseAuthorizes && !hasLiveOrMovingPickups && !hasEquipmentSafetyRegression(equipmentEval)) {
        continue;
      }
    } catch {
      // If release inputs cannot be assembled, fall through to shared re-evaluation.
    }

    await lockDriverReadinessWrite(tx, assignment.driverId);

    const summary =
      input.summary ?? "Equipment safety status disqualified; movement authorization is no longer valid.";

    const outcome = await invalidateAssignmentMovementAuthorization(tx, {
      assignmentId: assignment.id,
      actor: input.actor,
      cause: {
        exceptionType: EQUIPMENT_SAFETY_MOVEMENT_HOLD,
        trigger: input.trigger,
        correctiveOwnerTeam: "SAFETY",
        correctiveActionType: "RESOLVE_EQUIPMENT_SAFETY",
        summary,
      },
    });

    if (outcome) {
      outcomes.push(outcome);
    }
  }

  return outcomes;
}

/**
 * Dedicated invalidation helper when a blocking pre-trip defect is recorded on an assignment.
 */
export async function invalidateAssignmentForPreTripDefect(
  tx: Prisma.TransactionClient,
  input: {
    assignmentId: string;
    actor: EquipmentInvalidationActor;
    defectSummary: string;
    trigger?: string;
  },
): Promise<MovementInvalidationOutcome | null> {
  const assignment = await tx.dispatchAssignment.findUnique({
    where: { id: input.assignmentId },
    select: { tractorEquipmentId: true, trailerEquipmentId: true },
  });
  if (!assignment) {
    return null;
  }
  await lockEquipmentSafetyWrites(tx, [assignment.tractorEquipmentId, assignment.trailerEquipmentId]);
  const fullAssignment = await tx.dispatchAssignment.findUniqueOrThrow({
    where: { id: input.assignmentId },
    include: { load: true, driver: { select: { id: true, fleetId: true } }, tractorEquipment: true, trailerEquipment: true },
  });
  const inputs = await assembleReleaseInputsInTx(tx, fullAssignment.load, fullAssignment);
  const equipmentEval = evaluateEquipmentSafety(inputs);
  if (!(equipmentEval.blocked || equipmentEval.hold) || !hasEquipmentSafetyRegression(equipmentEval)) {
    return null;
  }
  await lockDriverReadinessWrite(tx, fullAssignment.driverId);
  return invalidateAssignmentMovementAuthorization(tx, {
    assignmentId: input.assignmentId,
    actor: input.actor,
    cause: {
      exceptionType: EQUIPMENT_SAFETY_MOVEMENT_HOLD,
      trigger: input.trigger ?? "PRETRIP_DEFECT",
      correctiveOwnerTeam: "SAFETY",
      correctiveActionType: "RESOLVE_EQUIPMENT_SAFETY",
      summary: input.defectSummary,
    },
  });
}

/**
 * Executes a write against equipment records inside an equipment safety transaction lock,
 * and invalidates affected movement authorizations before committing.
 */
export async function withEquipmentSafetyLock<T>(
  equipmentId: string | string[],
  change: { actor: EquipmentInvalidationActor; trigger: EquipmentInvalidationTrigger | string; summary?: string },
  write: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  const ids = Array.isArray(equipmentId) ? equipmentId : [equipmentId];
  return prisma.$transaction(async (tx) => {
    await lockEquipmentSafetyWrites(tx, ids);
    const result = await write(tx);
    await invalidateEquipmentMovementAuthorizations(tx, {
      equipmentIds: ids,
      actor: change.actor,
      trigger: change.trigger,
      summary: change.summary,
    });
    return result;
  });
}
