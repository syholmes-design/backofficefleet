import assert from "node:assert/strict";
import test from "node:test";
import { computeMarketingSavingsPresentation, describeMarketingSavingsDerivation } from "./marketing-funnel-savings";

const base = {
  powerUnits: 45,
  monthlyLoads: 320,
  avgRevenuePerLoad: 2200,
  compliancePain: "moderate" as const,
  proofPain: "high" as const,
  dispatchSettlementPain: "moderate" as const,
  adminOpsFte: 4,
};

test("savings estimate changes when the visitor changes pain", () => {
  const moderate = computeMarketingSavingsPresentation(base);
  const severe = computeMarketingSavingsPresentation({
    ...base,
    compliancePain: "severe",
    proofPain: "severe",
    dispatchSettlementPain: "severe",
  });
  assert.ok(severe.totalMonthlyUsd > moderate.totalMonthlyUsd);
  assert.ok(severe.operationalLeakageIndex > moderate.operationalLeakageIndex);
});

test("savings estimate states that the result is not a guarantee", () => {
  const result = computeMarketingSavingsPresentation(base);
  assert.equal(result.lineItems.length, 4);
  assert.ok(result.disclaimers.some((line) => /not financial/i.test(line)));
  assert.ok(result.annualizedUsd === result.totalMonthlyUsd * 12);
  const notes = describeMarketingSavingsDerivation(base, result);
  assert.ok(notes.some((line) => /divided by 12/i.test(line)));
  assert.ok(notes.some((line) => /not a verified customer result/i.test(line)));
});

test("invalid fleet scale is clamped to a directional model instead of a blank result", () => {
  const result = computeMarketingSavingsPresentation({
    ...base,
    monthlyLoads: 0,
    avgRevenuePerLoad: 0,
    adminOpsFte: 0,
  });
  assert.equal(result.base.totalLoads, 1);
  assert.equal(result.adminHoursRecoveredMonthly, 0);
});
