import assert from "node:assert/strict";
import test, { after, before, type TestContext } from "node:test";

import { assertTestDatabaseTarget } from "@/lib/test/assertTestDatabaseTarget";

/**
 * Stage 0 I-9 independent re-certification of S0-I9-01 (physical pickup reconciliation gate) and S0-I9-02
 * (equipment status authority) on the real services and a real isolated PostgreSQL database. Each scenario
 * asserts the safety invariant and records the final database state as a test diagnostic ("EVIDENCE …").
 */
assertTestDatabaseTarget(process.env.DATABASE_URL);
const stamp = `i9r${Date.now().toString(36)}`;
const FAILURE_MARKER = `i9r-inject-failure-${stamp}`;

function statusOf(error: unknown) {
  return error && typeof error === "object" && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) : 0;
}
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Settled<T> = { settled: boolean; result: Promise<{ ok: true; value: T } | { ok: false; error: unknown }> };
function settle<T>(promise: Promise<T>): Settled<T> {
  const tracked: Settled<T> = {
    settled: false,
    result: promise.then((value) => ({ ok: true as const, value }), (error: unknown) => ({ ok: false as const, error })),
  };
  void tracked.result.then(() => {
    tracked.settled = true;
  });
  return tracked;
}

const load = async () => {
  const { prisma } = await import("@/lib/prisma");
  return {
    prisma,
    fixture: await import("@/lib/test/qualifiedDriverFixture"),
    readiness: await import("@/lib/services/readinessService"),
    documents: await import("@/lib/services/documentService"),
    assignments: await import("@/lib/services/dispatchAssignmentService"),
    releases: await import("@/lib/services/dispatchReleaseService"),
    pickups: await import("@/lib/services/pickupAuthorizationService"),
    physical: await import("@/lib/services/pickupPhysicalReconciliationService"),
    equipment: await import("@/lib/services/equipmentService"),
    conditions: await import("@/lib/services/conditionService"),
    equipmentLocks: await import("@/lib/services/equipmentSafetyInvalidationService"),
  };
};
type Mods = Awaited<ReturnType<typeof load>>;
type Session = { id: string; email: string; memberships: Array<{ fleetId: string; roleCode: string; status: string }> };
type Chain = {
  driver: { id: string };
  evidence: { intakeId: string; licenseDocumentId: string };
  load: { id: string };
  tractor: { id: string; unitNumber: string; vin: string | null };
  trailer: { id: string; unitNumber: string };
  assignment: { id: string };
  pickup: { id: string; token: string };
};

let m: Mods;
let groupId = "";
let aggregatorId = "";
let fleetA = "";
let fleetB = "";
const users: Record<string, Session> = {};
const ids = { drivers: [] as string[], loads: [] as string[], equipment: [] as string[] };

async function member(label: string, fleetId: string, roleCode: string, opts: { membershipStatus?: "ACTIVE" | "INACTIVE" | "INVITED"; userStatus?: "ACTIVE" | "INACTIVE" | "SUSPENDED" } = {}) {
  const role = await m.prisma.role.upsert({ where: { code: roleCode }, update: {}, create: { code: roleCode, name: roleCode } });
  const user = await m.prisma.user.create({ data: { email: `i9r-${label}-${stamp}@dev.local`, name: label, status: opts.userStatus ?? "ACTIVE" } });
  await m.prisma.fleetMembership.create({ data: { userId: user.id, fleetId, roleId: role.id, status: opts.membershipStatus ?? "ACTIVE" } });
  return { id: user.id, email: user.email, memberships: [{ fleetId, roleCode, status: "ACTIVE" }] } as Session;
}
/** A session that claims a role in a fleet; authorization must not trust the claim. */
const claim = (s: Session, fleetId: string, roleCode: string): Session => ({ ...s, memberships: [{ fleetId, roleCode, status: "ACTIVE" }] });

