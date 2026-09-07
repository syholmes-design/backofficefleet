import { getBofData } from "../lib/load-bof-data";
import { getCanonicalDispatchLoadState } from "../lib/dispatch/canonical-dispatch-operating-state";
import { existingSettlementWorkflowHref } from "../lib/load-file-proof-settlement-display";
import { listMaintenanceAssetSummaries } from "../lib/maintenance-data";
import { buildEquipmentCopilotAdvocateView } from "../lib/copilot/equipment-copilot-advocate-display";
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
const equipment = listMaintenanceAssetSummaries(data);
const oosOrHold = equipment.find((row) => row.readiness === "Out of Service" || row.readiness === "Blocked" || row.oos);
const ready = equipment.find((row) => row.readiness === "Ready" && !row.oos);
const assignedOos = equipment.find((row) => {
  if (!(row.readiness === "Out of Service" || row.readiness === "Blocked" || row.oos)) return false;
  return row.associated_loads.length > 0;
});
const assignedReady = equipment.find((row) => row.readiness === "Ready" && row.associated_loads.length > 0);

assert(equipment.length > 0, "Existing demo data must include maintenance asset summaries");

if (oosOrHold) {
  const view = buildEquipmentCopilotAdvocateView({ data, v3: null, scope: { assetId: oosOrHold.asset_id } });
  const fact = view.facts.find((row) => row.id.startsWith("fact-ready-"));
  const rec = view.guidance.find((row) => row.id.startsWith("rec-asset-"));
  assert(fact, "A: readiness fact missing");
  assert(rec, "A: equipment recommendation missing");
  assert(view.guidance.every((row) => row.executable === false), "A: recommendations must be non-executable");
  assert(!/assign (driver|unit|truck) /i.test(view.guidance.map((row) => row.recommendedAction).join(" ")), "A: must not assign named equipment or driver");
  logScenario("A OOS/hold equipment", fact!.source, fact!.fact, rec!.interpretation, rec!.recommendedAction, rec!.href);
  console.log("SCENARIO A PASS");
} else {
  console.log("SCENARIO A SKIP — no Out of Service / Blocked / oos asset in existing summaries; demo JSON was not modified");
}

if (ready) {
  const view = buildEquipmentCopilotAdvocateView({ data, v3: null, scope: { assetId: ready.asset_id } });
  const fact = view.facts.find((row) => row.id.startsWith("fact-ready-"));
  assert(fact && /Ready/.test(fact.fact), "B: Ready fact missing");
  assert(view.guidance.every((row) => row.executable === false), "B: recommendations must be non-executable");
  logScenario("B Ready equipment", fact!.source, fact!.fact, view.interpretations[0]?.text || "", view.guidance[0]?.recommendedAction || "", view.guidance[0]?.href || "");
  console.log("SCENARIO B PASS");
} else {
  console.log("SCENARIO B SKIP — no Ready asset in existing summaries");
}

if (assignedOos) {
  const view = buildEquipmentCopilotAdvocateView({ data, v3: null, scope: { assetId: assignedOos.asset_id } });
  const conflict = view.conflicts.find((row) => row.id.startsWith("conflict-assign-oos-"));
  assert(conflict, "C: assignment vs OOS/Blocked conflict missing");
  assert(conflict!.sources.length >= 2, "C: both sources required");
  logScenario("C assignment vs OOS", conflict!.sources.map((row) => row.authority).join(" vs "), conflict!.sources.map((row) => row.statement).join(" | "), conflict!.explanation, conflict!.resolutionLabel, conflict!.href || "");
  console.log("SCENARIO C PASS");
} else {
  console.log("SCENARIO C SKIP — no assigned load paired with OOS/Blocked equipment in existing summaries; demo JSON was not modified");
}

