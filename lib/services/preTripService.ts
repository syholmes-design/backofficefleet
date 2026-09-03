import { PreTripDefectSeverity, PreTripItemStatus, PreTripStatus, Prisma } from "@prisma/client";

import { createAuditRecord } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { recordOperatingProcessEvent } from "@/lib/process-intelligence/operating-event-service";
import { getOperatingProcessStore } from "@/lib/process-intelligence/runtime-store";
import { authorizedFleetAccess, type SessionUserLike } from "@/lib/services/intakeService";

const OPEN_PRETRIP_CONSTRAINTS = new Map([
  ["PreTripHeader_open_assignment_unique_idx", "An open pre-trip already exists for this assignment."],
  ["assignmentId", "An open pre-trip already exists for this assignment."],
]);

type PreTripItemDefinition = {
  sectionCode: string;
  isCritical: boolean;
  requiredForCompletion: boolean;
  label: string;
};

const PRETRIP_ITEM_DEFINITIONS: Record<string, PreTripItemDefinition> = {
  "rate-con": { sectionCode: "LOAD_DOCS", isCritical: true, requiredForCompletion: true, label: "Rate Confirmation" },
  bol: { sectionCode: "LOAD_DOCS", isCritical: true, requiredForCompletion: true, label: "BOL" },
  "dispatch-instructions": {
    sectionCode: "LOAD_DOCS",
    isCritical: true,
    requiredForCompletion: true,
    label: "Dispatch instructions",
  },
  "pretrip-cargo": {
    sectionCode: "PROOF_REQUIREMENTS",
    isCritical: true,
    requiredForCompletion: true,
    label: "Pre-trip cargo photo",
  },
  "seal-verify": {
    sectionCode: "PROOF_REQUIREMENTS",
    isCritical: true,
    requiredForCompletion: true,
    label: "Seal verification",
  },
  "pod-pretrip": {
    sectionCode: "PROOF_REQUIREMENTS",
    isCritical: false,
    requiredForCompletion: false,
    label: "POD stack (readiness)",
  },
  "trailer-condition": {
    sectionCode: "PROOF_REQUIREMENTS",
    isCritical: false,
    requiredForCompletion: false,
    label: "Trailer condition",
  },
  "maint-report": {
    sectionCode: "VEHICLE_READINESS",
    isCritical: false,
    requiredForCompletion: false,
    label: "Maintenance report",
  },
  "tire-check": {
    sectionCode: "VEHICLE_READINESS",
    isCritical: false,
    requiredForCompletion: false,
    label: "Tire check",
  },
  "fuel-check": {
    sectionCode: "VEHICLE_READINESS",
    isCritical: false,
    requiredForCompletion: false,
    label: "Fuel check",
  },
  hos: {
    sectionCode: "COMPLIANCE_SAFETY",
    isCritical: false,
    requiredForCompletion: false,
    label: "HOS / open compliance",
  },
  camera: {
    sectionCode: "COMPLIANCE_SAFETY",
    isCritical: false,
    requiredForCompletion: false,
    label: "Camera status",
  },
  cdl: { sectionCode: "COMPLIANCE_SAFETY", isCritical: true, requiredForCompletion: true, label: "CDL" },
  med: {
    sectionCode: "COMPLIANCE_SAFETY",
    isCritical: true,
    requiredForCompletion: true,
    label: "Medical Card",
  },
  mvr: { sectionCode: "COMPLIANCE_SAFETY", isCritical: true, requiredForCompletion: true, label: "MVR" },
  "lumper-setup": {
    sectionCode: "FINANCIAL_OPS",
    isCritical: false,
    requiredForCompletion: false,
    label: "QR lumper closeout",
  },
  "payment-flags": {
    sectionCode: "FINANCIAL_OPS",
    isCritical: false,
    requiredForCompletion: false,
    label: "Payment proof packet",
  },
  "rf-actions": {
    sectionCode: "FINANCIAL_OPS",
    isCritical: false,
    requiredForCompletion: false,
    label: "RFID / proof chain",
  },
  settlements: {
    sectionCode: "FINANCIAL_OPS",
    isCritical: false,
    requiredForCompletion: false,
    label: "Settlements / payroll",
  },
  weather: {
    sectionCode: "ROUTE_INTELLIGENCE",
    isCritical: false,
    requiredForCompletion: false,
    label: "Weather along lane",
  },
  traffic: {
    sectionCode: "ROUTE_INTELLIGENCE",
    isCritical: false,
    requiredForCompletion: false,
    label: "Traffic / ETA risk",
  },
};

