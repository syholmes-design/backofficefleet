import assert from "node:assert/strict";
import test from "node:test";
import type { RecruitingV2DocumentGateEvaluation } from "@/lib/recruiting-v2/document-gate-engine";
import { recruitingPipelineState, requisitionPipelineCounts, type PipelineCandidateFacts } from "@/lib/recruiting/requisition-pipeline";
import { applicationScreenPasses, evaluateRequisitionScreening, requiredEndorsements } from "@/lib/recruiting/requisition-screening";
import { emptyInterviewResponses, validateStructuredInterview } from "@/lib/recruiting/structured-interview";

const requisition = {
  cdlClass: "A",
  endorsements: "None required (Tanker preferred)",
  experienceRequirements: "2 years verifiable tractor-trailer experience",
  mvrSafetyRequirements: "No major violations in 3 years",
  medicalRequired: true,
  clearinghouseRequired: true,
  pspRequired: true,
};
const profile = (cdlClass: string, experienceYears: number | null) => ({ cdlClass, experienceYears, endorsements: [], equipmentExperience: null, confirmations: {} });

test("screening fails a hard requisition requirement (CDL class B against a Class A requisition)", () => {
  const evaluation = evaluateRequisitionScreening({ requisition, candidate: profile("B", 3), documentGates: [] });
  assert.equal(evaluation.status, "FAIL");
  assert.equal(applicationScreenPasses(evaluation), false);
  assert.match(evaluation.blocking[0], /CDL class/);
});

test("missing documents hold screening pending instead of failing it", () => {
  const evaluation = evaluateRequisitionScreening({ requisition, candidate: profile("A", 4), documentGates: [] });
  assert.equal(evaluation.status, "PENDING");
  assert.equal(applicationScreenPasses(evaluation), true);
  assert.ok(evaluation.pending.some((line) => /MVR/.test(line)));
});

test("a rejected document on file fails its requirement", () => {
  const gate = { documentType: "MVR", gateState: "BLOCKED", latestDocument: { documentCode: "D1" }, label: "MVR", documentStatus: "REJECTED", reason: "Rejected" } as unknown as RecruitingV2DocumentGateEvaluation;
  const evaluation = evaluateRequisitionScreening({ requisition, candidate: profile("A", 4), documentGates: [gate] });
  assert.equal(evaluation.results.find((r) => r.key === "mvr")?.status, "NOT_MET");
});

test("preferred and none endorsements are not required", () => {
  assert.deepEqual(requiredEndorsements("None required (Tanker preferred)"), []);
  assert.deepEqual(requiredEndorsements("Hazmat, Tanker preferred"), ["Hazmat"]);
});

test("requisition counts and pipeline state follow candidate facts", () => {
  const base: PipelineCandidateFacts = { dispositionStatus: "ACTIVE", applicationStatus: "COMPLETE", interviewCompleted: true, offerStatus: "ACCEPTED", activationStatus: "ACTIVE" };
  const rejected: PipelineCandidateFacts = { dispositionStatus: "REJECTED", applicationStatus: "PENDING", interviewCompleted: false, offerStatus: "NOT_PROVIDED", activationStatus: "NOT_STARTED" };
  assert.equal(recruitingPipelineState(true, requisitionPipelineCounts(2, [])), "READY_FOR_RECRUITING");
  const partial = requisitionPipelineCounts(2, [base, rejected]);
  assert.equal(partial.activated, 1);
  assert.equal(partial.rejected, 1);
  assert.equal(partial.remaining, 1);
  assert.equal(recruitingPipelineState(true, partial), "PARTIALLY_FILLED");
  assert.equal(recruitingPipelineState(true, requisitionPipelineCounts(1, [base])), "FILLED");
  assert.equal(recruitingPipelineState(false, partial), "NOT_OPEN");
});

test("structured interview requires evaluations, a recommendation and conditions when proceeding with conditions", () => {
  const errors = validateStructuredInterview({ categories: emptyInterviewResponses(), recommendation: "ADVANCE_WITH_CONDITIONS", conditions: "", decisionNotes: "", interviewer: "" });
  assert.ok(errors.some((e) => /Evaluate/.test(e)));
  assert.ok(errors.includes("Record the conditions for proceeding."));
  assert.ok(errors.includes("Record the interviewer."));
});
