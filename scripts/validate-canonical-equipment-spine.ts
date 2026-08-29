import { getBofData } from "../lib/load-bof-data";
import { buildCanonicalEquipmentSpine, evaluateEquipmentOperationalState } from "../lib/canonical-equipment-spine";
import { buildDemoEquipmentScenario, DEMO_SCENARIO_PRESETS } from "../lib/demo-equipment-scenario";

const data = getBofData();
const records = buildCanonicalEquipmentSpine(data);
const demoRecords = buildCanonicalEquipmentSpine(data, [], "DEMO");
const expectedIds = Array.from({ length: 25 }, (_, index) => `T-${101 + index}`);
const actualIds = records.map((record) => record.canonicalAssetId);

if (records.length !== 25) throw new Error(`Expected 25 canonical assets, found ${records.length}`);
if (new Set(actualIds).size !== records.length) throw new Error("Canonical asset IDs are duplicated");
if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) throw new Error("Canonical asset IDs were renamed or reordered");

for (const record of records) {
  if (record.canonicalAssetId !== record.unitNumber.value) {
    throw new Error(`${record.canonicalAssetId}: unit-number identity was not preserved`);
  }
  if (record.currentAssignment.source !== "PRISMA" || record.currentAssignment.provenance !== "MISSING") {
    throw new Error(`${record.canonicalAssetId}: current assignment must remain pending live reconciliation`);
  }
  if (record.operationalStatus.value !== null || record.operationalStatus.provenance !== "UNKNOWN") {
    throw new Error(`${record.canonicalAssetId}: durable status must not be fabricated`);
  }
  if (record.readiness.value !== "UNRESOLVED_PENDING_LIVE_RECONCILIATION") {
    throw new Error(`${record.canonicalAssetId}: readiness must not be hard-coded`);
  }
  if (!record.unresolvedConflicts.includes("V3/V4 asset row unavailable")) {
    throw new Error(`${record.canonicalAssetId}: missing V3/V4 provenance was not exposed`);
  }
  const operational = evaluateEquipmentOperationalState(record);
  if (operational.availability !== "PENDING_LIVE_RECONCILIATION" || operational.assignability !== "ASSIGNABILITY_NOT_ESTABLISHED" || operational.readiness !== "READINESS_NOT_ESTABLISHED" || operational.dispatchability !== "DISPATCHABILITY_NOT_ESTABLISHED") {
    throw new Error(`${record.canonicalAssetId}: unresolved durable state was collapsed into a positive operational state`);
  }
}

const demoById = new Map(demoRecords.map((record) => [record.canonicalAssetId, record]));
for (const id of ["T-101", "T-102", "T-103"]) {
  const record = demoById.get(id);
  if (!record || record.operationalStatus.provenance !== "DEMO_ONLY" || record.currentAssignment.provenance !== "DEMO_ONLY") {
    throw new Error(`${id}: DEMO mode did not retain explicit demo provenance`);
  }
}
const demoT101 = demoById.get("T-101");
const demoT102 = demoById.get("T-102");
const demoT103 = demoById.get("T-103");
if (!demoT101 || !demoT102 || !demoT103) throw new Error("Required DEMO scenario assets are missing");
const t101Evaluation = evaluateEquipmentOperationalState(demoT101);
const t102Evaluation = evaluateEquipmentOperationalState(demoT102);
const t103Evaluation = evaluateEquipmentOperationalState(demoT103);
if (t101Evaluation.availability !== "AVAILABLE" || t101Evaluation.assignability !== "ASSIGNABLE") throw new Error("T-101 DEMO available/assignable scenario failed");
if (demoT101.currentAssignment.value !== "DRV-002") throw new Error("T-101 DEMO assignment scenario failed");
if (t102Evaluation.availability !== "UNAVAILABLE" || t102Evaluation.assignability !== "NOT_ASSIGNABLE" || t102Evaluation.dispatchability !== "NOT_DISPATCHABLE") throw new Error("T-102 DEMO unavailable scenario failed");
if (t103Evaluation.availability !== "AVAILABLE" || t103Evaluation.readiness !== "READY") throw new Error("T-103 DEMO operational scenario failed");
const blockedDemo = evaluateEquipmentOperationalState(demoT103, { status: "COMPLETED", blockingDefect: true, outOfService: false });
if (blockedDemo.readiness !== "NOT_READY" || blockedDemo.dispatchability !== "NOT_DISPATCHABLE" || !blockedDemo.reasons.includes("Pre-trip has a blocking defect")) throw new Error("DEMO blocking PreTrip scenario failed");
const oosDemo = evaluateEquipmentOperationalState(demoT103, { status: "COMPLETED", blockingDefect: false, outOfService: true });
if (oosDemo.readiness !== "NOT_READY" || oosDemo.dispatchability !== "NOT_DISPATCHABLE" || !oosDemo.reasons.includes("Equipment is out of service")) throw new Error("DEMO OOS scenario failed");
const repairedDemo = evaluateEquipmentOperationalState(demoT103, { status: "COMPLETED", blockingDefect: false, outOfService: false });
if (repairedDemo.readiness !== "READY" || repairedDemo.dispatchability !== "DISPATCHABLE") throw new Error("DEMO repaired/verified recovery scenario failed");

