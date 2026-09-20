import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "@/lib/prisma";
import { getCarrierById } from "@/lib/carrier-registry";
import { FixtureFmcsaProvider } from "@/lib/services/fmcsa/fixtureProvider";
import { verifyCarrierWithFmcsa } from "@/lib/services/fmcsa/fmcsaVerificationService";
import { UnavailableFmcsaProvider } from "@/lib/services/fmcsa/unavailableProvider";
import { sambaLlmBoundary } from "@/lib/services/samba/explanation";
import {
  evaluateSambaIntelligence,
  listSambaFindings,
  transitionSambaFinding,
} from "@/lib/services/samba/sambaIntelligenceService";
import { SAMBA_FINDING_TYPES } from "@/lib/services/samba/types";
import {
  issuePickupAuthorization,
  verifyPickupAuthorization,
} from "@/lib/services/pickupAuthorizationService";
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

test("samba 1: FMCSA conflict produces an INFERRED finding and keeps FIXTURE provenance on evidence", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const fmcsaIds: string[] = [];
  let sambaIds: string[] = [];
  const legalName = getCarrierById("CAR-001")!.legalName;
  try {
    const verified = await verifyCarrierWithFmcsa(admin, {
      fleetId: fleet.id,
      carrierRegistryId: "CAR-001",
      kind: "USDOT",
      useCache: false,
      provider: new FixtureFmcsaProvider("mismatch"),
    });
    fmcsaIds.push(verified.verification.id);
    const evaluated = await evaluateSambaIntelligence(admin, fleet.id);
    sambaIds = evaluated.createdIds;
    const conflict = evaluated.findings.find(
      (row) => row.findingType === SAMBA_FINDING_TYPES.FMCSA_CARRIER_CONFLICT && row.evidenceId === verified.verification.id,
    );
    assert.ok(conflict);
    assert.equal(conflict.provenance, "INFERRED");
    assert.equal(conflict.demoReferenceUsed, true);
    assert.equal(conflict.liveConnected, false);
    assert.ok(String(conflict.verifiedEvidence).includes("FIXTURE") || String(conflict.explanation).includes("FIXTURE"));
    assert.equal(conflict.llmUsed, false);
    assert.equal(getCarrierById("CAR-001")?.legalName, legalName);
    assert.equal(evaluated.mutatedOperationalRecords, false);
    const audit = await prisma.auditEvent.findFirst({
      where: { entityType: "SambaFinding", entityId: conflict.id },
    });
    assert.equal((audit?.details as { event?: string }).event, "samba.finding_created");
  } finally {
    await cleanupSamba(sambaIds);
    await cleanupFmcsa(fleet.id, fmcsaIds);
  }
});

test("samba 2: FMCSA match does not create a conflict finding", async () => {
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
      provider: new FixtureFmcsaProvider("match"),
    });
    fmcsaIds.push(verified.verification.id);
    const evaluated = await evaluateSambaIntelligence(admin, fleet.id);
    sambaIds = evaluated.createdIds;
    assert.equal(
      evaluated.findings.some(
        (row) => row.findingType === SAMBA_FINDING_TYPES.FMCSA_CARRIER_CONFLICT && row.evidenceId === verified.verification.id,
      ),
      false,
    );
  } finally {
    await cleanupSamba(sambaIds);
    await cleanupFmcsa(fleet.id, fmcsaIds);
  }
});

