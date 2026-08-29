import type { BofData } from "./load-bof-data";
import {
  buildCanonicalEquipmentSpine,
  evaluateEquipmentOperationalState,
  type CanonicalEquipmentRecord,
  type EquipmentOperationalEvaluation,
} from "./canonical-equipment-spine";

export type DemoEquipmentScenarioState = {
  availableDriverLimit: number;
  availableEquipmentLimit: number;
  equipmentOosCount: number;
  maintenanceHoldCount: number;
  loadDemandAdjustment: number;
};

export const NORMAL_DEMO_SCENARIO: DemoEquipmentScenarioState = {
  availableDriverLimit: 12,
  availableEquipmentLimit: 24,
  equipmentOosCount: 0,
  maintenanceHoldCount: 0,
  loadDemandAdjustment: 0,
};

export const DEMO_SCENARIO_PRESETS = {
  normal: { label: "Normal Operations", state: NORMAL_DEMO_SCENARIO },
  capacity: {
    label: "Capacity Crunch",
    state: {
      ...NORMAL_DEMO_SCENARIO,
      availableDriverLimit: 9,
      availableEquipmentLimit: 21,
      loadDemandAdjustment: 3,
    },
  },
  maintenance: {
    label: "Maintenance Event",
    state: {
      ...NORMAL_DEMO_SCENARIO,
      availableEquipmentLimit: 22,
      maintenanceHoldCount: 2,
    },
  },
  recovery: { label: "Recovery", state: NORMAL_DEMO_SCENARIO },
} as const;

export type DemoEquipmentScenarioPreset = keyof typeof DEMO_SCENARIO_PRESETS;

export type DemoEquipmentScenarioRow = {
  record: CanonicalEquipmentRecord;
  evaluation: EquipmentOperationalEvaluation;
  scenarioReasons: string[];
};

export type DemoEquipmentScenarioResult = {
  state: DemoEquipmentScenarioState;
  rows: DemoEquipmentScenarioRow[];
  availableDriverIds: string[];
  affectedDriverIds: string[];
  activeAssignments: number;
  affectedAssignmentCount: number;
  openLoadDemand: number;
  exceptions: string[];
  affectedEquipmentIds: string[];
  changedSummary: string[];
  provenance: "DEMO_ONLY";
};

