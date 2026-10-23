import assert from "node:assert/strict";
import test, { after, before } from "node:test";

import { ConditionCategory, ConditionImpact, ConditionResolutionAuthority, ConditionSeverity } from "@prisma/client";

import { assertTestDatabaseTarget } from "@/lib/test/assertTestDatabaseTarget";

function statusOf(error: unknown) {
  return error && typeof error === "object" && "statusCode" in error
    ? Number((error as { statusCode?: number }).statusCode)
    : 0;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

assertTestDatabaseTarget(process.env.DATABASE_URL);
const stamp = `i8${Date.now().toString(36)}`;

const mod = async () => {
  const { prisma } = await import("@/lib/prisma");
  return {
    prisma,
    fixture: await import("@/lib/test/qualifiedDriverFixture"),
    assignments: await import("@/lib/services/dispatchAssignmentService"),
    releases: await import("@/lib/services/dispatchReleaseService"),
    pickups: await import("@/lib/services/pickupAuthorizationService"),
    equipment: await import("@/lib/services/equipmentService"),
    conditions: await import("@/lib/services/conditionService"),
    preTrip: await import("@/lib/services/preTripService"),
    documents: await import("@/lib/services/documentService"),
    invalidation: await import("@/lib/services/equipmentSafetyInvalidationService"),
  };
};

type Mods = Awaited<ReturnType<typeof mod>>;
type Session = { id: string; email: string; memberships: Array<{ fleetId: string; roleCode: string; status: string }> };
type FleetCtx = {
  fleet: { id: string };
  dispatcher: Session;
  compliance: Session;
  carrierAdmin: Session;
  operations: Session;
  userIds: string[];
};

let m: Mods;
let groupId = "";
let aggregatorId = "";
let A: FleetCtx;
let B: FleetCtx;
const ids = { drivers: [] as string[], loads: [] as string[], equipment: [] as string[], threads: [] as string[] };

async function makeFleet(label: string): Promise<FleetCtx> {
  const { prisma } = m;
  const fleet = await prisma.fleet.create({ data: { slug: `i8-${label}-${stamp}`, name: `I8 ${label} ${stamp}`, carrierGroupId: groupId } });
  const role = (code: string) => prisma.role.upsert({ where: { code }, update: {}, create: { code, name: code } });
  const member = async (name: string, roleCode: string): Promise<Session> => {
    const user = await prisma.user.create({ data: { email: `i8-${label}-${name}-${stamp}@dev.local`, name } });
    await prisma.fleetMembership.create({ data: { userId: user.id, fleetId: fleet.id, roleId: (await role(roleCode)).id, status: "ACTIVE" } });
    return { id: user.id, email: user.email, memberships: [{ fleetId: fleet.id, roleCode, status: "ACTIVE" }] };
  };
  const ctx = {
    fleet,
    dispatcher: await member("dispatch", "DISPATCH"),
    compliance: await member("compliance", "BOF_COMPLIANCE_REVIEW"),
    carrierAdmin: await member("carrier-admin", "FLEET_ADMIN"),
    operations: await member("ops", "BOF_OPERATIONS"),
    userIds: [] as string[],
  };
  ctx.userIds = [ctx.dispatcher.id, ctx.compliance.id, ctx.carrierAdmin.id, ctx.operations.id];
  return ctx;
}

type Chain = {
  driver: { id: string };
  evidence: { intakeId: string; licenseDocumentId: string };
  load: { id: string };
  tractor: { id: string };
  trailer: { id: string };
  assignment: { id: string };
  preTripHeaderId: string;
  pickup: null | { id: string; token: string };
};

async function chain(ctx: FleetCtx, stage: "ASSIGNED" | "RELEASED" | "PICKUP_ISSUED" | "IN_MOTION" = "ASSIGNED"): Promise<Chain> {
  const { prisma } = m;
  const fleetId = ctx.fleet.id;
  const n = ids.drivers.length;
  const driver = await prisma.driver.create({
    data: { fleetId, firstName: "I8", lastName: stamp, email: `i8-drv-${stamp}-${n}@dev.local`, status: "ACTIVE" },
  });
  ids.drivers.push(driver.id);
  const evidence = await m.fixture.createQualifiedDriverEvidence(prisma, { driverId: driver.id, fleetId, complianceUserId: ctx.compliance.id });
  const load = await prisma.load.create({
    data: {
      fleetId,
      customerName: "I8 Shipper",
      origin: "Dallas, TX",
      destination: "Atlanta, GA",
      status: "PLANNED",
      pickupWindowStart: new Date(Date.now() + 3_600_000),
      pickupWindowEnd: new Date(Date.now() + 8 * 3_600_000),
    },
  });
  ids.loads.push(load.id);
  const mkEq = async (equipmentType: "TRACTOR" | "TRAILER") => {
    const row = await prisma.equipment.create({
      data: { fleetId, equipmentType, unitNumber: `I8-${stamp}-${ids.equipment.length}`, status: "AVAILABLE" },
    });
    ids.equipment.push(row.id);
    return row;
  };
  const tractor = await mkEq("TRACTOR");
  const trailer = await mkEq("TRAILER");
  const assignment = await m.assignments.createAssignment(ctx.dispatcher, load.id, driver.id, tractor.id, trailer.id);
  const preTrip = await prisma.preTripHeader.create({
    data: { fleetId, assignmentId: assignment.id, status: "COMPLETED", completedAt: new Date(), completedByUserId: ctx.dispatcher.id },
  });
  await prisma.driverReadinessScore.create({
    data: { driverId: driver.id, fleetId, status: "READY", policyVersion: "i8-test", summary: "i8", score: 90 },
  });
  const result: Chain = {
    driver,
    evidence,
    load,
    tractor,
    trailer,
    assignment,
    preTripHeaderId: preTrip.id,
    pickup: null,
  };
  if (stage === "ASSIGNED") return result;
  const release = await m.releases.createDispatchReleaseWithMovementAuthorization(ctx.dispatcher, load.id, "RELEASE");
  assert.equal(release.movement.allowed, true);
  if (stage === "RELEASED") return result;
  const issued = await m.pickups.issuePickupAuthorization(ctx.dispatcher, load.id);
  result.pickup = { id: issued.authorization.id, token: issued.credential.token };
  if (stage === "PICKUP_ISSUED") return result;
  const verified = await m.pickups.verifyPickupAuthorization(ctx.dispatcher, result.pickup.id, {
    token: result.pickup.token,
    presented: {
      authorizationId: result.pickup.id,
      loadId: load.id,
      driverId: driver.id,
      tractorEquipmentId: tractor.id,
      trailerEquipmentId: trailer.id,
    },
  });
  assert.equal(verified.authorization.status, "RELEASED");
  return result;
}

async function holdException(assignmentId: string) {
  return m.prisma.operatingException.findMany({
    where: { entityType: "DispatchAssignment", entityId: assignmentId, exceptionType: "EQUIPMENT_SAFETY_MOVEMENT_HOLD" },
    include: { actions: true },
  });
}

async function releasesFor(assignmentId: string) {
  return m.prisma.dispatchRelease.findMany({ where: { assignmentId }, orderBy: [{ evaluatedAt: "asc" }, { createdAt: "asc" }] });
}

function verifyPickup(ctx: FleetCtx, c: Chain) {
  return m.pickups.verifyPickupAuthorization(ctx.dispatcher, c.pickup!.id, {
    token: c.pickup!.token,
    presented: {
      authorizationId: c.pickup!.id,
      loadId: c.load.id,
      driverId: c.driver.id,
      tractorEquipmentId: c.tractor.id,
      trailerEquipmentId: c.trailer.id,
    },
  });
}

async function lockWaiters() {
  const rows = await m.prisma.$queryRaw<Array<{ n: bigint }>>`
    SELECT count(*)::bigint AS n FROM pg_locks
    WHERE locktype = 'advisory' AND NOT granted
      AND database = (SELECT oid FROM pg_database WHERE datname = current_database())`;
  return Number(rows[0]?.n ?? 0);
}

async function waitForLockWaiters(count: number, label: string) {
  const deadline = Date.now() + 10_000;
  while ((await lockWaiters()) < count) {
    if (Date.now() > deadline) assert.fail(`${label}: expected ${count} transaction(s) waiting on advisory lock`);
    await sleep(20);
  }
}

async function holdEquipmentLock(equipmentId: string) {
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let markLocked = () => {};
  const locked = new Promise<void>((resolve) => {
    markLocked = resolve;
  });
  const done = m.prisma.$transaction(async (tx) => {
    await m.invalidation.lockEquipmentSafetyWrite(tx, equipmentId);
    markLocked();
    await gate;
  }, { timeout: 30_000 });
  await locked;
  return () => {
    release();
    return done;
  };
}

const MOVEMENT_DISPOSITIONS = ["RELEASED", "CONDITIONALLY_RELEASED"];

before(async () => {
  m = await mod();
  const database = await m.prisma.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
  assert.equal(database[0]?.name, "bof_dev");
  const aggregator = await m.prisma.aggregator.create({ data: { name: `I8 ${stamp}` } });
  aggregatorId = aggregator.id;
  groupId = (await m.prisma.carrierGroup.create({ data: { aggregatorId, name: `I8 ${stamp}` } })).id;
  A = await makeFleet("a");
  B = await makeFleet("b");
});

after(async () => {
  if (!m) return;
  const { prisma } = m;
  const fleets = [A?.fleet.id, B?.fleet.id].filter(Boolean) as string[];
  await prisma.conditionEvent.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.conditionThread.deleteMany({ where: { id: { in: ids.threads } } });
  const chatThreads = await prisma.operationalChatThread.findMany({ where: { tenantId: { in: fleets } }, select: { id: true } });
  await prisma.operationalChatNotification.deleteMany({ where: { tenantId: { in: fleets } } });
  await prisma.operationalChatThread.deleteMany({ where: { id: { in: chatThreads.map((t) => t.id) } } });
  await prisma.operatingCorrectiveAction.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.operatingProcessEvent.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.operatingException.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.auditEvent.deleteMany({ where: { tenantId: { in: fleets } } });
  await prisma.pickupVerificationAttempt.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.pickupAuthorization.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.dispatchRelease.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.preTripDefect.deleteMany({ where: { preTripHeader: { fleetId: { in: fleets } } } });
  await prisma.preTripItem.deleteMany({ where: { preTripHeader: { fleetId: { in: fleets } } } });
  await prisma.preTripHeader.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.dispatchAssignment.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.driverReadinessScore.deleteMany({ where: { driverId: { in: ids.drivers } } });
  await prisma.driverQualificationSnapshot.deleteMany({ where: { driverId: { in: ids.drivers } } });
  await prisma.verificationSource.deleteMany({ where: { driverDocument: { driverId: { in: ids.drivers } } } });
  await m.fixture.cleanupQualifiedDriverEvidence(prisma, ids.drivers);
  await prisma.load.deleteMany({ where: { id: { in: ids.loads } } });
  await prisma.equipment.deleteMany({ where: { id: { in: ids.equipment } } });
  await prisma.driver.deleteMany({ where: { id: { in: ids.drivers } } });
  await prisma.fleetMembership.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: `-${stamp}@dev.local` } } });
  await prisma.fleet.deleteMany({ where: { id: { in: fleets } } });
  await prisma.carrierGroup.deleteMany({ where: { id: groupId } });
  await prisma.aggregator.deleteMany({ where: { id: aggregatorId } });
  await prisma.$disconnect();
});