test("samba 3-5: UNAVAILABLE is not VERIFIED, STALE stays STALE, FIXTURE stays FIXTURE", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const fmcsaIds: string[] = [];
  let sambaIds: string[] = [];
  const previous = process.env.BOF_FMCSA_CACHE_STALE_AFTER_MS;
  process.env.BOF_FMCSA_CACHE_STALE_AFTER_MS = "1";
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
    const stale = await verifyCarrierWithFmcsa(admin, {
      fleetId: fleet.id,
      carrierRegistryId: "CAR-001",
      kind: "USDOT",
      useCache: false,
      provider: new FixtureFmcsaProvider("match"),
    });
    fmcsaIds.push(stale.verification.id);
    await prisma.fmcsaRegulatoryVerification.update({
      where: { id: stale.verification.id },
      data: { verifiedAt: new Date(Date.now() - 60_000), freshnessState: "STALE", result: "STALE" },
    });
    const evaluated = await evaluateSambaIntelligence(admin, fleet.id);
    sambaIds = evaluated.createdIds;
    assert.equal(
      evaluated.findings.some((row) => row.evidenceId === unavailable.verification.id && row.provenance === "VERIFIED_EXTERNAL"),
      false,
    );
    const staleFinding = evaluated.findings.find(
      (row) => row.findingType === SAMBA_FINDING_TYPES.FMCSA_STALE_EVIDENCE && row.evidenceId === stale.verification.id,
    );
    assert.ok(staleFinding);
    assert.equal(staleFinding.evidenceFreshness, "STALE");
    assert.notEqual(staleFinding.provenance, "VERIFIED_EXTERNAL");
    assert.equal(evaluated.llm.mayAuthorOperationalState, false);
    assert.equal(sambaLlmBoundary().usedForFindingState, false);
  } finally {
    if (previous === undefined) delete process.env.BOF_FMCSA_CACHE_STALE_AFTER_MS;
    else process.env.BOF_FMCSA_CACHE_STALE_AFTER_MS = previous;
    await cleanupSamba(sambaIds);
    await cleanupFmcsa(fleet.id, fmcsaIds);
  }
});

test("samba 6-8: pickup STOP finding, RELEASE is not STOP, repeated STOP is INFERRED", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const pickupIds = emptySecurePickupCertIds();
  let sambaIds: string[] = [];
  try {
    const first = await createSecurePickupChain(fleet.id, admin.id as string, pickupIds);
    const issuedStop = await issuePickupAuthorization(admin, first.load.id);
    pickupIds.authorizationIds.push(issuedStop.authorization.id);
    await assert.rejects(() =>
      verifyPickupAuthorization(admin, issuedStop.authorization.id, {
        token: issuedStop.credential.token,
        presented: {
          authorizationId: issuedStop.authorization.id,
          loadId: first.load.id,
          driverId: "wrong-driver",
          tractorEquipmentId: first.tractor.id,
          trailerEquipmentId: first.trailer.id,
        },
      }),
    );

    const releasedChain = await createSecurePickupChain(fleet.id, admin.id as string, pickupIds);
    const issuedRelease = await issuePickupAuthorization(admin, releasedChain.load.id);
    pickupIds.authorizationIds.push(issuedRelease.authorization.id);
    const released = await verifyPickupAuthorization(admin, issuedRelease.authorization.id, {
      token: issuedRelease.credential.token,
      presented: {
        authorizationId: issuedRelease.authorization.id,
        loadId: releasedChain.load.id,
        driverId: releasedChain.driver.id,
        tractorEquipmentId: releasedChain.tractor.id,
        trailerEquipmentId: releasedChain.trailer.id,
      },
    });
    assert.equal(released.authorization.status, "RELEASED");

    const secondStop = await createSecurePickupChain(fleet.id, admin.id as string, pickupIds);
    const issuedStop2 = await issuePickupAuthorization(admin, secondStop.load.id);
    pickupIds.authorizationIds.push(issuedStop2.authorization.id);
    await assert.rejects(() =>
      verifyPickupAuthorization(admin, issuedStop2.authorization.id, {
        token: issuedStop2.credential.token,
        presented: {
          authorizationId: issuedStop2.authorization.id,
          loadId: secondStop.load.id,
          driverId: "wrong-driver-2",
          tractorEquipmentId: secondStop.tractor.id,
          trailerEquipmentId: secondStop.trailer.id,
        },
      }),
    );

    const beforeStop = await prisma.pickupAuthorization.findUniqueOrThrow({ where: { id: issuedStop.authorization.id } });
    const beforeRelease = await prisma.pickupAuthorization.findUniqueOrThrow({ where: { id: issuedRelease.authorization.id } });
    const beforeLoad = await prisma.load.findUniqueOrThrow({ where: { id: first.load.id } });

    const evaluated = await evaluateSambaIntelligence(admin, fleet.id);
    sambaIds = evaluated.createdIds;

    assert.ok(
      evaluated.findings.some(
        (row) => row.findingType === SAMBA_FINDING_TYPES.PICKUP_STOPPED && row.entityId === issuedStop.authorization.id,
      ),
    );
    assert.equal(
      evaluated.findings.some(
        (row) => row.findingType === SAMBA_FINDING_TYPES.PICKUP_STOPPED && row.entityId === issuedRelease.authorization.id,
      ),
      false,
    );
    assert.ok(evaluated.findings.some((row) => row.findingType === SAMBA_FINDING_TYPES.PICKUP_REPEATED_STOP && row.provenance === "INFERRED"));

    const afterStop = await prisma.pickupAuthorization.findUniqueOrThrow({ where: { id: issuedStop.authorization.id } });
    const afterRelease = await prisma.pickupAuthorization.findUniqueOrThrow({ where: { id: issuedRelease.authorization.id } });
    const afterLoad = await prisma.load.findUniqueOrThrow({ where: { id: first.load.id } });
    assert.equal(afterStop.status, beforeStop.status);
    assert.equal(afterRelease.status, beforeRelease.status);
    assert.equal(afterLoad.status, beforeLoad.status);
  } finally {
    await cleanupSamba(sambaIds);
    await cleanupSecurePickupCertFixtures(pickupIds);
  }
});

