import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import type { SessionUserLike } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { getAuthorizedOperatingRecord, listAuthorizedOperatingRecords } from "@/lib/services/operatingRecordService";
import { certifyTrainingAssignment, getRegulatoryCitationForOperatingRecord } from "@/lib/services/regulatoryKnowledgeService";
import { assertTestDatabaseTarget } from "@/lib/test/assertTestDatabaseTarget";

assertTestDatabaseTarget(process.env.DATABASE_URL);

const tag = `oprec-auth-${randomUUID().slice(0, 8)}`;
const ids = {
  aggregator: "",
  carrierGroup: "",
  fleets: [] as string[],
  users: [] as string[],
  drivers: [] as string[],
  module: "",
  assignments: [] as string[],
};

type Fixture = {
  fleetId: string;
  otherFleetId: string;
  driverA: SessionUserLike;
  driverB: SessionUserLike;
  admin: SessionUserLike;
  assignmentA: string;
  assignmentB: string;
  otherAssignment: string;
  certificationB: string;
  moduleId: string;
};

let fixture: Fixture;

function productionSession(userId: string, fleetId: string, roleCode: string): SessionUserLike {
  const membership = { fleetId, fleetSlug: tag, roleCode };
  return { id: userId, email: `${userId}@${tag}.test`, memberships: [membership] };
}

async function statusOf(promise: Promise<unknown>) {
  try {
    await promise;
    return 200;
  } catch (error) {
    return Number((error as { statusCode?: number }).statusCode) || 500;
  }
}

test.before(async () => {
  const aggregator = await prisma.aggregator.create({ data: { name: `Aggregator ${tag}` } });
  ids.aggregator = aggregator.id;
  const carrierGroup = await prisma.carrierGroup.create({ data: { aggregatorId: aggregator.id, name: `Group ${tag}` } });
  ids.carrierGroup = carrierGroup.id;
  const fleet = await prisma.fleet.create({ data: { carrierGroupId: carrierGroup.id, slug: tag, name: `Fleet ${tag}` } });
  const otherFleet = await prisma.fleet.create({ data: { carrierGroupId: carrierGroup.id, slug: `${tag}-other`, name: `Other ${tag}` } });
  ids.fleets.push(fleet.id, otherFleet.id);
  const adminUser = await prisma.user.create({ data: { email: `admin@${tag}.test`, name: `admin ${tag}` } });
  const userA = await prisma.user.create({ data: { email: `drivera@${tag}.test`, name: `drivera ${tag}` } });
  const userB = await prisma.user.create({ data: { email: `driverb@${tag}.test`, name: `driverb ${tag}` } });
  ids.users.push(adminUser.id, userA.id, userB.id);
  const trainingModule = await prisma.trainingModule.create({
    data: { ownership: "BOF_INTERNAL", title: `Module ${tag}`, category: "Safety", description: "Test module", audience: "Drivers", keywords: [], resourceUrl: "https://example.test/module", resourceLabel: "Module", version: "1", effectiveDate: new Date() },
  });
  ids.module = trainingModule.id;
  const driverA = await prisma.driver.create({ data: { fleetId: fleet.id, userId: userA.id, firstName: "drivera", lastName: tag, email: `drivera@${tag}.test` } });
  const driverB = await prisma.driver.create({ data: { fleetId: fleet.id, userId: userB.id, firstName: "driverb", lastName: tag, email: `driverb@${tag}.test` } });
  const otherDriver = await prisma.driver.create({ data: { fleetId: otherFleet.id, firstName: "other", lastName: tag, email: `other@${tag}.test` } });
  ids.drivers.push(driverA.id, driverB.id, otherDriver.id);
  const assignmentA = await prisma.trainingAssignment.create({ data: { fleetId: fleet.id, driverId: driverA.id, trainingModuleId: trainingModule.id, assignedByUserId: adminUser.id } });
  const assignmentB = await prisma.trainingAssignment.create({ data: { fleetId: fleet.id, driverId: driverB.id, trainingModuleId: trainingModule.id, assignedByUserId: adminUser.id } });
  const otherAssignment = await prisma.trainingAssignment.create({ data: { fleetId: otherFleet.id, driverId: otherDriver.id, trainingModuleId: trainingModule.id, assignedByUserId: adminUser.id } });
  ids.assignments.push(assignmentA.id, assignmentB.id, otherAssignment.id);
  const admin = productionSession(adminUser.id, fleet.id, "FLEET_ADMIN");
  const certification = await certifyTrainingAssignment(admin, { fleetId: fleet.id, assignmentId: assignmentB.id, outcome: "CERTIFIED" });

  fixture = {
    fleetId: fleet.id,
    otherFleetId: otherFleet.id,
    driverA: productionSession(userA.id, fleet.id, "DRIVER"),
    driverB: productionSession(userB.id, fleet.id, "DRIVER"),
    admin,
    assignmentA: assignmentA.id,
    assignmentB: assignmentB.id,
    otherAssignment: otherAssignment.id,
    certificationB: certification.id,
    moduleId: trainingModule.id,
  };
});

