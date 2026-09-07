import { getBofData } from "../lib/load-bof-data";
import {
  buildCanonicalEquipmentSpine,
  evaluateEquipmentOperationalState,
  isCanonicalOutOfServiceFlag,
} from "../lib/canonical-equipment-spine";
import { getCanonicalDispatchLoadState } from "../lib/dispatch/canonical-dispatch-operating-state";
import {
  equipmentConflictsWithCanonicalAssignment,
  getMaintenanceAssetSummary,
  listMaintenanceAssetSummaries,
} from "../lib/maintenance-data";
import { buildDispatchCopilotAdvocateView } from "../lib/copilot/dispatch-copilot-advocate-display";
import { buildEquipmentCopilotAdvocateView } from "../lib/copilot/equipment-copilot-advocate-display";
import { buildLoadFileCopilotAdvocateView } from "../lib/copilot/load-file-copilot-advocate-display";
import { getDriverDispatchEligibility } from "../lib/driver-dispatch-eligibility";
import { existingSettlementWorkflowHref, resolveExistingSettlementWorkflowTarget } from "../lib/load-file-proof-settlement-display";
import { bootstrapPayrollFromBof } from "../lib/settlements-payroll-bootstrap";
import { getV3OperationalData } from "../lib/v3-operational-loader";
import { DEMO_CUSTOMER_PROFILE } from "../lib/demo-portals";

