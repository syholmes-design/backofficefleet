export type SafetyMonthlyTrend = {
  month: string;
  avgHosCompliance: number;
  oosViolations: number;
  atRiskDrivers: number;
  cargoDamageExposure: number;
  safetyBonusPaid: number;
  safetyScore: number;
};

export type PayrollMonthlyTrend = {
  month: string;
  baseEarnings: number;
  backhaulPay: number;
  safetyBonus: number;
  grossPay: number;
  deductions: number;
  fuelReimbursements: number;
  netPay: number;
};

const SAFETY_6_MONTH_TREND: readonly SafetyMonthlyTrend[] = [
  {
    month: "Nov 2025",
    avgHosCompliance: 94,
    oosViolations: 5,
    atRiskDrivers: 4,
    cargoDamageExposure: 2600,
    safetyBonusPaid: 650,
    safetyScore: 86,
  },
  {
    month: "Dec 2025",
    avgHosCompliance: 95,
    oosViolations: 4,
    atRiskDrivers: 4,
    cargoDamageExposure: 2100,
    safetyBonusPaid: 725,
    safetyScore: 88,
  },
  {
    month: "Jan 2026",
    avgHosCompliance: 96,
    oosViolations: 4,
    atRiskDrivers: 3,
    cargoDamageExposure: 1750,
    safetyBonusPaid: 775,
    safetyScore: 90,
  },
  {
    month: "Feb 2026",
    avgHosCompliance: 96,
    oosViolations: 3,
    atRiskDrivers: 3,
    cargoDamageExposure: 1450,
    safetyBonusPaid: 825,
    safetyScore: 91,
  },
  {
    month: "Mar 2026",
    avgHosCompliance: 97,
    oosViolations: 3,
    atRiskDrivers: 2,
    cargoDamageExposure: 1200,
    safetyBonusPaid: 900,
    safetyScore: 93,
  },
  {
    month: "Apr 2026",
    avgHosCompliance: 97,
    oosViolations: 3,
    atRiskDrivers: 2,
    cargoDamageExposure: 1450,
    safetyBonusPaid: 950,
    safetyScore: 92,
  },
];

const PAYROLL_6_MONTH_TREND: readonly PayrollMonthlyTrend[] = [
  {
    month: "Nov 2025",
    baseEarnings: 42100,
    backhaulPay: 950,
    safetyBonus: 650,
    grossPay: 43700,
    deductions: 9150,
    fuelReimbursements: 4100,
    netPay: 38650,
  },
  {
    month: "Dec 2025",
    baseEarnings: 43800,
    backhaulPay: 1200,
    safetyBonus: 725,
    grossPay: 45725,
    deductions: 9580,
    fuelReimbursements: 3900,
    netPay: 40045,
  },
  {
    month: "Jan 2026",
    baseEarnings: 44600,
    backhaulPay: 1450,
    safetyBonus: 775,
    grossPay: 46825,
    deductions: 9825,
    fuelReimbursements: 4250,
    netPay: 41250,
  },
  {
    month: "Feb 2026",
    baseEarnings: 45200,
    backhaulPay: 1700,
    safetyBonus: 825,
    grossPay: 47725,
    deductions: 10050,
    fuelReimbursements: 4400,
    netPay: 42075,
  },
  {
    month: "Mar 2026",
    baseEarnings: 46300,
    backhaulPay: 1950,
    safetyBonus: 900,
    grossPay: 49150,
    deductions: 10325,
    fuelReimbursements: 4550,
    netPay: 43375,
  },
  {
    month: "Apr 2026",
    baseEarnings: 47100,
    backhaulPay: 2200,
    safetyBonus: 950,
    grossPay: 50250,
    deductions: 10575,
    fuelReimbursements: 4700,
    netPay: 44375,
  },
];

export function getSafetyMonthlyTrend(): SafetyMonthlyTrend[] {
  return [...SAFETY_6_MONTH_TREND];
}

export function getPayrollMonthlyTrend(): PayrollMonthlyTrend[] {
  return [...PAYROLL_6_MONTH_TREND];
}
