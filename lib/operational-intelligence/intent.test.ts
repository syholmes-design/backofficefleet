import assert from "node:assert/strict";
import test from "node:test";

import { classifyOperationalIntent, extractLoadReference } from "@/lib/operational-intelligence/intent";

test("classifyOperationalIntent routes settlement and readiness questions", () => {
  assert.equal(classifyOperationalIntent("Why is this settlement on hold?"), "SETTLEMENT_HOLDS");
  assert.equal(classifyOperationalIntent("Which drivers are not dispatch ready?"), "DRIVER_READINESS");
  assert.equal(classifyOperationalIntent("What is payroll status this week?"), "PAYROLL_STATUS");
  assert.equal(classifyOperationalIntent("Where is the truck on load L004?"), "TELEMATICS");
});

test("extractLoadReference prefers context and parses load tokens", () => {
  assert.equal(extractLoadReference("status?", { loadId: "cmabc123" }), "cmabc123");
  assert.equal(extractLoadReference("tell me about load L004"), "L004");
});
