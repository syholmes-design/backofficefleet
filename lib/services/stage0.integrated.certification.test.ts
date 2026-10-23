import assert from "node:assert/strict";
import test, { after, before } from "node:test";

import { assertTestDatabaseTarget } from "@/lib/test/assertTestDatabaseTarget";

/**
 * Stage 0 I-9: integrated certification across I-1..I-8. The full movement lifecycle on the real services:
 * driver qualification → equipment safety → assignment → release → pickup issue → pickup verify → movement →
 * post-authorization invalidation, plus the cross-cutting concurrency, atomicity and isolation properties.
 * Runs against the isolated bof_dev database only.
 */
assertTestDatabaseTarget(process.env.DATABASE_URL);
const stamp = `i9${Date.now().toString(36)}`;

function statusOf(error: unknown) {
  return error && typeof error === "object" && "statusCode" in error
    ? Number((error as { statusCode?: number }).statusCode)
    : 0;
}

function isDeadlock(error: unknown) {
  const text = `${(error as { code?: string } | null)?.code ?? ""} ${error instanceof Error ? error.message : String(error)}`;
  return /40P01|P2034|deadlock/i.test(text);
}

const load = async () => {
  const { prisma } = await import("@/lib/prisma");
  return {
    prisma,
    fixture: await import("@/lib/test/qualifiedDriverFixture"),
    documents: await import("@/lib/services/documentService"),
    assignments: await import("@/lib/services/dispatchAssignmentService"),
    releases: await import("@/lib/services/dispatchReleaseService"),
    pickups: await import("@/lib/services/pickupAuthorizationService"),
    physical: await import("@/lib/services/pickupPhysicalReconciliationService"),
    equipment: await import("@/lib/services/equipmentService"),
    conditions: await import("@/lib/services/conditionService"),
    driverInvalidation: await import("@/lib/services/driverMovementInvalidationService"),
    equipmentInvalidation: await import("@/lib/services/equipmentSafetyInvalidationService"),
  };
};

type Mods = Awaited<ReturnType<typeof load>>;
type Session = { id: string; email: string; memberships: Array<{ fleetId: string; roleCode: string; status: string }> };
type FleetCtx = { fleet: { id: string }; dispatcher: Session; compliance: Session; carrierAdmin: Session; userIds: string[] };
type Chain = {
  driver: { id: string };
  evidence: { intakeId: string; licenseDocumentId: string };
  load: { id: string };
  tractor: { id: string; unitNumber: string; vin: string | null };
  trailer: { id: string; unitNumber: string };
  assignment: { id: string };
  pickup: null | { id: string; token: string };
};

let m: Mods;
let groupId = "";
let aggregatorId = "";
let A: FleetCtx;
let B: FleetCtx;
const ids = { drivers: [] as string[], loads: [] as string[], equipment: [] as string[] };
const MOVEMENT_DISPOSITIONS = ["RELEASED", "CONDITIONALLY_RELEASED"];

async function makeFleet(label: string): Promise<FleetCtx> {
  const { prisma } = m;
  const fleet = await prisma.fleet.create({ data: { slug: `i9-${label}-${stamp}`, name: `I9 ${label} ${stamp}`, carrierGroupId: groupId } });
  const member = async (name: string, roleCode: string): Promise<Session> => {
    const role = await prisma.role.upsert({ where: { code: roleCode }, update: {}, create: { code: roleCode, name: roleCode } });
    const user = await prisma.user.create({ data: { email: `i9-${label}-${name}-${stamp}@dev.local`, name } });
    await prisma.fleetMembership.create({ data: { userId: user.id, fleetId: fleet.id, roleId: role.id, status: "ACTIVE" } });
    return { id: user.id, email: user.email, memberships: [{ fleetId: fleet.id, roleCode, status: "ACTIVE" }] };
  };
  const ctx = {
    fleet,
    dispatcher: await member("dispatch", "DISPATCH"),
    compliance: await member("compliance", "BOF_COMPLIANCE_REVIEW"),
    carrierAdmin: await member("carrier-admin", "FLEET_ADMIN"),
    userIds: [] as string[],
  };
  ctx.userIds = [ctx.dispatcher.id, ctx.compliance.id, ctx.carrierAdmin.id];
  return ctx;
}

