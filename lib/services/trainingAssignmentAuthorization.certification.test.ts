import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

import type { TrainingAssignmentStatus } from "@prisma/client";

import type { SessionUserLike } from "@/lib/authorization";
import { prisma } from "@/lib/prisma";
import {
  certifyTrainingAssignment,
  createTrainingAssignment,
  listTrainingAssignments,
  updateTrainingAssignment,
} from "@/lib/services/regulatoryKnowledgeService";
import { assertTestDatabaseTarget } from "@/lib/test/assertTestDatabaseTarget";

assertTestDatabaseTarget(process.env.DATABASE_URL);

const tag = `train-auth-${randomUUID().slice(0, 8)}`;
const ids = { aggregator: "", carrierGroup: "", fleet: "", users: [] as string[], drivers: [] as string[], module: "", assignments: [] as string[] };

type Fixture = {
  fleetId: string;
  driverA: { id: string; session: SessionUserLike; assignmentId: string };
  driverB: { id: string; session: SessionUserLike; assignmentId: string };
  adminDriver: { id: string; session: SessionUserLike; assignmentId: string };
  admin: SessionUserLike;
  moduleId: string;
};

let fixture: Fixture;

function session(userId: string, fleetId: string, roleCode: string): SessionUserLike {
  return { id: userId, email: `${userId}@${tag}.test`, memberships: [{ fleetId, roleCode, status: "ACTIVE" }] };
}

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

async function readAssignment(id: string) {
  return prisma.trainingAssignment.findUniqueOrThrow({ where: { id }, select: { status: true, completedAt: true, driverId: true } });
}

async function freshAssignment(driverId: string) {
  const assignment = await prisma.trainingAssignment.create({
    data: { fleetId: fixture.fleetId, driverId, trainingModuleId: fixture.moduleId, assignedByUserId: fixture.admin.id! },
  });
  ids.assignments.push(assignment.id);
  return assignment;
}

async function createDriverWithAssignment(fleetId: string, label: string, moduleId: string, assignedByUserId: string) {
  const user = await prisma.user.create({ data: { email: `${label}@${tag}.test`, name: `${label} ${tag}` } });
  ids.users.push(user.id);
  const driver = await prisma.driver.create({ data: { fleetId, userId: user.id, firstName: label, lastName: tag, email: `${label}@${tag}.test` } });
  ids.drivers.push(driver.id);
  const assignment = await prisma.trainingAssignment.create({ data: { fleetId, driverId: driver.id, trainingModuleId: moduleId, assignedByUserId } });
  ids.assignments.push(assignment.id);
  return { user, driver, assignment };
}

test.before(async () => {
  const aggregator = await prisma.aggregator.create({ data: { name: `Aggregator ${tag}` } });
  ids.aggregator = aggregator.id;
  const carrierGroup = await prisma.carrierGroup.create({ data: { aggregatorId: aggregator.id, name: `Group ${tag}` } });
  ids.carrierGroup = carrierGroup.id;
  const fleet = await prisma.fleet.create({ data: { carrierGroupId: carrierGroup.id, slug: tag, name: `Fleet ${tag}` } });
  ids.fleet = fleet.id;
  const adminUser = await prisma.user.create({ data: { email: `admin@${tag}.test`, name: `admin ${tag}` } });
  ids.users.push(adminUser.id);
  const trainingModule = await prisma.trainingModule.create({
    data: { ownership: "BOF_INTERNAL", title: `Module ${tag}`, category: "Safety", description: "Test module", audience: "Drivers", keywords: [], resourceUrl: "https://example.test/module", resourceLabel: "Module", version: "1", effectiveDate: new Date() },
  });
  ids.module = trainingModule.id;

  const a = await createDriverWithAssignment(fleet.id, "drivera", trainingModule.id, adminUser.id);
  const b = await createDriverWithAssignment(fleet.id, "driverb", trainingModule.id, adminUser.id);
  const c = await createDriverWithAssignment(fleet.id, "admindriver", trainingModule.id, adminUser.id);

  fixture = {
    fleetId: fleet.id,
    driverA: { id: a.driver.id, session: session(a.user.id, fleet.id, "DRIVER"), assignmentId: a.assignment.id },
    driverB: { id: b.driver.id, session: session(b.user.id, fleet.id, "DRIVER"), assignmentId: b.assignment.id },
    adminDriver: { id: c.driver.id, session: session(c.user.id, fleet.id, "FLEET_ADMIN"), assignmentId: c.assignment.id },
    admin: session(adminUser.id, fleet.id, "FLEET_ADMIN"),
    moduleId: trainingModule.id,
  };
});

