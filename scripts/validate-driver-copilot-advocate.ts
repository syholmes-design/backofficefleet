import { getBofData } from "../lib/load-bof-data";
import { getCanonicalDispatchLoadState } from "../lib/dispatch/canonical-dispatch-operating-state";
import { getDriverDispatchEligibility } from "../lib/driver-dispatch-eligibility";
import { getDriverById } from "../lib/driver-queries";
import { existingSettlementWorkflowHref } from "../lib/load-file-proof-settlement-display";
import { buildDriverCopilotAdvocateView } from "../lib/copilot/driver-copilot-advocate-display";
import type { V3OperationalData } from "../lib/v3-operational-types";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function logScenario(id: string, source: string, fact: string, interpretation: string, recommendation: string, workflow: string) {
  console.log(`SCENARIO ${id}`);
  console.log(`  SOURCE: ${source}`);
  console.log(`  FACT: ${fact}`);
  console.log(`  INTERPRETATION: ${interpretation}`);
  console.log(`  RECOMMENDATION: ${recommendation}`);
  console.log(`  WORKFLOW: ${workflow}`);
}

const data = getBofData();
const blockedDriver = data.drivers.find((row) => getDriverDispatchEligibility(data, row.id).status === "blocked");
const assignedDriver = data.drivers.find((row) => data.loads.some((load) => (load as { driverId?: string }).driverId === row.id));
const readyDriver = data.drivers.find((row) => getDriverDispatchEligibility(data, row.id).status === "ready");

assert(blockedDriver, "Existing demo data must include at least one blocked driver");

if (blockedDriver) {
  const view = buildDriverCopilotAdvocateView({ data, v3: null, scope: { driverId: blockedDriver.id } });
  const fact = view.facts.find((row) => row.id.startsWith("fact-elig-"));
  const rec = view.guidance.find((row) => row.id.startsWith("rec-elig-"));
  assert(fact, "A: eligibility fact missing");
  assert(rec, "A: eligibility recommendation missing");
  assert(view.guidance.every((row) => row.executable === false), "A: recommendations must be non-executable");
  assert(!/assign driver /i.test(view.guidance.map((row) => row.recommendedAction).join(" ")), "A: must not assign a named driver");
  logScenario("A blocked eligibility", fact!.source, fact!.fact, rec!.interpretation, rec!.recommendedAction, rec!.href);
  console.log("SCENARIO A PASS");
}

if (blockedDriver) {
  const view = buildDriverCopilotAdvocateView({ data, v3: null, scope: { driverId: blockedDriver.id } });
  const cred = view.facts.find((row) => row.id.startsWith("fact-cred-"));
  assert(cred, "B: credential fact missing");
  assert(cred!.sourceClass === "AUTHORITATIVE", "B: credentials must copy existing credential resolver");
  logScenario("B credentials", cred!.source, cred!.fact, view.interpretations[0]?.text || "", view.guidance[0]?.recommendedAction || "", view.guidance[0]?.href || "");
  console.log("SCENARIO B PASS");
}

if (assignedDriver) {
  const load = data.loads.find((row) => (row as { driverId?: string }).driverId === assignedDriver.id);
  const state = load ? getCanonicalDispatchLoadState(data, load.id) : null;
  const view = buildDriverCopilotAdvocateView({ data, v3: null, scope: { driverId: assignedDriver.id } });
  const fact = view.facts.find((row) => row.id.startsWith("fact-assign-"));
  assert(fact, "C: assignment fact missing for assigned demo driver");
  if (getDriverDispatchEligibility(data, assignedDriver.id).status === "blocked") {
    const conflict = view.conflicts.find((row) => row.id.startsWith("conflict-assign-elig-"));
    assert(conflict, "C: assignment vs eligibility conflict missing");
    assert(conflict!.sources.length >= 2, "C: both sources required");
  }
  assert(state, "C: canonical load state expected for assigned demo load");
  logScenario("C assignment vs eligibility", fact!.source, fact!.fact, view.conflicts[0]?.explanation || view.interpretations[0]?.text || "", view.conflicts[0]?.resolutionLabel || "none", view.conflicts[0]?.href || `/loads/${load?.id}`);
  console.log("SCENARIO C PASS");
} else {
  console.log("SCENARIO C SKIP — no assigned load.driverId in existing data");
}

