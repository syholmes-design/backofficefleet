import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "@/lib/prisma";
import { getCarrierById } from "@/lib/carrier-registry";
import { FixtureFmcsaProvider } from "@/lib/services/fmcsa/fixtureProvider";
import { getLatestFmcsaVerification, verifyCarrierWithFmcsa } from "@/lib/services/fmcsa/fmcsaVerificationService";
import { UnavailableFmcsaProvider } from "@/lib/services/fmcsa/unavailableProvider";
import { issuePickupAuthorization } from "@/lib/services/pickupAuthorizationService";
import { evaluatePickupPhysicalArrival } from "@/lib/services/pickupPhysicalArrival";
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

async function cleanupFmcsa(fleetId: string, ids: string[]) {
  if (ids.length === 0) return;
  const exceptions = await prisma.operatingException.findMany({
    where: { fleetId, entityType: "FmcsaRegulatoryVerification", entityId: { in: ids } },
    select: { id: true },
  });
  const exceptionIds = exceptions.map((row) => row.id);
  await prisma.operatingProcessEvent.deleteMany({
    where: {
      fleetId,
      OR: [{ entityId: { in: ids } }, { exceptionId: { in: exceptionIds } }, { relatedRecordId: { in: [...ids, ...exceptionIds] } }],
    },
  });
  await prisma.operatingException.deleteMany({ where: { id: { in: exceptionIds } } });
  await prisma.auditEvent.deleteMany({
    where: { entityType: "FmcsaRegulatoryVerification", entityId: { in: ids } },
  });
  await prisma.fmcsaRegulatoryVerification.deleteMany({ where: { id: { in: ids } } });
}

test("fmcsa 1-4: USDOT VERIFIED match does not mutate BOF carrier and is not LIVE", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const ids: string[] = [];
  const before = getCarrierById("CAR-001")!;
  try {
    const result = await verifyCarrierWithFmcsa(admin, {
      fleetId: fleet.id,
      carrierRegistryId: "CAR-001",
      kind: "USDOT",
      value: "DOT-2481936",
      useCache: false,
      provider: new FixtureFmcsaProvider("match"),
    });
    ids.push(result.verification.id);
    assert.equal(result.verification.result, "VERIFIED");
    assert.equal(result.verification.provenance, "FIXTURE");
    assert.equal(result.verification.comparisonAuthority, "DEMO_REFERENCE");
    assert.equal(result.bof?.authorityClass, "DEMO_REFERENCE");
    assert.equal(result.verification.liveConnected, false);
    assert.equal(result.mutatedBofRecord, false);
    assert.equal(getCarrierById("CAR-001")?.legalName, before.legalName);
    const comparisons = result.verification.fieldComparisons as Array<{ field: string; result: string }>;
    assert.ok(comparisons.every((row) => row.result === "MATCH" || row.result === "UNAVAILABLE"));
    const audit = await prisma.auditEvent.findFirst({
      where: { entityType: "FmcsaRegulatoryVerification", entityId: result.verification.id },
    });
    assert.ok(audit);
    const details = audit?.details as { event?: string; live?: boolean; fixture?: boolean };
    assert.equal(details.event, "carrier.fmcsa_verification");
    assert.equal(details.live, false);
    assert.equal(details.fixture, true);
  } finally {
    await cleanupFmcsa(fleet.id, ids);
  }
});

test("fmcsa 5: valid MC/MX docket verification", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const ids: string[] = [];
  try {
    const result = await verifyCarrierWithFmcsa(admin, {
      fleetId: fleet.id,
      carrierRegistryId: "CAR-001",
      kind: "DOCKET",
      value: "MC-874201",
      useCache: false,
      provider: new FixtureFmcsaProvider("match"),
    });
    ids.push(result.verification.id);
    assert.equal(result.verification.queriedKind, "DOCKET");
    assert.equal(result.verification.queriedValue, "874201");
    assert.equal(result.verification.result, "VERIFIED");
  } finally {
    await cleanupFmcsa(fleet.id, ids);
  }
});

test("fmcsa 6: NOT_VERIFIED when provider finds no carrier", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const ids: string[] = [];
  try {
    const result = await verifyCarrierWithFmcsa(admin, {
      fleetId: fleet.id,
      carrierRegistryId: "CAR-001",
      kind: "USDOT",
      value: "0000001",
      useCache: false,
      provider: new FixtureFmcsaProvider("not_found"),
    });
    ids.push(result.verification.id);
    assert.equal(result.verification.result, "NOT_VERIFIED");
    assert.equal(result.verification.identifierFound, false);
  } finally {
    await cleanupFmcsa(fleet.id, ids);
  }
});

