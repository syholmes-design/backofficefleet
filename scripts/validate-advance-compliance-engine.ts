import {
  ADVANCE_COMPLIANCE_POLICIES,
  buildTriggerDate,
  evaluateComplianceTrigger,
  evaluateAdvanceComplianceTrigger,
  getAdvanceCompliancePolicy,
  getConfiguredAdvanceWindowDays,
} from "../lib/advance-compliance-rule";
import { buildRequirementReviewIssue } from "../lib/driver-review-explanation";
import { getDriverReviewExplanation } from "../lib/driver-review-explanation";
import { getDriverActionIssues } from "../lib/driver-action-issues";
import { getBofData } from "../lib/load-bof-data";

const cases = [
  {
    type: "MEDICAL",
    source: "MedicalQualification.expirationDate",
    days: 10,
    action: "Affirm the required medical examination has been scheduled.",
  },
  {
    type: "DRIVER_LICENSE",
    source: "DriverLicense.expirationDate",
    days: 14,
    action: "Confirm the renewal action is scheduled and evidence is ready.",
  },
] as const;

for (const testCase of cases) {
  const policy = ADVANCE_COMPLIANCE_POLICIES[testCase.type];
  if (!policy || policy.authoritativeDateSource !== testCase.source || policy.requiredAction !== testCase.action) {
    throw new Error(`${testCase.type}: policy metadata is incomplete or incorrect`);
  }

  const expiration = new Date("2026-10-27T00:00:00.000Z");
  const triggerDate = buildTriggerDate(expiration, testCase.days, testCase.type);
  if (!triggerDate || getConfiguredAdvanceWindowDays(testCase.type, testCase.days) !== testCase.days) {
    throw new Error(`${testCase.type}: explicit advance window was not applied`);
  }

  const before = evaluateAdvanceComplianceTrigger(
    testCase.type,
    expiration,
    testCase.days,
    new Date(triggerDate.getTime() - 1),
  );
  const atTrigger = evaluateAdvanceComplianceTrigger(
    testCase.type,
    expiration,
    testCase.days,
    triggerDate,
  );
  if (before.isTriggered || !atTrigger.isTriggered || atTrigger.requiredAction !== testCase.action) {
    throw new Error(`${testCase.type}: trigger boundary behavior failed`);
  }

  console.log(JSON.stringify({
    requirementType: testCase.type,
    authoritativeDateSource: policy.authoritativeDateSource,
    configuredAdvanceWindowDays: testCase.days,
    triggerDate: triggerDate.toISOString(),
    beforeTrigger: before.isTriggered,
    atTrigger: atTrigger.isTriggered,
    requiredAction: atTrigger.requiredAction,
  }));
}

const drugTestEvent = { testDate: "2026-04-12", result: "Negative" };
const drugPolicy = getAdvanceCompliancePolicy("DRUG_TEST");
if (!drugTestEvent.testDate || !drugTestEvent.result || !drugPolicy || drugPolicy.triggerKind !== "DUE_DATE") {
  throw new Error("DRUG_TEST: result event or DUE_DATE policy is missing");
}
const noDueDate = evaluateComplianceTrigger(drugPolicy, {}, new Date("2026-10-28T00:00:00.000Z"));
const dueDate = evaluateComplianceTrigger(drugPolicy, { dueDate: "2026-10-27T00:00:00.000Z" }, new Date("2026-10-28T00:00:00.000Z"));
if (noDueDate.isTriggered || !dueDate.isTriggered || dueDate.requiredAction !== drugPolicy.requiredAction) {
  throw new Error("DRUG_TEST: result date must not trigger; explicit requirement due date must trigger");
}
const reviewIssue = buildRequirementReviewIssue({
  id: "req-drug-preemployment",
  driverId: "DRV-001",
  requirementType: "DRUG_TEST",
  label: "Pre-employment Drug & Alcohol testing",
  dueDate: "2026-10-27T00:00:00.000Z",
  actionStatus: "ACTION_REQUIRED",
  requiredAction: drugPolicy.requiredAction,
}, new Date("2026-10-28T00:00:00.000Z"));
if (!reviewIssue || reviewIssue.category !== "credentials" || reviewIssue.recommendedFix !== drugPolicy.requiredAction) {
  throw new Error("DRUG_TEST: due pre-employment requirement did not reach the shared DriverReviewIssue shape");
}
const reviewRequirements = [{
  id: "req-drug-preemployment",
  driverId: "DRV-001",
  requirementType: "DRUG_TEST",
  label: "Pre-employment Drug & Alcohol testing",
  dueDate: "2026-10-27T00:00:00.000Z",
  actionStatus: "ACTION_REQUIRED",
  requiredAction: drugPolicy.requiredAction,
}];
const review = getDriverReviewExplanation(getBofData(), "DRV-001", reviewRequirements);
const reviewPathIssue = review.issues.find((issue) => issue.id === "requirement:req-drug-preemployment");
const actionIssue = getDriverActionIssues("DRV-001", getBofData(), reviewRequirements).find((issue) => issue.title === reviewPathIssue?.title);
if (!reviewPathIssue || !actionIssue || actionIssue.area !== "Documents" || actionIssue.primaryActionHref !== "/drivers/DRV-001/vault") {
  throw new Error("DRUG_TEST: requirement did not traverse DriverReviewExplanation -> DriverActionIssue");
}

for (const unsupported of ["MVR", "TRAINING", "EQUIPMENT", "CARRIER"]) {
  if (ADVANCE_COMPLIANCE_POLICIES[unsupported]) {
    throw new Error(`${unsupported}: unsupported category must remain outside the active engine policy set`);
  }
}

const genericPolicy = (triggerKind: "EXPIRATION" | "DUE_DATE" | "EVENT" | "SCHEDULE" | "CONDITION") => ({
  requirementType: `TEST_${triggerKind}`,
  triggerKind,
  authoritativeDateSource: "test.source",
  requirementLabel: "Test requirement",
  defaultAdvanceWindowDays: 2,
  requiredAction: "Complete the test action.",
  windowSource: "configurable-demo-default" as const,
});
const referenceDate = new Date("2026-10-27T00:00:00.000Z");
const genericCases = [
  ["EXPIRATION", { expirationDate: referenceDate }],
  ["DUE_DATE", { dueDate: referenceDate }],
  ["EVENT", { occurredAt: referenceDate }],
  ["SCHEDULE", { scheduledAt: referenceDate }],
  ["CONDITION", { conditionMet: true }],
] as const;
for (const [kind, source] of genericCases) {
  const result = evaluateComplianceTrigger(genericPolicy(kind), source, new Date("2026-10-28T00:00:00.000Z"));
  if (!result.isTriggered) throw new Error(`${kind}: generic trigger evaluation failed`);
}
console.log(JSON.stringify({ drugTest: { testDate: drugTestEvent.testDate, result: drugTestEvent.result, triggerKind: drugPolicy.triggerKind, expirationInferred: false, withoutDueDateTriggered: noDueDate.isTriggered, withDueDateTriggered: dueDate.isTriggered, reviewIssueId: reviewPathIssue.id, actionArea: actionIssue.area }, triggerKinds: genericCases.map(([kind]) => kind) }));

console.log("validate-advance-compliance-engine: OK");