async function chain(ctx: FleetCtx, stage: "ASSIGNED" | "RELEASED" | "PICKUP_ISSUED" = "ASSIGNED"): Promise<Chain> {
  const { prisma } = m;
  const fleetId = ctx.fleet.id;
  const n = ids.drivers.length;
  const driver = await prisma.driver.create({ data: { fleetId, firstName: "I9", lastName: stamp, email: `i9-drv-${stamp}-${n}@dev.local`, status: "ACTIVE" } });
  ids.drivers.push(driver.id);
  const evidence = await m.fixture.createQualifiedDriverEvidence(prisma, { driverId: driver.id, fleetId, complianceUserId: ctx.compliance.id });
  const loadRow = await prisma.load.create({
    data: {
      fleetId, customerName: "I9 Shipper", origin: "Dallas, TX", destination: "Atlanta, GA", status: "PLANNED",
      pickupWindowStart: new Date(Date.now() + 3_600_000), pickupWindowEnd: new Date(Date.now() + 8 * 3_600_000),
    },
  });
  ids.loads.push(loadRow.id);
  const tractor = await prisma.equipment.create({ data: { fleetId, equipmentType: "TRACTOR", unitNumber: `I9T-${stamp}-${n}`, vin: `1XPBDP9X0I9${String(n).padStart(6, "0")}`, status: "AVAILABLE" } });
  const trailer = await prisma.equipment.create({ data: { fleetId, equipmentType: "TRAILER", unitNumber: `I9L-${stamp}-${n}`, status: "AVAILABLE" } });
  ids.equipment.push(tractor.id, trailer.id);
  const assignment = await m.assignments.createAssignment(ctx.dispatcher, loadRow.id, driver.id, tractor.id, trailer.id);
  await prisma.preTripHeader.create({ data: { fleetId, assignmentId: assignment.id, status: "COMPLETED", completedAt: new Date(), completedByUserId: ctx.dispatcher.id } });
  await prisma.driverReadinessScore.create({ data: { driverId: driver.id, fleetId, status: "READY", policyVersion: "i9-test", summary: "i9", score: 90 } });
  const result: Chain = { driver, evidence: evidence, load: loadRow, tractor, trailer, assignment, pickup: null };
  if (stage === "ASSIGNED") return result;
  const release = await m.releases.createDispatchReleaseWithMovementAuthorization(ctx.dispatcher, loadRow.id, "RELEASE");
  assert.equal(release.movement.allowed, true, "fixture must be release-ready");
  if (stage === "RELEASED") return result;
  const issued = await m.pickups.issuePickupAuthorization(ctx.dispatcher, loadRow.id);
  result.pickup = { id: issued.authorization.id, token: issued.credential.token };
  return result;
}

const presentedFor = (c: Chain) => ({
  authorizationId: c.pickup!.id, loadId: c.load.id, driverId: c.driver.id, tractorEquipmentId: c.tractor.id, trailerEquipmentId: c.trailer.id,
});
const verify = (ctx: FleetCtx, c: Chain, presented = true) =>
  m.pickups.verifyPickupAuthorization(ctx.dispatcher, c.pickup!.id, { token: c.pickup!.token, ...(presented ? { presented: presentedFor(c) } : {}) });
const reconcile = (ctx: FleetCtx, c: Chain) =>
  m.physical.reconcilePickupPhysicalArrival(ctx.dispatcher, c.pickup!.id, {
    token: c.pickup!.token,
    method: "SHIPPER_DOCK",
    arriving: {
      authorizationId: c.pickup!.id, loadId: c.load.id, driverId: c.driver.id, tractorId: c.tractor.id, trailerId: c.trailer.id,
      tractorUnitNumber: c.tractor.unitNumber, trailerUnitNumber: c.trailer.unitNumber, vin: c.tractor.vin, qr: c.tractor.unitNumber,
    },
    evidenceReference: `i9-dock-${c.pickup!.id}`,
    intendedDisposition: "RELEASE",
  });
