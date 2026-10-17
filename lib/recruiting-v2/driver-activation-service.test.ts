import assert from "node:assert/strict";
import test from "node:test";

import {
  readRecruitingV2DriverHandoff,
  splitRecruitingFullName,
} from "@/lib/recruiting-v2/driver-activation-service";

test("splitRecruitingFullName handles single and multi-part names", () => {
  assert.deepEqual(splitRecruitingFullName("Ada"), { firstName: "Ada", lastName: "Driver" });
  assert.deepEqual(splitRecruitingFullName("Ada Lovelace"), { firstName: "Ada", lastName: "Lovelace" });
  assert.deepEqual(splitRecruitingFullName("  Jean Luc  Picard "), { firstName: "Jean", lastName: "Luc Picard" });
});

test("readRecruitingV2DriverHandoff returns structured handoff from applicationSummary", () => {
  const handoff = {
    driverId: "drv_1",
    driverIntakeId: "int_1",
    fleetId: "fleet_a",
    activatedAt: "2026-01-01T00:00:00.000Z",
    activatedByUserId: "usr_1",
    candidateCode: "CAND-001",
  };
  assert.deepEqual(readRecruitingV2DriverHandoff({ recruitingV2DriverHandoff: handoff }), handoff);
  assert.equal(readRecruitingV2DriverHandoff(null), null);
  assert.equal(readRecruitingV2DriverHandoff({ recruitingV2DriverHandoff: { driverId: "x" } }), null);
});