test.after(async () => {
  const assignmentIds = (await prisma.trainingAssignment.findMany({ where: { fleetId: ids.fleet }, select: { id: true } })).map((row) => row.id);
  const certificationIds = (await prisma.trainingCertification.findMany({ where: { fleetId: ids.fleet }, select: { id: true } })).map((row) => row.id);
  await prisma.auditEvent.deleteMany({ where: { OR: [{ entityType: "TrainingAssignment", entityId: { in: assignmentIds } }, { entityType: "TrainingCertification", entityId: { in: certificationIds } }] } });
  await prisma.trainingCertification.deleteMany({ where: { fleetId: ids.fleet } });
  await prisma.trainingAssignment.deleteMany({ where: { fleetId: ids.fleet } });
  if (ids.module) await prisma.trainingModule.deleteMany({ where: { id: ids.module } });
  await prisma.driver.deleteMany({ where: { id: { in: ids.drivers } } });
  await prisma.user.deleteMany({ where: { id: { in: ids.users } } });
  if (ids.fleet) await prisma.fleet.deleteMany({ where: { id: ids.fleet } });
  if (ids.carrierGroup) await prisma.carrierGroup.deleteMany({ where: { id: ids.carrierGroup } });
  if (ids.aggregator) await prisma.aggregator.deleteMany({ where: { id: ids.aggregator } });
  await prisma.$disconnect();
});

test("1. Driver A cannot retrieve Driver B's assignments", async () => {
  assert.equal(await statusOf(listTrainingAssignments(fixture.driverA.session, fixture.fleetId, fixture.driverB.id)), 403);
});

test("2. A driver request without driverId returns only that driver's assignments, never the fleet", async () => {
  const rows = await listTrainingAssignments(fixture.driverA.session, fixture.fleetId);
  assert.deepEqual(rows.map((row) => row.id), [fixture.driverA.assignmentId]);
  assert.ok(rows.every((row) => row.driverId === fixture.driverA.id));
});

test("2b. A fleet member with no linked Driver row gets nothing (no fleet-wide fallback)", async () => {
  const stranger = await prisma.user.create({ data: { email: `stranger@${tag}.test` } });
  ids.users.push(stranger.id);
  assert.equal(await statusOf(listTrainingAssignments(session(stranger.id, fixture.fleetId, "DRIVER"), fixture.fleetId)), 403);
});

test("2c. A membership with a missing role code is not treated as DRIVER or admin", async () => {
  const noRole = await prisma.user.create({ data: { email: `norole@${tag}.test` } });
  ids.users.push(noRole.id);
  assert.equal(await statusOf(listTrainingAssignments(session(noRole.id, fixture.fleetId, ""), fixture.fleetId)), 403);
  const rows = await listTrainingAssignments({ ...fixture.driverA.session, memberships: [{ fleetId: fixture.fleetId, roleCode: "", status: "ACTIVE" }] }, fixture.fleetId);
  assert.deepEqual(rows.map((row) => row.id), [fixture.driverA.assignmentId]);
});

test("2d. A request for another fleet is denied", async () => {
  assert.equal(await statusOf(listTrainingAssignments(fixture.driverA.session, `other-${tag}`)), 403);
});

test("3. Driver A cannot mark their own assignment COMPLETE", async () => {
  assert.equal(await statusOf(updateTrainingAssignment(fixture.driverA.session, { fleetId: fixture.fleetId, assignmentId: fixture.driverA.assignmentId, status: "COMPLETE" })), 403);
  const row = await readAssignment(fixture.driverA.assignmentId);
  assert.equal(row.status, "ASSIGNED");
  assert.equal(row.completedAt, null);
});

test("4. Driver A cannot mark their own assignment CERTIFIED, by PATCH or by the certification path", async () => {
  assert.equal(await statusOf(updateTrainingAssignment(fixture.driverA.session, { fleetId: fixture.fleetId, assignmentId: fixture.driverA.assignmentId, status: "CERTIFIED" })), 403);
  assert.equal(await statusOf(certifyTrainingAssignment(fixture.driverA.session, { fleetId: fixture.fleetId, assignmentId: fixture.driverA.assignmentId, outcome: "CERTIFIED" })), 403);
  const row = await readAssignment(fixture.driverA.assignmentId);
  assert.equal(row.status, "ASSIGNED");
  assert.equal(row.completedAt, null);
  assert.equal(await prisma.trainingCertification.count({ where: { assignmentId: fixture.driverA.assignmentId } }), 0);
});