async function chain(): Promise<Chain> {
  const { prisma } = m;
  const n = ids.drivers.length;
  const driver = await prisma.driver.create({ data: { fleetId: fleetA, firstName: "I9R", lastName: stamp, email: `i9r-drv-${stamp}-${n}@dev.local`, status: "ACTIVE" } });
  ids.drivers.push(driver.id);
  const evidence = await m.fixture.createQualifiedDriverEvidence(prisma, { driverId: driver.id, fleetId: fleetA, complianceUserId: users.compliance.id });
  const loadRow = await prisma.load.create({
    data: {
      fleetId: fleetA, customerName: "I9R", origin: "Dallas, TX", destination: "Atlanta, GA", status: "PLANNED",
      pickupWindowStart: new Date(Date.now() + 3_600_000), pickupWindowEnd: new Date(Date.now() + 8 * 3_600_000),
    },
  });
  ids.loads.push(loadRow.id);
  const tractor = await prisma.equipment.create({ data: { fleetId: fleetA, equipmentType: "TRACTOR", unitNumber: `I9RT-${stamp}-${n}`, vin: `1XPBDP9X0R9${String(n).padStart(6, "0")}`, status: "AVAILABLE" } });
  const trailer = await prisma.equipment.create({ data: { fleetId: fleetA, equipmentType: "TRAILER", unitNumber: `I9RL-${stamp}-${n}`, status: "AVAILABLE" } });
  ids.equipment.push(tractor.id, trailer.id);
  const assignment = await m.assignments.createAssignment(users.dispatcher, loadRow.id, driver.id, tractor.id, trailer.id);
  await prisma.preTripHeader.create({ data: { fleetId: fleetA, assignmentId: assignment.id, status: "COMPLETED", completedAt: new Date(), completedByUserId: users.dispatcher.id } });
  await prisma.driverReadinessScore.create({ data: { driverId: driver.id, fleetId: fleetA, status: "READY", policyVersion: "i9r", summary: "i9r", score: 90 } });
  const release = await m.releases.createDispatchReleaseWithMovementAuthorization(users.dispatcher, loadRow.id, "RELEASE");
  assert.equal(release.movement.allowed, true, "fixture must be release-ready");
  const issued = await m.pickups.issuePickupAuthorization(users.dispatcher, loadRow.id);
  return { driver, evidence, load: loadRow, tractor, trailer, assignment, pickup: { id: issued.authorization.id, token: issued.credential.token } };
}

const reconcile = (c: Chain, extra: { evidenceReference?: string; intendedDisposition?: "RELEASE" | "STOP" } = {}) =>
  m.physical.reconcilePickupPhysicalArrival(users.dispatcher, c.pickup.id, {
    token: c.pickup.token,
    method: "SHIPPER_DOCK",
    arriving: {
      authorizationId: c.pickup.id, loadId: c.load.id, driverId: c.driver.id, tractorId: c.tractor.id, trailerId: c.trailer.id,
      tractorUnitNumber: c.tractor.unitNumber, trailerUnitNumber: c.trailer.unitNumber, vin: c.tractor.vin, qr: c.tractor.unitNumber,
    },
    evidenceReference: extra.evidenceReference ?? `i9r-dock-${c.pickup.id}`,
    intendedDisposition: extra.intendedDisposition ?? "RELEASE",
  });
const verify = (c: Chain) =>
  m.pickups.verifyPickupAuthorization(users.dispatcher, c.pickup.id, {
    token: c.pickup.token,
    presented: { authorizationId: c.pickup.id, loadId: c.load.id, driverId: c.driver.id, tractorEquipmentId: c.tractor.id, trailerEquipmentId: c.trailer.id },
  });
const rejectLicense = (c: Chain) =>
  m.documents.updateDriverDocumentRecord({ sessionUser: users.compliance, documentId: c.evidence.licenseDocumentId, payload: { status: "REJECTED", rejectionReason: "license suspended" } });
const expireLicense = (c: Chain, past = true) =>
  m.prisma.driverDocument.update({ where: { id: c.evidence.licenseDocumentId }, data: { verificationExpiresAt: new Date(Date.now() + (past ? -1 : 1) * 86_400_000 * (past ? 1 : 300)) } });
const openCriticalCondition = (equipmentId: string) =>
  m.prisma.conditionThread.create({
    data: { fleetId: fleetA, equipmentId, title: "Cracked frame", category: "SAFETY", severity: "CRITICAL", observationSource: "DRIVER", lifecycleState: "IDENTIFIED", createdByUserId: users.dispatcher.id },
  });