{
  const view = buildEquipmentCopilotAdvocateView({ data, v3: null, scope: { assetId: (oosOrHold || ready)!.asset_id } });
  const pm = view.facts.find((row) => row.id.startsWith("fact-pm-"));
  assert(pm, "D: PM/inspection label fact missing");
  if (/Not in BOF dataset/i.test(pm!.fact)) {
    assert(pm!.sourceClass === "UNSUPPORTED", "D: inspection placeholder must be UNSUPPORTED");
  }
  logScenario("D PM/inspection labels", pm!.source, pm!.fact, view.unsupported.find((row) => /PM calendar/i.test(row)) || "", view.guidance.find((row) => row.id.startsWith("rec-pm-"))?.recommendedAction || "none", "/maintenance/pm-inspections");
  console.log("SCENARIO D PASS");
}

{
  const missingId = "EQ-COPILOT-ABSENT-006";
  const view = buildEquipmentCopilotAdvocateView({ data, v3: null, scope: { assetId: missingId } });
  assert(view.facts.length === 0, "E: missing asset must not invent facts");
  assert(view.unsupported.some((row) => /honest empty/i.test(row)), "E: missing asset must report honest empty");
  logScenario("E missing asset honest empty", "UNSUPPORTED", view.unsupported[0], view.overview, "none", "");
  console.log("SCENARIO E PASS");
}

if (assignedReady || assignedOos) {
  const asset = assignedOos || assignedReady!;
  const load = asset.associated_loads[0];
  const state = getCanonicalDispatchLoadState(data, load.id);
  const view = buildEquipmentCopilotAdvocateView({ data, v3: null, scope: { assetId: asset.asset_id } });
  const rec = view.guidance.find((row) => row.id.startsWith("rec-settle-"));
  if (state?.driverId) {
    assert(rec, "F: settlement recommendation missing when assigned driver exists");
    const expected = existingSettlementWorkflowHref({ driverId: state.driverId, loadId: state.loadId });
    assert(rec!.href === expected, "F: settlement navigation must use existingSettlementWorkflowHref");
    logScenario("F settlement identity", rec!.source, rec!.fact, rec!.interpretation, rec!.recommendedAction, rec!.href);
    console.log("SCENARIO F PASS");
  } else {
    console.log("SCENARIO F SKIP — assigned load has no driverId");
  }
} else {
  console.log("SCENARIO F SKIP — no assigned equipment in existing summaries");
}

if (assignedOos || assignedReady) {
  const asset = assignedOos || assignedReady!;
  const state = getCanonicalDispatchLoadState(data, asset.associated_loads[0].id);
  const v3 = {
    safetyEvents: [
      {
        eventId: "QA-EQUIPMENT-BLOCK",
        driverId: state?.driverId || "",
        linkedLoadId: state?.loadId || "",
        dispatchBlock: true,
        rootCause: "Equipment-related safety hold recorded on driver/load",
      },
    ],
  } as V3OperationalData;
  const view = buildEquipmentCopilotAdvocateView({ data, v3, scope: { assetId: asset.asset_id } });
  const fact = view.facts.find((row) => row.id.startsWith("fact-safety-"));
  assert(fact, "G: safety dispatchBlock fact missing when workbook event joins driver/load");
  logScenario("G safety join", fact!.source, fact!.fact, view.guidance.find((row) => row.id.startsWith("rec-safety-"))?.interpretation || "", "Review Safety condition", view.guidance.find((row) => row.id.startsWith("rec-safety-"))?.href || "/safety");
  console.log("SCENARIO G PASS");
} else {
  console.log("SCENARIO G SKIP — no assigned equipment to join a safety event");
}

{
  const view = buildEquipmentCopilotAdvocateView({ data, v3: null, scope: { assetId: (oosOrHold || ready)!.asset_id } });
  assert(view.guidance.every((row) => row.claimClass === "RECOMMENDATION" && row.executable === false), "H: guidance is non-executable recommendation");
  assert(view.crossWorkflow.some((row) => row.relationship === "Equipment ↔ Load"), "H: load relationship required");
  assert(view.unsupported.some((row) => /V4 maintenance workbook/i.test(row)), "H: must report V4 workbook is not Copilot readiness authority");
  console.log("SCENARIO H PASS — read-only recommendations, V4 workbook not treated as a second engine");
}

console.log("EQUIPMENT COPILOT ADVOCATE VALIDATION COMPLETE");