const rejectLicense = (ctx: FleetCtx, c: Chain) =>
  m.documents.updateDriverDocumentRecord({ sessionUser: ctx.compliance, documentId: c.evidence.licenseDocumentId, payload: { status: "REJECTED", rejectionReason: "license suspended" } });
const releasesFor = (assignmentId: string) => m.prisma.dispatchRelease.findMany({ where: { assignmentId }, orderBy: [{ evaluatedAt: "asc" }, { createdAt: "asc" }] });
const pickupStatus = async (id: string) => (await m.prisma.pickupAuthorization.findUniqueOrThrow({ where: { id } })).status;
const holds = (assignmentId: string) =>
  m.prisma.operatingException.findMany({ where: { entityType: "DispatchAssignment", entityId: assignmentId }, include: { actions: true }, orderBy: { createdAt: "asc" } });
const criticalCondition = (ctx: FleetCtx, equipmentId: string, title: string) =>
  m.conditions.createCondition(ctx.dispatcher, { equipmentId, title, category: "SAFETY", severity: "CRITICAL" });

before(async () => {
  m = await load();
  const database = await m.prisma.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
  assert.equal(database[0]?.name, "bof_dev");
  aggregatorId = (await m.prisma.aggregator.create({ data: { name: `I9 ${stamp}` } })).id;
  groupId = (await m.prisma.carrierGroup.create({ data: { aggregatorId, name: `I9 ${stamp}` } })).id;
  A = await makeFleet("a");
  B = await makeFleet("b");
});

after(async () => {
  if (!m) return;
  const { prisma } = m;
  const fleets = [A?.fleet.id, B?.fleet.id].filter(Boolean) as string[];
  await prisma.operationalChatNotification.deleteMany({ where: { tenantId: { in: fleets } } });
  await prisma.operationalChatThread.deleteMany({ where: { tenantId: { in: fleets } } });
  await prisma.operatingCorrectiveAction.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.operatingProcessEvent.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.operatingException.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.auditEvent.deleteMany({ where: { tenantId: { in: fleets } } });
  await prisma.pickupPhysicalReconciliation.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.pickupVerificationAttempt.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.pickupAuthorization.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.dispatchRelease.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.conditionEvent.deleteMany({ where: { conditionThread: { fleetId: { in: fleets } } } });
  await prisma.conditionThread.deleteMany({ where: { fleetId: { in: fleets } } });
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
});

test("full lifecycle: authoritative evaluators gate every stage, then driver and equipment changes escalate the moving shipment once each", async () => {
  const c = await chain(A, "PICKUP_ISSUED");

  // Assignment and releases carry the Stage 0 policy versions of the authoritative evaluators.
  const created = await m.prisma.auditEvent.findFirst({ where: { entityType: "DispatchAssignment", entityId: c.assignment.id, action: "CREATED" } });
  const createdDetails = created?.details as Record<string, unknown>;
  assert.equal(createdDetails.driverQualificationPolicyVersion, "bof-stage0-driver-qualification-v1");
  assert.equal(createdDetails.movementPolicyVersion, "bof-stage0-movement-v1");
  const issuedReleases = await releasesFor(c.assignment.id);
  assert.equal(issuedReleases.length, 2, "RELEASE and PICKUP_ISSUE evaluations are both recorded");
  assert.ok(issuedReleases.every((release) => MOVEMENT_DISPOSITIONS.includes(release.disposition)));

  // Pickup verification: credential first (AUTHORIZED), then presented identities (RELEASED = movement).
  assert.equal((await verify(A, c, false)).authorization.status, "AUTHORIZED");
  assert.equal((await verify(A, c)).authorization.status, "RELEASED");

  // Post-authorization: driver disqualified while moving.
  await rejectLicense(A, c);
  // Post-authorization: tractor placed out of service while moving.
  await m.equipment.setEquipmentStatus(A.dispatcher, c.tractor.id, "OUT_OF_SERVICE");
  // A further equipment downgrade while the hold is open adds no new hold.
  await m.equipment.setEquipmentStatus(A.dispatcher, c.tractor.id, "UNAVAILABLE");

  assert.equal(await pickupStatus(c.pickup!.id), "RELEASED", "the moving shipment's record is not rewritten");
  assert.equal((await m.prisma.dispatchAssignment.findUniqueOrThrow({ where: { id: c.assignment.id } })).status, "ACTIVE");
  const exceptions = await holds(c.assignment.id);
  assert.deepEqual(exceptions.map((e) => e.exceptionType).sort(), ["DRIVER_QUALIFICATION_MOVEMENT_HOLD", "EQUIPMENT_SAFETY_MOVEMENT_HOLD"]);
  for (const exception of exceptions) {
    assert.equal(exception.severity, "CRITICAL");
    const owners = exception.actions.map((a) => `${a.assignedOwnerTeam}:${a.actionType}`).sort();
    const correctiveOwner = exception.exceptionType === "DRIVER_QUALIFICATION_MOVEMENT_HOLD" ? "COMPLIANCE:RESOLVE_DRIVER_QUALIFICATION" : "SAFETY:RESOLVE_EQUIPMENT_SAFETY";
    assert.deepEqual(owners, [correctiveOwner, "DISPATCH:DOCUMENT_OPERATIONAL_DISPOSITION"].sort());
  }
  const after = await releasesFor(c.assignment.id);
  assert.deepEqual(after.slice(0, issuedReleases.length), issuedReleases, "historical releases are preserved unchanged");
  assert.ok(!MOVEMENT_DISPOSITIONS.includes(after.at(-1)!.disposition));
});