/** Final database state of a pickup: status, verification attempts and physical outcome. */
async function pickupEvidence(pickupId: string) {
  const row = await m.prisma.pickupAuthorization.findUniqueOrThrow({ where: { id: pickupId }, include: { verificationAttempts: { orderBy: { createdAt: "asc" } }, physicalReconciliation: true } });
  return {
    status: row.status,
    attempts: row.verificationAttempts.map((a) => a.result),
    physical: row.physicalReconciliation?.disposition ?? null,
    releasedAt: row.releasedAt !== null,
  };
}
function record(t: TestContext, label: string, value: unknown) {
  t.diagnostic(`EVIDENCE ${label}: ${JSON.stringify(value)}`);
}

async function advisoryWaiters() {
  const rows = await m.prisma.$queryRaw<Array<{ n: bigint }>>`
    SELECT count(*)::bigint AS n FROM pg_locks WHERE locktype = 'advisory' AND NOT granted
      AND database = (SELECT oid FROM pg_database WHERE datname = current_database())`;
  return Number(rows[0]?.n ?? 0);
}
async function waitForWaiters(count: number, label: string) {
  const deadline = Date.now() + 10_000;
  while ((await advisoryWaiters()) < count) {
    if (Date.now() > deadline) assert.fail(`${label}: expected ${count} advisory-lock waiter(s)`);
    await sleep(20);
  }
}
async function hold(kind: "equipment" | "driver", id: string, inside?: (tx: Parameters<Parameters<Mods["prisma"]["$transaction"]>[0]>[0]) => Promise<void>) {
  let release = () => {};
  const gate = new Promise<void>((resolve) => (release = resolve));
  let markLocked = () => {};
  const locked = new Promise<void>((resolve) => (markLocked = resolve));
  const done = m.prisma.$transaction(async (tx) => {
    if (kind === "equipment") await m.equipmentLocks.lockEquipmentSafetyWrite(tx, id);
    else await m.readiness.lockDriverReadinessWrite(tx, id);
    markLocked();
    await gate;
    if (inside) await inside(tx);
  }, { timeout: 30_000 });
  await locked;
  return () => {
    release();
    return done;
  };
}

before(async () => {
  m = await load();
  const database = await m.prisma.$queryRaw<Array<{ name: string; addr: string | null }>>`SELECT current_database() AS name, host(inet_server_addr()) AS addr`;
  assert.equal(database[0]?.name, "bof_dev");
  assert.equal(database[0]?.addr, "127.0.0.1");
  aggregatorId = (await m.prisma.aggregator.create({ data: { name: `I9R ${stamp}` } })).id;
  groupId = (await m.prisma.carrierGroup.create({ data: { aggregatorId, name: `I9R ${stamp}` } })).id;
  fleetA = (await m.prisma.fleet.create({ data: { slug: `i9r-a-${stamp}`, name: `I9R A ${stamp}`, carrierGroupId: groupId } })).id;
  fleetB = (await m.prisma.fleet.create({ data: { slug: `i9r-b-${stamp}`, name: `I9R B ${stamp}`, carrierGroupId: groupId } })).id;
  users.dispatcher = await member("dispatch", fleetA, "DISPATCH");
  users.compliance = await member("compliance", fleetA, "BOF_COMPLIANCE_REVIEW");
  users.fleetAdmin = await member("fleet-admin", fleetA, "FLEET_ADMIN");
  users.fleetOps = await member("fleet-ops", fleetA, "FLEET_OPERATIONS");
  users.fleetManager = await member("fleet-manager", fleetA, "FLEET_MANAGER");
  users.bofOps = await member("bof-ops", fleetA, "BOF_OPERATIONS");
  users.driverUser = await member("driver", fleetA, "DRIVER");
  users.inactiveAdmin = await member("inactive-admin", fleetA, "FLEET_ADMIN", { membershipStatus: "INACTIVE" });
  users.invitedAdmin = await member("invited-admin", fleetA, "FLEET_ADMIN", { membershipStatus: "INVITED" });
  users.suspendedAdmin = await member("suspended-admin", fleetA, "FLEET_ADMIN", { userStatus: "SUSPENDED" });
  users.adminB = await member("admin-b", fleetB, "FLEET_ADMIN");
  users.bofOpsElsewhere = await member("bof-ops-elsewhere", fleetB, "BOF_OPERATIONS");
  const outsider = await m.prisma.user.create({ data: { email: `i9r-no-membership-${stamp}@dev.local`, name: "outsider" } });
  users.noMembership = { id: outsider.id, email: outsider.email, memberships: [] };
});

