import assert from "node:assert/strict";
import test, { after, before, type TestContext } from "node:test";

import { assertTestDatabaseTarget } from "@/lib/test/assertTestDatabaseTarget";

/**
 * Stage 0 I-9 final re-certification (certification-only): checks that the S0-I9R-01 / S0-I9R-02 corrections hold
 * beyond the reproductions in stage0.i9-recertification.test.ts — the 409 contract after a durable STOP, retry after
 * renewal, post-commit audit failure, the dispatcher's 403 and audit accuracy. Real isolated PostgreSQL only.
 */
assertTestDatabaseTarget(process.env.DATABASE_URL);
const stamp = `i9f${Date.now().toString(36)}`;

function statusOf(error: unknown) {
  return error && typeof error === "object" && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) : 0;
}
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
type Settled<T> = { result: Promise<{ ok: true; value: T } | { ok: false; error: unknown }> };
const settle = <T,>(p: Promise<T>): Settled<T> => ({ result: p.then((value) => ({ ok: true as const, value }), (error: unknown) => ({ ok: false as const, error })) });

const load = async () => {
  const { prisma } = await import("@/lib/prisma");
  return {
    prisma,
    fixture: await import("@/lib/test/qualifiedDriverFixture"),
    assignments: await import("@/lib/services/dispatchAssignmentService"),
    releases: await import("@/lib/services/dispatchReleaseService"),
    pickups: await import("@/lib/services/pickupAuthorizationService"),
    physical: await import("@/lib/services/pickupPhysicalReconciliationService"),
    equipment: await import("@/lib/services/equipmentService"),
    equipmentLocks: await import("@/lib/services/equipmentSafetyInvalidationService"),
  };
};
type Mods = Awaited<ReturnType<typeof load>>;
type Session = { id: string; email: string; memberships: Array<{ fleetId: string; roleCode: string; status: string }> };
type Chain = {
  driver: { id: string };
  evidence: { licenseDocumentId: string };
  load: { id: string };
  tractor: { id: string; unitNumber: string; vin: string | null };
  trailer: { id: string; unitNumber: string };
  pickup: { id: string; token: string };
};

let m: Mods;
let groupId = "";
let aggregatorId = "";
let fleetA = "";
const users: Record<string, Session> = {};
const ids = { drivers: [] as string[], loads: [] as string[] };

async function member(label: string, roleCode: string) {
  const role = await m.prisma.role.upsert({ where: { code: roleCode }, update: {}, create: { code: roleCode, name: roleCode } });
  const user = await m.prisma.user.create({ data: { email: `i9f-${label}-${stamp}@dev.local`, name: label } });
  await m.prisma.fleetMembership.create({ data: { userId: user.id, fleetId: fleetA, roleId: role.id, status: "ACTIVE" } });
  return { id: user.id, email: user.email, memberships: [{ fleetId: fleetA, roleCode, status: "ACTIVE" }] } as Session;
}

