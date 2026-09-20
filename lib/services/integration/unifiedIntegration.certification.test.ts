import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

import { prisma } from "@/lib/prisma";
import { getCarrierById } from "@/lib/carrier-registry";
import { FixtureFmcsaProvider } from "@/lib/services/fmcsa/fixtureProvider";
import { getLatestFmcsaVerification, verifyCarrierWithFmcsa } from "@/lib/services/fmcsa/fmcsaVerificationService";
import { UnavailableFmcsaProvider } from "@/lib/services/fmcsa/unavailableProvider";
import { issuePickupAuthorization } from "@/lib/services/pickupAuthorizationService";
import { getPickupDockView, reconcilePickupPhysicalArrival } from "@/lib/services/pickupPhysicalReconciliationService";
import {
  evaluateSambaIntelligence,
  listSambaFindings,
  transitionSambaFinding,
} from "@/lib/services/samba/sambaIntelligenceService";
import { SAMBA_FINDING_TYPES } from "@/lib/services/samba/types";
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

async function cleanupSamba(ids: string[]) {
  if (ids.length === 0) return;
  await prisma.auditEvent.deleteMany({ where: { entityType: "SambaFinding", entityId: { in: ids } } });
  await prisma.sambaFinding.deleteMany({ where: { id: { in: ids } } });
}

async function cleanupFmcsa(fleetId: string, ids: string[]) {
  if (ids.length === 0) return;
  const exceptions = await prisma.operatingException.findMany({
    where: { fleetId, entityType: "FmcsaRegulatoryVerification", entityId: { in: ids } },
    select: { id: true },
  });
  const exceptionIds = exceptions.map((row) => row.id);
  await prisma.operatingProcessEvent.deleteMany({
    where: { fleetId, OR: [{ entityId: { in: ids } }, { exceptionId: { in: exceptionIds } }] },
  });
  await prisma.operatingException.deleteMany({ where: { id: { in: exceptionIds } } });
  await prisma.auditEvent.deleteMany({ where: { entityType: "FmcsaRegulatoryVerification", entityId: { in: ids } } });
  await prisma.fmcsaRegulatoryVerification.deleteMany({ where: { id: { in: ids } } });
}

function arrivingFor(
  issued: { authorization: { id: string }; credential: { token: string } },
  chain: { load: { id: string }; driver: { id: string }; tractor: { id: string; unitNumber: string }; trailer: { id: string; unitNumber: string } },
  overrides: Record<string, string> = {},
) {
  return {
    token: issued.credential.token,
    method: "SHIPPER_DOCK" as const,
    arriving: {
      authorizationId: issued.authorization.id,
      loadId: chain.load.id,
      driverId: chain.driver.id,
      tractorId: chain.tractor.id,
      trailerId: chain.trailer.id,
      tractorUnitNumber: chain.tractor.unitNumber,
      trailerUnitNumber: chain.trailer.unitNumber,
      ...overrides,
    },
  };
}

test("unified source: Samba and FMCSA cannot become operating spines", () => {
  const samba = readFileSync(resolve("lib/services/samba/sambaIntelligenceService.ts"), "utf8");
  const fmcsa = readFileSync(resolve("lib/services/fmcsa/fmcsaVerificationService.ts"), "utf8");
  assert.equal(
    /prisma\.(pickupAuthorization|load|driver|equipment|dispatchAssignment|dispatchRelease|driverReadinessScore|conditionThread|fmcsaRegulatoryVerification)\.(update|create|upsert|delete)/.test(
      samba,
    ),
    false,
  );
  assert.equal(/prisma\.(pickupAuthorization|load|driver|dispatchAssignment)\.(update|create|delete)/.test(fmcsa), false);
  assert.match(samba, /mutatedOperationalRecords: false/);
});

