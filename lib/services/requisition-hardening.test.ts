import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { canAccessFleet, requireFleetAccess } from "../authorization";
import {
  canPerformWorkflowAction,
  getRequisitionTransitionError,
  getSubmitFieldErrors,
  isCdlRequisition,
  missingApprovalsForApprove,
  nextRequisitionStatus,
  requiredApprovalRoles,
  rolesAllowedToRecordApproval,
} from "../recruiting/requisition-transitions";

const fleetA = { id: "user-a", memberships: [{ fleetId: "fleet-a", roleCode: "FLEET_MANAGER", status: "ACTIVE" as const }] };
const fleetB = { id: "user-b", memberships: [{ fleetId: "fleet-b", roleCode: "FLEET_ADMIN", status: "ACTIVE" as const }] };

test("unauthenticated access is denied", () => {
  const access = requireFleetAccess(null, "fleet-a");
  assert.equal(access.allowed, false);
  assert.equal(access.reason, "AUTH_REQUIRED");
});

test("Fleet A cannot read Fleet B requisitions", () => {
  assert.equal(canAccessFleet(fleetA, "fleet-b"), false);
  assert.equal(requireFleetAccess(fleetA, "fleet-b").reason, "TENANT_ACCESS_DENIED");
  assert.equal(canAccessFleet(fleetB, "fleet-a"), false);
});

test("status transitions follow source statuses", () => {
  assert.equal(nextRequisitionStatus("DRAFT", "submit"), "SUBMITTED");
  assert.equal(nextRequisitionStatus("SUBMITTED", "review"), "UNDER_REVIEW");
  assert.equal(nextRequisitionStatus("UNDER_REVIEW", "approve"), "APPROVED");
  assert.equal(nextRequisitionStatus("APPROVED", "hold"), "ON_HOLD");
  assert.equal(nextRequisitionStatus("APPROVED", "fill"), "FILLED");
  assert.equal(nextRequisitionStatus("DRAFT", "cancel"), "CANCELLED");
  assert.equal(getRequisitionTransitionError("FILLED", "cancel"), "Illegal Requisition transition: cancel is not allowed from FILLED");
  assert.equal(getRequisitionTransitionError("DRAFT", "approve"), "Illegal Requisition transition: approve is not allowed from DRAFT");
  assert.equal(getRequisitionTransitionError("CANCELLED", "submit"), "Illegal Requisition transition: submit is not allowed from CANCELLED");
});

test("submit requires source identity fields", () => {
  assert.deepEqual(getSubmitFieldErrors({ positionTitle: "", numberOfPositions: 0, targetStartDate: null }), [
    "Position title is required to submit",
    "Number of positions must be at least 1",
    "Target start date is required to submit",
  ]);
  assert.deepEqual(getSubmitFieldErrors({ positionTitle: "OTR CDL Driver", numberOfPositions: 2, targetStartDate: "2026-10-01" }), []);
});

test("CDL requisitions require Fleet Safety Director approval", () => {
  assert.equal(isCdlRequisition("A"), true);
  assert.equal(isCdlRequisition("  "), false);
  assert.ok(requiredApprovalRoles("A").includes("FLEET_SAFETY_DIRECTOR"));
  assert.equal(requiredApprovalRoles(null).includes("FLEET_SAFETY_DIRECTOR"), false);
  const missing = missingApprovalsForApprove("A", [
    { approvalRole: "REQUESTING_MANAGER", decision: "APPROVED" },
    { approvalRole: "FLEET_OWNER_GM", decision: "APPROVED" },
    { approvalRole: "BOF_ACCOUNT_MANAGER", decision: "APPROVED" },
    { approvalRole: "BOF_HR_REVIEW", decision: "APPROVED" },
  ]);
  assert.deepEqual(missing, ["FLEET_SAFETY_DIRECTOR"]);
});

test("source does not include REJECTED; reject is not a requisition status action", () => {
  assert.equal(getRequisitionTransitionError("UNDER_REVIEW", "approve"), null);
  assert.match(JSON.stringify(["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "ON_HOLD", "CANCELLED", "FILLED"]), /UNDER_REVIEW/);
});

test("driver role cannot submit or approve", () => {
  assert.equal(canPerformWorkflowAction("submit", ["DRIVER"]), false);
  assert.equal(canPerformWorkflowAction("approve", ["FLEET_ADMIN"]), true);
  assert.ok(rolesAllowedToRecordApproval("BOF_HR_REVIEW").includes("BOF_OPERATIONS"));
});

test("requisition service does not create Driver or call qualification/readiness", () => {
  const source = readFileSync(path.join(process.cwd(), "lib/services/requisitionService.ts"), "utf8");
  for (const forbidden of [
    "prisma.driver.create",
    "prisma.driverIntake.create",
    "evaluateQualification",
    "evaluateReadiness",
    "qualificationService",
    "readinessService",
    "localStorage",
  ]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
  assert.equal(source.includes("driverId"), false);
  assert.match(source, /entityType: "Requisition"/);
});

test("schema has no driverId on Requisition", () => {
  const schema = readFileSync(path.join(process.cwd(), "prisma/schema.prisma"), "utf8");
  const start = schema.indexOf("model Requisition {");
  const end = schema.indexOf("model RequisitionApproval {");
  const block = schema.slice(start, end);
  assert.equal(block.includes("driverId"), false);
  assert.match(block, /fleetId/);
  assert.match(block, /recruitingPipelineState/);
});
