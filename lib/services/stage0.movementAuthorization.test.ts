import assert from "node:assert/strict";
import test from "node:test";

import {
  ConditionImpact,
  ConditionLifecycleState,
  ConditionSeverity,
  DispatchReleaseDisposition,
  DriverReadinessState,
  EquipmentStatus,
  PreTripStatus,
} from "@prisma/client";

import type { AuthoritativeDriverQualification } from "@/lib/services/authoritativeDriverQualificationService";
import {
  composeMovementAuthorization,
  composePlanningAuthorization,
  MOVEMENT_AUTHORIZATION_POLICY_VERSION,
} from "@/lib/services/dispatchMovementAuthorizationService";
import {
  evaluateReleaseWithDriverQualification,
  type DispatchReleaseInputs,
} from "@/lib/services/dispatchReleaseService";
import { isSafetyCriticalOpenCondition } from "@/lib/services/equipmentSafetyPredicates";

function qual(overrides: Partial<AuthoritativeDriverQualification> = {}): AuthoritativeDriverQualification {
  return {
    status: "QUALIFIED",
    qualificationSnapshotId: null,
    reasonCodes: [],
    summary: "Qualified",
    policyVersion: "bof-stage0-driver-qualification-v1",
    conditionalMovementPermitted: true,
    evaluatedAt: new Date(),
    ...overrides,
  };
}

function releaseInputs(overrides: Partial<DispatchReleaseInputs> = {}): DispatchReleaseInputs {
  const tractor = {
    id: "tractor-1",
    fleetId: "fleet-1",
    status: EquipmentStatus.AVAILABLE,
    unitNumber: "T-1",
  } as DispatchReleaseInputs["tractor"];

  return {
    load: { id: "load-1", fleetId: "fleet-1" } as DispatchReleaseInputs["load"],
    assignment: {
      id: "asg-1",
      loadId: "load-1",
      fleetId: "fleet-1",
      driverId: "driver-1",
      tractorEquipmentId: "tractor-1",
      trailerEquipmentId: null,
      load: { id: "load-1", fleetId: "fleet-1" } as DispatchReleaseInputs["load"],
      driver: { id: "driver-1", fleetId: "fleet-1" },
    } as DispatchReleaseInputs["assignment"],
    tractor,
    trailer: null,
    preTrip: {
      id: "pretrip-1",
      status: PreTripStatus.COMPLETED,
      assignmentId: "asg-1",
      fleetId: "fleet-1",
      items: [],
      defects: [],
    } as unknown as NonNullable<DispatchReleaseInputs["preTrip"]>,
    openTractorConditions: [],
    openTrailerConditions: [],
    readiness: {
      id: "legacy-readiness",
      status: DriverReadinessState.READY,
      reasonCodes: [],
      summary: "ignored",
      policyVersion: "legacy",
      evaluatedAt: new Date(),
      evaluatedByUserId: null,
    },
    ...overrides,
  };
}

test("QUALIFIED driver with safe equipment is RELEASED at movement stage", () => {
  const result = composeMovementAuthorization("RELEASE", qual(), releaseInputs());
  assert.equal(result.allowed, true);
  assert.equal(result.disposition, "RELEASED");
  assert.equal(result.policyVersion, MOVEMENT_AUTHORIZATION_POLICY_VERSION);
});

test("CONDITIONAL driver with legally permissible movement is CONDITIONALLY_RELEASED", () => {
  const result = composeMovementAuthorization(
    "PICKUP_ISSUE",
    qual({
      status: "CONDITIONAL",
      reasonCodes: ["WORK_HISTORY_GAP_REVIEW_REQUIRED"],
      conditionalMovementPermitted: true,
    }),
    releaseInputs(),
  );
  assert.equal(result.allowed, true);
  assert.equal(result.disposition, "CONDITIONALLY_RELEASED");
});

test("PENDING_COMPLIANCE denies movement", () => {
  const result = composeMovementAuthorization(
    "RELEASE",
    qual({ status: "PENDING_COMPLIANCE", reasonCodes: ["CLEARINGHOUSE_PRE_EMPLOYMENT_QUERY_MISSING"] }),
    releaseInputs(),
  );
  assert.equal(result.allowed, false);
  assert.equal(result.disposition, "BLOCKED");
  assert.ok(result.reasonCodes.includes("CLEARINGHOUSE_PRE_EMPLOYMENT_QUERY_MISSING"));
});

test("NOT_QUALIFIED denies movement", () => {
  const result = composeMovementAuthorization(
    "PICKUP_VERIFY",
    qual({ status: "NOT_QUALIFIED", reasonCodes: ["DRIVER_LICENSE_REJECTED"] }),
    releaseInputs(),
  );
  assert.equal(result.allowed, false);
  assert.ok(result.reasonCodes.includes("DRIVER_LICENSE_REJECTED"));
});

test("OUT_OF_SERVICE equipment denies movement and planning", () => {
  const inputs = releaseInputs({
    tractor: { ...releaseInputs().tractor, status: EquipmentStatus.OUT_OF_SERVICE },
  });
  const movement = composeMovementAuthorization("RELEASE", qual(), inputs);
  assert.equal(movement.allowed, false);
  assert.ok(movement.reasonCodes.includes("TRUCK_OUT_OF_SERVICE"));

  const planning = composeMovementAuthorization("PLANNING_RESERVE", qual(), inputs);
  assert.equal(planning.allowed, false);
  assert.equal(planning.disposition, "PLANNING_DENIED");
});