test("unsafe equipment cannot receive valid movement authorization", async () => {
  // Out of service at planning.
  const oos = await m.prisma.equipment.create({ data: { fleetId: A.fleet.id, equipmentType: "TRACTOR", unitNumber: `I9X-${stamp}`, status: "OUT_OF_SERVICE" } });
  ids.equipment.push(oos.id);
  const planned = await chain(A, "ASSIGNED");
  const spareLoad = await m.prisma.load.create({ data: { fleetId: A.fleet.id, customerName: "I9", origin: "A", destination: "B", status: "PLANNED" } });
  ids.loads.push(spareLoad.id);
  await m.assignments.unassign(A.dispatcher, planned.assignment.id, "CANCELLED");
  await assert.rejects(() => m.assignments.createAssignment(A.dispatcher, spareLoad.id, planned.driver.id, oos.id, null), (e: unknown) => statusOf(e) === 422);

  // UNAVAILABLE, a safety-critical condition, and a blocking pre-trip defect each deny RELEASE.
  const unavailable = await chain(A, "ASSIGNED");
  await m.prisma.equipment.update({ where: { id: unavailable.tractor.id }, data: { status: "UNAVAILABLE" } });
  const r1 = await m.releases.createDispatchReleaseWithMovementAuthorization(A.dispatcher, unavailable.load.id, "RELEASE");
  assert.equal(r1.movement.allowed, false);
  assert.ok(r1.movement.reasonCodes.includes("TRUCK_UNAVAILABLE"));

  const conditioned = await chain(A, "ASSIGNED");
  await criticalCondition(A, conditioned.trailer.id, "Brake line leak");
  const r2 = await m.releases.createDispatchReleaseWithMovementAuthorization(A.dispatcher, conditioned.load.id, "RELEASE");
  assert.equal(r2.movement.allowed, false);
  assert.ok(r2.movement.reasonCodes.includes("SAFETY_CRITICAL_CONDITION"));

  const defective = await chain(A, "ASSIGNED");
  const header = await m.prisma.preTripHeader.findFirstOrThrow({ where: { assignmentId: defective.assignment.id } });
  const item = await m.prisma.preTripItem.create({ data: { preTripHeaderId: header.id, sectionCode: "BRAKES", itemCode: "SERVICE_BRAKES", isCritical: true, status: "FAIL" } });
  await m.prisma.preTripDefect.create({ data: { preTripHeaderId: header.id, preTripItemId: item.id, itemCode: "SERVICE_BRAKES", severity: "BLOCKING", requiresRepair: true, description: "No air pressure" } });
  const r3 = await m.releases.createDispatchReleaseWithMovementAuthorization(A.dispatcher, defective.load.id, "RELEASE");
  assert.equal(r3.movement.allowed, false);
  assert.ok(r3.movement.reasonCodes.includes("PRETRIP_DEFECT"));
});

