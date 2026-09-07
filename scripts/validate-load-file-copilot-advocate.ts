import { getBofData } from "../lib/load-bof-data";
import { getCanonicalDispatchLoadState } from "../lib/dispatch/canonical-dispatch-operating-state";
import { existingSettlementWorkflowHref } from "../lib/load-file-proof-settlement-display";
import { getLoadProofItems, getLoadProofSummary } from "../lib/load-proof";
import { buildLoadFileCopilotAdvocateView } from "../lib/copilot/load-file-copilot-advocate-display";
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
const states = data.loads
  .map((load) => getCanonicalDispatchLoadState(data, load.id))
  .filter((row): row is NonNullable<typeof row> => Boolean(row));

const blockerState = states.find((row) => row.blockers.length > 0 && row.releaseDisposition !== "RELEASED");
const settlementState = states.find((row) => row.settlementHold);
const proofGapState = states.find((row) => {
  const items = getLoadProofItems(data, row.loadId);
  return getLoadProofSummary(items).blockingCount > 0 || items.some((item) => item.status === "Missing" || item.status === "Disputed");
});
const assignedState = states.find((row) => row.assigned && row.driverId);
const customerState = states.find((row) => {
  const load = data.loads.find((item) => item.id === row.loadId) as { customerName?: string } | undefined;
  return Boolean(load?.customerName?.trim());
});

assert(blockerState || settlementState || assignedState, "Existing demo data must include at least one canonical Load File state");

if (assignedState) {
  const view = buildLoadFileCopilotAdvocateView({ data, v3: null, scope: { loadId: assignedState.loadId } });
  const fact = view.facts.find((row) => row.id.startsWith("fact-ready-") || row.id.startsWith("fact-proof-sum-"));
  assert(fact, "A: readiness/proof fact missing");
  assert(view.guidance.every((row) => row.executable === false), "A: recommendations must be non-executable");
  assert(!/assign driver /i.test(view.guidance.map((row) => row.recommendedAction).join(" ")), "A: must not assign a named driver");
  assert(view.guidance.some((row) => row.href.includes("#process-intelligence")), "A: Process Intelligence must map to existing Load File hash");
  logScenario(
    "A populated Load File",
    fact!.source,
    fact!.fact,
    view.interpretations[0]?.text || view.decisionSupport?.[0]?.text || "none",
    view.guidance[0]?.recommendedAction || "none",
    view.guidance[0]?.href || "",
  );
  console.log("SCENARIO A PASS");
} else {
  console.log("SCENARIO A SKIP — no assigned canonical load in existing data");
}

if (blockerState) {
  const view = buildLoadFileCopilotAdvocateView({ data, v3: null, scope: { loadId: blockerState.loadId } });
  const fact = view.facts.find((row) => row.id.startsWith("fact-blocker-") || row.id.startsWith("fact-ready-"));
  const rec = view.guidance.find((row) => row.id.startsWith("rec-blocker-"));
  assert(fact, "B: blocker/readiness fact missing");
  assert(rec, "B: blocker recommendation missing");
  assert(fact!.causeClass !== "RECORDED_CAUSE" || Boolean(blockerState.blockers[0]?.detail), "B: recorded cause only from blocker detail");
  logScenario("B Load File blocker", fact!.source, fact!.fact, rec!.interpretation, rec!.recommendedAction, rec!.href);
  console.log("SCENARIO B PASS");
} else {
  throw new Error("SCENARIO B FAIL — expected at least one canonical blocker in existing data");
}

if (proofGapState) {
  const view = buildLoadFileCopilotAdvocateView({ data, v3: null, scope: { loadId: proofGapState.loadId } });
  const fact = view.facts.find((row) => row.id.startsWith("fact-proof-"));
  assert(fact, "C: proof fact missing");
  assert(fact!.sourceClass === "DERIVED", "C: proof summary/lines are derived presentation, not a new proof engine");
  logScenario("C Load File proof gap", fact!.source, fact!.fact, view.interpretations[0]?.text || "derived", view.guidance.find((row) => /proof/i.test(row.workflow + row.recommendedAction))?.recommendedAction || view.guidance[0]?.recommendedAction || "none", view.guidance[0]?.href || "");
  console.log("SCENARIO C PASS");
} else {
  console.log("SCENARIO C SKIP — no blocking/missing/disputed proof lines in existing data");
}

