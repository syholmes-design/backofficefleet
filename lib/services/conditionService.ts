import { createHash, randomUUID } from "crypto";
import { mkdir, rm, writeFile } from "fs/promises";
import { basename, dirname, join, resolve } from "path";

import {
  ConditionCategory,
  ConditionEvidenceCompleteness,
  ConditionEvidenceKind,
  ConditionEventType,
  ConditionImpact,
  ConditionLifecycleState,
  ConditionObservationSource,
  ConditionResolutionAuthority,
  ConditionSeverity,
  ConditionVerificationState,
  Prisma,
} from "@prisma/client";

import { createAuditRecord } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { authorizedFleetAccess, hasRole, type SessionUserLike } from "@/lib/services/intakeService";
import { getAuthenticatedDriver } from "@/lib/services/authenticatedDriverService";

const CONDITION_EVIDENCE_ROOT = resolve(process.cwd(), "storage", "condition-evidence");
const ALLOWED_EVIDENCE_MIME_TYPES = new Set([
  "application/pdf",
  "application/json",
  "image/png",
  "image/jpeg",
  "image/jpg",
]);

const OPERATOR_ROLE_CODES = [
  "BOF_OPERATIONS",
  "BOF_COMPLIANCE_REVIEW",
  "FLEET_ADMIN",
  "FLEET_MANAGER",
  "FLEET_OPERATIONS",
  "DISPATCH",
];

export type ConditionThreadDetail = Awaited<ReturnType<typeof getConditionThreadById>>;

export type ConditionEvidenceAttachmentInput = {
  conditionThreadId?: string;
  conditionEventId?: string;
  equipmentId?: string;
  loadId?: string;
  dispatchAssignmentId?: string;
  preTripHeaderId?: string;
  preTripItemId?: string;
  evidenceKind: ConditionEvidenceKind | keyof typeof ConditionEvidenceKind;
  observationSource?: ConditionObservationSource | keyof typeof ConditionObservationSource;
  file?: File | null;
  originalFileName?: string;
  observationValue?: Prisma.InputJsonValue | null;
  provenance?: Prisma.InputJsonValue | null;
  notes?: string | null;
};

function requireSessionUser(sessionUser: SessionUserLike | null | undefined) {
  if (!sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
}

function requireNonEmptyString(value: string, fieldName: string) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw Object.assign(new Error(`${fieldName} is required`), { statusCode: 422 });
  }
  return value.trim();
}

function sanitizeFileName(value: string) {
  const next = basename(value || "evidence");
  return next.replace(/[^A-Za-z0-9._-]+/g, "_");
}

function sha256Hex(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

function storagePathForKey(storageKey: string) {
  return join(CONDITION_EVIDENCE_ROOT, storageKey);
}

function storageKeyForEvidence(fleetId: string, evidenceId: string, fileName: string) {
  const safeFileName = sanitizeFileName(fileName);
  return join(fleetId, evidenceId, safeFileName);
}

async function persistFile(storageKey: string, bytes: Uint8Array) {
  const fullPath = storagePathForKey(storageKey);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, bytes);
  return fullPath;
}

async function removeFile(storageKey: string) {
  await rm(storagePathForKey(storageKey), { force: true });
}

function toEnumValue<T extends Record<string, string>>(enumObject: T, value: string, fieldName: string): T[keyof T] {
  if (!Object.values(enumObject).includes(value)) {
    throw Object.assign(new Error(`Invalid ${fieldName}`), { statusCode: 422 });
  }
  return value as T[keyof T];
}

function toObservationSource(value: string | undefined, sessionUser: SessionUserLike | null | undefined) {
  if (value) {
    return toEnumValue(ConditionObservationSource, value, "observationSource");
  }

  if (sessionUser && hasRole(sessionUser, ["BOF_COMPLIANCE_REVIEW"])) {
    return ConditionObservationSource.SAFETY;
  }

  if (sessionUser && hasRole(sessionUser, ["FLEET_ADMIN", "FLEET_MANAGER", "FLEET_OPERATIONS", "DISPATCH"])) {
    return ConditionObservationSource.DISPATCH;
  }

  if (sessionUser && hasRole(sessionUser, ["BOF_OPERATIONS"])) {
    return ConditionObservationSource.OTHER;
  }

  return ConditionObservationSource.DRIVER;
}

function resolveLifecycleUpdate(eventType: ConditionEventType) {
  switch (eventType) {
    case ConditionEventType.IDENTIFIED:
      return { lifecycleState: ConditionLifecycleState.IDENTIFIED, verificationState: ConditionVerificationState.UNVERIFIED };
    case ConditionEventType.CONFIRMED:
      return { lifecycleState: ConditionLifecycleState.CONFIRMED, verificationState: ConditionVerificationState.CONFIRMED };
    case ConditionEventType.CHANGED:
      return { lifecycleState: ConditionLifecycleState.CHANGED, verificationState: ConditionVerificationState.CONFIRMED };
    case ConditionEventType.REPAIR_REPORTED:
      return {
        lifecycleState: ConditionLifecycleState.AWAITING_VERIFICATION,
        verificationState: ConditionVerificationState.CONFIRMED,
      };
    case ConditionEventType.AWAITING_VERIFICATION:
      return {
        lifecycleState: ConditionLifecycleState.AWAITING_VERIFICATION,
        verificationState: ConditionVerificationState.CONFIRMED,
      };
    case ConditionEventType.RESOLUTION_VERIFIED:
      return { lifecycleState: ConditionLifecycleState.RESOLVED, verificationState: ConditionVerificationState.VERIFIED };
    case ConditionEventType.REOPENED:
      return { lifecycleState: ConditionLifecycleState.REOPENED, verificationState: ConditionVerificationState.CONFIRMED };
  }
}

function resolveResolutionAuthority(
  sessionUser: SessionUserLike | null | undefined,
  authority: ConditionResolutionAuthority,
) {
  if (authority === ConditionResolutionAuthority.DRIVER) {
    return;
  }

  if (
    authority === ConditionResolutionAuthority.FLEET_MAINTENANCE &&
    hasRole(sessionUser, ["FLEET_ADMIN", "FLEET_MANAGER", "FLEET_OPERATIONS"])
  ) {
    return;
  }

  if (authority === ConditionResolutionAuthority.SAFETY && hasRole(sessionUser, ["BOF_COMPLIANCE_REVIEW", "FLEET_ADMIN"])) {
    return;
  }

  if (authority === ConditionResolutionAuthority.DISPATCH && hasRole(sessionUser, ["DISPATCH", "FLEET_ADMIN", "FLEET_OPERATIONS"])) {
    return;
  }

  if (authority === ConditionResolutionAuthority.THIRD_PARTY_SHOP && hasRole(sessionUser, ["FLEET_ADMIN", "FLEET_MANAGER"])) {
    return;
  }

  if (authority === ConditionResolutionAuthority.OTHER_AUTHORIZED_ACTOR && hasRole(sessionUser, ["BOF_OPERATIONS", "FLEET_ADMIN"])) {
    return;
  }

  throw Object.assign(new Error("Resolution authority is not permitted for this session"), { statusCode: 403 });
}

async function getEquipmentById(equipmentId: string) {
  const equipment = await prisma.equipment.findUnique({
    where: { id: equipmentId },
    select: {
      id: true,
      fleetId: true,
      unitNumber: true,
      equipmentType: true,
      status: true,
    },
  });

  if (!equipment) {
    throw Object.assign(new Error("Equipment not found"), { statusCode: 404 });
  }

  return equipment;
}

