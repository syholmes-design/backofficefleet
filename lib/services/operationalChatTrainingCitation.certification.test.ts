import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import type { SessionUserLike } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import { createOperationalChatThread, getOperationalChatThread, listOperationalChatThreads } from "@/lib/services/operationalChatService";
import { getAuthorizedOperatingRecord } from "@/lib/services/operatingRecordService";
import { certifyTrainingAssignment } from "@/lib/services/regulatoryKnowledgeService";
import { assertTestDatabaseTarget } from "@/lib/test/assertTestDatabaseTarget";

assertTestDatabaseTarget(process.env.DATABASE_URL);

const tag = `chat-auth-${randomUUID().slice(0, 8)}`;
const secret = `secret-${tag}`;
const ids = { aggregator: "", carrierGroup: "", fleet: "", users: [] as string[], drivers: [] as string[], module: "", assignments: [] as string[], memberships: [] as string[], thread: "" };

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

async function roleId(code: string, name: string) {
  const role = await prisma.role.upsert({ where: { code }, update: {}, create: { code, name } });
  return role.id;
}

test("training citations stay behind the training-record boundary", async () => {
  const aggregator = await prisma.aggregator.create({ data: { name: `Aggregator ${tag}` } });
  ids.aggregator = aggregator.id;
  const carrierGroup = await prisma.carrierGroup.create({ data: { aggregatorId: aggregator.id, name: `Group ${tag}` } });
  ids.carrierGroup = carrierGroup.id;
  const fleet = await prisma.fleet.create({ data: { carrierGroupId: carrierGroup.id, slug: tag, name: `Fleet ${tag}` } });
  ids.fleet = fleet.id;
  const adminUser = await prisma.user.create({ data: { email: `admin@${tag}.test`, name: `admin ${tag}` } });
  const userA = await prisma.user.create({ data: { email: `drivera@${tag}.test`, name: `drivera ${tag}` } });
  const userB = await prisma.user.create({ data: { email: `driverb@${tag}.test`, name: `driverb ${tag}` } });
  ids.users.push(adminUser.id, userA.id, userB.id);
  const managerRole = await roleId("FLEET_MANAGER", "Fleet Manager");
  const driverRole = await roleId("DRIVER", "Driver");
  const memberships = await Promise.all([
    prisma.fleetMembership.create({ data: { fleetId: fleet.id, userId: adminUser.id, roleId: managerRole, status: "ACTIVE" } }),
    prisma.fleetMembership.create({ data: { fleetId: fleet.id, userId: userA.id, roleId: driverRole, status: "ACTIVE" } }),
    prisma.fleetMembership.create({ data: { fleetId: fleet.id, userId: userB.id, roleId: driverRole, status: "ACTIVE" } }),
  ]);
  ids.memberships.push(...memberships.map((membership) => membership.id));
  const trainingModule = await prisma.trainingModule.create({
    data: { ownership: "BOF_INTERNAL", title: `Module ${tag}`, category: "Safety", description: "Test module", audience: "Drivers", keywords: [], resourceUrl: "https://example.test/module", resourceLabel: "Module", version: "1", effectiveDate: new Date() },
  });
  ids.module = trainingModule.id;
  const driverA = await prisma.driver.create({ data: { fleetId: fleet.id, userId: userA.id, firstName: "drivera", lastName: tag, email: `drivera@${tag}.test` } });
  const driverB = await prisma.driver.create({ data: { fleetId: fleet.id, userId: userB.id, firstName: "driverb", lastName: tag, email: `driverb@${tag}.test` } });
  ids.drivers.push(driverA.id, driverB.id);
  const assignmentB = await prisma.trainingAssignment.create({ data: { fleetId: fleet.id, driverId: driverB.id, trainingModuleId: trainingModule.id, assignedByUserId: adminUser.id } });
  ids.assignments.push(assignmentB.id);
  const admin = productionSession(adminUser.id, fleet.id, "FLEET_MANAGER");
  const sessionA = productionSession(userA.id, fleet.id, "DRIVER");
  const sessionB = productionSession(userB.id, fleet.id, "DRIVER");
  const certification = await certifyTrainingAssignment(admin, { fleetId: fleet.id, assignmentId: assignmentB.id, outcome: "CERTIFIED" });

  assert.equal(await statusOf(createOperationalChatThread(sessionA, { fleetId: fleet.id, type: "GENERAL_INTERNAL_THREAD", subject: "Other driver", recordType: "TRAINING_ASSIGNMENT", recordId: assignmentB.id })), 403);

  const created = await createOperationalChatThread(admin, {
    fleetId: fleet.id,
    type: "GENERAL_INTERNAL_THREAD",
    visibility: "CUSTOMER_VISIBLE",
    subject: `Training ${tag}`,
    recordType: "TRAINING_ASSIGNMENT",
    recordId: assignmentB.id,
    participants: [
      { userId: userA.id, role: "DRIVER" },
      { userId: userB.id, role: "DRIVER" },
    ],
  });
  ids.thread = created.id;
  await prisma.operationalChatCitation.create({
    data: { threadId: created.id, tenantId: fleet.id, recordType: "TRAINING_CERTIFICATION", recordId: certification.id, title: `Certification ${secret}`, snapshot: { secret, outcome: "CERTIFIED" }, route: "/safety/training" },
  });
  await prisma.operationalChatCitation.create({
    data: { threadId: created.id, tenantId: fleet.id, recordType: "LOAD", recordId: `load-${tag}`, title: `Load ${tag}`, snapshot: { reference: `load-${tag}` }, route: `/loads/load-${tag}` },
  });
  const storedBefore = await prisma.operationalChatCitation.count({ where: { threadId: created.id } });

  const forDriverA = await getOperationalChatThread(sessionA, fleet.id, created.id);
  assert.equal(forDriverA.recordType, null);
  assert.equal(forDriverA.recordId, null);
  assert.equal(forDriverA.citations.some((citation) => citation.recordType === "TRAINING_ASSIGNMENT" || citation.recordType === "TRAINING_CERTIFICATION"), false);
  assert.equal(JSON.stringify(forDriverA).includes(secret), false);
  assert.equal(forDriverA.citations.some((citation) => citation.recordType === "LOAD"), true);

  const forDriverB = await getOperationalChatThread(sessionB, fleet.id, created.id);
  assert.equal(forDriverB.recordId, assignmentB.id);
  assert.equal(forDriverB.citations.some((citation) => citation.recordType === "TRAINING_ASSIGNMENT" && citation.recordId === assignmentB.id), true);
  assert.equal(forDriverB.citations.some((citation) => citation.recordType === "TRAINING_CERTIFICATION" && JSON.stringify(citation.snapshot).includes(secret)), true);

  const forAdmin = await getOperationalChatThread(admin, fleet.id, created.id);
  assert.equal(forAdmin.citations.some((citation) => citation.recordType === "TRAINING_ASSIGNMENT" && citation.snapshot !== null), true);
  assert.equal(forAdmin.citations.some((citation) => citation.recordType === "TRAINING_CERTIFICATION"), true);

  for (const roleCode of ["DISPATCH", "FINANCE", "SAFETY"] as const) {
    const reader = productionSession(adminUser.id, fleet.id, roleCode);
    const thread = await getOperationalChatThread(reader, fleet.id, created.id);
    assert.equal(thread.recordId, null, roleCode);
    assert.equal(thread.citations.some((citation) => citation.recordType === "TRAINING_ASSIGNMENT" || citation.recordType === "TRAINING_CERTIFICATION"), false, roleCode);
    assert.equal(JSON.stringify(thread).includes(secret), false, roleCode);
    assert.equal(thread.citations.some((citation) => citation.recordType === "LOAD"), true, roleCode);
    const listed = await listOperationalChatThreads(reader, fleet.id);
    const listedThread = listed.find((entry) => entry.id === created.id);
    assert.ok(listedThread, roleCode);
    assert.equal(listedThread?.recordId, null, roleCode);
    assert.equal(listedThread?.citations.some((citation) => citation.recordId === assignmentB.id || citation.recordId === certification.id), false, roleCode);
    assert.equal(await statusOf(getAuthorizedOperatingRecord(reader, fleet.id, "TRAINING_ASSIGNMENT", assignmentB.id)), 403, roleCode);
    assert.equal(await statusOf(getAuthorizedOperatingRecord(reader, fleet.id, "TRAINING_CERTIFICATION", certification.id)), 403, roleCode);
  }

  assert.equal(await prisma.operationalChatCitation.count({ where: { threadId: created.id } }), storedBefore);
});