test("equipment changes after authorization cancel live pickups; restoration never resurrects them", async () => {
  const c = await chain(A, "PICKUP_ISSUED");
  await m.equipment.setEquipmentStatus(A.dispatcher, c.trailer.id, "OUT_OF_SERVICE");
  assert.equal(await pickupStatus(c.pickup!.id), "CANCELLED");

  await m.equipment.setEquipmentStatus(A.carrierAdmin, c.trailer.id, "AVAILABLE");
  assert.equal(await pickupStatus(c.pickup!.id), "CANCELLED", "restoring equipment does not reinstate the authorization");
  await assert.rejects(() => verify(A, c), (e: unknown) => statusOf(e) === 409);
  assert.equal(await pickupStatus(c.pickup!.id), "CANCELLED", "a refused verify does not overwrite the cancellation");

  // Fresh authorization is required and works once the equipment is safe again.
  const fresh = await m.releases.createDispatchReleaseWithMovementAuthorization(A.dispatcher, c.load.id, "RELEASE");
  assert.equal(fresh.movement.allowed, true);
  const reissued = await m.pickups.issuePickupAuthorization(A.dispatcher, c.load.id);
  assert.notEqual(reissued.authorization.id, c.pickup!.id);

  // A safety-critical condition opened after release appends a blocked release after the kept ones.
  const d = await chain(A, "RELEASED");
  const before = await releasesFor(d.assignment.id);
  await criticalCondition(A, d.tractor.id, "Steering play");
  const afterCondition = await releasesFor(d.assignment.id);
  assert.equal(afterCondition.length, before.length + 1);
  assert.deepEqual(afterCondition.slice(0, before.length), before);
  assert.ok((afterCondition.at(-1)!.reasonCodes as string[]).includes("SAFETY_CRITICAL_CONDITION"));
});

test("failed transactions leave no partial authorization or invalidation records", async () => {
  // Denied pickup issue rolls back its PICKUP_ISSUE evaluation and creates no authorization.
  const denied = await chain(A, "RELEASED");
  const releasesBefore = (await releasesFor(denied.assignment.id)).length;
  await m.prisma.equipment.update({ where: { id: denied.tractor.id }, data: { status: "UNAVAILABLE" } });
  await assert.rejects(() => m.pickups.issuePickupAuthorization(A.dispatcher, denied.load.id), (e: unknown) => statusOf(e) === 409);
  assert.equal(await m.prisma.pickupAuthorization.count({ where: { assignmentId: denied.assignment.id } }), 0);
  assert.equal((await releasesFor(denied.assignment.id)).length, releasesBefore);

  // An equipment change whose transaction fails after invalidation leaves nothing behind.
  const eq = await chain(A, "PICKUP_ISSUED");
  const eqReleases = (await releasesFor(eq.assignment.id)).length;
  await assert.rejects(() =>
    m.prisma.$transaction(async (tx) => {
      await m.equipmentInvalidation.lockEquipmentSafetyWrite(tx, eq.tractor.id);
      await tx.equipment.update({ where: { id: eq.tractor.id }, data: { status: "OUT_OF_SERVICE" } });
      const outcomes = await m.equipmentInvalidation.invalidateEquipmentMovementAuthorizations(tx, {
        equipmentIds: [eq.tractor.id], actor: A.dispatcher, trigger: "EQUIPMENT_OUT_OF_SERVICE",
      });
      assert.equal(outcomes.length, 1);
      throw new Error("injected failure after invalidation");
    }),
  /injected failure/);
  assert.equal((await m.prisma.equipment.findUniqueOrThrow({ where: { id: eq.tractor.id } })).status, "AVAILABLE");
  assert.equal(await pickupStatus(eq.pickup!.id), "PENDING");
  assert.equal((await releasesFor(eq.assignment.id)).length, eqReleases);
  assert.equal((await holds(eq.assignment.id)).length, 0);
  assert.equal(await m.prisma.operationalChatThread.count({ where: { tenantId: A.fleet.id, subject: { contains: eq.load.id } } }), 0);

  // Same for a driver qualification change.
  const dr = await chain(A, "PICKUP_ISSUED");
  const drReleases = (await releasesFor(dr.assignment.id)).length;
  await assert.rejects(() =>
    m.prisma.$transaction(async (tx) => {
      await tx.driverDocument.update({ where: { id: dr.evidence.licenseDocumentId }, data: { status: "REJECTED" } });
      const outcomes = await m.driverInvalidation.invalidateDriverMovementAuthorizations(tx, { driverId: dr.driver.id, actor: A.compliance, trigger: "TEST" });
      assert.equal(outcomes.length, 1);
      throw new Error("injected failure after invalidation");
    }),
  /injected failure/);
  assert.equal(await pickupStatus(dr.pickup!.id), "PENDING");
  assert.equal((await releasesFor(dr.assignment.id)).length, drReleases);
  assert.equal((await holds(dr.assignment.id)).length, 0);
});

