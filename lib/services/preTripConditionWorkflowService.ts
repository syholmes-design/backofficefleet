import {
  ConditionCategory,
  ConditionImpact,
  ConditionResolutionAuthority,
  ConditionSeverity,
  ConditionEvidenceKind,
  ConditionObservationSource,
} from "@prisma/client";

import { createAuditRecord } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { hasRole } from "@/lib/authorization";
import { getAuthenticatedDriver } from "@/lib/services/authenticatedDriverService";
import { getAssignmentById } from "@/lib/services/dispatchAssignmentService";
import { type SessionUserLike } from "@/lib/services/intakeService";
import {
  attachEvidence,
  confirmCondition,
  createCondition,
  getConditionHistory,
  getCurrentConditionsForEquipment,
  recordConditionChange,
  reportRepair,
  verifyResolution,
} from "@/lib/services/conditionService";
import { updatePreTripItem } from "@/lib/services/preTripService";

const OPERATOR_ROLE_CODES = [
  "BOF_OPERATIONS",
  "BOF_COMPLIANCE_REVIEW",
  "FLEET_ADMIN",
  "FLEET_MANAGER",
  "FLEET_OPERATIONS",
  "DISPATCH",
] as const;

export type ConditionBaselineEquipment = {
  kind: "TRACTOR" | "TRAILER";
  equipmentId: string;
  unitNumber: string;
  conditions: Array<{
    conditionThreadId: string;
    title: string;
    category: string;
    severity: string;
    impact: string | null;
    lifecycleState: string;
    verificationState: string;
    evidenceCompleteness: string;
    firstIdentifiedAt: string;
    lastConfirmedAt: string | null;
    repairReportedAt: string | null;
    resolutionVerifiedAt: string | null;
    latestEvent: {
      id: string;
      eventType: string;
      observedAt: string;
      notes: string | null;
    } | null;
    latestEvidence: {
      id: string;
      capturedAt: string;
      originalFileName: string;
      evidenceKind: string;
      mimeType: string | null;
    } | null;
    driverPrompt: string;
    evidencePrompt: string;
  }>;
};

export type PreTripConditionBaseline = {
  assignment: {
    id: string;
    fleetId: string;
    loadId: string;
    driverId: string;
    tractorEquipmentId: string;
    trailerEquipmentId: string | null;
  };
  actorContext: {
    actorUserId: string;
    linkedDriverId: string | null;
    isOperator: boolean;
  };
  equipments: ConditionBaselineEquipment[];
};

export type ApplyConditionActionInput = {
  assignmentId: string;
  conditionThreadId: string;
  action: "NO_CHANGE" | "CHANGED" | "REPAIRED_REMOVED" | "VERIFY_RESOLUTION" | "UNSURE";
  notes?: string | null;
  preTripHeaderId?: string | null;
  preTripItemCode?: string | null;
};

export type CreateConditionFromPreTripInput = {
  assignmentId: string;
  equipmentId: string;
  title: string;
  category: ConditionCategory | keyof typeof ConditionCategory;
  severity: ConditionSeverity | keyof typeof ConditionSeverity;
  impact?: ConditionImpact | keyof typeof ConditionImpact | null;
  notes?: string | null;
  preTripHeaderId?: string | null;
  preTripItemId?: string | null;
};

export type AttachAssignmentConditionEvidenceInput = {
  assignmentId: string;
  conditionThreadId: string;
  conditionEventId?: string | null;
  equipmentId?: string | null;
  preTripHeaderId?: string | null;
  preTripItemId?: string | null;
  notes?: string | null;
  evidenceKind?: ConditionEvidenceKind | keyof typeof ConditionEvidenceKind;
  observationSource?: ConditionObservationSource | keyof typeof ConditionObservationSource;
  file: File;
};

