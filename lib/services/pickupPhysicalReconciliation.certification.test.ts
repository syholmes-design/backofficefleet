import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "@/lib/prisma";
import { issuePickupAuthorization } from "@/lib/services/pickupAuthorizationService";
import { getPickupDockView, reconcilePickupPhysicalArrival } from "@/lib/services/pickupPhysicalReconciliationService";
import { assertTestDatabaseTarget } from "@/lib/test/assertTestDatabaseTarget";
import {
  asSessionUser,
  cleanupSecurePickupCertFixtures,
  createSecurePickupChain,
  emptySecurePickupCertIds,
  pickupHttpError,
  requireCertOperator,
} from "@/lib/test/securePickupCertFixtures";

function requireIsolatedTestDatabase() {
  assertTestDatabaseTarget(process.env.DATABASE_URL);
}

async function issueReadyAuth() {
  const { fleet, admin } = await requireCertOperator();
  const ids = emptySecurePickupCertIds();
  const chain = await createSecurePickupChain(fleet.id, admin.id as string, ids, { tractorVin: "1XPBDP9X0KD999999" });
  const issued = await issuePickupAuthorization(admin, chain.load.id);
  ids.authorizationIds.push(issued.authorization.id);
  return { fleet, admin, ids, chain, issued };
}

test("phase 2 correct driver and equipment RELEASE without claiming physical identity", async () => {
  requireIsolatedTestDatabase();
  const { admin, ids, chain, issued } = await issueReadyAuth();
  try {
    const result = await reconcilePickupPhysicalArrival(admin, issued.authorization.id, {
      token: issued.credential.token,
      method: "SHIPPER_DOCK",
      arriving: {
        authorizationId: issued.authorization.id,
        loadId: chain.load.id,
        driverId: chain.driver.id,
        tractorId: chain.tractor.id,
        trailerId: chain.trailer.id,
        tractorUnitNumber: chain.tractor.unitNumber,
        trailerUnitNumber: chain.trailer.unitNumber,
        vin: "1XPBDP9X0KD999999",
        qr: chain.tractor.unitNumber,
      },
      evidenceReference: "dock-log-ref-1",
      intendedDisposition: "RELEASE",
    });
    assert.equal(result.physical.disposition, "RELEASE");
    assert.equal(result.physical.dimensions.driver, "MATCH");
    assert.equal(result.physical.dimensions.tractor, "MATCH");
    assert.equal(result.physical.dimensions.trailer, "MATCH");
    assert.equal(result.physical.identityClass, "IDENTITY_MATCHED_TO_AUTHORIZED_RECORD");
    assert.equal(result.physical.identityPhysicalClass, "UNVERIFIED");
    assert.equal(result.physical.identityPhysicallyVerified, false);
    assert.equal(result.physical.evidenceReference, "dock-log-ref-1");
    assert.equal(result.authorization.physicalIdentityClass, "UNVERIFIED");
    const audit = await prisma.auditEvent.findFirst({
      where: { entityType: "PickupPhysicalReconciliation", entityId: result.physical.id },
    });
    assert.ok(audit);
    const details = audit?.details as { identityPhysicalClass?: string; evidenceReference?: string };
    assert.equal(details.identityPhysicalClass, "UNVERIFIED");
    assert.equal(details.evidenceReference, "dock-log-ref-1");
  } finally {
    await cleanupSecurePickupCertFixtures(ids);
  }
});

test("phase 2 UNVERIFIED driver and equipment can RELEASE when no mismatch", async () => {
  requireIsolatedTestDatabase();
  const { admin, ids, issued } = await issueReadyAuth();
  try {
    const result = await reconcilePickupPhysicalArrival(admin, issued.authorization.id, {
      token: issued.credential.token,
      arriving: { authorizationId: issued.authorization.id },
      intendedDisposition: "RELEASE",
    });
    assert.equal(result.physical.disposition, "RELEASE");
    assert.equal(result.physical.dimensions.driver, "UNVERIFIED");
    assert.equal(result.physical.dimensions.tractor, "UNVERIFIED");
    assert.equal(result.physical.identityClass, "UNVERIFIED");
    assert.equal(result.physical.identityPhysicalClass, "UNVERIFIED");
  } finally {
    await cleanupSecurePickupCertFixtures(ids);
  }
});