test("concurrent driver, equipment and authorization operations do not deadlock or leave valid stale authorizations", async () => {
  const rounds = 4;
  for (let round = 0; round < rounds; round += 1) {
    const c = await chain(A, "PICKUP_ISSUED");
    const outcomes = await Promise.allSettled([
      rejectLicense(A, c),
      m.equipment.setEquipmentStatus(A.dispatcher, c.tractor.id, "OUT_OF_SERVICE"),
      criticalCondition(A, c.trailer.id, `Round ${round} tire failure`),
      verify(A, c),
      m.releases.createDispatchReleaseWithMovementAuthorization(A.dispatcher, c.load.id, "RELEASE"),
      m.pickups.issuePickupAuthorization(A.dispatcher, c.load.id),
    ]);
    for (const outcome of outcomes) {
      if (outcome.status === "rejected") {
        assert.ok(!isDeadlock(outcome.reason), `round ${round}: deadlock ${String(outcome.reason)}`);
        assert.ok([403, 409, 422].includes(statusOf(outcome.reason)), `round ${round}: unexpected failure ${String(outcome.reason)}`);
      }
    }
    // The eligibility changes always commit.
    assert.equal(outcomes[0].status, "fulfilled");
    assert.equal(outcomes[1].status, "fulfilled");
    assert.equal(outcomes[2].status, "fulfilled");
    const latest = (await releasesFor(c.assignment.id)).at(-1)!;
    assert.ok(!MOVEMENT_DISPOSITIONS.includes(latest.disposition), `round ${round}: latest release still authorizes movement`);
    const live = await m.prisma.pickupAuthorization.count({ where: { assignmentId: c.assignment.id, status: { in: ["PENDING", "AUTHORIZED"] } } });
    assert.equal(live, 0, `round ${round}: a live pickup authorization survived`);
    const moving = await m.prisma.pickupAuthorization.count({ where: { assignmentId: c.assignment.id, status: "RELEASED" } });
    if (moving > 0) {
      const exceptions = await holds(c.assignment.id);
      assert.ok(exceptions.length > 0 && exceptions.every((e) => e.severity === "CRITICAL"), `round ${round}: movement without critical escalation`);
    }
    // One open hold per cause at most.
    const exceptions = await holds(c.assignment.id);
    assert.equal(new Set(exceptions.map((e) => e.exceptionType)).size, exceptions.length);
  }
});

test("fleet isolation: another fleet cannot change equipment and is never affected or notified", async () => {
  const a = await chain(A, "PICKUP_ISSUED");
  const b = await chain(B, "PICKUP_ISSUED");
  await assert.rejects(() => m.equipment.setEquipmentStatus(B.dispatcher, a.tractor.id, "AVAILABLE"), (e: unknown) => statusOf(e) === 403);
  await m.equipment.setEquipmentStatus(A.dispatcher, a.tractor.id, "OUT_OF_SERVICE");
  assert.equal(await pickupStatus(a.pickup!.id), "CANCELLED");
  assert.equal(await pickupStatus(b.pickup!.id), "PENDING");
  assert.equal((await holds(b.assignment.id)).length, 0);
  const notifiedInB = await m.prisma.operationalChatNotification.count({ where: { userId: { in: B.userIds } } });
  assert.equal(notifiedInB, 0);
  const [hold] = await holds(a.assignment.id);
  assert.equal(hold.fleetId, A.fleet.id);
});

