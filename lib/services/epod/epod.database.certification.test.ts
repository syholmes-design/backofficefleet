import assert from "node:assert/strict";
import test from "node:test";

import type { SessionUserLike } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { encodeRgbPng } from "@/lib/services/epod/signatureInk";
import {
  advanceDelivery,
  generateEpod,
  getEpod,
  openEpodEvidence,
  saveAcknowledgment,
  saveCargoPhoto,
} from "@/lib/services/epod/epodPersistence";
import { rejectProofAndHoldSettlement, verifyStoredLoadProof } from "@/lib/services/proofSettlementHoldService";
import { resolveSecurePickupTestDatabaseUrl } from "@/lib/test/assertTestDatabaseTarget";

const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]).toString("base64");
const drawn = Buffer.from(encodeRgbPng(16, 16, Uint8Array.from({ length: 768 }, (_, index) => (index < 48 ? 0 : 255)))).toString("base64");
const blank = Buffer.from(encodeRgbPng(16, 16, new Uint8Array(768).fill(255))).toString("base64");

function statusOf(error: unknown) {
  return error && typeof error === "object" && "statusCode" in error ? Number((error as { statusCode?: number }).statusCode) : 0;
}

function asSession(user: {
  id: string;
  email: string;
  memberships: Array<{ fleetId: string; status: string; role: { code: string } }>;
}): SessionUserLike {
  return {
    id: user.id,
    email: user.email,
    memberships: user.memberships.map((membership) => ({
      fleetId: membership.fleetId,
      roleCode: membership.role.code,
      status: membership.status,
    })),
  };
}

async function assertIsolatedDatabase() {
  const url = resolveSecurePickupTestDatabaseUrl();
  assert.equal(process.env.DATABASE_URL, url);
  const rows = await prisma.$queryRaw<Array<{ name: string }>>`SELECT current_database() AS name`;
  assert.equal(rows[0]?.name, "bof_dev");
  const index = await prisma.$queryRaw<Array<{ indexname: string }>>`
    SELECT indexname FROM pg_indexes WHERE indexname = 'OperationalEvidence_epod_role_key'
  `;
  assert.equal(index.length, 1);
}

async function createLoad(input: {
  fleetId: string;
  driverId: string;
  tractorId: string;
  suffix: string;
}) {
  const load = await prisma.load.create({
    data: {
      fleetId: input.fleetId,
      customerName: "Cert Receiver",
      origin: "Dallas yard",
      destination: "Atlanta dock",
      referenceNumber: `EPOD-CERT-${input.suffix}`,
      status: "IN_TRANSIT",
    },
  });
  const assignment = await prisma.dispatchAssignment.create({
    data: {
      fleetId: input.fleetId,
      loadId: load.id,
      driverId: input.driverId,
      tractorEquipmentId: input.tractorId,
      status: "ACTIVE",
    },
  });
  const settlement = await prisma.settlement.create({
    data: {
      fleetId: input.fleetId,
      loadId: load.id,
      driverId: input.driverId,
      settlementDate: new Date("2026-10-10T00:00:00.000Z"),
      grossAmount: 100,
      netAmount: 100,
      status: "HELD",
      holdReason: "Proof not verified",
      idempotencyKey: `epod-cert-hold-${input.suffix}`,
    },
  });
  return { load, assignment, settlement };
}

