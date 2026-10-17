import assert from "node:assert/strict";
import test from "node:test";

import type { FmcsaCarrierProfile } from "@/lib/services/fmcsa/carrierProfile";
import { missingQcMobileElements } from "@/lib/services/fmcsa/carrierProfile";
import { deriveComplianceStatus, effectiveStatus, type OpenDataEvidence, type QcMobileEvidence } from "@/lib/services/fmcsa/complianceStatus";
import { fetchOpenDataCarrierProfiles } from "@/lib/services/fmcsa/openData/carrierSync";
import { FMCSA_DATASETS } from "@/lib/services/fmcsa/openData/datasets";
import { probeDatasetSchema, validateOpenDataSchemas } from "@/lib/services/fmcsa/openData/schemaValidation";
import { SodaClient } from "@/lib/services/fmcsa/openData/sodaClient";
import { fmcsaFetchDouble } from "@/lib/services/fmcsa/openData/sodaTestDouble";
import { normalizeDocketInput, normalizeUsdotInput, schedulingState } from "@/lib/services/fmcsa/monitoringService";
import { isAuthorizedMonitoringToken } from "@/lib/services/fmcsa/routeSupport";

const NOW = new Date("2026-10-17T12:00:00Z");

function profile(overrides: Partial<FmcsaCarrierProfile> = {}): FmcsaCarrierProfile {
  return {
    source: "OPEN_DATA",
    usdot: "1234567",
    legalName: "Example Freight LLC",
    dbaName: null,
    usdotStatus: "A",
    allowedToOperate: null,
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

const COMPLETE_OD: OpenDataEvidence = {
  schemaTrusted: true,
  schemaIssues: [],
  coverage: { census: "FOUND", motus: "FOUND", outOfServiceOrders: "QUERIED" },
  profile: profile(),
};
const QC_OFF: QcMobileEvidence = { configured: false, outcome: "SKIPPED", profile: null, missingElements: [] };
const QC_OK: QcMobileEvidence = {
  configured: true,
  outcome: "FOUND",
  profile: profile({ source: "QCMOBILE", allowedToOperate: true }),
  missingElements: [],
};

test("CLEAR requires complete evidence and no alerts", () => {
  assert.equal(deriveComplianceStatus({ usdotNumber: "1234567", qcmobile: QC_OFF, openData: COMPLETE_OD, now: NOW }).status, "CLEAR");
  assert.equal(deriveComplianceStatus({ usdotNumber: "1234567", qcmobile: QC_OK, openData: null, now: NOW }).status, "CLEAR");
});

test("no USDOT is NOT_CONFIGURED, never CLEAR", () => {
  assert.equal(deriveComplianceStatus({ usdotNumber: null, qcmobile: QC_OK, openData: COMPLETE_OD }).status, "NOT_CONFIGURED");
});

test("false-clearance guard: every evidence gap yields UNVERIFIED", () => {
  const cases: Array<[string, Partial<OpenDataEvidence>]> = [
    ["schema not validated", { schemaTrusted: false, schemaIssues: ["Required fields not found"] }],
    ["census not found", { coverage: { census: "NOT_FOUND", motus: "FOUND", outOfServiceOrders: "QUERIED" } }],
    ["motus query failed", { coverage: { census: "FOUND", motus: "ERROR", outOfServiceOrders: "QUERIED" } }],
    ["OOS query failed", { coverage: { census: "FOUND", motus: "FOUND", outOfServiceOrders: "ERROR" } }],
    ["no coverage", { coverage: null }],
    ["no profile", { profile: null }],
    ["USDOT status missing", { profile: profile({ usdotStatus: null }) }],
    ["authority missing", { profile: profile({ commonAuthority: null }) }],
    ["insurance missing", { profile: profile({ bipdInsuranceOnFileUsd: null }) }],
    ["USDOT status not active", { profile: profile({ usdotStatus: "X" }) }],
  ];
  for (const [label, override] of cases) {
    const decision = deriveComplianceStatus({ usdotNumber: "1234567", qcmobile: QC_OFF, openData: { ...COMPLETE_OD, ...override }, now: NOW });
    assert.equal(decision.status, "UNVERIFIED", label);
    assert.ok(decision.reasons.length > 1, `${label}: reasons disclosed`);
  }
});

test("QCMobile gaps yield UNVERIFIED when it is the only source", () => {
  for (const qc of [
    { ...QC_OK, outcome: "NOT_FOUND" as const, profile: null },
    { ...QC_OK, outcome: "ERROR" as const, errorCode: "TIMEOUT", profile: null },
    { ...QC_OK, outcome: "UNAVAILABLE" as const, errorCode: "AUTH_FAILED", profile: null },
    { ...QC_OK, missingElements: ["allowedToOperate"] },
  ]) {
    assert.equal(deriveComplianceStatus({ usdotNumber: "1234567", qcmobile: qc, openData: null, now: NOW }).status, "UNVERIFIED");
  }
});

test("alerts from any source win, even if the other source is complete", () => {
  const critical = deriveComplianceStatus({
    usdotNumber: "1234567",
    qcmobile: { ...QC_OK, profile: profile({ source: "QCMOBILE", allowedToOperate: false }) },
    openData: COMPLETE_OD,
    now: NOW,
  });
  assert.equal(critical.status, "CRITICAL");
  const attention = deriveComplianceStatus({
    usdotNumber: "1234567",
    qcmobile: QC_OFF,
    openData: { ...COMPLETE_OD, profile: profile({ bipdInsuranceOnFileUsd: 0 }) },
    now: NOW,
  });
  assert.equal(attention.status, "ATTENTION");
  // Alerts are raised even from incomplete or unvalidated evidence.
  const unvalidated = deriveComplianceStatus({
    usdotNumber: "1234567",
    qcmobile: QC_OFF,
    openData: { ...COMPLETE_OD, schemaTrusted: false, profile: profile({ outOfServiceDate: "2026-10-01", allowedToOperate: false }) },
    now: NOW,
  });
  assert.equal(unvalidated.status, "CRITICAL");
  assert.ok(unvalidated.reasons.some((r) => r.includes("not validated")));
});

test("serious changes since the last snapshot block CLEAR; minor ones do not", () => {
  const lost = deriveComplianceStatus({
    usdotNumber: "1234567",
    qcmobile: QC_OFF,
    openData: { ...COMPLETE_OD, profile: profile({ commonAuthority: "NONE" }) },
    previous: { openData: profile() },
    now: NOW,
  });
  assert.equal(lost.status, "ATTENTION");
  const minor = deriveComplianceStatus({
    usdotNumber: "1234567",
    qcmobile: QC_OFF,
    openData: { ...COMPLETE_OD, profile: profile({ powerUnits: 40 }) },
    previous: { openData: profile() },
    now: NOW,
  });
  assert.equal(minor.status, "CLEAR");
  assert.equal(minor.changeAlerts[0].code, "POWER_UNITS_CHANGED");
});

test("an old CLEAR is presented as UNVERIFIED", () => {
  assert.deepEqual(effectiveStatus("CLEAR", new Date("2026-10-15T00:00:00Z"), NOW, 36), { status: "UNVERIFIED", stale: true });
  assert.deepEqual(effectiveStatus("CLEAR", new Date("2026-10-17T00:00:00Z"), NOW, 36), { status: "CLEAR", stale: false });
  assert.deepEqual(effectiveStatus("CRITICAL", new Date("2026-01-01T00:00:00Z"), NOW, 36), { status: "CRITICAL", stale: true });
});

test("QCMobile required elements are checked", () => {
  assert.deepEqual(missingQcMobileElements(null).length, 6);
  assert.deepEqual(
    missingQcMobileElements({ dotNumber: 1, allowedToOperate: "Y", statusCode: "A", commonAuthorityStatus: "A", bipdInsuranceOnFile: "0", bipdRequiredAmount: "750" }),
    [],
  );
  assert.deepEqual(missingQcMobileElements({ dotNumber: 1, allowToOperate: "Y" }), ["statusCode", "commonAuthorityStatus", "bipdInsuranceOnFile", "bipdRequiredAmount"]);
});

// ── Schema validation ──────────────────────────────────────────────────────

function sodaMock(options: { fields?: Record<string, string[] | null>; lastModified?: string | null; rows?: Record<string, unknown[]> } = {}) {
  // Field-list overrides become served-field overrides on the shared FMCSA double.
  return fmcsaFetchDouble({ servedFields: options.fields, lastModified: options.lastModified, rows: options.rows });
}

test("schema validation resolves live columns from the field header", async () => {
  const report = await validateOpenDataSchemas(new SodaClient(null, sodaMock()), NOW);
  assert.equal(report.trusted, true);
  assert.equal(report.datasets.MOTUS_CARRIER.resolved.bipdOnFile, "bipd_file");
  assert.equal(report.datasets.MOTUS_CARRIER.resolved.bipdRequired, "min_cov_amount");
  assert.equal(report.datasets.COMPANY_CENSUS.fieldsSource, "HEADER");
});

test("schema validation fails closed on missing columns, unknown or stale freshness", async () => {
  const missing = await probeDatasetSchema(
    new SodaClient(null, sodaMock({ fields: { [FMCSA_DATASETS.MOTUS_CARRIER.id]: ["dot_number", "op_auth_type", "op_auth_status"] } })),
    "MOTUS_CARRIER",
    NOW,
  );
  assert.equal(missing.trusted, false);
  assert.deepEqual(missing.missingRequired, ["bipdRequired", "bipdOnFile"]);

  // No Last-Modified header and no official metadata: freshness unknown.
  const unknownAge = await probeDatasetSchema(new SodaClient(null, fmcsaFetchDouble({ lastModified: null, metadataStatus: 503 })), "COMPANY_CENSUS", NOW);
  assert.equal(unknownAge.trusted, false);
  assert.ok(unknownAge.issues.some((issue) => issue.includes("freshness unknown")));

  // The header missing but official metadata present: metadata rowsUpdatedAt is used.
  const fromMetadata = await probeDatasetSchema(new SodaClient(null, fmcsaFetchDouble({ lastModified: null })), "COMPANY_CENSUS");
  assert.equal(fromMetadata.fresh, true);

  const stale = await probeDatasetSchema(new SodaClient(null, sodaMock({ lastModified: "Mon, 05 Oct 2026 00:00:00 GMT" })), "COMPANY_CENSUS", NOW);
  assert.equal(stale.trusted, false);

  const down = await probeDatasetSchema(new SodaClient(null, (async () => new Response("", { status: 503 })) as typeof fetch), "COMPANY_CENSUS", NOW);
  assert.equal(down.trusted, false);
  assert.equal(down.errorCode, "HTTP_503");
});

test("sync with a validated schema reads only the resolved columns and reports coverage", async () => {
  const fetchImpl = sodaMock({
    rows: {
      [FMCSA_DATASETS.COMPANY_CENSUS.id]: [{ dot_number: "1234567", legal_name: "Example Freight LLC", status_code: "A", mcs150_date: "20260115" }],
      [FMCSA_DATASETS.MOTUS_CARRIER.id]: [{ dot_number: "1234567", op_auth_type: "COMMON", op_auth_status: "ACTIVE", min_cov_amount: "750", bipd_file: "1000" }],
    },
  });
  const client = new SodaClient(null, fetchImpl);
  const schema = await validateOpenDataSchemas(client, NOW);
  const result = await fetchOpenDataCarrierProfiles(client, ["1234567", "999"], schema);
  assert.deepEqual(result.coverage["1234567"], { census: "FOUND", motus: "FOUND", outOfServiceOrders: "QUERIED" });
  assert.deepEqual(result.coverage["999"], { census: "NOT_FOUND", motus: "NOT_FOUND", outOfServiceOrders: "QUERIED" });
  const decision = deriveComplianceStatus({
    usdotNumber: "1234567",
    qcmobile: QC_OFF,
    openData: { schemaTrusted: schema.trusted, schemaIssues: [], coverage: result.coverage["1234567"], profile: result.profiles[0] },
    now: NOW,
  });
  assert.equal(decision.status, "CLEAR");
  const unknown = deriveComplianceStatus({
    usdotNumber: "999",
    qcmobile: QC_OFF,
    openData: { schemaTrusted: true, schemaIssues: [], coverage: result.coverage["999"], profile: null },
    now: NOW,
  });
  assert.equal(unknown.status, "UNVERIFIED");
});

test("a dataset whose USDOT column is unresolved is reported as an error, not as 'not found'", async () => {
  const client = new SodaClient(null, sodaMock({ fields: { [FMCSA_DATASETS.OUT_OF_SERVICE_ORDERS.id]: ["carrier_id", "oos_date"] } }));
  const schema = await validateOpenDataSchemas(client, NOW);
  const result = await fetchOpenDataCarrierProfiles(client, ["1234567"], schema);
  assert.equal(result.coverage["1234567"].outOfServiceOrders, "ERROR");
  assert.ok(result.errors.some((e) => e.errorCode === "SCHEMA_UNRESOLVED"));
});

// ── Identity, token and scheduling guards ──────────────────────────────────

test("carrier identity input is normalized and validated", () => {
  assert.equal(normalizeUsdotInput("USDOT 0012345"), "12345");
  assert.equal(normalizeUsdotInput(""), null);
  assert.throws(() => normalizeUsdotInput("12a45"));
  assert.throws(() => normalizeUsdotInput("0"));
  assert.throws(() => normalizeUsdotInput("123456789"));
  assert.equal(normalizeDocketInput("mc-012345"), "MC12345");
  assert.equal(normalizeDocketInput(null), null);
  assert.throws(() => normalizeDocketInput("12345"));
});

test("monitoring token: required length, constant-time match, CRON_SECRET accepted", () => {
  const request = (token: string) => new Request("https://x/api", { headers: { authorization: `Bearer ${token}` } });
  const env = { FMCSA_MONITORING_TOKEN: "a".repeat(32) };
  assert.equal(isAuthorizedMonitoringToken(request("a".repeat(32)), env), true);
  assert.equal(isAuthorizedMonitoringToken(request("b".repeat(32)), env), false);
  assert.equal(isAuthorizedMonitoringToken(request("short"), { FMCSA_MONITORING_TOKEN: "short" }), false);
  assert.equal(isAuthorizedMonitoringToken(request("c".repeat(20)), { CRON_SECRET: "c".repeat(20) }), true);
  assert.equal(isAuthorizedMonitoringToken(new Request("https://x/api"), env), false);
});

test("scheduled runs are refused in production even when enabled", () => {
  assert.equal(schedulingState({ FMCSA_MONITORING_SCHEDULE_ENABLED: "true", VERCEL_ENV: "production" }).enabled, false);
  assert.equal(schedulingState({ FMCSA_MONITORING_SCHEDULE_ENABLED: "true", VERCEL_ENV: "preview" }).enabled, true);
  assert.equal(schedulingState({ VERCEL_ENV: "preview" }).enabled, false);
});