function requireSessionUser(sessionUser: SessionUserLike | null | undefined) {
  if (!sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
}

function getItemDefinition(itemCode: string) {
  const definition = PRETRIP_ITEM_DEFINITIONS[itemCode];
  if (!definition) {
    throw Object.assign(new Error(`Unknown pre-trip itemCode: ${itemCode}`), { statusCode: 422 });
  }
  return definition;
}

function ensureValidItemStatus(status: string) {
  if (!Object.values(PreTripItemStatus).includes(status as PreTripItemStatus)) {
    throw Object.assign(new Error("Invalid pre-trip item status"), { statusCode: 422 });
  }
  return status as PreTripItemStatus;
}

function isKnownUniqueConstraintError(error: unknown, knownConstraints: Map<string, string>) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return null;
  }

  const targets = Array.isArray(error.meta?.target) ? error.meta.target.map(String) : [];
  const rawMessage = String(error.message ?? "");
  for (const [constraint, message] of knownConstraints.entries()) {
    if (targets.includes(constraint) || rawMessage.includes(constraint)) {
      return message;
    }
  }

  return null;
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
    entityType: "PreTripHeader",
    entityId,
    details: { event: "unauthorized dispatch access", reason },
    metadata: { source: "pretrip-service" },
  });
}

async function getAuthorizedAssignment(
  sessionUser: SessionUserLike | null | undefined,
  assignmentId: string,
) {
  const assignment = await prisma.dispatchAssignment.findUnique({
    where: { id: assignmentId },
    include: { load: true, driver: true, tractorEquipment: true, trailerEquipment: true },
  });

  if (!assignment) {
    return { assignment: null, allowed: false, reason: "NOT_FOUND" as const };
  }

  const access = await authorizedFleetAccess(sessionUser, assignment.fleetId);
  if (!access.allowed) {
    return { assignment, allowed: false, reason: access.reason ?? "TENANT_ACCESS_DENIED" };
  }

  return { assignment, allowed: true, reason: undefined as string | undefined };
}

async function getAuthorizedPreTrip(
  sessionUser: SessionUserLike | null | undefined,
  preTripHeaderId: string,
) {
  const header = await prisma.preTripHeader.findUnique({
    where: { id: preTripHeaderId },
    include: {
      assignment: true,
      items: { orderBy: [{ createdAt: "asc" }, { itemCode: "asc" }] },
      defects: { orderBy: [{ createdAt: "asc" }, { itemCode: "asc" }] },
    },
  });

  if (!header) {
    return { header: null, allowed: false, reason: "NOT_FOUND" as const };
  }

  const access = await authorizedFleetAccess(sessionUser, header.fleetId);
  if (!access.allowed) {
    return { header, allowed: false, reason: access.reason ?? "TENANT_ACCESS_DENIED" };
  }

  return { header, allowed: true, reason: undefined as string | undefined };
}

async function syncHeaderStatus(tx: Prisma.TransactionClient, preTripHeaderId: string) {
  const header = await tx.preTripHeader.findUnique({
    where: { id: preTripHeaderId },
    include: {
      defects: true,
    },
  });
  if (!header || header.status === "VOIDED" || header.status === "COMPLETED") {
    return header;
  }

  const hasBlockingDefect = header.defects.some((defect) => defect.severity === "BLOCKING");
  return tx.preTripHeader.update({
    where: { id: preTripHeaderId },
    data: { status: hasBlockingDefect ? "BLOCKED" : "OPEN" },
  });
}

