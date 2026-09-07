import { getBofData } from "../lib/load-bof-data";
import { getCanonicalDispatchLoadState } from "../lib/dispatch/canonical-dispatch-operating-state";
import { existingSettlementWorkflowHref } from "../lib/load-file-proof-settlement-display";
import { listMaintenanceAssetSummaries } from "../lib/maintenance-data";
import { buildCustomerCopilotAdvocateView } from "../lib/copilot/customer-copilot-advocate-display";
import { buildDispatchCopilotAdvocateView } from "../lib/copilot/dispatch-copilot-advocate-display";
import { buildDriverCopilotAdvocateView } from "../lib/copilot/driver-copilot-advocate-display";
import { buildEquipmentCopilotAdvocateView } from "../lib/copilot/equipment-copilot-advocate-display";
import { buildLoadFileCopilotAdvocateView } from "../lib/copilot/load-file-copilot-advocate-display";
import {
  buildCopilotAdvocateConsolidationView,
  representativeConsolidationScope,
} from "../lib/copilot/copilot-advocate-consolidation-display";
import type { CopilotAdvocateView } from "../lib/copilot/copilot-shared";

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

function gate(id: string, title: string) {
  console.log(`GATE ${id} — ${title}`);
}

function pass(id: string) {
  console.log(`GATE ${id} PASS`);
}

function serialized(view: CopilotAdvocateView): string {
  return JSON.stringify(view);
}

function assertViewShape(view: CopilotAdvocateView, label: string) {
  assert(Array.isArray(view.facts), `${label}: facts`);
  assert(Array.isArray(view.interpretations), `${label}: interpretations`);
  assert(Array.isArray(view.conflicts), `${label}: conflicts`);
  assert(Array.isArray(view.guidance), `${label}: guidance`);
  assert(Array.isArray(view.unsupported), `${label}: unsupported`);
  assert(Array.isArray(view.crossWorkflow), `${label}: crossWorkflow`);
  assert(view.guidance.every((row) => row.executable === false), `${label}: recs must be non-executable`);
  assert(view.guidance.every((row) => row.claimClass === "RECOMMENDATION"), `${label}: recs are RECOMMENDATION`);
  assert(view.interpretations.every((row) => row.claimClass === "DERIVED_INTERPRETATION"), `${label}: interpretations DERIVED`);
  for (const fact of view.facts) {
    assert(["AUTHORITATIVE", "DERIVED", "REFERENCE_DEMO", "UNSUPPORTED"].includes(fact.sourceClass), `${label}: sourceClass`);
    assert(["RECORDED_CAUSE", "DERIVED_INTERPRETATION", "CAUSE_NOT_ESTABLISHED"].includes(fact.causeClass), `${label}: causeClass`);
    assert(fact.source.trim().length > 0, `${label}: fact source required`);
  }
}

const data = getBofData();
const scope = representativeConsolidationScope(data);
assert(scope.loadId, "Existing demo data must include a canonical load for consolidation");
const loadId = scope.loadId!;
const state = getCanonicalDispatchLoadState(data, loadId);
const asset = listMaintenanceAssetSummaries(data).find((row) => row.asset_id === scope.assetId);

const dispatch = buildDispatchCopilotAdvocateView({ data, v3: null, scope });
const loadFile = buildLoadFileCopilotAdvocateView({ data, v3: null, scope });
const driver = buildDriverCopilotAdvocateView({ data, v3: null, scope });
const equipment = buildEquipmentCopilotAdvocateView({ data, v3: null, scope });
const customer = buildCustomerCopilotAdvocateView({ data, v3: null, scope });
const consolidation = buildCopilotAdvocateConsolidationView({ data, v3: null, scope });

gate("V1", "Structural validation");
for (const [label, view] of [
  ["dispatch", dispatch],
  ["loadFile", loadFile],
  ["driver", driver],
  ["equipment", equipment],
  ["customer", customer],
  ["consolidation", consolidation],
] as const) {
  assertViewShape(view, label);
}
assert(!/issueCertificationToken|appendCertificationRegistry|domainStateMachine/.test(serialized(consolidation)), "V1: must not invent a certification registry/token engine");
pass("V1");

gate("V2", "Semantic validation");
assert(dispatch.crossWorkflow.some((row) => /Dispatch ↔ Load/.test(row.relationship) || /Load/.test(row.relationship)), "V2: dispatch load relationship");
assert(loadFile.crossWorkflow.some((row) => /Proof|Settlement/.test(row.relationship)), "V2: load file proof/settlement relationship");
assert(customer.unsupported.some((row) => /SHP-86240/.test(row)), "V2: customer walkthrough remains REFERENCE/DEMO");
assert(consolidation.interpretations.some((row) => /not a new BOF system-of-record/.test(row.text)), "V2: consolidation must not promote inference to SOT");
pass("V2");