async function chain(): Promise<Chain> {
  const { prisma } = m;
  const n = ids.drivers.length;
  const driver = await prisma.driver.create({ data: { fleetId: fleetA, firstName: "I9F", lastName: stamp, email: `i9f-drv-${stamp}-${n}@dev.local`, status: "ACTIVE" } });
  ids.drivers.push(driver.id);
  const evidence = await m.fixture.createQualifiedDriverEvidence(prisma, { driverId: driver.id, fleetId: fleetA, complianceUserId: users.compliance.id });
  const loadRow = await prisma.load.create({
    data: {
      fleetId: fleetA, customerName: "I9F", origin: "Dallas, TX", destination: "Atlanta, GA", status: "PLANNED",
      pickupWindowStart: new Date(Date.now() + 3_600_000), pickupWindowEnd: new Date(Date.now() + 8 * 3_600_000),
    },
  });
  ids.loads.push(loadRow.id);
  const tractor = await prisma.equipment.create({ data: { fleetId: fleetA, equipmentType: "TRACTOR", unitNumber: `I9FT-${stamp}-${n}`, vin: `1XPBDP9X0F9${String(n).padStart(6, "0")}`, status: "AVAILABLE" } });
  const trailer = await prisma.equipment.create({ data: { fleetId: fleetA, equipmentType: "TRAILER", unitNumber: `I9FL-${stamp}-${n}`, status: "AVAILABLE" } });
  const assignment = await m.assignments.createAssignment(users.dispatcher, loadRow.id, driver.id, tractor.id, trailer.id);
  await prisma.preTripHeader.create({ data: { fleetId: fleetA, assignmentId: assignment.id, status: "COMPLETED", completedAt: new Date(), completedByUserId: users.dispatcher.id } });
  await prisma.driverReadinessScore.create({ data: { driverId: driver.id, fleetId: fleetA, status: "READY", policyVersion: "i9f", summary: "i9f", score: 90 } });
  assert.equal((await m.releases.createDispatchReleaseWithMovementAuthorization(users.dispatcher, loadRow.id, "RELEASE")).movement.allowed, true);
  const issued = await m.pickups.issuePickupAuthorization(users.dispatcher, loadRow.id);
  return { driver, evidence, load: loadRow, tractor, trailer, pickup: { id: issued.authorization.id, token: issued.credential.token } };
}

const reconcile = (c: Chain) =>
  m.physical.reconcilePickupPhysicalArrival(users.dispatcher, c.pickup.id, {
    token: c.pickup.token,
    method: "SHIPPER_DOCK",
    arriving: {
      authorizationId: c.pickup.id, loadId: c.load.id, driverId: c.driver.id, tractorId: c.tractor.id, trailerId: c.trailer.id,
      tractorUnitNumber: c.tractor.unitNumber, trailerUnitNumber: c.trailer.unitNumber, vin: c.tractor.vin, qr: c.tractor.unitNumber,
    },
    evidenceReference: `i9f-dock-${c.pickup.id}`,
    intendedDisposition: "RELEASE",
  });
const verify = (c: Chain) =>
  m.pickups.verifyPickupAuthorization(users.dispatcher, c.pickup.id, {
    token: c.pickup.token,
    presented: { authorizationId: c.pickup.id, loadId: c.load.id, driverId: c.driver.id, tractorEquipmentId: c.tractor.id, trailerEquipmentId: c.trailer.id },
  });
const setLicenseExpiry = (c: Chain, daysFromNow: number) =>
  m.prisma.driverDocument.update({ where: { id: c.evidence.licenseDocumentId }, data: { verificationExpiresAt: new Date(Date.now() + daysFromNow * 86_400_000) } });

async function pickupEvidence(pickupId: string) {
  const row = await m.prisma.pickupAuthorization.findUniqueOrThrow({ where: { id: pickupId }, include: { verificationAttempts: { orderBy: { createdAt: "asc" } }, physicalReconciliation: true } });
  const audits = await m.prisma.auditEvent.findMany({ where: { tenantId: fleetA, entityType: "PickupPhysicalReconciliation", entityId: row.physicalReconciliation?.id ?? "__none__" } });
  return {
    status: row.status,
    attempts: row.verificationAttempts.map((a) => a.result),
    physical: row.physicalReconciliation?.disposition ?? null,
    physicalAudits: audits.map((a) => (a.details as { disposition?: string }).disposition),
  };
}
const record = (t: TestContext, label: string, value: unknown) => t.diagnostic(`EVIDENCE ${label}: ${JSON.stringify(value)}`);

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
async function holdEquipment(id: string) {
  let release = () => {};
  const gate = new Promise<void>((resolve) => (release = resolve));
  let markLocked = () => {};
  const locked = new Promise<void>((resolve) => (markLocked = resolve));
  const done = m.prisma.$transaction(async (tx) => {
    await m.equipmentLocks.lockEquipmentSafetyWrite(tx, id);
    markLocked();
    await gate;
  }, { timeout: 30_000 });
  await locked;
  return () => {
    release();
    return done;
  };
}