const blockedRecord = records.find((record) => record.canonicalAssetId === "T-102");
if (!blockedRecord) throw new Error("T-102: canonical Equipment record is missing");
const blockedEvaluation = evaluateEquipmentOperationalState(blockedRecord, {
  status: "COMPLETED",
  blockingDefect: true,
  outOfService: true,
});
if (blockedEvaluation.readiness !== "NOT_READY" || blockedEvaluation.dispatchability !== "NOT_DISPATCHABLE") {
  throw new Error("Blocking/OOS PreTrip state was represented as ready or dispatchable");
}

const normalScenario = buildDemoEquipmentScenario(data, DEMO_SCENARIO_PRESETS.normal.state);
const capacityScenario = buildDemoEquipmentScenario(data, DEMO_SCENARIO_PRESETS.capacity.state);
const maintenanceScenario = buildDemoEquipmentScenario(data, DEMO_SCENARIO_PRESETS.maintenance.state);
const recoveryScenario = buildDemoEquipmentScenario(data, DEMO_SCENARIO_PRESETS.recovery.state);
if (normalScenario.provenance !== "DEMO_ONLY" || normalScenario.rows.some((row) => row.record.operationalStatus.provenance !== "DEMO_ONLY")) {
  throw new Error("Scenario rows did not retain DEMO_ONLY provenance");
}
if (normalScenario.rows.length !== 25 || normalScenario.affectedEquipmentIds.includes("T-101")) {
  throw new Error("Normal DEMO scenario did not preserve the canonical operating picture");
}
if (!capacityScenario.affectedEquipmentIds.includes("T-101") || capacityScenario.openLoadDemand <= normalScenario.openLoadDemand) {
  throw new Error("Capacity Crunch did not propagate reduced capacity and increased demand");
}
if (!maintenanceScenario.affectedEquipmentIds.includes("T-101") || !maintenanceScenario.affectedEquipmentIds.includes("T-103") || maintenanceScenario.rows.find((row) => row.record.canonicalAssetId === "T-101")?.evaluation.dispatchability !== "NOT_DISPATCHABLE") {
  throw new Error("Maintenance Event did not route selected canonical assets through the evaluator");
}
if (JSON.stringify(recoveryScenario) !== JSON.stringify(normalScenario)) {
  throw new Error("Recovery did not restore the normal DEMO scenario");
}
if (JSON.stringify(data) !== JSON.stringify(getBofData())) {
  throw new Error("Scenario evaluation changed the DEMO source data");
}

console.log(JSON.stringify({
  canonicalAssetCount: records.length,
  scenarioProof: {
    normalAffectedEquipment: normalScenario.affectedEquipmentIds,
    capacityExceptions: capacityScenario.exceptions.length,
    maintenanceAffectedEquipment: maintenanceScenario.affectedEquipmentIds,
    recoveryMatchesNormal: JSON.stringify(recoveryScenario) === JSON.stringify(normalScenario),
  },
  firstAsset: records[0],
  lastAsset: records.at(-1),
  livePrismaReconciliation: "PENDING_LIVE_RECONCILIATION",
  equipmentObligationsCreated: false,
}));
console.log("validate-canonical-equipment-spine: OK");
