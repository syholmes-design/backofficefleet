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
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  backhaulPay: number;
  safetyBonus: number;
};

export type SettlementPeriodRow = {
  settlementId: string;
  driverId: string;
  driverName: string;
  status: string;
  grossPay: number;
  totalDeductions: number;
  netPay: number;
  backhaulPay: number;
  safetyBonus: number;
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

  return currentRows.map((r) => {
    const seed = `${periodId}:${r.driverId}`;
    const gross = round2(r.grossPay * between(`${seed}:gross`, 0.92, 1.06));
    const backhaul = round2(r.backhaulPay * between(`${seed}:backhaul`, 0.72, 1.28));
    const safetyBonus = synthSafetyBonus(r.safetyBonus, `${seed}:safety`);
    const deductions = round2(r.totalDeductions * between(`${seed}:ded`, 0.94, 1.08));
    const net = round2(gross - deductions);
    const archivedStatus =
      periodId === "2026-02-16" && r.driverId === "DRV-004" ? "Pending" : "Paid";

    return {
      settlementId: `${r.settlementId || "STL"}-${periodId.slice(2, 7).replace("-", "")}`,
      driverId: r.driverId,
      driverName: r.driverName,
      status: archivedStatus,
      grossPay: gross,
      totalDeductions: deductions,
      netPay: net,
      backhaulPay: backhaul,
      safetyBonus,
    };
  });
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