/** Fails audit inserts for this test's fleet that match the given details->>'event' and disposition. */
async function injectAuditFailure(event: string, disposition: string) {
  await m.prisma.$executeRawUnsafe(`
    CREATE OR REPLACE FUNCTION i9f_audit_failure() RETURNS trigger AS $$
    BEGIN
      IF NEW."tenantId" = '${fleetA}' AND NEW."details"->>'event' = '${event}' AND NEW."details"->>'disposition' = '${disposition}' THEN
        RAISE EXCEPTION 'i9f injected audit failure';
      END IF;
      RETURN NEW;
    END $$ LANGUAGE plpgsql`);
  await m.prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS i9f_audit_failure ON "AuditEvent"`);
  await m.prisma.$executeRawUnsafe(`CREATE TRIGGER i9f_audit_failure BEFORE INSERT ON "AuditEvent" FOR EACH ROW EXECUTE FUNCTION i9f_audit_failure()`);
}
async function clearAuditFailure() {
  await m.prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS i9f_audit_failure ON "AuditEvent"`);
  await m.prisma.$executeRawUnsafe(`DROP FUNCTION IF EXISTS i9f_audit_failure()`);
}

before(async () => {
  m = await load();
  const database = await m.prisma.$queryRaw<Array<{ name: string; addr: string | null }>>`SELECT current_database() AS name, host(inet_server_addr()) AS addr`;
  assert.equal(database[0]?.name, "bof_dev");
  assert.equal(database[0]?.addr, "127.0.0.1");
  aggregatorId = (await m.prisma.aggregator.create({ data: { name: `I9F ${stamp}` } })).id;
  groupId = (await m.prisma.carrierGroup.create({ data: { aggregatorId, name: `I9F ${stamp}` } })).id;
  fleetA = (await m.prisma.fleet.create({ data: { slug: `i9f-a-${stamp}`, name: `I9F A ${stamp}`, carrierGroupId: groupId } })).id;
  users.dispatcher = await member("dispatch", "DISPATCH");
  users.compliance = await member("compliance", "BOF_COMPLIANCE_REVIEW");
  users.fleetAdmin = await member("fleet-admin", "FLEET_ADMIN");
});

after(async () => {
  if (!m) return;
  const { prisma } = m;
  await clearAuditFailure();
  await prisma.operationalChatNotification.deleteMany({ where: { tenantId: fleetA } });
  await prisma.operationalChatThread.deleteMany({ where: { tenantId: fleetA } });
  await prisma.operatingCorrectiveAction.deleteMany({ where: { fleetId: fleetA } });
  await prisma.operatingProcessEvent.deleteMany({ where: { fleetId: fleetA } });
  await prisma.operatingException.deleteMany({ where: { fleetId: fleetA } });
  await prisma.auditEvent.deleteMany({ where: { tenantId: fleetA } });
  await prisma.pickupPhysicalReconciliation.deleteMany({ where: { fleetId: fleetA } });
  await prisma.pickupVerificationAttempt.deleteMany({ where: { fleetId: fleetA } });
  await prisma.pickupAuthorization.deleteMany({ where: { fleetId: fleetA } });
  await prisma.dispatchRelease.deleteMany({ where: { fleetId: fleetA } });
  await prisma.conditionEvent.deleteMany({ where: { conditionThread: { fleetId: fleetA } } });
  await prisma.conditionThread.deleteMany({ where: { fleetId: fleetA } });
  await prisma.preTripHeader.deleteMany({ where: { fleetId: fleetA } });
  await prisma.dispatchAssignment.deleteMany({ where: { fleetId: fleetA } });
  await prisma.driverReadinessScore.deleteMany({ where: { driverId: { in: ids.drivers } } });
  await prisma.driverQualificationSnapshot.deleteMany({ where: { driverId: { in: ids.drivers } } });
  await prisma.verificationSource.deleteMany({ where: { driverDocument: { driverId: { in: ids.drivers } } } });
  await m.fixture.cleanupQualifiedDriverEvidence(prisma, ids.drivers);
  await prisma.load.deleteMany({ where: { id: { in: ids.loads } } });
  await prisma.equipment.deleteMany({ where: { fleetId: fleetA } });
  await prisma.driver.deleteMany({ where: { id: { in: ids.drivers } } });
  await prisma.fleetMembership.deleteMany({ where: { fleetId: fleetA } });
  await prisma.user.deleteMany({ where: { email: { endsWith: `-${stamp}@dev.local` } } });
  await prisma.fleet.deleteMany({ where: { id: fleetA } });
  await prisma.carrierGroup.deleteMany({ where: { id: groupId } });
  await prisma.aggregator.deleteMany({ where: { id: aggregatorId } });
});