gate("V3", "Authority validation");
assert(!/assign (driver|unit|truck|equipment)/i.test(dispatch.guidance.map((row) => row.recommendedAction).join(" ")), "V3: dispatch must not assign");
assert(!/release load/i.test([...dispatch.guidance, ...loadFile.guidance].map((row) => row.recommendedAction).join(" ")), "V3: must not release");
const customerText = serialized(customer);
assert(!/settlementHold/.test(customerText), "V3: customer must not copy internal settlementHold");
assert(!/Out of Service/.test(customerText), "V3: customer must not copy equipment OOS");
assert(!/\/settlements/.test(customerText), "V3: customer must not navigate settlements");
assert(!/\/dispatch/.test(customerText), "V3: customer must not navigate dispatch ops");
if (state?.driverId) {
  const href = existingSettlementWorkflowHref({ driverId: state.driverId, loadId });
  assert(href.startsWith("/settlements"), "V3: settlement join stays on /settlements");
  assert(!href.includes("settlementId=L"), "V3: Load ID must not be used as Settlement ID");
  const settleRec = loadFile.guidance.find((row) => /settlement/i.test(row.workflow) || /settlement/i.test(row.recommendedAction));
  if (settleRec) {
    assert(settleRec.href === href || settleRec.href.startsWith("/settlements"), "V3: settlement CTA uses existing workflow");
  }
}
pass("V3");

gate("V4", "Source validation");
assert(state, "V4: canonical dispatch state must exist for representative load");
assert(dispatch.facts.some((row) => row.fact.includes(loadId)), "V4: dispatch copies representative load");
assert(loadFile.facts.some((row) => row.fact.includes(loadId)), "V4: load file copies representative load");
if (scope.driverId) {
  assert(driver.facts.some((row) => row.fact.includes(scope.driverId!)), "V4: driver copies assigned driver");
}
if (asset) {
  assert(equipment.facts.some((row) => row.fact.includes(asset.asset_id)), "V4: equipment copies assigned asset");
}
assert(customer.facts.some((row) => row.id.includes(loadId) || row.fact.includes(loadId)), "V4: customer copies customer-visible load");
pass("V4");

gate("C1", "Validation completion record");
console.log("  V1–V4 completed unmodified for consolidation output");
pass("C1");

gate("C2", "Architecture / domain isolation");
assert(consolidation.unsupported.some((row) => /Certification Registry/.test(row)), "C2: governance engines explicitly not duplicated");
assert(consolidation.unsupported.some((row) => /Safety Copilot \/ Settlement Copilot/.test(row)), "C2: 001–002 remain existing authorities");
pass("C2");

gate("C3", "Causal integrity");
assert(state?.loadId === loadId, "C3: dispatch state load id matches scope");
if (state?.assetId && asset) {
  assert(asset.asset_id === state.assetId, "C3: equipment summary is the assigned unit");
}
if (state?.driverId) {
  assert(scope.driverId === state.driverId, "C3: driver scope matches canonical assignment");
}
const dispatchEq = dispatch.conflicts.some((row) => row.id.startsWith("conflict-assign-eq-"));
const equipmentOos = equipment.conflicts.some((row) => row.id.startsWith("conflict-assign-oos-"));
if (asset && dispatchEq !== equipmentOos) {
  assert(consolidation.conflicts.some((row) => row.id === "consol-conflict-eq-dispatch-read-rule"), "C3: field-read difference must be copied, not silently merged");
  console.log("  NOTE: Equipment vs Dispatch conflict-card rules differ on recorded fields; treated as certified-domain limitation, not a new readiness fact");
}
pass("C3");

gate("C4", "Audit / mutation prohibition");
assert(consolidation.readOnlyNote.toLowerCase().includes("read-only"), "C4: read-only");
assert([dispatch, loadFile, driver, equipment, customer, consolidation].every((view) => view.guidance.every((row) => row.executable === false)), "C4: no executable recs");
pass("C4");

gate("C5", "Completeness / cross-domain chains");
const requiredChains = [
  "Safety → Dispatch",
  "Safety → Driver",
  "Equipment → Dispatch",
  "Driver eligibility → Dispatch",
  "Dispatch → Load File",
  "Load File → Proof",
  "Proof → Settlement",
  "Customer-visible → Customer Copilot",
];
for (const name of requiredChains) {
  assert(
    consolidation.crossWorkflow.some((row) => row.relationship === name),
    `C5: ${name} relationship missing from consolidation`,
  );
}
if (state?.settlementHold) {
  assert(loadFile.facts.some((row) => /settlementHold/.test(row.fact)), "C5: proof/settlement hold copied on Load File");
  assert(!serialized(customer).includes("settlementHold"), "C5: customer still withholds hold");
}
const proofFact = loadFile.facts.find((row) => /proof|POD|evidence/i.test(row.domain) || /proof|POD|evidence/i.test(row.fact));
if (!proofFact) {
  console.log("  NOTE: no proof/evidence fact in scoped Load File view — report unavailable, not fabricated");
}
pass("C5");

gate("C6", "Authority sign-off package");
assert(consolidation.decisionSupport?.some((row) => /Command Center/.test(row.text)), "C6: Command Center observation declared");
console.log(`  SCOPE loadId=${loadId} driverId=${scope.driverId || "none"} assetId=${scope.assetId || "none"}`);
console.log(`  SETTLEMENT_HREF=${existingSettlementWorkflowHref({ driverId: state?.driverId, loadId })}`);
pass("C6");

console.log("COPILOT ADVOCATE CONSOLIDATION VALIDATION PASS");