after(async () => {
  if (!m) return;
  const { prisma } = m;
  await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS i9r_inject_failure ON "PickupPhysicalReconciliation"`);
  await prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS i9r_inject_failure()`);
  const fleets = [fleetA, fleetB].filter(Boolean);
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
  await prisma.preTripHeader.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.dispatchAssignment.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.driverReadinessScore.deleteMany({ where: { driverId: { in: ids.drivers } } });
  await prisma.driverQualificationSnapshot.deleteMany({ where: { driverId: { in: ids.drivers } } });
  await prisma.verificationSource.deleteMany({ where: { driverDocument: { driverId: { in: ids.drivers } } } });
  await m.fixture.cleanupQualifiedDriverEvidence(prisma, ids.drivers);
  await prisma.load.deleteMany({ where: { id: { in: ids.loads } } });
  await prisma.equipment.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.driver.deleteMany({ where: { id: { in: ids.drivers } } });
  await prisma.fleetMembership.deleteMany({ where: { fleetId: { in: fleets } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: `-${stamp}@dev.local` } } });
  await prisma.fleet.deleteMany({ where: { id: { in: fleets } } });
  await prisma.carrierGroup.deleteMany({ where: { id: groupId } });
  await prisma.aggregator.deleteMany({ where: { id: aggregatorId } });
});

// ---------------------------------------------------------------- S0-I9-01: physical pickup reconciliation gate

test("S0-I9-01 A/J: an identity-matched reconciliation releases atomically under PICKUP_VERIFY", async (t) => {
  const c = await chain();
  const result = await reconcile(c);
  const evidence = await pickupEvidence(c.pickup.id);
  record(t, "release", evidence);
  assert.equal(evidence.status, "RELEASED");
  assert.deepEqual(evidence.attempts, ["RELEASED"]);
  assert.equal(evidence.physical, "RELEASE");
  assert.ok(result);
});

test("S0-I9-01 F/G: expired qualification and an open critical condition are refused; the pickup is never RELEASED", async (t) => {
  const expired = await chain();
  await expireLicense(expired);
  await assert.rejects(() => reconcile(expired), (e: unknown) => statusOf(e) === 409);
  const expiredEvidence = await pickupEvidence(expired.pickup.id);
  record(t, "expired-qualification", expiredEvidence);
  assert.notEqual(expiredEvidence.status, "RELEASED");

  const unsafe = await chain();
  await openCriticalCondition(unsafe.tractor.id);
  await assert.rejects(() => reconcile(unsafe), (e: unknown) => statusOf(e) === 409);
  const unsafeEvidence = await pickupEvidence(unsafe.pickup.id);
  record(t, "critical-condition", unsafeEvidence);
  assert.notEqual(unsafeEvidence.status, "RELEASED");

  // For comparison: the Phase 1 verify gate persists its STOP before answering 409.
  const twin = await chain();
  await expireLicense(twin);
  await assert.rejects(() => verify(twin), (e: unknown) => statusOf(e) === 409);
  record(t, "verify-denial-for-comparison", await pickupEvidence(twin.pickup.id));
});

test(
  "S0-I9-01 I: a movement-denied reconciliation persists a durable STOP (status, attempt, physical outcome)",
  { todo: "RECERT DEFECT S0-I9R-01: the STOP writes are rolled back by the 409 thrown inside the transaction" },
  async (t) => {
  const c = await chain();
  await expireLicense(c);
  await assert.rejects(() => reconcile(c), (e: unknown) => statusOf(e) === 409);
  const evidence = await pickupEvidence(c.pickup.id);
  record(t, "denied-reconciliation", evidence);
  assert.equal(evidence.status, "STOPPED", "the denied pickup must be STOPPED durably");
  assert.deepEqual(evidence.attempts, ["STOPPED"]);
  assert.equal(evidence.physical, "STOP");

  },
);

