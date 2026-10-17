import assert from "node:assert/strict";
import test from "node:test";
import { buildRecruitingActivationPresentation } from "@/lib/recruiting-v2/activation-presentation";
import type { RecruitingV2ActivationReadiness } from "@/lib/recruiting-v2/activation-engine";

const readyReadiness: RecruitingV2ActivationReadiness = {
  activationStatus: "READY",
  activationStage: "ACTIVATION",
  ready: true,
  readinessReasons: ["Qualification is READY."],
  blockingItems: [],
  pendingItems: [],
  nextRequiredAction: "Review Paylocity Handoff Payload",
  currentDecision: "READY FOR ACTIVATION",
};

test("buildRecruitingActivationPresentation exposes ACTIVE after handoff", () => {
  const view = buildRecruitingActivationPresentation({
    storedActivationStatus: "ACTIVE",
    storedActivationStage: "ACTIVATED",
    activationReadiness: readyReadiness,
    driverHandoff: {
      driverId: "drv_1",
      driverIntakeId: "int_1",
      fleetId: "flt_1",
      activatedAt: new Date().toISOString(),
      activatedByUserId: "usr_1",
      candidateCode: "CAND-001",
    },
    driverOperational: {
      driverId: "drv_1",
      fleetId: "flt_1",
      driverIntakeId: "int_1",
      qualificationStatus: "NOT_QUALIFIED",
      readinessStatus: "NOT_READY",
      qualificationEvaluationState: "AVAILABLE",
      readinessEvaluationState: "AVAILABLE",
      dispatchEligibilityNote: "note",
    },
  });

  assert.equal(view.administrativeActivationStatus, "ACTIVE");
  assert.equal(view.activationStage, "ACTIVATED");
  assert.equal(view.recruitingHandoffEligible, false);
  assert.equal(view.activationReadiness.activationStatus, "ACTIVE");
  assert.match(view.currentRecruitingDecision, /ADMINISTRATIVE ACTIVATION COMPLETE/);
});

test("buildRecruitingActivationPresentation keeps READY before handoff", () => {
  const view = buildRecruitingActivationPresentation({
    storedActivationStatus: "PENDING",
    storedActivationStage: "DRIVER_ACTIVATION_READY",
    activationReadiness: readyReadiness,
    driverHandoff: null,
    driverOperational: null,
  });

  assert.equal(view.administrativeActivationStatus, "PENDING");
  assert.equal(view.recruitingHandoffEligible, true);
  assert.equal(view.activationReadiness.activationStatus, "READY");
});
