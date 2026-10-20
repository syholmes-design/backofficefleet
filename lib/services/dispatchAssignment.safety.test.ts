import assert from "node:assert/strict";
import test from "node:test";

import { assertTestDatabaseTarget } from "@/lib/test/assertTestDatabaseTarget";

function statusOf(error: unknown) {
  return error && typeof error === "object" && "statusCode" in error
    ? Number((error as { statusCode?: number }).statusCode)
    : 0;
}

test("dispatch assignment readiness, caller role, fleet isolation, and disabled POD mutations", async () => {
  assertTestDatabaseTarget(process.env.DATABASE_URL);
  const { prisma } = await import("@/lib/prisma");
  const { createAssignment } = await import("@/lib/services/dispatchAssignmentService");
  const { createQualifiedDriverEvidence, cleanupQualifiedDriverEvidence } = await import("@/lib/test/qualifiedDriverFixture");
  const { assertEpodEnabled } = await import("@/lib/services/epod/deliveryLifecycle");
  const proof = await import("@/lib/services/proofSettlementHoldService");
  const delivery = await import("@/lib/services/epod/epodPersistence");

  const database = await prisma.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
  assert.equal(database[0]?.name, "bof_dev");

  const stamp = Date.now().toString(36);
  const dispatchRole = await prisma.role.upsert({
    where: { code: "DISPATCH" },
    update: {},
    create: { code: "DISPATCH", name: "Dispatch" },
  });
  const driverRole = await prisma.role.upsert({
    where: { code: "DRIVER" },
    update: {},
    create: { code: "DRIVER", name: "Driver" },
  });
  const serviceRole = await prisma.role.upsert({
    where: { code: "BOF_OPERATIONS" },
    update: {},
    create: { code: "BOF_OPERATIONS", name: "BOF Operations" },
  });
  const complianceRole = await prisma.role.upsert({
    where: { code: "BOF_COMPLIANCE_REVIEW" },
    update: {},
    create: { code: "BOF_COMPLIANCE_REVIEW", name: "BOF Compliance Review" },
  });

  const aggregator = await prisma.aggregator.create({ data: { name: `Correction ${stamp}` } });
  const group = await prisma.carrierGroup.create({
    data: { aggregatorId: aggregator.id, name: `Correction group ${stamp}` },
  });
  const fleetA = await prisma.fleet.create({
    data: { slug: `corr-a-${stamp}`, name: `Correction A ${stamp}`, carrierGroupId: group.id },
  });
  const fleetB = await prisma.fleet.create({
    data: { slug: `corr-b-${stamp}`, name: `Correction B ${stamp}`, carrierGroupId: group.id },
  });
  const dispatcher = await prisma.user.create({
    data: { email: `corr-dispatch-${stamp}@dev.local`, name: "Correction Dispatch" },
  });
  const driverUser = await prisma.user.create({
    data: { email: `corr-driver-${stamp}@dev.local`, name: "Correction Driver" },
  });
  const serviceUser = await prisma.user.create({
    data: { email: `corr-service-${stamp}@dev.local`, name: "Correction Service" },
  });
  const outsider = await prisma.user.create({
    data: { email: `corr-outsider-${stamp}@dev.local`, name: "Correction Outsider" },
  });
  const fleetServiceUser = await prisma.user.create({
    data: { email: `corr-service-a-${stamp}@dev.local`, name: "Correction Service A" },
  });
  const complianceUser = await prisma.user.create({
    data: { email: `corr-compliance-${stamp}@dev.local`, name: "Correction Compliance" },
  });
  await prisma.fleetMembership.create({
    data: { userId: dispatcher.id, fleetId: fleetA.id, roleId: dispatchRole.id, status: "ACTIVE" },
  });
  await prisma.fleetMembership.create({
    data: { userId: driverUser.id, fleetId: fleetA.id, roleId: driverRole.id, status: "ACTIVE" },
  });
  await prisma.fleetMembership.create({
    data: { userId: serviceUser.id, fleetId: fleetB.id, roleId: serviceRole.id, status: "ACTIVE" },
  });
  await prisma.fleetMembership.create({
    data: { userId: outsider.id, fleetId: fleetB.id, roleId: dispatchRole.id, status: "ACTIVE" },
  });
  await prisma.fleetMembership.create({
    data: { userId: fleetServiceUser.id, fleetId: fleetA.id, roleId: serviceRole.id, status: "ACTIVE" },
  });
  await prisma.fleetMembership.create({
    data: { userId: complianceUser.id, fleetId: fleetA.id, roleId: complianceRole.id, status: "ACTIVE" },
  });

  const ids = {
    loadIds: [] as string[],
    driverIds: [] as string[],
    equipmentIds: [] as string[],
    assignmentIds: [] as string[],
    readinessIds: [] as string[],
    settlementIds: [] as string[],
  };

  function session(user: { id: string; email: string }, fleetId: string, roleCode: string) {
    return {
      id: user.id,
      email: user.email,
      memberships: [{ fleetId, roleCode, status: "ACTIVE" }],
    };
  }

  async function makeEquipment(fleetId: string, equipmentType: "TRACTOR" | "TRAILER") {
    const row = await prisma.equipment.create({
      data: {
        fleetId,
        equipmentType,
        unitNumber: `${equipmentType.slice(0, 2)}-${stamp}-${Math.random().toString(16).slice(2, 8)}`,
        status: "AVAILABLE",
      },
    });
    ids.equipmentIds.push(row.id);
    return row;
  }

  async function makeDriver(fleetId: string, readiness: "READY" | "CONDITIONAL" | "NOT_READY" | "NONE") {
    const row = await prisma.driver.create({
      data: {
        fleetId,
        firstName: "Correction",
        lastName: stamp,
        email: `corr-drv-${stamp}-${Math.random().toString(16).slice(2)}@dev.local`,
        status: "ACTIVE",
      },
    });
    ids.driverIds.push(row.id);
    // Assignment is gated by the authoritative qualification (Stage 0 PLANNING_RESERVE), not the stored score:
    // READY → full evidence (QUALIFIED); CONDITIONAL → plus an internal policy waiver; NOT_READY → rejected
    // license (NOT_QUALIFIED); NONE → no evidence (PENDING_COMPLIANCE).
    if (readiness !== "NONE" && fleetId === fleetA.id) {
      const evidence = await createQualifiedDriverEvidence(prisma, {
        driverId: row.id,
        fleetId,
        complianceUserId: complianceUser.id,
      });
      if (readiness === "CONDITIONAL") {
        await prisma.driverIntakeRequirement.create({
          data: {
            driverIntakeId: evidence.intakeId,
            requirementType: "OTHER",
            label: "fleet policy",
            isRequired: true,
            status: "SATISFIED",
            exceptionReason: "fleet policy waiver",
          },
        });
      }
      if (readiness === "NOT_READY") {
        await prisma.driverDocument.update({ where: { id: evidence.licenseDocumentId }, data: { status: "REJECTED" } });
      }
    }
    if (readiness !== "NONE") {
      const score = await prisma.driverReadinessScore.create({
        data: {
          driverId: row.id,
          fleetId,
          status: readiness,
          policyVersion: "correction-test",
          summary: "correction readiness",
          score: readiness === "NOT_READY" ? 10 : 90,
        },
      });
      ids.readinessIds.push(score.id);
    }
    return row;
  }

  async function makeLoad(fleetId: string) {
    const row = await prisma.load.create({
      data: {
        fleetId,
        customerName: "Correction Shipper",
        origin: "Dallas, TX",
        destination: "Atlanta, GA",
        status: "PLANNED",
      },
    });
    ids.loadIds.push(row.id);
    return row;
  }

  const previousFlag = process.env.BOF_EPOD_ENABLED;

  try {
    const readyLoad = await makeLoad(fleetA.id);
    const readyDriver = await makeDriver(fleetA.id, "READY");
    const readyTractor = await makeEquipment(fleetA.id, "TRACTOR");
    const readyTrailer = await makeEquipment(fleetA.id, "TRAILER");
    const readyAssignment = await createAssignment(
      session(dispatcher, fleetA.id, "DISPATCH"),
      readyLoad.id,
      readyDriver.id,
      readyTractor.id,
      readyTrailer.id,
    );
    ids.assignmentIds.push(readyAssignment.id);
    assert.equal(readyAssignment.status, "ACTIVE");
    const readyAudit = await prisma.auditEvent.findFirst({
      where: { entityType: "DispatchAssignment", entityId: readyAssignment.id, action: "CREATED" },
    });
    assert.ok(readyAudit);

    const conditionalLoad = await makeLoad(fleetA.id);
    const conditionalDriver = await makeDriver(fleetA.id, "CONDITIONAL");
    const conditionalTractor = await makeEquipment(fleetA.id, "TRACTOR");
    const conditionalAssignment = await createAssignment(
      session(dispatcher, fleetA.id, "DISPATCH"),
      conditionalLoad.id,
      conditionalDriver.id,
      conditionalTractor.id,
      null,
    );
    ids.assignmentIds.push(conditionalAssignment.id);
    assert.equal(conditionalAssignment.driverId, conditionalDriver.id);

    const blockedLoad = await makeLoad(fleetA.id);
    const blockedDriver = await makeDriver(fleetA.id, "NOT_READY");
    const blockedTractor = await makeEquipment(fleetA.id, "TRACTOR");
    await assert.rejects(
      () =>
        createAssignment(
          session(dispatcher, fleetA.id, "DISPATCH"),
          blockedLoad.id,
          blockedDriver.id,
          blockedTractor.id,
          null,
        ),
      (error: unknown) => statusOf(error) === 409,
    );
    assert.equal(await prisma.dispatchAssignment.count({ where: { loadId: blockedLoad.id } }), 0);
    const blockedAudit = await prisma.auditEvent.findFirst({
      where: { entityType: "DispatchAssignment", tenantId: fleetA.id, action: "ACCESS_DENIED" },
      orderBy: { createdAt: "desc" },
    });
    assert.equal((blockedAudit?.details as { reason?: string } | null)?.reason, "NOT_QUALIFIED");

    const missingLoad = await makeLoad(fleetA.id);
    const missingDriver = await makeDriver(fleetA.id, "NONE");
    const missingTractor = await makeEquipment(fleetA.id, "TRACTOR");
    await assert.rejects(
      () =>
        createAssignment(
          session(dispatcher, fleetA.id, "DISPATCH"),
          missingLoad.id,
          missingDriver.id,
          missingTractor.id,
          null,
        ),
      (error: unknown) => statusOf(error) === 409,
    );
    assert.equal(await prisma.dispatchAssignment.count({ where: { loadId: missingLoad.id } }), 0);
    const missingAudit = await prisma.auditEvent.findFirst({
      where: {
        entityType: "DispatchAssignment",
        tenantId: fleetA.id,
        action: "ACCESS_DENIED",
        details: { path: ["reason"], equals: "PENDING_COMPLIANCE" },
      },
    });
    assert.ok(missingAudit);

    const driverLoad = await makeLoad(fleetA.id);
    const driverSubject = await makeDriver(fleetA.id, "READY");
    const driverTractor = await makeEquipment(fleetA.id, "TRACTOR");
    await assert.rejects(
      () =>
        createAssignment(
          session(driverUser, fleetA.id, "DRIVER"),
          driverLoad.id,
          driverSubject.id,
          driverTractor.id,
          null,
        ),
      (error: unknown) => statusOf(error) === 403,
    );
    assert.equal(await prisma.dispatchAssignment.count({ where: { loadId: driverLoad.id } }), 0);
    const driverAudit = await prisma.auditEvent.findFirst({
      where: {
        entityType: "DispatchAssignment",
        tenantId: fleetA.id,
        action: "ACCESS_DENIED",
        details: { path: ["reason"], equals: "DRIVER_ROLE" },
      },
    });
    assert.ok(driverAudit);

    const foreignDriver = await makeDriver(fleetB.id, "READY");
    const foreignLoad = await makeLoad(fleetA.id);
    const foreignTractor = await makeEquipment(fleetA.id, "TRACTOR");
    await assert.rejects(
      () =>
        createAssignment(
          session(dispatcher, fleetA.id, "DISPATCH"),
          foreignLoad.id,
          foreignDriver.id,
          foreignTractor.id,
          null,
        ),
      (error: unknown) => statusOf(error) === 422,
    );
    assert.equal(await prisma.dispatchAssignment.count({ where: { loadId: foreignLoad.id } }), 0);

    const tractorLoad = await makeLoad(fleetA.id);
    const tractorDriver = await makeDriver(fleetA.id, "READY");
    const foreignTractorRow = await makeEquipment(fleetB.id, "TRACTOR");
    await assert.rejects(
      () =>
        createAssignment(
          session(dispatcher, fleetA.id, "DISPATCH"),
          tractorLoad.id,
          tractorDriver.id,
          foreignTractorRow.id,
          null,
        ),
      (error: unknown) => statusOf(error) === 422,
    );

    const trailerLoad = await makeLoad(fleetA.id);
    const trailerDriver = await makeDriver(fleetA.id, "READY");
    const trailerTractor = await makeEquipment(fleetA.id, "TRACTOR");
    const foreignTrailer = await makeEquipment(fleetB.id, "TRAILER");
    await assert.rejects(
      () =>
        createAssignment(
          session(dispatcher, fleetA.id, "DISPATCH"),
          trailerLoad.id,
          trailerDriver.id,
          trailerTractor.id,
          foreignTrailer.id,
        ),
      (error: unknown) => statusOf(error) === 422,
    );
    assert.equal(await prisma.dispatchAssignment.count({ where: { loadId: trailerLoad.id } }), 0);

    const outsiderLoad = await makeLoad(fleetA.id);
    const outsiderDriver = await makeDriver(fleetA.id, "READY");
    const outsiderTractor = await makeEquipment(fleetA.id, "TRACTOR");
    await assert.rejects(
      () =>
        createAssignment(
          session(outsider, fleetB.id, "DISPATCH"),
          outsiderLoad.id,
          outsiderDriver.id,
          outsiderTractor.id,
          null,
        ),
      (error: unknown) => statusOf(error) === 403,
    );
    assert.equal(await prisma.dispatchAssignment.count({ where: { loadId: outsiderLoad.id } }), 0);

    const serviceLoad = await makeLoad(fleetA.id);
    const serviceDriver = await makeDriver(fleetA.id, "READY");
    const serviceTractor = await makeEquipment(fleetA.id, "TRACTOR");
    // BOF operations membership in another fleet does not authorize dispatch in fleet A.
    await assert.rejects(
      () =>
        createAssignment(
          session(serviceUser, fleetB.id, "BOF_OPERATIONS"),
          serviceLoad.id,
          serviceDriver.id,
          serviceTractor.id,
          null,
        ),
      (error: unknown) => statusOf(error) === 403,
    );
    assert.equal(await prisma.dispatchAssignment.count({ where: { loadId: serviceLoad.id } }), 0);
    const serviceAssignment = await createAssignment(
      session(fleetServiceUser, fleetA.id, "BOF_OPERATIONS"),
      serviceLoad.id,
      serviceDriver.id,
      serviceTractor.id,
      null,
    );
    ids.assignmentIds.push(serviceAssignment.id);
    assert.equal(serviceAssignment.fleetId, fleetA.id);
    assert.equal(serviceAssignment.status, "ACTIVE");
    const serviceEvent = await prisma.operatingProcessEvent.findFirst({
      where: { loadId: serviceLoad.id, eventType: "DISPATCH_ASSIGNED" },
    });
    assert.ok(serviceEvent);

    const settlementLoad = await makeLoad(fleetA.id);
    const settlementDriver = await makeDriver(fleetA.id, "READY");
    const settlement = await prisma.settlement.create({
      data: {
        fleetId: fleetA.id,
        loadId: settlementLoad.id,
        driverId: settlementDriver.id,
        settlementDate: new Date(),
        grossAmount: "125.00",
        netAmount: "125.00",
        status: "CREATED",
        idempotencyKey: `correction-settlement-${stamp}`,
      },
    });
    ids.settlementIds.push(settlement.id);

    process.env.BOF_EPOD_ENABLED = "false";
    const disabledActor = session(dispatcher, fleetA.id, "DISPATCH");
    await assert.rejects(
      () => proof.submitReceivedLoadProof(disabledActor, settlementLoad.id, "POD", "evidence-1"),
      (error: unknown) => statusOf(error) === 503,
    );
    await assert.rejects(
      () => proof.verifyStoredLoadProof(disabledActor, settlementLoad.id, "proof-1", true),
      (error: unknown) => statusOf(error) === 503,
    );
    await assert.rejects(
      () => proof.rejectProofAndHoldSettlement(disabledActor, settlementLoad.id, "proof-1", "Damage"),
      (error: unknown) => statusOf(error) === 503,
    );
    await assert.rejects(() => delivery.getEpod(disabledActor, settlementLoad.id), (error: unknown) => statusOf(error) === 503);
    await assert.rejects(
      () => delivery.saveCargoPhoto(disabledActor, settlementLoad.id, "LOADED", "aa", "image/jpeg", {}),
      (error: unknown) => statusOf(error) === 503,
    );
    await assert.rejects(
      () =>
        delivery.saveAcknowledgment(disabledActor, settlementLoad.id, {
          name: "Receiver",
          title: "Clerk",
          facility: "Dock",
          disposition: "ACCEPTED",
          exceptions: "",
          refusalReason: "",
          statementAccepted: true,
          channel: "IN_PERSON",
          signaturePng: "aa",
        }),
      (error: unknown) => statusOf(error) === 503,
    );
    await assert.rejects(() => delivery.generateEpod(disabledActor, settlementLoad.id), (error: unknown) => statusOf(error) === 503);
    await assert.rejects(
      () => delivery.openEpodEvidence(disabledActor, settlementLoad.id, "evidence-1"),
      (error: unknown) => statusOf(error) === 503,
    );
    const held = await prisma.settlement.findUniqueOrThrow({ where: { id: settlement.id } });
    assert.equal(held.status, "CREATED");
    assert.equal(Number(held.grossAmount), 125);

    delete process.env.BOF_EPOD_ENABLED;
    await assert.rejects(
      () => proof.submitReceivedLoadProof(disabledActor, settlementLoad.id, "POD", "evidence-1"),
      (error: unknown) => statusOf(error) === 503,
    );
    process.env.BOF_EPOD_ENABLED = "";
    await assert.rejects(
      () => proof.verifyStoredLoadProof(disabledActor, settlementLoad.id, "proof-1", true),
      (error: unknown) => statusOf(error) === 503,
    );
    process.env.BOF_EPOD_ENABLED = "FALSE";
    await assert.rejects(
      () => proof.rejectProofAndHoldSettlement(disabledActor, settlementLoad.id, "proof-1", "Damage"),
      (error: unknown) => statusOf(error) === 503,
    );
    const stillHeld = await prisma.settlement.findUniqueOrThrow({ where: { id: settlement.id } });
    assert.equal(stillHeld.status, "CREATED");
    assert.equal(Number(stillHeld.grossAmount), 125);
    process.env.BOF_EPOD_ENABLED = "true";
    assert.doesNotThrow(assertEpodEnabled);
    await assert.rejects(
      () => proof.submitReceivedLoadProof(disabledActor, "missing-correction-load", "POD", "evidence-1"),
      (error: unknown) => statusOf(error) === 404,
    );

    const { POST: deliveryPost } = await import("@/app/api/dispatch/load/[loadId]/delivery/route");
    const { POST: photoPost } = await import("@/app/api/dispatch/load/[loadId]/delivery/photos/route");
    const { POST: signaturePost } = await import("@/app/api/dispatch/load/[loadId]/delivery/acknowledgment/route");
    const { POST: epodPost } = await import("@/app/api/dispatch/load/[loadId]/delivery/epod/route");
    const { GET: evidenceGet } = await import("@/app/api/dispatch/load/[loadId]/delivery/evidence/[evidenceId]/route");
    const { POST: proofPost } = await import("@/app/api/dispatch/load/[loadId]/proof/route");
    const { POST: verifyPost } = await import("@/app/api/dispatch/load/[loadId]/proof/verify/route");
    const { POST: rejectPost } = await import("@/app/api/dispatch/load/[loadId]/proof/reject/route");
    process.env.BOF_EPOD_ENABLED = "false";
    const { NextRequest } = await import("next/server");
    const request = new NextRequest("http://127.0.0.1/correction", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "content-type": "application/json" },
    });
    const loadParams = { params: Promise.resolve({ loadId: settlementLoad.id }) };
    assert.equal((await deliveryPost(request, loadParams)).status, 503);
    assert.equal((await photoPost(request, loadParams)).status, 503);
    assert.equal((await signaturePost(request, loadParams)).status, 503);
    assert.equal((await epodPost(request, loadParams)).status, 503);
    assert.equal(
      (
        await evidenceGet(new NextRequest("http://127.0.0.1/correction"), {
          params: Promise.resolve({ loadId: settlementLoad.id, evidenceId: "evidence-1" }),
        })
      ).status,
      503,
    );
    assert.equal((await proofPost(request, loadParams)).status, 503);
    assert.equal((await verifyPost(request, loadParams)).status, 503);
    assert.equal((await rejectPost(request, loadParams)).status, 503);
    const afterRoutes = await prisma.settlement.findUniqueOrThrow({ where: { id: settlement.id } });
    assert.equal(afterRoutes.status, "CREATED");
  } finally {
    if (previousFlag === undefined) delete process.env.BOF_EPOD_ENABLED;
    else process.env.BOF_EPOD_ENABLED = previousFlag;
    await prisma.auditEvent.deleteMany({
      where: { OR: [{ tenantId: fleetA.id }, { tenantId: fleetB.id }, { entityId: { in: ids.assignmentIds } }] },
    });
    await prisma.operatingProcessEvent.deleteMany({ where: { loadId: { in: ids.loadIds } } });
    await prisma.settlement.deleteMany({ where: { id: { in: ids.settlementIds } } });
    await prisma.dispatchAssignment.deleteMany({ where: { id: { in: ids.assignmentIds } } });
    await prisma.dispatchAssignment.deleteMany({ where: { loadId: { in: ids.loadIds } } });
    await prisma.driverReadinessScore.deleteMany({ where: { id: { in: ids.readinessIds } } });
    await cleanupQualifiedDriverEvidence(prisma, ids.driverIds);
    await prisma.load.deleteMany({ where: { id: { in: ids.loadIds } } });
    await prisma.equipment.deleteMany({ where: { id: { in: ids.equipmentIds } } });
    await prisma.driver.deleteMany({ where: { id: { in: ids.driverIds } } });
    await prisma.fleetMembership.deleteMany({ where: { fleetId: { in: [fleetA.id, fleetB.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [dispatcher.id, driverUser.id, serviceUser.id, outsider.id, fleetServiceUser.id, complianceUser.id] } } });
    await prisma.fleet.deleteMany({ where: { id: { in: [fleetA.id, fleetB.id] } } });
    await prisma.carrierGroup.deleteMany({ where: { id: group.id } });
    await prisma.aggregator.deleteMany({ where: { id: aggregator.id } });
  }
});
