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

import {
  DISPATCH_RELEASE_POLICY_VERSION,
  evaluateEquipmentSafety,
  evaluateRelease,
  type DispatchReleaseInputs,
  type OpenConditionThreadSummary,
} from "@/lib/services/dispatchReleaseService";

function minimalPreTrip(
  overrides: Partial<NonNullable<DispatchReleaseInputs["preTrip"]>> = {},
) {
  return {
    id: "pretrip-1",
    status: PreTripStatus.COMPLETED,
    assignmentId: "asg-1",
    fleetId: "fleet-1",
    items: [],
    defects: [],
    ...overrides,
  } as NonNullable<DispatchReleaseInputs["preTrip"]>;
}

function defect(severity: "BLOCKING" | "WARNING", itemCode: string) {
  return {
    id: `defect-${itemCode}`,
    preTripHeaderId: "pretrip-1",
    preTripItemId: null,
    itemCode,
    severity,
    description: itemCode,
    requiresRepair: severity === "BLOCKING",
    createdAt: new Date(),
    updatedAt: new Date(),
  } as NonNullable<DispatchReleaseInputs["preTrip"]>["defects"][number];
}

function minimalEquipment(status: EquipmentStatus, id = "tractor-1") {
  return {
    id,
    fleetId: "fleet-1",
    status,
    unitNumber: "T-100",
  } as DispatchReleaseInputs["tractor"];
}

function baseReleaseInputs(overrides: Partial<DispatchReleaseInputs> = {}): DispatchReleaseInputs {
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
    tractor: minimalEquipment(EquipmentStatus.AVAILABLE),
    trailer: null,
    preTrip: minimalPreTrip(),
    openTractorConditions: [],
    openTrailerConditions: [],
    readiness: {
      id: "ready-1",
      status: DriverReadinessState.READY,
      reasonCodes: [],
      summary: "Ready",
      policyVersion: "bof-step9-readiness-v1",
      evaluatedAt: new Date(),
      evaluatedByUserId: "user-1",
    },
    ...overrides,
  };
}

function openCriticalCondition(equipmentId: string): OpenConditionThreadSummary {
  return {
    id: `cond-${equipmentId}`,
    equipmentId,
    lifecycleState: ConditionLifecycleState.CONFIRMED,
    severity: ConditionSeverity.CRITICAL,
    impact: ConditionImpact.SAFETY_RISK,
    title: "Brake defect",
  };
}

test("EQ-01: open safety-critical condition blocks movement evaluation", () => {
  const inputs = baseReleaseInputs({
    openTractorConditions: [openCriticalCondition("tractor-1")],
  });
  const equipment = evaluateEquipmentSafety(inputs);
  assert.equal(equipment.blocked, true);
  assert.ok(equipment.reasonCodes.includes("SAFETY_CRITICAL_CONDITION"));

  const evaluation = evaluateRelease(inputs);
  assert.equal(evaluation.disposition, DispatchReleaseDisposition.BLOCKED);
  assert.ok(evaluation.reasonCodes.includes("SAFETY_CRITICAL_CONDITION"));
  assert.equal(evaluation.policyVersion, DISPATCH_RELEASE_POLICY_VERSION);
});

test("EQ-04: UNAVAILABLE tractor blocks equipment evaluation", () => {
  const inputs = baseReleaseInputs({
    tractor: minimalEquipment(EquipmentStatus.UNAVAILABLE),
  });
  const equipment = evaluateEquipmentSafety(inputs);
  assert.equal(equipment.blocked, true);
  assert.ok(equipment.reasonCodes.includes("TRUCK_UNAVAILABLE"));
  assert.equal(evaluateRelease(inputs).disposition, DispatchReleaseDisposition.BLOCKED);
});

test("OUT_OF_SERVICE tractor blocks with TRUCK_OUT_OF_SERVICE", () => {
  const inputs = baseReleaseInputs({
    tractor: minimalEquipment(EquipmentStatus.OUT_OF_SERVICE),
  });
  const equipment = evaluateEquipmentSafety(inputs);
  assert.equal(equipment.blocked, true);
  assert.ok(equipment.reasonCodes.includes("TRUCK_OUT_OF_SERVICE"));
});

test("blocking pre-trip defect blocks movement", () => {
  const inputs = baseReleaseInputs({
    preTrip: minimalPreTrip({
      status: PreTripStatus.BLOCKED,
      defects: [defect("BLOCKING", "tires")],
    }),
  });
  const equipment = evaluateEquipmentSafety(inputs);
  assert.equal(equipment.blocked, true);
  assert.ok(equipment.reasonCodes.includes("PRETRIP_DEFECT"));
});

test("missing pre-trip blocks as PRETRIP_INCOMPLETE", () => {
  const inputs = baseReleaseInputs({ preTrip: null });
  const equipment = evaluateEquipmentSafety(inputs);
  assert.equal(equipment.blocked, true);
  assert.ok(equipment.reasonCodes.includes("PRETRIP_INCOMPLETE"));
});

test("valid equipment with completed pre-trip and no blocking conditions clears", () => {
  const inputs = baseReleaseInputs();
  const equipment = evaluateEquipmentSafety(inputs);
  assert.equal(equipment.blocked, false);
  assert.equal(equipment.hold, false);

  const evaluation = evaluateRelease(inputs);
  assert.equal(evaluation.disposition, DispatchReleaseDisposition.RELEASED);
  assert.deepEqual(
    evaluation.reasonCodes.filter((code) =>
      ["TRUCK_UNAVAILABLE", "PRETRIP_DEFECT", "SAFETY_CRITICAL_CONDITION"].includes(code),
    ),
    [],
  );
});

test("warning-only pre-trip defect yields HOLD when driver is ready", () => {
  const inputs = baseReleaseInputs({
    preTrip: minimalPreTrip({
      status: PreTripStatus.COMPLETED,
      defects: [defect("WARNING", "mirror")],
    }),
  });
  const equipment = evaluateEquipmentSafety(inputs);
  assert.equal(equipment.blocked, false);
  assert.equal(equipment.hold, true);

  const evaluation = evaluateRelease(inputs);
  assert.equal(evaluation.disposition, DispatchReleaseDisposition.HOLD);
  assert.ok(evaluation.reasonCodes.includes("PRETRIP_DEFECT"));
});

test("resolved condition threads do not block", () => {
  const inputs = baseReleaseInputs({
    openTractorConditions: [
      {
        id: "cond-resolved",
        equipmentId: "tractor-1",
        lifecycleState: ConditionLifecycleState.RESOLVED,
        severity: ConditionSeverity.CRITICAL,
        impact: ConditionImpact.SAFETY_RISK,
        title: "Resolved",
      },
    ],
  });
  assert.equal(evaluateEquipmentSafety(inputs).blocked, false);
});

test("assertMovementAuthorizationAllowed rejects BLOCKED disposition", async () => {
  const { assertMovementAuthorizationAllowed } = await import("@/lib/services/dispatchReleaseService");
  assert.throws(
    () =>
      assertMovementAuthorizationAllowed({
        disposition: DispatchReleaseDisposition.BLOCKED,
        reasonCodes: ["SAFETY_CRITICAL_CONDITION"],
        summary: "blocked",
        policyVersion: DISPATCH_RELEASE_POLICY_VERSION,
      }),
    (error: Error & { statusCode?: number }) => {
      assert.equal(error.statusCode, 409);
      return true;
    },
  );
});
