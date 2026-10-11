import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function read(path: string) {
  return readFileSync(path, "utf8");
}

test("eligibility remains the operator review and does not read Samba findings", () => {
  const eligibility = read("lib/services/driverEligibilityReviewService.ts");
  const route = read("app/api/dispatch/driver/[driverId]/eligibility/route.ts");
  const roster = read("components/drivers/DriversRosterTable.tsx");
  const beforeRead = eligibility.indexOf("rejectDemoOperationalKey");
  const driverRead = eligibility.indexOf("prisma.driver.findUnique");
  assert.ok(beforeRead > 0 && driverRead > beforeRead);
  assert.doesNotMatch(eligibility, /samba|SambaFinding|evaluateSambaIntelligence/i);
  assert.match(eligibility, /writeQualificationSnapshot/);
  assert.match(eligibility, /status: eligible \? "READY" : "NOT_READY"/);
  assert.match(route, /disposition must be ELIGIBLE or INELIGIBLE/);
  assert.doesNotMatch(route, /samba|SambaFinding/i);
  assert.match(roster, /SambaSafety findings do not set this disposition/);
  assert.doesNotMatch(roster, /evaluateSambaIntelligence|sambaIntelligenceService/);
  const driverFile = read("components/drivers/OperatorDriverDetail.tsx");
  assert.match(driverFile, /requirementType === "MEDICAL"/);
  assert.match(driverFile, /MedicalRenewalAffirmButton/);
  assert.match(read("components/drivers/MedicalRenewalAffirmButton.tsx"), /medical-renewal\/affirm/);
  assert.match(read("components/drivers/MedicalRenewalAffirmButton.tsx"), /does not set eligibility/);
});

test("Samba observes readiness and does not write qualification, release, or pay", () => {
  const samba = read("lib/services/samba/sambaIntelligenceService.ts");
  const transition = samba.slice(samba.indexOf("export async function transitionSambaFinding"));
  const evaluate = samba.slice(samba.indexOf("export async function evaluateSambaIntelligence"));
  assert.match(samba, /Samba will not change driver status/);
  assert.match(samba, /Samba consumes DriverReadinessScore rather than inventing qualification rules/);
  assert.match(samba, /if \(value === "UNAVAILABLE"\) return \{ finding: "INSUFFICIENT_EVIDENCE"/);
  assert.match(samba, /if \(value === "FIXTURE"\) return \{ finding: "FIXTURE"/);
  assert.doesNotMatch(samba, /recordDriverEligibilityReview|writeQualificationSnapshot/);
  assert.match(transition, /ACKNOWLEDGED/);
  assert.match(transition, /RESOLVED/);
  assert.match(transition, /DISMISSED/);
  assert.match(transition, /mutatedOperationalRecords: false/);
  assert.doesNotMatch(evaluate, /driverReadinessScore\.create|qualificationSnapshot/);
  assert.match(evaluate, /mutatedOperationalRecords: false/);
});
