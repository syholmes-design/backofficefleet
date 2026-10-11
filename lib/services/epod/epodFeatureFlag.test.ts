import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { assertEpodEnabled, isEpodEnabled } from "@/lib/services/epod/deliveryLifecycle";

const previous = process.env.BOF_EPOD_ENABLED;

function restoreFlag() {
  if (previous === undefined) delete process.env.BOF_EPOD_ENABLED;
  else process.env.BOF_EPOD_ENABLED = previous;
}

function statusOf(error: unknown) {
  return error && typeof error === "object" && "statusCode" in error
    ? Number((error as { statusCode?: number }).statusCode)
    : 0;
}

test("BOF_EPOD_ENABLED keeps the exact false disable contract", () => {
  try {
    process.env.BOF_EPOD_ENABLED = "false";
    assert.equal(isEpodEnabled(), false);
    assert.throws(assertEpodEnabled, (error: unknown) => statusOf(error) === 503);

    process.env.BOF_EPOD_ENABLED = "FALSE";
    assert.equal(isEpodEnabled(), true);
    assert.doesNotThrow(assertEpodEnabled);

    process.env.BOF_EPOD_ENABLED = "true";
    assert.equal(isEpodEnabled(), true);
    assert.doesNotThrow(assertEpodEnabled);

    delete process.env.BOF_EPOD_ENABLED;
    assert.equal(isEpodEnabled(), true);
    assert.doesNotThrow(assertEpodEnabled);
  } finally {
    restoreFlag();
  }
});

test("disabled POD routes and proof writers stop before database work", () => {
  const routes = [
    "app/api/dispatch/load/[loadId]/delivery/route.ts",
    "app/api/dispatch/load/[loadId]/delivery/photos/route.ts",
    "app/api/dispatch/load/[loadId]/delivery/acknowledgment/route.ts",
    "app/api/dispatch/load/[loadId]/delivery/epod/route.ts",
    "app/api/dispatch/load/[loadId]/delivery/evidence/[evidenceId]/route.ts",
    "app/api/dispatch/load/[loadId]/proof/route.ts",
    "app/api/dispatch/load/[loadId]/proof/verify/route.ts",
    "app/api/dispatch/load/[loadId]/proof/reject/route.ts",
  ];
  for (const route of routes) {
    const source = readFileSync(route, "utf8");
    const gate = source.indexOf("assertEpodEnabled");
    const session = source.indexOf("auth(");
    assert.ok(gate > 0 && session > gate, route);
  }

  const service = readFileSync("lib/services/proofSettlementHoldService.ts", "utf8");
  for (const name of ["submitReceivedLoadProof", "verifyStoredLoadProof", "rejectProofAndHoldSettlement", "listStoredLoadProofs"]) {
    const body = service.slice(service.indexOf(`export async function ${name}`));
    const gate = body.indexOf("assertEpodEnabled");
    const loadRead = body.indexOf("findLoadByOperatorKey");
    assert.ok(gate >= 0 && gate < loadRead, name);
  }

  const rejectBody = service.slice(service.indexOf("export async function rejectProofAndHoldSettlement"));
  const rejectEnd = rejectBody.indexOf("export async function assertProofSubmission");
  const rejectSlice = rejectEnd > 0 ? rejectBody.slice(0, rejectEnd) : rejectBody.slice(0, 1800);
  assert.ok(rejectSlice.indexOf("assertEpodEnabled") < rejectSlice.indexOf("rejectProofInStore"));

  const verifyBody = service.slice(service.indexOf("export async function verifyStoredLoadProof"));
  assert.ok(verifyBody.indexOf("assertEpodEnabled") < verifyBody.indexOf("getOperatingProcessStore"));
  assert.doesNotMatch(verifyBody.slice(0, verifyBody.indexOf("export function proofRouteStatus")), /updateSettlement/);
});

test("the delivery tab hides disabled POD actions", () => {
  const detail = readFileSync("components/dispatch/LoadDetailContent.tsx", "utf8");
  const layout = readFileSync("app/(bof)/layout.tsx", "utf8");
  assert.match(detail, /useEpodEnabled\(\)/);
  assert.match(detail, /epodEnabled && tab === "delivery"/);
  assert.match(detail, /Electronic POD is disabled/);
  assert.match(detail, /item\.id !== "delivery"/);
  assert.match(layout, /isEpodEnabled\(\)/);
  assert.match(layout, /EpodAvailabilityProvider/);
  assert.match(detail, /\/api\/dispatch\/load\/\$\{encodeURIComponent\(loadId\)\}\/proof\/reject/);
  assert.match(detail, /ProofRejectHoldForm/);
  assert.match(detail, /\/proof\/verify/);
});

test("assignment readiness stays inside BOF and does not read Samba findings", () => {
  const assignment = readFileSync("lib/services/dispatchAssignmentService.ts", "utf8");
  assert.match(assignment, /MISSING_READINESS/);
  assert.match(assignment, /NOT_READY/);
  assert.match(assignment, /DRIVER_ROLE/);
  assert.match(assignment, /driverReadinessScore\.findFirst/);
  const lockAt = assignment.indexOf("await lockDriverReadinessWrite");
  const readAt = assignment.indexOf("driverReadinessScore.findFirst");
  assert.ok(lockAt > 0 && lockAt < readAt);
  assert.match(assignment, /authorizedFleetId: assignment\.fleetId/);
  const events = readFileSync("lib/process-intelligence/operating-event-service.ts", "utf8");
  assert.match(events, /options\.authorizedFleetId !== input\.fleetId/);
  assert.match(events, /assertTenant\(user, input\.fleetId\)/);
  const readiness = readFileSync("lib/services/readinessService.ts", "utf8");
  const eligibility = readFileSync("lib/services/driverEligibilityReviewService.ts", "utf8");
  assert.match(readiness, /pg_advisory_xact_lock\(hashtext/);
  assert.ok(readiness.indexOf("lockDriverReadinessWrite(tx, driverId)") < readiness.indexOf("tx.driverReadinessScore.create"));
  assert.ok(eligibility.indexOf("lockDriverReadinessWrite(tx, driver.id)") < eligibility.indexOf("tx.driverReadinessScore.create"));
  const route = readFileSync("app/api/dispatch/assignment/route.ts", "utf8");
  assert.match(route, /\["loadId", "driverId", "tractorId", "trailerId"\]/);
  assert.doesNotMatch(route, /authorizedFleetId|fleetAccessAlreadyAuthorized/);
  assert.doesNotMatch(assignment, /SambaFinding|sambaFinding|listSambaFindings/);
  assert.doesNotMatch(eligibility, /prisma\.sambaFinding|SambaFinding/);
});