test("S0-I9-01 E + scenario 4: CANCELLED pickups cannot be released, including a cancellation committed while reconciliation waits", async (t) => {
  const before = await chain();
  await m.pickups.cancelPickupAuthorization(users.dispatcher, before.pickup.id, "cancelled before arrival");
  await assert.rejects(() => reconcile(before), (e: unknown) => statusOf(e) === 409);
  record(t, "cancelled-before", await pickupEvidence(before.pickup.id));
  assert.equal((await pickupEvidence(before.pickup.id)).status, "CANCELLED");

  const racing = await chain();
  const release = await hold("equipment", racing.tractor.id);
  const reconciliation = settle(reconcile(racing));
  await waitForWaiters(1, "reconciliation waiting on the equipment lock");
  await m.pickups.cancelPickupAuthorization(users.dispatcher, racing.pickup.id, "cancelled during arrival");
  await release();
  const outcome = await reconciliation.result;
  assert.equal(outcome.ok, false);
  assert.equal(statusOf(!outcome.ok ? outcome.error : null), 409);
  const evidence = await pickupEvidence(racing.pickup.id);
  record(t, "cancelled-while-waiting", evidence);
  assert.equal(evidence.status, "CANCELLED");
  assert.ok(!evidence.attempts.includes("RELEASED"));
});

test("S0-I9-01 scenario 1: reconciliation racing driver qualification invalidation (both orders)", async (t) => {
  // Invalidation commits first (it takes only the driver lock); the waiting reconciliation is refused.
  const first = await chain();
  let release = await hold("equipment", first.tractor.id);
  const reconciliation = settle(reconcile(first));
  await waitForWaiters(1, "reconciliation");
  await rejectLicense(first);
  await release();
  const refused = await reconciliation.result;
  assert.equal(refused.ok, false);
  const invalidatedFirst = await pickupEvidence(first.pickup.id);
  record(t, "invalidation-first", invalidatedFirst);
  assert.notEqual(invalidatedFirst.status, "RELEASED");

  // Reconciliation holds the locks first; the rejection waits, then escalates the moving shipment.
  const second = await chain();
  release = await hold("driver", second.driver.id);
  const releasing = settle(reconcile(second));
  await waitForWaiters(1, "reconciliation on the driver lock");
  const rejection = settle(rejectLicense(second));
  await waitForWaiters(2, "rejection on the driver lock");
  await release();
  assert.ok((await releasing.result).ok);
  assert.ok((await rejection.result).ok);
  const moved = await pickupEvidence(second.pickup.id);
  const holds = await m.prisma.operatingException.findMany({ where: { entityId: second.assignment.id } });
  record(t, "reconciliation-first", { ...moved, holds: holds.map((h) => `${h.exceptionType}:${h.severity}`) });
  assert.equal(moved.status, "RELEASED");
  assert.ok(holds.some((h) => h.exceptionType === "DRIVER_QUALIFICATION_MOVEMENT_HOLD" && h.severity === "CRITICAL"));
});

test("S0-I9-01 scenario 2: reconciliation racing equipment safety invalidation (both orders)", async (t) => {
  const first = await chain();
  let release = await hold("equipment", first.tractor.id);
  const downgrade = settle(m.equipment.setEquipmentStatus(users.fleetAdmin, first.tractor.id, "OUT_OF_SERVICE"));
  await waitForWaiters(1, "downgrade");
  const reconciliation = settle(reconcile(first));
  await waitForWaiters(2, "reconciliation");
  await release();
  assert.ok((await downgrade.result).ok);
  assert.equal((await reconciliation.result).ok, false);
  const downgradedFirst = await pickupEvidence(first.pickup.id);
  record(t, "downgrade-first", downgradedFirst);
  assert.equal(downgradedFirst.status, "CANCELLED");

  const second = await chain();
  release = await hold("driver", second.driver.id);
  const releasing = settle(reconcile(second));
  await waitForWaiters(1, "reconciliation holding the equipment lock");
  const lateDowngrade = settle(m.equipment.setEquipmentStatus(users.fleetAdmin, second.tractor.id, "OUT_OF_SERVICE"));
  await waitForWaiters(2, "downgrade on the equipment lock");
  await release();
  assert.ok((await releasing.result).ok);
  assert.ok((await lateDowngrade.result).ok);
  const moved = await pickupEvidence(second.pickup.id);
  const holds = await m.prisma.operatingException.findMany({ where: { entityId: second.assignment.id } });
  record(t, "reconciliation-first", { ...moved, holds: holds.map((h) => `${h.exceptionType}:${h.severity}`) });
  assert.equal(moved.status, "RELEASED");
  assert.ok(holds.some((h) => h.exceptionType === "EQUIPMENT_SAFETY_MOVEMENT_HOLD" && h.severity === "CRITICAL"));
});