test("isolated database persists electronic POD and keeps the settlement hold", async () => {
  await assertIsolatedDatabase();
  const stamp = Date.now().toString();
  const aggregator = await prisma.aggregator.create({ data: { name: `epod-cert-${stamp}` } });
  const group = await prisma.carrierGroup.create({ data: { aggregatorId: aggregator.id, name: `epod-cert-${stamp}` } });
  const fleet = await prisma.fleet.create({ data: { slug: `epod-cert-${stamp}`, name: "Cert Carrier", carrierGroupId: group.id } });
  const otherFleet = await prisma.fleet.create({
    data: { slug: `epod-cert-b-${stamp}`, name: "Other Carrier", carrierGroupId: group.id },
  });
  const driverRole = await prisma.role.upsert({
    where: { code: "DRIVER" },
    update: {},
    create: { code: "DRIVER", name: "Driver" },
  });
  const adminRole = await prisma.role.upsert({
    where: { code: "FLEET_ADMIN" },
    update: {},
    create: { code: "FLEET_ADMIN", name: "Fleet administrator" },
  });
  const driverUser = await prisma.user.create({
    data: {
      email: `epod-driver-${stamp}@dev.local`,
      status: "ACTIVE",
      memberships: { create: { fleetId: fleet.id, roleId: driverRole.id, status: "ACTIVE" } },
    },
    include: { memberships: { include: { role: true } } },
  });
  const otherDriverUser = await prisma.user.create({
    data: {
      email: `epod-other-driver-${stamp}@dev.local`,
      status: "ACTIVE",
      memberships: { create: { fleetId: fleet.id, roleId: driverRole.id, status: "ACTIVE" } },
    },
    include: { memberships: { include: { role: true } } },
  });
  const adminUser = await prisma.user.create({
    data: {
      email: `epod-admin-${stamp}@dev.local`,
      status: "ACTIVE",
      memberships: { create: { fleetId: fleet.id, roleId: adminRole.id, status: "ACTIVE" } },
    },
    include: { memberships: { include: { role: true } } },
  });
  const outsider = await prisma.user.create({
    data: {
      email: `epod-outsider-${stamp}@dev.local`,
      status: "ACTIVE",
      memberships: { create: { fleetId: otherFleet.id, roleId: adminRole.id, status: "ACTIVE" } },
    },
    include: { memberships: { include: { role: true } } },
  });
  const driver = await prisma.driver.create({
    data: {
      userId: driverUser.id,
      fleetId: fleet.id,
      firstName: "Sam",
      lastName: "Driver",
      email: driverUser.email,
    },
  });
  const otherDriver = await prisma.driver.create({
    data: {
      fleetId: fleet.id,
      userId: otherDriverUser.id,
      firstName: "Other",
      lastName: "Driver",
      email: otherDriverUser.email,
    },
  });
  const tractor = await prisma.equipment.create({
    data: { fleetId: fleet.id, equipmentType: "TRACTOR", unitNumber: `UNIT-${stamp}`, status: "AVAILABLE" },
  });
  const raceTractor = await prisma.equipment.create({
    data: { fleetId: fleet.id, equipmentType: "TRACTOR", unitNumber: `UNIT-RACE-${stamp}`, status: "AVAILABLE" },
  });
  const created = await createLoad({ fleetId: fleet.id, driverId: driver.id, tractorId: tractor.id, suffix: stamp });
  const driverSession = asSession(driverUser);
  const otherSession = asSession(otherDriverUser);
  const adminSession = asSession(adminUser);
  const outsiderSession = asSession(outsider);
  const loadIds = [created.load.id];

  const previousFlag = process.env.BOF_EPOD_ENABLED;
  process.env.BOF_EPOD_ENABLED = "true";
  try {
    await assert.rejects(() => saveCargoPhoto(otherSession, created.load.id, "LOADED_TRAILER", jpeg, "image/jpeg", {}), (error: unknown) => statusOf(error) === 403);
    await assert.rejects(() => saveCargoPhoto(adminSession, created.load.id, "LOADED_TRAILER", jpeg, "image/jpeg", {}), (error: unknown) => statusOf(error) === 403);
    await assert.rejects(() => getEpod(outsiderSession, created.load.id), (error: unknown) => statusOf(error) === 403);
    await assert.rejects(
      () => saveCargoPhoto({ id: "DRV-9", memberships: driverSession.memberships }, created.load.id, "LOADED_TRAILER", jpeg, "image/jpeg", {}),
      (error: unknown) => statusOf(error) === 422,
    );

    await saveCargoPhoto(driverSession, created.load.id, "LOADED_TRAILER", jpeg, "image/jpeg", {});
    await assert.rejects(
      () => saveCargoPhoto(driverSession, created.load.id, "LOADED_TRAILER", jpeg, "image/jpeg", {}),
      (error: unknown) => statusOf(error) === 409,
    );
    await advanceDelivery(driverSession, created.load.id, "ARRIVE", "Atlanta dock gate");
    await advanceDelivery(driverSession, created.load.id, "START_UNLOADING", "");
    await saveCargoPhoto(driverSession, created.load.id, "EMPTY_TRAILER", jpeg, "image/jpeg", {});
    await advanceDelivery(driverSession, created.load.id, "READY_FOR_ACKNOWLEDGMENT", "");
    await assert.rejects(
      () =>
        saveAcknowledgment(driverSession, created.load.id, {
          name: "Ada Clerk",
          title: "Receiver",
          facility: "Atlanta dock",
          disposition: "ACCEPTED",
          exceptions: "",
          refusalReason: "",
          statementAccepted: true,
          channel: "TABLET",
          signaturePng: blank,
        }),
      (error: unknown) => statusOf(error) === 422,
    );
    await saveAcknowledgment(driverSession, created.load.id, {
      name: "Ada Clerk",
      title: "Receiver",
      facility: "Atlanta dock",
      disposition: "ACCEPTED",
      exceptions: "",
      refusalReason: "",
      statementAccepted: true,
      channel: "TABLET",
      signaturePng: drawn,
    });
    const generated = await generateEpod(driverSession, created.load.id);
    assert.equal(generated.proofVerified, false);
    assert.equal(generated.settlementHoldChanged, false);
    assert.equal(generated.proofStatus, "RECEIVED");
    const reopened = await getEpod(driverSession, created.load.id);
    assert.equal(reopened.view.stage, "POD_GENERATED");
    assert.equal(reopened.view.operatorVerification, "UNVERIFIED");
    assert.equal(reopened.view.settlementHold, true);
    assert.equal(reopened.storage.productionDurable, false);
    assert.ok(reopened.view.generatedEvidenceId);
    const artifact = await openEpodEvidence(adminSession, created.load.id, reopened.view.generatedEvidenceId);
    const parsed = JSON.parse(Buffer.from(artifact.bytes).toString("utf8")) as { loadId?: string; proofVerified?: boolean };
    assert.equal(parsed.loadId, created.load.id);
    assert.equal(parsed.proofVerified, false);
    const photo = await openEpodEvidence(driverSession, created.load.id, reopened.view.loadedTrailer.evidenceId ?? "");
    assert.equal(photo.bytes[0], 0xff);

    await assert.rejects(
      () => verifyStoredLoadProof(driverSession, created.load.id, generated.proofId ?? "", true),
      (error: unknown) => statusOf(error) === 403,
    );
    const verified = await verifyStoredLoadProof(adminSession, created.load.id, generated.proofId ?? "", true);
    assert.equal(verified.proof.status, "VERIFIED");
    assert.equal(verified.settlementHoldChanged, false);
    const settlement = await prisma.settlement.findUniqueOrThrow({ where: { id: created.settlement.id } });
    assert.equal(settlement.status, "HELD");
    const verifiedEvent = await prisma.operatingProcessEvent.findFirst({
      where: { loadId: created.load.id, eventType: "POD_VERIFIED" },
    });
    assert.ok(verifiedEvent);
    await assert.rejects(
      () => rejectProofAndHoldSettlement(adminSession, created.load.id, generated.proofId ?? "", "late dispute"),
      (error: unknown) => statusOf(error) === 409,
    );
    const stillVerified = await prisma.loadProofOfDelivery.findUniqueOrThrow({ where: { id: generated.proofId ?? "" } });
    assert.equal(stillVerified.status, "VERIFIED");

    const duplicateLoad = await createLoad({
      fleetId: fleet.id,
      driverId: otherDriver.id,
      tractorId: raceTractor.id,
      suffix: `${stamp}-race`,
    });
    loadIds.push(duplicateLoad.load.id);
    const results = await Promise.allSettled([
      saveCargoPhoto(otherSession, duplicateLoad.load.id, "LOADED_TRAILER", jpeg, "image/jpeg", {}),
      saveCargoPhoto(otherSession, duplicateLoad.load.id, "LOADED_TRAILER", jpeg, "image/jpeg", {}),
    ]);
    const stored = await prisma.operationalEvidence.count({
      where: { loadId: duplicateLoad.load.id, notes: "bof-epod:LOADED_TRAILER" },
    });
    assert.equal(stored, 1);
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(results.filter((result) => result.status === "rejected").length, 1);
  } finally {
    if (previousFlag === undefined) delete process.env.BOF_EPOD_ENABLED;
    else process.env.BOF_EPOD_ENABLED = previousFlag;
    const evidence = await prisma.operationalEvidence.findMany({ where: { loadId: { in: loadIds } }, select: { storageKey: true } });
    const { removeEvidenceFile } = await import("@/lib/services/epod/evidenceStore");
    for (const row of evidence) {
      await removeEvidenceFile(row.storageKey);
    }
    const fleetIds = [fleet.id, otherFleet.id];
    await prisma.operatingProcessEvent.deleteMany({ where: { fleetId: { in: fleetIds } } });
    await prisma.loadProofOfDelivery.deleteMany({ where: { fleetId: { in: fleetIds } } });
    await prisma.loadDelivery.deleteMany({ where: { fleetId: { in: fleetIds } } });
    await prisma.settlement.deleteMany({ where: { fleetId: { in: fleetIds } } });
    await prisma.operationalEvidence.deleteMany({ where: { fleetId: { in: fleetIds } } });
    await prisma.dispatchAssignment.deleteMany({ where: { fleetId: { in: fleetIds } } });
    await prisma.auditEvent.deleteMany({ where: { tenantId: { in: fleetIds } } });
    await prisma.load.deleteMany({ where: { fleetId: { in: fleetIds } } });
    await prisma.equipment.deleteMany({ where: { fleetId: { in: fleetIds } } });
    await prisma.driver.deleteMany({ where: { id: { in: [driver.id, otherDriver.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [driverUser.id, otherDriverUser.id, adminUser.id, outsider.id] } } });
    await prisma.fleet.deleteMany({ where: { id: { in: [fleet.id, otherFleet.id] } } });
    await prisma.carrierGroup.deleteMany({ where: { id: group.id } });
    await prisma.aggregator.deleteMany({ where: { id: aggregator.id } });
    await prisma.$disconnect();
  }
});
