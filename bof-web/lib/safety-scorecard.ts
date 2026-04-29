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

export type SafetyEvidenceSeverity = "medium" | "high";

export type SafetyEvidenceItem = {
  id: string;
  driverId: string;
  driverName: string;
  loadId?: string;
  type:
    | "tire_inspection"
    | "hos_violation"
    | "cargo_damage_photo"
    | "safety_equipment_inspection"
    | "logbook_review"
    | "trailer_brake_inspection";
  label: string;
  severity: SafetyEvidenceSeverity;
  url: string;
  note: string;
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

const SAFETY_EVIDENCE_REGISTRY: readonly SafetyEvidenceItem[] = [
  {
    id: "EVID-DRV-004-B102",
    driverId: "DRV-004",
    driverName: "Priya Patel",
    loadId: "L004",
    type: "tire_inspection",
    label: "B-102 Tires",
    severity: "medium",
    url: "/evidence/safety/p_patel_b102_tire_irregular_wear.png",
    note: "Tire inspection failed — irregular wear detected.",
  },
  {
    id: "EVID-DRV-004-PRETRIP-TREAD",
    driverId: "DRV-004",
    driverName: "Priya Patel",
    loadId: "L004",
    type: "tire_inspection",
    label: "Pre-trip tire inspection",
    severity: "medium",
    url: "/evidence/safety/p_patel_pretrip_tire_tread_depth.png",
    note: "Tire tread depth below minimum requirement.",
  },
  {
    id: "EVID-DRV-004-CARGO",
    driverId: "DRV-004",
    driverName: "Priya Patel",
    loadId: "L004",
    type: "cargo_damage_photo",
    label: "Cargo damage photo",
    severity: "medium",
    url: "/evidence/safety/p_patel_cargo_damage_box_puncture.png",
    note: "Box punctured and product damaged.",
  },
  {
    id: "EVID-DRV-004-EQUIP",
    driverId: "DRV-004",
    driverName: "Priya Patel",
    loadId: "L004",
    type: "safety_equipment_inspection",
    label: "Safety equipment inspection",
    severity: "medium",
    url: "/evidence/safety/p_patel_safety_equipment_extinguisher.png",
    note: "Fire extinguisher inspection tag expired.",
  },
  {
    id: "EVID-DRV-008-L405",
    driverId: "DRV-008",
    driverName: "Liam Smith",
    loadId: "L008",
    type: "hos_violation",
    label: "L-405 HOS",
    severity: "high",
    url: "/evidence/safety/l_smith_l405_hos_violation_eld.png",
    note: "Hours of Service violation — daily driving limit exceeded.",
  },
  {
    id: "EVID-DRV-008-LOGBOOK",
    driverId: "DRV-008",
    driverName: "Liam Smith",
    loadId: "L008",
    type: "logbook_review",
    label: "Logbook review",
    severity: "high",
    url: "/evidence/safety/l_smith_logbook_review_violation.png",
    note: "Required reset / logbook violation.",
  },
  {
    id: "EVID-DRV-008-BRAKES",
    driverId: "DRV-008",
    driverName: "Liam Smith",
    loadId: "L008",
    type: "trailer_brake_inspection",
    label: "Trailer brake inspection",
    severity: "high",
    url: "/evidence/safety/l_smith_trailer_brake_inspection.png",
    note: "Brake lining worn below minimum standard.",
  },
  {
    id: "EVID-DRV-008-CARGO",
    driverId: "DRV-008",
    driverName: "Liam Smith",
    loadId: "L008",
    type: "cargo_damage_photo",
    label: "Cargo damage photo",
    severity: "high",
    url: "/evidence/safety/l_smith_cargo_damage_pallet_wrap.png",
    note: "Significant cargo damage / damaged wrapped pallet.",
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

export function getSafetyEvidenceByDriverId(driverId: string): SafetyEvidenceItem[] {
  return SAFETY_EVIDENCE_REGISTRY.filter((r) => r.driverId === driverId);
}

export function getSafetyEvidenceByLoadId(loadId: string): SafetyEvidenceItem[] {
  return SAFETY_EVIDENCE_REGISTRY.filter((r) => r.loadId === loadId);
}