test("R-01: the 409 is returned after the STOP commits, and carries the committed STOPPED state and audit", async (t) => {
  const c = await chain();
  await setLicenseExpiry(c, -1);
  const error = await reconcile(c).then(() => null, (e: unknown) => e as { statusCode?: number; payload?: { authorization?: { status?: string }; physical?: { disposition?: string }; attempt?: { result?: string } } });
  const evidence = await pickupEvidence(c.pickup.id);
  record(t, "denied", { statusCode: error?.statusCode, payloadAuthorization: error?.payload?.authorization?.status, payloadPhysical: error?.payload?.physical?.disposition, payloadAttempt: error?.payload?.attempt?.result, ...evidence });
  assert.equal(statusOf(error), 409);
  assert.equal(error?.payload?.authorization?.status, "STOPPED");
  assert.equal(evidence.status, "STOPPED");
  assert.deepEqual(evidence.attempts, ["STOPPED"]);
  assert.equal(evidence.physical, "STOP");
  assert.deepEqual(evidence.physicalAudits, ["STOP"]);
});

test("R-01: a stopped pickup cannot be released by retry after the credential is renewed (reconcile or verify)", async (t) => {
  const c = await chain();
  await setLicenseExpiry(c, -1);
  await assert.rejects(() => reconcile(c), (e: unknown) => statusOf(e) === 409);
  await setLicenseExpiry(c, 300);
  const reconcileRetry = await reconcile(c).then(() => "RELEASED", (e: unknown) => `refused ${statusOf(e)}`);
  const verifyRetry = await verify(c).then((r) => r.authorization.status, (e: unknown) => `refused ${statusOf(e)}`);
  const evidence = await pickupEvidence(c.pickup.id);
  record(t, "retry-after-renewal", { reconcileRetry, verifyRetry, ...evidence });
  assert.match(reconcileRetry, /^refused 409$/);
  assert.match(verifyRetry, /^refused 409$/);
  assert.equal(evidence.status, "STOPPED");
  assert.ok(!evidence.attempts.includes("RELEASED"));
});

test("R-01: a failure of the post-commit STOP audit leaves the STOP durable; record how the API reports it", async (t) => {
  const c = await chain();
  await setLicenseExpiry(c, -1);
  await injectAuditFailure("pickup.physical_reconciliation", "STOP");
  let error: unknown = null;
  try {
    await reconcile(c).catch((e: unknown) => {
      error = e;
    });
  } finally {
    await clearAuditFailure();
  }
  const evidence = await pickupEvidence(c.pickup.id);
  record(t, "stop-audit-failure", {
    statusCode: statusOf(error) || "none (route maps to 500)",
    message: error instanceof Error ? error.message.slice(0, 80) : String(error),
    ...evidence,
  });
  assert.ok(error, "the request fails");
  assert.equal(evidence.status, "STOPPED", "the STOP committed before the audit is durable");
  assert.deepEqual(evidence.attempts, ["STOPPED"]);
  assert.equal(evidence.physical, "STOP");
  assert.deepEqual(evidence.physicalAudits, [], "the STOP audit row is missing");
});

