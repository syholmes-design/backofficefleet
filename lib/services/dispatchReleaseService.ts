import {
  DispatchReleaseDisposition,
  DriverReadinessState,
  EquipmentStatus,
  PreTripStatus,
  Prisma,
  type DriverReadinessScore,
  type Equipment,
  type Load,
} from "@prisma/client";

import { createAuditRecord } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { authorizedFleetAccess, type SessionUserLike } from "@/lib/services/intakeService";

export const DISPATCH_RELEASE_POLICY_VERSION = "bof-step11-dispatch-v1" as const;
export const DISPATCH_RELEASE_BLOCKED_NO_ASSIGNMENT =
  "RELEASE EVALUATION BLOCKED — NO ACTIVE ASSIGNMENT" as const;
export const DISPATCH_RELEASE_BLOCKED_NO_READINESS =
  "RELEASE EVALUATION BLOCKED — NO CURRENT DRIVER READINESS SCORE" as const;
export const DISPATCH_RELEASE_BLOCKED_REQUIRED_EQUIPMENT =
  "RELEASE EVALUATION BLOCKED — REQUIRED EQUIPMENT MISSING" as const;

export type DispatchReleaseReasonCode =
  | "DRIVER_NOT_READY"
  | "DRIVER_CONDITIONAL_REVIEW"
  | "TRUCK_UNAVAILABLE"
  | "TRUCK_OUT_OF_SERVICE"
  | "MAINTENANCE_BLOCK"
  | "SAFETY_BLOCK"
  | "PRETRIP_INCOMPLETE"
  | "PRETRIP_DEFECT"
  | "LOAD_DOCUMENT_MISSING"
  | "LOAD_DOCUMENT_PENDING"
  | "EQUIPMENT_INCOMPATIBLE"
  | "APPOINTMENT_NOT_CONFIRMED"
  | "OPERATIONAL_CONFIRMATION_PENDING"
  | "APPROVED_EXCEPTION"
  | "NON_BLOCKING_WARNING"
  | "MANUAL_DISPATCH_REVIEW";

export type DispatchReleaseEvaluation = {
  disposition: DispatchReleaseDisposition;
  reasonCodes: DispatchReleaseReasonCode[];
  summary: string;
  policyVersion: typeof DISPATCH_RELEASE_POLICY_VERSION;
};

export type DispatchReleaseInputs = {
  load: Load;
  assignment: Awaited<ReturnType<typeof prisma.dispatchAssignment.findUnique>> & {
    load: Load;
    driver: { id: string; fleetId: string };
  };
  tractor: Equipment;
  trailer: Equipment | null;
  preTrip: (Awaited<ReturnType<typeof prisma.preTripHeader.findFirst>> & {
    items: Awaited<ReturnType<typeof prisma.preTripItem.findMany>>;
    defects: Awaited<ReturnType<typeof prisma.preTripDefect.findMany>>;
  }) | null;
  readiness: Pick<
    DriverReadinessScore,
    "id" | "status" | "reasonCodes" | "summary" | "policyVersion" | "evaluatedAt" | "evaluatedByUserId"
  >;
};

export type CurrentReadinessForLoad = Pick<
  DriverReadinessScore,
  | "id"
  | "driverId"
  | "driverIntakeId"
  | "fleetId"
  | "status"
  | "score"
  | "reasonCodes"
  | "summary"
  | "policyVersion"
  | "evaluatedAt"
  | "evaluatedByUserId"
>;

function requireSessionUser(sessionUser: SessionUserLike | null | undefined) {
  if (!sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
}

function addReason(reasons: DispatchReleaseReasonCode[], code: DispatchReleaseReasonCode) {
  if (!reasons.includes(code)) {
    reasons.push(code);
  }
}

async function logUnauthorizedDispatchAccess(
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
    entityType: "DispatchRelease",
    entityId,
    details: { event: "unauthorized dispatch access", reason },
    metadata: { source: "dispatch-release-service" },
  });
}

function getActiveBlockingDefects(
  preTrip: DispatchReleaseInputs["preTrip"],
) {
  if (!preTrip) {
    return [];
  }
  return preTrip.defects.filter((defect) => defect.severity === "BLOCKING");
}

function getActiveWarningDefects(
  preTrip: DispatchReleaseInputs["preTrip"],
) {
  if (!preTrip) {
    return [];
  }
  return preTrip.defects.filter((defect) => defect.severity === "WARNING");
}