test("4b. Driver A cannot set any other result status on their own assignment", async () => {
  for (const status of ["PASSED", "REVIEW_REQUIRED", "OVERDUE", "CANCELLED", "ASSIGNED"] as TrainingAssignmentStatus[]) {
    assert.equal(await statusOf(updateTrainingAssignment(fixture.driverA.session, { fleetId: fixture.fleetId, assignmentId: fixture.driverA.assignmentId, status })), 403, status);
  }
  assert.equal((await readAssignment(fixture.driverA.assignmentId)).status, "ASSIGNED");
});

test("4c. A training admin who is the assigned driver cannot complete or certify their own assignment", async () => {
  const own = { fleetId: fixture.fleetId, assignmentId: fixture.adminDriver.assignmentId };
  assert.equal(await statusOf(updateTrainingAssignment(fixture.adminDriver.session, { ...own, status: "COMPLETE" })), 403);
  assert.equal(await statusOf(updateTrainingAssignment(fixture.adminDriver.session, { ...own, status: "CERTIFIED" })), 403);
  assert.equal(await statusOf(certifyTrainingAssignment(fixture.adminDriver.session, { ...own, outcome: "CERTIFIED" })), 403);
  const row = await readAssignment(fixture.adminDriver.assignmentId);
  assert.equal(row.status, "ASSIGNED");
  assert.equal(row.completedAt, null);
});

test("5. The existing admin completion and certification paths still work", async () => {
  const completed = await updateTrainingAssignment(fixture.admin, { fleetId: fixture.fleetId, assignmentId: fixture.driverB.assignmentId, status: "COMPLETE" });
  assert.equal(completed.status, "COMPLETE");
  assert.ok(completed.completedAt);
  const certification = await certifyTrainingAssignment(fixture.admin, { fleetId: fixture.fleetId, assignmentId: fixture.driverA.assignmentId, outcome: "CERTIFIED" });
  assert.equal(certification.outcome, "CERTIFIED");
  assert.equal((await readAssignment(fixture.driverA.assignmentId)).status, "CERTIFIED");
  const peerCertification = await certifyTrainingAssignment(fixture.admin, { fleetId: fixture.fleetId, assignmentId: fixture.adminDriver.assignmentId, outcome: "NOT_CERTIFIED" });
  assert.equal(peerCertification.outcome, "NOT_CERTIFIED");
});

test("6. Unrelated behaviour is unchanged", async () => {
  // Admin still lists the whole fleet.
  const all = await listTrainingAssignments(fixture.admin, fixture.fleetId);
  assert.deepEqual(new Set(all.map((row) => row.id)), new Set([fixture.driverA.assignmentId, fixture.driverB.assignmentId, fixture.adminDriver.assignmentId]));
  // Admin can still filter to one driver.
  const one = await listTrainingAssignments(fixture.admin, fixture.fleetId, fixture.driverB.id);
  assert.deepEqual(one.map((row) => row.id), [fixture.driverB.assignmentId]);
  // A driver can still record progress on an assignment that is still in a driver-owned state.
  const progress = await freshAssignment(fixture.driverB.id);
  const started = await updateTrainingAssignment(fixture.driverB.session, { fleetId: fixture.fleetId, assignmentId: progress.id, status: "STARTED" });
  assert.equal(started.status, "STARTED");
  assert.ok(started.startedAt);
  const acknowledged = await updateTrainingAssignment(fixture.driverB.session, { fleetId: fixture.fleetId, assignmentId: progress.id, status: "ACKNOWLEDGED", acknowledge: true });
  assert.ok(acknowledged.acknowledgedAt);
  // A driver still cannot touch another driver's assignment, or create assignments.
  assert.equal(await statusOf(updateTrainingAssignment(fixture.driverA.session, { fleetId: fixture.fleetId, assignmentId: fixture.driverB.assignmentId, status: "STARTED" })), 403);
  assert.equal(await statusOf(createTrainingAssignment(fixture.driverA.session, { fleetId: fixture.fleetId, driverId: fixture.driverA.id, trainingModuleId: fixture.moduleId })), 403);
  // Admin can still create assignments.
  const created = await createTrainingAssignment(fixture.admin, { fleetId: fixture.fleetId, driverId: fixture.driverA.id, trainingModuleId: fixture.moduleId });
  assert.equal(created.driverId, fixture.driverA.id);
});

