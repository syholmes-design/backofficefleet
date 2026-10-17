import assert from "node:assert/strict";
import test from "node:test";

import { diffCarrierProfiles, evaluateCarrierProfile } from "@/lib/services/fmcsa/carrierMonitoring";
import { qcMobileCarrierProfile, toIsoDate, type FmcsaCarrierProfile } from "@/lib/services/fmcsa/carrierProfile";
import { QcMobileFmcsaProvider } from "@/lib/services/fmcsa/qcmobileProvider";

const NOW = new Date("2026-10-17T12:00:00Z");

function profile(overrides: Partial<FmcsaCarrierProfile> = {}): FmcsaCarrierProfile {
  return {
    source: "OPEN_DATA",
    usdot: "1234567",
    legalName: "Example Freight LLC",
    dbaName: null,
    usdotStatus: "A",
    allowedToOperate: true,
    outOfServiceDate: null,
    commonAuthority: "ACTIVE",
    contractAuthority: null,
    brokerAuthority: null,
    bipdInsuranceOnFileUsd: 750_000,
    bipdInsuranceRequiredUsd: 750_000,
    safetyRating: null,
    safetyRatingDate: null,
    powerUnits: 10,
    drivers: 12,
    mcs150Date: "2026-01-15",
    mcs150Outdated: null,
    retrievedAt: NOW.toISOString(),
    ...overrides,
  };
}

test("a compliant carrier raises no alerts", () => {
  assert.deepEqual(evaluateCarrierProfile(profile(), NOW), []);
});

test("missing data never raises alerts", () => {
  const empty = profile({
    usdotStatus: null,
    allowedToOperate: null,
    commonAuthority: null,
    bipdInsuranceOnFileUsd: null,
    bipdInsuranceRequiredUsd: null,
    powerUnits: null,
    mcs150Date: null,
  });
  assert.deepEqual(evaluateCarrierProfile(empty, NOW), []);
  assert.deepEqual(diffCarrierProfiles(profile(), empty), []);
});

test("out-of-service, not allowed to operate and unsatisfactory rating are critical", () => {
  const codes = evaluateCarrierProfile(
    profile({ allowedToOperate: false, outOfServiceDate: "2026-10-01", safetyRating: "Unsatisfactory" }),
    NOW,
  ).map((row) => `${row.code}:${row.severity}`);
  assert.deepEqual(codes.sort(), [
    "NOT_ALLOWED_TO_OPERATE:CRITICAL",
    "OUT_OF_SERVICE_ORDER:CRITICAL",
    "UNSATISFACTORY_SAFETY_RATING:CRITICAL",
  ]);
});

test("insurance below required, inactive authority and stale MCS-150 are flagged", () => {
  const codes = evaluateCarrierProfile(
    profile({ bipdInsuranceOnFileUsd: 0, commonAuthority: "REVOKED", mcs150Date: "2024-06-01" }),
    NOW,
  ).map((row) => row.code);
  assert.deepEqual(codes.sort(), ["BIPD_INSURANCE_BELOW_REQUIRED", "MCS150_OUTDATED", "OPERATING_AUTHORITY_INACTIVE"]);
});

test("diff detects loss of operating permission and authority", () => {
  const alerts = diffCarrierProfiles(profile(), profile({ allowedToOperate: false, commonAuthority: "INACTIVE" }));
  assert.deepEqual(
    alerts.map((row) => `${row.code}:${row.severity}`),
    ["ALLOWED_TO_OPERATE_CHANGED:CRITICAL", "AUTHORITY_STATUS_CHANGED:HIGH"],
  );
});

test("diff detects rating, name and large fleet-size changes", () => {
  const alerts = diffCarrierProfiles(
    profile({ safetyRating: "Satisfactory" }),
    profile({ safetyRating: "Conditional", legalName: "New Name Inc", powerUnits: 30 }),
  );
  assert.deepEqual(alerts.map((row) => row.code), ["SAFETY_RATING_CHANGED", "LEGAL_NAME_CHANGED", "POWER_UNITS_CHANGED"]);
  assert.equal(alerts[0].severity, "HIGH");
});

test("diff refuses snapshots of different carriers", () => {
  assert.throws(() => diffCarrierProfiles(profile(), profile({ usdot: "1" })));
});

test("QCMobile profile maps documented elements and scales insurance from thousands", () => {
  const result = qcMobileCarrierProfile(
    {
      content: {
        carrier: {
          dotNumber: 1234567,
          legalName: "Example Freight LLC",
          statusCode: "A",
          allowedToOperate: "Y",
          commonAuthorityStatus: "A",
          contractAuthorityStatus: "N",
          brokerAuthorityStatus: "N",
          bipdInsuranceOnFile: "750",
          bipdRequiredAmount: "750",
          safetyRating: "S",
          totalPowerUnits: 10,
          totalDrivers: 12,
          mcs150Outdated: "N",
          oosDate: null,
        },
      },
    },
    NOW,
  );
  assert.equal(result?.bipdInsuranceOnFileUsd, 750_000);
  assert.equal(result?.commonAuthority, "ACTIVE");
  assert.equal(result?.contractAuthority, "NONE");
  assert.equal(result?.allowedToOperate, true);
  assert.equal(result?.mcs150Outdated, false);
  assert.deepEqual(evaluateCarrierProfile(result!, NOW), []);
});

test("date parsing accepts FMCSA formats", () => {
  assert.equal(toIsoDate("20260115"), "2026-01-15");
  assert.equal(toIsoDate("1/5/2026"), "2026-01-05");
  assert.equal(toIsoDate("2026-01-15T00:00:00.000"), "2026-01-15");
  assert.equal(toIsoDate("15-JAN-26"), "2026-01-15");
  assert.equal(toIsoDate("garbage"), null);
});

test("QCMobile 200 with empty content is NOT_FOUND, and 403 is an auth failure", async () => {
  const empty = new QcMobileFmcsaProvider("test-key", async () => new Response(JSON.stringify({ content: null }), { status: 200 }));
  assert.equal((await empty.lookup({ kind: "USDOT", value: "1" })).status, "NOT_FOUND");
  const forbidden = new QcMobileFmcsaProvider("test-key", async () => new Response("", { status: 403 }));
  const outcome = await forbidden.lookup({ kind: "USDOT", value: "1" });
  assert.equal(outcome.errorCode, "AUTH_FAILED");
  assert.equal(JSON.stringify(outcome).includes("test-key"), false);
});
