/**
 * Grounded savings scorecard math — every input traceable to BOF demo arrays.
 * `load.rate` in spec = `loads[].revenue` in JSON.
 * Excel fields absent in source → `sealStatus === "Mismatch"`, `isClaimPacketEligible` for claim-required.
 */
import type { BofData } from "./load-bof-data";
import { isClaimPacketEligible } from "./claim-packet";
import { buildRfActions } from "./load-proof";

type LoadRow = BofData["loads"][number];

/** Canonical linehaul value per load (source: `revenue`). */
export function loadRate(l: LoadRow): number {
  return typeof l.revenue === "number" && Number.isFinite(l.revenue)
    ? l.revenue
    : 0;
}

export function loadHasIssue(data: BofData, l: LoadRow): boolean {
  if (l.dispatchExceptionFlag === true) return true;
  if (String(l.podStatus).toLowerCase() !== "verified") return true;
  if (l.sealStatus === "Mismatch") return true;
  if (isClaimPacketEligible(data, l.id)) return true;
  return false;
}

/** True when this load appears on the RF action queue (proof gaps / blocks / disputes). */
export function loadHasRfAction(data: BofData, loadId: string): boolean {
  return buildRfActions(data).some((a) => a.loadId === loadId);
}

export type SavingsEngineBaseInputs = {
  totalLoads: number;
  totalRevenue: number;
  loadsWithIssues: number;
  loadsWithRf: number;
  loadsDeliveredVerified: number;
  settlementsHeld: number;
  /** loadsWithIssues / totalLoads */
  riskScore: number;
  /** loadsWithRf / totalLoads */
  rfCoverage: number;
  /** loadsDeliveredVerified / totalLoads (POD verified share of fleet loads) */
  complianceScore: number;
};

export function extractBaseMetrics(data: BofData): SavingsEngineBaseInputs {
  const loads = data.loads;
  const totalLoads = loads.length;
  const totalRevenue = loads.reduce((a, l) => a + loadRate(l), 0);

  let loadsWithIssues = 0;
  let loadsWithRf = 0;
  let loadsDeliveredVerified = 0;

  const rfByLoad = new Set(buildRfActions(data).map((a) => a.loadId));

  for (const l of loads) {
    if (loadHasIssue(data, l)) loadsWithIssues++;
    if (rfByLoad.has(l.id)) loadsWithRf++;
    if (String(l.podStatus).toLowerCase() === "verified") {
      loadsDeliveredVerified++;
    }
  }

  const settlementsHeld =
    "settlements" in data && Array.isArray(data.settlements)
      ? data.settlements.filter((s) => s.status !== "Paid").length
      : 0;

  const n = totalLoads || 1;
  return {
    totalLoads,
    totalRevenue,
    loadsWithIssues,
    loadsWithRf,
    loadsDeliveredVerified,
    settlementsHeld,
    riskScore: loadsWithIssues / n,
    rfCoverage: loadsWithRf / n,
    complianceScore: loadsDeliveredVerified / n,
  };
}

function clampRate(rate: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, rate));
}

export type ExplainableSavingsMetric = {
  value: number;
  /** Primary rate shown on card (0–1 or 0–100% depending on metric — we use 0–1 for internal, display *100) */
  rate: number;
  inputs: SavingsEngineBaseInputs;
  /** Human-readable lines for tooltip */
  formulaLines: string[];
  /** Key scalars used in formula */
  detail: Record<string, number | string>;
};

export function computeInsuranceSavings(
  data: BofData,
  base: SavingsEngineBaseInputs
): ExplainableSavingsMetric {
  const rawRate =
    0.05 * base.complianceScore +
    0.07 * base.rfCoverage -
    0.08 * base.riskScore;
  const insuranceSavingsRate = clampRate(rawRate, 0, 0.25);
  const value = Math.round(
    base.totalRevenue * insuranceSavingsRate * 0.4
  );

  return {
    value,
    rate: insuranceSavingsRate,
    inputs: base,
    formulaLines: [
      "riskScore = loadsWithIssues / totalLoads",
      "rfCoverage = loadsWithRF / totalLoads",
      "complianceScore = loadsWithVerifiedPOD / totalLoads",
      "rawRate = 0.05×compliance + 0.07×rfCoverage − 0.08×riskScore",
      "insuranceSavingsRate = clamp(rawRate, 0%, 25%)",
      "insuranceSavings = totalRevenue × insuranceSavingsRate × 0.4",
    ],
    detail: {
      rawRate,
      insuranceSavingsRate,
      totalRevenue: base.totalRevenue,
      insuranceToRevenueScalar: 0.4,
    },
  };
}

