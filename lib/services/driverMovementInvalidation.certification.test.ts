import assert from "node:assert/strict";
import test, { after, before } from "node:test";

import { assertTestDatabaseTarget } from "@/lib/test/assertTestDatabaseTarget";

function statusOf(error: unknown) {
  return error && typeof error === "object" && "statusCode" in error
    ? Number((error as { statusCode?: number }).statusCode)
    : 0;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type Settled<T> = { settled: boolean; result: Promise<{ ok: true; value: T } | { ok: false; error: unknown }> };

function settle<T>(promise: Promise<T>): Settled<T> {
  const tracked: Settled<T> = {
    settled: false,
    result: promise.then(
      (value) => ({ ok: true as const, value }),
      (error: unknown) => ({ ok: false as const, error }),
    ),
  };
  void tracked.result.then(() => {
    tracked.settled = true;
  });
  return tracked;
}

/**
 * Stage 0 I-7: movement authorizations already issued for a driver stop counting when the driver's qualification
 * is lost (driverMovementInvalidationService). The equipment cases exercise the shared step that I-8 (Cursor)
 * triggers on equipment changes. Runs against the isolated bof_dev database only.
 */
assertTestDatabaseTarget(process.env.DATABASE_URL);
const stamp = `i7${Date.now().toString(36)}`;

const mod = async () => {
  const { prisma } = await import("@/lib/prisma");
  return {
    prisma,
    readiness: await import("@/lib/services/readinessService"),
    fixture: await import("@/lib/test/qualifiedDriverFixture"),
    documents: await import("@/lib/services/documentService"),
    assignments: await import("@/lib/services/dispatchAssignmentService"),
    releases: await import("@/lib/services/dispatchReleaseService"),
    movement: await import("@/lib/services/dispatchMovementAuthorizationService"),
    pickups: await import("@/lib/services/pickupAuthorizationService"),
    invalidation: await import("@/lib/services/driverMovementInvalidationService"),
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
const ids = { drivers: [] as string[], loads: [] as string[], equipment: [] as string[] };

async function makeFleet(label: string): Promise<FleetCtx> {
  const { prisma } = m;
  const fleet = await prisma.fleet.create({ data: { slug: `i7-${label}-${stamp}`, name: `I7 ${label} ${stamp}`, carrierGroupId: groupId } });
  const role = (code: string) => prisma.role.upsert({ where: { code }, update: {}, create: { code, name: code } });
  const member = async (name: string, roleCode: string): Promise<Session> => {
    const user = await prisma.user.create({ data: { email: `i7-${label}-${name}-${stamp}@dev.local`, name } });
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
  releaseId: string | null;
  pickup: null | { id: string; token: string };
};

/** QUALIFIED driver on an ACTIVE assignment with a completed pre-trip; optionally released, issued, picked up. */
async function chain(ctx: FleetCtx, stage: "ASSIGNED" | "RELEASED" | "PICKUP_ISSUED" | "IN_MOTION" = "ASSIGNED"): Promise<Chain> {
  const { prisma } = m;
  const fleetId = ctx.fleet.id;
  const n = ids.drivers.length;
  const driver = await prisma.driver.create({ data: { fleetId, firstName: "I7", lastName: stamp, email: `i7-drv-${stamp}-${n}@dev.local`, status: "ACTIVE" } });
  ids.drivers.push(driver.id);
  const evidence = await m.fixture.createQualifiedDriverEvidence(prisma, { driverId: driver.id, fleetId, complianceUserId: ctx.compliance.id });
  const load = await prisma.load.create({
    data: {
      fleetId, customerName: "I7 Shipper", origin: "Dallas, TX", destination: "Atlanta, GA", status: "PLANNED",
      pickupWindowStart: new Date(Date.now() + 3_600_000), pickupWindowEnd: new Date(Date.now() + 8 * 3_600_000),
    },
  });
  ids.loads.push(load.id);
  const equipment = async (equipmentType: "TRACTOR" | "TRAILER") => {
    const row = await prisma.equipment.create({ data: { fleetId, equipmentType, unitNumber: `I7-${stamp}-${ids.equipment.length}`, status: "AVAILABLE" } });
    ids.equipment.push(row.id);
    return row;
  };
  const tractor = await equipment("TRACTOR");
  const trailer = await equipment("TRAILER");
  const assignment = await m.assignments.createAssignment(ctx.dispatcher, load.id, driver.id, tractor.id, trailer.id);
  await prisma.preTripHeader.create({ data: { fleetId, assignmentId: assignment.id, status: "COMPLETED", completedAt: new Date(), completedByUserId: ctx.dispatcher.id } });
  await prisma.driverReadinessScore.create({ data: { driverId: driver.id, fleetId, status: "READY", policyVersion: "i7-test", summary: "i7", score: 90 } });
  const result: Chain = { driver, evidence, load, tractor, trailer, assignment, releaseId: null, pickup: null };
  if (stage === "ASSIGNED") return result;
  const release = await m.releases.createDispatchReleaseWithMovementAuthorization(ctx.dispatcher, load.id, "RELEASE");
  assert.equal(release.movement.allowed, true, "fixture must be release-ready");
  result.releaseId = release.release.id;
  if (stage === "RELEASED") return result;
  const issued = await m.pickups.issuePickupAuthorization(ctx.dispatcher, load.id);
  result.pickup = { id: issued.authorization.id, token: issued.credential.token };
  if (stage === "PICKUP_ISSUED") return result;
  const released = await verify(ctx, result);
  assert.equal(released.authorization.status, "RELEASED");
  return result;
}

function verify(ctx: FleetCtx, c: Chain) {
  return m.pickups.verifyPickupAuthorization(ctx.dispatcher, c.pickup!.id, {
    token: c.pickup!.token,
    presented: { authorizationId: c.pickup!.id, loadId: c.load.id, driverId: c.driver.id, tractorEquipmentId: c.tractor.id, trailerEquipmentId: c.trailer.id },
  });
}

function rejectLicense(ctx: FleetCtx, c: { evidence: { licenseDocumentId: string } }) {
  return m.documents.updateDriverDocumentRecord({
    sessionUser: ctx.compliance,
    documentId: c.evidence.licenseDocumentId,
    payload: { status: "REJECTED", rejectionReason: "license suspended" },
  });
}

async function holdException(assignmentId: string, exceptionType = "DRIVER_QUALIFICATION_MOVEMENT_HOLD") {
  return m.prisma.operatingException.findMany({
    where: { entityType: "DispatchAssignment", entityId: assignmentId, exceptionType },
    include: { actions: true },
  });
}

async function releasesFor(assignmentId: string) {
  return m.prisma.dispatchRelease.findMany({ where: { assignmentId }, orderBy: [{ evaluatedAt: "asc" }, { createdAt: "asc" }] });
}

async function notifiedUsers(exceptionId: string) {
  const thread = await m.prisma.operationalChatThread.findFirst({ where: { recordType: "EXCEPTION", recordId: exceptionId } });
  if (!thread) return { thread: null, users: new Map<string, string[]>() };
  const rows = await m.prisma.operationalChatNotification.findMany({ where: { threadId: thread.id } });
  const users = new Map<string, string[]>();
  for (const row of rows) users.set(row.userId, [...(users.get(row.userId) ?? []), row.kind]);
  return { thread, users };
}

const MOVEMENT_DISPOSITIONS = ["RELEASED", "CONDITIONALLY_RELEASED"];

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
    if (Date.now() > deadline) assert.fail(`${label}: expected ${count} transaction(s) waiting on the driver qualification lock`);
    await sleep(20);
  }
}

async function holdDriverLock(driverId: string) {
  let release = () => {};
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let markLocked = () => {};
  const locked = new Promise<void>((resolve) => {
    markLocked = resolve;
  });
  const done = m.prisma.$transaction(async (tx) => {
    await m.readiness.lockDriverReadinessWrite(tx, driverId);
    markLocked();
    await gate;
  }, { timeout: 30_000 });
  await locked;
  return () => {
    release();
    return done;
  };
}

before(async () => {
  m = await mod();
  const database = await m.prisma.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
  assert.equal(database[0]?.name, "bof_dev");
  const aggregator = await m.prisma.aggregator.create({ data: { name: `I7 ${stamp}` } });
  aggregatorId = aggregator.id;
  groupId = (await m.prisma.carrierGroup.create({ data: { aggregatorId, name: `I7 ${stamp}` } })).id;
  A = await makeFleet("a");
  B = await makeFleet("b");
});

after(async () => {
  if (!m) return;
  const { prisma } = m;
  const fleets = [A?.fleet.id, B?.fleet.id].filter(Boolean) as string[];
  const threads = await prisma.operationalChatThread.findMany({ where: { tenantId: { in: fleets } }, select: { id: true } });
  await prisma.operationalChatNotification.deleteMany({ where: { tenantId: { in: fleets } } });
  await prisma.operationalChatThread.deleteMany({ where: { id: { in: threads.map((t) => t.id) } } });
  await prisma.operatingCorrectiveAction.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.operatingProcessEvent.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.operatingException.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.auditEvent.deleteMany({ where: { tenantId: { in: fleets } } });
  await prisma.pickupVerificationAttempt.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.pickupAuthorization.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.dispatchRelease.deleteMany({ where: { fleetId: { in: fleets } } });
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

test("revoked after assignment: assignment kept, hold exception opened once, Dispatch, Compliance and carrier notified", async () => {
  const c = await chain(A, "ASSIGNED");
  await rejectLicense(A, c);

  assert.equal((await m.prisma.dispatchAssignment.findUniqueOrThrow({ where: { id: c.assignment.id } })).status, "ACTIVE");
  assert.equal((await releasesFor(c.assignment.id)).length, 0, "no release is written for an assignment that was never released");
  const [exception, ...others] = await holdException(c.assignment.id);
  assert.equal(others.length, 0);
  assert.equal(exception.status, "OPEN");
  assert.equal(exception.severity, "MEDIUM");
  assert.equal(exception.fleetId, A.fleet.id);
  assert.deepEqual(exception.actions.map((a) => `${a.assignedOwnerTeam}:${a.actionType}`).sort(), [
    "COMPLIANCE:RESOLVE_DRIVER_QUALIFICATION",
    "DISPATCH:HOLD_OR_REASSIGN_LOAD",
  ]);
  const { users } = await notifiedUsers(exception.id);
  assert.ok(users.has(A.dispatcher.id) && users.has(A.carrierAdmin.id) && users.has(A.operations.id));
  assert.ok(!users.has(A.compliance.id), "the acting compliance reviewer is the sender, not a recipient");
  for (const id of B.userIds) assert.ok(!users.has(id), "other fleets are never notified");

  // Release is refused while the driver is not qualified.
  const blocked = await m.releases.createDispatchReleaseWithMovementAuthorization(A.dispatcher, c.load.id, "RELEASE");
  assert.equal(blocked.movement.allowed, false);

  // A further change while the hold is open updates nothing and notifies no one again.
  const before = (await notifiedUsers(exception.id)).users.get(A.dispatcher.id)?.length;
  await m.prisma.$transaction((tx) =>
    m.invalidation.invalidateDriverMovementAuthorizations(tx, { driverId: c.driver.id, actor: A.compliance, trigger: "TEST_REPEAT" }),
  );
  assert.equal((await holdException(c.assignment.id)).length, 1);
  assert.equal((await notifiedUsers(exception.id)).users.get(A.dispatcher.id)?.length, before);
});

test("revoked after release: BLOCKED release appended after the preserved release", async () => {
  const c = await chain(A, "RELEASED");
  const original = await m.prisma.dispatchRelease.findUniqueOrThrow({ where: { id: c.releaseId! } });
  await rejectLicense(A, c);

  const releases = await releasesFor(c.assignment.id);
  assert.equal(releases.length, 2);
  assert.deepEqual(releases[0], original, "the original release row is unchanged");
  assert.ok(!MOVEMENT_DISPOSITIONS.includes(releases[1].disposition));
  assert.ok((releases[1].reasonCodes as string[]).includes("DRIVER_NOT_READY") || (releases[1].reasonCodes as string[]).length > 0);
  const [exception] = await holdException(c.assignment.id);
  assert.equal(exception.severity, "HIGH");
  await assert.rejects(() => m.pickups.issuePickupAuthorization(A.dispatcher, c.load.id), (error: unknown) => statusOf(error) === 409);
});

test("revoked after pickup issuance: authorization cancelled with an audited reason, credential refused", async () => {
  const c = await chain(A, "PICKUP_ISSUED");
  const releasesBefore = (await releasesFor(c.assignment.id)).length; // RELEASE, plus the PICKUP_ISSUE evaluation
  await rejectLicense(A, c);

  const pickup = await m.prisma.pickupAuthorization.findUniqueOrThrow({ where: { id: c.pickup!.id } });
  assert.equal(pickup.status, "CANCELLED");
  assert.equal(pickup.cancelledByUserId, A.compliance.id);
  assert.ok((pickup.reasonCodes as string[]).includes("DOCUMENT_REJECTED"));
  assert.ok(await m.prisma.auditEvent.findFirst({ where: { entityType: "PickupAuthorization", entityId: pickup.id, details: { path: ["event"], equals: "pickup.cancelled" } } }));
  assert.equal((await releasesFor(c.assignment.id)).length, releasesBefore + 1);
  await assert.rejects(() => verify(A, c), (error: unknown) => statusOf(error) === 409);
  assert.equal((await m.prisma.pickupAuthorization.findUniqueOrThrow({ where: { id: pickup.id } })).status, "CANCELLED");
});

test("revoked during pickup verification: serialized by the qualification lock in either order", async () => {
  // Rejection first: verification queued behind it sees the cancellation and cannot overwrite it.
  const first = await chain(A, "PICKUP_ISSUED");
  let release = await holdDriverLock(first.driver.id);
  const rejection = settle(rejectLicense(A, first));
  await waitForLockWaiters(1, "rejection");
  const verification = settle(verify(A, first));
  await waitForLockWaiters(2, "verification");
  await release();
  assert.ok((await rejection.result).ok);
  const verified = await verification.result;
  assert.equal(verified.ok, false);
  assert.equal(statusOf(!verified.ok ? verified.error : null), 409);
  assert.equal((await m.prisma.pickupAuthorization.findUniqueOrThrow({ where: { id: first.pickup!.id } })).status, "CANCELLED");

  // Verification first: the pickup is RELEASED (shipment moving); the rejection escalates without rewriting it.
  const second = await chain(A, "PICKUP_ISSUED");
  release = await holdDriverLock(second.driver.id);
  const inFlight = settle(verify(A, second));
  await waitForLockWaiters(1, "verification");
  const late = settle(rejectLicense(A, second));
  await waitForLockWaiters(2, "rejection");
  await release();
  const moved = await inFlight.result;
  assert.ok(moved.ok && moved.value.authorization.status === "RELEASED");
  assert.ok((await late.result).ok);
  assert.equal((await m.prisma.pickupAuthorization.findUniqueOrThrow({ where: { id: second.pickup!.id } })).status, "RELEASED");
  const [exception] = await holdException(second.assignment.id);
  assert.equal(exception.severity, "CRITICAL");
  assert.ok(exception.dueAt);
  assert.ok(exception.actions.some((a) => a.actionType === "DOCUMENT_OPERATIONAL_DISPOSITION" && a.assignedOwnerTeam === "DISPATCH"));
  const { users } = await notifiedUsers(exception.id);
  for (const id of [A.dispatcher.id, A.carrierAdmin.id, A.operations.id]) {
    assert.deepEqual(users.get(id), ["MOVEMENT_IN_MOTION_ESCALATION"]);
  }
  const releases = await releasesFor(second.assignment.id);
  assert.ok(!MOVEMENT_DISPOSITIONS.includes(releases[releases.length - 1].disposition));
});

test("equipment out of service after assignment and after release (shared step used by I-8)", async () => {
  const equipmentCause = {
    exceptionType: "EQUIPMENT_SAFETY_MOVEMENT_HOLD",
    trigger: "EQUIPMENT_OUT_OF_SERVICE",
    correctiveOwnerTeam: "SAFETY" as const,
    correctiveActionType: "RESOLVE_EQUIPMENT_SAFETY",
    summary: "Tractor placed out of service.",
  };
  const invalidate = (assignmentId: string) =>
    m.prisma.$transaction((tx) => m.invalidation.invalidateAssignmentMovementAuthorization(tx, { assignmentId, actor: A.operations, cause: equipmentCause }));

  // Still safe: the shared step re-evaluates and does nothing.
  const safe = await chain(A, "RELEASED");
  assert.equal(await invalidate(safe.assignment.id), null);
  assert.equal((await releasesFor(safe.assignment.id)).length, 1);

  const assigned = await chain(A, "ASSIGNED");
  await m.prisma.equipment.update({ where: { id: assigned.tractor.id }, data: { status: "OUT_OF_SERVICE" } });
  const onAssignment = await invalidate(assigned.assignment.id);
  assert.equal(onAssignment?.state, "ASSIGNED");
  assert.equal(onAssignment?.appendedReleaseId, null);
  assert.equal((await m.prisma.dispatchAssignment.findUniqueOrThrow({ where: { id: assigned.assignment.id } })).status, "ACTIVE");
  const [equipmentHold] = await holdException(assigned.assignment.id, "EQUIPMENT_SAFETY_MOVEMENT_HOLD");
  assert.ok(equipmentHold.actions.some((a) => a.assignedOwnerTeam === "SAFETY"));

  const released = await chain(A, "PICKUP_ISSUED");
  const releasesBefore = (await releasesFor(released.assignment.id)).length;
  await m.prisma.equipment.update({ where: { id: released.tractor.id }, data: { status: "OUT_OF_SERVICE" } });
  const onRelease = await invalidate(released.assignment.id);
  assert.equal(onRelease?.state, "PICKUP_ISSUED");
  assert.deepEqual(onRelease?.cancelledPickupIds, [released.pickup!.id]);
  const appended = await m.prisma.dispatchRelease.findUniqueOrThrow({ where: { id: onRelease!.appendedReleaseId! } });
  assert.ok((appended.reasonCodes as string[]).includes("TRUCK_OUT_OF_SERVICE"));
  assert.equal((await releasesFor(released.assignment.id)).length, releasesBefore + 1);
});

test("reauthorization after corrective action requires a fresh release and pickup", async () => {
  const c = await chain(A, "PICKUP_ISSUED");
  await rejectLicense(A, c);
  assert.equal((await m.prisma.pickupAuthorization.findUniqueOrThrow({ where: { id: c.pickup!.id } })).status, "CANCELLED");

  // Compliance receives and verifies a replacement license.
  const replacement = await m.documents.createDriverDocumentRecord({
    sessionUser: A.dispatcher,
    intakeId: c.evidence.intakeId,
    payload: { documentType: "DRIVER_LICENSE", storageKey: `test/i7/${stamp}/license-2`, originalFileName: "license-2.pdf" },
  });
  await m.documents.updateDriverDocumentRecord({ sessionUser: A.compliance, documentId: replacement.id, payload: { status: "PENDING_VERIFICATION" } });
  await m.documents.updateDriverDocumentRecord({ sessionUser: A.compliance, documentId: replacement.id, payload: { status: "VERIFIED" } });

  // Nothing is reinstated automatically.
  assert.equal((await m.prisma.pickupAuthorization.findUniqueOrThrow({ where: { id: c.pickup!.id } })).status, "CANCELLED");
  const latest = (await releasesFor(c.assignment.id)).at(-1)!;
  assert.ok(!MOVEMENT_DISPOSITIONS.includes(latest.disposition));

  const fresh = await m.releases.createDispatchReleaseWithMovementAuthorization(A.dispatcher, c.load.id, "RELEASE");
  assert.equal(fresh.movement.allowed, true);
  const reissued = await m.pickups.issuePickupAuthorization(A.dispatcher, c.load.id);
  assert.equal(reissued.authorization.status, "PENDING");
  assert.notEqual(reissued.authorization.id, c.pickup!.id);
  const history = await releasesFor(c.assignment.id);
  assert.ok(history.length >= 4, "original, blocked and fresh releases are all kept");
  assert.equal(await m.prisma.pickupAuthorization.count({ where: { assignmentId: c.assignment.id } }), 2);
});

test("concurrent eligibility change and authorization attempts never leave a valid stale authorization", async () => {
  for (let round = 0; round < 3; round += 1) {
    const c = await chain(A, "RELEASED");
    const outcomes = await Promise.allSettled([
      rejectLicense(A, c),
      m.pickups.issuePickupAuthorization(A.dispatcher, c.load.id),
      m.releases.createDispatchReleaseWithMovementAuthorization(A.dispatcher, c.load.id, "RELEASE"),
    ]);
    assert.equal(outcomes[0].status, "fulfilled");
    const latest = (await releasesFor(c.assignment.id)).at(-1)!;
    assert.ok(!MOVEMENT_DISPOSITIONS.includes(latest.disposition), "the latest release never authorizes movement after the rejection");
    const live = await m.prisma.pickupAuthorization.count({ where: { assignmentId: c.assignment.id, status: { in: ["PENDING", "AUTHORIZED"] } } });
    assert.equal(live, 0, "no live pickup authorization survives the rejection");
  }
});

test("scheduled detection invalidates expired credentials within the actor's own fleets", async () => {
  const expired = await chain(A, "PICKUP_ISSUED");
  const other = await chain(B, "PICKUP_ISSUED");
  // Time passes: the license verification lapses without any write.
  for (const c of [expired, other]) {
    await m.prisma.driverDocument.update({ where: { id: c.evidence.licenseDocumentId }, data: { verificationExpiresAt: new Date(Date.now() - 86_400_000) } });
  }
  assert.equal((await m.prisma.pickupAuthorization.findUniqueOrThrow({ where: { id: expired.pickup!.id } })).status, "PENDING");

  await assert.rejects(() => m.invalidation.sweepDriverQualificationInvalidations(A.dispatcher), (error: unknown) => statusOf(error) === 403);
  await assert.rejects(
    () => m.invalidation.sweepDriverQualificationInvalidations(A.compliance, { fleetIds: [A.fleet.id, B.fleet.id] }),
    (error: unknown) => statusOf(error) === 403,
  );

  const sweep = await m.invalidation.sweepDriverQualificationInvalidations(A.compliance);
  assert.deepEqual(sweep.fleetIds, [A.fleet.id]);
  assert.ok(sweep.invalidated.some((o) => o.assignmentId === expired.assignment.id && o.state === "PICKUP_ISSUED"));
  assert.ok(sweep.invalidated.every((o) => o.fleetId === A.fleet.id));
  const cancelled = await m.prisma.pickupAuthorization.findUniqueOrThrow({ where: { id: expired.pickup!.id } });
  assert.equal(cancelled.status, "CANCELLED");
  assert.ok((cancelled.reasonCodes as string[]).includes("QUALIFICATION_SCHEDULED_REVIEW"));

  // Fleet B is untouched until its own authorized reviewer runs detection.
  assert.equal((await m.prisma.pickupAuthorization.findUniqueOrThrow({ where: { id: other.pickup!.id } })).status, "PENDING");
  assert.equal((await holdException(other.assignment.id)).length, 0);

  // Re-running detection is idempotent: no duplicate exception, no new notifications.
  const [exception] = await holdException(expired.assignment.id);
  const notifications = await m.prisma.operationalChatNotification.count({ where: { tenantId: A.fleet.id } });
  const again = await m.invalidation.sweepDriverQualificationInvalidations(A.compliance);
  assert.ok(again.invalidated.every((o) => !o.exceptionCreated && o.cancelledPickupIds.length === 0 && o.appendedReleaseId === null));
  assert.equal((await holdException(expired.assignment.id)).length, 1);
  assert.equal((await holdException(expired.assignment.id))[0].id, exception.id);
  assert.equal(await m.prisma.operationalChatNotification.count({ where: { tenantId: A.fleet.id } }), notifications);

  const sweepB = await m.invalidation.sweepDriverQualificationInvalidations(B.compliance);
  assert.deepEqual(sweepB.fleetIds, [B.fleet.id]);
  assert.equal((await m.prisma.pickupAuthorization.findUniqueOrThrow({ where: { id: other.pickup!.id } })).status, "CANCELLED");
  const [exceptionB] = await holdException(other.assignment.id);
  const { users } = await notifiedUsers(exceptionB.id);
  for (const id of A.userIds) assert.ok(!users.has(id), "fleet A is never notified about fleet B");
});

test("audit trail preserves every prior record", async () => {
  const c = await chain(A, "PICKUP_ISSUED");
  const priorRelease = await m.prisma.dispatchRelease.findUniqueOrThrow({ where: { id: c.releaseId! } });
  const latestBefore = (await releasesFor(c.assignment.id)).at(-1)!;
  const priorAudits = await m.prisma.auditEvent.count({ where: { tenantId: A.fleet.id } });
  await rejectLicense(A, c);

  assert.deepEqual(await m.prisma.dispatchRelease.findUniqueOrThrow({ where: { id: c.releaseId! } }), priorRelease);
  assert.ok(await m.prisma.pickupAuthorization.findUnique({ where: { id: c.pickup!.id } }), "the cancelled authorization is kept");
  assert.ok((await m.prisma.auditEvent.count({ where: { tenantId: A.fleet.id } })) > priorAudits);
  const invalidated = await m.prisma.auditEvent.findFirst({
    where: { entityType: "DispatchAssignment", entityId: c.assignment.id, details: { path: ["event"], equals: "movement.authorization_invalidated" } },
  });
  const details = invalidated?.details as Record<string, unknown>;
  assert.equal(details.state, "PICKUP_ISSUED");
  assert.equal(details.previousReleaseId, latestBefore.id);
  assert.deepEqual(details.cancelledPickupIds, [c.pickup!.id]);
  assert.equal(details.assignmentRetained, true);
  assert.ok(await m.prisma.auditEvent.findFirst({ where: { entityType: "OperatingException", tenantId: A.fleet.id, details: { path: ["event"], equals: "exception.opened" } } }));
});
