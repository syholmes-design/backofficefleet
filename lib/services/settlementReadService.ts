import { isDemoOperationalKey } from "@/lib/uos/demo-operational-keys";
import { listAccessibleLoads } from "@/lib/services/loadService";
import { prisma } from "@/lib/prisma";
import type { SessionUserLike } from "@/lib/services/intakeService";

export type LiveSettlementListItem = {
  id: string;
  loadId: string;
  driverId: string | null;
  driverName: string;
  settlementDate: string;
  grossAmount: string;
  deductions: string;
  reimbursements: string;
  advances: string;
  netAmount: string;
  status: string;
  holdReason: string | null;
};

type MoneyLike = { toString(): string } | string | number;

export type LiveSettlementSource = {
  id: string;
  loadId: string;
  driverId: string | null;
  driverFirstName: string | null;
  driverLastName: string | null;
  settlementDate: Date;
  grossAmount: MoneyLike;
  deductions: MoneyLike;
  reimbursements: MoneyLike;
  advances: MoneyLike;
  netAmount: MoneyLike;
  status: string;
  holdReason: string | null;
};

function money(value: MoneyLike) {
  const raw = typeof value === "number" ? value.toString() : value.toString();
  const amount = Number(raw);
  if (!Number.isFinite(amount)) return "0.00";
  return amount.toFixed(2);
}

/** Stored live settlement row for the operator page. Demo keys are omitted. */
export function presentLiveSettlement(row: LiveSettlementSource): LiveSettlementListItem | null {
  if (isDemoOperationalKey(row.loadId) || isDemoOperationalKey(row.driverId)) return null;
  const driverName = [row.driverFirstName, row.driverLastName].filter(Boolean).join(" ").trim();
  return {
    id: row.id,
    loadId: row.loadId,
    driverId: row.driverId,
    driverName: driverName || "Unassigned",
    settlementDate: row.settlementDate.toISOString(),
    grossAmount: money(row.grossAmount),
    deductions: money(row.deductions),
    reimbursements: money(row.reimbursements),
    advances: money(row.advances),
    netAmount: money(row.netAmount),
    status: row.status,
    holdReason: row.holdReason,
  };
}

export async function listAccessibleLiveSettlements(sessionUser: SessionUserLike | null | undefined) {
  const loads = await listAccessibleLoads(sessionUser);
  const loadIds = loads.map((load) => load.id).filter((id) => !isDemoOperationalKey(id));
  if (loadIds.length === 0) return [];

  const rows = await prisma.settlement.findMany({
    where: { loadId: { in: loadIds }, lifecycleClass: "LIVE" },
    orderBy: [{ settlementDate: "desc" }, { updatedAt: "desc" }],
    take: 50,
    select: {
      id: true,
      loadId: true,
      driverId: true,
      settlementDate: true,
      grossAmount: true,
      deductions: true,
      reimbursements: true,
      advances: true,
      netAmount: true,
      status: true,
      holdReason: true,
      driver: { select: { firstName: true, lastName: true } },
    },
  });

  return rows.flatMap((row) => {
    const item = presentLiveSettlement({
      id: row.id,
      loadId: row.loadId,
      driverId: row.driverId,
      driverFirstName: row.driver?.firstName ?? null,
      driverLastName: row.driver?.lastName ?? null,
      settlementDate: row.settlementDate,
      grossAmount: row.grossAmount,
      deductions: row.deductions,
      reimbursements: row.reimbursements,
      advances: row.advances,
      netAmount: row.netAmount,
      status: row.status,
      holdReason: row.holdReason,
    });
    return item ? [item] : [];
  });
}