test("S0-I9-01 scenario 3: two simultaneous reconciliations release once", async (t) => {
  const c = await chain();
  const outcomes = await Promise.allSettled([reconcile(c), reconcile(c)]);
  const evidence = await pickupEvidence(c.pickup.id);
  record(t, "double-reconciliation", { outcomes: outcomes.map((o) => (o.status === "fulfilled" ? "ok" : statusOf(o.reason))), ...evidence });
  assert.equal(outcomes.filter((o) => o.status === "fulfilled").length, 1);
  assert.equal(evidence.status, "RELEASED");
  assert.equal(evidence.attempts.filter((a) => a === "RELEASED").length, 1);
});

test("S0-I9-01 scenario 5: retry after an earlier STOP", async (t) => {
  // Dock STOP is durable and terminal.
  const stopped = await chain();
  await assert.rejects(() => reconcile(stopped, { intendedDisposition: "STOP" }), (e: unknown) => statusOf(e) === 409);
  await assert.rejects(() => reconcile(stopped), (e: unknown) => statusOf(e) === 409);
  const stopEvidence = await pickupEvidence(stopped.pickup.id);
  record(t, "retry-after-dock-stop", stopEvidence);
  assert.equal(stopEvidence.status, "STOPPED");
  assert.ok(!stopEvidence.attempts.includes("RELEASED"));

  // Retry after a movement-denied 409, once the credential is renewed.
  const denied = await chain();
  await expireLicense(denied);
  await assert.rejects(() => reconcile(denied), (e: unknown) => statusOf(e) === 409);
  const afterDenial = await pickupEvidence(denied.pickup.id);
  await expireLicense(denied, false);
  const retry = await reconcile(denied).then(() => "RELEASED", (e: unknown) => `refused ${statusOf(e)}`);
  const afterRetry = await pickupEvidence(denied.pickup.id);
  record(t, "retry-after-movement-denial", { afterDenial, retry, afterRetry });
  assert.notEqual(afterDenial.status, "RELEASED");
});

test("S0-I9-01 L + scenario 6: a failure after authorization and before release persistence rolls everything back", async (t) => {
  await m.prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION i9r_inject_failure() RETURNS trigger AS $$
    BEGIN
      IF NEW."evidenceReference" = '${FAILURE_MARKER}' THEN
        RAISE EXCEPTION 'i9r injected failure';
      END IF;
      RETURN NEW;
    END $$ LANGUAGE plpgsql`);
  await m.prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS i9r_inject_failure ON "PickupPhysicalReconciliation"`);
  await m.prisma.$executeRawUnsafe(`CREATE TRIGGER i9r_inject_failure BEFORE INSERT OR UPDATE ON "PickupPhysicalReconciliation" FOR EACH ROW EXECUTE FUNCTION i9r_inject_failure()`);
  try {
    const c = await chain();
    await assert.rejects(() => reconcile(c, { evidenceReference: FAILURE_MARKER }), /i9r injected failure/);
    const evidence = await pickupEvidence(c.pickup.id);
    record(t, "injected-failure", evidence);
    assert.equal(evidence.status, "PENDING");
    assert.deepEqual(evidence.attempts, []);
    assert.equal(evidence.physical, null);
  } finally {
    await m.prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS i9r_inject_failure ON "PickupPhysicalReconciliation"`);
    await m.prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS i9r_inject_failure()`);
  }
});

// ---------------------------------------------------------------- S0-I9-02: equipment status authority

async function tractor(status: "AVAILABLE" | "UNAVAILABLE" | "OUT_OF_SERVICE", fleetId = fleetA) {
  const row = await m.prisma.equipment.create({ data: { fleetId, equipmentType: "TRACTOR", unitNumber: `I9RE-${stamp}-${ids.equipment.length}`, status } });
  ids.equipment.push(row.id);
  return row;
}
const statusNow = async (id: string) => (await m.prisma.equipment.findUniqueOrThrow({ where: { id } })).status;
const forbidden = (e: unknown) => statusOf(e) === 403;