test("unified A: clean FMCSA match does not create a Samba conflict or mutate operations", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const fmcsaIds: string[] = [];
  let sambaIds: string[] = [];
  const before = getCarrierById("CAR-001")!;
  try {
    const verified = await verifyCarrierWithFmcsa(admin, {
      fleetId: fleet.id,
      carrierRegistryId: "CAR-001",
      kind: "USDOT",
      useCache: false,
      provider: new FixtureFmcsaProvider("match"),
    });
    fmcsaIds.push(verified.verification.id);
    assert.equal(verified.verification.result, "VERIFIED");
    assert.equal(verified.verification.provenance, "FIXTURE");
    assert.equal(verified.verification.comparisonAuthority, "DEMO_REFERENCE");
    assert.equal(verified.bof?.authorityClass, "DEMO_REFERENCE");
    assert.equal(verified.mutatedBofRecord, false);
    const evaluated = await evaluateSambaIntelligence(admin, fleet.id);
    sambaIds = evaluated.createdIds;
    assert.equal(
      evaluated.findings.some(
        (row) => row.findingType === SAMBA_FINDING_TYPES.FMCSA_CARRIER_CONFLICT && row.evidenceId === verified.verification.id,
      ),
      false,
    );
    assert.equal(evaluated.mutatedOperationalRecords, false);
    assert.equal(getCarrierById("CAR-001")?.legalName, before.legalName);
  } finally {
    await cleanupSamba(sambaIds);
    await cleanupFmcsa(fleet.id, fmcsaIds);
  }
});

test("unified B: FMCSA conflict produces INFERRED Samba finding without mutating BOF", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const pickupIds = emptySecurePickupCertIds();
  const fmcsaIds: string[] = [];
  let sambaIds: string[] = [];
  const before = getCarrierById("CAR-001")!;
  try {
    const chain = await createSecurePickupChain(fleet.id, admin.id as string, pickupIds);
    const issued = await issuePickupAuthorization(admin, chain.load.id);
    pickupIds.authorizationIds.push(issued.authorization.id);
    const pickupBefore = issued.authorization.status;
    const verified = await verifyCarrierWithFmcsa(admin, {
      fleetId: fleet.id,
      carrierRegistryId: "CAR-001",
      kind: "USDOT",
      useCache: false,
      provider: new FixtureFmcsaProvider("mismatch"),
    });
    fmcsaIds.push(verified.verification.id);
    assert.equal(verified.verification.result, "CONFLICT");
    assert.equal(verified.verification.provenance, "FIXTURE");
    const evaluated = await evaluateSambaIntelligence(admin, fleet.id);
    sambaIds = evaluated.createdIds;
    const conflict = evaluated.findings.find(
      (row) => row.findingType === SAMBA_FINDING_TYPES.FMCSA_CARRIER_CONFLICT && row.evidenceId === verified.verification.id,
    );
    assert.ok(conflict);
    assert.equal(conflict.provenance, "INFERRED");
    assert.equal(conflict.demoReferenceUsed, true);
    assert.match(conflict.fact, /DEMO_REFERENCE/);
    assert.ok(String(conflict.verifiedEvidence).includes("FIXTURE") || String(conflict.explanation).includes("FIXTURE"));
    assert.notEqual(conflict.provenance, "LIVE");
    assert.notEqual(conflict.provenance, "VERIFIED_EXTERNAL");
    assert.equal(getCarrierById("CAR-001")?.legalName, before.legalName);
    const pickupAfter = await prisma.pickupAuthorization.findUniqueOrThrow({ where: { id: issued.authorization.id } });
    assert.equal(pickupAfter.status, pickupBefore);
    assert.equal(evaluated.mutatedOperationalRecords, false);
  } finally {
    await cleanupSamba(sambaIds);
    await cleanupFmcsa(fleet.id, fmcsaIds);
    await cleanupSecurePickupCertFixtures(pickupIds);
  }
});

test("unified C: UNAVAILABLE FMCSA is not VERIFIED and does not fabricate a Samba conflict", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const fmcsaIds: string[] = [];
  let sambaIds: string[] = [];
  try {
    const unavailable = await verifyCarrierWithFmcsa(admin, {
      fleetId: fleet.id,
      carrierRegistryId: "CAR-UNAVAILABLE",
      kind: "USDOT",
      value: "0000001",
      useCache: false,
      provider: new UnavailableFmcsaProvider(),
    });
    fmcsaIds.push(unavailable.verification.id);
    assert.equal(unavailable.verification.result, "UNAVAILABLE");
    assert.notEqual(unavailable.verification.result, "VERIFIED");
    assert.notEqual(unavailable.verification.provenance, "LIVE");
    const evaluated = await evaluateSambaIntelligence(admin, fleet.id);
    sambaIds = evaluated.createdIds;
    assert.equal(
      evaluated.findings.some(
        (row) => row.findingType === SAMBA_FINDING_TYPES.FMCSA_CARRIER_CONFLICT && row.evidenceId === unavailable.verification.id,
      ),
      false,
    );
  } finally {
    await cleanupSamba(sambaIds);
    await cleanupFmcsa(fleet.id, fmcsaIds);
  }
});