test("samba 9: insufficient evidence does not fabricate a conflict", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  let sambaIds: string[] = [];
  try {
    const evaluated = await evaluateSambaIntelligence(admin, fleet.id);
    sambaIds = evaluated.createdIds;
    assert.equal(evaluated.findings.some((row) => row.findingType === SAMBA_FINDING_TYPES.FMCSA_CARRIER_CONFLICT && sambaIds.includes(row.id)), false);
    assert.equal(evaluated.llm.usedForFindingState, false);
  } finally {
    await cleanupSamba(sambaIds);
  }
});

test("samba 10-11: tenant isolation and unauthorized access", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const fmcsaIds: string[] = [];
  let sambaIds: string[] = [];
  let extraUserIds: string[] = [];
  try {
    const verified = await verifyCarrierWithFmcsa(admin, {
      fleetId: fleet.id,
      carrierRegistryId: "CAR-001",
      useCache: false,
      provider: new FixtureFmcsaProvider("mismatch"),
    });
    fmcsaIds.push(verified.verification.id);
    const evaluated = await evaluateSambaIntelligence(admin, fleet.id);
    sambaIds = evaluated.createdIds;
    const fleetB = await prisma.fleet.findUniqueOrThrow({ where: { slug: "fleet-b" } });
    const adminRole = await prisma.role.findUniqueOrThrow({ where: { code: "FLEET_ADMIN" } });
    const driverRole = await prisma.role.findUniqueOrThrow({ where: { code: "DRIVER" } });
    const other = await prisma.user.create({
      data: {
        email: `samba-b-${Date.now()}@dev.local`,
        status: "ACTIVE",
        memberships: { create: { fleetId: fleetB.id, roleId: adminRole.id, status: "ACTIVE" } },
      },
      include: { memberships: { include: { role: true } } },
    });
    const driver = await prisma.user.create({
      data: {
        email: `samba-driver-${Date.now()}@dev.local`,
        status: "ACTIVE",
        memberships: { create: { fleetId: fleet.id, roleId: driverRole.id, status: "ACTIVE" } },
      },
      include: { memberships: { include: { role: true } } },
    });
    extraUserIds = [other.id, driver.id];
    await assert.rejects(() => listSambaFindings(asSessionUser(other), fleet.id), (caught: unknown) => pickupHttpError(caught).statusCode === 403);
    await assert.rejects(() => evaluateSambaIntelligence(asSessionUser(driver), fleet.id), (caught: unknown) => pickupHttpError(caught).statusCode === 403);
    const otherList = await listSambaFindings(asSessionUser(other), fleetB.id);
    assert.equal(otherList.findings.some((row) => sambaIds.includes(row.id)), false);
  } finally {
    await cleanupSamba(sambaIds);
    await cleanupFmcsa(fleet.id, fmcsaIds);
    if (extraUserIds.length) {
      await prisma.fleetMembership.deleteMany({ where: { userId: { in: extraUserIds } } });
      await prisma.user.deleteMany({ where: { id: { in: extraUserIds } } });
    }
  }
});

