import assert from "node:assert/strict";
import test, { after } from "node:test";

import { prisma } from "@/lib/prisma";
import {
  issuePickupAuthorization,
  verifyPickupAuthorization,
} from "@/lib/services/pickupAuthorizationService";
import { assertTestDatabaseTarget } from "@/lib/test/assertTestDatabaseTarget";
import {
  cleanupSecurePickupCertFixtures,
  createSecurePickupChain,
  emptySecurePickupCertIds,
  pickupHttpError,
  requireCertOperator,
} from "@/lib/test/securePickupCertFixtures";

function requireIsolatedTestDatabase() {
  assertTestDatabaseTarget(process.env.DATABASE_URL);
}

test("cert 1: successful authorization reaches RELEASED", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const ids = emptySecurePickupCertIds();
  try {
    const chain = await createSecurePickupChain(fleet.id, admin.id as string, ids);
    const issued = await issuePickupAuthorization(admin, chain.load.id);
    ids.authorizationIds.push(issued.authorization.id);
    assert.equal(issued.authorization.status, "PENDING");

    const released = await verifyPickupAuthorization(admin, issued.authorization.id, {
      token: issued.credential.token,
      presented: {
        authorizationId: issued.authorization.id,
        loadId: chain.load.id,
        driverId: chain.driver.id,
        tractorEquipmentId: chain.tractor.id,
        trailerEquipmentId: chain.trailer.id,
      },
    });
    assert.equal(released.authorization.status, "RELEASED");
    assert.ok(released.authorization.releasedAt);
    assert.equal(released.attempt.result, "RELEASED");
    assert.equal(released.authorization.physicalIdentityClass, "UNVERIFIED");
    assert.notEqual(released.authorization.status, "STOPPED");
  } finally {
    await cleanupSecurePickupCertFixtures(ids);
  }
});

test("cert 2: identity mismatch STOPPED / 409", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const ids = emptySecurePickupCertIds();
  try {
    const chain = await createSecurePickupChain(fleet.id, admin.id as string, ids);
    const other = await createSecurePickupChain(fleet.id, admin.id as string, ids);
    const issued = await issuePickupAuthorization(admin, chain.load.id);
    ids.authorizationIds.push(issued.authorization.id);

    await assert.rejects(
      () =>
        verifyPickupAuthorization(admin, issued.authorization.id, {
          token: issued.credential.token,
          presented: {
            authorizationId: issued.authorization.id,
            loadId: chain.load.id,
            driverId: other.driver.id,
            tractorEquipmentId: chain.tractor.id,
            trailerEquipmentId: chain.trailer.id,
          },
        }),
      (caught: unknown) => {
        const http = pickupHttpError(caught);
        return (
          http.statusCode === 409 &&
          String(http.message).includes("WRONG_DRIVER") &&
          http.payload?.authorization?.status === "STOPPED" &&
          http.payload?.attempt?.result === "STOPPED"
        );
      },
    );

    const current = await prisma.pickupAuthorization.findUniqueOrThrow({
      where: { id: issued.authorization.id },
    });
    assert.equal(current.status, "STOPPED");
    const attempts = await prisma.pickupVerificationAttempt.findMany({
      where: { pickupAuthorizationId: issued.authorization.id },
    });
    assert.ok(attempts.some((attempt) => attempt.result === "STOPPED"));
  } finally {
    await cleanupSecurePickupCertFixtures(ids);
  }
});

test("cert 3: wrong token TOKEN_INVALID / 409", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const ids = emptySecurePickupCertIds();
  try {
    const chain = await createSecurePickupChain(fleet.id, admin.id as string, ids);
    const issued = await issuePickupAuthorization(admin, chain.load.id);
    ids.authorizationIds.push(issued.authorization.id);

    await assert.rejects(
      () =>
        verifyPickupAuthorization(admin, issued.authorization.id, {
          token: `${issued.credential.token}-tampered`,
        }),
      (caught: unknown) => {
        const http = pickupHttpError(caught);
        const codes = http.payload?.attempt?.reasonCodes;
        return (
          http.statusCode === 409 &&
          Array.isArray(codes) &&
          codes.includes("TOKEN_INVALID") &&
          http.payload?.authorization?.status === "PENDING" &&
          http.payload?.attempt?.result === "REJECTED" &&
          http.payload?.attempt?.presentedTokenValid === false
        );
      },
    );

    const current = await prisma.pickupAuthorization.findUniqueOrThrow({
      where: { id: issued.authorization.id },
    });
    assert.equal(current.status, "PENDING");
  } finally {
    await cleanupSecurePickupCertFixtures(ids);
  }
});

test("cert 4: assignment drift ASSIGNMENT_DRIFT / 409", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const ids = emptySecurePickupCertIds();
  try {
    const chain = await createSecurePickupChain(fleet.id, admin.id as string, ids);
    const spareDriver = await prisma.driver.create({
      data: {
        fleetId: fleet.id,
        firstName: "Drift",
        lastName: "Spare",
        email: `sp-cert-drift-${Date.now().toString(36)}@dev.local`,
        status: "ACTIVE",
      },
    });
    ids.driverIds.push(spareDriver.id);
    const issued = await issuePickupAuthorization(admin, chain.load.id);
    ids.authorizationIds.push(issued.authorization.id);

    await prisma.dispatchAssignment.update({
      where: { id: chain.assignment.id },
      data: { driverId: spareDriver.id },
    });

    await assert.rejects(
      () =>
        verifyPickupAuthorization(admin, issued.authorization.id, {
          token: issued.credential.token,
        }),
      (caught: unknown) => {
        const http = pickupHttpError(caught);
        const codes = http.payload?.attempt?.reasonCodes;
        return (
          http.statusCode === 409 &&
          Array.isArray(codes) &&
          codes.includes("ASSIGNMENT_DRIFT") &&
          http.payload?.authorization?.status === "STOPPED" &&
          http.payload?.attempt?.result === "STOPPED"
        );
      },
    );

    const current = await prisma.pickupAuthorization.findUniqueOrThrow({
      where: { id: issued.authorization.id },
    });
    assert.equal(current.status, "STOPPED");
  } finally {
    await cleanupSecurePickupCertFixtures(ids);
  }
});

test("cert 5: no trip release blocks issue with 409 and creates no authorization", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const ids = emptySecurePickupCertIds();
  try {
    const chain = await createSecurePickupChain(fleet.id, admin.id as string, ids, { trip: false });
    await assert.rejects(
      () => issuePickupAuthorization(admin, chain.load.id),
      (caught: unknown) => {
        const http = pickupHttpError(caught);
        return (
          http.statusCode === 409 &&
          String(http.message).includes("PICKUP AUTHORIZATION BLOCKED") &&
          String(http.message).includes("NO TRIP RELEASE")
        );
      },
    );
    const created = await prisma.pickupAuthorization.findMany({ where: { loadId: chain.load.id } });
    assert.equal(created.length, 0);
  } finally {
    await cleanupSecurePickupCertFixtures(ids);
  }
});

after(async () => {
  await prisma.$disconnect().catch(() => undefined);
});
