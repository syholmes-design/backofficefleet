/**
 * FMCSA activation check. Read-only; writes nothing to the database.
 *
 *   npx --yes tsx scripts/fmcsa-activation-check.ts            # configuration only
 *   npx --yes tsx scripts/fmcsa-activation-check.ts 1234567    # plus one live lookup per source
 *
 * Reports whether each variable is set, never its value. The QCMobile webKey
 * and the Socrata app token are not printed, logged or written anywhere.
 */
import { evaluateCarrierProfile } from "@/lib/services/fmcsa/carrierMonitoring";
import { missingQcMobileElements, qcMobileCarrierProfile } from "@/lib/services/fmcsa/carrierProfile";
import { deriveComplianceStatus } from "@/lib/services/fmcsa/complianceStatus";
import { fetchOpenDataCarrierProfiles } from "@/lib/services/fmcsa/openData/carrierSync";
import { validateOpenDataSchemas } from "@/lib/services/fmcsa/openData/schemaValidation";
import { createSodaClientFromEnv } from "@/lib/services/fmcsa/openData/sodaClient";
import { QcMobileFmcsaProvider } from "@/lib/services/fmcsa/qcmobileProvider";
import { FMCSA_QCMOBILE_BASE_URL } from "@/lib/services/fmcsa/types";

function present(name: string): boolean {
  return Boolean(process.env[name]?.trim());
}

async function main() {
  const usdot = process.argv[2]?.replace(/\D/g, "") || null;
  const mode = process.env.BOF_FMCSA_PROVIDER?.trim().toLowerCase() || "(unset)";
  console.log("FMCSA activation check");
  console.log(`  BOF_FMCSA_PROVIDER        ${mode}${mode === "qcmobile" ? "" : "  <- must be 'qcmobile' for live lookups"}`);
  console.log(`  FMCSA_QCMOBILE_WEBKEY     ${present("FMCSA_QCMOBILE_WEBKEY") ? "set" : "NOT SET"}`);
  console.log(`  FMCSA_SOCRATA_APP_TOKEN   ${present("FMCSA_SOCRATA_APP_TOKEN") ? "set" : "not set (optional; lower rate limits)"}`);
  console.log(`  BOF_FMCSA_CACHE_STALE_AFTER_MS ${process.env.BOF_FMCSA_CACHE_STALE_AFTER_MS?.trim() || "not set (cached results never go stale)"}`);

  if (!usdot) {
    console.log("\nPass a USDOT number to run one live lookup per source.");
    return;
  }

  const webKey = process.env.FMCSA_QCMOBILE_WEBKEY?.trim();
  let qcEvidence: Parameters<typeof deriveComplianceStatus>[0]["qcmobile"] = { configured: false, outcome: "SKIPPED", profile: null, missingElements: [] };
  if (webKey) {
    let raw: unknown = null;
    const provider = new QcMobileFmcsaProvider(webKey, async (input, init) => {
      const response = await fetch(input, init);
      raw = await response.clone().json().catch(() => null);
      return response;
    });
    const outcome = await provider.lookup({ kind: "USDOT", value: usdot });
    console.log(`\nQCMobile ${FMCSA_QCMOBILE_BASE_URL}${outcome.endpointUsed ?? ""}`);
    console.log(`  status ${outcome.status}${outcome.errorCode ? ` (${outcome.errorCode})` : ""}`);
    if (outcome.carrier) console.log(`  carrier ${outcome.carrier.legalName ?? "?"}  allowToOperate=${outcome.carrier.allowToOperate ?? "?"}`);
    const profile = raw ? qcMobileCarrierProfile(raw, new Date()) : null;
    const missing = outcome.status === "FOUND" ? missingQcMobileElements(outcome.rawCarrier) : [];
    if (missing.length) console.log(`  missing required elements: ${missing.join(", ")}`);
    if (outcome.rawCarrier) console.log(`  elements returned: ${Object.keys(outcome.rawCarrier).sort().join(", ")}`);
    qcEvidence = { configured: true, outcome: outcome.status, errorCode: outcome.errorCode ?? null, profile, missingElements: missing };
    if (profile) {
      console.log("  monitoring profile", JSON.stringify(profile));
      console.log("  alerts", JSON.stringify(evaluateCarrierProfile(profile)));
    }
  } else {
    console.log("\nQCMobile skipped: FMCSA_QCMOBILE_WEBKEY not set.");
  }

  const soda = createSodaClientFromEnv();
  const schema = await validateOpenDataSchemas(soda);
  console.log(`\nOpen-data schema validation: ${schema.trusted ? "TRUSTED" : "NOT TRUSTED"}`);
  for (const report of Object.values(schema.datasets)) {
    console.log(`  ${report.trusted ? "OK  " : "FAIL"} ${report.name} (${report.datasetId}) fields=${report.fieldsSource} age=${report.ageHours ?? "?"}h`);
    console.log(`       resolved ${JSON.stringify(report.resolved)}`);
    for (const issue of report.issues) console.log(`       issue: ${issue}`);
    // Compare with the alias lists in lib/services/fmcsa/openData/datasets.ts.
    console.log(`       live fields: ${report.liveFields.join(", ")}`);
    for (const column of report.officialColumns) console.log(`       official column: ${column.name} -> ${column.fieldName} :: ${(column.description ?? "").slice(0, 120)}`);
  }

  const result = await fetchOpenDataCarrierProfiles(soda, [usdot], schema);
  console.log("\nOpen data (data.transportation.gov)");
  for (const error of result.errors) console.log(`  ${error.dataset}: ${error.errorCode} ${error.errorMessage}`);
  console.log(`  coverage ${JSON.stringify(result.coverage[String(Number(usdot))] ?? null)}`);
  for (const profile of result.profiles) console.log("  monitoring profile", JSON.stringify(profile));
  const motusEvidence = result.motusEvidence[String(Number(usdot))] ?? null;
  if (motusEvidence) console.log("  motus authority rows", JSON.stringify(motusEvidence));

  const decision = deriveComplianceStatus({
    usdotNumber: String(Number(usdot)),
    qcmobile: qcEvidence,
    openData: {
      schemaTrusted: schema.trusted,
      schemaIssues: Object.values(schema.datasets).flatMap((d) => d.issues),
      coverage: result.coverage[String(Number(usdot))] ?? null,
      profile: result.profiles[0] ?? null,
      evidenceIssues: motusEvidence?.issues ?? [],
    },
  });
  console.log(`\nCompliance decision: ${decision.status}`);
  for (const reason of decision.reasons) console.log(`  - ${reason}`);
}

main().catch((error) => {
  console.error("activation check failed:", error instanceof Error ? error.message : "unknown error");
  process.exitCode = 1;
});