test("setEquipmentStatus OOS after assignment, release, and pickup issued", async () => {
  const assigned = await chain(A, "ASSIGNED");
  await m.equipment.setEquipmentStatus(A.operations, assigned.tractor.id, "OUT_OF_SERVICE");
  const [holdAssigned] = await holdException(assigned.assignment.id);
  assert.ok(holdAssigned?.actions.some((a) => a.assignedOwnerTeam === "SAFETY"));
  assert.equal((await releasesFor(assigned.assignment.id)).length, 0);

  const released = await chain(A, "RELEASED");
  const releasesBefore = (await releasesFor(released.assignment.id)).length;
  await m.equipment.setEquipmentStatus(A.operations, released.tractor.id, "OUT_OF_SERVICE");
  assert.ok((await releasesFor(released.assignment.id)).length > releasesBefore);
  const latest = (await releasesFor(released.assignment.id)).at(-1)!;
  assert.ok(!MOVEMENT_DISPOSITIONS.includes(latest.disposition));

  const pickup = await chain(A, "PICKUP_ISSUED");
  await m.equipment.setEquipmentStatus(A.operations, pickup.tractor.id, "UNAVAILABLE");
  const cancelled = await m.prisma.pickupAuthorization.findUniqueOrThrow({ where: { id: pickup.pickup!.id } });
  assert.equal(cancelled.status, "CANCELLED");
});