{
  const view = buildDriverCopilotAdvocateView({ data, v3: null, scope: { driverId: blockedDriver!.id } });
  const rec = view.guidance.find((row) => row.id.startsWith("rec-settle-"));
  assert(rec, "D: settlement recommendation missing");
  const expected = existingSettlementWorkflowHref({ driverId: blockedDriver!.id });
  assert(rec!.href === expected, "D: settlement navigation must use existingSettlementWorkflowHref");
  assert(!rec!.href.includes(`/settlements/${blockedDriver!.id}`), "D: Driver ID must not be treated as Settlement ID path");
  logScenario("D settlement identity", rec!.source, rec!.fact, rec!.interpretation, rec!.recommendedAction, rec!.href);
  console.log("SCENARIO D PASS");
}

{
  const missingId = "DRV-COPILOT-ABSENT-005";
  assert(!getDriverById(data, missingId), "E: missing id must not exist in demo drivers");
  const view = buildDriverCopilotAdvocateView({ data, v3: null, scope: { driverId: missingId } });
  assert(view.facts.length === 0, "E: missing driver must not invent facts");
  assert(view.unsupported.some((row) => /honest empty/i.test(row)), "E: missing driver must report honest empty");
  logScenario("E missing driver honest empty", "UNSUPPORTED", view.unsupported[0], view.overview, "none", "");
  console.log("SCENARIO E PASS");
}

if (readyDriver) {
  const view = buildDriverCopilotAdvocateView({ data, v3: null, scope: { driverId: readyDriver.id } });
  const fact = view.facts.find((row) => row.id.startsWith("fact-elig-"));
  assert(fact && /ready/i.test(fact.fact), "F: ready eligibility fact missing");
  logScenario("F ready eligibility", fact!.source, fact!.fact, view.interpretations[0]?.text || "", view.guidance[0]?.recommendedAction || "", view.guidance[0]?.href || "");
  console.log("SCENARIO F PASS");
} else {
  console.log("SCENARIO F SKIP — no READY driver in existing getDriverDispatchEligibility results; demo JSON was not modified");
}

if (blockedDriver) {
  const v3 = {
    safetyEvents: [
      {
        eventId: "QA-DRIVER-BLOCK",
        driverId: blockedDriver.id,
        linkedLoadId: assignedDriver ? String(data.loads.find((row) => (row as { driverId?: string }).driverId === assignedDriver.id)?.id ?? "") : "",
        dispatchBlock: true,
        rootCause: "HOS coaching and driver acknowledgment incomplete",
      },
    ],
  } as V3OperationalData;
  const view = buildDriverCopilotAdvocateView({ data, v3, scope: { driverId: blockedDriver.id } });
  const fact = view.facts.find((row) => row.id.startsWith("fact-safety-"));
  assert(fact, "G: safety dispatchBlock fact missing when workbook event is in scope");
  assert(view.guidance.some((row) => row.href.endsWith("/safety")) || view.guidance.some((row) => row.id.startsWith("rec-safety-")), "G: safety CTA missing");
  logScenario("G safety dispatchBlock", fact!.source, fact!.fact, view.guidance.find((row) => row.id.startsWith("rec-safety-"))?.interpretation || "", "Review Safety condition", `/drivers/${blockedDriver.id}/safety`);
  console.log("SCENARIO G PASS");
}

{
  const view = buildDriverCopilotAdvocateView({ data, v3: null, scope: { driverId: blockedDriver!.id } });
  assert(view.guidance.every((row) => row.claimClass === "RECOMMENDATION" && row.executable === false), "H: guidance is non-executable recommendation");
  assert(view.crossWorkflow.some((row) => row.relationship === "Driver ↔ Settlement"), "H: settlement relationship required");
  assert(view.crossWorkflow.some((row) => row.relationship === "Driver ↔ Process Intelligence"), "H: PI relationship required");
  console.log("SCENARIO H PASS — read-only recommendations and cross-workflow notes");
}

console.log("DRIVER COPILOT ADVOCATE VALIDATION COMPLETE");
