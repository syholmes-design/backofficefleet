import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "@/lib/prisma";
import { getCarrierById } from "@/lib/carrier-registry";
import { FixtureFmcsaProvider } from "@/lib/services/fmcsa/fixtureProvider";
import { verifyCarrierWithFmcsa } from "@/lib/services/fmcsa/fmcsaVerificationService";
import { reconcilePickupPhysicalArrival } from "@/lib/services/pickupPhysicalReconciliationService";
import { issuePickupAuthorization, verifyPickupAuthorization } from "@/lib/services/pickupAuthorizationService";
import { getSambaOperationalContext } from "@/lib/services/samba/sambaContext";
import { evaluateSambaIntelligence, listSambaFindings } from "@/lib/services/samba/sambaIntelligenceService";
import { SAMBA_FINDING_TYPES, SAMBA_PATTERN_TYPES } from "@/lib/services/samba/types";
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

async function snapshotOps(ids: { loadIds: string[]; driverIds: string[]; equipmentIds: string[]; authorizationIds: string[] }) {
  const [loads, drivers, equipment, pickups, physical, settlements] = await Promise.all([
    prisma.load.findMany({ where: { id: { in: ids.loadIds } }, select: { id: true, status: true, updatedAt: true } }),
    prisma.driver.findMany({ where: { id: { in: ids.driverIds } }, select: { id: true, status: true, updatedAt: true } }),
    prisma.equipment.findMany({ where: { id: { in: ids.equipmentIds } }, select: { id: true, status: true, updatedAt: true } }),
    prisma.pickupAuthorization.findMany({ where: { id: { in: ids.authorizationIds } }, select: { id: true, status: true, updatedAt: true } }),
    prisma.pickupPhysicalReconciliation.findMany({
      where: { pickupAuthorizationId: { in: ids.authorizationIds } },
      select: { id: true, disposition: true, updatedAt: true },
    }),
    prisma.settlement.count(),
  ]);
  return { loads, drivers, equipment, pickups, physical, settlements };
}

function assertNoCausalOverstatement(text: string) {
  assert.equal(/caused by|this caused|proves that/i.test(text), false);
}

test("samba2 1: clean successful pickup context is a summary, not a finding", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const pickupIds = emptySecurePickupCertIds();
  let sambaIds: string[] = [];
  try {
    const chain = await createSecurePickupChain(fleet.id, admin.id as string, pickupIds, { tractorVin: "SAMBA2VIN001" });
    const issued = await issuePickupAuthorization(admin, chain.load.id);
    pickupIds.authorizationIds.push(issued.authorization.id);
    await reconcilePickupPhysicalArrival(admin, issued.authorization.id, {
      token: issued.credential.token,
      method: "SHIPPER_DOCK",
      intendedDisposition: "RELEASE",
      arriving: {
        authorizationId: issued.authorization.id,
        loadId: chain.load.id,
        driverId: chain.driver.id,
        tractorId: chain.tractor.id,
        tractorUnitNumber: chain.tractor.unitNumber,
        trailerUnitNumber: chain.trailer.unitNumber,
        vin: "SAMBA2VIN001",
      },
    });
    const evaluated = await evaluateSambaIntelligence(admin, fleet.id);
    sambaIds = evaluated.createdIds;
    assert.equal(
      evaluated.findings.some(
        (row) => row.findingType === SAMBA_FINDING_TYPES.PICKUP_STOPPED && row.entityId === issued.authorization.id,
      ),
      false,
    );
    const context = await getSambaOperationalContext(admin, fleet.id, { authorizationId: issued.authorization.id });
    assert.match(context.summary, /successfully/i);
    assert.match(context.summary, /UNVERIFIED|unverified/i);
    assert.equal(context.mayAuthorOperationalState, false);
    assert.equal(context.authority, "SAMBA_INTELLIGENCE");
    assert.ok(context.relatedEntities.some((row) => row.entityType === "Load" && row.entityId === chain.load.id));
    assert.ok(context.relatedEntities.some((row) => row.entityType === "Driver" && row.entityId === chain.driver.id));
    assert.ok(context.narrative.whatSupportsThis.some((line) => /MATCH|RELEASED|LIVE/i.test(line)));
    assert.match(context.narrative.whatIsNotVerified, /UNVERIFIED/);
    assert.ok(context.recommendedReview);
    assert.equal(context.recommendedReview.executesAction, false);
    assert.ok(context.recommendedReview.workflowHref.includes("/dispatch/pickup"));
    assert.equal(/IDENTITY_PHYSICALLY_VERIFIED/.test(context.summary + context.narrative.whatHappened), false);
    assertNoCausalOverstatement(context.summary + context.narrative.whyItMatters);
  } finally {
    await cleanupSamba(sambaIds);
    await cleanupSecurePickupCertFixtures(pickupIds);
  }
});

