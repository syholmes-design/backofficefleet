import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";

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

async function outcome<T>(tracked: Settled<T>) {
  const result = await tracked.result;
  if (!result.ok) throw result.error;
  return result.value;
}

/**
 * Stage 0 I-2: writes to driver qualification evidence take the driver qualification lock that
 * getAuthoritativeDriverQualification callers (assignment planning, release, pickup) hold while they evaluate.
 * Ordering is made deterministic by holding the lock in a test transaction and watching pg_locks for waiters
 * (PostgreSQL grants conflicting advisory lock requests in arrival order). Runs against bof_dev only.
 */
test("qualification evidence writes serialize with assignment, release and pickup authorization", async () => {
  assertTestDatabaseTarget(process.env.DATABASE_URL);
  const { prisma } = await import("@/lib/prisma");
  const { lockDriverReadinessWrite } = await import("@/lib/services/readinessService");
  const { createQualifiedDriverEvidence, cleanupQualifiedDriverEvidence } = await import("@/lib/test/qualifiedDriverFixture");
  const documents = await import("@/lib/services/documentService");
  const requirements = await import("@/lib/services/requirementService");
  const { createDriverIntakeRecord } = await import("@/lib/services/intakeService");
  const { createAuthenticatedDriverVaultDocument } = await import("@/lib/services/driverDocumentVersioningService");
  const { initiateDriverClaim, completeDriverClaim } = await import("@/lib/services/driverClaimService");
  const { createAssignment } = await import("@/lib/services/dispatchAssignmentService");
  const { createDispatchReleaseWithMovementAuthorization } = await import("@/lib/services/dispatchReleaseService");
  const { authorizeMovement, authorizeMovementForLoad } = await import("@/lib/services/dispatchMovementAuthorizationService");
  const { issuePickupAuthorization, verifyPickupAuthorization } = await import("@/lib/services/pickupAuthorizationService");

  const database = await prisma.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
  assert.equal(database[0]?.name, "bof_dev");

  const lockWaiters = async () => {
    const rows = await prisma.$queryRaw<Array<{ n: bigint }>>`
      SELECT count(*)::bigint AS n FROM pg_locks
      WHERE locktype = 'advisory' AND NOT granted
        AND database = (SELECT oid FROM pg_database WHERE datname = current_database())`;
    return Number(rows[0]?.n ?? 0);
  };
  const waitForLockWaiters = async (count: number, label: string) => {
    const deadline = Date.now() + 10_000;
    while ((await lockWaiters()) < count) {
      if (Date.now() > deadline) assert.fail(`${label}: expected ${count} transaction(s) waiting on the driver qualification lock`);
      await sleep(20);
    }
  };
  const holdDriverLock = async (driverId: string) => {
    let release = () => {};
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    let markLocked = () => {};
    const locked = new Promise<void>((resolve) => {
      markLocked = resolve;
    });
    const done = prisma.$transaction(async (tx) => {
      await lockDriverReadinessWrite(tx, driverId);
      markLocked();
      await gate;
    }, { timeout: 30_000 });
    await locked;
    return () => {
      release();
      return done;
    };
  };
  /** The write must block while another transaction holds the driver's qualification lock. */
  const assertTakesDriverLock = async <T>(label: string, driverId: string, write: () => Promise<T>) => {
    const release = await holdDriverLock(driverId);
    const run = settle(write());
    await waitForLockWaiters(1, label);
    await sleep(100);
    assert.equal(run.settled, false, `${label} must wait for the driver qualification lock`);
    await release();
    return outcome(run);
  };

  const stamp = `i2${Date.now().toString(36)}`;
  const role = (code: string) => prisma.role.upsert({ where: { code }, update: {}, create: { code, name: code } });
  const roles = { DISPATCH: await role("DISPATCH"), BOF_COMPLIANCE_REVIEW: await role("BOF_COMPLIANCE_REVIEW") };
  const aggregator = await prisma.aggregator.create({ data: { name: `I2 ${stamp}` } });
  const group = await prisma.carrierGroup.create({ data: { aggregatorId: aggregator.id, name: `I2 ${stamp}` } });
  const fleet = await prisma.fleet.create({ data: { slug: `i2-${stamp}`, name: `I2 ${stamp}`, carrierGroupId: group.id } });
  const user = (name: string) => prisma.user.create({ data: { email: `i2-${name}-${stamp}@dev.local`, name } });
  const dispatcher = await user("dispatch");
  const compliance = await user("compliance");
  await prisma.fleetMembership.create({ data: { userId: dispatcher.id, fleetId: fleet.id, roleId: roles.DISPATCH.id, status: "ACTIVE" } });
  await prisma.fleetMembership.create({ data: { userId: compliance.id, fleetId: fleet.id, roleId: roles.BOF_COMPLIANCE_REVIEW.id, status: "ACTIVE" } });
  const session = (u: { id: string; email: string }, roleCode: string) => ({
    id: u.id,
    email: u.email,
    memberships: [{ fleetId: fleet.id, roleCode, status: "ACTIVE" }],
  });
  const asDispatcher = session(dispatcher, "DISPATCH");
  const asCompliance = session(compliance, "BOF_COMPLIANCE_REVIEW");

  const ids = { drivers: [] as string[], loads: [] as string[], equipment: [] as string[], users: [] as string[] };
  const makeDriver = async (opts: { qualified?: boolean; userId?: string } = {}) => {
    const driver = await prisma.driver.create({
      data: { fleetId: fleet.id, firstName: "I2", lastName: stamp, email: `i2-drv-${stamp}-${ids.drivers.length}@dev.local`, status: "ACTIVE", userId: opts.userId ?? null },
    });
    ids.drivers.push(driver.id);
    const evidence = opts.qualified === false
      ? null
      : await createQualifiedDriverEvidence(prisma, { driverId: driver.id, fleetId: fleet.id, complianceUserId: compliance.id });
    return { driver, evidence };
  };
  const makeEquipment = async (equipmentType: "TRACTOR" | "TRAILER") => {
    const row = await prisma.equipment.create({ data: { fleetId: fleet.id, equipmentType, unitNumber: `I2-${stamp}-${ids.equipment.length}`, status: "AVAILABLE" } });
    ids.equipment.push(row.id);
    return row;
  };
  const makeLoad = async () => {
    const load = await prisma.load.create({
      data: {
        fleetId: fleet.id, customerName: "I2 Shipper", origin: "Dallas, TX", destination: "Atlanta, GA", status: "PLANNED",
        pickupWindowStart: new Date(Date.now() + 3_600_000), pickupWindowEnd: new Date(Date.now() + 8 * 3_600_000),
      },
    });
    ids.loads.push(load.id);
    return load;
  };
  /** A QUALIFIED driver on an ACTIVE assignment with a completed pre-trip: ready for RELEASE and pickup. */
  const releaseReadyChain = async () => {
    const { driver, evidence } = await makeDriver();
    const load = await makeLoad();
    const tractor = await makeEquipment("TRACTOR");
    const trailer = await makeEquipment("TRAILER");
    const assignment = await createAssignment(asDispatcher, load.id, driver.id, tractor.id, trailer.id);
    await prisma.preTripHeader.create({
      data: { fleetId: fleet.id, assignmentId: assignment.id, status: "COMPLETED", completedAt: new Date(), completedByUserId: dispatcher.id },
    });
    await prisma.driverReadinessScore.create({ data: { driverId: driver.id, fleetId: fleet.id, status: "READY", policyVersion: "i2-test", summary: "i2", score: 90 } });
    return { driver, evidence: evidence!, load, tractor, trailer, assignment };
  };
  const rejectLicense = (licenseDocumentId: string) =>
    documents.updateDriverDocumentRecord({ sessionUser: asCompliance, documentId: licenseDocumentId, payload: { status: "REJECTED", rejectionReason: "license suspended" } });

  try {
    // 1. Every application path that changes qualification evidence takes the driver's qualification lock.
    const vaultUser = await user("vault-driver");
    ids.users.push(vaultUser.id);
    const subject = await makeDriver({ userId: vaultUser.id });
    const subjectId = subject.driver.id;
    const intakeId = subject.evidence!.intakeId;

    await assertTakesDriverLock("document upload", subjectId, () =>
      documents.createDriverDocumentRecord({
        sessionUser: asDispatcher,
        intakeId,
        payload: { documentType: "MEDICAL", storageKey: `test/i2/${stamp}/medical-2`, originalFileName: "medical-2.pdf" },
      }),
    );
    const pending = await prisma.driverDocument.create({
      data: {
        driverId: subjectId, driverIntakeId: intakeId, fleetId: fleet.id, type: "OTHER", status: "PENDING_VERIFICATION",
        storageKey: `test/i2/${stamp}/pending`, originalFileName: "pending.pdf", uploadedByUserId: dispatcher.id,
      },
    });
    const verified = await assertTakesDriverLock("document verification", subjectId, () =>
      documents.updateDriverDocumentRecord({ sessionUser: asCompliance, documentId: pending.id, payload: { status: "VERIFIED" } }),
    );
    assert.equal(verified.status, "VERIFIED");
    const rejected = await assertTakesDriverLock("document rejection", subjectId, () => rejectLicense(subject.evidence!.licenseDocumentId));
    assert.equal(rejected.status, "REJECTED");
    assert.ok(await prisma.auditEvent.findFirst({ where: { entityId: rejected.id, details: { path: ["event"], equals: "document.rejected" } } }));
    const exception = await assertTakesDriverLock("requirement exception", subjectId, () =>
      requirements.createDriverRequirementRecord({
        sessionUser: asDispatcher,
        intakeId,
        payload: { requirementType: "OTHER", label: "fleet policy", exceptionReason: "fleet waiver" },
      }),
    );
    await assertTakesDriverLock("requirement update", subjectId, () =>
      requirements.updateDriverRequirementRecord({ sessionUser: asDispatcher, requirementId: exception.id, payload: { exceptionReason: "revised waiver" } }),
    );
    await assertTakesDriverLock("requirement affirmation", subjectId, () =>
      requirements.affirmRequirementAction({ sessionUser: asDispatcher, requirementId: exception.id }),
    );
    const formData = new FormData();
    formData.set("documentType", "DRIVER_LICENSE");
    formData.set("file", new File([new Uint8Array([37, 80, 68, 70])], "license.pdf", { type: "application/pdf" }));
    await assertTakesDriverLock("driver vault upload", subjectId, () =>
      createAuthenticatedDriverVaultDocument({ id: vaultUser.id, email: vaultUser.email, memberships: [] }, formData),
    );
    await assertTakesDriverLock("intake creation", subjectId, () =>
      createDriverIntakeRecord({ sessionUser: asDispatcher, driverId: subjectId, fleetId: fleet.id }),
    );
    const claimant = await user("claimant");
    ids.users.push(claimant.id);
    const unclaimed = await makeDriver({ qualified: false });
    const { claimToken } = await initiateDriverClaim({ sessionUser: asDispatcher, driverId: unclaimed.driver.id });
    await assertTakesDriverLock("driver account claim", unclaimed.driver.id, () =>
      completeDriverClaim({ sessionUser: { id: claimant.id, email: claimant.email, memberships: [] }, claimToken }),
    );

    // 2. A rejection that commits first is seen by every authorization queued behind it.
    const raceAgainstRejection = async <T>(label: string, driverId: string, licenseDocumentId: string, authorize: () => Promise<T>) => {
      const release = await holdDriverLock(driverId);
      const rejection = settle(rejectLicense(licenseDocumentId));
      await waitForLockWaiters(1, `${label}: rejection`);
      const authorization = settle(authorize());
      await waitForLockWaiters(2, `${label}: authorization`);
      await release();
      assert.equal((await outcome(rejection)).status, "REJECTED");
      return authorization.result;
    };

    const assignTarget = await makeDriver();
    const assignLoad = await makeLoad();
    const assignTractor = await makeEquipment("TRACTOR");
    const assigned = await raceAgainstRejection("assignment", assignTarget.driver.id, assignTarget.evidence!.licenseDocumentId, () =>
      createAssignment(asDispatcher, assignLoad.id, assignTarget.driver.id, assignTractor.id, null),
    );
    assert.equal(assigned.ok, false);
    assert.equal(statusOf(!assigned.ok ? assigned.error : null), 409);
    assert.equal(await prisma.dispatchAssignment.count({ where: { loadId: assignLoad.id } }), 0);

    const releaseControl = await releaseReadyChain();
    const controlRelease = await createDispatchReleaseWithMovementAuthorization(asDispatcher, releaseControl.load.id, "RELEASE");
    assert.equal(controlRelease.movement.allowed, true, "fixture must be release-ready so the denial below is caused by the rejection");

    const releaseTarget = await releaseReadyChain();
    const released = await raceAgainstRejection("release", releaseTarget.driver.id, releaseTarget.evidence.licenseDocumentId, () =>
      createDispatchReleaseWithMovementAuthorization(asDispatcher, releaseTarget.load.id, "RELEASE"),
    );
    assert.ok(released.ok);
    assert.equal(released.value.movement.allowed, false);
    assert.equal(released.value.movement.driverQualificationStatus, "NOT_QUALIFIED");
    assert.notEqual(released.value.release.disposition, "RELEASED");

    const pickupControl = await releaseReadyChain();
    const issuedControl = await issuePickupAuthorization(asDispatcher, pickupControl.load.id);
    assert.equal(issuedControl.authorization.status, "PENDING");

    const pickupTarget = await releaseReadyChain();
    const issued = await raceAgainstRejection("pickup issue", pickupTarget.driver.id, pickupTarget.evidence.licenseDocumentId, () =>
      issuePickupAuthorization(asDispatcher, pickupTarget.load.id),
    );
    assert.equal(issued.ok, false);
    assert.equal(statusOf(!issued.ok ? issued.error : null), 409);
    assert.equal(await prisma.pickupAuthorization.count({ where: { loadId: pickupTarget.load.id } }), 0);

    const verified2 = await raceAgainstRejection("pickup verify", pickupControl.driver.id, pickupControl.evidence.licenseDocumentId, () =>
      verifyPickupAuthorization(asDispatcher, issuedControl.authorization.id, {
        token: issuedControl.credential.token,
        presented: {
          authorizationId: issuedControl.authorization.id,
          loadId: pickupControl.load.id,
          driverId: pickupControl.driver.id,
          tractorEquipmentId: pickupControl.tractor.id,
          trailerEquipmentId: pickupControl.trailer.id,
        },
      }),
    );
    assert.equal(verified2.ok, false);
    assert.equal(statusOf(!verified2.ok ? verified2.error : null), 409);
    assert.notEqual((await prisma.pickupAuthorization.findUnique({ where: { id: issuedControl.authorization.id } }))?.status, "RELEASED");

    // 3. An authorization in progress holds evidence writes until it commits; the next evaluation sees the write.
    const inFlight = await releaseReadyChain();
    let finish = () => {};
    const finishGate = new Promise<void>((resolve) => {
      finish = resolve;
    });
    let evaluated: (allowed: boolean) => void = () => {};
    const evaluatedSignal = new Promise<boolean>((resolve) => {
      evaluated = resolve;
    });
    const authorization = prisma.$transaction(async (tx) => {
      const decision = await authorizeMovement(tx, "RELEASE", { sessionUser: asDispatcher, loadId: inFlight.load.id, assignmentId: inFlight.assignment.id });
      evaluated(decision.allowed);
      await finishGate;
      return decision;
    }, { timeout: 30_000 });
    assert.equal(await evaluatedSignal, true);
    const lateRejection = settle(rejectLicense(inFlight.evidence.licenseDocumentId));
    await waitForLockWaiters(1, "rejection behind an in-flight authorization");
    await sleep(100);
    assert.equal(lateRejection.settled, false, "an evidence write must wait for an in-flight authorization to commit");
    finish();
    assert.equal((await authorization).allowed, true);
    assert.equal((await outcome(lateRejection)).status, "REJECTED");
    const after = await authorizeMovementForLoad(asDispatcher, inFlight.load.id, "RELEASE", inFlight.assignment.id);
    assert.equal(after.allowed, false);
    assert.equal(after.driverQualificationStatus, "NOT_QUALIFIED");

    // 4. Concurrent verification and rejection of one pending document: exactly one transition is applied.
    const contested = await makeDriver();
    const contestedDocument = await prisma.driverDocument.create({
      data: {
        driverId: contested.driver.id, driverIntakeId: contested.evidence!.intakeId, fleetId: fleet.id, type: "OTHER", status: "PENDING_VERIFICATION",
        storageKey: `test/i2/${stamp}/contested`, originalFileName: "contested.pdf", uploadedByUserId: dispatcher.id,
      },
    });
    const transitions = await Promise.allSettled([
      documents.updateDriverDocumentRecord({ sessionUser: asCompliance, documentId: contestedDocument.id, payload: { status: "VERIFIED" } }),
      documents.updateDriverDocumentRecord({ sessionUser: asCompliance, documentId: contestedDocument.id, payload: { status: "REJECTED" } }),
    ]);
    const applied = transitions.filter((r) => r.status === "fulfilled") as Array<PromiseFulfilledResult<{ status: string }>>;
    const refused = transitions.filter((r) => r.status === "rejected") as PromiseRejectedResult[];
    if (applied.length === 2) {
      // Both may apply only as a legal sequence: PENDING_VERIFICATION -> VERIFIED -> REJECTED.
      assert.deepEqual(applied.map((r) => r.value.status).sort(), ["REJECTED", "VERIFIED"]);
      assert.equal((await prisma.driverDocument.findUniqueOrThrow({ where: { id: contestedDocument.id } })).status, "REJECTED");
    } else {
      assert.equal(applied.length, 1);
      assert.equal(statusOf(refused[0]?.reason), 422);
      assert.equal((await prisma.driverDocument.findUniqueOrThrow({ where: { id: contestedDocument.id } })).status, applied[0].value.status);
    }
    const contestedAudits = await prisma.auditEvent.count({ where: { entityType: "DriverDocument", entityId: contestedDocument.id, action: "UPDATED" } });
    assert.equal(contestedAudits, applied.length);
  } finally {
    const drivers = ids.drivers;
    await prisma.auditEvent.deleteMany({ where: { tenantId: fleet.id } });
    await prisma.operatingProcessEvent.deleteMany({ where: { fleetId: fleet.id } });
    await prisma.pickupVerificationAttempt.deleteMany({ where: { fleetId: fleet.id } });
    await prisma.pickupAuthorization.deleteMany({ where: { fleetId: fleet.id } });
    await prisma.dispatchRelease.deleteMany({ where: { fleetId: fleet.id } });
    await prisma.preTripHeader.deleteMany({ where: { fleetId: fleet.id } });
    await prisma.dispatchAssignment.deleteMany({ where: { fleetId: fleet.id } });
    await prisma.driverReadinessScore.deleteMany({ where: { driverId: { in: drivers } } });
    await prisma.driverQualificationSnapshot.deleteMany({ where: { driverId: { in: drivers } } });
    await prisma.driverClaimToken.deleteMany({ where: { driverId: { in: drivers } } });
    await prisma.verificationSource.deleteMany({ where: { driverDocument: { driverId: { in: drivers } } } });
    await cleanupQualifiedDriverEvidence(prisma, drivers);
    await prisma.load.deleteMany({ where: { id: { in: ids.loads } } });
    await prisma.equipment.deleteMany({ where: { id: { in: ids.equipment } } });
    await prisma.driver.deleteMany({ where: { id: { in: drivers } } });
    await prisma.fleetMembership.deleteMany({ where: { fleetId: fleet.id } });
    await prisma.user.deleteMany({ where: { email: { endsWith: `-${stamp}@dev.local` } } });
    await prisma.fleet.delete({ where: { id: fleet.id } });
    await prisma.carrierGroup.delete({ where: { id: group.id } });
    await prisma.aggregator.delete({ where: { id: aggregator.id } });
    for (const driverId of drivers) {
      await rm(join(process.cwd(), "storage", "driver-vault", driverId), { recursive: true, force: true });
    }
  }
});
