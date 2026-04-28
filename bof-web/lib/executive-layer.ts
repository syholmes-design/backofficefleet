import type { BofData } from "./load-bof-data";
import { getLoadProofItems } from "./load-proof";
import { getSafetyBonusByDriverId } from "./safety-scorecard";

export type CommandCenterItem = {
  id: string;
  severity: "critical" | "high" | "medium";
  bucket:
    | "Settlement / payroll"
    | "Compliance"
    | "Dispatch / proof"
    | "Driver readiness"
    | "Money at risk";
  title: string;
  detail: string;
  driver?: string;
  driverId?: string;
  loadId?: string;
  assetId?: string;
  nextAction: string;
  owner: string;
  status: string;
  /** When set (e.g. money-at-risk row, load revenue anchor), used for Command Center money impact. */
  sourceAmount?: number;
};

const PENDING = new Set(["Pending", "On Hold", "Awaiting Receipts"]);

function driverName(data: BofData, id: string): string | undefined {
  return data.drivers.find((d) => d.id === id)?.name;
}

/** Single derived view for Command Center — reads canonical arrays only (no mutation). */
export function buildCommandCenterItems(data: BofData): CommandCenterItem[] {
  const items: CommandCenterItem[] = [];

  if ("moneyAtRisk" in data && Array.isArray(data.moneyAtRisk)) {
    for (const row of data.moneyAtRisk) {
      const blocked = row.status === "Blocked";
      items.push({
        id: row.id,
        severity: blocked ? "critical" : "high",
        bucket: "Money at risk",
        title: row.category,
        detail: row.rootCause,
        driver: row.driver,
        driverId: row.driverId,
        loadId: row.loadId ?? undefined,
        assetId: row.assetId ?? undefined,
        nextAction: row.nextBestAction,
        owner: row.owner,
        status: row.status,
        sourceAmount: row.amount,
      });
    }
  }

  for (const c of data.complianceIncidents) {
    const sev =
      c.severity === "CRITICAL"
        ? "critical"
        : c.severity === "DUE_SOON"
          ? "high"
          : "medium";
    items.push({
      id: c.incidentId,
      severity: sev,
      bucket: "Compliance",
      title: c.type,
      detail: `${c.status} — ${c.severity}`,
      driver: driverName(data, c.driverId),
      driverId: c.driverId,
      nextAction: "Review compliance queue and update driver file",
      owner: "Compliance",
      status: c.status,
    });
  }

  for (const load of data.loads) {
    const proofs = getLoadProofItems(data, load.id);
    const payBlockers = proofs.filter((p) => p.blocksPayment);
    if (payBlockers.length > 0) {
      items.push({
        id: `PROOF-${load.id}`,
        severity: "high",
        bucket: "Dispatch / proof",
        title: `Load ${load.number} — proof blocking payment`,
        detail: payBlockers
          .map((p) => `${p.type} (${p.status})`)
          .join(" · "),
        driver: driverName(data, load.driverId),
        driverId: load.driverId,
        loadId: load.id,
        assetId: load.assetId,
        nextAction:
          "Clear items on Load Proof stack; verify in Settlements / Money at Risk",
        owner: "Finance / Dispatch",
        status: "Blocked",
        sourceAmount: load.revenue,
      });
    } else if (load.status === "Pending" || load.dispatchExceptionFlag) {
      items.push({
        id: `LOAD-${load.id}`,
        severity: load.dispatchExceptionFlag ? "high" : "medium",
        bucket: "Dispatch / proof",
        title: `Load ${load.number} — ${load.status}`,
        detail: `Seal: ${load.sealStatus}; POD: ${load.podStatus}`,
        driver: driverName(data, load.driverId),
        driverId: load.driverId,
        loadId: load.id,
        assetId: load.assetId,
        nextAction:
          load.podStatus === "pending"
            ? "Confirm POD and seal documentation"
            : "Resolve dispatch exception and update load status",
        owner: "Dispatch",
        status: load.status,
        sourceAmount: load.revenue,
      });
    }
  }

  const readiness = new Map<string, { missing: number; expired: number }>();
  for (const doc of data.documents) {
    if (doc.status !== "MISSING" && doc.status !== "EXPIRED") continue;
    const cur = readiness.get(doc.driverId) ?? { missing: 0, expired: 0 };
    if (doc.status === "MISSING") cur.missing += 1;
    else cur.expired += 1;
    readiness.set(doc.driverId, cur);
  }
  for (const [driverId, counts] of readiness) {
    if (counts.missing + counts.expired === 0) continue;
    items.push({
      id: `DOC-${driverId}`,
      severity: counts.expired > 0 ? "high" : "medium",
      bucket: "Driver readiness",
      title: "Document gaps",
      detail: `${counts.missing} missing, ${counts.expired} expired credential(s)`,
      driver: driverName(data, driverId),
      driverId,
      nextAction: "Collect or renew documents before next dispatch",
      owner: "Safety",
      status: "Open",
    });
  }

  const order = { critical: 0, high: 1, medium: 2 };
  items.sort(
    (a, b) => order[a.severity] - order[b.severity] || a.id.localeCompare(b.id)
  );
  return items;
}

export function settlementTotals(data: BofData) {
  if (!("settlements" in data) || !Array.isArray(data.settlements)) {
    return {
      totalBase: 0,
      totalBackhaul: 0,
      totalSafetyBonus: 0,
      totalGross: 0,
      totalDeductions: 0,
      totalFuelReimb: 0,
      totalNet: 0,
      pendingOrHold: 0,
    };
  }
  let totalBase = 0;
  let totalBackhaul = 0;
  let totalSafetyBonus = 0;
  let totalGross = 0;
  let totalDeductions = 0;
  let totalFuelReimb = 0;
  let totalNet = 0;
  let pendingOrHold = 0;
  for (const s of data.settlements) {
    const safetyBonus = getSafetyBonusByDriverId(s.driverId);
    const gross = s.baseEarnings + s.backhaulPay + safetyBonus;
    totalBase += s.baseEarnings;
    totalBackhaul += s.backhaulPay;
    totalSafetyBonus += safetyBonus;
    totalGross += gross;
    totalDeductions += s.deductions;
    totalFuelReimb += s.fuelReimbursement;
    totalNet += s.netPay;
    if (PENDING.has(s.status)) pendingOrHold += 1;
  }
  return {
    totalBase,
    totalBackhaul,
    totalSafetyBonus,
    totalGross,
    totalDeductions,
    totalFuelReimb,
    totalNet,
    pendingOrHold,
  };
}

export function enrichSettlementRows(data: BofData) {
  if (!("settlements" in data) || !Array.isArray(data.settlements)) return [];
  return data.settlements.map((s) => ({
    ...s,
    safetyBonus: getSafetyBonusByDriverId(s.driverId),
    grossPay: s.baseEarnings + s.backhaulPay + getSafetyBonusByDriverId(s.driverId),
    name: data.drivers.find((d) => d.id === s.driverId)?.name ?? s.driverId,
  }));
}