test("unified D: Phase 2 wrong driver STOP is observed by Samba, not created by Samba", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const pickupIds = emptySecurePickupCertIds();
  let sambaIds: string[] = [];
  try {
    const chain = await createSecurePickupChain(fleet.id, admin.id as string, pickupIds);
    const issued = await issuePickupAuthorization(admin, chain.load.id);
    pickupIds.authorizationIds.push(issued.authorization.id);
    assert.equal(issued.authorization.status, "PENDING");
    await assert.rejects(
      () => reconcilePickupPhysicalArrival(admin, issued.authorization.id, arrivingFor(issued, chain, { driverId: "wrong-driver" })),
      (caught: unknown) => {
        const error = pickupHttpError(caught);
        return error.statusCode === 409 && error.payload?.physical?.disposition === "STOP";
      },
    );
    const afterPhase2 = await prisma.pickupAuthorization.findUniqueOrThrow({ where: { id: issued.authorization.id } });
    const physical = await prisma.pickupPhysicalReconciliation.findUniqueOrThrow({
      where: { pickupAuthorizationId: issued.authorization.id },
    });
    assert.equal(physical.disposition, "STOP");
    const evaluated = await evaluateSambaIntelligence(admin, fleet.id);
    sambaIds = evaluated.createdIds;
    assert.ok(
      evaluated.findings.some(
        (row) =>
          (row.findingType === SAMBA_FINDING_TYPES.PICKUP_STOPPED && row.entityId === issued.authorization.id) ||
          (row.findingType === SAMBA_FINDING_TYPES.PICKUP_PHYSICAL_STOP && row.entityId === physical.id),
      ),
    );
    const afterSamba = await prisma.pickupAuthorization.findUniqueOrThrow({ where: { id: issued.authorization.id } });
    assert.equal(afterSamba.status, afterPhase2.status);
    assert.equal(evaluated.mutatedOperationalRecords, false);
  } finally {
    await cleanupSamba(sambaIds);
    await cleanupSecurePickupCertFixtures(pickupIds);
  }
});

test("unified E: Phase 2 wrong equipment STOP is observed only", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const pickupIds = emptySecurePickupCertIds();
  let sambaIds: string[] = [];
  try {
    const chain = await createSecurePickupChain(fleet.id, admin.id as string, pickupIds);
    const issued = await issuePickupAuthorization(admin, chain.load.id);
    pickupIds.authorizationIds.push(issued.authorization.id);
    await assert.rejects(
      () =>
        reconcilePickupPhysicalArrival(
          admin,
          issued.authorization.id,
          arrivingFor(issued, chain, { tractorId: "wrong-tractor", tractorUnitNumber: "WRONG-UNIT" }),
        ),
      (caught: unknown) => pickupHttpError(caught).payload?.physical?.disposition === "STOP",
    );
    const physical = await prisma.pickupPhysicalReconciliation.findUniqueOrThrow({
      where: { pickupAuthorizationId: issued.authorization.id },
    });
    const evaluated = await evaluateSambaIntelligence(admin, fleet.id);
    sambaIds = evaluated.createdIds;
    assert.ok(evaluated.findings.some((row) => row.entityId === physical.id || row.entityId === issued.authorization.id));
    const after = await prisma.pickupPhysicalReconciliation.findUniqueOrThrow({ where: { id: physical.id } });
    assert.equal(after.disposition, "STOP");
  } finally {
    await cleanupSamba(sambaIds);
    await cleanupSecurePickupCertFixtures(pickupIds);
  }
});

test("unified F: Phase 2 RELEASE does not produce a false Samba STOP", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const pickupIds = emptySecurePickupCertIds();
  let sambaIds: string[] = [];
  try {
    const chain = await createSecurePickupChain(fleet.id, admin.id as string, pickupIds);
    const issued = await issuePickupAuthorization(admin, chain.load.id);
    pickupIds.authorizationIds.push(issued.authorization.id);
    const released = await reconcilePickupPhysicalArrival(admin, issued.authorization.id, arrivingFor(issued, chain));
    assert.equal(released.physical.disposition, "RELEASE");
    const evaluated = await evaluateSambaIntelligence(admin, fleet.id);
    sambaIds = evaluated.createdIds;
    assert.equal(
      evaluated.findings.some(
        (row) =>
          row.entityId === issued.authorization.id &&
          (row.findingType === SAMBA_FINDING_TYPES.PICKUP_STOPPED || row.findingType === SAMBA_FINDING_TYPES.PICKUP_PHYSICAL_STOP),
      ),
      false,
    );
  } finally {
    await cleanupSamba(sambaIds);
    await cleanupSecurePickupCertFixtures(pickupIds);
  }
});

