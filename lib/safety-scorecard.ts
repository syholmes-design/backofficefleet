import {
  type SafetyEvidenceItem,
  getSafetyEvidenceByDriverId as getSafetyEvidenceByDriverIdFromRegistry,
  getSafetyEvidenceByLoadId as getSafetyEvidenceByLoadIdFromRegistry,
} from "@/lib/safety-evidence";
import { getBofData } from "@/lib/load-bof-data";
import type { BofData } from "@/lib/load-bof-data";

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


// Source: main-source-v2_enhanced_bof_aligned.xlsx
// Generate safety scorecard data from BOF v2 canonical data
function generateSafetyScorecardRows(data: BofData): SafetyScorecardRow[] {
  const canonicalDrivers = [
    "DRV-001", "DRV-002", "DRV-003", "DRV-004", "DRV-005", "DRV-006",
    "DRV-007", "DRV-008", "DRV-009", "DRV-010", "DRV-011", "DRV-012"
  ];

  return canonicalDrivers.map(driverId => {
    const driver = data.drivers.find(d => d.id === driverId);
    if (!driver) {
      // Return a conservative fallback for a missing driver record.
      return {
        driverId,
        driverName: `Driver ${driverId}`,
        oosViolations: 0,
        hosCompliancePct: 100,
        maintenancePhotosDate: "N/A",
        tireAssetInspection: "Pass",
        cargoDamageUsd: 0,
        safetyBonusUsd: 0,
        performanceTier: "Standard" as SafetyPerformanceTier,
      };
    }

    // Count compliance incidents for this driver
    const driverIncidents = data.complianceIncidents?.filter(incident => incident.driverId === driverId) || [];
    const oosViolations = driverIncidents.filter(incident => 
      incident.type === "Safety" && (incident.severity === "HIGH" || incident.severity === "MEDIUM")
    ).length;

    // Calculate HOS compliance based on incidents
    const hosViolations = driverIncidents.filter(incident => 
      incident.description?.toLowerCase().includes("hos") || 
      incident.description?.toLowerCase().includes("hours")
    ).length;
    const hosCompliancePct = Math.max(0, 100 - (hosViolations * 15));

    // Calculate cargo damage from incidents (estimatedClaimExposure not available in v2 source)
    const cargoDamageUsd = driverIncidents
      .filter(incident => incident.type === "Safety")
      .reduce((sum, incident) => sum + (incident.severity === "HIGH" ? 2500 : incident.severity === "MEDIUM" ? 800 : 0), 0);

    // Determine performance tier based on violations and compliance
    let performanceTier: SafetyPerformanceTier = "Elite";
    if (oosViolations > 0 || hosCompliancePct < 90) {
      performanceTier = cargoDamageUsd > 500 ? "At Risk" : "Standard";
    }

    // Get actual safety bonus from Payroll data
    const settlement = data.settlements?.find(s => s.driverId === driverId);
    const safetyBonusUsd = settlement?.safetyBonus || 0;

    return {
      driverId,
      driverName: driver.name,
      oosViolations,
      hosCompliancePct: Math.round(hosCompliancePct),
      maintenancePhotosDate: "N/A",
      tireAssetInspection: cargoDamageUsd > 1000 ? "Fail" : "Pass",
      cargoDamageUsd,
      safetyBonusUsd,
      performanceTier,
    };
  });
}

function generateSafetyViolationActions(data: BofData): SafetyViolationActionRow[] {
  const actions: SafetyViolationActionRow[] = [];
  
  data.complianceIncidents?.forEach(incident => {
    if (incident.type === "Safety" && (incident.severity === "HIGH" || incident.severity === "MEDIUM")) {
      const driver = data.drivers.find(d => d.id === incident.driverId);
      if (driver) {
        const shortName = driver.name.split(' ').map(n => n[0]).join('. ') + driver.name.split(' ').pop()?.slice(1);
        actions.push({
          driverId: incident.driverId,
          driverShortName: shortName || incident.driverId,
          violations: 1,
          code: incident.severity === "HIGH" ? "L-405 (HOS)" : "B-102 (Tires)",
          severity: incident.severity.toLowerCase() as "Low" | "Medium" | "High",
          action: incident.severity === "HIGH" ? "24-hr Reset & Safety Review" : "Immediate Repair & Photo",
        });
      }
    }
  });

  return actions;
}


export function getSafetyScorecardRows(): SafetyScorecardRow[] {
  const data = getBofData();
  return generateSafetyScorecardRows(data);
}

export function getSafetyScorecardSummary(): SafetyScorecardSummary {
  const rows = getSafetyScorecardRows();
  const scoredDrivers = rows.length;
  const eliteDrivers = rows.filter((r: SafetyScorecardRow) => r.performanceTier === "Elite").length;
  const atRiskDrivers = rows.filter((r: SafetyScorecardRow) => r.performanceTier === "At Risk").length;
  const cargoDamageExposureUsd = rows.reduce((sum: number, r: SafetyScorecardRow) => sum + r.cargoDamageUsd, 0);
  const safetyBonusEarnedUsd = rows.reduce((sum: number, r: SafetyScorecardRow) => sum + r.safetyBonusUsd, 0);
  return {
    scoredDrivers,
    eliteTierPct: scoredDrivers === 0 ? 0 : (eliteDrivers / scoredDrivers) * 100,
    atRiskDrivers,
    cargoDamageExposureUsd,
    safetyBonusEarnedUsd,
  };
}

export function getAtRiskSafetyDrivers(): SafetyScorecardRow[] {
  return getSafetyScorecardRows().filter((r: SafetyScorecardRow) => r.performanceTier === "At Risk");
}

export function getSafetyViolationActions(): SafetyViolationActionRow[] {
  const data = getBofData();
  return generateSafetyViolationActions(data);
}

export function getSafetyBonusByDriverId(driverId: string): number {
  const rows = getSafetyScorecardRows();
  return rows.find((r: SafetyScorecardRow) => r.driverId === driverId)?.safetyBonusUsd ?? 0;
}

export function getSafetyEvidenceByDriverId(driverId: string): SafetyEvidenceItem[] {
  return getSafetyEvidenceByDriverIdFromRegistry(driverId);
}

export function getSafetyEvidenceByLoadId(loadId: string): SafetyEvidenceItem[] {
  return getSafetyEvidenceByLoadIdFromRegistry(loadId);
}
