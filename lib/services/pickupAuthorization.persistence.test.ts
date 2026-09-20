import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "@/lib/prisma";
import { assertTestDatabaseTarget } from "@/lib/test/assertTestDatabaseTarget";
import {
  cancelPickupAuthorization,
  getPickupAuthorization,
  issuePickupAuthorization,
  verifyPickupAuthorization,
} from "@/lib/services/pickupAuthorizationService";
import type { SessionUserLike } from "@/lib/services/intakeService";

function asUser(row: {
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

async function cleanup(ids: {
  loadIds: string[];
  driverIds: string[];
  equipmentIds: string[];
  assignmentIds: string[];
  readinessIds: string[];
  releaseIds: string[];
  authorizationIds: string[];
}) {
  await prisma.pickupPhysicalReconciliation.deleteMany({ where: { pickupAuthorizationId: { in: ids.authorizationIds } } });
  await prisma.pickupVerificationAttempt.deleteMany({ where: { pickupAuthorizationId: { in: ids.authorizationIds } } });
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

test("local persistence: pickup authorization issue, release, stop, expiry, reuse, tenant, and audit", async () => {
  assertTestDatabaseTarget(process.env.DATABASE_URL);
  const fleetA = await prisma.fleet.findFirst({ where: { name: "Fleet A" } });
  const fleetB = await prisma.fleet.findFirst({ where: { name: "Fleet B" } });
  assert.ok(fleetA && fleetB);
  const fleetAId = fleetA.id;
  const adminA = asUser(
    await prisma.user.findFirstOrThrow({
      where: { email: "fleet-a-admin@dev.local" },
      include: { memberships: { include: { role: true } } },
    }),
  );
  const adminB = asUser(
    await prisma.user.findFirstOrThrow({
      where: { email: "fleet-b-admin@dev.local" },
      include: { memberships: { include: { role: true } } },
    }),
  );

  const stamp = Date.now().toString(36);
  const ids = {
    loadIds: [] as string[],
    driverIds: [] as string[],
    equipmentIds: [] as string[],
    assignmentIds: [] as string[],
    readinessIds: [] as string[],
    releaseIds: [] as string[],
    authorizationIds: [] as string[],
  };

  async function createChain(options?: { readiness?: "READY" | "NOT_READY" | "NONE"; trip?: boolean; trailer?: boolean }) {
    const driver = await prisma.driver.create({
      data: {
        fleetId: fleetAId,
        firstName: "Pickup",
        lastName: stamp,
        email: `pickup-${stamp}-${Math.random().toString(16).slice(2)}@dev.local`,
        status: "ACTIVE",
      },
    });
    const tractor = await prisma.equipment.create({
      data: {
        fleetId: fleetAId,
        equipmentType: "TRACTOR",
        unitNumber: `PU-TR-${stamp}-${Math.random().toString(16).slice(2, 6)}`,
        status: "AVAILABLE",
      },
    });
    const trailer =
      options?.trailer === false
        ? null
        : await prisma.equipment.create({
            data: {
              fleetId: fleetAId,
              equipmentType: "TRAILER",
              unitNumber: `PU-TL-${stamp}-${Math.random().toString(16).slice(2, 6)}`,
              status: "AVAILABLE",
            },
          });
    const load = await prisma.load.create({
      data: {
        fleetId: fleetAId,
        customerName: "Pickup Test Shipper",
        origin: "Atlanta, GA",
        destination: "Dallas, TX",
        status: "ASSIGNED",
        pickupWindowStart: new Date(Date.now() + 60 * 60 * 1000),
        pickupWindowEnd: new Date(Date.now() + 8 * 60 * 60 * 1000),
      },
    });
    const assignment = await prisma.dispatchAssignment.create({
      data: {
        fleetId: fleetAId,
        loadId: load.id,
        driverId: driver.id,
        tractorEquipmentId: tractor.id,
        trailerEquipmentId: trailer?.id ?? null,
        status: "ACTIVE",
        assignedByUserId: adminA.id,
      },
    });
    let readinessId: string | null = null;
    if (options?.readiness !== "NONE") {
      const readiness = await prisma.driverReadinessScore.create({
        data: {
          driverId: driver.id,
          fleetId: fleetAId,
          status: options?.readiness ?? "READY",
          policyVersion: "test",
          summary: "test readiness",
          score: 90,
        },
      });
      readinessId = readiness.id;
      ids.readinessIds.push(readiness.id);
    }
    let releaseId: string | null = null;
    if (options?.trip !== false && readinessId) {
      const release = await prisma.dispatchRelease.create({
        data: {
          fleetId: fleetAId,
          loadId: load.id,
          assignmentId: assignment.id,
          driverId: driver.id,
          tractorEquipmentId: tractor.id,
          trailerEquipmentId: trailer?.id ?? null,
          driverReadinessScoreId: readinessId,
          disposition: "RELEASED",
          reasonCodes: [],
          summary: "Trip released for pickup test",
          policyVersion: "test",
          evaluatedByUserId: adminA.id,
        },
      });
      releaseId = release.id;
      ids.releaseIds.push(release.id);
    }
    ids.driverIds.push(driver.id);
    ids.equipmentIds.push(tractor.id);
    if (trailer) ids.equipmentIds.push(trailer.id);
    ids.loadIds.push(load.id);
    ids.assignmentIds.push(assignment.id);
    return { driver, tractor, trailer, load, assignment, readinessId, releaseId };
  }

  try {
    await assert.rejects(() => issuePickupAuthorization(null, "missing"), (error: { statusCode?: number }) => error.statusCode === 401);

    const noAssignmentLoad = await prisma.load.create({
      data: {
        fleetId: fleetAId,
        customerName: "No Assignment",
        origin: "A",
        destination: "B",
        status: "PLANNED",
      },
    });
    ids.loadIds.push(noAssignmentLoad.id);
    await assert.rejects(
      () => issuePickupAuthorization(adminA, noAssignmentLoad.id),
      (error: { statusCode?: number; message?: string }) =>
        error.statusCode === 409 && String(error.message).includes("NO ACTIVE ASSIGNMENT"),
    );

    const noReady = await createChain({ readiness: "NONE", trip: false });
    await assert.rejects(
      () => issuePickupAuthorization(adminA, noReady.load.id),
      (error: { statusCode?: number; message?: string }) =>
        error.statusCode === 409 && String(error.message).includes("NO CURRENT DRIVER READINESS"),
    );

    const notReady = await createChain({ readiness: "NOT_READY", trip: false });
    await assert.rejects(
      () => issuePickupAuthorization(adminA, notReady.load.id),
      (error: { statusCode?: number; message?: string }) =>
        error.statusCode === 409 && String(error.message).includes("DRIVER NOT READY"),
    );

    const noTrip = await createChain({ trip: false });
    await assert.rejects(
      () => issuePickupAuthorization(adminA, noTrip.load.id),
      (error: { statusCode?: number; message?: string }) =>
        error.statusCode === 409 && String(error.message).includes("NO TRIP RELEASE"),
    );

    const valid = await createChain();
    await assert.rejects(() => issuePickupAuthorization(adminB, valid.load.id), (error: { statusCode?: number }) => error.statusCode === 403);

    const issued = await issuePickupAuthorization(adminA, valid.load.id);
    ids.authorizationIds.push(issued.authorization.id);
    assert.equal(issued.authorization.status, "PENDING");
    assert.equal(issued.authorization.loadId, valid.load.id);
    assert.equal(issued.authorization.driverId, valid.driver.id);
    assert.equal(issued.authorization.tractorEquipmentId, valid.tractor.id);
    assert.equal(issued.authorization.trailerEquipmentId, valid.trailer?.id ?? null);
    assert.equal(issued.authorization.assignmentId, valid.assignment.id);
    assert.ok(issued.credential.token.length >= 32);
    assert.notEqual(issued.credential.token, issued.authorization.id);
    assert.equal("tokenHash" in issued.authorization, false);

    const authorized = await verifyPickupAuthorization(adminA, issued.authorization.id, { token: issued.credential.token });
    assert.equal(authorized.authorization.status, "AUTHORIZED");

    const released = await verifyPickupAuthorization(adminA, issued.authorization.id, {
      token: issued.credential.token,
      presented: {
        authorizationId: issued.authorization.id,
        loadId: valid.load.id,
        driverId: valid.driver.id,
        tractorEquipmentId: valid.tractor.id,
        trailerEquipmentId: valid.trailer?.id ?? null,
      },
    });
    assert.equal(released.authorization.status, "RELEASED");
    assert.ok(released.authorization.releasedAt);
    assert.equal(released.authorization.physicalIdentityClass, "UNVERIFIED");
    assert.equal(released.attempt.physicalVerificationPerformed, false);

    await assert.rejects(
      () =>
        verifyPickupAuthorization(adminA, issued.authorization.id, {
          token: issued.credential.token,
          presented: {
            authorizationId: issued.authorization.id,
            loadId: valid.load.id,
            driverId: valid.driver.id,
            tractorEquipmentId: valid.tractor.id,
            trailerEquipmentId: valid.trailer?.id ?? null,
          },
        }),
      (error: { statusCode?: number; message?: string }) => error.statusCode === 409 && String(error.message).includes("already RELEASED"),
    );

    const detail = await getPickupAuthorization(adminA, issued.authorization.id);
    assert.ok(detail.attempts.length >= 2);
    const events = await prisma.operatingProcessEvent.findMany({
      where: { loadId: valid.load.id, eventType: { in: ["PICKUP_AUTHORIZATION_CREATED", "PICKUP_RELEASED", "PICKUP_VERIFICATION_RECORDED"] } },
    });
    assert.ok(events.length >= 2);
    const audits = await prisma.auditEvent.findMany({ where: { entityType: "PickupAuthorization", entityId: issued.authorization.id } });
    assert.ok(audits.length >= 2);

    const wrongDriverChain = await createChain();
    const wrongDriverIssued = await issuePickupAuthorization(adminA, wrongDriverChain.load.id);
    ids.authorizationIds.push(wrongDriverIssued.authorization.id);
    await assert.rejects(
      () =>
        verifyPickupAuthorization(adminA, wrongDriverIssued.authorization.id, {
          token: wrongDriverIssued.credential.token,
          presented: {
            authorizationId: wrongDriverIssued.authorization.id,
            loadId: wrongDriverChain.load.id,
            driverId: valid.driver.id,
            tractorEquipmentId: wrongDriverChain.tractor.id,
            trailerEquipmentId: wrongDriverChain.trailer?.id ?? null,
          },
        }),
      (error: { statusCode?: number; payload?: { authorization?: { status?: string } }; message?: string }) =>
        error.statusCode === 409 &&
        String(error.message).includes("WRONG_DRIVER") &&
        error.payload?.authorization?.status === "STOPPED",
    );

    const wrongTractorChain = await createChain();
    const wrongTractorIssued = await issuePickupAuthorization(adminA, wrongTractorChain.load.id);
    ids.authorizationIds.push(wrongTractorIssued.authorization.id);
    await assert.rejects(
      () =>
        verifyPickupAuthorization(adminA, wrongTractorIssued.authorization.id, {
          token: wrongTractorIssued.credential.token,
          presented: {
            authorizationId: wrongTractorIssued.authorization.id,
            loadId: wrongTractorChain.load.id,
            driverId: wrongTractorChain.driver.id,
            tractorEquipmentId: valid.tractor.id,
            trailerEquipmentId: wrongTractorChain.trailer?.id ?? null,
          },
        }),
      (error: { statusCode?: number; message?: string }) => error.statusCode === 409 && String(error.message).includes("WRONG_TRACTOR"),
    );

    const wrongTrailerChain = await createChain();
    const wrongTrailerIssued = await issuePickupAuthorization(adminA, wrongTrailerChain.load.id);
    ids.authorizationIds.push(wrongTrailerIssued.authorization.id);
    await assert.rejects(
      () =>
        verifyPickupAuthorization(adminA, wrongTrailerIssued.authorization.id, {
          token: wrongTrailerIssued.credential.token,
          presented: {
            authorizationId: wrongTrailerIssued.authorization.id,
            loadId: wrongTrailerChain.load.id,
            driverId: wrongTrailerChain.driver.id,
            tractorEquipmentId: wrongTrailerChain.tractor.id,
            trailerEquipmentId: valid.trailer?.id ?? "missing-trailer",
          },
        }),
      (error: { statusCode?: number; message?: string }) => error.statusCode === 409 && String(error.message).includes("WRONG_TRAILER"),
    );

    const wrongLoadChain = await createChain();
    const wrongLoadIssued = await issuePickupAuthorization(adminA, wrongLoadChain.load.id);
    ids.authorizationIds.push(wrongLoadIssued.authorization.id);
    await assert.rejects(
      () =>
        verifyPickupAuthorization(adminA, wrongLoadIssued.authorization.id, {
          token: wrongLoadIssued.credential.token,
          presented: {
            authorizationId: wrongLoadIssued.authorization.id,
            loadId: valid.load.id,
            driverId: wrongLoadChain.driver.id,
            tractorEquipmentId: wrongLoadChain.tractor.id,
            trailerEquipmentId: wrongLoadChain.trailer?.id ?? null,
          },
        }),
      (error: { statusCode?: number; message?: string }) => error.statusCode === 409 && String(error.message).includes("WRONG_LOAD"),
    );

    const cancelChain = await createChain();
    const cancelIssued = await issuePickupAuthorization(adminA, cancelChain.load.id);
    ids.authorizationIds.push(cancelIssued.authorization.id);
    const cancelled = await cancelPickupAuthorization(adminA, cancelIssued.authorization.id, "desk cancelled");
    assert.equal(cancelled.authorization.status, "CANCELLED");
    await assert.rejects(
      () => verifyPickupAuthorization(adminA, cancelIssued.authorization.id, { token: cancelIssued.credential.token }),
      (error: { statusCode?: number; message?: string }) => error.statusCode === 409 && String(error.message).includes("CANCELLED"),
    );

    const expireChain = await createChain();
    const expireIssued = await issuePickupAuthorization(adminA, expireChain.load.id);
    ids.authorizationIds.push(expireIssued.authorization.id);
    await prisma.pickupAuthorization.update({
      where: { id: expireIssued.authorization.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    await assert.rejects(
      () => verifyPickupAuthorization(adminA, expireIssued.authorization.id, { token: expireIssued.credential.token }),
      (error: { statusCode?: number; message?: string }) => error.statusCode === 409 && String(error.message).includes("EXPIRED"),
    );

    await assert.rejects(
      () => getPickupAuthorization(adminB, issued.authorization.id),
      (error: { statusCode?: number }) => error.statusCode === 403,
    );
  } finally {
    await cleanup(ids);
  }
});