test.after(async () => {
  if (ids.thread) {
    await prisma.auditEvent.deleteMany({ where: { entityType: "OperationalChatThread", entityId: ids.thread } });
    await prisma.operationalChatThread.deleteMany({ where: { id: ids.thread } });
  }
  const assignmentIds = ids.fleet ? (await prisma.trainingAssignment.findMany({ where: { fleetId: ids.fleet }, select: { id: true } })).map((row) => row.id) : [];
  const certificationIds = ids.fleet ? (await prisma.trainingCertification.findMany({ where: { fleetId: ids.fleet }, select: { id: true } })).map((row) => row.id) : [];
  await prisma.auditEvent.deleteMany({ where: { OR: [{ entityType: "TrainingAssignment", entityId: { in: assignmentIds } }, { entityType: "TrainingCertification", entityId: { in: certificationIds } }] } });
  if (ids.fleet) {
    await prisma.trainingCertification.deleteMany({ where: { fleetId: ids.fleet } });
    await prisma.trainingAssignment.deleteMany({ where: { fleetId: ids.fleet } });
    await prisma.fleetMembership.deleteMany({ where: { id: { in: ids.memberships } } });
  }
  if (ids.module) await prisma.trainingModule.deleteMany({ where: { id: ids.module } });
  if (ids.drivers.length) await prisma.driver.deleteMany({ where: { id: { in: ids.drivers } } });
  if (ids.users.length) await prisma.user.deleteMany({ where: { id: { in: ids.users } } });
  if (ids.fleet) await prisma.fleet.deleteMany({ where: { id: ids.fleet } });
  if (ids.carrierGroup) await prisma.carrierGroup.deleteMany({ where: { id: ids.carrierGroup } });
  if (ids.aggregator) await prisma.aggregator.deleteMany({ where: { id: ids.aggregator } });
  await prisma.$disconnect();
});