test("unified G: repeated Phase 2 STOPs produce an INFERRED pattern finding", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const pickupIds = emptySecurePickupCertIds();
  let sambaIds: string[] = [];
  try {
    for (let index = 0; index < 2; index += 1) {
      const chain = await createSecurePickupChain(fleet.id, admin.id as string, pickupIds);
      const issued = await issuePickupAuthorization(admin, chain.load.id);
      pickupIds.authorizationIds.push(issued.authorization.id);
      await assert.rejects(() =>
        reconcilePickupPhysicalArrival(admin, issued.authorization.id, arrivingFor(issued, chain, { driverId: `wrong-${index}` })),
      );
    }
    const evaluated = await evaluateSambaIntelligence(admin, fleet.id);
    sambaIds = evaluated.createdIds;
    const pattern = evaluated.findings.find((row) => row.findingType === SAMBA_FINDING_TYPES.PICKUP_REPEATED_STOP);
    assert.ok(pattern);
    assert.equal(pattern.provenance, "INFERRED");
    assert.ok(pattern.inference);
    const stillStopped = await prisma.pickupAuthorization.count({
      where: { id: { in: pickupIds.authorizationIds }, status: "STOPPED" },
    });
    assert.ok(stillStopped >= 2);
  } finally {
    await cleanupSamba(sambaIds);
    await cleanupSecurePickupCertFixtures(pickupIds);
  }
});

test("unified H: Samba surfaces DRIVER_NOT_READY without changing readiness", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const pickupIds = emptySecurePickupCertIds();
  let sambaIds: string[] = [];
  try {
    const chain = await createSecurePickupChain(fleet.id, admin.id as string, pickupIds);
    await prisma.driverReadinessScore.update({
      where: { id: chain.readinessId },
      data: { status: "NOT_READY", summary: "unified cert not ready" },
    });
    const evaluated = await evaluateSambaIntelligence(admin, fleet.id);
    sambaIds = evaluated.createdIds;
    const finding = evaluated.findings.find(
      (row) => row.findingType === SAMBA_FINDING_TYPES.DRIVER_NOT_READY && row.entityId === chain.readinessId,
    );
    assert.ok(finding);
    assert.equal(finding.provenance, "LIVE");
    const after = await prisma.driverReadinessScore.findUniqueOrThrow({ where: { id: chain.readinessId } });
    assert.equal(after.status, "NOT_READY");
    assert.equal(after.summary, "unified cert not ready");
  } finally {
    await cleanupSamba(sambaIds);
    await cleanupSecurePickupCertFixtures(pickupIds);
  }
});

test("unified I: Samba surfaces equipment condition without mutating the thread", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const pickupIds = emptySecurePickupCertIds();
  let sambaIds: string[] = [];
  let threadId: string | null = null;
  try {
    const chain = await createSecurePickupChain(fleet.id, admin.id as string, pickupIds);
    const thread = await prisma.conditionThread.create({
      data: {
        fleetId: fleet.id,
        equipmentId: chain.tractor.id,
        title: "unified cert blocking condition",
        category: "OTHER",
        severity: "BLOCKING",
        observationSource: "DISPATCH",
        lifecycleState: "IDENTIFIED",
        createdByUserId: admin.id as string,
      },
    });
    threadId = thread.id;
    const evaluated = await evaluateSambaIntelligence(admin, fleet.id);
    sambaIds = evaluated.createdIds;
    const finding = evaluated.findings.find(
      (row) => row.findingType === SAMBA_FINDING_TYPES.EQUIPMENT_CONDITION_OPEN && row.entityId === thread.id,
    );
    assert.ok(finding);
    const after = await prisma.conditionThread.findUniqueOrThrow({ where: { id: thread.id } });
    assert.equal(after.lifecycleState, "IDENTIFIED");
    assert.equal(after.severity, "BLOCKING");
  } finally {
    await cleanupSamba(sambaIds);
    if (threadId) await prisma.conditionThread.deleteMany({ where: { id: threadId } });
    await cleanupSecurePickupCertFixtures(pickupIds);
  }
});

