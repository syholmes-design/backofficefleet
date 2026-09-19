import assert from "node:assert/strict";
import test from "node:test";

import { evaluatePickupReconciliation } from "@/lib/services/pickupReconciliation";
import { generatePickupAuthorizationToken, hashPickupAuthorizationToken, pickupAuthorizationTokensMatch } from "@/lib/services/pickupToken";

const expected = {
  authorizationId: "auth-1",
  loadId: "load-1",
  driverId: "driver-1",
  tractorEquipmentId: "tractor-1",
  trailerEquipmentId: "trailer-1",
};

test("pickup reconciliation: matching presented identities may RELEASE", () => {
  const decision = evaluatePickupReconciliation(expected, expected);
  assert.equal(decision.match, true);
  assert.deepEqual(decision.reasonCodes, []);
});

test("pickup reconciliation: wrong driver STOP", () => {
  const decision = evaluatePickupReconciliation(expected, { ...expected, driverId: "other-driver" });
  assert.equal(decision.match, false);
  assert.deepEqual(decision.reasonCodes, ["WRONG_DRIVER"]);
});

test("pickup reconciliation: wrong tractor STOP", () => {
  const decision = evaluatePickupReconciliation(expected, { ...expected, tractorEquipmentId: "other-tractor" });
  assert.equal(decision.match, false);
  assert.deepEqual(decision.reasonCodes, ["WRONG_TRACTOR"]);
});

test("pickup reconciliation: wrong trailer STOP", () => {
  const decision = evaluatePickupReconciliation(expected, { ...expected, trailerEquipmentId: "other-trailer" });
  assert.equal(decision.match, false);
  assert.deepEqual(decision.reasonCodes, ["WRONG_TRAILER"]);
});

test("pickup reconciliation: omitted expected trailer vs presented trailer STOP", () => {
  const decision = evaluatePickupReconciliation({ ...expected, trailerEquipmentId: null }, expected);
  assert.equal(decision.match, false);
  assert.ok(decision.reasonCodes.includes("WRONG_TRAILER"));
});

test("pickup reconciliation: wrong load STOP", () => {
  const decision = evaluatePickupReconciliation(expected, { ...expected, loadId: "other-load" });
  assert.equal(decision.match, false);
  assert.ok(decision.reasonCodes.includes("WRONG_LOAD"));
});

test("pickup token is not a database id and verifies by hash", () => {
  const token = generatePickupAuthorizationToken();
  assert.notEqual(token, "auth-1");
  assert.match(token, /^[A-Za-z0-9_-]+$/);
  assert.ok(token.length >= 32);
  const hash = hashPickupAuthorizationToken(token);
  assert.equal(hash.length, 64);
  assert.equal(hash.includes(token), false);
  assert.equal(pickupAuthorizationTokensMatch(token, hash), true);
  assert.equal(pickupAuthorizationTokensMatch("tampered", hash), false);
});