test("S0-I9-02 A/B/C/F/G: restoration authority comes from current database membership in the equipment's fleet", async (t) => {
  const results: Record<string, string> = {};
  const attempt = async (label: string, session: Session, from: "OUT_OF_SERVICE" | "UNAVAILABLE") => {
    const row = await tractor(from);
    results[label] = await m.equipment.setEquipmentStatus(session, row.id, "AVAILABLE").then(() => "allowed", (e: unknown) => `refused ${statusOf(e)}`);
    return statusNow(row.id);
  };
  // DRIVER, even when the session claims FLEET_ADMIN.
  assert.equal(await attempt("driver-oos", users.driverUser, "OUT_OF_SERVICE"), "OUT_OF_SERVICE");
  assert.equal(await attempt("driver-unavailable", users.driverUser, "UNAVAILABLE"), "UNAVAILABLE");
  assert.equal(await attempt("driver-claiming-admin", claim(users.driverUser, fleetA, "FLEET_ADMIN"), "OUT_OF_SERVICE"), "OUT_OF_SERVICE");
  // Inactive, invited, suspended, missing and wrong-fleet memberships.
  assert.equal(await attempt("inactive-membership", claim(users.inactiveAdmin, fleetA, "FLEET_ADMIN"), "OUT_OF_SERVICE"), "OUT_OF_SERVICE");
  assert.equal(await attempt("invited-membership", claim(users.invitedAdmin, fleetA, "FLEET_ADMIN"), "OUT_OF_SERVICE"), "OUT_OF_SERVICE");
  assert.equal(await attempt("suspended-user", claim(users.suspendedAdmin, fleetA, "FLEET_ADMIN"), "OUT_OF_SERVICE"), "OUT_OF_SERVICE");
  assert.equal(await attempt("no-membership-claiming-admin", claim(users.noMembership, fleetA, "FLEET_ADMIN"), "OUT_OF_SERVICE"), "OUT_OF_SERVICE");
  assert.equal(await attempt("fleet-b-admin-claiming-a", claim(users.adminB, fleetA, "FLEET_ADMIN"), "OUT_OF_SERVICE"), "OUT_OF_SERVICE");
  assert.equal(await attempt("bof-ops-member-elsewhere", users.bofOpsElsewhere, "OUT_OF_SERVICE"), "OUT_OF_SERVICE");
  record(t, "refusals", results);
  for (const [label, outcome] of Object.entries(results)) assert.equal(outcome, "refused 403", label);
});

test("S0-I9-02 D/E: each permitted role restores; DISPATCH downgrades but cannot restore", async (t) => {
  const results: Record<string, string> = {};
  for (const [label, session] of Object.entries({ fleetAdmin: users.fleetAdmin, fleetOps: users.fleetOps, fleetManager: users.fleetManager, bofOps: users.bofOps, compliance: users.compliance })) {
    for (const from of ["OUT_OF_SERVICE", "UNAVAILABLE"] as const) {
      const row = await tractor(from);
      await m.equipment.setEquipmentStatus(session, row.id, "AVAILABLE");
      results[`${label}:${from}->AVAILABLE`] = await statusNow(row.id);
    }
  }
  const d = await tractor("AVAILABLE");
  await m.equipment.setEquipmentStatus(users.dispatcher, d.id, "UNAVAILABLE");
  results["dispatch:AVAILABLE->UNAVAILABLE"] = await statusNow(d.id);
  await m.equipment.setEquipmentStatus(users.dispatcher, d.id, "OUT_OF_SERVICE");
  results["dispatch:UNAVAILABLE->OUT_OF_SERVICE"] = await statusNow(d.id);
  await assert.rejects(() => m.equipment.setEquipmentStatus(users.dispatcher, d.id, "AVAILABLE"), forbidden);
  results["dispatch:OUT_OF_SERVICE->AVAILABLE"] = await statusNow(d.id);
  const u = await tractor("UNAVAILABLE");
  await assert.rejects(() => m.equipment.setEquipmentStatus(users.dispatcher, u.id, "AVAILABLE"), forbidden);
  results["dispatch:UNAVAILABLE->AVAILABLE"] = await statusNow(u.id);
  const relax = await tractor("OUT_OF_SERVICE");
  results["dispatch:OUT_OF_SERVICE->UNAVAILABLE"] = await m.equipment.setEquipmentStatus(users.dispatcher, relax.id, "UNAVAILABLE").then(() => "allowed", (e: unknown) => `refused ${statusOf(e)}`);
  record(t, "role-matrix", results);
  for (const [label, status] of Object.entries(results)) {
    if (label.endsWith("->AVAILABLE") && !label.startsWith("dispatch")) assert.equal(status, "AVAILABLE", label);
  }
  assert.equal(results["dispatch:OUT_OF_SERVICE->AVAILABLE"], "OUT_OF_SERVICE");
  assert.equal(results["dispatch:UNAVAILABLE->AVAILABLE"], "UNAVAILABLE");
});