test("unified provenance: STALE/FIXTURE/UNAVAILABLE/INFERRED cannot be relabeled LIVE or VERIFIED", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const fmcsaIds: string[] = [];
  let sambaIds: string[] = [];
  const previous = process.env.BOF_FMCSA_CACHE_STALE_AFTER_MS;
  process.env.BOF_FMCSA_CACHE_STALE_AFTER_MS = "1";
  try {
    const fixture = await verifyCarrierWithFmcsa(admin, {
      fleetId: fleet.id,
      carrierRegistryId: "CAR-001",
      kind: "USDOT",
      useCache: false,
      provider: new FixtureFmcsaProvider("mismatch"),
    });
    fmcsaIds.push(fixture.verification.id);
    assert.equal(fixture.verification.provenance, "FIXTURE");
    await prisma.fmcsaRegulatoryVerification.update({
      where: { id: fixture.verification.id },
      data: { verifiedAt: new Date(Date.now() - 60_000), freshnessState: "STALE", result: "STALE" },
    });
    const unavailable = await verifyCarrierWithFmcsa(admin, {
      fleetId: fleet.id,
      carrierRegistryId: "CAR-UNAVAILABLE",
      kind: "USDOT",
      value: "0000001",
      useCache: false,
      provider: new UnavailableFmcsaProvider(),
    });
    fmcsaIds.push(unavailable.verification.id);
    const evaluated = await evaluateSambaIntelligence(admin, fleet.id);
    sambaIds = evaluated.createdIds;
    const stale = evaluated.findings.find((row) => row.findingType === SAMBA_FINDING_TYPES.FMCSA_STALE_EVIDENCE);
    assert.ok(stale);
    assert.equal(stale.evidenceFreshness, "STALE");
    assert.notEqual(stale.provenance, "LIVE");
    assert.notEqual(stale.provenance, "VERIFIED_EXTERNAL");
    const conflict = evaluated.findings.find((row) => row.findingType === SAMBA_FINDING_TYPES.FMCSA_CARRIER_CONFLICT);
    if (conflict) {
      assert.equal(conflict.provenance, "INFERRED");
      assert.notEqual(conflict.provenance, "VERIFIED_EXTERNAL");
    }
    assert.equal(
      evaluated.findings.some((row) => row.evidenceId === unavailable.verification.id && row.provenance === "VERIFIED_EXTERNAL"),
      false,
    );
  } finally {
    if (previous === undefined) delete process.env.BOF_FMCSA_CACHE_STALE_AFTER_MS;
    else process.env.BOF_FMCSA_CACHE_STALE_AFTER_MS = previous;
    await cleanupSamba(sambaIds);
    await cleanupFmcsa(fleet.id, fmcsaIds);
  }
});

