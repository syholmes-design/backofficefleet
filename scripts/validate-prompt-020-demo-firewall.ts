import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import {
  DEMO_SOURCE_REJECTED,
  isDemoOperationalKey,
  rejectDemoOperationalKey,
} from "../lib/uos/demo-operational-keys";

function read(rel: string) {
  return readFileSync(resolve(process.cwd(), rel), "utf8");
}

assert.equal(isDemoOperationalKey("L001"), true);
assert.equal(isDemoOperationalKey("T-102"), true);
assert.equal(isDemoOperationalKey("DRV-001"), true);
assert.equal(isDemoOperationalKey("TRL-2559"), true);
assert.equal(isDemoOperationalKey("86fd04a8-ce66-4153-9125-dccb054f7033"), false);
assert.equal(isDemoOperationalKey("cmtkkg28f0003to5ay7o9y72e"), false);

assert.throws(
  () => rejectDemoOperationalKey("L001", "loadId"),
  (error: unknown) =>
    error instanceof Error &&
    error.message.includes(DEMO_SOURCE_REJECTED) &&
    (error as { statusCode?: number }).statusCode === 422,
);

assert.doesNotThrow(() => rejectDemoOperationalKey("86fd04a8-ce66-4153-9125-dccb054f7033", "loadId"));

const loadService = read("lib/services/loadService.ts");
assert.match(loadService, /rejectDemoOperationalKey\(key, "loadId"\)/, "A: LIVE load lookup rejects DEMO keys");

const assignment = read("lib/services/dispatchAssignmentService.ts");
assert.match(assignment, /rejectDemoOperationalKey\(loadId, "loadId"\)/, "B: assignment cannot bind DEMO load keys");
assert.match(assignment, /rejectDemoOperationalKey\(driverId, "driverId"\)/, "B: assignment cannot bind DEMO drivers");
assert.match(assignment, /rejectDemoOperationalKey\(tractorId, "tractorId"\)/, "B: assignment cannot bind DEMO tractors");

const equipment = read("lib/services/equipmentService.ts");
assert.match(equipment, /rejectDemoOperationalKey\(equipmentId, "equipmentId"\)/, "J: equipment LIVE lookup rejects T-102 keys");

const eligibility = read("lib/services/driverEligibilityReviewService.ts");
assert.match(eligibility, /rejectDemoOperationalKey\(driverId, "driverId"\)/, "B: eligibility cannot write DEMO DRV-*");

const proof = read("lib/services/proofSettlementHoldService.ts");
assert.match(proof, /findLoadByOperatorKey/, "B: proof reject uses LIVE load lookup");

const productionCc = read("app/(bof)/command-center/page.tsx");
assert.match(productionCc, /ProductionCommandCenter/, "C: production Command Center is LIVE component");
assert.doesNotMatch(productionCc, /CommandCenterV4/, "C: production Command Center does not mount DEMO V4");

const productionCcUi = read("components/command-center/ProductionCommandCenter.tsx");
assert.match(productionCcUi, /useLiveOperatingSpine/, "C: CC KPIs come from LIVE spine");
assert.doesNotMatch(productionCcUi, /useBofDemoData/, "C: production CC does not consume DEMO JSON");
assert.doesNotMatch(productionCcUi, /getV3OperationalData/, "C: production CC does not consume workbook");
assert.doesNotMatch(productionCcUi, /getCanonicalDispatchLoadState/, "C: production CC does not consume canonical DEMO");

const demoCc = read("app/(bof)/demo/command-center/page.tsx");
assert.match(demoCc, /CommandCenterV4/, "DEMO Command Center preserved");
assert.match(demoCc, /DEMO Command Center/, "DEMO Command Center labeled");

const dispatchShell = read("components/dispatch/DispatchShell.tsx");
assert.match(dispatchShell, /sandbox && !fleetId/, "I: DEMO loads only when sandbox and no fleet");
assert.match(dispatchShell, /\/demo\/dispatch/, "G: production dispatch does not silently fall back to DEMO loads");

const loadsClient = read("components/loads/LoadsPageClient.tsx");
assert.match(loadsClient, /sandbox && !fleetId \? demoLoads/, "G: DEMO loads only on sandbox path");
assert.match(loadsClient, /\/demo\/loads/, "G: production loads fail closed without fleet");

const driversRoster = read("components/drivers/DriversRosterTable.tsx");
assert.match(driversRoster, /if \(!sandbox\)/, "G: production drivers do not mount DEMO roster without LIVE summaries");

const driversV4 = read("components/drivers-v4/DriversCommandCenterV4.tsx");
assert.match(driversV4, /sandbox \? \(/, "E: workbook compliance dashboard isolated to DEMO drivers");

const layout = read("app/(bof)/layout.tsx");
assert.match(layout, /OperatorSurfaceModeBanner/, "G: operator shell labels LIVE vs DEMO");
assert.match(layout, /BofDemoDataShell/, "DEMO shell preserved for DEMO descendants");

const customer = read("app/portals/customer/page.tsx");
assert.match(customer, /liveOverlayByDemoId/, "H: LIVE overlay wins customer card status");
assert.match(customer, /LIVE overlay governs status/, "H: DEMO invoice does not override LIVE match");

const commandCenterV4 = read("components/command-center-v4/CommandCenterV4.tsx");
assert.match(commandCenterV4, /DEMO Command Center/, "DEMO CC labeled");
assert.doesNotMatch(commandCenterV4, /LiveOperatingSpinePanel/, "F: DEMO CC does not mix LIVE spine into DEMO KPIs");

const board = read("components/dispatch/DispatchBoardScreen.tsx");
assert.match(board, /selectedLoad && demoMode/, "F: RFID/workbook route intel only in DEMO mode");
assert.match(board, /if \(!demoMode \|\| !selectedLoad\) return null/, "F: pretrip DEMO tablet not used on LIVE board");

const loadPage = read("app/(bof)/loads/[id]/page.tsx");
assert.match(loadPage, /DEMO_SOURCE_REJECTED/, "A: production /loads/:id isolates DEMO keys");
assert.match(loadPage, /DEMO key isolated/, "A: DEMO keys are not rendered as LIVE load files");

console.log("PROMPT_020_SOURCE_CHECKS_OK");