test(
  "physical pickup reconciliation is gated by the authoritative movement evaluation (contract C7)",
  async () => {
    // A credential lapses without a write; the scheduled sweep has not run yet.
    const c = await chain(A, "PICKUP_ISSUED");
    await m.prisma.driverDocument.update({ where: { id: c.evidence.licenseDocumentId }, data: { verificationExpiresAt: new Date(Date.now() - 86_400_000) } });
    // The authoritative pickup gate refuses: the driver is no longer qualified.
    const twin = await chain(A, "PICKUP_ISSUED");
    await m.prisma.driverDocument.update({ where: { id: twin.evidence.licenseDocumentId }, data: { verificationExpiresAt: new Date(Date.now() - 86_400_000) } });
    await assert.rejects(() => verify(A, twin), (e: unknown) => statusOf(e) === 409, "control: verifyPickupAuthorization refuses");
    // Physical reconciliation must refuse as well.
    await assert.rejects(() => reconcile(A, c), (e: unknown) => statusOf(e) === 409, "reconcilePickupPhysicalArrival must refuse a driver who is no longer qualified");
    assert.notEqual(await pickupStatus(c.pickup!.id), "RELEASED");
  },
);

test(
  "physical pickup reconciliation cannot release on equipment made unsafe after the pickup was issued",
  async () => {
    const c = await chain(A, "PICKUP_ISSUED");
    // An open safety-critical condition recorded directly (no invalidation trigger fired) must still stop release.
    await m.prisma.conditionThread.create({
      data: { fleetId: A.fleet.id, equipmentId: c.tractor.id, title: "Cracked frame", category: "SAFETY", severity: "CRITICAL", observationSource: "DRIVER", lifecycleState: "IDENTIFIED", createdByUserId: A.dispatcher.id },
    });
    await assert.rejects(() => verify(A, { ...c }, true), (e: unknown) => statusOf(e) === 409, "control: verifyPickupAuthorization refuses");
    const d = await chain(A, "PICKUP_ISSUED");
    await m.prisma.conditionThread.create({
      data: { fleetId: A.fleet.id, equipmentId: d.tractor.id, title: "Cracked frame", category: "SAFETY", severity: "CRITICAL", observationSource: "DRIVER", lifecycleState: "IDENTIFIED", createdByUserId: A.dispatcher.id },
    });
    await assert.rejects(() => reconcile(A, d), (e: unknown) => statusOf(e) === 409, "reconcilePickupPhysicalArrival must refuse unsafe equipment");
    assert.notEqual(await pickupStatus(d.pickup!.id), "RELEASED");
  },
);

test(
  "only authorized maintenance or safety roles can return out-of-service equipment to service",
  async () => {
    const role = await m.prisma.role.upsert({ where: { code: "DRIVER" }, update: {}, create: { code: "DRIVER", name: "DRIVER" } });
    const user = await m.prisma.user.create({ data: { email: `i9-a-driver-user-${stamp}@dev.local`, name: "driver" } });
    await m.prisma.fleetMembership.create({ data: { userId: user.id, fleetId: A.fleet.id, roleId: role.id, status: "ACTIVE" } });
    const c = await chain(A, "ASSIGNED");
    await m.equipment.setEquipmentStatus(A.dispatcher, c.tractor.id, "OUT_OF_SERVICE");
    const asDriver = { id: user.id, email: user.email, memberships: [{ fleetId: A.fleet.id, roleCode: "DRIVER", status: "ACTIVE" }] };
    await assert.rejects(() => m.equipment.setEquipmentStatus(asDriver, c.tractor.id, "AVAILABLE"), (e: unknown) => statusOf(e) === 403, "a DRIVER must not clear OUT_OF_SERVICE");
    assert.equal((await m.prisma.equipment.findUniqueOrThrow({ where: { id: c.tractor.id } })).status, "OUT_OF_SERVICE");
  },
);
