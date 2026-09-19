import { prisma } from "@/lib/prisma";
import type { SessionUserLike } from "@/lib/services/intakeService";

export type SecurePickupCertIds = {
  loadIds: string[];
  driverIds: string[];
  equipmentIds: string[];
  assignmentIds: string[];
  readinessIds: string[];
  releaseIds: string[];
  authorizationIds: string[];
};

export function emptySecurePickupCertIds(): SecurePickupCertIds {
  return {
    loadIds: [],
    driverIds: [],
    equipmentIds: [],
    assignmentIds: [],
    readinessIds: [],
    releaseIds: [],
    authorizationIds: [],
  };
}

export function asSessionUser(row: {
  id: string;
  email: string | null;
  memberships: Array<{ fleetId: string; role: { code: string }; status: string }>;
}): SessionUserLike {
  return {
    id: row.id,
    email: row.email,
    memberships: row.memberships.map((membership) => ({
      fleetId: membership.fleetId,
      roleCode: membership.role.code,
      status: membership.status,
    })),
  };
}

export async function requireCertOperator() {
  const fleet = await prisma.fleet.findUnique({ where: { slug: "fleet-a" } });
  if (!fleet) {
    throw new Error("BOF_DEV_FOUNDATION_REQUIRED: fleet-a missing from isolated bof_dev");
  }
  const admin = await prisma.user.findFirst({
    where: { email: "fleet-a-admin@dev.local" },
    include: { memberships: { include: { role: true } } },
  });
  if (!admin) {
    throw new Error("BOF_DEV_FOUNDATION_REQUIRED: fleet-a-admin@dev.local missing from isolated bof_dev");
  }
  return { fleet, admin: asSessionUser(admin) };
}

export async function cleanupSecurePickupCertFixtures(ids: SecurePickupCertIds) {
  await prisma.pickupVerificationAttempt.deleteMany({
    where: { pickupAuthorizationId: { in: ids.authorizationIds } },
  });
  await prisma.operatingProcessEvent.deleteMany({
    where: {
      OR: [
        { entityId: { in: ids.authorizationIds } },
        { relatedRecordId: { in: ids.authorizationIds } },
        { loadId: { in: ids.loadIds } },
      ],
    },
  });
  await prisma.auditEvent.deleteMany({
    where: { entityType: "PickupAuthorization", entityId: { in: ids.authorizationIds } },
  });
  await prisma.pickupAuthorization.deleteMany({ where: { id: { in: ids.authorizationIds } } });
  await prisma.dispatchRelease.deleteMany({ where: { id: { in: ids.releaseIds } } });
  await prisma.dispatchAssignment.deleteMany({ where: { id: { in: ids.assignmentIds } } });
  await prisma.driverReadinessScore.deleteMany({ where: { id: { in: ids.readinessIds } } });
  await prisma.load.deleteMany({ where: { id: { in: ids.loadIds } } });
  await prisma.equipment.deleteMany({ where: { id: { in: ids.equipmentIds } } });
  await prisma.driver.deleteMany({ where: { id: { in: ids.driverIds } } });
}

export async function createSecurePickupChain(
  fleetId: string,
  actorUserId: string,
  ids: SecurePickupCertIds,
  options?: { trip?: boolean },
) {
  const stamp = `${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 8)}`;
  const driver = await prisma.driver.create({
    data: {
      fleetId,
      firstName: "Cert",
      lastName: stamp,
      email: `sp-cert-${stamp}@dev.local`,
      status: "ACTIVE",
    },
  });
  const tractor = await prisma.equipment.create({
    data: {
      fleetId,
      equipmentType: "TRACTOR",
      unitNumber: `SP-TR-${stamp}`,
      status: "AVAILABLE",
    },
  });
  const trailer = await prisma.equipment.create({
    data: {
      fleetId,
      equipmentType: "TRAILER",
      unitNumber: `SP-TL-${stamp}`,
      status: "AVAILABLE",
    },
  });
  const load = await prisma.load.create({
    data: {
      fleetId,
      customerName: "Secure Pickup Cert Shipper",
      origin: "Atlanta, GA",
      destination: "Dallas, TX",
      status: "ASSIGNED",
      pickupWindowStart: new Date(Date.now() + 60 * 60 * 1000),
      pickupWindowEnd: new Date(Date.now() + 8 * 60 * 60 * 1000),
    },
  });
  const assignment = await prisma.dispatchAssignment.create({
    data: {
      fleetId,
      loadId: load.id,
      driverId: driver.id,
      tractorEquipmentId: tractor.id,
      trailerEquipmentId: trailer.id,
      status: "ACTIVE",
      assignedByUserId: actorUserId,
    },
  });
  const readiness = await prisma.driverReadinessScore.create({
    data: {
      driverId: driver.id,
      fleetId,
      status: "READY",
      policyVersion: "secure-pickup-cert",
      summary: "cert readiness",
      score: 90,
    },
  });
  ids.driverIds.push(driver.id);
  ids.equipmentIds.push(tractor.id, trailer.id);
  ids.loadIds.push(load.id);
  ids.assignmentIds.push(assignment.id);
  ids.readinessIds.push(readiness.id);

  let releaseId: string | null = null;
  if (options?.trip !== false) {
    const release = await prisma.dispatchRelease.create({
      data: {
        fleetId,
        loadId: load.id,
        assignmentId: assignment.id,
        driverId: driver.id,
        tractorEquipmentId: tractor.id,
        trailerEquipmentId: trailer.id,
        driverReadinessScoreId: readiness.id,
        disposition: "RELEASED",
        reasonCodes: [],
        summary: "Trip released for isolated Secure Pickup certification",
        policyVersion: "secure-pickup-cert",
        evaluatedByUserId: actorUserId,
      },
    });
    releaseId = release.id;
    ids.releaseIds.push(release.id);
  }

  return { driver, tractor, trailer, load, assignment, readinessId: readiness.id, releaseId };
}

export function pickupHttpError(error: unknown): {
  statusCode?: number;
  message?: string;
  payload?: {
    authorization?: { id?: string; status?: string };
    attempt?: { result?: string; reasonCodes?: unknown; presentedTokenValid?: boolean };
  };
} {
  return error as {
    statusCode?: number;
    message?: string;
    payload?: {
      authorization?: { id?: string; status?: string };
      attempt?: { result?: string; reasonCodes?: unknown; presentedTokenValid?: boolean };
    };
  };
}
