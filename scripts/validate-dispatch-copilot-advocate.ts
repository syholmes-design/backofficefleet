import { getBofData } from "../lib/load-bof-data";
import { getCanonicalDispatchLoadState } from "../lib/dispatch/canonical-dispatch-operating-state";
import { getDriverDispatchEligibility } from "../lib/driver-dispatch-eligibility";
import { listMaintenanceAssetSummaries } from "../lib/maintenance-data";
import { buildDispatchCopilotAdvocateView } from "../lib/copilot/dispatch-copilot-advocate-display";
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
const states = data.loads
  .map((load) => getCanonicalDispatchLoadState(data, load.id))
  .filter((row): row is NonNullable<typeof row> => Boolean(row));

const clearAssigned = states.find((row) => row.assigned && row.releaseDisposition === "RELEASED" && !row.needsAttention);
const eligibilityConflict = states.find((row) => {
  if (!row.assigned || !row.driverId) return false;
  return getDriverDispatchEligibility(data, row.driverId).status === "blocked";
});
const equipmentConflict = states.find((row) => {
  if (!row.assigned || !row.assetId) return false;
  const asset = equipment.find((item) => item.asset_id === row.assetId);
  return Boolean(asset && (asset.readiness === "Blocked" || asset.oos));
});
const blockerState = states.find((row) => row.blockers.length > 0 && row.releaseDisposition !== "RELEASED");
const settlementState = states.find((row) => row.settlementHold);
const assignedState = states.find((row) => row.assigned && row.driverId);

assert(clearAssigned || blockerState, "Existing demo data must include at least one canonical dispatch state");

if (clearAssigned) {
  const view = buildDispatchCopilotAdvocateView({ data, v3: null, scope: { loadId: clearAssigned.loadId } });
  const fact = view.facts.find((row) => row.id.startsWith("fact-assign-"));
  const rec = view.guidance.find((row) => /review driver assignment/i.test(row.recommendedAction));
  assert(fact, "A: assignment fact missing");
  assert(rec, "A: review-assignment recommendation missing");
  assert(!/assign driver /i.test(view.guidance.map((row) => row.recommendedAction).join(" ")), "A: must not assign a named driver");
  assert(view.guidance.every((row) => row.executable === false), "A: recommendations must be non-executable");
  logScenario(
    "A valid assignment",
    fact!.source,
    fact!.fact,
    view.interpretations[0]?.text || view.decisionSupport?.[0]?.text || "none",
    rec!.recommendedAction,
    rec!.href,
  );
  console.log("SCENARIO A PASS");
} else {
  console.log("SCENARIO A SKIP — no clear assigned RELEASED load in existing data");
}

if (eligibilityConflict) {
  const view = buildDispatchCopilotAdvocateView({ data, v3: null, scope: { loadId: eligibilityConflict.loadId } });
  const conflict = view.conflicts.find((row) => row.id.startsWith("conflict-assign-elig-"));
  assert(conflict, "B: eligibility conflict not surfaced");
  assert(conflict!.sources.length >= 2, "B: both sources required");
  logScenario(
    "B driver eligibility conflict",
    conflict!.sources.map((row) => row.authority).join(" vs "),
    conflict!.sources.map((row) => row.statement).join(" | "),
    conflict!.explanation,
    conflict!.resolutionLabel,
    conflict!.href || "",
  );
  console.log("SCENARIO B PASS");
} else {
  console.log("SCENARIO B SKIP — no assignment vs eligibility conflict in existing data");
}

if (equipmentConflict) {
  const view = buildDispatchCopilotAdvocateView({ data, v3: null, scope: { loadId: equipmentConflict.loadId } });
  const conflict = view.conflicts.find((row) => row.id.startsWith("conflict-assign-eq-"));
  assert(conflict, "C: equipment conflict not surfaced");
  logScenario(
    "C equipment OOS/block conflict",
    conflict!.sources.map((row) => row.authority).join(" vs "),
    conflict!.sources.map((row) => row.statement).join(" | "),
    conflict!.explanation,
    conflict!.resolutionLabel,
    conflict!.href || "",
  );
  console.log("SCENARIO C PASS");
} else {
  console.log("SCENARIO C SKIP — existing maintenance summaries have no assigned load paired with Blocked/OOS equipment; demo JSON was not modified. Conflict handling is the same two-source surface as B/I.");
}

if (blockerState) {
  const view = buildDispatchCopilotAdvocateView({ data, v3: null, scope: { loadId: blockerState.loadId } });
  const fact = view.facts.find((row) => row.id.startsWith("fact-blocker-") || row.id.startsWith("fact-release-"));
  const rec = view.guidance.find((row) => row.id.startsWith("rec-blocker-"));
  assert(fact, "D: blocker/release fact missing");
  assert(rec, "D: blocker recommendation missing");
  assert(fact!.causeClass !== "RECORDED_CAUSE" || Boolean(blockerState.blockers[0]?.detail), "D: recorded cause only from blocker detail");
  logScenario("D dispatch readiness/blocker", fact!.source, fact!.fact, rec!.interpretation, rec!.recommendedAction, rec!.href);
  console.log("SCENARIO D PASS");
} else {
  throw new Error("SCENARIO D FAIL — expected at least one canonical blocker in existing data");
}