test("samba2 2: wrong-driver STOP context recommends pickup review", async () => {
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
        presented: { authorizationId: issued.authorization.id, driverId: "wrong-driver" },
      }),
    );
    const evaluated = await evaluateSambaIntelligence(admin, fleet.id);
    sambaIds = evaluated.createdIds;
    assert.ok(evaluated.findings.some((row) => row.findingType === SAMBA_FINDING_TYPES.PICKUP_STOPPED && row.entityId === issued.authorization.id));
    const context = await getSambaOperationalContext(admin, fleet.id, { authorizationId: issued.authorization.id });
    assert.match(context.narrative.whatHappened, /STOPPED/);
    assert.match(context.narrative.whyItMatters, /related to|may be relevant/i);
    assert.ok(context.recommendedReview?.workflowHref.includes("/dispatch/pickup"));
    assertNoCausalOverstatement(context.narrative.whyItMatters);
  } finally {
    await cleanupSamba(sambaIds);
    await cleanupSecurePickupCertFixtures(pickupIds);
  }
});

test("samba2 3: repeated pickup STOP on the same driver is a pattern, not causation", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const pickupIds = emptySecurePickupCertIds();
  let sambaIds: string[] = [];
  try {
    const first = await createSecurePickupChain(fleet.id, admin.id as string, pickupIds);
    const issued1 = await issuePickupAuthorization(admin, first.load.id);
    pickupIds.authorizationIds.push(issued1.authorization.id);
    await assert.rejects(() =>
      verifyPickupAuthorization(admin, issued1.authorization.id, {
        token: issued1.credential.token,
        presented: { authorizationId: issued1.authorization.id, driverId: "wrong-1" },
      }),
    );
    await prisma.dispatchAssignment.update({
      where: { id: first.assignment.id },
      data: { status: "SUPERSEDED" },
    });

    const secondLoad = await prisma.load.create({
      data: {
        fleetId: fleet.id,
        customerName: "Samba2 Repeat Shipper",
        origin: "Atlanta, GA",
        destination: "Dallas, TX",
        status: "ASSIGNED",
      },
    });
    pickupIds.loadIds.push(secondLoad.id);
    const assignment2 = await prisma.dispatchAssignment.create({
      data: {
        fleetId: fleet.id,
        loadId: secondLoad.id,
        driverId: first.driver.id,
        tractorEquipmentId: first.tractor.id,
        trailerEquipmentId: first.trailer.id,
        status: "ACTIVE",
        assignedByUserId: admin.id as string,
      },
    });
    pickupIds.assignmentIds.push(assignment2.id);
    const release2 = await prisma.dispatchRelease.create({
      data: {
        fleetId: fleet.id,
        loadId: secondLoad.id,
        assignmentId: assignment2.id,
        driverId: first.driver.id,
        tractorEquipmentId: first.tractor.id,
        trailerEquipmentId: first.trailer.id,
        driverReadinessScoreId: first.readinessId,
        disposition: "RELEASED",
        reasonCodes: [],
        summary: "samba2 repeat",
        policyVersion: "samba2",
        evaluatedByUserId: admin.id as string,
      },
    });
    pickupIds.releaseIds.push(release2.id);
    const issued2 = await issuePickupAuthorization(admin, secondLoad.id);
    pickupIds.authorizationIds.push(issued2.authorization.id);
    await assert.rejects(() =>
      verifyPickupAuthorization(admin, issued2.authorization.id, {
        token: issued2.credential.token,
        presented: { authorizationId: issued2.authorization.id, driverId: "wrong-2" },
      }),
    );

    const evaluated = await evaluateSambaIntelligence(admin, fleet.id);
    sambaIds = evaluated.createdIds;
    const pattern = evaluated.findings.find(
      (row) => row.findingType === SAMBA_FINDING_TYPES.PICKUP_REPEATED_STOP && row.entityId === first.driver.id,
    );
    assert.ok(pattern);
    assert.equal(pattern.provenance, "INFERRED");
    assert.equal(pattern.patternType, SAMBA_PATTERN_TYPES.REPEATED_PICKUP_STOP_SAME_DRIVER);
    assert.match(String(pattern.inference), /related|may be relevant/i);
    assertNoCausalOverstatement(`${pattern.explanation} ${pattern.inference}`);
    const context = await getSambaOperationalContext(admin, fleet.id, { driverId: first.driver.id });
    assert.ok(context.repeatedPatterns.some((row) => row.patternType === SAMBA_PATTERN_TYPES.REPEATED_PICKUP_STOP_SAME_DRIVER));
  } finally {
    await cleanupSamba(sambaIds);
    await cleanupSecurePickupCertFixtures(pickupIds);
  }
});