async function getConditionThreadOrThrow(conditionThreadId: string) {
  const thread = await prisma.conditionThread.findUnique({
    where: { id: conditionThreadId },
    include: {
      events: {
        orderBy: [{ observedAt: "asc" }, { createdAt: "asc" }],
      },
      evidences: {
        orderBy: [{ capturedAt: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!thread) {
    throw Object.assign(new Error("ConditionThread not found"), { statusCode: 404 });
  }

  return thread;
}

type AccessDeniedAuditInput = {
  sessionUser: SessionUserLike | null | undefined;
  operation: string;
  reasonCategory: string;
  statusCode: number;
  message: string;
  fleetId?: string | null;
  equipmentId?: string | null;
  loadId?: string | null;
  dispatchAssignmentId?: string | null;
  preTripHeaderId?: string | null;
  preTripItemId?: string | null;
  conditionThreadId?: string | null;
  conditionEventId?: string | null;
  evidenceId?: string | null;
};

async function createAccessDeniedAudit(input: AccessDeniedAuditInput) {
  if (!input.sessionUser?.id) {
    return;
  }

  await createAuditRecord({
    actorId: input.sessionUser.id,
    actorEmail: input.sessionUser.email ?? null,
    tenantId: input.fleetId ?? null,
    action: "ACCESS_DENIED",
    entityType: "ConditionAccess",
    entityId: input.conditionThreadId ?? input.conditionEventId ?? input.evidenceId ?? null,
    details: {
      event: "condition.access_denied",
      operation: input.operation,
      reasonCategory: input.reasonCategory,
      statusCode: input.statusCode,
      fleetId: input.fleetId ?? null,
      equipmentId: input.equipmentId ?? null,
      loadId: input.loadId ?? null,
      dispatchAssignmentId: input.dispatchAssignmentId ?? null,
      preTripHeaderId: input.preTripHeaderId ?? null,
      preTripItemId: input.preTripItemId ?? null,
      conditionThreadId: input.conditionThreadId ?? null,
      conditionEventId: input.conditionEventId ?? null,
      evidenceId: input.evidenceId ?? null,
    },
    metadata: {
      source: "condition-service",
      denialMessage: input.message,
    },
  });
}

async function denyWithAudit(input: AccessDeniedAuditInput): Promise<never> {
  await createAccessDeniedAudit(input);
  throw Object.assign(new Error(input.message), { statusCode: input.statusCode });
}

function assignmentHasEquipment(
  assignment: { tractorEquipmentId: string; trailerEquipmentId: string | null },
  equipmentId: string,
) {
  return assignment.tractorEquipmentId === equipmentId || assignment.trailerEquipmentId === equipmentId;
}

type ValidatedContextInput = {
  sessionUser: SessionUserLike;
  operation: string;
  anchorFleetId?: string | null;
  anchorEquipmentId?: string | null;
  conditionThreadId?: string | null;
  conditionEventId?: string | null;
  equipmentId?: string | null;
  loadId?: string | null;
  dispatchAssignmentId?: string | null;
  preTripHeaderId?: string | null;
  preTripItemId?: string | null;
};

type ValidatedContext = {
  fleetId: string | null;
  equipmentId: string | null;
  loadId: string | null;
  dispatchAssignmentId: string | null;
  preTripHeaderId: string | null;
  preTripItemId: string | null;
  conditionThreadId: string | null;
  conditionEventId: string | null;
};

async function validateOperationalContext(input: ValidatedContextInput): Promise<ValidatedContext> {
  let resolvedFleetId = input.anchorFleetId ?? null;
  let resolvedEquipmentId = input.anchorEquipmentId ?? null;
  let resolvedLoadId = input.loadId ?? null;
  let resolvedDispatchAssignmentId = input.dispatchAssignmentId ?? null;
  const resolvedPreTripHeaderId = input.preTripHeaderId ?? null;
  const resolvedPreTripItemId = input.preTripItemId ?? null;
  const resolvedConditionThreadId = input.conditionThreadId ?? null;
  const resolvedConditionEventId = input.conditionEventId ?? null;

  if (input.equipmentId) {
    const equipment = await getEquipmentById(input.equipmentId);
    if (resolvedFleetId && equipment.fleetId !== resolvedFleetId) {
      await denyWithAudit({
        sessionUser: input.sessionUser,
        operation: input.operation,
        reasonCategory: "equipment_fleet_mismatch",
        statusCode: 422,
        message: "Equipment does not match the resolved fleet context",
        fleetId: resolvedFleetId,
        equipmentId: input.equipmentId,
        loadId: resolvedLoadId,
        dispatchAssignmentId: resolvedDispatchAssignmentId,
        preTripHeaderId: resolvedPreTripHeaderId,
        preTripItemId: resolvedPreTripItemId,
        conditionThreadId: resolvedConditionThreadId,
        conditionEventId: resolvedConditionEventId,
      });
    }
    if (resolvedEquipmentId && resolvedEquipmentId !== equipment.id) {
      await denyWithAudit({
        sessionUser: input.sessionUser,
        operation: input.operation,
        reasonCategory: "equipment_context_mismatch",
        statusCode: 422,
        message: "Equipment does not match the resolved equipment context",
        fleetId: resolvedFleetId ?? equipment.fleetId,
        equipmentId: input.equipmentId,
        loadId: resolvedLoadId,
        dispatchAssignmentId: resolvedDispatchAssignmentId,
        preTripHeaderId: resolvedPreTripHeaderId,
        preTripItemId: resolvedPreTripItemId,
        conditionThreadId: resolvedConditionThreadId,
        conditionEventId: resolvedConditionEventId,
      });
    }
    resolvedFleetId = equipment.fleetId;
    resolvedEquipmentId = equipment.id;
  }

  if (resolvedLoadId) {
    const load = await prisma.load.findUnique({
      where: { id: resolvedLoadId },
      select: { id: true, fleetId: true },
    });
    if (!load) {
      throw Object.assign(new Error("Load not found"), { statusCode: 404 });
    }
    if (resolvedFleetId && load.fleetId !== resolvedFleetId) {
      await denyWithAudit({
        sessionUser: input.sessionUser,
        operation: input.operation,
        reasonCategory: "load_fleet_mismatch",
        statusCode: 422,
        message: "Load does not match the resolved fleet context",
        fleetId: resolvedFleetId,
        equipmentId: resolvedEquipmentId,
        loadId: resolvedLoadId,
        dispatchAssignmentId: resolvedDispatchAssignmentId,
        preTripHeaderId: resolvedPreTripHeaderId,
        preTripItemId: resolvedPreTripItemId,
        conditionThreadId: resolvedConditionThreadId,
        conditionEventId: resolvedConditionEventId,
      });
    }
    resolvedFleetId = load.fleetId;
  }

  let assignmentRecord: {
    id: string;
    fleetId: string;
    loadId: string;
    driverId: string;
    tractorEquipmentId: string;
    trailerEquipmentId: string | null;
  } | null = null;
  if (resolvedDispatchAssignmentId) {
    assignmentRecord = await prisma.dispatchAssignment.findUnique({
      where: { id: resolvedDispatchAssignmentId },
      select: {
        id: true,
        fleetId: true,
        loadId: true,
        driverId: true,
        tractorEquipmentId: true,
        trailerEquipmentId: true,
      },
    });
    if (!assignmentRecord) {
      throw Object.assign(new Error("DispatchAssignment not found"), { statusCode: 404 });
    }
    if (resolvedFleetId && assignmentRecord.fleetId !== resolvedFleetId) {
      await denyWithAudit({
        sessionUser: input.sessionUser,
        operation: input.operation,
        reasonCategory: "assignment_fleet_mismatch",
        statusCode: 422,
        message: "Dispatch assignment does not match the resolved fleet context",
        fleetId: resolvedFleetId,
        equipmentId: resolvedEquipmentId,
        loadId: resolvedLoadId,
        dispatchAssignmentId: resolvedDispatchAssignmentId,
        preTripHeaderId: resolvedPreTripHeaderId,
        preTripItemId: resolvedPreTripItemId,
        conditionThreadId: resolvedConditionThreadId,
        conditionEventId: resolvedConditionEventId,
      });
    }
    if (resolvedLoadId && assignmentRecord.loadId !== resolvedLoadId) {
      await denyWithAudit({
        sessionUser: input.sessionUser,
        operation: input.operation,
        reasonCategory: "assignment_load_mismatch",
        statusCode: 422,
        message: "Dispatch assignment does not match the supplied load",
        fleetId: assignmentRecord.fleetId,
        equipmentId: resolvedEquipmentId,
        loadId: resolvedLoadId,
        dispatchAssignmentId: resolvedDispatchAssignmentId,
        preTripHeaderId: resolvedPreTripHeaderId,
        preTripItemId: resolvedPreTripItemId,
        conditionThreadId: resolvedConditionThreadId,
        conditionEventId: resolvedConditionEventId,
      });
    }
    if (resolvedEquipmentId && !assignmentHasEquipment(assignmentRecord, resolvedEquipmentId)) {
      await denyWithAudit({
        sessionUser: input.sessionUser,
        operation: input.operation,
        reasonCategory: "assignment_equipment_mismatch",
        statusCode: 422,
        message: "Dispatch assignment does not match the resolved equipment",
        fleetId: assignmentRecord.fleetId,
        equipmentId: resolvedEquipmentId,
        loadId: resolvedLoadId ?? assignmentRecord.loadId,
        dispatchAssignmentId: resolvedDispatchAssignmentId,
        preTripHeaderId: resolvedPreTripHeaderId,
        preTripItemId: resolvedPreTripItemId,
        conditionThreadId: resolvedConditionThreadId,
        conditionEventId: resolvedConditionEventId,
      });
    }
    resolvedFleetId = assignmentRecord.fleetId;
    resolvedLoadId = resolvedLoadId ?? assignmentRecord.loadId;
    resolvedEquipmentId = resolvedEquipmentId ?? assignmentRecord.tractorEquipmentId;
  }

  let preTripHeaderRecord: {
    id: string;
    fleetId: string;
    assignmentId: string;
    assignment: {
      id: string;
      fleetId: string;
      loadId: string;
      tractorEquipmentId: string;
      trailerEquipmentId: string | null;
      driverId: string;
    };
  } | null = null;
  if (resolvedPreTripHeaderId) {
    preTripHeaderRecord = await prisma.preTripHeader.findUnique({
      where: { id: resolvedPreTripHeaderId },
      select: {
        id: true,
        fleetId: true,
        assignmentId: true,
        assignment: {
          select: {
            id: true,
            fleetId: true,
            loadId: true,
            tractorEquipmentId: true,
            trailerEquipmentId: true,
            driverId: true,
          },
        },
      },
    });
    if (!preTripHeaderRecord) {
      throw Object.assign(new Error("PreTripHeader not found"), { statusCode: 404 });
    }
    if (resolvedFleetId && preTripHeaderRecord.fleetId !== resolvedFleetId) {
      await denyWithAudit({
        sessionUser: input.sessionUser,
        operation: input.operation,
        reasonCategory: "pretrip_fleet_mismatch",
        statusCode: 422,
        message: "Pre-trip header does not match the resolved fleet context",
        fleetId: resolvedFleetId,
        equipmentId: resolvedEquipmentId,
        loadId: resolvedLoadId,
        dispatchAssignmentId: resolvedDispatchAssignmentId,
        preTripHeaderId: resolvedPreTripHeaderId,
        preTripItemId: resolvedPreTripItemId,
        conditionThreadId: resolvedConditionThreadId,
        conditionEventId: resolvedConditionEventId,
      });
    }
    if (resolvedDispatchAssignmentId && preTripHeaderRecord.assignmentId !== resolvedDispatchAssignmentId) {
      await denyWithAudit({
        sessionUser: input.sessionUser,
        operation: input.operation,
        reasonCategory: "pretrip_assignment_mismatch",
        statusCode: 422,
        message: "Pre-trip header does not belong to the supplied dispatch assignment",
        fleetId: preTripHeaderRecord.fleetId,
        equipmentId: resolvedEquipmentId,
        loadId: resolvedLoadId,
        dispatchAssignmentId: resolvedDispatchAssignmentId,
        preTripHeaderId: resolvedPreTripHeaderId,
        preTripItemId: resolvedPreTripItemId,
        conditionThreadId: resolvedConditionThreadId,
        conditionEventId: resolvedConditionEventId,
      });
    }
    if (resolvedLoadId && preTripHeaderRecord.assignment.loadId !== resolvedLoadId) {
      await denyWithAudit({
        sessionUser: input.sessionUser,
        operation: input.operation,
        reasonCategory: "pretrip_load_mismatch",
        statusCode: 422,
        message: "Pre-trip header does not match the supplied load",
        fleetId: preTripHeaderRecord.fleetId,
        equipmentId: resolvedEquipmentId,
        loadId: resolvedLoadId,
        dispatchAssignmentId: resolvedDispatchAssignmentId ?? preTripHeaderRecord.assignmentId,
        preTripHeaderId: resolvedPreTripHeaderId,
        preTripItemId: resolvedPreTripItemId,
        conditionThreadId: resolvedConditionThreadId,
        conditionEventId: resolvedConditionEventId,
      });
    }
    if (resolvedEquipmentId && !assignmentHasEquipment(preTripHeaderRecord.assignment, resolvedEquipmentId)) {
      await denyWithAudit({
        sessionUser: input.sessionUser,
        operation: input.operation,
        reasonCategory: "pretrip_equipment_mismatch",
        statusCode: 422,
        message: "Pre-trip header assignment does not match the resolved equipment",
        fleetId: preTripHeaderRecord.fleetId,
        equipmentId: resolvedEquipmentId,
        loadId: resolvedLoadId ?? preTripHeaderRecord.assignment.loadId,
        dispatchAssignmentId: resolvedDispatchAssignmentId ?? preTripHeaderRecord.assignmentId,
        preTripHeaderId: resolvedPreTripHeaderId,
        preTripItemId: resolvedPreTripItemId,
        conditionThreadId: resolvedConditionThreadId,
        conditionEventId: resolvedConditionEventId,
      });
    }
    resolvedFleetId = preTripHeaderRecord.fleetId;
    resolvedDispatchAssignmentId = resolvedDispatchAssignmentId ?? preTripHeaderRecord.assignmentId;
    resolvedLoadId = resolvedLoadId ?? preTripHeaderRecord.assignment.loadId;
    resolvedEquipmentId = resolvedEquipmentId ?? preTripHeaderRecord.assignment.tractorEquipmentId;
  }

  if (resolvedPreTripItemId) {
    const preTripItem = await prisma.preTripItem.findUnique({
      where: { id: resolvedPreTripItemId },
      select: {
        id: true,
        preTripHeaderId: true,
        preTripHeader: {
          select: {
            id: true,
            fleetId: true,
            assignmentId: true,
            assignment: {
              select: {
                id: true,
                loadId: true,
                tractorEquipmentId: true,
                trailerEquipmentId: true,
              },
            },
          },
        },
      },
    });
    if (!preTripItem) {
      throw Object.assign(new Error("PreTripItem not found"), { statusCode: 404 });
    }
    if (resolvedPreTripHeaderId && preTripItem.preTripHeaderId !== resolvedPreTripHeaderId) {
      await denyWithAudit({
        sessionUser: input.sessionUser,
        operation: input.operation,
        reasonCategory: "pretrip_item_header_mismatch",
        statusCode: 422,
        message: "Pre-trip item does not belong to the supplied pre-trip header",
        fleetId: resolvedFleetId ?? preTripItem.preTripHeader.fleetId,
        equipmentId: resolvedEquipmentId,
        loadId: resolvedLoadId,
        dispatchAssignmentId: resolvedDispatchAssignmentId,
        preTripHeaderId: resolvedPreTripHeaderId,
        preTripItemId: resolvedPreTripItemId,
        conditionThreadId: resolvedConditionThreadId,
        conditionEventId: resolvedConditionEventId,
      });
    }
    if (resolvedFleetId && preTripItem.preTripHeader.fleetId !== resolvedFleetId) {
      await denyWithAudit({
        sessionUser: input.sessionUser,
        operation: input.operation,
        reasonCategory: "pretrip_item_fleet_mismatch",
        statusCode: 422,
        message: "Pre-trip item does not match the resolved fleet context",
        fleetId: resolvedFleetId,
        equipmentId: resolvedEquipmentId,
        loadId: resolvedLoadId,
        dispatchAssignmentId: resolvedDispatchAssignmentId,
        preTripHeaderId: resolvedPreTripHeaderId ?? preTripItem.preTripHeaderId,
        preTripItemId: resolvedPreTripItemId,
        conditionThreadId: resolvedConditionThreadId,
        conditionEventId: resolvedConditionEventId,
      });
    }
    if (resolvedDispatchAssignmentId && preTripItem.preTripHeader.assignmentId !== resolvedDispatchAssignmentId) {
      await denyWithAudit({
        sessionUser: input.sessionUser,
        operation: input.operation,
        reasonCategory: "pretrip_item_assignment_mismatch",
        statusCode: 422,
        message: "Pre-trip item does not match the supplied dispatch assignment",
        fleetId: preTripItem.preTripHeader.fleetId,
        equipmentId: resolvedEquipmentId,
        loadId: resolvedLoadId,
        dispatchAssignmentId: resolvedDispatchAssignmentId,
        preTripHeaderId: resolvedPreTripHeaderId ?? preTripItem.preTripHeaderId,
        preTripItemId: resolvedPreTripItemId,
        conditionThreadId: resolvedConditionThreadId,
        conditionEventId: resolvedConditionEventId,
      });
    }
    if (resolvedLoadId && preTripItem.preTripHeader.assignment.loadId !== resolvedLoadId) {
      await denyWithAudit({
        sessionUser: input.sessionUser,
        operation: input.operation,
        reasonCategory: "pretrip_item_load_mismatch",
        statusCode: 422,
        message: "Pre-trip item does not match the supplied load",
        fleetId: preTripItem.preTripHeader.fleetId,
        equipmentId: resolvedEquipmentId,
        loadId: resolvedLoadId,
        dispatchAssignmentId: resolvedDispatchAssignmentId ?? preTripItem.preTripHeader.assignmentId,
        preTripHeaderId: resolvedPreTripHeaderId ?? preTripItem.preTripHeaderId,
        preTripItemId: resolvedPreTripItemId,
        conditionThreadId: resolvedConditionThreadId,
        conditionEventId: resolvedConditionEventId,
      });
    }
    if (resolvedEquipmentId && !assignmentHasEquipment(preTripItem.preTripHeader.assignment, resolvedEquipmentId)) {
      await denyWithAudit({
        sessionUser: input.sessionUser,
        operation: input.operation,
        reasonCategory: "pretrip_item_equipment_mismatch",
        statusCode: 422,
        message: "Pre-trip item assignment does not match the resolved equipment",
        fleetId: preTripItem.preTripHeader.fleetId,
        equipmentId: resolvedEquipmentId,
        loadId: resolvedLoadId ?? preTripItem.preTripHeader.assignment.loadId,
        dispatchAssignmentId: resolvedDispatchAssignmentId ?? preTripItem.preTripHeader.assignmentId,
        preTripHeaderId: resolvedPreTripHeaderId ?? preTripItem.preTripHeaderId,
        preTripItemId: resolvedPreTripItemId,
        conditionThreadId: resolvedConditionThreadId,
        conditionEventId: resolvedConditionEventId,
      });
    }
    resolvedFleetId = resolvedFleetId ?? preTripItem.preTripHeader.fleetId;
    resolvedDispatchAssignmentId = resolvedDispatchAssignmentId ?? preTripItem.preTripHeader.assignmentId;
    resolvedLoadId = resolvedLoadId ?? preTripItem.preTripHeader.assignment.loadId;
    resolvedEquipmentId = resolvedEquipmentId ?? preTripItem.preTripHeader.assignment.tractorEquipmentId;
  }

  if (resolvedConditionEventId) {
    const conditionEvent = await prisma.conditionEvent.findUnique({
      where: { id: resolvedConditionEventId },
      select: {
        id: true,
        conditionThreadId: true,
        fleetId: true,
        equipmentId: true,
        loadId: true,
        dispatchAssignmentId: true,
        preTripHeaderId: true,
        preTripItemId: true,
      },
    });
    if (!conditionEvent) {
      throw Object.assign(new Error("ConditionEvent not found"), { statusCode: 404 });
    }
    if (resolvedConditionThreadId && conditionEvent.conditionThreadId !== resolvedConditionThreadId) {
      await denyWithAudit({
        sessionUser: input.sessionUser,
        operation: input.operation,
        reasonCategory: "condition_event_thread_mismatch",
        statusCode: 422,
        message: "Condition event does not match the supplied condition thread",
        fleetId: resolvedFleetId ?? conditionEvent.fleetId,
        equipmentId: resolvedEquipmentId ?? conditionEvent.equipmentId,
        loadId: resolvedLoadId,
        dispatchAssignmentId: resolvedDispatchAssignmentId,
        preTripHeaderId: resolvedPreTripHeaderId,
        preTripItemId: resolvedPreTripItemId,
        conditionThreadId: resolvedConditionThreadId,
        conditionEventId: resolvedConditionEventId,
      });
    }
    if (resolvedFleetId && conditionEvent.fleetId !== resolvedFleetId) {
      await denyWithAudit({
        sessionUser: input.sessionUser,
        operation: input.operation,
        reasonCategory: "condition_event_fleet_mismatch",
        statusCode: 422,
        message: "Condition event does not match the resolved fleet context",
        fleetId: resolvedFleetId,
        equipmentId: resolvedEquipmentId,
        loadId: resolvedLoadId,
        dispatchAssignmentId: resolvedDispatchAssignmentId,
        preTripHeaderId: resolvedPreTripHeaderId,
        preTripItemId: resolvedPreTripItemId,
        conditionThreadId: resolvedConditionThreadId,
        conditionEventId: resolvedConditionEventId,
      });
    }
    if (resolvedEquipmentId && conditionEvent.equipmentId !== resolvedEquipmentId) {
      await denyWithAudit({
        sessionUser: input.sessionUser,
        operation: input.operation,
        reasonCategory: "condition_event_equipment_mismatch",
        statusCode: 422,
        message: "Condition event does not match the resolved equipment context",
        fleetId: resolvedFleetId ?? conditionEvent.fleetId,
        equipmentId: resolvedEquipmentId,
        loadId: resolvedLoadId,
        dispatchAssignmentId: resolvedDispatchAssignmentId,
        preTripHeaderId: resolvedPreTripHeaderId,
        preTripItemId: resolvedPreTripItemId,
        conditionThreadId: resolvedConditionThreadId,
        conditionEventId: resolvedConditionEventId,
      });
    }
    if (resolvedLoadId && conditionEvent.loadId && conditionEvent.loadId !== resolvedLoadId) {
      await denyWithAudit({
        sessionUser: input.sessionUser,
        operation: input.operation,
        reasonCategory: "condition_event_load_mismatch",
        statusCode: 422,
        message: "Condition event does not match the supplied load",
        fleetId: resolvedFleetId ?? conditionEvent.fleetId,
        equipmentId: resolvedEquipmentId ?? conditionEvent.equipmentId,
        loadId: resolvedLoadId,
        dispatchAssignmentId: resolvedDispatchAssignmentId,
        preTripHeaderId: resolvedPreTripHeaderId,
        preTripItemId: resolvedPreTripItemId,
        conditionThreadId: resolvedConditionThreadId,
        conditionEventId: resolvedConditionEventId,
      });
    }
    if (
      resolvedDispatchAssignmentId &&
      conditionEvent.dispatchAssignmentId &&
      conditionEvent.dispatchAssignmentId !== resolvedDispatchAssignmentId
    ) {
      await denyWithAudit({
        sessionUser: input.sessionUser,
        operation: input.operation,
        reasonCategory: "condition_event_assignment_mismatch",
        statusCode: 422,
        message: "Condition event does not match the supplied dispatch assignment",
        fleetId: resolvedFleetId ?? conditionEvent.fleetId,
        equipmentId: resolvedEquipmentId ?? conditionEvent.equipmentId,
        loadId: resolvedLoadId,
        dispatchAssignmentId: resolvedDispatchAssignmentId,
        preTripHeaderId: resolvedPreTripHeaderId,
        preTripItemId: resolvedPreTripItemId,
        conditionThreadId: resolvedConditionThreadId,
        conditionEventId: resolvedConditionEventId,
      });
    }
    if (resolvedPreTripHeaderId && conditionEvent.preTripHeaderId && conditionEvent.preTripHeaderId !== resolvedPreTripHeaderId) {
      await denyWithAudit({
        sessionUser: input.sessionUser,
        operation: input.operation,
        reasonCategory: "condition_event_pretrip_header_mismatch",
        statusCode: 422,
        message: "Condition event does not match the supplied pre-trip header",
        fleetId: resolvedFleetId ?? conditionEvent.fleetId,
        equipmentId: resolvedEquipmentId ?? conditionEvent.equipmentId,
        loadId: resolvedLoadId,
        dispatchAssignmentId: resolvedDispatchAssignmentId,
        preTripHeaderId: resolvedPreTripHeaderId,
        preTripItemId: resolvedPreTripItemId,
        conditionThreadId: resolvedConditionThreadId,
        conditionEventId: resolvedConditionEventId,
      });
    }
    if (resolvedPreTripItemId && conditionEvent.preTripItemId && conditionEvent.preTripItemId !== resolvedPreTripItemId) {
      await denyWithAudit({
        sessionUser: input.sessionUser,
        operation: input.operation,
        reasonCategory: "condition_event_pretrip_item_mismatch",
        statusCode: 422,
        message: "Condition event does not match the supplied pre-trip item",
        fleetId: resolvedFleetId ?? conditionEvent.fleetId,
        equipmentId: resolvedEquipmentId ?? conditionEvent.equipmentId,
        loadId: resolvedLoadId,
        dispatchAssignmentId: resolvedDispatchAssignmentId,
        preTripHeaderId: resolvedPreTripHeaderId,
        preTripItemId: resolvedPreTripItemId,
        conditionThreadId: resolvedConditionThreadId,
        conditionEventId: resolvedConditionEventId,
      });
    }
    resolvedFleetId = conditionEvent.fleetId;
    resolvedEquipmentId = conditionEvent.equipmentId;
    resolvedLoadId = resolvedLoadId ?? conditionEvent.loadId ?? null;
    resolvedDispatchAssignmentId = resolvedDispatchAssignmentId ?? conditionEvent.dispatchAssignmentId ?? null;
  }

  if (assignmentRecord && !hasRole(input.sessionUser, OPERATOR_ROLE_CODES)) {
    const authenticatedDriver = await getAuthenticatedDriver(input.sessionUser);
    if (authenticatedDriver.status !== "LINKED" || authenticatedDriver.driver.id !== assignmentRecord.driverId) {
      await denyWithAudit({
        sessionUser: input.sessionUser,
        operation: input.operation,
        reasonCategory: "driver_assignment_mismatch",
        statusCode: 403,
        message: "Driver is not authorized for the supplied assignment context",
        fleetId: resolvedFleetId,
        equipmentId: resolvedEquipmentId,
        loadId: resolvedLoadId,
        dispatchAssignmentId: resolvedDispatchAssignmentId,
        preTripHeaderId: resolvedPreTripHeaderId,
        preTripItemId: resolvedPreTripItemId,
        conditionThreadId: resolvedConditionThreadId,
        conditionEventId: resolvedConditionEventId,
      });
    }
  }

  return {
    fleetId: resolvedFleetId,
    equipmentId: resolvedEquipmentId,
    loadId: resolvedLoadId,
    dispatchAssignmentId: resolvedDispatchAssignmentId,
    preTripHeaderId: resolvedPreTripHeaderId,
    preTripItemId: resolvedPreTripItemId,
    conditionThreadId: resolvedConditionThreadId,
    conditionEventId: resolvedConditionEventId,
  };
}

async function requireConditionAccess(
  sessionUser: SessionUserLike | null | undefined,
  fleetId: string,
  equipmentId: string,
  operation = "condition.access",
) {
  requireSessionUser(sessionUser);

  const access = await authorizedFleetAccess(sessionUser, fleetId);
  if (!access.allowed) {
    await denyWithAudit({
      sessionUser,
      operation,
      reasonCategory: "fleet_access_denied",
      statusCode: 403,
      message: "Forbidden",
      fleetId,
      equipmentId,
    });
  }

  if (hasRole(sessionUser, OPERATOR_ROLE_CODES)) {
    return;
  }

  const authenticatedDriver = await getAuthenticatedDriver(sessionUser);
  const linkedDriverId = authenticatedDriver.status === "LINKED" ? authenticatedDriver.driver.id : null;
  if (!linkedDriverId) {
    await denyWithAudit({
      sessionUser,
      operation,
      reasonCategory: "driver_not_linked",
      statusCode: 403,
      message: "Forbidden",
      fleetId,
      equipmentId,
    });
  }

  const assignment = await prisma.dispatchAssignment.findFirst({
    where: {
      fleetId,
      status: "ACTIVE",
      OR: [{ tractorEquipmentId: equipmentId }, { trailerEquipmentId: equipmentId }],
    },
    select: { id: true, driverId: true },
    orderBy: [{ assignedAt: "desc" }, { createdAt: "desc" }],
  });

  if (!assignment || assignment.driverId !== linkedDriverId) {
    await denyWithAudit({
      sessionUser,
      operation,
      reasonCategory: "driver_equipment_access_denied",
      statusCode: 403,
      message: "Forbidden",
      fleetId,
      equipmentId,
      dispatchAssignmentId: assignment?.id ?? null,
    });
  }
}

async function recalculateEvidenceCompleteness(tx: Prisma.TransactionClient, conditionThreadId: string) {
  const thread = await tx.conditionThread.findUnique({
    where: { id: conditionThreadId },
    include: {
      evidences: {
        orderBy: [{ capturedAt: "asc" }, { createdAt: "asc" }],
        include: {
          conditionEvent: {
            select: {
              eventType: true,
            },
          },
        },
      },
    },
  });

  if (!thread) {
    return ConditionEvidenceCompleteness.NONE;
  }

  if (thread.evidences.length === 0) {
    return ConditionEvidenceCompleteness.NONE;
  }

  const hasIdentificationEvidence = thread.evidences.some((evidence) => evidence.conditionEvent?.eventType === ConditionEventType.IDENTIFIED);
  const hasRepairEvidence = thread.evidences.some((evidence) => evidence.conditionEvent?.eventType === ConditionEventType.REPAIR_REPORTED);
  const hasResolutionEvidence = thread.evidences.some((evidence) => evidence.conditionEvent?.eventType === ConditionEventType.RESOLUTION_VERIFIED);

  if (
    thread.lifecycleState === ConditionLifecycleState.RESOLVED &&
    hasIdentificationEvidence &&
    hasResolutionEvidence &&
    (thread.repairReportedAt === null || hasRepairEvidence)
  ) {
    return ConditionEvidenceCompleteness.COMPLETE;
  }

  if (thread.lifecycleState === ConditionLifecycleState.AWAITING_VERIFICATION && hasIdentificationEvidence && hasRepairEvidence) {
    return ConditionEvidenceCompleteness.PARTIAL;
  }

  if (thread.lifecycleState === ConditionLifecycleState.IDENTIFIED || thread.lifecycleState === ConditionLifecycleState.CONFIRMED || thread.lifecycleState === ConditionLifecycleState.CHANGED) {
    return ConditionEvidenceCompleteness.PARTIAL;
  }

  return ConditionEvidenceCompleteness.INSUFFICIENT;
}

async function persistConditionEvent(input: {
  sessionUser: SessionUserLike;
  conditionThreadId: string;
  eventType: ConditionEventType;
  notes?: string | null;
  resolutionAuthority?: ConditionResolutionAuthority | null;
  loadId?: string | null;
  dispatchAssignmentId?: string | null;
  preTripHeaderId?: string | null;
  preTripItemId?: string | null;
}) {
  const thread = await getConditionThreadOrThrow(input.conditionThreadId);
  await requireConditionAccess(input.sessionUser, thread.fleetId, thread.equipmentId, "condition.record_event");
  const validatedContext = await validateOperationalContext({
    sessionUser: input.sessionUser,
    operation: "condition.record_event",
    anchorFleetId: thread.fleetId,
    anchorEquipmentId: thread.equipmentId,
    conditionThreadId: thread.id,
    loadId: input.loadId ?? null,
    dispatchAssignmentId: input.dispatchAssignmentId ?? null,
    preTripHeaderId: input.preTripHeaderId ?? null,
    preTripItemId: input.preTripItemId ?? null,
  });

  const lifecycleUpdate = resolveLifecycleUpdate(input.eventType);
  const actor = await getAuthenticatedDriver(input.sessionUser);
  const driverId = actor.status === "LINKED" ? actor.driver.id : null;
  const now = new Date();

  const event = await prisma.$transaction(async (tx) => {
    const createdEvent = await tx.conditionEvent.create({
      data: {
        conditionThread: { connect: { id: thread.id } },
        fleet: { connect: { id: thread.fleetId } },
        equipment: { connect: { id: thread.equipmentId } },
        ...(validatedContext.loadId ? { load: { connect: { id: validatedContext.loadId } } } : {}),
        ...(validatedContext.dispatchAssignmentId
          ? { dispatchAssignment: { connect: { id: validatedContext.dispatchAssignmentId } } }
          : {}),
        ...(validatedContext.preTripHeaderId ? { preTripHeader: { connect: { id: validatedContext.preTripHeaderId } } } : {}),
        ...(validatedContext.preTripItemId ? { preTripItem: { connect: { id: validatedContext.preTripItemId } } } : {}),
        eventType: input.eventType,
        observationSource: thread.observationSource,
        verificationState: lifecycleUpdate.verificationState,
        resolutionAuthority: input.resolutionAuthority ?? null,
        statusBefore: thread.lifecycleState,
        statusAfter: lifecycleUpdate.lifecycleState,
        verificationBefore: thread.verificationState,
        verificationAfter: lifecycleUpdate.verificationState,
        categoryBefore: thread.category,
        categoryAfter: thread.category,
        severityBefore: thread.severity,
        severityAfter: thread.severity,
        impactBefore: thread.impact,
        impactAfter: thread.impact,
        notes: input.notes?.trim() ? input.notes.trim() : null,
        observedAt: now,
        recordedByUser: { connect: { id: input.sessionUser.id } },
        ...(driverId ? { recordedByDriver: { connect: { id: driverId } } } : {}),
      },
    });

    const threadUpdate: Prisma.ConditionThreadUpdateInput = {
      lifecycleState: lifecycleUpdate.lifecycleState,
      verificationState: lifecycleUpdate.verificationState,
    };

    if (input.eventType === ConditionEventType.IDENTIFIED) {
      threadUpdate.firstIdentifiedAt = thread.firstIdentifiedAt ?? now;
    }

    if (
      input.eventType === ConditionEventType.CONFIRMED ||
      input.eventType === ConditionEventType.CHANGED ||
      input.eventType === ConditionEventType.REOPENED ||
      input.eventType === ConditionEventType.RESOLUTION_VERIFIED
    ) {
      threadUpdate.lastConfirmedAt = now;
    }

    if (input.eventType === ConditionEventType.REPAIR_REPORTED) {
      threadUpdate.repairReportedAt = now;
    }

    if (input.eventType === ConditionEventType.RESOLUTION_VERIFIED) {
      threadUpdate.resolutionVerifiedAt = now;
    }

    if (input.eventType === ConditionEventType.REOPENED) {
      threadUpdate.reopenedAt = now;
    }

    const updatedThread = await tx.conditionThread.update({
      where: { id: thread.id },
      data: threadUpdate,
      include: {
        events: {
          orderBy: [{ observedAt: "asc" }, { createdAt: "asc" }],
        },
        evidences: {
          orderBy: [{ capturedAt: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    const evidenceCompleteness = await recalculateEvidenceCompleteness(tx, thread.id);
    const retouchedThread = await tx.conditionThread.update({
      where: { id: thread.id },
      data: { evidenceCompleteness },
      include: {
        events: {
          orderBy: [{ observedAt: "asc" }, { createdAt: "asc" }],
        },
        evidences: {
          orderBy: [{ capturedAt: "asc" }, { createdAt: "asc" }],
        },
      },
    });

    return {
      event: createdEvent,
      thread: retouchedThread,
      previousThread: updatedThread,
    };
  });

  await createAuditRecord({
    actorId: input.sessionUser.id,
    actorEmail: input.sessionUser.email ?? null,
    tenantId: thread.fleetId,
    action: "CREATED",
    entityType: "ConditionEvent",
    entityId: event.event.id,
    details: {
      event:
        input.eventType === ConditionEventType.IDENTIFIED
          ? "pretrip.condition.identified"
          : input.eventType === ConditionEventType.CONFIRMED
            ? "pretrip.condition.confirmed"
            : input.eventType === ConditionEventType.CHANGED
              ? "pretrip.condition.changed"
              : input.eventType === ConditionEventType.REPAIR_REPORTED
                ? "pretrip.condition.repair_reported"
                : input.eventType === ConditionEventType.RESOLUTION_VERIFIED
                  ? "pretrip.condition.resolution_verified"
                  : input.eventType === ConditionEventType.REOPENED
                    ? "pretrip.condition.reopened"
                    : "pretrip.condition.awaiting_verification",
      conditionThreadId: thread.id,
      equipmentId: thread.equipmentId,
      loadId: validatedContext.loadId,
      dispatchAssignmentId: validatedContext.dispatchAssignmentId,
      preTripHeaderId: validatedContext.preTripHeaderId,
      preTripItemId: validatedContext.preTripItemId,
    },
    metadata: {
      source: "condition-service",
      eventType: input.eventType,
      resolutionAuthority: input.resolutionAuthority ?? null,
    },
  });

  return event;
}

export async function createCondition(sessionUser: SessionUserLike | null | undefined, input: {
  equipmentId: string;
  title: string;
  category: ConditionCategory | keyof typeof ConditionCategory;
  severity: ConditionSeverity | keyof typeof ConditionSeverity;
  impact?: ConditionImpact | keyof typeof ConditionImpact | null;
  notes?: string | null;
  preTripHeaderId?: string | null;
  preTripItemId?: string | null;
  dispatchAssignmentId?: string | null;
  loadId?: string | null;
}) {
  requireSessionUser(sessionUser);
  const actorSession = sessionUser as SessionUserLike;
  const actorId = actorSession.id;
  const actorEmail = actorSession.email ?? null;

  const equipmentId = requireNonEmptyString(input.equipmentId, "equipmentId");
  const title = requireNonEmptyString(input.title, "title");
  const equipment = await getEquipmentById(equipmentId);
  await requireConditionAccess(actorSession, equipment.fleetId, equipment.id, "condition.create");
  const validatedContext = await validateOperationalContext({
    sessionUser: actorSession,
    operation: "condition.create",
    anchorFleetId: equipment.fleetId,
    anchorEquipmentId: equipment.id,
    equipmentId: equipment.id,
    loadId: input.loadId ? requireNonEmptyString(input.loadId, "loadId") : null,
    dispatchAssignmentId: input.dispatchAssignmentId ? requireNonEmptyString(input.dispatchAssignmentId, "dispatchAssignmentId") : null,
    preTripHeaderId: input.preTripHeaderId ? requireNonEmptyString(input.preTripHeaderId, "preTripHeaderId") : null,
    preTripItemId: input.preTripItemId ? requireNonEmptyString(input.preTripItemId, "preTripItemId") : null,
  });

  const authenticatedDriver = await getAuthenticatedDriver(actorSession);
  const createdByDriverId = authenticatedDriver.status === "LINKED" ? authenticatedDriver.driver.id : null;
  const observationSource = toObservationSource(undefined, actorSession);
  const category = toEnumValue(ConditionCategory, input.category, "category");
  const severity = toEnumValue(ConditionSeverity, input.severity, "severity");
  const impact = input.impact ? toEnumValue(ConditionImpact, input.impact, "impact") : null;

  const thread = await prisma.$transaction(async (tx) => {
    const createdThread = await tx.conditionThread.create({
      data: {
        fleet: { connect: { id: equipment.fleetId } },
        equipment: { connect: { id: equipment.id } },
        title,
        category,
        severity,
        impact,
        observationSource,
        lifecycleState: ConditionLifecycleState.IDENTIFIED,
        verificationState: ConditionVerificationState.UNVERIFIED,
        evidenceCompleteness: ConditionEvidenceCompleteness.NONE,
        firstIdentifiedAt: new Date(),
        createdByUser: { connect: { id: actorId } },
        ...(createdByDriverId ? { createdByDriver: { connect: { id: createdByDriverId } } } : {}),
        notes: input.notes?.trim() ? input.notes.trim() : null,
      },
    });

    await tx.conditionEvent.create({
      data: {
        conditionThread: { connect: { id: createdThread.id } },
        fleet: { connect: { id: equipment.fleetId } },
        equipment: { connect: { id: equipment.id } },
        ...(validatedContext.loadId ? { load: { connect: { id: validatedContext.loadId } } } : {}),
        ...(validatedContext.dispatchAssignmentId
          ? { dispatchAssignment: { connect: { id: validatedContext.dispatchAssignmentId } } }
          : {}),
        ...(validatedContext.preTripHeaderId ? { preTripHeader: { connect: { id: validatedContext.preTripHeaderId } } } : {}),
        ...(validatedContext.preTripItemId ? { preTripItem: { connect: { id: validatedContext.preTripItemId } } } : {}),
        eventType: ConditionEventType.IDENTIFIED,
        observationSource,
        verificationState: ConditionVerificationState.UNVERIFIED,
        statusBefore: null,
        statusAfter: ConditionLifecycleState.IDENTIFIED,
        verificationBefore: null,
        verificationAfter: ConditionVerificationState.UNVERIFIED,
        categoryBefore: null,
        categoryAfter: category,
        severityBefore: null,
        severityAfter: severity,
        impactBefore: null,
        impactAfter: impact,
        notes: input.notes?.trim() ? input.notes.trim() : null,
        observedAt: new Date(),
        recordedByUser: { connect: { id: actorId } },
        ...(createdByDriverId ? { recordedByDriver: { connect: { id: createdByDriverId } } } : {}),
      },
    });

    return tx.conditionThread.findUnique({
      where: { id: createdThread.id },
      include: {
        events: {
          orderBy: [{ observedAt: "asc" }, { createdAt: "asc" }],
        },
        evidences: {
          orderBy: [{ capturedAt: "asc" }, { createdAt: "asc" }],
        },
      },
    });
  });

  await createAuditRecord({
    actorId,
    actorEmail,
    tenantId: equipment.fleetId,
    action: "CREATED",
    entityType: "ConditionThread",
    entityId: thread?.id ?? null,
    details: {
      event: "pretrip.condition.identified",
      equipmentId: equipment.id,
      title,
    },
    metadata: {
      source: "condition-service",
      observationSource,
    },
  });

  return thread;
}

export async function confirmCondition(sessionUser: SessionUserLike | null | undefined, conditionThreadId: string, notes?: string | null) {
  requireSessionUser(sessionUser);
  const actorSession = sessionUser as SessionUserLike;
  return persistConditionEvent({
    sessionUser: actorSession,
    conditionThreadId,
    eventType: ConditionEventType.CONFIRMED,
    notes,
  });
}

export async function recordConditionChange(sessionUser: SessionUserLike | null | undefined, conditionThreadId: string, notes?: string | null) {
  requireSessionUser(sessionUser);
  const actorSession = sessionUser as SessionUserLike;
  return persistConditionEvent({
    sessionUser: actorSession,
    conditionThreadId,
    eventType: ConditionEventType.CHANGED,
    notes,
  });
}

export async function reportRepair(sessionUser: SessionUserLike | null | undefined, conditionThreadId: string, notes?: string | null) {
  requireSessionUser(sessionUser);
  const actorSession = sessionUser as SessionUserLike;
  return persistConditionEvent({
    sessionUser: actorSession,
    conditionThreadId,
    eventType: ConditionEventType.REPAIR_REPORTED,
    notes,
  });
}

export async function verifyResolution(sessionUser: SessionUserLike | null | undefined, input: {
  conditionThreadId: string;
  authority: ConditionResolutionAuthority | keyof typeof ConditionResolutionAuthority;
  notes?: string | null;
}) {
  requireSessionUser(sessionUser);
  const actorSession = sessionUser as SessionUserLike;
  const authority = toEnumValue(ConditionResolutionAuthority, input.authority, "authority");
  if (authority === ConditionResolutionAuthority.DRIVER) {
    const authenticatedDriver = await getAuthenticatedDriver(actorSession);
    if (authenticatedDriver.status !== "LINKED") {
      throw Object.assign(new Error("Driver resolution authority requires a linked driver session"), { statusCode: 403 });
    }
  }
  resolveResolutionAuthority(actorSession, authority);

  return persistConditionEvent({
    sessionUser: actorSession,
    conditionThreadId: input.conditionThreadId,
    eventType: ConditionEventType.RESOLUTION_VERIFIED,
    notes: input.notes,
    resolutionAuthority: authority,
  });
}

export async function reopenCondition(sessionUser: SessionUserLike | null | undefined, conditionThreadId: string, notes?: string | null) {
  requireSessionUser(sessionUser);
  const actorSession = sessionUser as SessionUserLike;
  return persistConditionEvent({
    sessionUser: actorSession,
    conditionThreadId,
    eventType: ConditionEventType.REOPENED,
    notes,
  });
}

export async function attachEvidence(sessionUser: SessionUserLike | null | undefined, input: ConditionEvidenceAttachmentInput) {
  requireSessionUser(sessionUser);
  const actorSession = sessionUser as SessionUserLike;
  const actorId = actorSession.id;
  const actorEmail = actorSession.email ?? null;

  const evidenceKind = toEnumValue(ConditionEvidenceKind, input.evidenceKind, "evidenceKind");
  const observationSource = toObservationSource(input.observationSource, actorSession);

  const inputEquipmentId = input.equipmentId ? requireNonEmptyString(input.equipmentId, "equipmentId") : null;
  const inputLoadId = input.loadId ? requireNonEmptyString(input.loadId, "loadId") : null;
  const inputDispatchAssignmentId = input.dispatchAssignmentId
    ? requireNonEmptyString(input.dispatchAssignmentId, "dispatchAssignmentId")
    : null;
  const inputPreTripHeaderId = input.preTripHeaderId ? requireNonEmptyString(input.preTripHeaderId, "preTripHeaderId") : null;
  const inputPreTripItemId = input.preTripItemId ? requireNonEmptyString(input.preTripItemId, "preTripItemId") : null;
  const conditionThreadId: string | null = input.conditionThreadId ? requireNonEmptyString(input.conditionThreadId, "conditionThreadId") : null;
  const conditionEventId: string | null = input.conditionEventId ? requireNonEmptyString(input.conditionEventId, "conditionEventId") : null;

  if (!conditionThreadId && !inputEquipmentId && !inputLoadId && !inputDispatchAssignmentId && !inputPreTripHeaderId) {
    throw Object.assign(new Error("An equipment, load, assignment, or pre-trip anchor is required"), {
      statusCode: 422,
    });
  }

  const threadAnchor = conditionThreadId
    ? await prisma.conditionThread.findUnique({
        where: { id: conditionThreadId },
        select: { id: true, fleetId: true, equipmentId: true },
      })
    : null;
  if (conditionThreadId && !threadAnchor) {
    throw Object.assign(new Error("ConditionThread not found"), { statusCode: 404 });
  }

  const validatedContext = await validateOperationalContext({
    sessionUser: actorSession,
    operation: "condition.attach_evidence",
    anchorFleetId: threadAnchor?.fleetId ?? null,
    anchorEquipmentId: threadAnchor?.equipmentId ?? null,
    conditionThreadId,
    conditionEventId,
    equipmentId: inputEquipmentId,
    loadId: inputLoadId,
    dispatchAssignmentId: inputDispatchAssignmentId,
    preTripHeaderId: inputPreTripHeaderId,
    preTripItemId: inputPreTripItemId,
  });

  const fleetId = validatedContext.fleetId;
  const equipmentId = validatedContext.equipmentId;
  const loadId = validatedContext.loadId;
  const dispatchAssignmentId = validatedContext.dispatchAssignmentId;
  const preTripHeaderId = validatedContext.preTripHeaderId;
  const preTripItemId = validatedContext.preTripItemId;

  if (!fleetId) {
    throw Object.assign(new Error("Unable to resolve fleet context"), { statusCode: 422 });
  }

  if (equipmentId) {
    await requireConditionAccess(actorSession, fleetId, equipmentId, "condition.attach_evidence");
  } else {
    const access = await authorizedFleetAccess(actorSession, fleetId);
    if (!access.allowed) {
      await denyWithAudit({
        sessionUser: actorSession,
        operation: "condition.attach_evidence",
        reasonCategory: "fleet_access_denied",
        statusCode: 403,
        message: "Forbidden",
        fleetId,
        loadId,
        dispatchAssignmentId,
        preTripHeaderId,
        preTripItemId,
        conditionThreadId,
        conditionEventId,
      });
    }
  }

  const fileEntry = input.file ?? null;
  let bytes: Uint8Array;
  let mimeType: string;
  let originalFileName: string;

  if (fileEntry) {
    if (fileEntry.size <= 0) {
      throw Object.assign(new Error("file is required"), { statusCode: 422 });
    }
    mimeType = String(fileEntry.type ?? "").trim().toLowerCase();
    if (!ALLOWED_EVIDENCE_MIME_TYPES.has(mimeType)) {
      throw Object.assign(new Error("Unsupported evidence file type"), { statusCode: 422 });
    }
    bytes = new Uint8Array(await fileEntry.arrayBuffer());
    originalFileName = sanitizeFileName(fileEntry.name || input.originalFileName || "evidence.bin");
  } else {
    if (input.observationValue === undefined || input.observationValue === null) {
      throw Object.assign(new Error("file or observationValue is required"), { statusCode: 422 });
    }
    const observationJson = JSON.stringify(input.observationValue, null, 2);
    const syntheticFile = new File([observationJson], input.originalFileName || "observation.json", {
      type: "application/json",
    });
    bytes = new Uint8Array(await syntheticFile.arrayBuffer());
    mimeType = "application/json";
    originalFileName = sanitizeFileName(syntheticFile.name);
  }

  const evidenceId = randomUUID();
  const storageKey = storageKeyForEvidence(fleetId, evidenceId, originalFileName);
  await persistFile(storageKey, bytes);

  try {
    const createdEvidence = await prisma.$transaction(async (tx) => {
        const linkedDriver = await getAuthenticatedDriver(actorSession);
        const capturedByDriverId = linkedDriver.status === "LINKED" ? linkedDriver.driver.id : null;
        const evidence = await tx.operationalEvidence.create({
          data: {
          id: evidenceId,
            fleet: { connect: { id: fleetId } },
            ...(equipmentId ? { equipment: { connect: { id: equipmentId } } } : {}),
            ...(loadId ? { load: { connect: { id: loadId } } } : {}),
            ...(dispatchAssignmentId ? { dispatchAssignment: { connect: { id: dispatchAssignmentId } } } : {}),
            ...(preTripHeaderId ? { preTripHeader: { connect: { id: preTripHeaderId } } } : {}),
            ...(preTripItemId ? { preTripItem: { connect: { id: preTripItemId } } } : {}),
            ...(conditionThreadId ? { conditionThread: { connect: { id: conditionThreadId } } } : {}),
            ...(conditionEventId ? { conditionEvent: { connect: { id: conditionEventId } } } : {}),
          evidenceKind,
          observationSource,
          ...(input.observationValue !== undefined && input.observationValue !== null
            ? { observationValue: input.observationValue }
            : {}),
          provenance: {
            ...(typeof input.provenance === "object" && input.provenance !== null && !Array.isArray(input.provenance)
              ? input.provenance
              : {}),
            source: "condition-service",
            capturedByUserId: actorId,
          } as Prisma.InputJsonValue,
          storageKey,
          originalFileName,
          mimeType,
          checksum: sha256Hex(bytes),
          capturedAt: new Date(),
          capturedByUser: { connect: { id: actorId } },
          ...(capturedByDriverId ? { capturedByDriver: { connect: { id: capturedByDriverId } } } : {}),
          notes: input.notes?.trim() ? input.notes.trim() : null,
        },
      });

      if (conditionThreadId) {
        const evidenceCompleteness = await recalculateEvidenceCompleteness(tx, conditionThreadId);
        await tx.conditionThread.update({
          where: { id: conditionThreadId },
          data: { evidenceCompleteness },
        });
      }

      return evidence;
    });

    await createAuditRecord({
      actorId,
      actorEmail,
      tenantId: fleetId,
      action: "CREATED",
      entityType: "OperationalEvidence",
      entityId: createdEvidence.id,
      details: {
        event: "pretrip.evidence.captured",
        conditionThreadId,
        conditionEventId,
        equipmentId,
        loadId,
        dispatchAssignmentId,
        preTripHeaderId,
        preTripItemId,
      },
      metadata: {
        source: "condition-service",
        evidenceKind,
        observationSource,
      },
    });

    return createdEvidence;
  } catch (error) {
    await removeFile(storageKey);
    throw error;
  }
}

export async function getConditionThreadById(conditionThreadId: string) {
  return prisma.conditionThread.findUnique({
    where: { id: conditionThreadId },
    include: {
      fleet: true,
      equipment: true,
      createdByUser: true,
      createdByDriver: true,
      events: {
        orderBy: [{ observedAt: "asc" }, { createdAt: "asc" }],
        include: {
          recordedByUser: true,
          recordedByDriver: true,
          evidences: {
            orderBy: [{ capturedAt: "asc" }, { createdAt: "asc" }],
          },
        },
      },
      evidences: {
        orderBy: [{ capturedAt: "asc" }, { createdAt: "asc" }],
        include: {
          capturedByUser: true,
          capturedByDriver: true,
          conditionEvent: true,
        },
      },
    },
  });
}

export async function getConditionHistory(sessionUser: SessionUserLike | null | undefined, conditionThreadId: string) {
  const thread = await getConditionThreadOrThrow(conditionThreadId);
  await requireConditionAccess(sessionUser, thread.fleetId, thread.equipmentId, "condition.get_history");
  return thread;
}

export async function getCurrentConditionsForEquipment(sessionUser: SessionUserLike | null | undefined, equipmentId: string) {
  const equipment = await getEquipmentById(equipmentId);
  await requireConditionAccess(sessionUser, equipment.fleetId, equipment.id, "condition.get_current_for_equipment");

  return prisma.conditionThread.findMany({
    where: {
      equipmentId: equipment.id,
      lifecycleState: { not: ConditionLifecycleState.RESOLVED },
    },
    orderBy: [{ firstIdentifiedAt: "desc" }, { createdAt: "desc" }],
    include: {
      events: {
        orderBy: [{ observedAt: "asc" }, { createdAt: "asc" }],
      },
      evidences: {
        orderBy: [{ capturedAt: "asc" }, { createdAt: "asc" }],
      },
    },
  });
}

export async function getConditionEvidence(sessionUser: SessionUserLike | null | undefined, evidenceId: string) {
  requireSessionUser(sessionUser);
  const evidence = await prisma.operationalEvidence.findUnique({
    where: { id: evidenceId },
    include: {
      conditionThread: true,
      conditionEvent: true,
    },
  });

  if (!evidence) {
    throw Object.assign(new Error("OperationalEvidence not found"), { statusCode: 404 });
  }

  const equipmentId = evidence.equipmentId ?? evidence.conditionThread?.equipmentId ?? evidence.conditionEvent?.equipmentId;
  if (equipmentId) {
    await requireConditionAccess(sessionUser, evidence.fleetId, equipmentId, "condition.get_evidence");
  } else {
    const access = await authorizedFleetAccess(sessionUser, evidence.fleetId);
    if (!access.allowed) {
      await denyWithAudit({
        sessionUser,
        operation: "condition.get_evidence",
        reasonCategory: "fleet_access_denied",
        statusCode: 403,
        message: "Forbidden",
        fleetId: evidence.fleetId,
        conditionThreadId: evidence.conditionThreadId,
        conditionEventId: evidence.conditionEventId,
        evidenceId: evidence.id,
      });
    }
  }
  return evidence;
}