test("unified tenant + API authorization: 401/403 and no cross-fleet leakage", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const pickupIds = emptySecurePickupCertIds();
  const fmcsaIds: string[] = [];
  let sambaIds: string[] = [];
  const extraUserIds: string[] = [];
  try {
    await assert.rejects(() => listSambaFindings(null, fleet.id), (caught: unknown) => pickupHttpError(caught).statusCode === 401);
    await assert.rejects(
      () => verifyCarrierWithFmcsa(null, { fleetId: fleet.id, carrierRegistryId: "CAR-001", useCache: false, provider: new FixtureFmcsaProvider("match") }),
      (caught: unknown) => pickupHttpError(caught).statusCode === 401,
    );

    const verified = await verifyCarrierWithFmcsa(admin, {
      fleetId: fleet.id,
      carrierRegistryId: "CAR-001",
      useCache: false,
      provider: new FixtureFmcsaProvider("mismatch"),
    });
    fmcsaIds.push(verified.verification.id);
    const evaluated = await evaluateSambaIntelligence(admin, fleet.id);
    sambaIds = evaluated.createdIds;
    const finding = evaluated.findings.find((row) => sambaIds.includes(row.id));
    assert.ok(finding);

    const fleetB = await prisma.fleet.findUniqueOrThrow({ where: { slug: "fleet-b" } });
    const adminRole = await prisma.role.findUniqueOrThrow({ where: { code: "FLEET_ADMIN" } });
    const driverRole = await prisma.role.findUniqueOrThrow({ where: { code: "DRIVER" } });
    const other = await prisma.user.create({
      data: {
        email: `unified-b-${Date.now()}@dev.local`,
        status: "ACTIVE",
        memberships: { create: { fleetId: fleetB.id, roleId: adminRole.id, status: "ACTIVE" } },
      },
      include: { memberships: { include: { role: true } } },
    });
    const driver = await prisma.user.create({
      data: {
        email: `unified-driver-${Date.now()}@dev.local`,
        status: "ACTIVE",
        memberships: { create: { fleetId: fleet.id, roleId: driverRole.id, status: "ACTIVE" } },
      },
      include: { memberships: { include: { role: true } } },
    });
    extraUserIds.push(other.id, driver.id);

    await assert.rejects(() => listSambaFindings(asSessionUser(other), fleet.id), (caught: unknown) => pickupHttpError(caught).statusCode === 403);
    await assert.rejects(() => getLatestFmcsaVerification(asSessionUser(other), fleet.id, "CAR-001"), (caught: unknown) => pickupHttpError(caught).statusCode === 403);
    await assert.rejects(
      () =>
        verifyCarrierWithFmcsa(asSessionUser(other), {
          fleetId: fleet.id,
          carrierRegistryId: "CAR-001",
          useCache: false,
          provider: new FixtureFmcsaProvider("match"),
        }),
      (caught: unknown) => pickupHttpError(caught).statusCode === 403,
    );
    await assert.rejects(() => evaluateSambaIntelligence(asSessionUser(driver), fleet.id), (caught: unknown) => pickupHttpError(caught).statusCode === 403);
    await assert.rejects(() => transitionSambaFinding(asSessionUser(other), finding.id, "ACKNOWLEDGED"), (caught: unknown) => pickupHttpError(caught).statusCode === 403);

    const chain = await createSecurePickupChain(fleet.id, admin.id as string, pickupIds);
    const issued = await issuePickupAuthorization(admin, chain.load.id);
    pickupIds.authorizationIds.push(issued.authorization.id);
    await assert.rejects(
      () => getPickupDockView(asSessionUser(other), issued.authorization.id),
      (caught: unknown) => {
        const status = pickupHttpError(caught).statusCode;
        return status === 403 || status === 404;
      },
    );
    await assert.rejects(
      () => reconcilePickupPhysicalArrival(asSessionUser(other), issued.authorization.id, arrivingFor(issued, chain)),
      (caught: unknown) => {
        const status = pickupHttpError(caught).statusCode;
        return status === 403 || status === 404;
      },
    );

    const otherList = await listSambaFindings(asSessionUser(other), fleetB.id);
    assert.equal(otherList.findings.some((row) => sambaIds.includes(row.id)), false);
    const otherFmcsa = await prisma.fmcsaRegulatoryVerification.count({ where: { fleetId: fleetB.id, id: { in: fmcsaIds } } });
    assert.equal(otherFmcsa, 0);

    await assert.rejects(() => transitionSambaFinding(admin, "missing-finding", "ACKNOWLEDGED"), (caught: unknown) => pickupHttpError(caught).statusCode === 404);
    await assert.rejects(() => getPickupDockView(admin, "missing-authorization"), (caught: unknown) => pickupHttpError(caught).statusCode === 404);
  } finally {
    await cleanupSamba(sambaIds);
    await cleanupFmcsa(fleet.id, fmcsaIds);
    await cleanupSecurePickupCertFixtures(pickupIds);
    if (extraUserIds.length) {
      await prisma.fleetMembership.deleteMany({ where: { userId: { in: extraUserIds } } });
      await prisma.user.deleteMany({ where: { id: { in: extraUserIds } } });
    }
  }
});

