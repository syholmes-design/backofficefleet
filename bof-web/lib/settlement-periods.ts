export type SettlementPeriodOption = {
  id: string;
  label: string;
  isCurrent: boolean;
};

export type CurrentSettlementRowInput = {
  settlementId: string;
  driverId: string;
  driverName: string;
  status: string;
  baseEarnings?: number;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  backhaulPay: number;
  safetyBonus: number;
  fuelReimbursement?: number;
};

export type SettlementPeriodRow = {
  settlementId: string;
  driverId: string;
  driverName: string;
  status: string;
  baseEarnings?: number;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  backhaulPay: number;
  safetyBonus: number;
  fuelReimbursement?: number;
};

export const SETTLEMENT_PERIODS: readonly SettlementPeriodOption[] = [
  { id: "current-2026-04-01", label: "Apr 1-Apr 15, 2026 — Current", isCurrent: true },
  { id: "2026-03-16", label: "Mar 16-Mar 31, 2026", isCurrent: false },
  { id: "2026-03-01", label: "Mar 1-Mar 15, 2026", isCurrent: false },
  { id: "2026-02-16", label: "Feb 16-Feb 28, 2026", isCurrent: false },
];

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function seededUnit(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 999;
}

function between(seed: string, min: number, max: number): number {
  return min + (max - min) * seededUnit(seed);
}

function synthSafetyBonus(baseSafety: number, seed: string): number {
  if (baseSafety >= 100) return round2(between(seed, 75, 125));
  if (baseSafety >= 50) return round2(between(seed, 25, 75));
  return round2(between(seed, 0, 25));
}

function periodTag(periodId: string): string {
  if (periodId === "2026-03-16") return "MAR2";
  if (periodId === "2026-03-01") return "MAR1";
  if (periodId === "2026-02-16") return "FEB2";
  return periodId.replace(/[^0-9]/g, "").slice(-4);
}

function driverOrdinalFromId(driverId: string): string {
  const m = /^DRV-(\d+)$/i.exec(driverId);
  if (!m) return "000";
  return m[1].padStart(3, "0");
}

function isDev(): boolean {
  return typeof process !== "undefined" && process.env.NODE_ENV !== "production";
}

function validatePerDriverVariance(rows: SettlementPeriodRow[], periodId: string) {
  if (!isDev() || rows.length < 5) return;
  const signatureCounts = new Map<string, number>();
  for (const r of rows) {
    const sig = `${r.baseEarnings ?? 0}|${r.grossPay}|${r.totalDeductions}|${r.netPay}`;
    signatureCounts.set(sig, (signatureCounts.get(sig) ?? 0) + 1);
  }
  const maxCluster = Math.max(...signatureCounts.values());
  if (maxCluster / rows.length > 0.8) {
    // Dev-only guard for accidental summary-to-row mapping regressions.
    console.warn(
      `[settlement-periods] suspicious row duplication for ${periodId}: ${maxCluster}/${rows.length} rows share identical values`
    );
  }
}

export function getSettlementPeriods(): SettlementPeriodOption[] {
  return [...SETTLEMENT_PERIODS];
}

export function getSettlementRowsForPeriod(
  periodId: string,
  currentRows: CurrentSettlementRowInput[]
): SettlementPeriodRow[] {
  if (periodId === "current-2026-04-01") {
    return currentRows.map((r) => ({ ...r }));
  }

  const rows = currentRows.map((r) => {
    const seed = `${periodId}:${r.driverId}`;
    const base = round2((r.baseEarnings ?? Math.max(r.grossPay - r.backhaulPay - r.safetyBonus, 0)) * between(`${seed}:base`, 0.92, 1.06));
    const backhaul = round2(r.backhaulPay * between(`${seed}:backhaul`, 0.72, 1.28));
    const safetyBonus = synthSafetyBonus(r.safetyBonus, `${seed}:safety`);
    const gross = round2(base + backhaul + safetyBonus);
    const deductionRate = between(`${seed}:dedrate`, 0.065, 0.115);
    const deductions = round2(gross * deductionRate);
    const fuelReimbursement = round2((r.fuelReimbursement ?? 0) * between(`${seed}:fuel`, 0.8, 1.2));
    const net = round2(gross - deductions + fuelReimbursement);
    const archivedStatus =
      periodId === "2026-02-16" && r.driverId === "DRV-004" ? "Pending" : "Paid";

    return {
      settlementId: `STL-${driverOrdinalFromId(r.driverId)}-${periodTag(periodId)}`,
      driverId: r.driverId,
      driverName: r.driverName,
      status: archivedStatus,
      baseEarnings: base,
      grossPay: gross,
      totalDeductions: deductions,
      netPay: net,
      backhaulPay: backhaul,
      safetyBonus,
      fuelReimbursement,
    };
  });
  validatePerDriverVariance(rows, periodId);
  return rows;
}

export function getSettlementSummaryForPeriod(rows: SettlementPeriodRow[]) {
  return rows.reduce(
    (acc, row) => {
      acc.totalGrossPay += row.grossPay;
      acc.totalBackhaulPay += row.backhaulPay;
      acc.totalSafetyBonus += row.safetyBonus;
      acc.totalDeductions += row.totalDeductions;
      acc.totalNetPay += row.netPay;
      if (row.status === "Pending" || row.status === "On Hold") acc.pendingOrOnHold += 1;
      return acc;
    },
    {
      totalGrossPay: 0,
      totalBackhaulPay: 0,
      totalSafetyBonus: 0,
      totalDeductions: 0,
      totalNetPay: 0,
      pendingOrOnHold: 0,
    }
  );
}