test("safety-critical condition create and reopen invalidate movement", async () => {
  const c = await chain(A, "PICKUP_ISSUED");
  const thread = await m.conditions.createCondition(A.operations, {
    equipmentId: c.tractor.id,
    title: "Brake air leak",
    category: ConditionCategory.SAFETY,
    severity: ConditionSeverity.CRITICAL,
    impact: ConditionImpact.SAFETY_RISK,
    dispatchAssignmentId: c.assignment.id,
    loadId: c.load.id,
  });
  assert.ok(thread);
  ids.threads.push(thread!.id);
  assert.equal((await m.prisma.pickupAuthorization.findUniqueOrThrow({ where: { id: c.pickup!.id } })).status, "CANCELLED");

  const c2 = await chain(A, "PICKUP_ISSUED");
  const resolvedThread = await m.conditions.createCondition(A.operations, {
    equipmentId: c2.tractor.id,
    title: "Resolved then reopened",
    category: ConditionCategory.SAFETY,
    severity: ConditionSeverity.CRITICAL,
    impact: ConditionImpact.SAFETY_RISK,
  });
  assert.ok(resolvedThread);
  ids.threads.push(resolvedThread!.id);
  assert.equal((await m.prisma.pickupAuthorization.findUniqueOrThrow({ where: { id: c2.pickup!.id } })).status, "CANCELLED");
  await m.conditions.verifyResolution(A.compliance, {
    conditionThreadId: resolvedThread!.id,
    authority: ConditionResolutionAuthority.SAFETY,
    notes: "repaired",
  });
  const freshRelease = await m.releases.createDispatchReleaseWithMovementAuthorization(A.dispatcher, c2.load.id, "RELEASE");
  assert.equal(freshRelease.movement.allowed, true);
  const reissued = await m.pickups.issuePickupAuthorization(A.dispatcher, c2.load.id);
  assert.equal(reissued.authorization.status, "PENDING");
  await m.conditions.reopenCondition(A.operations, resolvedThread!.id, "defect returned");
  assert.equal(
    (await m.prisma.pickupAuthorization.findUniqueOrThrow({ where: { id: reissued.authorization.id } })).status,
    "CANCELLED",
  );
});