export function computeLegalSavings(base: SavingsEngineBaseInputs): ExplainableSavingsMetric {
  const incidentCount = base.loadsWithIssues;
  const avgLegalCostPerIncident = 1500;
  const reductionRate = 0.25 + base.rfCoverage * 0.25;
  const value = Math.round(
    incidentCount * avgLegalCostPerIncident * reductionRate
  );

  return {
    value,
    rate: reductionRate,
    inputs: base,
    formulaLines: [
      "incidentCount = loadsWithIssues (same gates as risk: dispatch, POD, seal, claim)",
      "reductionRate = 0.25 + rfCoverage × 0.25",
      "legalSavings = incidentCount × $1,500 × reductionRate",
    ],
    detail: {
      incidentCount,
      avgLegalCostPerIncident,
      reductionRate,
    },
  };
}

export function computeRecoveredRevenue(
  data: BofData,
  base: SavingsEngineBaseInputs
): ExplainableSavingsMetric {
  const recoveryRate = 0.4 + base.rfCoverage * 0.3;
  let sumAtRisk = 0;
  let issueLoadCount = 0;
  for (const l of data.loads) {
    if (!loadHasIssue(data, l)) continue;
    issueLoadCount++;
    const atRisk = loadRate(l) * 0.25;
    sumAtRisk += atRisk * recoveryRate;
  }
  const value = Math.round(sumAtRisk);

  return {
    value,
    rate: recoveryRate,
    inputs: base,
    formulaLines: [
      "For each load with issues: atRisk = revenue × 0.25",
      "recoveryRate = 0.4 + rfCoverage × 0.3 (fleet-wide)",
      "recoveredRevenue = Σ(atRisk × recoveryRate)",
    ],
    detail: {
      recoveryRate,
      issueLoadCount,
      atRiskFactor: 0.25,
    },
  };
}

export function computeCashFlowImpact(base: SavingsEngineBaseInputs): ExplainableSavingsMetric {
  const delayedLoads = base.totalLoads - base.loadsDeliveredVerified;
  const avgDelayDays = 7;
  const dailyRevenueImpact =
    base.totalLoads > 0 ? base.totalRevenue / 30 : 0;
  const value = Math.round(delayedLoads * (dailyRevenueImpact * 0.2));
  const delayedShare =
    base.totalLoads > 0 ? delayedLoads / base.totalLoads : 0;

  return {
    value,
    rate: delayedShare,
    inputs: base,
    formulaLines: [
      "delayedLoads = count(loads where podStatus ≠ 'verified')",
      "dailyRevenueImpact = totalRevenue / 30",
      "cashFlowImpact = delayedLoads × (dailyRevenueImpact × 0.2)",
      `avgDelayDays (${avgDelayDays}) documents typical hold window (not multiplied in formula)`,
      `settlementsHeld (${base.settlementsHeld}) — shown for context; not in this formula`,
    ],
    detail: {
      delayedLoads,
      avgDelayDays,
      dailyRevenueImpact,
      settlementsHeld: base.settlementsHeld,
    },
  };
}

export type SavingsEngineScorecard = {
  base: SavingsEngineBaseInputs;
  insurance: ExplainableSavingsMetric;
  legal: ExplainableSavingsMetric;
  recovered: ExplainableSavingsMetric;
  cashFlow: ExplainableSavingsMetric;
};

export function buildSavingsEngineScorecard(data: BofData): SavingsEngineScorecard {
  const base = extractBaseMetrics(data);
  return {
    base,
    insurance: computeInsuranceSavings(data, base),
    legal: computeLegalSavings(base),
    recovered: computeRecoveredRevenue(data, base),
    cashFlow: computeCashFlowImpact(base),
  };
}
