export type SafetyPerformanceTier = "Elite" | "Standard" | "At Risk";
export type TireAssetInspection = "Pass" | "Fail";

export type SafetyScorecardRow = {
  driverId: string;
  driverName: string;
  oosViolations: number;
  hosCompliancePct: number;
  maintenancePhotosDate: string;
  tireAssetInspection: TireAssetInspection;
  cargoDamageUsd: number;
  safetyBonusUsd: number;
  performanceTier: SafetyPerformanceTier;
};

export type SafetyViolationActionRow = {
  driverId: string;
  driverShortName: string;
  violations: number;
  code: string | null;
  severity: "Low" | "Medium" | "High";
  action: string;
};

export type SafetyScorecardSummary = {
  scoredDrivers: number;
  eliteTierPct: number;
  atRiskDrivers: number;
  cargoDamageExposureUsd: number;
  safetyBonusEarnedUsd: number;
};

const SAFETY_SCORECARD_ROWS: readonly SafetyScorecardRow[] = [
  {
    driverId: "DRV-001",
    driverName: "John Carter",
    oosViolations: 0,
    hosCompliancePct: 100,
    maintenancePhotosDate: "04/04/2026",
    tireAssetInspection: "Pass",
    cargoDamageUsd: 0,
    safetyBonusUsd: 125,
    performanceTier: "Elite",
  },
  {
    driverId: "DRV-002",
    driverName: "Maria Lopez",
    oosViolations: 0,
    hosCompliancePct: 100,
    maintenancePhotosDate: "04/04/2026",
    tireAssetInspection: "Pass",
    cargoDamageUsd: 0,
    safetyBonusUsd: 125,
    performanceTier: "Elite",
  },
  {
    driverId: "DRV-003",
    driverName: "Alex Kim",
    oosViolations: 0,
    hosCompliancePct: 98,
    maintenancePhotosDate: "03/04/2026",
    tireAssetInspection: "Pass",
    cargoDamageUsd: 0,
    safetyBonusUsd: 75,
    performanceTier: "Standard",
  },
  {
    driverId: "DRV-004",
    driverName: "Priya Patel",
    oosViolations: 1,
    hosCompliancePct: 92,
    maintenancePhotosDate: "02/04/2026",
    tireAssetInspection: "Fail",
    cargoDamageUsd: 250,
    safetyBonusUsd: 25,
    performanceTier: "At Risk",
  },
  {
    driverId: "DRV-005",
    driverName: "Kenji Tanaka",
    oosViolations: 0,
    hosCompliancePct: 99,
    maintenancePhotosDate: "04/04/2026",
    tireAssetInspection: "Pass",
    cargoDamageUsd: 0,
    safetyBonusUsd: 75,
    performanceTier: "Standard",
  },
  {
    driverId: "DRV-006",
    driverName: "Marcus Chen",
    oosViolations: 0,
    hosCompliancePct: 100,
    maintenancePhotosDate: "04/04/2026",
    tireAssetInspection: "Pass",
    cargoDamageUsd: 0,
    safetyBonusUsd: 125,
    performanceTier: "Elite",
  },
  {
    driverId: "DRV-007",
    driverName: "Sofia Gomez",
    oosViolations: 0,
    hosCompliancePct: 100,
    maintenancePhotosDate: "04/04/2026",
    tireAssetInspection: "Pass",
    cargoDamageUsd: 0,
    safetyBonusUsd: 125,
    performanceTier: "Elite",
  },
  {
    driverId: "DRV-008",
    driverName: "Liam Smith",
    oosViolations: 2,
    hosCompliancePct: 85,
    maintenancePhotosDate: "01/04/2026",
    tireAssetInspection: "Fail",
    cargoDamageUsd: 1200,
    safetyBonusUsd: 25,
    performanceTier: "At Risk",
  },
  {
    driverId: "DRV-009",
    driverName: "Emma Brown",
    oosViolations: 0,
    hosCompliancePct: 96,
    maintenancePhotosDate: "03/04/2026",
    tireAssetInspection: "Pass",
    cargoDamageUsd: 0,
    safetyBonusUsd: 75,
    performanceTier: "Standard",
  },
  {
    driverId: "DRV-010",
    driverName: "Noah Wilson",
    oosViolations: 0,
    hosCompliancePct: 100,
    maintenancePhotosDate: "04/04/2026",
    tireAssetInspection: "Pass",
    cargoDamageUsd: 0,
    safetyBonusUsd: 125,
    performanceTier: "Elite",
  },
  {
    driverId: "DRV-011",
    driverName: "Olivia Lee",
    oosViolations: 0,
    hosCompliancePct: 98,
    maintenancePhotosDate: "04/04/2026",
    tireAssetInspection: "Pass",
    cargoDamageUsd: 0,
    safetyBonusUsd: 75,
    performanceTier: "Standard",
  },
];

const SAFETY_VIOLATION_ACTIONS: readonly SafetyViolationActionRow[] = [
  {
    driverId: "DRV-004",
    driverShortName: "P. Patel",
    violations: 1,
    code: "B-102 (Tires)",
    severity: "Medium",
    action: "Immediate Repair & Photo",
  },
  {
    driverId: "DRV-008",
    driverShortName: "L. Smith",
    violations: 2,
    code: "L-405 (HOS)",
    severity: "High",
    action: "24-hr Reset & Safety Review",
  },
];

export function getSafetyScorecardRows(): SafetyScorecardRow[] {
  return [...SAFETY_SCORECARD_ROWS];
}

export function getSafetyScorecardSummary(): SafetyScorecardSummary {
  const rows = getSafetyScorecardRows();
  const scoredDrivers = rows.length;
  const eliteDrivers = rows.filter((r) => r.performanceTier === "Elite").length;
  const atRiskDrivers = rows.filter((r) => r.performanceTier === "At Risk").length;
  const cargoDamageExposureUsd = rows.reduce((sum, r) => sum + r.cargoDamageUsd, 0);
  const safetyBonusEarnedUsd = rows.reduce((sum, r) => sum + r.safetyBonusUsd, 0);
  return {
    scoredDrivers,
    eliteTierPct: scoredDrivers === 0 ? 0 : (eliteDrivers / scoredDrivers) * 100,
    atRiskDrivers,
    cargoDamageExposureUsd,
    safetyBonusEarnedUsd,
  };
}

export function getAtRiskSafetyDrivers(): SafetyScorecardRow[] {
  return getSafetyScorecardRows().filter((r) => r.performanceTier === "At Risk");
}

export function getSafetyViolationActions(): SafetyViolationActionRow[] {
  return [...SAFETY_VIOLATION_ACTIONS];
}

export function getSafetyBonusByDriverId(driverId: string): number {
  return (
    SAFETY_SCORECARD_ROWS.find((r) => r.driverId === driverId)?.safetyBonusUsd ?? 0
  );
}
