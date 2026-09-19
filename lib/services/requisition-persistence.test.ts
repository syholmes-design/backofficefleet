import assert from "node:assert/strict";
import test from "node:test";

import { prisma } from "@/lib/prisma";
import {
  createDraftRequisition,
  getAuthorizedRequisition,
  listRequisitionsForUser,
  recordRequisitionApproval,
  transitionRequisition,
  updateDraftRequisition,
} from "@/lib/services/requisitionService";
import type { SessionUserLike } from "@/lib/services/intakeService";

function asUser(row: { id: string; email: string | null; memberships: Array<{ fleetId: string; role: { code: string }; status: string }> }): SessionUserLike {
  return {
    id: row.id,
    email: row.email,
    memberships: row.memberships.map((membership) => ({ fleetId: membership.fleetId, roleCode: membership.role.code, status: membership.status })),
  };
}

test("local persistence: requisition lifecycle does not create a Driver", async () => {
  const fleetA = await prisma.fleet.findFirst({ where: { name: "Fleet A" } });
  const fleetB = await prisma.fleet.findFirst({ where: { name: "Fleet B" } });
  assert.ok(fleetA && fleetB);
  const adminA = asUser(
    await prisma.user.findFirstOrThrow({
      where: { email: "fleet-a-admin@dev.local" },
      include: { memberships: { include: { role: true } } },
    }),
  );
  const adminB = asUser(
    await prisma.user.findFirstOrThrow({
      where: { email: "fleet-b-admin@dev.local" },
      include: { memberships: { include: { role: true } } },
    }),
  );
  const bofOps = asUser(
    await prisma.user.findFirstOrThrow({
      where: { email: "bof-operations@dev.local" },
      include: { memberships: { include: { role: true } } },
    }),
  );

  const driverCountBefore = await prisma.driver.count();
  const created = await createDraftRequisition({ sessionUser: adminA, fleetId: fleetA.id });
  assert.equal(created.status, "DRAFT");
  assert.equal(created.fleetId, fleetA.id);
  assert.match(created.publicNumber, /^BOF-HR-DRV-/);
  assert.equal("driverId" in created, false);

  await assert.rejects(() => createDraftRequisition({ sessionUser: adminA, fleetId: fleetB.id }), (error: { statusCode?: number }) => error.statusCode === 403);
  await assert.rejects(() => getAuthorizedRequisition(adminB, created.id), (error: { statusCode?: number }) => error.statusCode === 403);
  await assert.rejects(() => listRequisitionsForUser(adminB, fleetA.id), (error: { statusCode?: number }) => error.statusCode === 403);

  const saved = await updateDraftRequisition({
    sessionUser: adminA,
    requisitionId: created.id,
    body: {
      positionTitle: "OTR CDL Driver",
      numberOfPositions: 2,
      targetStartDate: "2026-10-15",
      cdlClass: "A",
      department: "Operations",
    },
  });
  assert.equal(saved.positionTitle, "OTR CDL Driver");

  await assert.rejects(() => transitionRequisition({ sessionUser: adminA, requisitionId: created.id, action: "approve" }), (error: { statusCode?: number }) => error.statusCode === 422);

  const submitted = await transitionRequisition({ sessionUser: adminA, requisitionId: created.id, action: "submit" });
  assert.equal(submitted.status, "SUBMITTED");
  await assert.rejects(() => updateDraftRequisition({ sessionUser: adminA, requisitionId: created.id, body: { positionTitle: "x" } }), (error: { statusCode?: number }) => error.statusCode === 422);

  const reviewed = await transitionRequisition({ sessionUser: adminA, requisitionId: created.id, action: "review" });
  assert.equal(reviewed.status, "UNDER_REVIEW");

  await assert.rejects(
    () => transitionRequisition({ sessionUser: adminA, requisitionId: created.id, action: "approve" }),
    (error: Error) => error.message.includes("FLEET_SAFETY_DIRECTOR"),
  );

  for (const role of ["REQUESTING_MANAGER", "FLEET_SAFETY_DIRECTOR", "FLEET_OWNER_GM"] as const) {
    await recordRequisitionApproval({
      sessionUser: adminA,
      requisitionId: created.id,
      approvalRole: role,
      decision: "APPROVED",
      signatureName: "Form signature",
      reviewerName: "Fleet A Admin",
    });
  }
  await recordRequisitionApproval({
    sessionUser: bofOps,
    requisitionId: created.id,
    approvalRole: "BOF_ACCOUNT_MANAGER",
    decision: "APPROVED",
    signatureName: "BOF AM",
  });
  await recordRequisitionApproval({
    sessionUser: bofOps,
    requisitionId: created.id,
    approvalRole: "BOF_HR_REVIEW",
    decision: "APPROVED",
    signatureName: "BOF HR",
  });

  const approved = await transitionRequisition({ sessionUser: adminA, requisitionId: created.id, action: "approve" });
  assert.equal(approved.status, "APPROVED");
  assert.equal(approved.recruitingPipelineState, "READY_FOR_RECRUITING");

  const held = await transitionRequisition({ sessionUser: adminA, requisitionId: created.id, action: "hold" });
  assert.equal(held.status, "ON_HOLD");
  const resumed = await transitionRequisition({ sessionUser: adminA, requisitionId: created.id, action: "approve" });
  assert.equal(resumed.status, "APPROVED");
  const filled = await transitionRequisition({ sessionUser: adminA, requisitionId: created.id, action: "fill" });
  assert.equal(filled.status, "FILLED");
  await assert.rejects(() => transitionRequisition({ sessionUser: adminA, requisitionId: created.id, action: "cancel" }), (error: { statusCode?: number }) => error.statusCode === 422);

  const cancelTarget = await createDraftRequisition({ sessionUser: adminA, fleetId: fleetA.id });
  const cancelled = await transitionRequisition({ sessionUser: adminA, requisitionId: cancelTarget.id, action: "cancel" });
  assert.equal(cancelled.status, "CANCELLED");

  const driverCountAfter = await prisma.driver.count();
  assert.equal(driverCountAfter, driverCountBefore);
  const intakeCount = await prisma.driverIntake.count({ where: { createdAt: { gte: created.createdAt } } });
  assert.equal(intakeCount, 0);

  const audit = await prisma.auditEvent.findFirst({ where: { entityType: "Requisition", entityId: created.id, action: "CREATED" } });
  assert.ok(audit);

  await prisma.requisitionApproval.deleteMany({ where: { requisitionId: { in: [created.id, cancelTarget.id] } } });
  await prisma.requisition.deleteMany({ where: { id: { in: [created.id, cancelTarget.id] } } });
});