function clampInteger(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function baseOfflineIds(rows: DemoEquipmentScenarioRow[]): string[] {
  return rows
    .filter((row) => row.evaluation.availability === "UNAVAILABLE")
    .map((row) => row.record.canonicalAssetId);
}

function deriveUnavailableIds(
  rows: DemoEquipmentScenarioRow[],
  state: DemoEquipmentScenarioState,
): { equipmentOosIds: string[]; maintenanceHoldIds: string[]; unavailableIds: string[] } {
  const baseline = baseOfflineIds(rows);
  const availableIds = rows
    .filter((row) => !baseline.includes(row.record.canonicalAssetId))
    .map((row) => row.record.canonicalAssetId);
  const equipmentOosIds = availableIds.slice(0, state.equipmentOosCount);
  const remainingIds = availableIds.filter((id) => !equipmentOosIds.includes(id));
  const maintenanceHoldIds = remainingIds.slice(0, state.maintenanceHoldCount);
  const targetUnavailableCount = rows.length - state.availableEquipmentLimit;
  const capacityIds = availableIds
    .filter((id) => !equipmentOosIds.includes(id) && !maintenanceHoldIds.includes(id))
    .slice(0, Math.max(0, targetUnavailableCount - baseline.length - equipmentOosIds.length - maintenanceHoldIds.length));
  return {
    equipmentOosIds,
    maintenanceHoldIds,
    unavailableIds: unique([...baseline, ...equipmentOosIds, ...maintenanceHoldIds, ...capacityIds]),
  };
}

export function buildDemoEquipmentScenario(
  data: BofData,
  input: DemoEquipmentScenarioState,
): DemoEquipmentScenarioResult {
  const baseRecords = buildCanonicalEquipmentSpine(data, [], "DEMO");
  const state: DemoEquipmentScenarioState = {
    availableDriverLimit: clampInteger(input.availableDriverLimit, 0, data.drivers.length),
    availableEquipmentLimit: clampInteger(input.availableEquipmentLimit, 0, baseRecords.length),
    equipmentOosCount: clampInteger(input.equipmentOosCount, 0, baseRecords.length),
    maintenanceHoldCount: clampInteger(input.maintenanceHoldCount, 0, baseRecords.length),
    loadDemandAdjustment: clampInteger(input.loadDemandAdjustment, -data.loads.length, data.loads.length),
  };
  const provisionalRows = baseRecords.map((record) => ({
    record,
    evaluation: evaluateEquipmentOperationalState(record),
    scenarioReasons: [],
  }));
  const overrides = deriveUnavailableIds(provisionalRows, state);
  const rows = baseRecords.map((record) => {
    const isOos = overrides.equipmentOosIds.includes(record.canonicalAssetId);
    const isMaintenanceHeld = overrides.maintenanceHoldIds.includes(record.canonicalAssetId);
    const evaluation = evaluateEquipmentOperationalState(record, {
      outOfService: isOos || overrides.unavailableIds.includes(record.canonicalAssetId),
      maintenanceBlock: isMaintenanceHeld ? "DEMO maintenance hold" : undefined,
    });
    const scenarioReasons = [
      ...(isOos ? ["Placed OOS for this DEMO scenario."] : []),
      ...(isMaintenanceHeld ? ["Held for maintenance in this DEMO scenario."] : []),
      ...(state.availableEquipmentLimit < baseRecords.length && overrides.unavailableIds.includes(record.canonicalAssetId) && !isOos && !isMaintenanceHeld
        ? ["Unavailable because scenario equipment capacity was reduced."]
        : []),
    ];
    return { record, evaluation, scenarioReasons };
  });
  const driverIds = data.drivers.map((driver) => driver.id);
  const availableDriverIds = driverIds.slice(0, state.availableDriverLimit);
  const assignedRows = rows.filter((row) => row.record.currentAssignment.value);
  const affectedAssignments = assignedRows.filter((row) => {
    const driverId = String(row.record.currentAssignment.value);
    return row.evaluation.dispatchability === "NOT_DISPATCHABLE" || !availableDriverIds.includes(driverId);
  });
  const affectedDriverIds = unique(affectedAssignments
    .map((row) => String(row.record.currentAssignment.value))
    .filter((id) => !availableDriverIds.includes(id)));
  const openLoadDemand = Math.max(0, data.loads.length + state.loadDemandAdjustment);
  const dispatchableCount = rows.filter((row) => row.evaluation.dispatchability === "DISPATCHABLE").length;
  const exceptions = [
    ...rows.filter((row) => row.evaluation.dispatchability === "NOT_DISPATCHABLE").map((row) => `${row.record.canonicalAssetId} is not dispatchable: ${row.evaluation.reasons.join(" ")}`),
    ...(affectedDriverIds.length ? [`${affectedDriverIds.join(", ")} fell below the available-driver limit.`] : []),
    ...(openLoadDemand > dispatchableCount ? [`Open demand exceeds dispatchable Equipment by ${openLoadDemand - dispatchableCount}.`] : []),
  ];
  const affectedEquipmentIds = rows.filter((row) => row.scenarioReasons.length > 0 || row.evaluation.dispatchability === "NOT_DISPATCHABLE")
    .map((row) => row.record.canonicalAssetId);
  const changedSummary = [
    `Available Drivers: ${availableDriverIds.length} of ${driverIds.length}.`,
    `Available Equipment: ${rows.filter((row) => row.evaluation.availability === "AVAILABLE").length} of ${rows.length}.`,
    `Open load demand: ${openLoadDemand}.`,
    ...(affectedAssignments.length
      ? [`${affectedAssignments.length} active assignment${affectedAssignments.length === 1 ? "" : "s"} ${affectedAssignments.length === 1 ? "requires" : "require"} attention.`]
      : ["No active assignments are affected."]),
  ];
  return {
    state,
    rows,
    availableDriverIds,
    affectedDriverIds,
    activeAssignments: assignedRows.length,
    affectedAssignmentCount: affectedAssignments.length,
    openLoadDemand,
    exceptions,
    affectedEquipmentIds,
    changedSummary,
    provenance: "DEMO_ONLY",
  };
}