test("unified replay/idempotency: Samba evaluate, FMCSA cache, Phase 2 reuse", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const pickupIds = emptySecurePickupCertIds();
  const fmcsaIds: string[] = [];
  let sambaIds: string[] = [];
  try {
    const verified = await verifyCarrierWithFmcsa(admin, {
      fleetId: fleet.id,
      carrierRegistryId: "CAR-001",
      kind: "USDOT",
      useCache: false,
      provider: new FixtureFmcsaProvider("mismatch"),
    });
    fmcsaIds.push(verified.verification.id);
    const cached = await verifyCarrierWithFmcsa(admin, {
      fleetId: fleet.id,
      carrierRegistryId: "CAR-001",
      kind: "USDOT",
      value: verified.verification.queriedValue,
      useCache: true,
      provider: new FixtureFmcsaProvider("mismatch"),
    });
    assert.equal(cached.cached, true);
    assert.notEqual(cached.verification.provenance, "LIVE");

    const first = await evaluateSambaIntelligence(admin, fleet.id);
    sambaIds = first.createdIds;
    const second = await evaluateSambaIntelligence(admin, fleet.id);
    sambaIds = [...new Set([...sambaIds, ...second.createdIds])];
    const conflictIds = first.findings
      .filter((row) => row.findingType === SAMBA_FINDING_TYPES.FMCSA_CARRIER_CONFLICT && row.evidenceId === verified.verification.id)
      .map((row) => row.id);
    assert.equal(conflictIds.length, 1);
    assert.equal(
      second.createdIds.some((id) => conflictIds.includes(id)),
      false,
    );

    const chain = await createSecurePickupChain(fleet.id, admin.id as string, pickupIds);
    const issued = await issuePickupAuthorization(admin, chain.load.id);
    pickupIds.authorizationIds.push(issued.authorization.id);
    await assert.rejects(() => reconcilePickupPhysicalArrival(admin, issued.authorization.id, arrivingFor(issued, chain, { driverId: "wrong" })));
    await assert.rejects(
      () => reconcilePickupPhysicalArrival(admin, issued.authorization.id, arrivingFor(issued, chain, { driverId: "wrong" })),
      (caught: unknown) => {
        const error = pickupHttpError(caught);
        const codes = error.payload?.attempt?.reasonCodes;
        return Array.isArray(codes) && codes.includes("REUSED");
      },
    );
  } finally {
    await cleanupSamba(sambaIds);
    await cleanupFmcsa(fleet.id, fmcsaIds);
    await cleanupSecurePickupCertFixtures(pickupIds);
  }
});

test("unified audit chain: FMCSA evidence → Samba finding → acknowledgement", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const fmcsaIds: string[] = [];
  let sambaIds: string[] = [];
  try {
    const verified = await verifyCarrierWithFmcsa(admin, {
      fleetId: fleet.id,
      carrierRegistryId: "CAR-001",
      kind: "USDOT",
      useCache: false,
      provider: new FixtureFmcsaProvider("mismatch"),
    });
    fmcsaIds.push(verified.verification.id);
    const fmcsaAudit = await prisma.auditEvent.findFirstOrThrow({
      where: { entityType: "FmcsaRegulatoryVerification", entityId: verified.verification.id },
    });
    assert.equal(fmcsaAudit.tenantId, fleet.id);
    assert.ok((fmcsaAudit.details as { event?: string }).event);

    const evaluated = await evaluateSambaIntelligence(admin, fleet.id);
    sambaIds = evaluated.createdIds;
    const conflict = evaluated.findings.find((row) => row.findingType === SAMBA_FINDING_TYPES.FMCSA_CARRIER_CONFLICT);
    assert.ok(conflict);
    const createdAudit = await prisma.auditEvent.findFirstOrThrow({
      where: { entityType: "SambaFinding", entityId: conflict.id },
    });
    assert.equal((createdAudit.details as { event?: string }).event, "samba.finding_created");
    assert.equal(createdAudit.tenantId, fleet.id);
    assert.equal((createdAudit.details as { evidenceSource?: string }).evidenceSource, "FMCSA");

    const ack = await transitionSambaFinding(admin, conflict.id, "ACKNOWLEDGED", "operator reviewed existing workflow");
    assert.equal(ack.mutatedOperationalRecords, false);
    const sambaAudits = await prisma.auditEvent.findMany({
      where: { entityType: "SambaFinding", entityId: conflict.id },
    });
    const ackAudit = sambaAudits.find((row) => (row.details as { event?: string }).event === "samba.finding_acknowledged");
    assert.ok(ackAudit);
    assert.equal((ackAudit.details as { priorStatus?: string; newStatus?: string }).priorStatus, "OPEN");
    assert.equal((ackAudit.details as { priorStatus?: string; newStatus?: string }).newStatus, "ACKNOWLEDGED");
  } finally {
    await cleanupSamba(sambaIds);
    await cleanupFmcsa(fleet.id, fmcsaIds);
  }
});
