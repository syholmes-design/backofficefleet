import assert from "node:assert/strict";
import test from "node:test";

import { identityFieldErrors } from "@/lib/services/fmcsa/carrierIdentity";
import { deriveComplianceStatus } from "@/lib/services/fmcsa/complianceStatus";
import { fetchOpenDataCarrierProfiles } from "@/lib/services/fmcsa/openData/carrierSync";
import { FMCSA_DATASETS } from "@/lib/services/fmcsa/openData/datasets";
import { probeDatasetSchema, validateOpenDataSchemas } from "@/lib/services/fmcsa/openData/schemaValidation";
import { SodaClient } from "@/lib/services/fmcsa/openData/sodaClient";
import { fmcsaFetchDouble, LEGACY_MOTUS_ASSUMED_COLUMNS, MOTUS_COLUMNS, motusRows, type DoubleOptions } from "@/lib/services/fmcsa/openData/sodaTestDouble";

const MOTUS = FMCSA_DATASETS.MOTUS_CARRIER.id;
const CENSUS = FMCSA_DATASETS.COMPANY_CENSUS.id;
const USDOT = "80806";

const censusRow = { dot_number: USDOT, legal_name: "Example Carrier Inc", status_code: "A", mcs150_date: "20260301", power_units: "100" };

async function run(options: DoubleOptions) {
  const client = new SodaClient(null, fmcsaFetchDouble(options));
  const schema = await validateOpenDataSchemas(client);
  const sync = await fetchOpenDataCarrierProfiles(client, [USDOT], schema);
  const decision = deriveComplianceStatus({
    usdotNumber: USDOT,
    qcmobile: { configured: false, outcome: "SKIPPED", profile: null, missingElements: [] },
    openData: {
      schemaTrusted: schema.trusted,
      schemaIssues: Object.values(schema.datasets).flatMap((d) => d.issues),
      coverage: sync.coverage[USDOT] ?? null,
      profile: sync.profiles[0] ?? null,
      evidenceIssues: sync.motusEvidence[USDOT]?.issues ?? [],
    },
  });
  return { schema, sync, decision };
}

test("regression: the live Motus layout no longer has the legacy columns BOF assumed", async () => {
  // What the Preview reported on 2026-10-17: commonAuthority and bipdRequired missing.
  const legacy = await probeDatasetSchema(new SodaClient(null, fmcsaFetchDouble({ columns: { [MOTUS]: LEGACY_MOTUS_ASSUMED_COLUMNS } })), "MOTUS_CARRIER");
  assert.equal(legacy.trusted, false);
  assert.deepEqual(legacy.missingRequired.sort(), ["bipdRequired", "opAuthStatus", "opAuthType"]);

  const live = await probeDatasetSchema(new SodaClient(null, fmcsaFetchDouble()), "MOTUS_CARRIER");
  assert.equal(live.trusted, true, live.issues.join("; "));
  assert.deepEqual(live.resolved, {
    usdot: "dot_number",
    opAuthType: "op_auth_type",
    opAuthStatus: "op_auth_status",
    bipdRequired: "min_cov_amount",
    bipdOnFile: "bipd_file",
    docketNumber: "docket_number",
    legalName: "legal_name",
  });
  assert.equal(live.fieldResolution.opAuthStatus?.verifiedBy, "OFFICIAL_METADATA");
  assert.equal(live.fieldResolution.opAuthStatus?.officialName, "OP_AUTH_STATUS");
});

test("mapping uses the API field name FMCSA assigns, not a guess from the display name", async () => {
  const renamed = MOTUS_COLUMNS.map((c) => (c.name === "OP_AUTH_TYPE" ? { ...c, fieldName: "mod_col_1" } : c));
  const rows = motusRows(USDOT).map(({ op_auth_type, ...rest }) => ({ ...rest, mod_col_1: op_auth_type }));
  const { schema, decision } = await run({ columns: { [MOTUS]: renamed }, rows: { [CENSUS]: [censusRow], [MOTUS]: rows } });
  assert.equal(schema.datasets.MOTUS_CARRIER.resolved.opAuthType, "mod_col_1");
  assert.equal(decision.status, "CLEAR");
});

test("authority fields require official metadata: field-name matches alone are not trusted", async () => {
  const report = await probeDatasetSchema(new SodaClient(null, fmcsaFetchDouble({ metadataStatus: 503 })), "MOTUS_CARRIER");
  assert.equal(report.trusted, false);
  assert.ok(report.issues.some((i) => i.includes("requires confirmation from FMCSA column metadata")));
  // Census / OOS do not need metadata and still validate from the field list.
  const census = await probeDatasetSchema(new SodaClient(null, fmcsaFetchDouble({ metadataStatus: 503 })), "COMPANY_CENSUS");
  assert.equal(census.trusted, true);
});

