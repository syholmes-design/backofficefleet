import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { mapIntakeRecordToCreateLoadPayload } from "./map-intake-to-create-load-payload";
import type { LoadIntakeRecord } from "../load-requirements-intake-types";

const record = {
  sourceType: "manual",
  customerName: "Northline Foods",
  pickupCity: "Dallas",
  pickupState: "TX",
  deliveryCity: "Atlanta",
  deliveryState: "GA",
  bolNumber: "BOL-100",
  commodity: "Produce",
  rate: 1800,
} as LoadIntakeRecord;

test("reviewed intake maps to a planned live load and does not copy the rate", () => {
  const body = mapIntakeRecordToCreateLoadPayload(record, "fleet-live");
  assert.equal(body.status, "PLANNED");
  assert.equal(body.customerName, "Northline Foods");
  assert.match(body.origin, /Dallas/);
  assert.match(body.destination, /Atlanta/);
  assert.equal(body.referenceNumber, "BOL-100");
  assert.equal(body.commodityClass, "Produce");
  assert.equal("rate" in body, false);
  assert.equal("grossAmount" in body, false);
});

test("an intake record without a customer, pickup, and delivery is refused", () => {
  assert.throws(
    () => mapIntakeRecordToCreateLoadPayload({ ...record, customerName: " ", pickupCity: "", pickupState: "" }, "fleet-live"),
    /customer, a pickup, and a delivery/,
  );
});

test("a demo load key is refused before a live create", () => {
  assert.throws(
    () => mapIntakeRecordToCreateLoadPayload({ ...record, bolNumber: "L001" }, "fleet-live"),
    /DEMO operational key/,
  );
});

test("the live intake wizard posts to the existing load API", () => {
  const wizard = readFileSync("components/load-intake/LoadRequirementsWizard.tsx", "utf8");
  const fmcsa = readFileSync("app/api/carriers/fmcsa-verification/route.ts", "utf8");
  const release = readFileSync("components/trip-release/DriverTripReleaseClient.tsx", "utf8");
  assert.match(wizard, /\/api\/dispatch\/load/);
  assert.doesNotMatch(wizard, /commitIntakeWizardToBof/);
  assert.match(fmcsa, /evaluateSambaIntelligence/);
  assert.match(fmcsa, /mutatedOperationalRecords: false/);
  assert.match(release, /<SambaIntelligencePanel loadId=\{loadId\}/);
  assert.match(release, /buildLiveLoadReview/);
});