test("samba 12-15: acknowledge, resolve, and dismiss are audited", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const pickupIds = emptySecurePickupCertIds();
  let sambaIds: string[] = [];
  try {
    const chain = await createSecurePickupChain(fleet.id, admin.id as string, pickupIds);
    const issued = await issuePickupAuthorization(admin, chain.load.id);
    pickupIds.authorizationIds.push(issued.authorization.id);
    await assert.rejects(() =>
      verifyPickupAuthorization(admin, issued.authorization.id, {
        token: issued.credential.token,
        presented: { authorizationId: issued.authorization.id, driverId: "nope" },
      }),
    );
    const evaluated = await evaluateSambaIntelligence(admin, fleet.id);
    sambaIds = evaluated.createdIds;
    const finding = evaluated.findings.find((row) => row.entityId === issued.authorization.id);
    assert.ok(finding);
    const ack = await transitionSambaFinding(admin, finding.id, "ACKNOWLEDGED", "reviewed");
    assert.equal(ack.finding.status, "ACKNOWLEDGED");
    const resolved = await transitionSambaFinding(admin, finding.id, "RESOLVED", "closed");
    assert.equal(resolved.finding.status, "RESOLVED");
    const second = evaluated.findings.find((row) => row.findingType === SAMBA_FINDING_TYPES.PICKUP_REPEATED_STOP) ?? finding;
    const dismissed = await transitionSambaFinding(admin, second.id, "DISMISSED", "not applicable");
    assert.equal(dismissed.finding.status, "DISMISSED");
    const events = await prisma.auditEvent.findMany({ where: { entityType: "SambaFinding", entityId: { in: [finding.id, second.id] } } });
    const names = events.map((row) => (row.details as { event?: string }).event);
    assert.ok(names.includes("samba.finding_acknowledged"));
    assert.ok(names.includes("samba.finding_resolved"));
    assert.ok(names.includes("samba.finding_dismissed"));
  } finally {
    await cleanupSamba(sambaIds);
    await cleanupSecurePickupCertFixtures(pickupIds);
  }
});

test("samba 16-20: no operational mutation, DEMO is not LIVE, LLM is not authority", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const fmcsaIds: string[] = [];
  let sambaIds: string[] = [];
  try {
    const beforeCarrier = getCarrierById("CAR-001")!;
    const verified = await verifyCarrierWithFmcsa(admin, {
      fleetId: fleet.id,
      carrierRegistryId: "CAR-001",
      useCache: false,
      provider: new FixtureFmcsaProvider("mismatch"),
    });
    fmcsaIds.push(verified.verification.id);
    const fmcsaBefore = await prisma.fmcsaRegulatoryVerification.findUniqueOrThrow({ where: { id: verified.verification.id } });
    const evaluated = await evaluateSambaIntelligence(admin, fleet.id);
    sambaIds = evaluated.createdIds;
    const fmcsaAfter = await prisma.fmcsaRegulatoryVerification.findUniqueOrThrow({ where: { id: verified.verification.id } });
    assert.equal(fmcsaAfter.result, fmcsaBefore.result);
    assert.equal(getCarrierById("CAR-001")?.authority.status, beforeCarrier.authority.status);
    const conflict = evaluated.findings.find((row) => row.findingType === SAMBA_FINDING_TYPES.FMCSA_CARRIER_CONFLICT);
    assert.ok(conflict);
    assert.notEqual(conflict.provenance, "LIVE");
    assert.equal(conflict.demoReferenceUsed, true);
    assert.equal(conflict.llmUsed, false);
    assert.equal(sambaLlmBoundary().mayAuthorOperationalState, false);
    assert.equal(sambaLlmBoundary().capability, "AI-INTEGRATION-DEPENDENT");
  } finally {
    await cleanupSamba(sambaIds);
    await cleanupFmcsa(fleet.id, fmcsaIds);
  }
});