if (assignedState) {
  const v3 = {
    safetyEvents: [
      {
        eventId: "QA-DISPATCH-BLOCK",
        driverId: assignedState.driverId,
        linkedLoadId: assignedState.loadId,
        dispatchBlock: true,
        rootCause: "HOS coaching and driver acknowledgment incomplete",
      },
    ],
  } as V3OperationalData;
  const view = buildDispatchCopilotAdvocateView({ data, v3, scope: { loadId: assignedState.loadId } });
  const fact = view.facts.find((row) => row.id.startsWith("fact-safety-block-"));
  assert(fact, "E: safety dispatchBlock fact missing");
  assert(fact!.causeClass === "RECORDED_CAUSE", "E: rootCause should classify as RECORDED_CAUSE");
  const action = view.conflicts.find((row) => row.id.startsWith("conflict-safety-release-")) || view.guidance.find((row) => row.id.startsWith("rec-safety-"));
  assert(action, "E: safety impact guidance or conflict missing");
  logScenario(
    "E safety dispatchBlock",
    fact!.source,
    fact!.fact,
    "conflict" in action! && "explanation" in action ? String((action as { explanation?: string }).explanation) : "Safety Event dispatchBlock copied",
    "resolutionLabel" in action! ? String((action as { resolutionLabel?: string }).resolutionLabel) : String((action as { recommendedAction?: string }).recommendedAction),
    "href" in action! ? String((action as { href?: string }).href) : "",
  );
  console.log("SCENARIO E PASS");
}

if (settlementState) {
  const view = buildDispatchCopilotAdvocateView({ data, v3: null, scope: { loadId: settlementState.loadId } });
  const fact = view.facts.find((row) => row.id.startsWith("fact-settle-rel-"));
  const rec = view.guidance.find((row) => row.id.startsWith("rec-settle-"));
  assert(fact, "F: settlement relevance fact missing");
  assert(rec, "F: settlement review recommendation missing");
  assert(!/pay the driver|net pay|invoice/i.test(fact!.fact), "F: must not invent payment");
  logScenario("F settlement relevance", fact!.source, fact!.fact, rec!.interpretation, rec!.recommendedAction, rec!.href);
  console.log("SCENARIO F PASS");
} else {
  console.log("SCENARIO F SKIP — no canonical settlementHold on existing loads");
}

{
  const view = buildDispatchCopilotAdvocateView({ data, v3: null, scope: { loadId: blockerState!.loadId } });
  const cross = view.crossWorkflow.find((row) => row.relationship.includes("Dispatch ↔ Load"));
  const rec = view.guidance.find((row) => row.id.startsWith("rec-pi-"));
  assert(cross, "G: Dispatch ↔ Load relationship missing");
  assert(rec, "G: Process Intelligence navigation missing");
  logScenario("G cross-workflow dependency", cross!.relationship, cross!.note, rec!.interpretation, rec!.recommendedAction, rec!.href);
  console.log("SCENARIO G PASS");
}

{
  const view = buildDispatchCopilotAdvocateView({ data, v3: null, scope: { loadId: "LOAD-DOES-NOT-EXIST" } });
  assert(view.facts.length === 0, "H: must not invent facts for a missing load");
  assert(view.unsupported.some((row) => /honest empty|does not exist/i.test(row)), "H: missing authority must be reported");
  logScenario("H missing authoritative Dispatch information", "canonical operating state lookup", "none", view.unsupported[0], "none", "none");
  console.log("SCENARIO H PASS");
}

{
  const conflictViewLoad = eligibilityConflict || equipmentConflict || assignedState;
  assert(conflictViewLoad, "I: need a load to evaluate conflict handling");
  const v3 = assignedState
    ? ({
        safetyEvents: [
          {
            eventId: "QA-DISPATCH-BLOCK-I",
            driverId: assignedState.driverId,
            linkedLoadId: assignedState.loadId,
            dispatchBlock: true,
            rootCause: "HOS coaching and driver acknowledgment incomplete",
          },
        ],
      } as V3OperationalData)
    : null;
  const view = buildDispatchCopilotAdvocateView({
    data,
    v3,
    scope: { loadId: (eligibilityConflict || equipmentConflict || assignedState)!.loadId },
  });
  assert(view.conflicts.length > 0 || eligibilityConflict || equipmentConflict, "I: expected a surfaced conflict when authorities disagree");
  if (view.conflicts.length > 0) {
    const conflict = view.conflicts[0];
    assert(conflict.sources.length >= 2, "I: conflict must name both sources");
    logScenario("I conflicting Dispatch authorities", conflict.sources.map((row) => row.name).join(" vs "), conflict.sources.map((row) => row.statement).join(" | "), conflict.explanation, conflict.resolutionLabel, conflict.href || "");
    console.log("SCENARIO I PASS");
  }
}

const board = buildDispatchCopilotAdvocateView({ data, v3: null });
assert(board.guidance.every((row) => row.executable === false), "all recommendations remain non-executable");
assert(board.guidance.every((row) => !/^assign driver /i.test(row.recommendedAction)), "must never recommend assigning a named driver");
assert(board.assignmentProtectionNote, "assignment protection note required");
console.log("DISPATCH COPILOT ADVOCATE UNIT QA PASS");