test("blocking pre-trip defect cancels live pickup", async () => {
  const c = await chain(A, "PICKUP_ISSUED");
  await m.prisma.preTripHeader.update({ where: { id: c.preTripHeaderId }, data: { status: "OPEN", completedAt: null } });
  await m.preTrip.updatePreTripItem(A.dispatcher, c.preTripHeaderId, "tire-check", "FAIL", "tread below minimum");
  assert.equal((await m.prisma.pickupAuthorization.findUniqueOrThrow({ where: { id: c.pickup!.id } })).status, "CANCELLED");
});

test("equipment restoration does not reinstate cancelled pickup", async () => {
  const c = await chain(A, "PICKUP_ISSUED");
  await m.equipment.setEquipmentStatus(A.operations, c.tractor.id, "OUT_OF_SERVICE");
  assert.equal((await m.prisma.pickupAuthorization.findUniqueOrThrow({ where: { id: c.pickup!.id } })).status, "CANCELLED");
  await m.equipment.setEquipmentStatus(A.operations, c.tractor.id, "AVAILABLE");
  assert.equal((await m.prisma.pickupAuthorization.findUniqueOrThrow({ where: { id: c.pickup!.id } })).status, "CANCELLED");
  const fresh = await m.releases.createDispatchReleaseWithMovementAuthorization(A.dispatcher, c.load.id, "RELEASE");
  assert.equal(fresh.movement.allowed, true);
});

