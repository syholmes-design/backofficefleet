import assert from "node:assert/strict";
import test from "node:test";

import { assertTestDatabaseTarget } from "@/lib/test/assertTestDatabaseTarget";

function statusOf(error: unknown) {
  return error && typeof error === "object" && "statusCode" in error
    ? Number((error as { statusCode?: number }).statusCode)
    : 0;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test("concurrent qualification writes cannot bypass the driver-scoped assignment lock", async () => {
  assertTestDatabaseTarget(process.env.DATABASE_URL);
  const { prisma } = await import("@/lib/prisma");
  const { createAssignment } = await import("@/lib/services/dispatchAssignmentService");
  const { createQualifiedDriverEvidence, cleanupQualifiedDriverEvidence } = await import("@/lib/test/qualifiedDriverFixture");
  const { lockDriverReadinessWrite } = await import("@/lib/services/readinessService");
  const { recordOperatingProcessEvent } = await import("@/lib/process-intelligence/operating-event-service");
  const { getOperatingProcessStore } = await import("@/lib/process-intelligence/runtime-store");

  const database = await prisma.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
  assert.equal(database[0]?.name, "bof_dev");

  const stamp = Date.now().toString(36);
  const dispatchRole = await prisma.role.upsert({
    where: { code: "DISPATCH" },
    update: {},
    create: { code: "DISPATCH", name: "Dispatch" },
  });
  const aggregator = await prisma.aggregator.create({ data: { name: `Lock ${stamp}` } });
  const group = await prisma.carrierGroup.create({
    data: { aggregatorId: aggregator.id, name: `Lock group ${stamp}` },
  });
  const fleetA = await prisma.fleet.create({
    data: { slug: `lock-a-${stamp}`, name: `Lock A ${stamp}`, carrierGroupId: group.id },
  });
  const fleetB = await prisma.fleet.create({
    data: { slug: `lock-b-${stamp}`, name: `Lock B ${stamp}`, carrierGroupId: group.id },
  });
  const dispatcher = await prisma.user.create({
    data: { email: `lock-dispatch-${stamp}@dev.local`, name: "Lock Dispatch" },
  });
  await prisma.fleetMembership.create({
    data: { userId: dispatcher.id, fleetId: fleetA.id, roleId: dispatchRole.id, status: "ACTIVE" },
  });
  const complianceRole = await prisma.role.upsert({
    where: { code: "BOF_COMPLIANCE_REVIEW" },
    update: {},
    create: { code: "BOF_COMPLIANCE_REVIEW", name: "BOF Compliance Review" },
  });
  const complianceUser = await prisma.user.create({
    data: { email: `lock-compliance-${stamp}@dev.local`, name: "Lock Compliance" },
  });
  await prisma.fleetMembership.create({
    data: { userId: complianceUser.id, fleetId: fleetA.id, roleId: complianceRole.id, status: "ACTIVE" },
  });
  const licenseByDriver = new Map<string, string>();
  const actor = {
    id: dispatcher.id,
    email: dispatcher.email,
    memberships: [{ fleetId: fleetA.id, roleCode: "DISPATCH", status: "ACTIVE" }],
  };

  const ids = {
    loadIds: [] as string[],
    driverIds: [] as string[],
    equipmentIds: [] as string[],
    assignmentIds: [] as string[],
    readinessIds: [] as string[],
  };

  async function makeDriver(fleetId: string) {
    const driver = await prisma.driver.create({
      data: {
        fleetId,
        firstName: "Lock",
        lastName: stamp,
        email: `lock-drv-${stamp}-${Math.random().toString(16).slice(2)}@dev.local`,
        status: "ACTIVE",
      },
    });
    const score = await prisma.driverReadinessScore.create({
      data: {
        driverId: driver.id,
        fleetId,
        status: "READY",
        policyVersion: "concurrency",
        summary: "ready before contention",
        score: 90,
        evaluatedAt: new Date(Date.now() - 60_000),
      },
    });
    ids.driverIds.push(driver.id);
    ids.readinessIds.push(score.id);
    if (fleetId === fleetA.id) {
      const evidence = await createQualifiedDriverEvidence(prisma, {
        driverId: driver.id,
        fleetId,
        complianceUserId: complianceUser.id,
      });
      licenseByDriver.set(driver.id, evidence.licenseDocumentId);
    }
    return driver;
  }

  async function makeLoad(fleetId: string) {
    const load = await prisma.load.create({
      data: {
        fleetId,
        customerName: "Lock Shipper",
        origin: "Dallas, TX",
        destination: "Atlanta, GA",
        status: "PLANNED",
      },
    });
    ids.loadIds.push(load.id);
    return load;
  }

  async function makeTractor(fleetId: string) {
    const tractor = await prisma.equipment.create({
      data: {
        fleetId,
        equipmentType: "TRACTOR",
        unitNumber: `LK-${stamp}-${Math.random().toString(16).slice(2, 8)}`,
        status: "AVAILABLE",
      },
    });
    ids.equipmentIds.push(tractor.id);
    return tractor;
  }

  try {
    const blockedDriver = await makeDriver(fleetA.id);
    const blockedLoad = await makeLoad(fleetA.id);
    const blockedTractor = await makeTractor(fleetA.id);
    const otherDriver = await makeDriver(fleetA.id);
    const otherLoad = await makeLoad(fleetA.id);
    const otherTractor = await makeTractor(fleetA.id);
    const foreignDriver = await makeDriver(fleetB.id);

    let releaseHold = () => {};
    const release = new Promise<void>((resolve) => {
      releaseHold = resolve;
    });
    let markLocked = () => {};
    const locked = new Promise<void>((resolve) => {
      markLocked = resolve;
    });

    const holder = prisma.$transaction(async (tx) => {
      await lockDriverReadinessWrite(tx, blockedDriver.id);
      markLocked();
      await release;
      // Compliance rejects the license while the assignment waits on the driver lock.
      await tx.driverDocument.update({
        where: { id: licenseByDriver.get(blockedDriver.id)! },
        data: { status: "REJECTED" },
      });
    }, { timeout: 20_000 });

    await locked;
    let blockedSettled = false;
    const blockedAttempt = createAssignment(actor, blockedLoad.id, blockedDriver.id, blockedTractor.id, null).then(
      (value) => {
        blockedSettled = true;
        return value;
      },
      (error) => {
        blockedSettled = true;
        throw error;
      },
    );
    const otherAssignment = await createAssignment(actor, otherLoad.id, otherDriver.id, otherTractor.id, null);
    ids.assignmentIds.push(otherAssignment.id);
    assert.equal(otherAssignment.status, "ACTIVE");
    assert.equal(blockedSettled, false);
    await assert.rejects(
      () =>
        createAssignment(actor, otherLoad.id, foreignDriver.id, otherTractor.id, null),
      (error: unknown) => statusOf(error) === 422,
    );

    releaseHold();
    await holder;
    await assert.rejects(blockedAttempt, (error: unknown) => statusOf(error) === 409);
    assert.equal(await prisma.dispatchAssignment.count({ where: { loadId: blockedLoad.id } }), 0);

    const releasedDriver = await makeDriver(fleetA.id);
    const releasedLoad = await makeLoad(fleetA.id);
    const releasedTractor = await makeTractor(fleetA.id);
    let releaseRollback = () => {};
    const rollbackGate = new Promise<void>((resolve) => {
      releaseRollback = resolve;
    });
    let markRollbackLocked = () => {};
    const rollbackLocked = new Promise<void>((resolve) => {
      markRollbackLocked = resolve;
    });
    const rollbackHolder = prisma.$transaction(async (tx) => {
      await lockDriverReadinessWrite(tx, releasedDriver.id);
      markRollbackLocked();
      await rollbackGate;
      throw new Error("rollback readiness lock");
    }, { timeout: 20_000 });
    await rollbackLocked;
    let releasedSettled = false;
    const releasedAttempt = createAssignment(actor, releasedLoad.id, releasedDriver.id, releasedTractor.id, null).then(
      (value) => {
        releasedSettled = true;
        return value;
      },
      (error) => {
        releasedSettled = true;
        throw error;
      },
    );
    await wait(300);
    assert.equal(releasedSettled, false);
    releaseRollback();
    await assert.rejects(rollbackHolder, /rollback readiness lock/);
    const releasedAssignment = await releasedAttempt;
    ids.assignmentIds.push(releasedAssignment.id);
    assert.equal(releasedAssignment.status, "ACTIVE");

    const store = getOperatingProcessStore();
    const mismatchedId = `mismatch-${stamp}`;
    await assert.rejects(
      () =>
        recordOperatingProcessEvent(
          store,
          actor,
          {
            fleetId: fleetB.id,
            loadId: blockedLoad.id,
            entityType: "DispatchAssignment",
            entityId: mismatchedId,
            eventType: "DISPATCH_ASSIGNED",
            processStage: "DISPATCH",
            eventTimestamp: new Date(),
            actorId: actor.id,
            actorType: "USER",
            resultingState: "ACTIVE",
            lineage: { sourceSystem: "BOF", sourceRecordId: mismatchedId },
          },
          { authorizedFleetId: fleetA.id },
        ),
      (error: unknown) => statusOf(error) === 403,
    );
    assert.equal(await prisma.operatingProcessEvent.count({ where: { entityId: mismatchedId } }), 0);

    const membershipId = `membership-${stamp}`;
    await assert.rejects(
      () =>
        recordOperatingProcessEvent(store, actor, {
          fleetId: fleetB.id,
          loadId: blockedLoad.id,
          entityType: "DispatchAssignment",
          entityId: membershipId,
          eventType: "DISPATCH_ASSIGNED",
          processStage: "DISPATCH",
          eventTimestamp: new Date(),
          actorId: actor.id,
          actorType: "USER",
          resultingState: "ACTIVE",
          lineage: { sourceSystem: "BOF", sourceRecordId: membershipId },
        }),
      (error: unknown) => statusOf(error) === 403,
    );
    assert.equal(await prisma.operatingProcessEvent.count({ where: { entityId: membershipId } }), 0);
  } finally {
    await prisma.operatingProcessEvent.deleteMany({ where: { loadId: { in: ids.loadIds } } });
    await prisma.auditEvent.deleteMany({ where: { tenantId: { in: [fleetA.id, fleetB.id] } } });
    await prisma.dispatchAssignment.deleteMany({ where: { loadId: { in: ids.loadIds } } });
    await prisma.driverReadinessScore.deleteMany({ where: { driverId: { in: ids.driverIds } } });
    await cleanupQualifiedDriverEvidence(prisma, ids.driverIds);
    await prisma.load.deleteMany({ where: { id: { in: ids.loadIds } } });
    await prisma.equipment.deleteMany({ where: { id: { in: ids.equipmentIds } } });
    await prisma.driver.deleteMany({ where: { id: { in: ids.driverIds } } });
    await prisma.fleetMembership.deleteMany({ where: { fleetId: { in: [fleetA.id, fleetB.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [dispatcher.id, complianceUser.id] } } });
    await prisma.fleet.deleteMany({ where: { id: { in: [fleetA.id, fleetB.id] } } });
    await prisma.carrierGroup.deleteMany({ where: { id: group.id } });
    await prisma.aggregator.deleteMany({ where: { id: aggregator.id } });
  }
});