test("samba2 4: driver NOT_READY is correlated to an active pickup assignment", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const pickupIds = emptySecurePickupCertIds();
  let sambaIds: string[] = [];
  try {
    const chain = await createSecurePickupChain(fleet.id, admin.id as string, pickupIds);
    await prisma.driverReadinessScore.update({
      where: { id: chain.readinessId },
      data: { status: "NOT_READY", summary: "samba2 not ready" },
    });
    const evaluated = await evaluateSambaIntelligence(admin, fleet.id);
    sambaIds = evaluated.createdIds;
    assert.ok(evaluated.findings.some((row) => row.findingType === SAMBA_FINDING_TYPES.DRIVER_NOT_READY));
    assert.ok(evaluated.findings.some((row) => row.findingType === SAMBA_FINDING_TYPES.DRIVER_NOT_READY_PICKUP_RELATED && row.entityId === chain.driver.id));
    const context = await getSambaOperationalContext(admin, fleet.id, { loadId: chain.load.id });
    assert.match(context.narrative.whatHappened, /NOT_READY/);
    assert.match(context.narrative.whyItMatters, /related to|may be relevant/i);
    assert.ok(context.recommendedReview?.workflowHref);
  } finally {
    await cleanupSamba(sambaIds);
    await cleanupSecurePickupCertFixtures(pickupIds);
  }
});

test("samba2 5: open equipment condition is correlated to pickup/assignment", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const pickupIds = emptySecurePickupCertIds();
  let sambaIds: string[] = [];
  let conditionId: string | null = null;
  try {
    const chain = await createSecurePickupChain(fleet.id, admin.id as string, pickupIds);
    const thread = await prisma.conditionThread.create({
      data: {
        fleetId: fleet.id,
        equipmentId: chain.tractor.id,
        title: "Samba2 cert condition",
        category: "STRUCTURAL",
        severity: "BLOCKING",
        observationSource: "DISPATCH",
        lifecycleState: "IDENTIFIED",
        createdByUserId: admin.id as string,
      },
    });
    conditionId = thread.id;
    const evaluated = await evaluateSambaIntelligence(admin, fleet.id);
    sambaIds = evaluated.createdIds;
    assert.ok(evaluated.findings.some((row) => row.findingType === SAMBA_FINDING_TYPES.EQUIPMENT_CONDITION_OPEN && row.entityId === thread.id));
    const related = evaluated.findings.find((row) => row.findingType === SAMBA_FINDING_TYPES.EQUIPMENT_CONDITION_PICKUP_RELATED && row.entityId === thread.id);
    assert.ok(related);
    assert.match(String(related.inference), /may be operationally relevant|related/i);
    assertNoCausalOverstatement(String(related.inference));
  } finally {
    await cleanupSamba(sambaIds);
    if (conditionId) {
      await prisma.conditionEvent.deleteMany({ where: { conditionThreadId: conditionId } });
      await prisma.conditionThread.deleteMany({ where: { id: conditionId } });
    }
    await cleanupSecurePickupCertFixtures(pickupIds);
  }
});

test("samba2 6: FMCSA conflict context stays DEMO_REFERENCE overlay", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const fmcsaIds: string[] = [];
  let sambaIds: string[] = [];
  try {
    const beforeName = getCarrierById("CAR-001")!.legalName;
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
    assert.ok(evaluated.findings.some((row) => row.findingType === SAMBA_FINDING_TYPES.FMCSA_CARRIER_CONFLICT));
    assert.ok(evaluated.findings.some((row) => row.findingType === SAMBA_FINDING_TYPES.FMCSA_CARRIER_WORKFLOW_RELATED));
    const context = await getSambaOperationalContext(admin, fleet.id, { carrierRegistryId: "CAR-001" });
    assert.ok(context.relatedEntities.some((row) => row.authority === "DEMO_REFERENCE"));
    assert.ok(context.missingEvidence.some((row) => /INSUFFICIENT_EVIDENCE|no stored carrier foreign key/i.test(row)));
    assert.equal(context.recommendedReview?.workflowHref, "/carriers/CAR-001");
    assert.equal(getCarrierById("CAR-001")?.legalName, beforeName);
  } finally {
    await cleanupSamba(sambaIds);
    await cleanupFmcsa(fleet.id, fmcsaIds);
  }
});