export async function startPreTrip(sessionUser: SessionUserLike | null | undefined, assignmentId: string) {
  requireSessionUser(sessionUser);

  const { assignment, allowed, reason } = await getAuthorizedAssignment(sessionUser, assignmentId);
  if (!assignment) {
    throw Object.assign(new Error("DispatchAssignment not found"), { statusCode: 404 });
  }
  if (!allowed) {
    await logUnauthorizedDispatchAccess(sessionUser, assignment.fleetId, assignment.id, reason ?? "TENANT_ACCESS_DENIED");
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }
  if (assignment.status !== "ACTIVE") {
    throw Object.assign(new Error("Pre-trip can only be started for an active assignment"), { statusCode: 422 });
  }

  try {
    return await prisma.preTripHeader.create({
      data: {
        fleetId: assignment.fleetId,
        assignmentId: assignment.id,
        status: "OPEN",
      },
    });
  } catch (error) {
    const constraintMessage = isKnownUniqueConstraintError(error, OPEN_PRETRIP_CONSTRAINTS);
    if (constraintMessage) {
      throw Object.assign(new Error(constraintMessage), { statusCode: 409 });
    }
    throw error;
  }
}

export async function updatePreTripItem(
  sessionUser: SessionUserLike | null | undefined,
  preTripHeaderId: string,
  itemCode: string,
  status: PreTripItemStatus,
  notes?: string | null,
) {
  requireSessionUser(sessionUser);

  const normalizedStatus = ensureValidItemStatus(status);
  const definition = getItemDefinition(itemCode);
  const { header, allowed, reason } = await getAuthorizedPreTrip(sessionUser, preTripHeaderId);
  if (!header) {
    throw Object.assign(new Error("PreTripHeader not found"), { statusCode: 404 });
  }
  if (!allowed) {
    await logUnauthorizedDispatchAccess(sessionUser, header.fleetId, header.id, reason ?? "TENANT_ACCESS_DENIED");
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }
  if (header.status === "VOIDED") {
    throw Object.assign(new Error("Cannot modify a voided pre-trip"), { statusCode: 422 });
  }

  return prisma.$transaction(async (tx) => {
    const item = await tx.preTripItem.upsert({
      where: {
        preTripHeaderId_itemCode: {
          preTripHeaderId: header.id,
          itemCode,
        },
      },
      update: {
        sectionCode: definition.sectionCode,
        isCritical: definition.isCritical,
        status: normalizedStatus,
        notes: notes?.trim() ? notes.trim() : null,
      },
      create: {
        preTripHeaderId: header.id,
        itemCode,
        sectionCode: definition.sectionCode,
        isCritical: definition.isCritical,
        status: normalizedStatus,
        notes: notes?.trim() ? notes.trim() : null,
      },
    });

    const existingDefects = await tx.preTripDefect.findMany({
      where: {
        preTripHeaderId: header.id,
        itemCode,
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    });

    if (normalizedStatus === "PASS" || normalizedStatus === "NOT_APPLICABLE" || normalizedStatus === "PENDING") {
      if (existingDefects.length > 0) {
        await tx.preTripDefect.deleteMany({
          where: { id: { in: existingDefects.map((defect) => defect.id) } },
        });
      }
    } else {
      const severity: PreTripDefectSeverity = normalizedStatus === "FAIL" ? "BLOCKING" : "WARNING";
      const description =
        notes?.trim() || `${definition.label} requires ${severity === "BLOCKING" ? "repair" : "review"}.`;
      const primaryDefect = existingDefects[0] ?? null;

      if (primaryDefect) {
        await tx.preTripDefect.update({
          where: { id: primaryDefect.id },
          data: {
            preTripItemId: item.id,
            severity,
            description,
            requiresRepair: severity === "BLOCKING",
          },
        });
      } else {
        await tx.preTripDefect.create({
          data: {
            preTripHeaderId: header.id,
            preTripItemId: item.id,
            itemCode,
            severity,
            description,
            requiresRepair: severity === "BLOCKING",
          },
        });
      }

      if (existingDefects.length > 1) {
        await tx.preTripDefect.deleteMany({
          where: { id: { in: existingDefects.slice(1).map((defect) => defect.id) } },
        });
      }
    }

    await syncHeaderStatus(tx, header.id);

    return tx.preTripHeader.findUnique({
      where: { id: header.id },
      include: {
        assignment: true,
        items: { orderBy: [{ createdAt: "asc" }, { itemCode: "asc" }] },
        defects: { orderBy: [{ createdAt: "asc" }, { itemCode: "asc" }] },
      },
    });
  });
}

export async function completePreTrip(sessionUser: SessionUserLike | null | undefined, preTripHeaderId: string) {
  requireSessionUser(sessionUser);
  const actorId = sessionUser!.id;

  const { header, allowed, reason } = await getAuthorizedPreTrip(sessionUser, preTripHeaderId);
  if (!header) {
    throw Object.assign(new Error("PreTripHeader not found"), { statusCode: 404 });
  }
  if (!allowed) {
    await logUnauthorizedDispatchAccess(sessionUser, header.fleetId, header.id, reason ?? "TENANT_ACCESS_DENIED");
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }
  if (header.status !== "OPEN") {
    throw Object.assign(new Error("Pre-trip must be OPEN before completion"), { statusCode: 422 });
  }

  const requiredCriticalCodes = Object.entries(PRETRIP_ITEM_DEFINITIONS)
    .filter(([, definition]) => definition.requiredForCompletion)
    .map(([itemCode]) => itemCode);

  const itemMap = new Map(header.items.map((item) => [item.itemCode, item]));
  const missingCriticalCodes = requiredCriticalCodes.filter((itemCode) => !itemMap.has(itemCode));
  if (missingCriticalCodes.length > 0) {
    throw Object.assign(new Error(`Required critical items missing: ${missingCriticalCodes.join(", ")}`), {
      statusCode: 422,
    });
  }

  const nonPassingCriticalCodes = requiredCriticalCodes.filter(
    (itemCode) => itemMap.get(itemCode)?.status !== "PASS",
  );
  if (nonPassingCriticalCodes.length > 0) {
    throw Object.assign(
      new Error(`Required critical items must pass before completion: ${nonPassingCriticalCodes.join(", ")}`),
      { statusCode: 422 },
    );
  }

  const hasBlockingDefect = header.defects.some((defect) => defect.severity === "BLOCKING");
  if (hasBlockingDefect) {
    throw Object.assign(new Error("Blocking pre-trip defects must be resolved before completion"), {
      statusCode: 422,
    });
  }

  const completed = await prisma.preTripHeader.update({
    where: { id: header.id },
    data: {
      status: "COMPLETED",
      completedAt: new Date(),
      completedByUserId: actorId,
    },
    include: {
      assignment: true,
      items: { orderBy: [{ createdAt: "asc" }, { itemCode: "asc" }] },
      defects: { orderBy: [{ createdAt: "asc" }, { itemCode: "asc" }] },
    },
  });
  await recordOperatingProcessEvent(getOperatingProcessStore(), sessionUser, {
    fleetId: completed.fleetId,
    loadId: completed.assignment.loadId,
    entityType: "PreTripHeader",
    entityId: completed.id,
    eventType: "PRETRIP_RECORDED",
    processStage: "PRE_TRIP_EVIDENCE",
    eventTimestamp: completed.completedAt ?? new Date(),
    actorId,
    actorType: "USER",
    resultingState: completed.status,
    relatedRecordType: "PreTripHeader",
    relatedRecordId: completed.id,
    lineage: { sourceSystem: "BOF", sourceRecordId: completed.id },
  });
  return completed;
}

export async function getPreTripForAssignment(
  sessionUser: SessionUserLike | null | undefined,
  assignmentId: string,
) {
  requireSessionUser(sessionUser);

  const { assignment, allowed, reason } = await getAuthorizedAssignment(sessionUser, assignmentId);
  if (!assignment) {
    throw Object.assign(new Error("DispatchAssignment not found"), { statusCode: 404 });
  }
  if (!allowed) {
    await logUnauthorizedDispatchAccess(sessionUser, assignment.fleetId, assignment.id, reason ?? "TENANT_ACCESS_DENIED");
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  return prisma.preTripHeader.findFirst({
    where: {
      assignmentId: assignment.id,
      status: { not: PreTripStatus.VOIDED },
    },
    include: {
      assignment: true,
      items: { orderBy: [{ createdAt: "asc" }, { itemCode: "asc" }] },
      defects: { orderBy: [{ createdAt: "asc" }, { itemCode: "asc" }] },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
}