test("fmcsa 7: UNAVAILABLE provider is not VERIFIED", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const ids: string[] = [];
  try {
    const result = await verifyCarrierWithFmcsa(admin, {
      fleetId: fleet.id,
      carrierRegistryId: "CAR-001",
      kind: "USDOT",
      useCache: false,
      provider: new UnavailableFmcsaProvider(),
    });
    ids.push(result.verification.id);
    assert.equal(result.verification.result, "UNAVAILABLE");
    assert.equal(result.verification.provenance, "UNAVAILABLE");
    assert.equal(result.verification.liveConnected, false);
    const details = (await prisma.auditEvent.findFirstOrThrow({
      where: { entityId: result.verification.id },
    })).details as { event?: string };
    assert.equal(details.event, "carrier.fmcsa_verification_failed");
  } finally {
    await cleanupFmcsa(fleet.id, ids);
  }
});

test("fmcsa 8: STALE cached result uses BOF cache policy only", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const ids: string[] = [];
  const previous = process.env.BOF_FMCSA_CACHE_STALE_AFTER_MS;
  process.env.BOF_FMCSA_CACHE_STALE_AFTER_MS = "1";
  try {
    const created = await verifyCarrierWithFmcsa(admin, {
      fleetId: fleet.id,
      carrierRegistryId: "CAR-001",
      kind: "USDOT",
      useCache: false,
      provider: new FixtureFmcsaProvider("match"),
    });
    ids.push(created.verification.id);
    await prisma.fmcsaRegulatoryVerification.update({
      where: { id: created.verification.id },
      data: { verifiedAt: new Date(Date.now() - 60_000) },
    });
    const cached = await verifyCarrierWithFmcsa(admin, {
      fleetId: fleet.id,
      carrierRegistryId: "CAR-001",
      kind: "USDOT",
      value: created.verification.queriedValue,
      useCache: true,
      provider: new FixtureFmcsaProvider("match"),
    });
    assert.equal(cached.verification.result, "STALE");
    assert.equal(cached.verification.freshnessState, "STALE");
    assert.notEqual(cached.verification.provenance, "LIVE");
  } finally {
    if (previous === undefined) delete process.env.BOF_FMCSA_CACHE_STALE_AFTER_MS;
    else process.env.BOF_FMCSA_CACHE_STALE_AFTER_MS = previous;
    await cleanupFmcsa(fleet.id, ids);
  }
});

test("fmcsa 9-10: CONFLICT and mismatched fields", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const ids: string[] = [];
  try {
    const result = await verifyCarrierWithFmcsa(admin, {
      fleetId: fleet.id,
      carrierRegistryId: "CAR-001",
      kind: "USDOT",
      useCache: false,
      provider: new FixtureFmcsaProvider("mismatch"),
    });
    ids.push(result.verification.id);
    assert.equal(result.verification.result, "CONFLICT");
    const comparisons = result.verification.fieldComparisons as Array<{ field: string; result: string }>;
    assert.ok(comparisons.some((row) => row.field === "legalName" && row.result === "MISMATCH"));
    const exception = await prisma.operatingException.findFirst({
      where: { entityId: result.verification.id, exceptionType: "FMCSA_FIELD_CONFLICT" },
    });
    assert.ok(exception);
    assert.equal(getCarrierById("CAR-001")?.legalName, "Delta Advanced Trucking, Inc.");
  } finally {
    await cleanupFmcsa(fleet.id, ids);
  }
});

test("fmcsa 11: tenant isolation", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const ids: string[] = [];
  try {
    const created = await verifyCarrierWithFmcsa(admin, {
      fleetId: fleet.id,
      carrierRegistryId: "CAR-001",
      kind: "USDOT",
      useCache: false,
      provider: new FixtureFmcsaProvider("match"),
    });
    ids.push(created.verification.id);
    const fleetB = await prisma.fleet.findUniqueOrThrow({ where: { slug: "fleet-b" } });
    const adminRole = await prisma.role.findUniqueOrThrow({ where: { code: "FLEET_ADMIN" } });
    const other = await prisma.user.create({
      data: {
        email: `fmcsa-fleet-b-${Date.now()}@dev.local`,
        status: "ACTIVE",
        memberships: { create: { fleetId: fleetB.id, roleId: adminRole.id, status: "ACTIVE" } },
      },
      include: { memberships: { include: { role: true } } },
    });
    await assert.rejects(
      () => getLatestFmcsaVerification(asSessionUser(other), fleet.id, "CAR-001"),
      (caught: unknown) => pickupHttpError(caught).statusCode === 403,
    );
    await prisma.fleetMembership.deleteMany({ where: { userId: other.id } });
    await prisma.user.delete({ where: { id: other.id } });
  } finally {
    await cleanupFmcsa(fleet.id, ids);
  }
});

