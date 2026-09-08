import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { existingSettlementWorkflowHref, resolveExistingSettlementWorkflowTarget } from "../lib/load-file-proof-settlement-display";

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

const payrollStore = read("lib/stores/settlements-payroll-store.ts");
assert.match(payrollStore, /placeHoldFromLoadProof/, "014: existing payroll hold must be reusable from load proof");
assert.match(payrollStore, /bof-settlements-payroll-hold-overrides/, "014: hold overlay persist key");

const panel = read("components/dispatch/DocumentationReadinessPanel.tsx");
assert.match(panel, /placeHoldFromLoadProof/, "014: documentation hold must call existing payroll placeHold");
assert.match(panel, /setSettlementHold/, "014: dispatch load hold remains the existing board field");
const loadDetail = read("components/dispatch/LoadDetailContent.tsx");
assert.match(loadDetail, /DocumentationReadinessPanel/, "014: existing packet panel must be reachable from dispatch load detail");

const drawer = read("components/settlements-payroll/SettlementDetailDrawer.tsx");
assert.match(drawer, /\/api\/generate\/invoice/, "015: existing invoice generate API must be reachable from settlement drawer");
assert.match(drawer, /Payment is UNSUPPORTED/, "015: must not fake payment");
assert.doesNotMatch(drawer, /\/api\/.*payment/, "015: must not invent a payment endpoint");

const header = read("components/BofHeader.tsx");
assert.match(header, /ExistingDocumentNavAnchor/, "016: product nav must use document navigation");
assert.match(read("components/ExistingDocumentNavAnchor.tsx"), /location\.assign/, "016: existing browser navigation, not a new router");
assert.doesNotMatch(
  header,
  /productNav\.map\(\(item\) => <Link /,
  "016: authenticated product nav must not rely on Next Link"
);

const customer = read("app/portals/customer/page.tsx");
assert.match(customer, /ExistingDocumentNavAnchor href=\{`#shipment-\$\{load\.loadId\}`\}/, "016: customer shipment cards must use document hash navigation");

const triage = read("components/dispatch/DispatchTriageBoard.tsx");
assert.doesNotMatch(triage, /Override not implemented/, "026: misleading override affordance must be gone");
assert.match(triage, /Review release gate/, "026: existing trip-release path must remain");
assert.match(triage, /No separate override API exists/, "026: manager path must name the existing release workflow");

const href = existingSettlementWorkflowHref({ driverId: "DRV-001", loadId: "L001", payrollSettlementId: "STL-001" });
assert.equal(href, "/settlements?driverId=DRV-001&loadId=L001&settlementId=STL-001");
const target = resolveExistingSettlementWorkflowTarget({
  settlements: [{ settlement_id: "STL-001", driver_id: "DRV-001", settlement_hold: false }],
  lines: [{ settlement_id: "STL-001", load_id: "L001" }],
  driverId: "DRV-001",
  loadId: "L001",
});
assert.equal(target.settlementId, "STL-001");
assert.equal(target.highlightLoadId, "L001");

console.log("PROMPT_012_SOURCE_CHECKS_OK");
console.log(`SETTLEMENT_HREF=${href}`);
