import assert from "node:assert/strict";
import test from "node:test";

import { assertTestDatabaseTarget } from "@/lib/test/assertTestDatabaseTarget";

function statusOf(error: unknown) {
  return error && typeof error === "object" && "statusCode" in error
    ? Number((error as { statusCode?: number }).statusCode)
    : 0;
}

/**
 * Stage 0 I-5: assignment authorization (V4) and the PLANNING_RESERVE gate in createAssignment.
 * Runs against the isolated bof_dev database only.
 */
test("assignment creation and unassignment require dispatch authority in the target fleet and a planning-eligible driver", async () => {
  assertTestDatabaseTarget(process.env.DATABASE_URL);
  const { prisma } = await import("@/lib/prisma");
  const { createAssignment, unassign } = await import("@/lib/services/dispatchAssignmentService");
  const { createQualifiedDriverEvidence, cleanupQualifiedDriverEvidence } = await import("@/lib/test/qualifiedDriverFixture");

  const database = await prisma.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
  assert.equal(database[0]?.name, "bof_dev");

  const stamp = `i5${Date.now().toString(36)}`;
  const role = (code: string) => prisma.role.upsert({ where: { code }, update: {}, create: { code, name: code } });
  const roles = {
    DISPATCH: await role("DISPATCH"),
    DRIVER: await role("DRIVER"),
    BOF_OPERATIONS: await role("BOF_OPERATIONS"),
    BOF_COMPLIANCE_REVIEW: await role("BOF_COMPLIANCE_REVIEW"),
    FLEET_ADMIN: await role("FLEET_ADMIN"),
  };
  const aggregator = await prisma.aggregator.create({ data: { name: `I5 ${stamp}` } });
  const group = await prisma.carrierGroup.create({ data: { aggregatorId: aggregator.id, name: `I5 ${stamp}` } });
  const fleetA = await prisma.fleet.create({ data: { slug: `i5-a-${stamp}`, name: `I5 A ${stamp}`, carrierGroupId: group.id } });
  const fleetB = await prisma.fleet.create({ data: { slug: `i5-b-${stamp}`, name: `I5 B ${stamp}`, carrierGroupId: group.id } });
  await prisma.aggregatorFleet.create({ data: { aggregatorId: aggregator.id, fleetId: fleetA.id, status: "ACTIVE" } });

  const user = (name: string) => prisma.user.create({ data: { email: `i5-${name}-${stamp}@dev.local`, name } });
  const member = (userId: string, fleetId: string, roleCode: keyof typeof roles) =>
    prisma.fleetMembership.create({ data: { userId, fleetId, roleId: roles[roleCode].id, status: "ACTIVE" } });
  const dispatcherA = await user("dispatch-a");
  const dispatcherB = await user("dispatch-b");
  const driverUser = await user("driver");
  const opsInA = await user("ops-a");
  const opsOnlyInB = await user("ops-b");
  const complianceA = await user("compliance-a");
  const fleetAdminA = await user("fleet-admin-a");
  const aggregatorOnly = await user("aggregator-only");
  const linkedDispatcher = await user("linked-dispatcher");
  await member(dispatcherA.id, fleetA.id, "DISPATCH");
  await member(dispatcherB.id, fleetB.id, "DISPATCH");
  await member(driverUser.id, fleetA.id, "DRIVER");
  await member(opsInA.id, fleetA.id, "BOF_OPERATIONS");
  await member(opsOnlyInB.id, fleetB.id, "BOF_OPERATIONS");
  await member(complianceA.id, fleetA.id, "BOF_COMPLIANCE_REVIEW");
  await member(fleetAdminA.id, fleetA.id, "FLEET_ADMIN");
  await member(linkedDispatcher.id, fleetA.id, "DISPATCH");
  await prisma.aggregatorMembership.create({ data: { userId: aggregatorOnly.id, aggregatorId: aggregator.id, roleId: roles.BOF_OPERATIONS.id, status: "ACTIVE" } });

  // Sessions deliberately claim whatever the caller says: authorization must come from the database.
  const session = (u: { id: string; email: string }, memberships: Array<{ fleetId: string; roleCode: string }>) => ({
    id: u.id,
    email: u.email,
    memberships: memberships.map((m) => ({ ...m, status: "ACTIVE" })),
  });
  const asDispatcherA = session(dispatcherA, [{ fleetId: fleetA.id, roleCode: "DISPATCH" }]);

  const ids = { drivers: [] as string[], loads: [] as string[], equipment: [] as string[] };
  const makeDriver = async (opts: { qualified?: boolean; userId?: string } = {}) => {
    const driver = await prisma.driver.create({
      data: { fleetId: fleetA.id, firstName: "I5", lastName: stamp, email: `i5-drv-${stamp}-${ids.drivers.length}@dev.local`, status: "ACTIVE", userId: opts.userId ?? null },
    });
    ids.drivers.push(driver.id);
    const evidence = opts.qualified === false ? null : await createQualifiedDriverEvidence(prisma, { driverId: driver.id, fleetId: fleetA.id, complianceUserId: complianceA.id });
    return { driver, evidence };
  };
  const makeLoad = async () => {
    const load = await prisma.load.create({ data: { fleetId: fleetA.id, customerName: "I5 Shipper", origin: "Dallas, TX", destination: "Atlanta, GA", status: "PLANNED" } });
    ids.loads.push(load.id);
    return load;
  };
  const makeEquipment = async (equipmentType: "TRACTOR" | "TRAILER", status: "AVAILABLE" | "UNAVAILABLE" | "OUT_OF_SERVICE" = "AVAILABLE") => {
    const row = await prisma.equipment.create({ data: { fleetId: fleetA.id, equipmentType, unitNumber: `I5-${stamp}-${ids.equipment.length}`, status } });
    ids.equipment.push(row.id);
    return row;
  };
  const setup = async (opts: Parameters<typeof makeDriver>[0] = {}) => ({ ...(await makeDriver(opts)), load: await makeLoad(), tractor: await makeEquipment("TRACTOR") });
  const countFor = (loadId: string) => prisma.dispatchAssignment.count({ where: { loadId } });
  const lastDenial = () =>
    prisma.auditEvent.findFirst({
      where: { entityType: "DispatchAssignment", tenantId: fleetA.id, action: "ACCESS_DENIED" },
      orderBy: { createdAt: "desc" },
    });

  try {
    // Authorized dispatcher assigns a QUALIFIED driver; the audit records the planning decision.
    const ok = await setup();
    const created = await createAssignment(asDispatcherA, ok.load.id, ok.driver.id, ok.tractor.id, null);
    assert.equal(created.status, "ACTIVE");
    const createdAudit = await prisma.auditEvent.findFirst({ where: { entityType: "DispatchAssignment", entityId: created.id, action: "CREATED" } });
    const createdDetails = createdAudit?.details as Record<string, unknown> | null;
    assert.equal(createdDetails?.planningDisposition, "PLANNING_ALLOWED");
    assert.equal(createdDetails?.driverQualificationPolicyVersion, "bof-stage0-driver-qualification-v1");
    assert.equal(createdDetails?.movementPolicyVersion, "bof-stage0-movement-v1");
    assert.equal(createdDetails?.authorizedRole, "DISPATCH");

    // DRIVER cannot create, cancel or supersede assignments (own or another driver's).
    const driverAttempt = await setup();
    await assert.rejects(
      () => createAssignment(session(driverUser, [{ fleetId: fleetA.id, roleCode: "DISPATCH" }]), driverAttempt.load.id, driverAttempt.driver.id, driverAttempt.tractor.id, null),
      (error: unknown) => statusOf(error) === 403,
    );
    assert.equal(await countFor(driverAttempt.load.id), 0);
    assert.equal(((await lastDenial())?.details as { reason?: string } | null)?.reason, "DRIVER_ROLE");
    const ownAssignmentDriver = await setup({ userId: driverUser.id });
    const ownAssignment = await createAssignment(asDispatcherA, ownAssignmentDriver.load.id, ownAssignmentDriver.driver.id, ownAssignmentDriver.tractor.id, null);
    for (const status of ["CANCELLED", "SUPERSEDED"] as const) {
      for (const target of [ownAssignment.id, created.id]) {
        await assert.rejects(() => unassign(session(driverUser, [{ fleetId: fleetA.id, roleCode: "DISPATCH" }]), target, status), (error: unknown) => statusOf(error) === 403);
      }
    }
    assert.equal((await prisma.dispatchAssignment.findUnique({ where: { id: ownAssignment.id } }))?.status, "ACTIVE");
    assert.equal((await prisma.dispatchAssignment.findUnique({ where: { id: created.id } }))?.status, "ACTIVE");

    // Fleet members without dispatch authority (compliance) cannot create or unassign.
    const complianceAttempt = await setup();
    await assert.rejects(
      () => createAssignment(session(complianceA, [{ fleetId: fleetA.id, roleCode: "BOF_COMPLIANCE_REVIEW" }]), complianceAttempt.load.id, complianceAttempt.driver.id, complianceAttempt.tractor.id, null),
      (error: unknown) => statusOf(error) === 403,
    );
    assert.equal(((await lastDenial())?.details as { reason?: string } | null)?.reason, "ROLE_REQUIRED");
    await assert.rejects(() => unassign(session(complianceA, [{ fleetId: fleetA.id, roleCode: "BOF_COMPLIANCE_REVIEW" }]), created.id, "CANCELLED"), (error: unknown) => statusOf(error) === 403);

    // Cross-fleet and aggregator-only access cannot change fleet A assignments.
    const crossFleet = await setup();
    for (const actor of [
      session(dispatcherB, [{ fleetId: fleetB.id, roleCode: "DISPATCH" }]),
      session(opsOnlyInB, [{ fleetId: fleetB.id, roleCode: "BOF_OPERATIONS" }]),
      session(aggregatorOnly, []),
    ]) {
      await assert.rejects(() => createAssignment(actor, crossFleet.load.id, crossFleet.driver.id, crossFleet.tractor.id, null), (error: unknown) => statusOf(error) === 403);
      await assert.rejects(() => unassign(actor, created.id, "CANCELLED"), (error: unknown) => statusOf(error) === 403);
    }
    assert.equal(await countFor(crossFleet.load.id), 0);
    assert.equal((await prisma.dispatchAssignment.findUnique({ where: { id: created.id } }))?.status, "ACTIVE");

    // BOF operations staff act within an explicitly granted fleet membership.
    const opsAssignment = await createAssignment(session(opsInA, [{ fleetId: fleetA.id, roleCode: "BOF_OPERATIONS" }]), crossFleet.load.id, crossFleet.driver.id, crossFleet.tractor.id, null);
    assert.equal(opsAssignment.fleetId, fleetA.id);
    const opsUnassigned = await unassign(session(opsInA, [{ fleetId: fleetA.id, roleCode: "BOF_OPERATIONS" }]), opsAssignment.id, "CANCELLED");
    assert.equal(opsUnassigned.status, "CANCELLED");
    assert.equal(opsUnassigned.unassignedByUserId, opsInA.id);

    // A dispatcher cannot assign or unassign the driver record linked to their own user.
    const self = await setup({ userId: linkedDispatcher.id });
    await assert.rejects(
      () => createAssignment(session(linkedDispatcher, [{ fleetId: fleetA.id, roleCode: "DISPATCH" }]), self.load.id, self.driver.id, self.tractor.id, null),
      (error: unknown) => statusOf(error) === 403,
    );
    assert.equal(((await lastDenial())?.details as { reason?: string } | null)?.reason, "SELF_ASSIGNMENT");

    // PENDING_COMPLIANCE: no evidence (a stored READY score is ignored). Denied before any row is written.
    const pending = await setup({ qualified: false });
    await prisma.driverReadinessScore.create({ data: { driverId: pending.driver.id, fleetId: fleetA.id, status: "READY", policyVersion: "test", summary: "stale" } });
    await assert.rejects(() => createAssignment(asDispatcherA, pending.load.id, pending.driver.id, pending.tractor.id, null), (error: unknown) => statusOf(error) === 409);
    assert.equal(await countFor(pending.load.id), 0);
    const pendingDenial = (await lastDenial())?.details as { reason?: string; reasonCodes?: string[] } | null;
    assert.equal(pendingDenial?.reason, "PENDING_COMPLIANCE");
    assert.ok(pendingDenial?.reasonCodes?.includes("DRIVER_PLANNING_DENIED"));
    assert.equal(await prisma.operatingProcessEvent.count({ where: { loadId: pending.load.id, eventType: "DISPATCH_ASSIGNED" } }), 0);

    // NOT_QUALIFIED: rejected license.
    const rejected = await setup();
    await prisma.driverDocument.update({ where: { id: rejected.evidence!.licenseDocumentId }, data: { status: "REJECTED" } });
    await assert.rejects(() => createAssignment(asDispatcherA, rejected.load.id, rejected.driver.id, rejected.tractor.id, null), (error: unknown) => statusOf(error) === 409);
    assert.equal(await countFor(rejected.load.id), 0);
    assert.equal(((await lastDenial())?.details as { reason?: string } | null)?.reason, "NOT_QUALIFIED");

    // CONDITIONAL (internal policy waiver only, movement permitted) follows the planning policy: allowed.
    const conditional = await setup();
    await prisma.driverIntakeRequirement.create({
      data: { driverIntakeId: conditional.evidence!.intakeId, requirementType: "OTHER", label: "fleet policy", isRequired: true, status: "SATISFIED", exceptionReason: "fleet policy waiver" },
    });
    const conditionalAssignment = await createAssignment(asDispatcherA, conditional.load.id, conditional.driver.id, conditional.tractor.id, null);
    const conditionalAudit = await prisma.auditEvent.findFirst({ where: { entityType: "DispatchAssignment", entityId: conditionalAssignment.id, action: "CREATED" } });
    assert.equal((conditionalAudit?.details as { driverQualificationStatus?: string } | null)?.driverQualificationStatus, "CONDITIONAL");

    // OUT_OF_SERVICE tractor or trailer is blocked; UNAVAILABLE is allowed for planning.
    const oosTractor = { ...(await makeDriver()), load: await makeLoad(), tractor: await makeEquipment("TRACTOR", "OUT_OF_SERVICE") };
    await assert.rejects(() => createAssignment(asDispatcherA, oosTractor.load.id, oosTractor.driver.id, oosTractor.tractor.id, null), (error: unknown) => statusOf(error) === 422);
    const oosTrailer = await setup();
    const trailer = await makeEquipment("TRAILER", "OUT_OF_SERVICE");
    await assert.rejects(() => createAssignment(asDispatcherA, oosTrailer.load.id, oosTrailer.driver.id, oosTrailer.tractor.id, trailer.id), (error: unknown) => statusOf(error) === 422);
    assert.equal(await countFor(oosTractor.load.id) + (await countFor(oosTrailer.load.id)), 0);
    const unavailable = { ...(await makeDriver()), load: await makeLoad(), tractor: await makeEquipment("TRACTOR", "UNAVAILABLE") };
    assert.equal((await createAssignment(asDispatcherA, unavailable.load.id, unavailable.driver.id, unavailable.tractor.id, null)).status, "ACTIVE");

    // An open safety-critical condition is advisory at planning: assignment proceeds and the audit records it.
    const advisory = await setup();
    const condition = await prisma.conditionThread.create({
      data: {
        fleetId: fleetA.id, equipmentId: advisory.tractor.id, title: "Brake warning", category: "SAFETY", severity: "CRITICAL",
        observationSource: "DRIVER", lifecycleState: "IDENTIFIED", createdByUserId: dispatcherA.id,
      },
    });
    const advisoryAssignment = await createAssignment(asDispatcherA, advisory.load.id, advisory.driver.id, advisory.tractor.id, null);
    const advisoryAudit = await prisma.auditEvent.findFirst({ where: { entityType: "DispatchAssignment", entityId: advisoryAssignment.id, action: "CREATED" } });
    assert.deepEqual((advisoryAudit?.details as { advisoryOpenConditionIds?: string[] } | null)?.advisoryOpenConditionIds, [condition.id]);

    // Concurrent unassignment: exactly one succeeds; the loser cannot overwrite the closure.
    const racing = await setup();
    const racingAssignment = await createAssignment(asDispatcherA, racing.load.id, racing.driver.id, racing.tractor.id, null);
    const results = await Promise.allSettled([
      unassign(asDispatcherA, racingAssignment.id, "CANCELLED"),
      unassign(session(opsInA, [{ fleetId: fleetA.id, roleCode: "BOF_OPERATIONS" }]), racingAssignment.id, "SUPERSEDED"),
    ]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    assert.ok(results.some((r) => r.status === "rejected" && [409, 422].includes(statusOf(r.reason))));
    const closed = await prisma.dispatchAssignment.findUnique({ where: { id: racingAssignment.id } });
    const winner = results.find((r) => r.status === "fulfilled") as PromiseFulfilledResult<{ status: string }>;
    assert.equal(closed?.status, winner.value.status);

    // Concurrent creation for the same driver: at most one ACTIVE assignment.
    const contested = await makeDriver();
    const loads = [await makeLoad(), await makeLoad()];
    const tractors = [await makeEquipment("TRACTOR"), await makeEquipment("TRACTOR")];
    const createResults = await Promise.allSettled(loads.map((load, i) => createAssignment(asDispatcherA, load.id, contested.driver.id, tractors[i].id, null)));
    assert.equal(createResults.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(await prisma.dispatchAssignment.count({ where: { driverId: contested.driver.id, status: "ACTIVE" } }), 1);

    // Existing operations still work: dispatcher supersedes and reassigns the load to another qualified driver.
    await unassign(asDispatcherA, created.id, "SUPERSEDED");
    const replacement = await makeDriver();
    const reassigned = await createAssignment(asDispatcherA, ok.load.id, replacement.driver.id, ok.tractor.id, null);
    assert.equal(reassigned.status, "ACTIVE");
    const fleetAdminUnassign = await unassign(session(fleetAdminA, [{ fleetId: fleetA.id, roleCode: "FLEET_ADMIN" }]), reassigned.id, "CANCELLED");
    assert.equal(fleetAdminUnassign.status, "CANCELLED");
    await assert.rejects(() => unassign(asDispatcherA, reassigned.id, "CANCELLED"), (error: unknown) => statusOf(error) === 422);

    // The pre-creation path is planning-only: release and pickup always evaluate the persisted assignment.
    const { authorizeMovement } = await import("@/lib/services/dispatchMovementAuthorizationService");
    await assert.rejects(
      () =>
        prisma.$transaction((tx) =>
          authorizeMovement(tx, "RELEASE", {
            sessionUser: asDispatcherA,
            loadId: ok.load.id,
            proposedAssignment: { driverId: replacement.driver.id, tractorId: ok.tractor.id },
          }),
        ),
      (error: unknown) => statusOf(error) === 422,
    );
  } finally {
    const fleets = [fleetA.id, fleetB.id];
    await prisma.auditEvent.deleteMany({ where: { tenantId: { in: fleets } } });
    await prisma.operatingProcessEvent.deleteMany({ where: { fleetId: { in: fleets } } });
    await prisma.conditionEvent.deleteMany({ where: { conditionThread: { fleetId: { in: fleets } } } });
    await prisma.conditionThread.deleteMany({ where: { fleetId: { in: fleets } } });
    await prisma.dispatchAssignment.deleteMany({ where: { fleetId: { in: fleets } } });
    await prisma.driverReadinessScore.deleteMany({ where: { fleetId: { in: fleets } } });
    await cleanupQualifiedDriverEvidence(prisma, ids.drivers);
    await prisma.load.deleteMany({ where: { id: { in: ids.loads } } });
    await prisma.equipment.deleteMany({ where: { id: { in: ids.equipment } } });
    await prisma.driver.deleteMany({ where: { id: { in: ids.drivers } } });
    await prisma.aggregatorMembership.deleteMany({ where: { aggregatorId: aggregator.id } });
    await prisma.aggregatorFleet.deleteMany({ where: { aggregatorId: aggregator.id } });
    await prisma.fleetMembership.deleteMany({ where: { fleetId: { in: fleets } } });
    await prisma.user.deleteMany({ where: { email: { endsWith: `-${stamp}@dev.local` } } });
    await prisma.fleet.deleteMany({ where: { id: { in: fleets } } });
    await prisma.carrierGroup.delete({ where: { id: group.id } });
    await prisma.aggregator.delete({ where: { id: aggregator.id } });
  }
});