test("7. A driver cannot overwrite an administrative training outcome with a progress status", async () => {
  const review = await freshAssignment(fixture.driverA.id);
  await updateTrainingAssignment(fixture.admin, { fleetId: fixture.fleetId, assignmentId: review.id, status: "REVIEW_REQUIRED" });
  assert.equal(await statusOf(updateTrainingAssignment(fixture.driverA.session, { fleetId: fixture.fleetId, assignmentId: review.id, status: "STARTED" })), 403);
  assert.equal((await readAssignment(review.id)).status, "REVIEW_REQUIRED");

  const notCertified = await freshAssignment(fixture.driverA.id);
  const denied = await certifyTrainingAssignment(fixture.admin, { fleetId: fixture.fleetId, assignmentId: notCertified.id, outcome: "NOT_CERTIFIED" });
  assert.equal(await statusOf(updateTrainingAssignment(fixture.driverA.session, { fleetId: fixture.fleetId, assignmentId: notCertified.id, status: "ACKNOWLEDGED", acknowledge: true })), 403);
  assert.equal((await readAssignment(notCertified.id)).status, "REVIEW_REQUIRED");
  assert.equal((await prisma.trainingCertification.findUniqueOrThrow({ where: { id: denied.id } })).outcome, "NOT_CERTIFIED");

  const certified = await freshAssignment(fixture.driverA.id);
  await certifyTrainingAssignment(fixture.admin, { fleetId: fixture.fleetId, assignmentId: certified.id, outcome: "CERTIFIED" });
  assert.equal(await statusOf(updateTrainingAssignment(fixture.driverA.session, { fleetId: fixture.fleetId, assignmentId: certified.id, status: "VIEWED" })), 403);
  assert.equal((await readAssignment(certified.id)).status, "CERTIFIED");

  const overdue = await freshAssignment(fixture.driverA.id);
  await updateTrainingAssignment(fixture.admin, { fleetId: fixture.fleetId, assignmentId: overdue.id, status: "OVERDUE" });
  assert.equal(await statusOf(updateTrainingAssignment(fixture.driverA.session, { fleetId: fixture.fleetId, assignmentId: overdue.id, status: "STARTED" })), 403);
  assert.equal((await readAssignment(overdue.id)).status, "OVERDUE");

  const cancelled = await freshAssignment(fixture.driverA.id);
  await updateTrainingAssignment(fixture.admin, { fleetId: fixture.fleetId, assignmentId: cancelled.id, status: "CANCELLED" });
  assert.equal(await statusOf(updateTrainingAssignment(fixture.driverA.session, { fleetId: fixture.fleetId, assignmentId: cancelled.id, status: "KNOWLEDGE_CHECK" })), 403);
  assert.equal((await readAssignment(cancelled.id)).status, "CANCELLED");

  const complete = await freshAssignment(fixture.driverA.id);
  await updateTrainingAssignment(fixture.admin, { fleetId: fixture.fleetId, assignmentId: complete.id, status: "COMPLETE" });
  const before = await readAssignment(complete.id);
  assert.equal(await statusOf(updateTrainingAssignment(fixture.driverA.session, { fleetId: fixture.fleetId, assignmentId: complete.id, status: "STARTED" })), 403);
  const after = await readAssignment(complete.id);
  assert.equal(after.status, "COMPLETE");
  assert.equal(after.completedAt?.toISOString(), before.completedAt?.toISOString());

  const progress = await freshAssignment(fixture.driverA.id);
  assert.equal((await updateTrainingAssignment(fixture.driverA.session, { fleetId: fixture.fleetId, assignmentId: progress.id, status: "STARTED" })).status, "STARTED");
  assert.equal((await updateTrainingAssignment(fixture.driverA.session, { fleetId: fixture.fleetId, assignmentId: progress.id, status: "VIEWED" })).status, "VIEWED");
  assert.equal((await updateTrainingAssignment(fixture.driverA.session, { fleetId: fixture.fleetId, assignmentId: progress.id, status: "KNOWLEDGE_CHECK" })).status, "KNOWLEDGE_CHECK");
  const acknowledged = await updateTrainingAssignment(fixture.driverA.session, { fleetId: fixture.fleetId, assignmentId: progress.id, status: "ACKNOWLEDGED", acknowledge: true });
  assert.equal(acknowledged.status, "ACKNOWLEDGED");
  assert.ok(acknowledged.acknowledgedAt);

  const reopened = await updateTrainingAssignment(fixture.admin, { fleetId: fixture.fleetId, assignmentId: overdue.id, status: "STARTED" });
  assert.equal(reopened.status, "STARTED");
  const recertified = await certifyTrainingAssignment(fixture.admin, { fleetId: fixture.fleetId, assignmentId: progress.id, outcome: "CERTIFIED" });
  assert.equal(recertified.outcome, "CERTIFIED");
});

