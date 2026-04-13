import type { BofData } from "./load-bof-data";
import { buildClaimQueueRows } from "./claim-packet";
import { formatUsd } from "./format-money";
import {
  getLoadProofItems,
  getLoadProofSummary,
} from "./load-proof";
import {
  buildRfidDockRowForLoad,
  buildRfidFuelExceptionQueue,
  buildRfidMaintenanceRows,
} from "./rfid-intelligence";

export type FleetProofRiskSummary = {
  loadCount: number;
  loadsWithPaymentBlockers: number;
  loadsWithDisputeSensitivity: number;
  avgProofCompletionPct: number;
};

export function buildFleetProofRiskSummary(
  data: BofData
): FleetProofRiskSummary {
  let loadsWithPaymentBlockers = 0;
  let loadsWithDisputeSensitivity = 0;
  let sumPct = 0;
  for (const load of data.loads) {
    const items = getLoadProofItems(data, load.id);
    const s = getLoadProofSummary(items);
    sumPct += s.completionPct;
    if (s.blockingCount > 0) loadsWithPaymentBlockers++;
    if (items.some((i) => i.disputeExposure)) loadsWithDisputeSensitivity++;
  }
  return {
    loadCount: data.loads.length,
    loadsWithPaymentBlockers,
    loadsWithDisputeSensitivity,
    avgProofCompletionPct: data.loads.length
      ? Math.round(sumPct / data.loads.length)
      : 100,
  };
}

export type MoneyStoryRow = {
  id: string;
  lane: "claim" | "rfid_fuel" | "rfid_dock" | "rfid_maint";
  headline: string;
  driverId: string;
  driverName: string;
  loadId?: string;
  assetId?: string;
  amountUsd: number;
  whatsWrong: string;
  bofNext: string;
};

export function buildMoneyStoryRows(data: BofData): MoneyStoryRow[] {
  const rows: MoneyStoryRow[] = [];

  for (const c of buildClaimQueueRows(data, 20)) {
    rows.push({
      id: `MS-CLAIM-${c.loadId}`,
      lane: "claim",
      headline: `Claim / dispute workspace · load ${c.loadNumber}`,
      driverId: c.driverId,
      driverName: c.driverName,
      loadId: c.loadId,
      amountUsd: c.amountAtRiskUsd,
      whatsWrong: c.issues,
      bofNext: `Generate claim packet · ${formatUsd(c.amountAtRiskUsd)} recoverable (est.)`,
    });
  }

  for (const f of buildRfidFuelExceptionQueue(data, 12)) {
    rows.push({
      id: f.id,
      lane: "rfid_fuel",
      headline: `RFID fuel validation · load ${f.loadNumber}`,
      driverId: f.driverId,
      driverName: f.driverName,
      loadId: f.loadId,
      assetId: f.assetId,
      amountUsd: f.fuelAnomalyOpportunityUsd,
      whatsWrong: f.unauthorizedFuelingFlag
        ? "Unauthorized / unverified fueling pattern (RFID + exception proxy)"
        : "Route checkpoint mismatch vs. plan",
      bofNext: f.nextAction,
    });
  }

  let dockStory = 0;
  for (const load of data.loads) {
    if (dockStory >= 8) break;
    const dock = buildRfidDockRowForLoad(data, load.id);
    if (!dock || (!dock.receiptStillRequired && dock.trailerConfirmedAtDock))
      continue;
    dockStory++;
    rows.push({
      id: dock.id,
      lane: "rfid_dock",
      headline: `RFID dock / lumper · load ${dock.loadNumber}`,
      driverId: dock.driverId,
      driverName: dock.driverName,
      loadId: dock.loadId,
      amountUsd: Math.round(load.revenue * 0.04),
      whatsWrong: dock.receiptStillRequired
        ? "Dock RFID pending or lumper receipt still required"
        : dock.unloadCheckpointNarrative,
      bofNext: dock.nextAction,
    });
  }

  for (const m of buildRfidMaintenanceRows(data).slice(0, 8)) {
    if (m.componentEventLogged && m.serviceZoneVerified) continue;
    rows.push({
      id: m.id,
      lane: "rfid_maint",
      headline: `RFID maintenance verification · ${m.assetId}`,
      driverId: "",
      driverName: "Fleet asset",
      assetId: m.assetId,
      amountUsd: m.overdueExposureUsd,
      whatsWrong: m.readinessImpact,
      bofNext: m.nextAction,
    });
  }

  return rows;
}

export function settlementOpsNote(
  data: BofData,
  driverId: string
): string {
  const parts: string[] = [];
  const claimLoadIds = new Set(
    buildClaimQueueRows(data, 100).map((r) => r.loadId)
  );
  const claimLoad = data.loads.find(
    (l) => l.driverId === driverId && claimLoadIds.has(l.id)
  );
  if (claimLoad) {
    parts.push(`Claim workspace: load ${claimLoad.id}`);
  }
  const fuel = buildRfidFuelExceptionQueue(data, 50).find(
    (f) => f.driverId === driverId
  );
  if (fuel) {
    parts.push(`RFID fuel check: ${formatUsd(fuel.fuelAnomalyOpportunityUsd)} est.`);
  }
  const dock = data.loads
    .filter((l) => l.driverId === driverId)
    .map((l) => buildRfidDockRowForLoad(data, l.id))
    .find((d) => d?.receiptStillRequired);
  if (dock) {
    parts.push("RFID dock: receipt / lumper follow-up");
  }
  return parts.length ? parts.join(" · ") : "—";
}