test("UNAVAILABLE equipment denies movement but allows planning", () => {
  const inputs = releaseInputs({
    tractor: { ...releaseInputs().tractor, status: EquipmentStatus.UNAVAILABLE },
  });
  const movement = composeMovementAuthorization("RELEASE", qual(), inputs);
  assert.equal(movement.allowed, false);
  assert.ok(movement.reasonCodes.includes("TRUCK_UNAVAILABLE"));

  const planning = composeMovementAuthorization("PLANNING_RESERVE", qual(), inputs);
  assert.equal(planning.allowed, true);
  assert.equal(planning.disposition, "PLANNING_ALLOWED");
});

test("blocking pre-trip defect denies movement", () => {
  const inputs = releaseInputs({
    preTrip: {
      ...releaseInputs().preTrip!,
      status: PreTripStatus.BLOCKED,
      defects: [
        {
          id: "d1",
          preTripHeaderId: "pretrip-1",
          preTripItemId: null,
          itemCode: "tires",
          severity: "BLOCKING",
          description: "tires",
          requiresRepair: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    },
  });
  const result = composeMovementAuthorization("RELEASE", qual(), inputs);
  assert.equal(result.allowed, false);
  assert.ok(result.reasonCodes.includes("PRETRIP_DEFECT"));
});

test("open safety-critical ConditionThread denies movement", () => {
  const inputs = releaseInputs({
    openTractorConditions: [
      {
        id: "c1",
        equipmentId: "tractor-1",
        lifecycleState: ConditionLifecycleState.CONFIRMED,
        severity: ConditionSeverity.CRITICAL,
        impact: ConditionImpact.SAFETY_RISK,
        title: "Brakes",
      },
    ],
  });
  const movement = composeMovementAuthorization("RELEASE", qual(), inputs);
  assert.equal(movement.allowed, false);
  assert.ok(movement.reasonCodes.includes("SAFETY_CRITICAL_CONDITION"));

  const planning = composeMovementAuthorization("PLANNING_RESERVE", qual(), inputs);
  assert.equal(planning.allowed, true);
});

test("non-critical open condition does not block movement evaluation", () => {
  assert.equal(
    isSafetyCriticalOpenCondition({
      lifecycleState: ConditionLifecycleState.IDENTIFIED,
      severity: ConditionSeverity.MODERATE,
      impact: ConditionImpact.COSMETIC_ONLY,
    }),
    false,
  );
  const inputs = releaseInputs({
    openTractorConditions: [
      {
        id: "c2",
        equipmentId: "tractor-1",
        lifecycleState: ConditionLifecycleState.IDENTIFIED,
        severity: ConditionSeverity.MODERATE,
        impact: ConditionImpact.COSMETIC_ONLY,
        title: "Cosmetic scratch",
      },
    ],
  });
  const result = composeMovementAuthorization("RELEASE", qual(), inputs);
  assert.equal(result.allowed, true);
});

test("driver and equipment both disqualified include both reason sets", () => {
  const inputs = releaseInputs({
    tractor: { ...releaseInputs().tractor, status: EquipmentStatus.UNAVAILABLE },
  });
  const result = composeMovementAuthorization(
    "RELEASE",
    qual({ status: "NOT_QUALIFIED", reasonCodes: ["DRIVER_LICENSE_REJECTED"] }),
    inputs,
  );
  assert.equal(result.allowed, false);
  assert.ok(result.reasonCodes.includes("DRIVER_LICENSE_REJECTED"));
  assert.ok(result.reasonCodes.includes("TRUCK_UNAVAILABLE"));
});

test("evaluateReleaseWithDriverQualification ignores stale readiness NOT_READY when driver is QUALIFIED", () => {
  const evaluation = evaluateReleaseWithDriverQualification(
    releaseInputs({
      readiness: {
        id: "stale",
        status: DriverReadinessState.NOT_READY,
        reasonCodes: ["STALE"],
        summary: "stale",
        policyVersion: "legacy",
        evaluatedAt: new Date(),
        evaluatedByUserId: null,
      },
    }),
    qual(),
  );
  assert.equal(evaluation.disposition, DispatchReleaseDisposition.RELEASED);
});

test("composePlanningAuthorization exposes driverQualificationStatus from I-1 evaluator shape", () => {
  const inputs = releaseInputs();
  const result = composePlanningAuthorization(
    qual({ status: "PENDING_COMPLIANCE", reasonCodes: ["CLEARINGHOUSE_PRE_EMPLOYMENT_QUERY_MISSING"] }),
    { tractor: inputs.tractor, trailer: inputs.trailer },
  );
  assert.equal(result.driverQualificationStatus, "PENDING_COMPLIANCE");
  assert.equal(result.allowed, false);
});

test("CONDITIONAL without movement permission is denied", () => {
  const result = composeMovementAuthorization(
    "RELEASE",
    qual({
      status: "CONDITIONAL",
      conditionalMovementPermitted: false,
      reasonCodes: ["MANUAL_REVIEW_REQUIRED"],
    }),
    releaseInputs(),
  );
  assert.equal(result.allowed, false);
});