test("phase 2 wrong driver STOP", async () => {
  requireIsolatedTestDatabase();
  const { admin, ids, issued } = await issueReadyAuth();
  try {
    await assert.rejects(
      () =>
        reconcilePickupPhysicalArrival(admin, issued.authorization.id, {
          token: issued.credential.token,
          arriving: { authorizationId: issued.authorization.id, driverId: "not-the-authorized-driver" },
        }),
      (caught: unknown) => {
        const http = pickupHttpError(caught);
        return http.statusCode === 409 && http.payload?.physical?.disposition === "STOP" && http.payload?.physical?.dimensions?.driver === "MISMATCH";
      },
    );
  } finally {
    await cleanupSecurePickupCertFixtures(ids);
  }
});

test("phase 2 wrong tractor STOP", async () => {
  requireIsolatedTestDatabase();
  const { admin, ids, issued } = await issueReadyAuth();
  try {
    await assert.rejects(
      () =>
        reconcilePickupPhysicalArrival(admin, issued.authorization.id, {
          token: issued.credential.token,
          arriving: { authorizationId: issued.authorization.id, tractorUnitNumber: "WRONG-TR" },
        }),
      (caught: unknown) => pickupHttpError(caught).payload?.physical?.dimensions?.tractor === "MISMATCH",
    );
  } finally {
    await cleanupSecurePickupCertFixtures(ids);
  }
});

test("phase 2 wrong trailer STOP", async () => {
  requireIsolatedTestDatabase();
  const { admin, ids, issued } = await issueReadyAuth();
  try {
    await assert.rejects(
      () =>
        reconcilePickupPhysicalArrival(admin, issued.authorization.id, {
          token: issued.credential.token,
          arriving: { authorizationId: issued.authorization.id, trailerUnitNumber: "WRONG-TL" },
        }),
      (caught: unknown) => pickupHttpError(caught).payload?.physical?.dimensions?.trailer === "MISMATCH",
    );
  } finally {
    await cleanupSecurePickupCertFixtures(ids);
  }
});

test("phase 2 wrong load STOP", async () => {
  requireIsolatedTestDatabase();
  const { admin, ids, issued } = await issueReadyAuth();
  try {
    await assert.rejects(
      () =>
        reconcilePickupPhysicalArrival(admin, issued.authorization.id, {
          token: issued.credential.token,
          arriving: { authorizationId: issued.authorization.id, loadId: "other-load" },
        }),
      (caught: unknown) => pickupHttpError(caught).payload?.physical?.dimensions?.load === "MISMATCH",
    );
  } finally {
    await cleanupSecurePickupCertFixtures(ids);
  }
});

test("phase 2 expired code STOP", async () => {
  requireIsolatedTestDatabase();
  const { admin, ids, issued } = await issueReadyAuth();
  try {
    await prisma.pickupAuthorization.update({
      where: { id: issued.authorization.id },
      data: { expiresAt: new Date(Date.now() - 60_000) },
    });
    await assert.rejects(
      () =>
        reconcilePickupPhysicalArrival(admin, issued.authorization.id, {
          token: issued.credential.token,
          arriving: { authorizationId: issued.authorization.id },
        }),
      (caught: unknown) => {
        const http = pickupHttpError(caught);
        return http.statusCode === 409 && http.payload?.physical?.dimensions?.authorization === "EXPIRED";
      },
    );
  } finally {
    await cleanupSecurePickupCertFixtures(ids);
  }
});

test("phase 2 reused code STOP", async () => {
  requireIsolatedTestDatabase();
  const { admin, ids, issued } = await issueReadyAuth();
  try {
    await reconcilePickupPhysicalArrival(admin, issued.authorization.id, {
      token: issued.credential.token,
      arriving: { authorizationId: issued.authorization.id },
    });
    await assert.rejects(
      () =>
        reconcilePickupPhysicalArrival(admin, issued.authorization.id, {
          token: issued.credential.token,
          arriving: { authorizationId: issued.authorization.id },
        }),
      (caught: unknown) => {
        const codes = pickupHttpError(caught).payload?.attempt?.reasonCodes;
        return Array.isArray(codes) && codes.includes("REUSED");
      },
    );
  } finally {
    await cleanupSecurePickupCertFixtures(ids);
  }
});

