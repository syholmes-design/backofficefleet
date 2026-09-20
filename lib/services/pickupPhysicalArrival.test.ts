import assert from "node:assert/strict";
import test from "node:test";

import {
  comparePresentedId,
  evaluatePickupPhysicalArrival,
  PHYSICAL_VERIFICATION_CAPABILITY,
} from "@/lib/services/pickupPhysicalArrival";

const authorized = {
  authorizationId: "auth-1",
  loadId: "load-1",
  driverId: "driver-1",
  tractorId: "tractor-1",
  trailerId: "trailer-1",
  tractorUnitNumber: "TR-9",
  trailerUnitNumber: "TL-9",
  tractorVin: "1XPBDP9X0KD123456",
  trailerVin: null,
};

test("empty arrival stays UNVERIFIED and does not become MATCH", () => {
  const decision = evaluatePickupPhysicalArrival(authorized, {});
  assert.equal(decision.driverArrivalResult, "UNVERIFIED");
  assert.equal(decision.tractorArrivalResult, "UNVERIFIED");
  assert.equal(decision.trailerArrivalResult, "UNVERIFIED");
  assert.equal(decision.loadArrivalResult, "UNVERIFIED");
  assert.equal(decision.identityPhysicalClass, "UNVERIFIED");
  assert.equal(decision.equipmentPhysicalClass, "UNVERIFIED");
  assert.equal(decision.identityMatchToAuthorizedRecord, false);
  assert.equal(decision.disposition, "RELEASE");
});

test("matching presented records is MATCH without physical verification", () => {
  const decision = evaluatePickupPhysicalArrival(authorized, {
    authorizationId: "auth-1",
    loadId: "load-1",
    driverId: "driver-1",
    tractorId: "tractor-1",
    trailerId: "trailer-1",
    tractorUnitNumber: "TR-9",
    trailerUnitNumber: "TL-9",
    vin: "1XPBDP9X0KD123456",
  });
  assert.equal(decision.driverArrivalResult, "MATCH");
  assert.equal(decision.tractorArrivalResult, "MATCH");
  assert.equal(decision.trailerArrivalResult, "MATCH");
  assert.equal(decision.disposition, "RELEASE");
  assert.equal(decision.identityPhysicalClass, "UNVERIFIED");
  assert.equal(decision.identityMatchToAuthorizedRecord, true);
});

test("wrong driver / tractor / trailer / load map to STOP", () => {
  assert.equal(evaluatePickupPhysicalArrival(authorized, { driverId: "other" }).disposition, "STOP");
  assert.ok(evaluatePickupPhysicalArrival(authorized, { driverId: "other" }).reasonCodes.includes("WRONG_DRIVER"));
  assert.ok(evaluatePickupPhysicalArrival(authorized, { tractorUnitNumber: "NOPE" }).reasonCodes.includes("WRONG_TRACTOR"));
  assert.ok(evaluatePickupPhysicalArrival(authorized, { trailerUnitNumber: "NOPE" }).reasonCodes.includes("WRONG_TRAILER"));
  assert.ok(evaluatePickupPhysicalArrival(authorized, { loadId: "other-load" }).reasonCodes.includes("WRONG_LOAD"));
});

test("expired and unauthorized force STOP without claiming physical proof", () => {
  const expired = evaluatePickupPhysicalArrival(authorized, { driverId: "driver-1" }, { expired: true });
  assert.equal(expired.disposition, "STOP");
  assert.equal(expired.authorizationArrivalResult, "EXPIRED");
  const unauthorized = evaluatePickupPhysicalArrival(authorized, { driverId: "driver-1" }, { unauthorized: true });
  assert.equal(unauthorized.disposition, "STOP");
  assert.equal(unauthorized.driverArrivalResult, "UNAUTHORIZED");
});

test("tractor QR does not mismatch trailer", () => {
  const decision = evaluatePickupPhysicalArrival(authorized, { qr: "TR-9" });
  assert.equal(decision.tractorArrivalResult, "MATCH");
  assert.equal(decision.trailerArrivalResult, "UNVERIFIED");
  assert.equal(decision.disposition, "RELEASE");
});

test("comparePresentedId never treats empty input as MATCH", () => {
  assert.equal(comparePresentedId("driver-1", ""), "UNVERIFIED");
  assert.equal(comparePresentedId("driver-1", "driver-1"), "MATCH");
});

test("identity and biometric kinds remain integration-dependent", () => {
  assert.equal(PHYSICAL_VERIFICATION_CAPABILITY.IDENTITY_PROVIDER, "INTEGRATION_DEPENDENT");
  assert.equal(PHYSICAL_VERIFICATION_CAPABILITY.DL_VERIFICATION, "INTEGRATION_DEPENDENT");
  assert.equal(PHYSICAL_VERIFICATION_CAPABILITY.PHOTO_MATCH, "INTEGRATION_DEPENDENT");
  assert.equal(PHYSICAL_VERIFICATION_CAPABILITY.LIVENESS, "INTEGRATION_DEPENDENT");
  assert.equal(PHYSICAL_VERIFICATION_CAPABILITY.GPS_GEOFENCE, "INTEGRATION_DEPENDENT");
  assert.equal(PHYSICAL_VERIFICATION_CAPABILITY.TELEMATICS, "INTEGRATION_DEPENDENT");
  assert.equal(PHYSICAL_VERIFICATION_CAPABILITY.QR_BARCODE, "LIVE_CAPABLE");
  assert.equal(PHYSICAL_VERIFICATION_CAPABILITY.VIN_SCAN, "LIVE_CAPABLE");
  assert.equal(PHYSICAL_VERIFICATION_CAPABILITY.SHIPPER_DOCK, "LIVE_CAPABLE");
});