test("fmcsa 12: unauthorized shipper role 403", async () => {
  requireIsolatedTestDatabase();
  const { fleet } = await requireCertOperator();
  const driverRole = await prisma.role.findUniqueOrThrow({ where: { code: "DRIVER" } });
  const user = await prisma.user.create({
    data: {
      email: `fmcsa-driver-${Date.now()}@dev.local`,
      status: "ACTIVE",
      memberships: { create: { fleetId: fleet.id, roleId: driverRole.id, status: "ACTIVE" } },
    },
    include: { memberships: { include: { role: true } } },
  });
  try {
    await assert.rejects(
      () =>
        verifyCarrierWithFmcsa(asSessionUser(user), {
          fleetId: fleet.id,
          carrierRegistryId: "CAR-001",
          kind: "USDOT",
          useCache: false,
          provider: new FixtureFmcsaProvider("match"),
        }),
      (caught: unknown) => pickupHttpError(caught).statusCode === 403,
    );
  } finally {
    await prisma.fleetMembership.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
});

test("fmcsa 13-14: malformed and timeout stay ERROR not VERIFIED", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const ids: string[] = [];
  try {
    const malformed = await verifyCarrierWithFmcsa(admin, {
      fleetId: fleet.id,
      carrierRegistryId: "CAR-001",
      useCache: false,
      provider: new FixtureFmcsaProvider("malformed"),
    });
    ids.push(malformed.verification.id);
    assert.equal(malformed.verification.result, "ERROR");
    const timeout = await verifyCarrierWithFmcsa(admin, {
      fleetId: fleet.id,
      carrierRegistryId: "CAR-001",
      useCache: false,
      provider: new FixtureFmcsaProvider("timeout"),
    });
    ids.push(timeout.verification.id);
    assert.equal(timeout.verification.result, "ERROR");
    assert.equal(timeout.verification.errorCode, "TIMEOUT");
  } finally {
    await cleanupFmcsa(fleet.id, ids);
  }
});

test("fmcsa 15: missing credentials never fabricate LIVE", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const ids: string[] = [];
  try {
    const result = await verifyCarrierWithFmcsa(admin, {
      fleetId: fleet.id,
      carrierRegistryId: "CAR-001",
      useCache: false,
      provider: new UnavailableFmcsaProvider("FMCSA_QCMOBILE_WEBKEY is not configured"),
    });
    ids.push(result.verification.id);
    assert.notEqual(result.verification.result, "VERIFIED");
    assert.notEqual(result.verification.provenance, "LIVE");
  } finally {
    await cleanupFmcsa(fleet.id, ids);
  }
});

test("fmcsa 16: cached versus fixture provenance", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const ids: string[] = [];
  const previous = process.env.BOF_FMCSA_CACHE_STALE_AFTER_MS;
  delete process.env.BOF_FMCSA_CACHE_STALE_AFTER_MS;
  try {
    const liveFixture = await verifyCarrierWithFmcsa(admin, {
      fleetId: fleet.id,
      carrierRegistryId: "CAR-001",
      kind: "USDOT",
      useCache: false,
      provider: new FixtureFmcsaProvider("match"),
    });
    ids.push(liveFixture.verification.id);
    assert.equal(liveFixture.verification.provenance, "FIXTURE");
    const cached = await verifyCarrierWithFmcsa(admin, {
      fleetId: fleet.id,
      carrierRegistryId: "CAR-001",
      kind: "USDOT",
      value: liveFixture.verification.queriedValue,
      useCache: true,
      provider: new FixtureFmcsaProvider("match"),
    });
    assert.equal(cached.cached, true);
    assert.equal(cached.verification.freshnessState, "CACHED");
    assert.notEqual(cached.verification.provenance, "LIVE");
  } finally {
    if (previous !== undefined) process.env.BOF_FMCSA_CACHE_STALE_AFTER_MS = previous;
    await cleanupFmcsa(fleet.id, ids);
  }
});

test("fmcsa 17: Secure Pickup Phase 1 issue still required and Phase 2 remains UNVERIFIED", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const pickupIds = emptySecurePickupCertIds();
  try {
    const chain = await createSecurePickupChain(fleet.id, admin.id as string, pickupIds);
    const issued = await issuePickupAuthorization(admin, chain.load.id);
    pickupIds.authorizationIds.push(issued.authorization.id);
    assert.equal(issued.authorization.status, "PENDING");
    const physical = evaluatePickupPhysicalArrival(
      {
        authorizationId: issued.authorization.id,
        loadId: chain.load.id,
        driverId: chain.driver.id,
        tractorId: chain.tractor.id,
        trailerId: chain.trailer.id,
        tractorUnitNumber: chain.tractor.unitNumber,
        trailerUnitNumber: chain.trailer.unitNumber,
        tractorVin: null,
        trailerVin: null,
      },
      {},
    );
    assert.equal(physical.identityPhysicalClass, "UNVERIFIED");
    assert.equal(physical.equipmentPhysicalClass, "UNVERIFIED");
  } finally {
    await cleanupSecurePickupCertFixtures(pickupIds);
  }
});
