import { createAuditRecord } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { authorizedFleetAccess, type SessionUserLike } from "@/lib/services/intakeService";

function requireSessionUser(sessionUser: SessionUserLike | null | undefined) {
  if (!sessionUser?.id) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
}

function requireDriverId(driverId: string) {
  const normalized = driverId?.trim();
  if (!normalized || !/^[A-Za-z0-9_-]+$/.test(normalized)) {
    throw Object.assign(new Error("Invalid driver identifier"), { statusCode: 422 });
  }

  return normalized;
}

async function logUnauthorizedDriverAccess(
  sessionUser: SessionUserLike | null | undefined,
  fleetId: string,
  driverId: string,
  reason: string,
) {
  await createAuditRecord({
    actorId: sessionUser?.id ?? null,
    actorEmail: sessionUser?.email ?? null,
    tenantId: fleetId,
    action: "ACCESS_DENIED",
    entityType: "Driver",
    entityId: driverId,
    details: { event: "unauthorized driver access", reason },
    metadata: { source: "driver-service" },
  });
}

export async function getDriverByIdForSession(
  sessionUser: SessionUserLike | null | undefined,
  driverId: string,
) {
  requireSessionUser(sessionUser);

  const normalizedDriverId = requireDriverId(driverId);
  const driver = await prisma.driver.findUnique({
    where: { id: normalizedDriverId },
    select: {
      id: true,
      fleetId: true,
      firstName: true,
      lastName: true,
      email: true,
      status: true,
      updatedAt: true,
    },
  });

  if (!driver) {
    throw Object.assign(new Error("Driver not found"), { statusCode: 404 });
  }

  const access = await authorizedFleetAccess(sessionUser, driver.fleetId);
  if (!access.allowed) {
    await logUnauthorizedDriverAccess(sessionUser, driver.fleetId, driver.id, access.reason ?? "TENANT_ACCESS_DENIED");
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }

  return driver;
}