function buildSummary(disposition: DispatchReleaseDisposition, reasonCodes: DispatchReleaseReasonCode[]) {
  const base =
    disposition === "RELEASED"
      ? "Dispatch release is cleared under the current dispatch policy."
      : disposition === "CONDITIONALLY_RELEASED"
        ? "Dispatch release is conditionally cleared under the current dispatch policy."
        : disposition === "HOLD"
          ? "Dispatch release is on hold under the current dispatch policy."
          : "Dispatch release is blocked under the current dispatch policy.";

  return reasonCodes.length > 0 ? `${base} Reasons: ${reasonCodes.join(", ")}.` : base;
}

async function getAuthorizedLoadWithAssignmentContext(
  sessionUser: SessionUserLike | null | undefined,
  loadId: string,
) {
  const load = await prisma.load.findUnique({ where: { id: loadId } });
  if (!load) {
    return { load: null, allowed: false, reason: "NOT_FOUND" as const };
  }

  const access = await authorizedFleetAccess(sessionUser, load.fleetId);
  if (!access.allowed) {
    return { load, allowed: false, reason: access.reason ?? "TENANT_ACCESS_DENIED" };
  }

  return { load, allowed: true, reason: undefined as string | undefined };
}

async function requireAuthorizedLoad(
  sessionUser: SessionUserLike | null | undefined,
  loadId: string,
) {
  requireSessionUser(sessionUser);

  const { load, allowed, reason } = await getAuthorizedLoadWithAssignmentContext(sessionUser, loadId);
  if (!load) {
    throw Object.assign(new Error("Load not found"), { statusCode: 404 });
  }
  if (!allowed) {
    await logUnauthorizedDispatchAccess(sessionUser, load.fleetId, load.id, reason ?? "TENANT_ACCESS_DENIED");
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  return load;
}

export async function assembleReleaseInputs(
  sessionUser: SessionUserLike | null | undefined,
  loadId: string,
): Promise<DispatchReleaseInputs> {
  const load = await requireAuthorizedLoad(sessionUser, loadId);

  const assignment = await prisma.dispatchAssignment.findFirst({
    where: {
      loadId: load.id,
      status: "ACTIVE",
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

  const tractor = assignment.tractorEquipment;
  if (!tractor) {
    throw Object.assign(new Error(DISPATCH_RELEASE_BLOCKED_REQUIRED_EQUIPMENT), { statusCode: 409 });
  }

  const trailer = assignment.trailerEquipment ?? null;
  if (assignment.trailerEquipmentId && !trailer) {
    throw Object.assign(new Error(DISPATCH_RELEASE_BLOCKED_REQUIRED_EQUIPMENT), { statusCode: 409 });
  }

  const preTrip = await prisma.preTripHeader.findFirst({
    where: {
      assignmentId: assignment.id,
      status: { not: PreTripStatus.VOIDED },
    },
    include: {
      items: { orderBy: [{ createdAt: "asc" }, { itemCode: "asc" }] },
      defects: { orderBy: [{ createdAt: "asc" }, { itemCode: "asc" }] },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });

  const readiness = await prisma.driverReadinessScore.findFirst({
    where: {
      driverId: assignment.driverId,
      fleetId: assignment.fleetId,
    },
    select: {
      id: true,
      status: true,
      reasonCodes: true,
      summary: true,
      policyVersion: true,
      evaluatedAt: true,
      evaluatedByUserId: true,
    },
    orderBy: [{ evaluatedAt: "desc" }, { createdAt: "desc" }],
  });

  if (!readiness) {
    throw Object.assign(new Error(DISPATCH_RELEASE_BLOCKED_NO_READINESS), { statusCode: 409 });
  }

  return {
    load,
    assignment,
    tractor,
    trailer,
    preTrip,
    readiness,
  };
}

export async function getCurrentReadinessForLoad(
  sessionUser: SessionUserLike | null | undefined,
  loadId: string,
): Promise<CurrentReadinessForLoad> {
  const load = await requireAuthorizedLoad(sessionUser, loadId);

  const assignment = await prisma.dispatchAssignment.findFirst({
    where: {
      loadId: load.id,
      status: "ACTIVE",
    },
    select: {
      id: true,
      driverId: true,
      fleetId: true,
    },
    orderBy: [{ assignedAt: "desc" }, { createdAt: "desc" }],
  });

  if (!assignment) {
    throw Object.assign(new Error(DISPATCH_RELEASE_BLOCKED_NO_ASSIGNMENT), { statusCode: 409 });
  }

  const readiness = await prisma.driverReadinessScore.findFirst({
    where: {
      driverId: assignment.driverId,
      fleetId: assignment.fleetId,
    },
    select: {
      id: true,
      driverId: true,
      driverIntakeId: true,
      fleetId: true,
      status: true,
      score: true,
      reasonCodes: true,
      summary: true,
      policyVersion: true,
      evaluatedAt: true,
      evaluatedByUserId: true,
    },
    orderBy: [{ evaluatedAt: "desc" }, { createdAt: "desc" }],
  });

  if (!readiness) {
    throw Object.assign(new Error(DISPATCH_RELEASE_BLOCKED_NO_READINESS), { statusCode: 409 });
  }

  return readiness;
}

export function evaluateRelease(inputs: DispatchReleaseInputs): DispatchReleaseEvaluation {
  const reasons: DispatchReleaseReasonCode[] = [];
  const blockingDefects = getActiveBlockingDefects(inputs.preTrip);
  const warningDefects = getActiveWarningDefects(inputs.preTrip);

  if (inputs.readiness.status === DriverReadinessState.NOT_READY) {
    addReason(reasons, "DRIVER_NOT_READY");
  }

  if (inputs.tractor.status === EquipmentStatus.OUT_OF_SERVICE) {
    addReason(reasons, "TRUCK_OUT_OF_SERVICE");
  } else if (inputs.tractor.status !== EquipmentStatus.AVAILABLE) {
    addReason(reasons, "TRUCK_UNAVAILABLE");
  }

  if (inputs.trailer) {
    if (inputs.trailer.status === EquipmentStatus.OUT_OF_SERVICE) {
      addReason(reasons, "TRUCK_OUT_OF_SERVICE");
    } else if (inputs.trailer.status !== EquipmentStatus.AVAILABLE) {
      addReason(reasons, "TRUCK_UNAVAILABLE");
    }
  }

  if (!inputs.preTrip) {
    addReason(reasons, "PRETRIP_INCOMPLETE");
  } else if (inputs.preTrip.status !== PreTripStatus.COMPLETED && blockingDefects.length === 0) {
    addReason(reasons, "PRETRIP_INCOMPLETE");
  }

  if (blockingDefects.length > 0) {
    addReason(reasons, "PRETRIP_DEFECT");
  }

  const hasHoldCondition = warningDefects.length > 0;
  if (hasHoldCondition) {
    addReason(reasons, "PRETRIP_DEFECT");
  }

  const hasBlockingCondition = reasons.some((reasonCode) =>
    [
      "DRIVER_NOT_READY",
      "TRUCK_UNAVAILABLE",
      "TRUCK_OUT_OF_SERVICE",
      "PRETRIP_INCOMPLETE",
      "PRETRIP_DEFECT",
    ].includes(reasonCode),
  ) && (blockingDefects.length > 0 || reasons.includes("PRETRIP_INCOMPLETE") || reasons.includes("DRIVER_NOT_READY") || reasons.includes("TRUCK_UNAVAILABLE") || reasons.includes("TRUCK_OUT_OF_SERVICE"));

  let disposition: DispatchReleaseDisposition = "RELEASED";
  if (hasBlockingCondition) {
    disposition = "BLOCKED";
  } else if (hasHoldCondition) {
    disposition = "HOLD";
  } else if (inputs.readiness.status === DriverReadinessState.CONDITIONAL) {
    addReason(reasons, "DRIVER_CONDITIONAL_REVIEW");
    disposition = "CONDITIONALLY_RELEASED";
  }

  return {
    disposition,
    reasonCodes: reasons,
    summary: buildSummary(disposition, reasons),
    policyVersion: DISPATCH_RELEASE_POLICY_VERSION,
  };
}

export async function writeDispatchRelease(
  sessionUser: SessionUserLike | null | undefined,
  loadId: string,
  evaluation: DispatchReleaseEvaluation,
  readinessId: string,
) {
  requireSessionUser(sessionUser);
  const actorId = sessionUser!.id;
  const actorEmail = sessionUser!.email ?? null;

  const inputs = await assembleReleaseInputs(sessionUser, loadId);
  if (inputs.readiness.id !== readinessId) {
    throw Object.assign(
      new Error("Dispatch release must use the exact DriverReadinessScore used during evaluation"),
      { statusCode: 409 },
    );
  }

  const readinessRecord = await prisma.driverReadinessScore.findUnique({
    where: { id: readinessId },
    select: { id: true, driverId: true, fleetId: true },
  });
  if (!readinessRecord) {
    throw Object.assign(new Error("DriverReadinessScore not found"), { statusCode: 404 });
  }
  if (readinessRecord.driverId !== inputs.assignment.driverId || readinessRecord.fleetId !== inputs.assignment.fleetId) {
    throw Object.assign(new Error("DriverReadinessScore does not belong to the active assignment"), { statusCode: 422 });
  }

  const release = await prisma.dispatchRelease.create({
    data: {
      fleetId: inputs.assignment.fleetId,
      loadId: inputs.load.id,
      assignmentId: inputs.assignment.id,
      driverId: inputs.assignment.driverId,
      tractorEquipmentId: inputs.assignment.tractorEquipmentId,
      trailerEquipmentId: inputs.assignment.trailerEquipmentId ?? null,
      preTripHeaderId: inputs.preTrip?.id ?? null,
      driverReadinessScoreId: readinessId,
      disposition: evaluation.disposition,
      reasonCodes: evaluation.reasonCodes as Prisma.InputJsonValue,
      summary: evaluation.summary,
      policyVersion: evaluation.policyVersion,
      evaluatedAt: new Date(),
      evaluatedByUserId: actorId,
    },
  });

  await createAuditRecord({
    actorId,
    actorEmail,
    tenantId: inputs.assignment.fleetId,
    action: "CREATED",
    entityType: "DispatchRelease",
    entityId: release.id,
    details: {
      event: "dispatch.release_evaluated",
      loadId: inputs.load.id,
      assignmentId: inputs.assignment.id,
      driverId: inputs.assignment.driverId,
      driverReadinessScoreId: readinessId,
      disposition: evaluation.disposition,
      reasonCodes: evaluation.reasonCodes,
      policyVersion: evaluation.policyVersion,
    },
    metadata: { source: "dispatch-release-service" },
  });

  const outcomeEvent =
    evaluation.disposition === "RELEASED"
      ? "dispatch.released"
      : evaluation.disposition === "CONDITIONALLY_RELEASED"
        ? "dispatch.conditionally_released"
        : evaluation.disposition === "HOLD"
          ? "dispatch.hold"
          : "dispatch.blocked";

  await createAuditRecord({
    actorId,
    actorEmail,
    tenantId: inputs.assignment.fleetId,
    action: "CREATED",
    entityType: "DispatchRelease",
    entityId: release.id,
    details: {
      event: outcomeEvent,
      loadId: inputs.load.id,
      assignmentId: inputs.assignment.id,
      driverId: inputs.assignment.driverId,
      driverReadinessScoreId: readinessId,
      disposition: evaluation.disposition,
      reasonCodes: evaluation.reasonCodes,
      policyVersion: evaluation.policyVersion,
    },
    metadata: { source: "dispatch-release-service" },
  });

  return release;
}

export async function getLatestRelease(sessionUser: SessionUserLike | null | undefined, loadId: string) {
  const load = await requireAuthorizedLoad(sessionUser, loadId);

  const assignment = await prisma.dispatchAssignment.findFirst({
    where: { loadId: load.id, status: "ACTIVE" },
    orderBy: [{ assignedAt: "desc" }, { createdAt: "desc" }],
  });
  if (!assignment) {
    return null;
  }

  return prisma.dispatchRelease.findFirst({
    where: {
      loadId: load.id,
      assignmentId: assignment.id,
    },
    orderBy: [{ evaluatedAt: "desc" }, { createdAt: "desc" }],
  });
}

export async function listReleaseHistory(sessionUser: SessionUserLike | null | undefined, loadId: string) {
  const load = await requireAuthorizedLoad(sessionUser, loadId);

  return prisma.dispatchRelease.findMany({
    where: { loadId: load.id },
    select: {
      id: true,
      fleetId: true,
      loadId: true,
      assignmentId: true,
      driverId: true,
      tractorEquipmentId: true,
      trailerEquipmentId: true,
      preTripHeaderId: true,
      driverReadinessScoreId: true,
      disposition: true,
      reasonCodes: true,
      summary: true,
      policyVersion: true,
      evaluatedAt: true,
      evaluatedByUserId: true,
      createdAt: true,
    },
    orderBy: [{ evaluatedAt: "desc" }, { createdAt: "desc" }, { id: "desc" }],
  });
}
