import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path: string) {
  return readFileSync(path, "utf8");
}

test("live driver and load surfaces request existing SambaSafety context", () => {
  const panel = read("components/operations/SambaIntelligencePanel.tsx");
  const driver = read("components/drivers/OperatorDriverDetail.tsx");
  const load = read("components/dispatch/LoadDetailContent.tsx");
  assert.match(panel, /params\.set\("driverId", driverId\)/);
  assert.match(panel, /isDemoOperationalKey/);
  assert.match(panel, /const relatedEntityId = carrierRegistryId \? driverId : driverId \|\| entityId/);
  assert.match(panel, /row\.workflowHref\?\.includes\(matchId\)/);
  assert.match(load, /LoadPickupAuthorizationLinks/);
  assert.match(driver, /<SambaIntelligencePanel driverId=\{driver\.id\}/);
  assert.match(load, /<SambaIntelligencePanel loadId=\{load\.id\}/);
  assert.doesNotMatch(driver, /useBofDemoData|SettlementsPayrollShell/);
  assert.match(load, /Open live settlements/);
  assert.doesNotMatch(load, /Open driver-week payroll/);
});

test("samba context rejects demo operational keys before it reads records", () => {
  const route = read("app/api/samba/context/route.ts");
  const findings = read("app/api/samba/findings/route.ts");
  const contextService = read("lib/services/samba/sambaContext.ts");
  assert.match(route, /rejectDemoOperationalKey/);
  assert.match(route, /driverId/);
  const handler = route.slice(route.indexOf("export async function GET"));
  const rejectAt = handler.indexOf("rejectDemoIdentifiers");
  const contextAt = handler.indexOf("getSambaOperationalContext");
  assert.ok(rejectAt > 0 && contextAt > rejectAt);
  const findingsHandler = findings.slice(findings.indexOf("export async function GET"));
  const findingsReject = findingsHandler.indexOf("rejectDemoOperationalKey");
  const findingsRead = findingsHandler.indexOf("listSambaFindings");
  assert.ok(findingsReject > 0 && findingsRead > findingsReject);
  assert.match(contextService, /requireFleetAccess/);
});

test("restored settlements and website connections remain in place", () => {
  const settlements = read("components/settlements-payroll/SettlementsPayrollPageClient.tsx");
  const home = read("components/marketing/MarketingHomeAccountable.tsx");
  const header = read("components/BofHeader.tsx");
  assert.match(settlements, /\/api\/dispatch\/settlements/);
  assert.doesNotMatch(settlements, /SettlementsPayrollShell/);
  assert.match(home, /id="what-we-do"/);
  assert.match(home, /id="we-save-you-money"/);
  assert.match(home, /id="assess-the-operation"/);
  assert.match(header, /productLogoHref/);
  assert.match(header, /href: "\/settlements"/);
});