function requireSessionUser(sessionUser: SessionUserLike | null | undefined) {
  if (!sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
}

function isAssignmentEquipment(
  assignment: {
    tractorEquipmentId: string;
    trailerEquipmentId: string | null;
  },
  equipmentId: string,
) {
  return assignment.tractorEquipmentId === equipmentId || assignment.trailerEquipmentId === equipmentId;
}

async function getAuthorizedAssignmentContext(sessionUser: SessionUserLike, assignmentId: string) {
  const assignment = await getAssignmentById(sessionUser, assignmentId);
  if (!assignment) {
    throw Object.assign(new Error("DispatchAssignment not found"), { statusCode: 404 });
  }
  if (assignment.status !== "ACTIVE") {
    throw Object.assign(new Error("Condition workflow requires an active assignment"), { statusCode: 422 });
  }
  return assignment;
}

async function enforceDriverAssignmentContext(
  sessionUser: SessionUserLike,
  assignment: {
    driverId: string;
    fleetId: string;
    id: string;
  },
) {
  const actor = await getAuthenticatedDriver(sessionUser);
  const isOperator = hasRole(sessionUser, [...OPERATOR_ROLE_CODES]);
  if (actor.status !== "LINKED") {
    return { linkedDriverId: null, isOperator };
  }
  if (actor.driver.id !== assignment.driverId && !isOperator) {
    await createAuditRecord({
      actorId: sessionUser.id ?? null,
      actorEmail: sessionUser.email ?? null,
      tenantId: assignment.fleetId,
      action: "ACCESS_DENIED",
      entityType: "DispatchAssignment",
      entityId: assignment.id,
      details: {
        event: "condition.assignment_access_denied",
        reason: "DRIVER_ASSIGNMENT_MISMATCH",
        assignmentDriverId: assignment.driverId,
        actorDriverId: actor.driver.id,
      },
      metadata: {
        source: "pretrip-condition-workflow-service",
      },
    });
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }
  return { linkedDriverId: actor.driver.id, isOperator };
}

function buildConditionPrompts(lifecycleState: string) {
  if (lifecycleState === "AWAITING_VERIFICATION") {
    return {
      driverPrompt: "Previous repair was reported. Please confirm whether this condition is now repaired or unchanged.",
      evidencePrompt: "Provide a current photo of the same area to verify repair status.",
    };
  }
  if (lifecycleState === "REOPENED" || lifecycleState === "CHANGED") {
    return {
      driverPrompt: "This condition changed before. Confirm no change, changed, repaired/removed, or unsure.",
      evidencePrompt: "If changed or repaired, capture a current photo of the same area.",
    };
  }
  return {
    driverPrompt: "Has this known condition changed since the last verification?",
    evidencePrompt: "Capture a current condition photo only if changed, repaired, or specifically required.",
  };
}

export async function getPreTripConditionBaseline(
  sessionUser: SessionUserLike | null | undefined,
  assignmentId: string,
): Promise<PreTripConditionBaseline> {
  requireSessionUser(sessionUser);
  const actorSession = sessionUser as SessionUserLike;
  const assignment = await getAuthorizedAssignmentContext(actorSession, assignmentId);
  const actorContext = await enforceDriverAssignmentContext(actorSession, assignment);

  const [tractorConditions, trailerConditions] = await Promise.all([
    getCurrentConditionsForEquipment(actorSession, assignment.tractorEquipmentId),
    assignment.trailerEquipmentId ? getCurrentConditionsForEquipment(actorSession, assignment.trailerEquipmentId) : Promise.resolve([]),
  ]);

  const equipmentRows = await prisma.equipment.findMany({
    where: {
      id: {
        in: [assignment.tractorEquipmentId, assignment.trailerEquipmentId].filter(
          (value): value is string => typeof value === "string" && value.length > 0,
        ),
      },
    },
    select: {
      id: true,
      unitNumber: true,
      equipmentType: true,
    },
  });
  const equipmentMap = new Map(equipmentRows.map((equipment) => [equipment.id, equipment]));

  const normalizeConditions = (
    kind: "TRACTOR" | "TRAILER",
    equipmentId: string,
    conditions: Awaited<ReturnType<typeof getCurrentConditionsForEquipment>>,
  ): ConditionBaselineEquipment => {
    const equipment = equipmentMap.get(equipmentId);
    return {
      kind,
      equipmentId,
      unitNumber: equipment?.unitNumber ?? equipmentId,
      conditions: conditions.map((thread) => {
        const latestEvent = thread.events.at(-1) ?? null;
        const latestEvidence = thread.evidences.at(-1) ?? null;
        const prompts = buildConditionPrompts(thread.lifecycleState);
        return {
          conditionThreadId: thread.id,
          title: thread.title,
          category: thread.category,
          severity: thread.severity,
          impact: thread.impact,
          lifecycleState: thread.lifecycleState,
          verificationState: thread.verificationState,
          evidenceCompleteness: thread.evidenceCompleteness,
          firstIdentifiedAt: thread.firstIdentifiedAt.toISOString(),
          lastConfirmedAt: thread.lastConfirmedAt?.toISOString() ?? null,
          repairReportedAt: thread.repairReportedAt?.toISOString() ?? null,
          resolutionVerifiedAt: thread.resolutionVerifiedAt?.toISOString() ?? null,
          latestEvent: latestEvent
            ? {
                id: latestEvent.id,
                eventType: latestEvent.eventType,
                observedAt: latestEvent.observedAt.toISOString(),
                notes: latestEvent.notes ?? null,
              }
            : null,
          latestEvidence: latestEvidence
            ? {
                id: latestEvidence.id,
                capturedAt: latestEvidence.capturedAt.toISOString(),
                originalFileName: latestEvidence.originalFileName,
                evidenceKind: latestEvidence.evidenceKind,
                mimeType: latestEvidence.mimeType ?? null,
              }
            : null,
          driverPrompt: prompts.driverPrompt,
          evidencePrompt: prompts.evidencePrompt,
        };
      }),
    };
  };

  return {
    assignment: {
      id: assignment.id,
      fleetId: assignment.fleetId,
      loadId: assignment.loadId,
      driverId: assignment.driverId,
      tractorEquipmentId: assignment.tractorEquipmentId,
      trailerEquipmentId: assignment.trailerEquipmentId,
    },
    actorContext: {
      actorUserId: actorSession.id ?? "",
      linkedDriverId: actorContext.linkedDriverId,
      isOperator: actorContext.isOperator,
    },
    equipments: [
      normalizeConditions("TRACTOR", assignment.tractorEquipmentId, tractorConditions),
      ...(assignment.trailerEquipmentId
        ? [normalizeConditions("TRAILER", assignment.trailerEquipmentId, trailerConditions)]
        : []),
    ],
  };
}

export async function applyPreTripConditionAction(
  sessionUser: SessionUserLike | null | undefined,
  input: ApplyConditionActionInput,
) {
  requireSessionUser(sessionUser);
  const actorSession = sessionUser as SessionUserLike;
  const assignment = await getAuthorizedAssignmentContext(actorSession, input.assignmentId);
  await enforceDriverAssignmentContext(actorSession, assignment);

  const thread = await getConditionHistory(actorSession, input.conditionThreadId);
  if (!isAssignmentEquipment(assignment, thread.equipmentId)) {
    throw Object.assign(new Error("Condition does not belong to the active assignment equipment"), { statusCode: 422 });
  }

  if (thread.fleetId !== assignment.fleetId) {
    throw Object.assign(new Error("Condition does not belong to the active assignment fleet"), { statusCode: 422 });
  }

  if (input.action === "NO_CHANGE") {
    return confirmCondition(actorSession, thread.id, input.notes ?? "Driver confirmed no change from baseline condition.");
  }

  if (input.action === "CHANGED") {
    return recordConditionChange(actorSession, thread.id, input.notes ?? "Driver reported a condition change during current pre-trip.");
  }

  if (input.action === "REPAIRED_REMOVED") {
    return reportRepair(actorSession, thread.id, input.notes ?? "Driver reported repaired/removed condition pending verification.");
  }

  if (input.action === "VERIFY_RESOLUTION") {
    const actor = await getAuthenticatedDriver(actorSession);
    const authority =
      actor.status === "LINKED"
        ? ConditionResolutionAuthority.DRIVER
        : ConditionResolutionAuthority.FLEET_MAINTENANCE;
    return verifyResolution(actorSession, {
      conditionThreadId: thread.id,
      authority,
      notes: input.notes ?? "Resolution verified from current pre-trip evidence.",
    });
  }

  const preTripHeaderId = input.preTripHeaderId?.trim();
  if (!preTripHeaderId) {
    throw Object.assign(new Error("preTripHeaderId is required for UNSURE condition routing"), { statusCode: 422 });
  }
  const preTripItemCode = input.preTripItemCode?.trim() || "maint-report";
  const preTrip = await updatePreTripItem(
    actorSession,
    preTripHeaderId,
    preTripItemCode,
    "WARNING",
    input.notes?.trim() || `Condition ${thread.title} was marked UNSURE and routed for review.`,
  );
  await createAuditRecord({
    actorId: actorSession.id ?? null,
    actorEmail: actorSession.email ?? null,
    tenantId: assignment.fleetId,
    action: "UPDATED",
    entityType: "PreTripHeader",
    entityId: preTrip?.id ?? preTripHeaderId,
    details: {
      event: "pretrip.condition.unsure_routed",
      conditionThreadId: thread.id,
      preTripItemCode,
    },
    metadata: {
      source: "pretrip-condition-workflow-service",
    },
  });
  return { thread, preTrip };
}

export async function createPreTripCondition(
  sessionUser: SessionUserLike | null | undefined,
  input: CreateConditionFromPreTripInput,
) {
  requireSessionUser(sessionUser);
  const actorSession = sessionUser as SessionUserLike;
  const assignment = await getAuthorizedAssignmentContext(actorSession, input.assignmentId);
  await enforceDriverAssignmentContext(actorSession, assignment);

  if (!isAssignmentEquipment(assignment, input.equipmentId)) {
    throw Object.assign(new Error("New condition equipment must be part of the active assignment"), { statusCode: 422 });
  }

  return createCondition(actorSession, {
    equipmentId: input.equipmentId,
    title: input.title,
    category: input.category,
    severity: input.severity,
    impact: input.impact ?? null,
    notes: input.notes ?? null,
    preTripHeaderId: input.preTripHeaderId ?? null,
    preTripItemId: input.preTripItemId ?? null,
    dispatchAssignmentId: assignment.id,
    loadId: assignment.loadId,
  });
}

export async function attachAssignmentConditionEvidence(
  sessionUser: SessionUserLike | null | undefined,
  input: AttachAssignmentConditionEvidenceInput,
) {
  requireSessionUser(sessionUser);
  const actorSession = sessionUser as SessionUserLike;
  const assignment = await getAuthorizedAssignmentContext(actorSession, input.assignmentId);
  await enforceDriverAssignmentContext(actorSession, assignment);

  const thread = await getConditionHistory(actorSession, input.conditionThreadId);
  if (!isAssignmentEquipment(assignment, thread.equipmentId)) {
    throw Object.assign(new Error("Condition evidence equipment must be part of the active assignment"), { statusCode: 422 });
  }

  const equipmentId = input.equipmentId?.trim() || thread.equipmentId;
  if (!isAssignmentEquipment(assignment, equipmentId)) {
    throw Object.assign(new Error("Evidence equipment does not belong to the active assignment"), { statusCode: 422 });
  }

  return attachEvidence(actorSession, {
    conditionThreadId: thread.id,
    conditionEventId: input.conditionEventId?.trim() || undefined,
    equipmentId,
    loadId: assignment.loadId,
    dispatchAssignmentId: assignment.id,
    preTripHeaderId: input.preTripHeaderId?.trim() || undefined,
    preTripItemId: input.preTripItemId?.trim() || undefined,
    evidenceKind: input.evidenceKind ?? ConditionEvidenceKind.PHOTO,
    observationSource: input.observationSource ?? ConditionObservationSource.DRIVER,
    file: input.file,
    notes: input.notes ?? null,
  });
}