test.after(async () => {
  const assignmentIds = (await prisma.trainingAssignment.findMany({ where: { fleetId: { in: ids.fleets } }, select: { id: true } })).map((row) => row.id);
  const certificationIds = (await prisma.trainingCertification.findMany({ where: { fleetId: { in: ids.fleets } }, select: { id: true } })).map((row) => row.id);
  await prisma.auditEvent.deleteMany({ where: { OR: [{ entityType: "TrainingAssignment", entityId: { in: assignmentIds } }, { entityType: "TrainingCertification", entityId: { in: certificationIds } }] } });
  await prisma.trainingCertification.deleteMany({ where: { fleetId: { in: ids.fleets } } });
  await prisma.trainingAssignment.deleteMany({ where: { fleetId: { in: ids.fleets } } });
  if (ids.module) await prisma.trainingModule.deleteMany({ where: { id: ids.module } });
  await prisma.driver.deleteMany({ where: { id: { in: ids.drivers } } });
  await prisma.user.deleteMany({ where: { id: { in: ids.users } } });
  if (ids.fleets.length) await prisma.fleet.deleteMany({ where: { id: { in: ids.fleets } } });
  if (ids.carrierGroup) await prisma.carrierGroup.deleteMany({ where: { id: ids.carrierGroup } });
  if (ids.aggregator) await prisma.aggregator.deleteMany({ where: { id: ids.aggregator } });
  await prisma.$disconnect();
});

test("Driver A cannot retrieve Driver B's training assignment by ID", async () => {
  assert.equal(await statusOf(getAuthorizedOperatingRecord(fixture.driverA, fixture.fleetId, "TRAINING_ASSIGNMENT", fixture.assignmentB)), 403);
  assert.equal(await statusOf(getRegulatoryCitationForOperatingRecord(fixture.driverA, fixture.fleetId, "TRAINING_ASSIGNMENT", fixture.assignmentB)), 403);
  const own = await getAuthorizedOperatingRecord(fixture.driverA, fixture.fleetId, "TRAINING_ASSIGNMENT", fixture.assignmentA);
  assert.equal(own.recordId, fixture.assignmentA);
});

test("Driver A cannot retrieve Driver B's training certification by ID", async () => {
  assert.equal(await statusOf(getAuthorizedOperatingRecord(fixture.driverA, fixture.fleetId, "TRAINING_CERTIFICATION", fixture.certificationB)), 403);
  assert.equal(await statusOf(getRegulatoryCitationForOperatingRecord(fixture.driverA, fixture.fleetId, "TRAINING_CERTIFICATION", fixture.certificationB)), 403);
});

test("Cross-fleet training record access is denied", async () => {
  assert.equal(await statusOf(getAuthorizedOperatingRecord(fixture.driverA, fixture.otherFleetId, "TRAINING_ASSIGNMENT", fixture.otherAssignment)), 403);
  assert.equal(await statusOf(getAuthorizedOperatingRecord(fixture.admin, fixture.fleetId, "TRAINING_ASSIGNMENT", fixture.otherAssignment)), 404);
  assert.equal(await statusOf(getRegulatoryCitationForOperatingRecord(fixture.driverA, fixture.otherFleetId, "TRAINING_ASSIGNMENT", fixture.otherAssignment)), 403);
});

test("A fleet member with no linked driver identity cannot read a training record by ID", async () => {
  const stranger = await prisma.user.create({ data: { email: `stranger@${tag}.test` } });
  ids.users.push(stranger.id);
  const session = productionSession(stranger.id, fixture.fleetId, "DRIVER");
  assert.equal(await statusOf(getAuthorizedOperatingRecord(session, fixture.fleetId, "TRAINING_ASSIGNMENT", fixture.assignmentA)), 403);
  assert.equal(await statusOf(getAuthorizedOperatingRecord(session, fixture.fleetId, "TRAINING_CERTIFICATION", fixture.certificationB)), 403);
  assert.equal(await statusOf(getRegulatoryCitationForOperatingRecord(session, fixture.fleetId, "TRAINING_ASSIGNMENT", fixture.assignmentA)), 403);
});

test("Unauthorized users remain denied", async () => {
  assert.equal(await statusOf(getAuthorizedOperatingRecord(null, fixture.fleetId, "TRAINING_ASSIGNMENT", fixture.assignmentA)), 401);
  assert.equal(await statusOf(getAuthorizedOperatingRecord({ id: "missing-user" }, fixture.fleetId, "TRAINING_ASSIGNMENT", fixture.assignmentA)), 403);
  const dispatch = productionSession(fixture.admin.id!, fixture.fleetId, "DISPATCH");
  assert.equal(await statusOf(getAuthorizedOperatingRecord(dispatch, fixture.fleetId, "TRAINING_ASSIGNMENT", fixture.assignmentB)), 403);
  assert.equal(await statusOf(getAuthorizedOperatingRecord(dispatch, fixture.fleetId, "TRAINING_CERTIFICATION", fixture.certificationB)), 403);
});

test("An authorized training admin can still read another driver's training records", async () => {
  const assignment = await getAuthorizedOperatingRecord(fixture.admin, fixture.fleetId, "TRAINING_ASSIGNMENT", fixture.assignmentB);
  assert.equal(assignment.recordId, fixture.assignmentB);
  const certification = await getAuthorizedOperatingRecord(fixture.admin, fixture.fleetId, "TRAINING_CERTIFICATION", fixture.certificationB);
  assert.equal(certification.recordId, fixture.certificationB);
  const citation = await getRegulatoryCitationForOperatingRecord(fixture.admin, fixture.fleetId, "TRAINING_CERTIFICATION", fixture.certificationB);
  assert.equal(citation.recordId, fixture.certificationB);
});

test("Unrelated operating-record reads stay available to a fleet member", async () => {
  const moduleRecord = await getAuthorizedOperatingRecord(fixture.driverA, fixture.fleetId, "TRAINING_MODULE", fixture.moduleId);
  assert.equal(moduleRecord.recordId, fixture.moduleId);
  const loads = await listAuthorizedOperatingRecords(fixture.driverA, fixture.fleetId, "LOAD");
  assert.ok(Array.isArray(loads));
  const ownCitation = await getRegulatoryCitationForOperatingRecord(fixture.driverB, fixture.fleetId, "TRAINING_ASSIGNMENT", fixture.assignmentB);
  assert.equal(ownCitation.recordId, fixture.assignmentB);
});
