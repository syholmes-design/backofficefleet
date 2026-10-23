import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import test from "node:test";
const prismaMockUrl = new URL("./bofInquiryReview.prisma-mock.mjs", import.meta.url).href;
// Synchronous hooks apply to both import and require, so the mock also replaces @/lib/prisma when the services are
// loaded through tsx's CommonJS path. An async `register` hook does not see those loads, and the test then queried
// the real database instead of the mock.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "@/lib/prisma") {
      return { url: prismaMockUrl, shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});

const reviewer = {
  id: "inquiry-reviewer",
  memberships: [{ fleetId: "inquiry-fleet", roleCode: "BOF_INQUIRY_REVIEW", status: "ACTIVE" as const }],
};
const service = {
  id: "service-operator",
  memberships: [{ fleetId: "inquiry-fleet", roleCode: "BOF_OPERATIONS", status: "ACTIVE" as const }],
};
const serviceCodes = ["BOF_OPERATIONS", "BOF_COMPLIANCE_REVIEW"];

test("inquiry review is staff access and is not a global service role", async () => {
  const { isBofStaff } = await import("@/lib/contact/bofStaffAccess");
  const { isServiceRole } = await import("@/lib/authorization");
  assert.equal(isBofStaff(reviewer), true);
  assert.equal(isServiceRole(reviewer, serviceCodes), false);
  assert.equal(isServiceRole(service, serviceCodes), true);
  assert.equal(readFileSync("components/BofHeader.tsx", "utf8").includes("isBofStaff("), true);
  for (const file of [
    "lib/services/intakeService.ts",
    "lib/services/loadService.ts",
    "lib/services/equipmentService.ts",
    "lib/services/pickupAuthorizationService.ts",
    "lib/services/driverOperationalReadModelService.ts",
    "app/api/load-process-intelligence/discovery/route.ts",
  ]) {
    assert.equal(readFileSync(file, "utf8").includes("BOF_INQUIRY_REVIEW"), false, file);
  }
});

test("an inquiry reviewer cannot read another carrier's loads, drivers, equipment, or pickup authorizations", async () => {
  const { authorizedFleetAccess } = await import("@/lib/services/intakeService");
  const { listAccessibleLoads } = await import("@/lib/services/loadService");
  const { listAccessibleEquipment } = await import("@/lib/services/equipmentService");
  const { listPickupAuthorizations } = await import("@/lib/services/pickupAuthorizationService");
  const { listAccessibleDriverOperationalSummaries } = await import("@/lib/services/driverOperationalReadModelService");

  for (const fleetId of ["carrier-a", "carrier-b"]) {
    const access = await authorizedFleetAccess(reviewer, fleetId);
    assert.equal(access.allowed, false, fleetId);
  }

  const reviewerLoads = await listAccessibleLoads(reviewer);
  const reviewerDrivers = await listAccessibleDriverOperationalSummaries(reviewer);
  const reviewerEquipment = await listAccessibleEquipment(reviewer);
  const reviewerPickups = await listPickupAuthorizations(reviewer);

  assert.deepEqual(reviewerLoads.map((row) => row.fleetId), []);
  assert.deepEqual(reviewerDrivers.map((row) => row.fleetId), []);
  assert.deepEqual(reviewerEquipment.map((row) => row.fleetId), []);
  assert.deepEqual(reviewerPickups.map((row) => row.fleetId), []);

  const serviceLoads = await listAccessibleLoads(service);
  assert.deepEqual(serviceLoads.map((row) => row.id).sort(), ["load-carrier-a", "load-carrier-b"]);
});