test("S0-I9-02 H/I/J: an open critical condition blocks restoration, including one committed while the restore waits", async (t) => {
  const blocked = await tractor("OUT_OF_SERVICE");
  await openCriticalCondition(blocked.id);
  await assert.rejects(() => m.equipment.setEquipmentStatus(users.fleetAdmin, blocked.id, "AVAILABLE"), (e: unknown) => statusOf(e) === 422);

  const racing = await tractor("OUT_OF_SERVICE");
  const release = await hold("equipment", racing.id);
  const condition = settle(m.conditions.createCondition(users.dispatcher, { equipmentId: racing.id, title: "Brake failure", category: "SAFETY", severity: "CRITICAL" }));
  await waitForWaiters(1, "condition creation");
  const restore = settle(m.equipment.setEquipmentStatus(users.fleetAdmin, racing.id, "AVAILABLE"));
  await waitForWaiters(2, "restore");
  await release();
  assert.ok((await condition.result).ok);
  const restored = await restore.result;
  record(t, "condition-then-restore", { restore: restored.ok ? "allowed" : `refused ${statusOf(restored.error)}`, status: await statusNow(racing.id) });
  assert.equal(restored.ok, false);
  assert.equal(await statusNow(racing.id), "OUT_OF_SERVICE");
});

test(
  "S0-I9-02 K: a DISPATCH 'AVAILABLE' request cannot undo a concurrent OUT_OF_SERVICE downgrade",
  { todo: "RECERT DEFECT S0-I9R-02: restore intent is classified from the status read before the equipment lock" },
  async (t) => {
  // Equipment is AVAILABLE. A fleet admin takes it out of service while a dispatcher's AVAILABLE request (classified
  // from the pre-transaction read as a no-op) waits on the equipment lock.
  const row = await tractor("AVAILABLE");
  const release = await hold("equipment", row.id);
  const downgrade = settle(m.equipment.setEquipmentStatus(users.fleetAdmin, row.id, "OUT_OF_SERVICE"));
  await waitForWaiters(1, "downgrade");
  const dispatcherAvailable = settle(m.equipment.setEquipmentStatus(users.dispatcher, row.id, "AVAILABLE"));
  await waitForWaiters(2, "dispatcher request");
  await release();
  assert.ok((await downgrade.result).ok);
  const outcome = await dispatcherAvailable.result;
  const audits = await m.prisma.auditEvent.findMany({ where: { entityType: "Equipment", entityId: row.id, action: "UPDATED" }, orderBy: { createdAt: "asc" } });
  record(t, "dispatcher-vs-downgrade", {
    dispatcherRequest: outcome.ok ? "allowed" : `refused ${statusOf(outcome.error)}`,
    finalStatus: await statusNow(row.id),
    auditTrail: audits.map((a) => `${(a.details as { previousStatus?: string }).previousStatus}->${(a.details as { newStatus?: string }).newStatus}`),
  });
  assert.equal(await statusNow(row.id), "OUT_OF_SERVICE", "DISPATCH must not return OUT_OF_SERVICE equipment to service");

  },
);

test("S0-I9-02 L: I-8 invalidation still runs on a DISPATCH downgrade", async (t) => {
  const c = await chain();
  await m.equipment.setEquipmentStatus(users.dispatcher, c.trailer.id, "OUT_OF_SERVICE");
  const evidence = await pickupEvidence(c.pickup.id);
  record(t, "dispatch-downgrade-invalidation", evidence);
  assert.equal(evidence.status, "CANCELLED");
});