test("R-01: a failure of the post-commit RELEASE audit (comparison)", async (t) => {
  const c = await chain();
  await injectAuditFailure("pickup.physical_reconciliation", "RELEASE");
  let error: unknown = null;
  try {
    await reconcile(c).catch((e: unknown) => {
      error = e;
    });
  } finally {
    await clearAuditFailure();
  }
  const evidence = await pickupEvidence(c.pickup.id);
  record(t, "release-audit-failure", { statusCode: statusOf(error) || "none (route maps to 500)", ...evidence });
  assert.ok(error);
  assert.equal(evidence.status, "RELEASED", "the RELEASE committed before the audit is durable");
});

test("R-02: the waiting dispatcher receives 403, the equipment stays OUT_OF_SERVICE, and the audit trail is accurate", async (t) => {
  const row = await m.prisma.equipment.create({ data: { fleetId: fleetA, equipmentType: "TRACTOR", unitNumber: `I9FE-${stamp}-race`, status: "AVAILABLE" } });
  const release = await holdEquipment(row.id);
  const downgrade = settle(m.equipment.setEquipmentStatus(users.fleetAdmin, row.id, "OUT_OF_SERVICE"));
  await waitForWaiters(1, "downgrade");
  const dispatcherRequest = settle(m.equipment.setEquipmentStatus(users.dispatcher, row.id, "AVAILABLE"));
  await waitForWaiters(2, "dispatcher request");
  await release();
  assert.ok((await downgrade.result).ok);
  const outcome = await dispatcherRequest.result;
  const status = (await m.prisma.equipment.findUniqueOrThrow({ where: { id: row.id } })).status;
  const updates = await m.prisma.auditEvent.findMany({ where: { entityType: "Equipment", entityId: row.id, action: "UPDATED" }, orderBy: { createdAt: "asc" } });
  const denials = await m.prisma.auditEvent.count({ where: { entityId: row.id, action: "ACCESS_DENIED", actorId: users.dispatcher.id } });
  const trail = updates.map((a) => `${(a.details as { previousStatus?: string }).previousStatus}->${(a.details as { newStatus?: string }).newStatus}`);
  record(t, "dispatcher-race", { dispatcherRequest: outcome.ok ? "allowed" : `refused ${statusOf(outcome.error)}`, status, trail, dispatcherDenialAudits: denials });
  assert.equal(outcome.ok, false);
  assert.equal(statusOf(!outcome.ok ? outcome.error : null), 403);
  assert.equal(status, "OUT_OF_SERVICE");
  assert.deepEqual(trail, ["AVAILABLE->OUT_OF_SERVICE"]);
  assert.equal(denials, 1);
});

test("R-02: an authorized restore waiting on the lock records the status it actually replaced", async (t) => {
  const row = await m.prisma.equipment.create({ data: { fleetId: fleetA, equipmentType: "TRACTOR", unitNumber: `I9FE-${stamp}-restore`, status: "UNAVAILABLE" } });
  const release = await holdEquipment(row.id);
  const downgrade = settle(m.equipment.setEquipmentStatus(users.dispatcher, row.id, "OUT_OF_SERVICE"));
  await waitForWaiters(1, "downgrade");
  const restore = settle(m.equipment.setEquipmentStatus(users.fleetAdmin, row.id, "AVAILABLE"));
  await waitForWaiters(2, "restore");
  await release();
  assert.ok((await downgrade.result).ok);
  assert.ok((await restore.result).ok);
  const updates = await m.prisma.auditEvent.findMany({ where: { entityType: "Equipment", entityId: row.id, action: "UPDATED" }, orderBy: { createdAt: "asc" } });
  const trail = updates.map((a) => `${(a.details as { previousStatus?: string }).previousStatus}->${(a.details as { newStatus?: string }).newStatus}`);
  record(t, "restore-trail", trail);
  assert.deepEqual(trail, ["UNAVAILABLE->OUT_OF_SERVICE", "OUT_OF_SERVICE->AVAILABLE"]);
});
