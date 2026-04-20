/**
 * Maps prospect-reported fleet profile into {@link SavingsEngineBaseInputs} so the
 * marketing calculator reuses {@link buildSavingsEngineScorecardFromBase} — same
 * insurance / legal / recovered / cash-flow formulas as the demo command center,
 * with explicit illustrative disclaimers (not a financial guarantee).
 */

import {
  type SavingsEngineBaseInputs,
  buildSavingsEngineScorecardFromBase,
} from "./bof-savings-engine";

export type MarketingFleetPainLevel = "low" | "moderate" | "high" | "severe";

export type MarketingFleetSavingsInputs = {
  /** Active power units / tractors in fleet */
  powerUnits: number;
  /** Average linehaul loads moved per month (company-wide) */
  monthlyLoads: number;
  /** Typical linehaul revenue per load (USD) */
  avgRevenuePerLoad: number;
  /** Self-reported credential / DOT document chaos */
  compliancePain: MarketingFleetPainLevel;
  /** POD, seals, photos, GPS proof gaps */
  proofPain: MarketingFleetPainLevel;
  /** Dispatch blocks, settlement holds, admin rework */
  dispatchSettlementPain: MarketingFleetPainLevel;
  /** FTE spent on manual chase (dispatch + safety + settlements) */
  adminOpsFte: number;
};

const PAIN_TO_UNIT: Record<MarketingFleetPainLevel, number> = {
  low: 0.12,
  moderate: 0.28,
  high: 0.45,
  severe: 0.62,
};

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

/**
 * Builds synthetic base metrics from marketing inputs. Ratios are intentionally
 * conservative so the calculator reads as directional, not a promise.
 */
export function marketingInputsToSavingsBase(
  input: MarketingFleetSavingsInputs
): SavingsEngineBaseInputs {
  const totalLoads = Math.max(1, Math.round(input.monthlyLoads));
  const totalRevenue = Math.max(0, totalLoads * input.avgRevenuePerLoad);

  const riskScore = clamp01(
    PAIN_TO_UNIT[input.compliancePain] * 0.55 +
      PAIN_TO_UNIT[input.proofPain] * 0.35 +
      PAIN_TO_UNIT[input.dispatchSettlementPain] * 0.25
  );
  const rfCoverage = clamp01(
    PAIN_TO_UNIT[input.proofPain] * 0.85 + PAIN_TO_UNIT[input.dispatchSettlementPain] * 0.35
  );
  const complianceScore = clamp01(0.92 - riskScore * 0.55 + (1 - rfCoverage) * 0.08);

  const loadsWithIssues = Math.max(0, Math.min(totalLoads, Math.round(totalLoads * riskScore)));
  const loadsWithRf = Math.max(0, Math.min(totalLoads, Math.round(totalLoads * rfCoverage)));
  const loadsDeliveredVerified = Math.max(
    0,
    Math.min(totalLoads, Math.round(totalLoads * complianceScore))
  );

  const settlementsHeld = Math.max(
    0,
    Math.min(totalLoads, Math.round((totalLoads * PAIN_TO_UNIT[input.dispatchSettlementPain]) / 2))
  );

  return {
    totalLoads,
    totalRevenue,
    loadsWithIssues,
    loadsWithRf,
    loadsDeliveredVerified,
    settlementsHeld,
    riskScore,
    rfCoverage,
    complianceScore,
  };
}

export type MarketingSavingsLineItem = {
  key: "insurance" | "legal" | "recovered" | "cashFlow";
  label: string;
  /** Monthly USD estimate */
  monthlyUsd: number;
  /** One-line strategic framing */
  narrative: string;
};

export type MarketingSavingsPresentation = {
  base: SavingsEngineBaseInputs;
  lineItems: MarketingSavingsLineItem[];
  /** Sum of line items (monthly) */
  totalMonthlyUsd: number;
  /** Annualized headline */
  annualizedUsd: number;
  /** Admin hours / month recovered (heuristic from admin FTE and pain) */
  adminHoursRecoveredMonthly: number;
  /** 0–100 qualitative “leakage pressure” before BOF */
  operationalLeakageIndex: number;
  /** Plain-language disclaimer blocks */
  disclaimers: readonly string[];
};

const DISCLAIMERS = [
  "Illustrative model only — not financial, insurance, or legal advice. Results depend on enforcement depth, shipper mix, and how completely BOF is adopted.",
  "Formulas align with the BOF demo savings engine (insurance, legal exposure, recovered revenue at risk, cash-flow drag). Your fleet’s realized outcomes will differ.",
] as const;

export function computeMarketingSavingsPresentation(
  input: MarketingFleetSavingsInputs
): MarketingSavingsPresentation {
  const base = marketingInputsToSavingsBase(input);
  const card = buildSavingsEngineScorecardFromBase(base);

  const lineItems: MarketingSavingsLineItem[] = [
    {
      key: "insurance",
      label: "Insurance & underwriting posture",
      monthlyUsd: Math.round(card.insurance.value / 12),
      narrative:
        "Tighter compliance and proof discipline reduce underwriting volatility tied to roadside exposure and claims frequency.",
    },
    {
      key: "legal",
      label: "Legal / dispute exposure",
      monthlyUsd: Math.round(card.legal.value / 12),
      narrative:
        "Structured evidence and fewer disputed loads translate to less time in counsel review and carrier-side rework.",
    },
    {
      key: "recovered",
      label: "Revenue at risk recovered",
      monthlyUsd: Math.round(card.recovered.value / 12),
      narrative:
        "Loads with proof gaps or settlement holds leak margin — BOF-style enforcement recaptures a directional share.",
    },
    {
      key: "cashFlow",
      label: "Cash-flow / settlement drag",
      monthlyUsd: Math.round(card.cashFlow.value / 12),
      narrative:
        "Verified POD alignment and fewer delayed releases improve working capital velocity on the same revenue base.",
    },
  ];

  const totalMonthlyUsd = lineItems.reduce((a, x) => a + x.monthlyUsd, 0);
  const annualizedUsd = totalMonthlyUsd * 12;

  const fleetScale = Math.min(2.2, 1 + Math.log10(Math.max(1, input.powerUnits)) / 12);
  const adminHoursRecoveredMonthly = Math.round(
    Math.max(0, input.adminOpsFte) *
      160 *
      (0.08 + PAIN_TO_UNIT[input.proofPain] * 0.12 + PAIN_TO_UNIT[input.compliancePain] * 0.08) *
      fleetScale
  );

  const operationalLeakageIndex = Math.round(
    100 *
      clamp01(
        PAIN_TO_UNIT[input.compliancePain] * 0.34 +
          PAIN_TO_UNIT[input.proofPain] * 0.33 +
          PAIN_TO_UNIT[input.dispatchSettlementPain] * 0.33
      )
  );

  return {
    base,
    lineItems,
    totalMonthlyUsd,
    annualizedUsd,
    adminHoursRecoveredMonthly,
    operationalLeakageIndex,
    disclaimers: [...DISCLAIMERS],
  };
}