test("samba2 7: stale evidence keeps STALE temporal context", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const fmcsaIds: string[] = [];
  let sambaIds: string[] = [];
  const previous = process.env.BOF_FMCSA_CACHE_STALE_AFTER_MS;
  process.env.BOF_FMCSA_CACHE_STALE_AFTER_MS = "1";
  try {
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
    const finding = evaluated.findings.find((row) => row.findingType === SAMBA_FINDING_TYPES.FMCSA_STALE_EVIDENCE);
    assert.ok(finding);
    assert.equal(finding.evidenceFreshness, "STALE");
    const context = await getSambaOperationalContext(admin, fleet.id, { carrierRegistryId: "CAR-001" });
    assert.ok(context.relatedEntities.some((row) => row.temporalLabel === "STALE" || row.entityType === "FmcsaRegulatoryVerification"));
    assert.match(context.narrative.whatHappened, /STALE/);
  } finally {
    if (previous === undefined) delete process.env.BOF_FMCSA_CACHE_STALE_AFTER_MS;
    else process.env.BOF_FMCSA_CACHE_STALE_AFTER_MS = previous;
    await cleanupSamba(sambaIds);
    await cleanupFmcsa(fleet.id, fmcsaIds);
  }
});

test("samba2 8: missing entity query is INSUFFICIENT_EVIDENCE", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const context = await getSambaOperationalContext(admin, fleet.id, { loadId: "missing-load-id-samba2" });
  assert.equal(context.provenance, "INSUFFICIENT_EVIDENCE");
  assert.ok(context.missingEvidence.length > 0);
  assert.match(context.narrative.whatHappened, /INSUFFICIENT_EVIDENCE/);
  assert.equal(context.mayAuthorOperationalState, false);
});

test("samba2 9-15: provenance, isolation, RBAC, no mutation, workflow, temporal, no causation", async () => {
  requireIsolatedTestDatabase();
  const { fleet, admin } = await requireCertOperator();
  const pickupIds = emptySecurePickupCertIds();
  let sambaIds: string[] = [];
  let extraUserIds: string[] = [];
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
    const before = await snapshotOps(pickupIds);
    const settlementBefore = before.settlements;
    const evaluated = await evaluateSambaIntelligence(admin, fleet.id);
    sambaIds = evaluated.createdIds;
    const finding = evaluated.findings.find((row) => row.entityId === issued.authorization.id);
    assert.ok(finding);
    const statements = finding.statements as Array<{ class: string }>;
    assert.ok(statements.some((row) => row.class === "FACT"));
    assert.ok(statements.some((row) => row.class === "RECOMMENDATION"));
    assert.ok(finding.workflowHref);
    const context = await getSambaOperationalContext(admin, fleet.id, { authorizationId: issued.authorization.id });
    assert.ok(context.recentEvents.every((event) => ["CURRENT", "RECENT", "HISTORICAL", "STALE", "UNAVAILABLE"].includes(event.temporalLabel)));
    assertNoCausalOverstatement(context.narrative.whyItMatters + finding.explanation);

    const after = await snapshotOps(pickupIds);
    assert.deepEqual(after.loads, before.loads);
    assert.deepEqual(after.drivers, before.drivers);
    assert.deepEqual(after.equipment, before.equipment);
    assert.deepEqual(after.pickups, before.pickups);
    assert.deepEqual(after.physical, before.physical);
    assert.equal(after.settlements, settlementBefore);
    assert.equal(evaluated.mutatedOperationalRecords, false);

    const fleetB = await prisma.fleet.findUniqueOrThrow({ where: { slug: "fleet-b" } });
    const adminRole = await prisma.role.findUniqueOrThrow({ where: { code: "FLEET_ADMIN" } });
    const driverRole = await prisma.role.findUniqueOrThrow({ where: { code: "DRIVER" } });
    const other = await prisma.user.create({
      data: {
        email: `samba2-b-${Date.now()}@dev.local`,
        status: "ACTIVE",
        memberships: { create: { fleetId: fleetB.id, roleId: adminRole.id, status: "ACTIVE" } },
      },
      include: { memberships: { include: { role: true } } },
    });
    const driver = await prisma.user.create({
      data: {
        email: `samba2-driver-${Date.now()}@dev.local`,
        status: "ACTIVE",
        memberships: { create: { fleetId: fleet.id, roleId: driverRole.id, status: "ACTIVE" } },
      },
      include: { memberships: { include: { role: true } } },
    });
    extraUserIds = [other.id, driver.id];
    await assert.rejects(() => getSambaOperationalContext(asSessionUser(other), fleet.id, {}), (caught: unknown) => pickupHttpError(caught).statusCode === 403);
    await assert.rejects(() => evaluateSambaIntelligence(asSessionUser(driver), fleet.id), (caught: unknown) => pickupHttpError(caught).statusCode === 403);
    const otherList = await listSambaFindings(asSessionUser(other), fleetB.id);
    assert.equal(otherList.findings.some((row) => sambaIds.includes(row.id)), false);
  } finally {
    await cleanupSamba(sambaIds);
    await cleanupSecurePickupCertFixtures(pickupIds);
    if (extraUserIds.length) {
      await prisma.fleetMembership.deleteMany({ where: { userId: { in: extraUserIds } } });
      await prisma.user.deleteMany({ where: { id: { in: extraUserIds } } });
    }
  }
});