test("cross-fleet isolation", async () => {
  const a = await chain(A, "PICKUP_ISSUED");
  const b = await chain(B, "PICKUP_ISSUED");
  await m.equipment.setEquipmentStatus(A.operations, a.tractor.id, "OUT_OF_SERVICE");
  assert.equal((await m.prisma.pickupAuthorization.findUniqueOrThrow({ where: { id: b.pickup!.id } })).status, "PENDING");
  assert.equal((await holdException(b.assignment.id)).length, 0);
});

test("repeat OOS update does not duplicate equipment hold exceptions", async () => {
  const c = await chain(A, "ASSIGNED");
  await m.equipment.setEquipmentStatus(A.operations, c.tractor.id, "OUT_OF_SERVICE");
  await m.equipment.setEquipmentStatus(A.operations, c.tractor.id, "UNAVAILABLE");
  const holds = await holdException(c.assignment.id);
  assert.equal(holds.length, 1);
});

test("concurrent driver rejection and equipment OOS leave no live authorization", async () => {
  const c = await chain(A, "RELEASED");
  await Promise.allSettled([
    m.documents.updateDriverDocumentRecord({
      sessionUser: A.compliance,
      documentId: c.evidence.licenseDocumentId,
      payload: { status: "REJECTED", rejectionReason: "license suspended" },
    }),
    m.equipment.setEquipmentStatus(A.operations, c.tractor.id, "OUT_OF_SERVICE"),
    m.pickups.issuePickupAuthorization(A.dispatcher, c.load.id),
  ]);
  const latest = (await releasesFor(c.assignment.id)).at(-1)!;
  assert.ok(!MOVEMENT_DISPOSITIONS.includes(latest.disposition));
  const live = await m.prisma.pickupAuthorization.count({
    where: { assignmentId: c.assignment.id, status: { in: ["PENDING", "AUTHORIZED"] } },
  });
  assert.equal(live, 0);
});

test("equipment OOS during pickup verification serializes with the equipment lock", async () => {
  const c = await chain(A, "PICKUP_ISSUED");
  const release = await holdEquipmentLock(c.tractor.id);
  const oos = Promise.resolve().then(() => m.equipment.setEquipmentStatus(A.operations, c.tractor.id, "OUT_OF_SERVICE"));
  await waitForLockWaiters(1, "equipment OOS");
  const verification = Promise.resolve().then(() => verifyPickup(A, c));
  await waitForLockWaiters(2, "pickup verify");
  await release();
  await oos;
  const verifyOutcome = await verification.then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, error }),
  );
  const pickup = await m.prisma.pickupAuthorization.findUniqueOrThrow({ where: { id: c.pickup!.id } });
  if (verifyOutcome.ok) {
    assert.notEqual(verifyOutcome.value.authorization.status, "RELEASED");
  } else {
    assert.equal(statusOf(verifyOutcome.error), 409);
  }
  if (pickup.status === "CANCELLED") {
    const latest = (await releasesFor(c.assignment.id)).at(-1)!;
    assert.ok(!MOVEMENT_DISPOSITIONS.includes(latest.disposition));
  }
});

test("in-motion escalation on equipment OOS", async () => {
  const c = await chain(A, "IN_MOTION");
  await m.equipment.setEquipmentStatus(A.operations, c.tractor.id, "OUT_OF_SERVICE");
  const [exception] = await holdException(c.assignment.id);
  assert.equal(exception.severity, "CRITICAL");
  assert.equal((await m.prisma.pickupAuthorization.findUniqueOrThrow({ where: { id: c.pickup!.id } })).status, "RELEASED");
  assert.ok((await releasesFor(c.assignment.id)).length >= 2);
});