test("8. A production login session recognizes a training admin and still denies everyone else", async () => {
  const admin = productionSession(fixture.admin.id!, fixture.fleetId, "FLEET_ADMIN");
  const listed = await listTrainingAssignments(admin, fixture.fleetId);
  assert.ok(listed.every((row) => row.fleetId === fixture.fleetId));
  assert.ok(listed.length >= 3);

  const target = await freshAssignment(fixture.driverB.id);
  const updated = await updateTrainingAssignment(admin, { fleetId: fixture.fleetId, assignmentId: target.id, status: "COMPLETE" });
  assert.equal(updated.status, "COMPLETE");

  const toCertify = await freshAssignment(fixture.driverB.id);
  const certification = await certifyTrainingAssignment(admin, { fleetId: fixture.fleetId, assignmentId: toCertify.id, outcome: "CERTIFIED" });
  assert.equal(certification.outcome, "CERTIFIED");
  assert.notEqual(certification.driverId, fixture.admin.id);

  const driver = productionSession(fixture.driverA.session.id!, fixture.fleetId, "DRIVER");
  const own = await listTrainingAssignments(driver, fixture.fleetId);
  assert.ok(own.length > 0);
  assert.ok(own.every((row) => row.driverId === fixture.driverA.id));
  assert.equal(await statusOf(listTrainingAssignments(driver, fixture.fleetId, fixture.driverB.id)), 403);
  assert.equal(await statusOf(updateTrainingAssignment(driver, { fleetId: fixture.fleetId, assignmentId: target.id, status: "STARTED" })), 403);
  assert.equal(await statusOf(certifyTrainingAssignment(driver, { fleetId: fixture.fleetId, assignmentId: toCertify.id, outcome: "CERTIFIED" })), 403);

  const inactiveAdmin = { id: fixture.admin.id, email: fixture.admin.email, memberships: [{ fleetId: fixture.fleetId, roleCode: "FLEET_ADMIN", status: "INACTIVE" as const }] };
  assert.equal(await statusOf(listTrainingAssignments(inactiveAdmin, fixture.fleetId)), 403);
  const dispatch = productionSession(fixture.admin.id!, fixture.fleetId, "DISPATCH");
  assert.equal(await statusOf(listTrainingAssignments(dispatch, fixture.fleetId)), 403);
  assert.equal(await statusOf(updateTrainingAssignment(dispatch, { fleetId: fixture.fleetId, assignmentId: target.id, status: "STARTED" })), 403);
  assert.equal(await statusOf(certifyTrainingAssignment(dispatch, { fleetId: fixture.fleetId, assignmentId: toCertify.id, outcome: "CERTIFIED" })), 403);
});

test("9. A concurrent driver update cannot leave ACKNOWLEDGED over a CERTIFIED certification", async () => {
  for (let attempt = 0; attempt < 25; attempt += 1) {
    const assignment = await freshAssignment(fixture.driverA.id);
    await Promise.allSettled([
      certifyTrainingAssignment(fixture.admin, { fleetId: fixture.fleetId, assignmentId: assignment.id, outcome: "CERTIFIED" }),
      updateTrainingAssignment(fixture.driverA.session, { fleetId: fixture.fleetId, assignmentId: assignment.id, status: "ACKNOWLEDGED", acknowledge: true }),
    ]);
    const row = await readAssignment(assignment.id);
    const certification = await prisma.trainingCertification.findUnique({ where: { assignmentId: assignment.id } });
    assert.equal(certification?.outcome, "CERTIFIED", `attempt ${attempt}`);
    assert.equal(row.status, "CERTIFIED", `attempt ${attempt}`);
    assert.notEqual(row.status, "ACKNOWLEDGED");
  }
});