async function main() {
const data = getBofData();
const summaries = listMaintenanceAssetSummaries(data);
const t102 = getMaintenanceAssetSummary(data, "T-102");
if (!t102) throw new Error("GAP-009-008: T-102 summary missing");
if (t102.readiness !== "Out of Service") throw new Error(`GAP-009-008: T-102 readiness ${t102.readiness}`);
if (!t102.oos) throw new Error("GAP-009-008: T-102 oos must be true");
if (!isCanonicalOutOfServiceFlag(true)) throw new Error("GAP-009-008: boolean OOS flag helper failed");
if (!equipmentConflictsWithCanonicalAssignment(t102)) {
  throw new Error("GAP-009-008: T-102 must conflict with canonical assignment");
}

const live = buildCanonicalEquipmentSpine(data);
const liveT102 = live.find((row) => row.canonicalAssetId === "T-102");
if (!liveT102) throw new Error("GAP-009-028: LIVE T-102 missing");
if (liveT102.readiness.value !== "UNRESOLVED_PENDING_LIVE_RECONCILIATION") {
  throw new Error("GAP-009-028: LIVE readiness was filled instead of remaining pending");
}
if (liveT102.outOfService.value !== null) {
  throw new Error("GAP-009-028: LIVE outOfService was fabricated");
}
const liveEval = evaluateEquipmentOperationalState(liveT102);
if (liveEval.availability !== "PENDING_LIVE_RECONCILIATION") {
  throw new Error("GAP-009-028: LIVE availability collapsed into a demo state");
}

const l001 = getCanonicalDispatchLoadState(data, "L001");
if (!l001) throw new Error("GAP-009-024: L001 canonical state missing");
if (!l001.blockers.some((row) => row.source === "maintenance" && /T-102/.test(row.label))) {
  throw new Error(`GAP-009-024: L001 missing T-102 maintenance blocker: ${l001.blockers.map((row) => row.label).join(" | ")}`);
}
if (l001.releaseDisposition !== "HOLD") {
  throw new Error(`GAP-009-024: L001 expected HOLD after equipment OOS, got ${l001.releaseDisposition}`);
}

const equipmentView = buildEquipmentCopilotAdvocateView({ data, v3: null, scope: { assetId: "T-102" } });
const dispatchView = buildDispatchCopilotAdvocateView({ data, v3: null, scope: { loadId: "L001" } });
const loadFileView = buildLoadFileCopilotAdvocateView({ data, v3: null, scope: { loadId: "L001" } });
for (const [name, view] of [
  ["equipment", equipmentView],
  ["dispatch", dispatchView],
  ["load-file", loadFileView],
] as const) {
  if (!view.conflicts.some((row) => /T-102/.test(JSON.stringify(row)))) {
    throw new Error(`GAP-009-008: ${name} Copilot missing T-102 assignment conflict`);
  }
}

const drv001 = getDriverDispatchEligibility(data, "DRV-001");
if (drv001.status === "ready") throw new Error("GAP-009-012: DRV-001 demo eligibility unexpectedly ready");

const payroll = bootstrapPayrollFromBof(data);
const href = existingSettlementWorkflowHref({ driverId: "DRV-001", loadId: "L001" });
if (!href.includes("driverId=DRV-001") || !href.includes("loadId=L001")) {
  throw new Error(`GAP-009-013: unexpected settlement href ${href}`);
}
const target = resolveExistingSettlementWorkflowTarget({
  settlements: payroll.settlements,
  lines: payroll.lines,
  driverId: "DRV-001",
  loadId: "L001",
});
if (!target.settlementId || !/^STL-/i.test(target.settlementId)) {
  throw new Error(`GAP-009-013: driver/load query did not resolve an STL-* payroll row (${target.settlementId})`);
}
if (target.highlightLoadId !== "L001") {
  throw new Error("GAP-009-013: loadId highlight was dropped");
}

if (!DEMO_CUSTOMER_PROFILE.customerName) {
  throw new Error("GAP-009-032: DEMO_CUSTOMER_PROFILE missing");
}

const v3 = await getV3OperationalData();
const parsedT102 = v3.assets.find((row) => row.assetId === "T-102");
if (!parsedT102) throw new Error("GAP-009-030: parsed T-102 missing from workbook assets");
if (!parsedT102.status && !parsedT102.readinessStatus) {
  throw new Error("GAP-009-030: T-102 Status Indicator / Service Status still empty after column map");
}

const safetyBlocks = v3.safetyEvents.filter((event) => event.dispatchBlock);
if (safetyBlocks.length < 1) throw new Error("GAP-009-010: no Safety_Events.dispatchBlock=true rows in workbook");
const kpiSheetBlocks = v3.safetyKpiSource.find((row) => row.kpiName === "Dispatch Blocks")?.kpiValue;
if (kpiSheetBlocks != null && kpiSheetBlocks !== safetyBlocks.length) {
  console.log(
    `GAP-009-010: Safety UI now uses event dispatchBlock count ${safetyBlocks.length}; workbook KPI sheet remains REFERENCE (${kpiSheetBlocks})`,
  );
}
const safetyView = buildDispatchCopilotAdvocateView({ data, v3, scope: { loadId: safetyBlocks[0].linkedLoadId || undefined } });
const joined = safetyBlocks.some((event) =>
  JSON.stringify(safetyView).includes(event.eventId) || JSON.stringify(buildDispatchCopilotAdvocateView({ data, v3 })).includes(event.eventId),
);
if (!joined) {
  throw new Error("GAP-009-010: dispatch Copilot did not copy a workbook dispatchBlock event");
}

const holdLoads = data.loads
  .map((load) => getCanonicalDispatchLoadState(data, load.id))
  .filter((row) => row?.releaseDisposition === "HOLD").length;
if (holdLoads < 1) throw new Error("GAP-009-007: canonical HOLD count is empty");
const oosUnits = summaries.filter((row) => row.oos).length;
if (oosUnits < 1) throw new Error("GAP-009-007: canonical OOS count is empty");

console.log(JSON.stringify({
  ok: true,
  t102: { readiness: t102.readiness, oos: t102.oos, dispatchability: t102.dispatchability },
  liveT102: { readiness: liveT102.readiness.value, availability: liveEval.availability },
  l001: { releaseDisposition: l001.releaseDisposition, maintenanceBlocker: true },
  safetyDispatchBlocks: safetyBlocks.map((event) => event.eventId),
  parsedT102: { status: parsedT102.status, readinessStatus: parsedT102.readinessStatus, currentDriverId: parsedT102.currentDriverId },
  settlement: { href, settlementId: target.settlementId },
  canonicalHolds: holdLoads,
  canonicalOos: oosUnits,
  drv001Eligibility: drv001.status,
}, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
