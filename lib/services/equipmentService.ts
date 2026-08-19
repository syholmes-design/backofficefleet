import { EquipmentStatus } from "@prisma/client";

import { createAuditRecord } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { authorizedFleetAccess, type SessionUserLike } from "@/lib/services/intakeService";

function requireSessionUser(sessionUser: SessionUserLike | null | undefined) {
  if (!sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
}

function ensureValidEquipmentStatus(status: string) {
  if (!Object.values(EquipmentStatus).includes(status as EquipmentStatus)) {
    throw Object.assign(new Error("Invalid equipment status"), { statusCode: 422 });
  }
  return status as EquipmentStatus;
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
    entityType: "Equipment",
    entityId,
    details: { event: "unauthorized dispatch access", reason },
    metadata: { source: "equipment-service" },
  });
}

async function getAuthorizedEquipmentRecord(sessionUser: SessionUserLike | null | undefined, equipmentId: string) {
  const equipment = await prisma.equipment.findUnique({ where: { id: equipmentId } });
  if (!equipment) {
    return { equipment: null, allowed: false, reason: "NOT_FOUND" as const };
  }

  const access = await authorizedFleetAccess(sessionUser, equipment.fleetId);
  if (!access.allowed) {
    return { equipment, allowed: false, reason: access.reason ?? "TENANT_ACCESS_DENIED" };
  }

  return { equipment, allowed: true, reason: undefined as string | undefined };
}

export async function getEquipmentById(sessionUser: SessionUserLike | null | undefined, equipmentId: string) {
  requireSessionUser(sessionUser);

  const { equipment, allowed, reason } = await getAuthorizedEquipmentRecord(sessionUser, equipmentId);
  if (!equipment) {
    throw Object.assign(new Error("Equipment not found"), { statusCode: 404 });
  }
  if (!allowed) {
    await logUnauthorizedDispatchAccess(sessionUser, equipment.fleetId, equipment.id, reason ?? "TENANT_ACCESS_DENIED");
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  return equipment;
}

export async function listEquipmentForFleet(sessionUser: SessionUserLike | null | undefined, fleetId: string) {
  requireSessionUser(sessionUser);

  const access = await authorizedFleetAccess(sessionUser, fleetId);
  if (!access.allowed) {
    await logUnauthorizedDispatchAccess(sessionUser, fleetId, null, access.reason ?? "TENANT_ACCESS_DENIED");
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  return prisma.equipment.findMany({
    where: { fleetId },
    orderBy: [{ equipmentType: "asc" }, { unitNumber: "asc" }],
  });
}

export async function setEquipmentStatus(
  sessionUser: SessionUserLike | null | undefined,
  equipmentId: string,
  status: EquipmentStatus,
) {
  requireSessionUser(sessionUser);

  const { equipment, allowed, reason } = await getAuthorizedEquipmentRecord(sessionUser, equipmentId);
  if (!equipment) {
    throw Object.assign(new Error("Equipment not found"), { statusCode: 404 });
  }
  if (!allowed) {
    await logUnauthorizedDispatchAccess(sessionUser, equipment.fleetId, equipment.id, reason ?? "TENANT_ACCESS_DENIED");
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  return prisma.equipment.update({
    where: { id: equipment.id },
    data: { status: ensureValidEquipmentStatus(status) },
  });
}
