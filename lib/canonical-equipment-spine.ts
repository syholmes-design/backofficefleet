import type { BofData } from "./load-bof-data";
import { createCanonicalV2Assets, createSeedTractors } from "./dispatch-dashboard-seed";
import type { Asset } from "./v3-operational-types";

export type EquipmentFieldProvenance =
  | "AUTHORITATIVE"
  | "DERIVED"
  | "REFERENCE"
  | "LEGACY"
  | "DEMO_ONLY"
  | "MISSING"
  | "CONFLICTING"
  | "UNKNOWN";

export type EquipmentSourceValue = {
  value: string | number | boolean | null;
  source: "V2" | "V3_V4" | "DEMO" | "PRISMA";
  provenance: EquipmentFieldProvenance;
};

export type CanonicalEquipmentRecord = {
  canonicalAssetId: string;
  unitNumber: EquipmentSourceValue;
  equipmentType: EquipmentSourceValue;
  vin: EquipmentSourceValue;
  fleetId: EquipmentSourceValue;
  currentAssignment: EquipmentSourceValue;
  sourceAssignment: EquipmentSourceValue;
  sourceStatus: EquipmentSourceValue;
  operationalStatus: EquipmentSourceValue;
  serviceStatus: EquipmentSourceValue;
  lastServiceDate: EquipmentSourceValue;
  nextServiceDate: EquipmentSourceValue;
  lastMaintenanceDate: EquipmentSourceValue;
  nextPmDue: EquipmentSourceValue;
  dotInspectionDue: EquipmentSourceValue;
  registrationExpiry: EquipmentSourceValue;
  insuranceExpiry: EquipmentSourceValue;
  mileage: EquipmentSourceValue;
  engineHours: EquipmentSourceValue;
  readiness: EquipmentSourceValue;
  outOfService: EquipmentSourceValue;
  unresolvedConflicts: string[];
};

export type EquipmentAvailability = "AVAILABLE" | "UNAVAILABLE" | "PENDING_LIVE_RECONCILIATION";
export type EquipmentAssignability = "ASSIGNABLE" | "NOT_ASSIGNABLE" | "ASSIGNABILITY_NOT_ESTABLISHED";

export type EquipmentOperationalEvaluation = {
  availability: EquipmentAvailability;
  assignability: EquipmentAssignability;
  readiness: "READY" | "NOT_READY" | "READINESS_NOT_ESTABLISHED";
  dispatchability: "DISPATCHABLE" | "NOT_DISPATCHABLE" | "DISPATCHABILITY_NOT_ESTABLISHED";
  reasons: string[];
};

export type EquipmentOperationalInputs = {
  status?: string;
  blockingDefect?: boolean;
  outOfService?: boolean;
  maintenanceBlock?: string;
};

export type EquipmentAuthorityMode = "DEMO" | "LIVE";

const pendingPrisma = (field: string): EquipmentSourceValue => ({
  value: null,
  source: "PRISMA",
  provenance: field === "fleetId" || field === "operationalStatus" ? "UNKNOWN" : "MISSING",
});

function reference(value: string | number | boolean | null): EquipmentSourceValue {
  return { value, source: "V3_V4", provenance: "REFERENCE" };
}

function v2(value: string | number | boolean | null): EquipmentSourceValue {
  return { value, source: "V2", provenance: "AUTHORITATIVE" };
}

function demo(value: string | null): EquipmentSourceValue {
  return { value, source: "DEMO", provenance: "DEMO_ONLY" };
}

function demoStatus(value: string | null): EquipmentSourceValue {
  return { value, source: "DEMO", provenance: "DEMO_ONLY" };
}

function missing(source: "V2" | "V3_V4"): EquipmentSourceValue {
  return { value: null, source, provenance: "MISSING" };
}