test("phase 2 unauthorized shipper role 403", async () => {
  requireIsolatedTestDatabase();
  const { fleet, ids, issued } = await issueReadyAuth();
  try {
    const driverRole = await prisma.role.findUniqueOrThrow({ where: { code: "DRIVER" } });
    const user = await prisma.user.create({
      data: {
        email: `sp-dock-driver-${Date.now()}@dev.local`,
        status: "ACTIVE",
        memberships: { create: { fleetId: fleet.id, roleId: driverRole.id, status: "ACTIVE" } },
      },
      include: { memberships: { include: { role: true } } },
    });
    ids.userIds.push(user.id);
    await assert.rejects(
      () =>
        reconcilePickupPhysicalArrival(asSessionUser(user), issued.authorization.id, {
          token: issued.credential.token,
        }),
      (caught: unknown) => pickupHttpError(caught).statusCode === 403,
    );
    await assert.rejects(() => getPickupDockView(asSessionUser(user), issued.authorization.id), (caught: unknown) => pickupHttpError(caught).statusCode === 403);
  } finally {
    await cleanupSecurePickupCertFixtures(ids);
  }
});

test("phase 2 unauthorized fleet 403", async () => {
  requireIsolatedTestDatabase();
  const { ids, issued } = await issueReadyAuth();
  try {
    const fleetB = await prisma.fleet.findUnique({ where: { slug: "fleet-b" } });
    assert.ok(fleetB, "BOF_DEV_FOUNDATION_REQUIRED: fleet-b missing from isolated bof_dev");
    const adminRole = await prisma.role.findUniqueOrThrow({ where: { code: "FLEET_ADMIN" } });
    const otherAdmin = await prisma.user.create({
      data: {
        email: `sp-dock-fleet-b-${Date.now()}@dev.local`,
        status: "ACTIVE",
        memberships: { create: { fleetId: fleetB.id, roleId: adminRole.id, status: "ACTIVE" } },
      },
      include: { memberships: { include: { role: true } } },
    });
    ids.userIds.push(otherAdmin.id);
    await assert.rejects(
      () =>
        reconcilePickupPhysicalArrival(asSessionUser(otherAdmin), issued.authorization.id, {
          token: issued.credential.token,
        }),
      (caught: unknown) => pickupHttpError(caught).statusCode === 403,
    );
  } finally {
    await cleanupSecurePickupCertFixtures(ids);
  }
});

test("phase 2 explicit STOP records reason and evidence", async () => {
  requireIsolatedTestDatabase();
  const { admin, ids, issued } = await issueReadyAuth();
  try {
    await assert.rejects(
      () =>
        reconcilePickupPhysicalArrival(admin, issued.authorization.id, {
          token: issued.credential.token,
          intendedDisposition: "STOP",
          stopReason: "Dock observed seal mismatch",
          evidenceReference: "photo-ref-not-a-provider",
          arriving: { authorizationId: issued.authorization.id },
        }),
      (caught: unknown) => {
        const http = pickupHttpError(caught);
        return (
          http.statusCode === 409 &&
          http.payload?.physical?.disposition === "STOP" &&
          http.payload?.physical?.evidenceReference === "photo-ref-not-a-provider" &&
          String(http.message).includes("Dock observed seal mismatch")
        );
      },
    );
  } finally {
    await cleanupSecurePickupCertFixtures(ids);
  }
});

test("phase 2 identity provider method stays 501 and UNVERIFIED", async () => {
  requireIsolatedTestDatabase();
  const { admin, ids, issued } = await issueReadyAuth();
  try {
    await assert.rejects(
      () =>
        reconcilePickupPhysicalArrival(admin, issued.authorization.id, {
          token: issued.credential.token,
          method: "IDENTITY_PROVIDER",
        }),
      (caught: unknown) => pickupHttpError(caught).statusCode === 501,
    );
  } finally {
    await cleanupSecurePickupCertFixtures(ids);
  }
});