if (settlementState) {
  const view = buildLoadFileCopilotAdvocateView({ data, v3: null, scope: { loadId: settlementState.loadId } });
  const fact = view.facts.find((row) => row.id.startsWith("fact-settle-"));
  const settleRec = view.guidance.find((row) => row.id.startsWith("rec-settle-"));
  const settleConflict = view.conflicts.find((row) => row.id.startsWith("conflict-settle-release-"));
  assert(fact, "D: settlementHold fact missing");
  assert(settleRec || settleConflict, "D: settlement relevance missing");
  const href = settleRec?.href || settleConflict?.href || "";
  const expected = existingSettlementWorkflowHref({ driverId: settlementState.driverId, loadId: settlementState.loadId });
  if (href) assert(href === expected || href.startsWith("/settlements"), "D: settlement navigation must use existing settlements workflow");
  assert(!href.includes(`/settlements/${settlementState.loadId}`), "D: Load ID must not be treated as Settlement ID path");
  logScenario(
    "D settlement relevance",
    fact!.source,
    fact!.fact,
    settleRec?.interpretation || settleConflict?.explanation || "",
    settleRec?.recommendedAction || settleConflict?.resolutionLabel || "",
    href || expected,
  );
  console.log("SCENARIO D PASS");
} else {
  console.log("SCENARIO D SKIP — no settlementHold in existing canonical loads");
}

{
  const missingId = "PI-TEST-ABSENT-LOAD-FILE";
  const view = buildLoadFileCopilotAdvocateView({ data, v3: null, scope: { loadId: missingId } });
  assert(view.facts.length === 0, "E: missing load must not invent facts");
  assert(view.unsupported.some((row) => /honest empty/i.test(row)), "E: missing load must report honest empty");
  logScenario("E missing load honest empty", "UNSUPPORTED", view.unsupported[0], view.overview, "none", "");
  console.log("SCENARIO E PASS");
}

if (customerState) {
  const load = data.loads.find((item) => item.id === customerState.loadId) as { customerName?: string };
  const view = buildLoadFileCopilotAdvocateView({ data, v3: null, scope: { loadId: customerState.loadId } });
  const fact = view.facts.find((row) => row.id.startsWith("fact-customer-"));
  assert(fact, "F: recorded customerName should surface");
  assert(fact!.fact.includes(load.customerName!.trim()), "F: customer fact must copy recorded name");
  logScenario("F recorded customer", fact!.source, fact!.fact, view.crossWorkflow.find((row) => row.relationship === "Load ↔ Customer")?.note || "", view.guidance.find((row) => row.id.startsWith("rec-customer-"))?.recommendedAction || "none", "/customer-portal");
  console.log("SCENARIO F PASS");
} else {
  console.log("SCENARIO F SKIP — no recorded customerName on existing loads");
}

if (assignedState) {
  const v3 = {
    safetyEvents: [
      {
        eventId: "QA-LOAD-FILE-BLOCK",
        driverId: assignedState.driverId,
        linkedLoadId: assignedState.loadId,
        dispatchBlock: true,
        rootCause: "HOS coaching and driver acknowledgment incomplete",
      },
    ],
  } as V3OperationalData;
  const view = buildLoadFileCopilotAdvocateView({ data, v3, scope: { loadId: assignedState.loadId } });
  const fact = view.facts.find((row) => row.id.startsWith("fact-safety-block-"));
  assert(fact, "G: safety dispatchBlock fact missing when workbook event is in scope");
  assert(view.conflicts.length > 0 || view.guidance.some((row) => row.id.startsWith("rec-safety-")), "G: safety impact must surface as conflict or recommendation");
  logScenario("G safety dispatchBlock", fact!.source, fact!.fact, view.conflicts[0]?.explanation || view.guidance.find((row) => row.id.startsWith("rec-safety-"))?.interpretation || "", view.conflicts[0]?.resolutionLabel || "Review Safety condition", view.conflicts[0]?.href || "/safety");
  console.log("SCENARIO G PASS");
}

{
  const view = buildLoadFileCopilotAdvocateView({ data, v3: null, scope: assignedState ? { loadId: assignedState.loadId } : undefined });
  assert(view.guidance.every((row) => row.claimClass === "RECOMMENDATION" && row.executable === false), "H: guidance is non-executable recommendation");
  assert(view.crossWorkflow.some((row) => row.relationship === "Load ↔ Settlement"), "H: settlement relationship required");
  assert(view.crossWorkflow.some((row) => row.relationship === "Load ↔ Process Intelligence"), "H: PI relationship required");
  console.log("SCENARIO H PASS — read-only recommendations and cross-workflow notes");
}

console.log("LOAD FILE COPILOT ADVOCATE VALIDATION COMPLETE");