test("a column named in metadata but not served by the API is not trusted", async () => {
  const served = MOTUS_COLUMNS.map((c) => c.fieldName).filter((f) => f !== "min_cov_amount");
  const report = await probeDatasetSchema(new SodaClient(null, fmcsaFetchDouble({ servedFields: { [MOTUS]: served } })), "MOTUS_CARRIER");
  assert.equal(report.trusted, false);
  assert.ok(report.issues.some((i) => i.includes("not served by the API")));
});

test("corrected mapping: active common authority with sufficient BI&PD is CLEAR", async () => {
  const { decision, sync } = await run({ rows: { [CENSUS]: [censusRow], [MOTUS]: motusRows(USDOT) } });
  assert.equal(decision.status, "CLEAR", decision.reasons.join(" | "));
  const profile = sync.profiles[0];
  assert.equal(profile.commonAuthority, "ACTIVE");
  assert.equal(profile.contractAuthority, "INACTIVE");
  assert.equal(profile.brokerAuthority, "ACTIVE");
  assert.equal(profile.bipdInsuranceRequiredUsd, 750);
  assert.equal(profile.bipdInsuranceOnFileUsd, 5000);
  assert.equal(profile.insuranceAmountUnit, "FMCSA_PUBLISHED");
});

test("unrecognized authority values keep the carrier UNVERIFIED and are reported", async () => {
  const rows = motusRows(USDOT).map((r) => ({ ...r, op_auth_type: r.op_auth_type === "COMMON" ? "C" : r.op_auth_type }));
  const { decision, sync } = await run({ rows: { [CENSUS]: [censusRow], [MOTUS]: rows } });
  assert.equal(decision.status, "UNVERIFIED");
  assert.equal(sync.profiles[0].commonAuthority, null);
  assert.deepEqual(sync.motusEvidence[USDOT].unrecognizedTypes, ["C"]);
  assert.ok(decision.reasons.some((r) => r.includes("Unrecognized OP_AUTH_TYPE value(s): C")));
});

test("insurance figures in apparently different units are not compared (no false alert, no CLEAR)", async () => {
  const rows = motusRows(USDOT, [{ dot_number: USDOT, op_auth_type: "COMMON", op_auth_status: "ACTIVE", min_cov_amount: "750000", bipd_file: "750" }]);
  const { decision, sync } = await run({ rows: { [CENSUS]: [censusRow], [MOTUS]: rows } });
  assert.equal(decision.status, "UNVERIFIED");
  assert.equal(decision.alerts.length, 0);
  assert.ok(sync.motusEvidence[USDOT].insuranceIssue?.includes("different units"));
});

test("no active authority leaves insurance undetermined: UNVERIFIED", async () => {
  const rows = motusRows(USDOT, [{ dot_number: USDOT, op_auth_type: "COMMON", op_auth_status: "INACTIVE", min_cov_amount: "750", bipd_file: "0" }]);
  const { decision } = await run({ rows: { [CENSUS]: [censusRow], [MOTUS]: rows } });
  // Inactive common authority is itself an alert.
  assert.equal(decision.status, "ATTENTION");
  assert.ok(decision.reasons.some((r) => r.includes("No active authority rows")));
});

test("insurance below the published minimum raises ATTENTION with FMCSA units", async () => {
  const rows = motusRows(USDOT, [{ dot_number: USDOT, op_auth_type: "COMMON", op_auth_status: "ACTIVE", min_cov_amount: "750", bipd_file: "300" }]);
  const { decision } = await run({ rows: { [CENSUS]: [censusRow], [MOTUS]: rows } });
  assert.equal(decision.status, "ATTENTION");
  assert.ok(decision.alerts.some((a) => a.code === "BIPD_INSURANCE_BELOW_REQUIRED" && a.message.includes("as published by FMCSA")));
});

test("carrier not in Motus (e.g. no operating authority) stays UNVERIFIED", async () => {
  const { decision } = await run({ rows: { [CENSUS]: [censusRow] } });
  assert.equal(decision.status, "UNVERIFIED");
  assert.ok(decision.reasons.some((r) => r.includes("carrier not found")));
});

test("identity form: field-level errors match the server rules", () => {
  assert.deepEqual(identityFieldErrors({ usdotNumber: "80806", mcNumber: "MC135797" }), {});
  assert.deepEqual(identityFieldErrors({ usdotNumber: "", mcNumber: "" }), {});
  const errors = identityFieldErrors({ usdotNumber: "8080x", mcNumber: "135797" });
  assert.match(errors.usdotNumber ?? "", /USDOT number/);
  assert.match(errors.mcNumber ?? "", /Docket/);
});
