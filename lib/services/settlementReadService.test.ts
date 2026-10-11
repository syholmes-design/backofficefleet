import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { presentLiveSettlement } from "./settlementReadService";

const stored = {
  id: "set_live_1",
  loadId: "cmloadlive0001",
  driverId: "cmdriverlive0001",
  driverFirstName: "Ada",
  driverLastName: "Miles",
  settlementDate: new Date("2026-10-03T00:00:00.000Z"),
  grossAmount: "1500.5",
  deductions: "120",
  reimbursements: "40.25",
  advances: "0",
  netAmount: "1420.75",
  status: "HELD",
  holdReason: "Missing POD",
};

test("live settlement presentation keeps stored amounts and the driver name", () => {
  const item = presentLiveSettlement(stored);
  assert.ok(item);
  assert.equal(item.driverName, "Ada Miles");
  assert.equal(item.grossAmount, "1500.50");
  assert.equal(item.deductions, "120.00");
  assert.equal(item.reimbursements, "40.25");
  assert.equal(item.netAmount, "1420.75");
  assert.equal(item.status, "HELD");
  assert.equal(item.holdReason, "Missing POD");
  assert.equal("email" in item, false);
});

test("demo operational keys are not presented as live settlements", () => {
  assert.equal(presentLiveSettlement({ ...stored, loadId: "L001" }), null);
  assert.equal(presentLiveSettlement({ ...stored, driverId: "DRV-001" }), null);
});

test("the live settlements route stays authenticated and off the demo workbook", () => {
  const route = readFileSync("app/api/dispatch/settlements/route.ts", "utf8");
  const page = readFileSync("components/settlements-payroll/SettlementsPayrollPageClient.tsx", "utf8");
  assert.match(route, /AUTH_REQUIRED/);
  assert.match(route, /listAccessibleLiveSettlements/);
  assert.doesNotMatch(route, /useBofDemoData|SettlementsPayrollShell/);
  assert.doesNotMatch(page, /SettlementsPayrollShell|useBofDemoData/);
  assert.match(page, /\/api\/dispatch\/settlements/);
});