export function buildCanonicalEquipmentSpine(
  data: BofData,
  operationalAssets: Asset[] = [],
  mode: EquipmentAuthorityMode = "LIVE",
): CanonicalEquipmentRecord[] {
  const v3ById = new Map(operationalAssets.map((asset) => [asset.assetId, asset]));
  const generatedStatusById = new Map(createSeedTractors().map((tractor) => [tractor.tractor_id, tractor.status]));
  return createCanonicalV2Assets().map(({ asset_id: canonicalAssetId, unit_number: unitNumber }) => {
    const asset = v3ById.get(canonicalAssetId);
    const sourceAssignments = data.loads
      .filter((load) => load.assetId === canonicalAssetId)
      .map((load) => load.driverId)
      .filter(Boolean);
    const uniqueAssignments = [...new Set(sourceAssignments)];
    const conflicts: string[] = [];
    if (uniqueAssignments.length > 1) conflicts.push("Multiple demo load driver assignments");
    if (!asset) conflicts.push("V3/V4 asset row unavailable");

    return {
      canonicalAssetId,
      unitNumber: v2(unitNumber),
      equipmentType: asset ? reference(asset.assetType || null) : missing("V3_V4"),
      vin: asset ? reference(asset.vin || null) : missing("V3_V4"),
      fleetId: mode === "DEMO" ? demo("DEMO_ONLY") : pendingPrisma("fleetId"),
      currentAssignment: mode === "DEMO" ? demo(uniqueAssignments[0] ?? null) : pendingPrisma("currentAssignment"),
      sourceAssignment: demo(uniqueAssignments[0] ?? null),
      sourceStatus: mode === "DEMO"
        ? asset
          ? reference(asset.status || null)
          : demoStatus(generatedStatusById.get(canonicalAssetId) ?? null)
        : pendingPrisma("operationalStatus"),
      operationalStatus: mode === "DEMO"
        ? demoStatus(asset?.status || generatedStatusById.get(canonicalAssetId) || null)
        : pendingPrisma("operationalStatus"),
      serviceStatus: asset ? reference(asset.status || null) : missing("V2"),
      lastServiceDate: missing("V2"),
      nextServiceDate: missing("V2"),
      lastMaintenanceDate: asset ? reference(asset.lastMaintenanceDate || null) : missing("V3_V4"),
      nextPmDue: asset ? reference(asset.nextPmDue || null) : missing("V3_V4"),
      dotInspectionDue: asset ? reference(asset.dotInspectionDue || null) : missing("V3_V4"),
      registrationExpiry: asset ? reference(asset.registrationExpiry || null) : missing("V3_V4"),
      insuranceExpiry: asset ? reference(asset.insuranceExpiry || null) : missing("V3_V4"),
      mileage: asset ? reference(asset.mileage ?? null) : missing("V3_V4"),
      engineHours: missing("V3_V4"),
      readiness: mode === "DEMO"
        ? demoStatus((asset?.readinessStatus || generatedStatusById.get(canonicalAssetId) || "").toString())
        : {
            value: "UNRESOLVED_PENDING_LIVE_RECONCILIATION",
            source: "PRISMA",
            provenance: "UNKNOWN",
          },
      outOfService: mode === "DEMO"
        ? demoStatus(generatedStatusById.get(canonicalAssetId) === "Unavailable" ? "true" : "false")
        : pendingPrisma("outOfService"),
      unresolvedConflicts: conflicts,
    };
  });
}

export function evaluateEquipmentOperationalState(
  record: CanonicalEquipmentRecord,
  preTrip?: EquipmentOperationalInputs,
): EquipmentOperationalEvaluation {
  const reasons: string[] = [];
  const durableStatus = String(record.operationalStatus.value ?? "");
  const sourceStatus = String(record.sourceStatus.value ?? "").toLowerCase();
  const availability: EquipmentAvailability = durableStatus || preTrip?.outOfService === true
    ? durableStatus === "OUT_OF_SERVICE" || durableStatus === "Unavailable"
      ? "UNAVAILABLE"
      : preTrip?.outOfService === true
        ? "UNAVAILABLE"
      : "AVAILABLE"
    : "PENDING_LIVE_RECONCILIATION";

  if (availability === "PENDING_LIVE_RECONCILIATION") reasons.push("Durable Equipment status pending live reconciliation");
  if (sourceStatus === "unavailable") reasons.push("Canonical source marks equipment unavailable");
  if (preTrip?.outOfService || record.outOfService.value === true) reasons.push("Equipment is out of service");
  if (preTrip?.blockingDefect) reasons.push("Pre-trip has a blocking defect");
  if (preTrip?.status && preTrip.status !== "COMPLETED") reasons.push("Pre-trip is incomplete");
  if (preTrip?.maintenanceBlock) reasons.push(preTrip.maintenanceBlock);

  const assignability: EquipmentAssignability = availability === "UNAVAILABLE"
    ? "NOT_ASSIGNABLE"
    : record.currentAssignment.provenance === "MISSING" && record.currentAssignment.source === "PRISMA"
      ? "ASSIGNABILITY_NOT_ESTABLISHED"
      : "ASSIGNABLE";
  if (assignability === "ASSIGNABILITY_NOT_ESTABLISHED") reasons.push("Current durable assignment pending live reconciliation");

  const blocked = availability === "UNAVAILABLE"
    || preTrip?.outOfService === true
    || preTrip?.blockingDefect === true
    || Boolean(preTrip?.maintenanceBlock);
  const readiness = blocked
    ? "NOT_READY"
    : record.readiness.value === "UNRESOLVED_PENDING_LIVE_RECONCILIATION"
      ? "READINESS_NOT_ESTABLISHED"
      : "READY";
  if (readiness === "READINESS_NOT_ESTABLISHED") reasons.push("Equipment readiness pending live reconciliation");

  return {
    availability,
    assignability,
    readiness,
    dispatchability: readiness === "NOT_READY"
      ? "NOT_DISPATCHABLE"
      : readiness === "READINESS_NOT_ESTABLISHED" || assignability === "ASSIGNABILITY_NOT_ESTABLISHED"
        ? "DISPATCHABILITY_NOT_ESTABLISHED"
        : "DISPATCHABLE",
    reasons,
  };
}

export function getCanonicalEquipmentRecord(
  data: BofData,
  assetId: string,
  operationalAssets: Asset[] = [],
  mode: EquipmentAuthorityMode = "LIVE",
): CanonicalEquipmentRecord | null {
  return buildCanonicalEquipmentSpine(data, operationalAssets, mode).find((record) => record.canonicalAssetId === assetId) ?? null;
}
