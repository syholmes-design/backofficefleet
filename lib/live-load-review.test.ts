import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildLiveLoadReview } from "./live-load-review";
import type { DispatchLoadWorkflowSnapshot } from "./dispatch-workflow-ui";

const base = {
  assignment: { id: "asg" },
  readiness: null,
  readinessError: null,
  preTrip: null,
  latestRelease: null,
} as unknown as DispatchLoadWorkflowSnapshot;

test("a stored not-ready driver stays an open critical review", () => {
  const items = buildLiveLoadReview("cmload1", {
    ...base,
    readiness: {
      status: "NOT_READY",
      summary: "Medical card expired",
      reasonCodes: ["MEDICAL_CARD_EXPIRED"],
    },
  } as DispatchLoadWorkflowSnapshot, null);
  const readiness = items.find((item) => item.id === "readiness");
  assert.ok(readiness);
  assert.equal(readiness.severity, "Critical");
  assert.match(readiness.explanation, /MEDICAL_CARD_EXPIRED/);
  assert.match(readiness.recommendedAction, /does not mark the driver ready/);
  assert.equal(readiness.recordedOutcome, "NOT_READY");
  assert.equal(readiness.href, "/trip-release/cmload1");
});

test("a released ready load with a completed pre-trip has no invented issue", () => {
  const items = buildLiveLoadReview("cmload1", {
    ...base,
    readiness: { status: "READY", summary: "Ready", reasonCodes: [] },
    latestRelease: { disposition: "RELEASED", summary: "Released", reasonCodes: [] },
    preTrip: { status: "COMPLETED", defects: [] },
  } as unknown as DispatchLoadWorkflowSnapshot, null);
  assert.deepEqual(items, []);
});

test("a blocking pre-trip defect uses the stored description", () => {
  const items = buildLiveLoadReview("cmload1", {
    ...base,
    preTrip: {
      status: "BLOCKED",
      defects: [{ severity: "BLOCKING", description: "Brake leak recorded on the pre-trip" }],
    },
  } as unknown as DispatchLoadWorkflowSnapshot, null);
  const preTrip = items.find((item) => item.id === "pretrip");
  assert.ok(preTrip);
  assert.equal(preTrip.severity, "High");
  assert.match(preTrip.explanation, /Brake leak recorded on the pre-trip/);
  assert.match(preTrip.recommendedAction, /does not close defects/);
});

test("the live load page reviews stored workflow records and still submits proof rejection", () => {
  const page = readFileSync("components/dispatch/LoadDetailContent.tsx", "utf8");
  assert.match(page, /buildLiveLoadReview\(load\.id, workflow, workflowError\)/);
  assert.match(page, /The stored workflow snapshot is still loading/);
  assert.doesNotMatch(page, /LoadReviewInlinePanel|useBofDemoData/);
  assert.match(page, /\/api\/dispatch\/load\/\$\{encodeURIComponent\(loadId\)\}\/proof\/reject/);
  assert.match(page, /A rejection reason is required/);
});
