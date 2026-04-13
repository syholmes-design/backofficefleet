import type { BofData } from "./load-bof-data";
import { formatUsd } from "./format-money";
import { getLoadProofItems } from "./load-proof";

/**
 * RFID is modeled as verification, attribution, checkpointing, and workflow
 * confirmation — not direct fuel burn measurement.
 */

export type RfidFuelRow = {
  id: string;
  loadId: string;
  loadNumber: string;
  driverId: string;
  driverName: string;
  assetId: string;
  verifiedFuelingNarrative: string;
  driverAssetMatched: boolean;
  routeCheckpointMatch: boolean;
  unauthorizedFuelingFlag: boolean;
  fuelAnomalyOpportunityUsd: number;
  nextAction: string;
};

export type RfidDockRow = {
  id: string;
  loadId: string;
  loadNumber: string;
  driverId: string;
  driverName: string;
  trailerConfirmedAtDock: boolean;
  unloadCheckpointNarrative: string;
  lumperWorkflowStatus: "confirmed" | "pending" | "receipt_required";
  receiptStillRequired: boolean;
  bofNote: string;
  nextAction: string;
};

export type RfidMaintenanceRow = {
  id: string;
  assetId: string;
  serviceZoneVerified: boolean;
  inspectionCheckpointVerified: boolean;
  componentEventLogged: boolean;
  readinessImpact: string;
  overdueExposureUsd: number;
  nextAction: string;
  relatedLoadIds: string[];
};

function driverName(data: BofData, id: string) {
  return data.drivers.find((d) => d.id === id)?.name ?? id;
}

export function buildRfidFuelRowForLoad(
  data: BofData,
  loadId: string
): RfidFuelRow | null {
  const load = data.loads.find((l) => l.id === loadId);
  if (!load) return null;

  const hasSeals =
    Boolean(load.pickupSeal?.trim()) && Boolean(load.deliverySeal?.trim());
  const verifiedNarrative = hasSeals
    ? `RFID-aligned gate read proxy: pickup seal on file (${load.pickupSeal?.slice(0, 8)}…); custody checkpoint satisfied for fuel attribution.`
    : `Checkpoint incomplete — seal references missing; fuel events cannot be attributed to this movement with confidence.`;

  const routeCheckpointMatch =
    !load.dispatchExceptionFlag ||
    load.status === "Delivered" ||
    load.podStatus === "verified";

  const unauthorizedFuelingFlag =
    load.dispatchExceptionFlag &&
    load.status === "En Route" &&
    load.sealStatus !== "OK";

  const delayProxy =
    (load.status === "Pending" && load.dispatchExceptionFlag) ||
    unauthorizedFuelingFlag;
  const fuelAnomalyOpportunityUsd = delayProxy
    ? Math.round(load.revenue * 0.022 + (unauthorizedFuelingFlag ? 185 : 95))
    : Math.round(load.revenue * 0.006);

  const nextAction = unauthorizedFuelingFlag
    ? "Validate RFID gate vs pump receipt; reconcile driver card + asset assignment"
    : delayProxy
      ? "Confirm dwell / yard time vs planned route to rule out off-route fueling"
      : "Continue passive RFID checkpoint monitoring";

  return {
    id: `RFID-FUEL-${load.id}`,
    loadId: load.id,
    loadNumber: load.number,
    driverId: load.driverId,
    driverName: driverName(data, load.driverId),
    assetId: load.assetId,
    verifiedFuelingNarrative: verifiedNarrative,
    driverAssetMatched: true,
    routeCheckpointMatch,
    unauthorizedFuelingFlag,
    fuelAnomalyOpportunityUsd,
    nextAction,
  };
}

export function buildRfidDockRowForLoad(
  data: BofData,
  loadId: string
): RfidDockRow | null {
  const load = data.loads.find((l) => l.id === loadId);
  if (!load) return null;

  const proofs = getLoadProofItems(data, loadId);
  const rfid = proofs.find((p) => p.type === "RFID / Dock Validation Record");
  const lumper = proofs.find((p) => p.type === "Lumper Receipt");

  const trailerConfirmedAtDock =
    rfid?.status === "Complete" ||
    (load.status === "Delivered" && load.sealStatus === "OK");

  const unloadCheckpointNarrative = trailerConfirmedAtDock
    ? `Unload window RFID/dock handshake recorded for load ${load.number} (demo-derived).`
    : `Dock / yard checkpoint pending — align RFID read with BOL delivery window.`;

  let lumperWorkflowStatus: RfidDockRow["lumperWorkflowStatus"] = "pending";
  if (lumper?.status === "Complete") lumperWorkflowStatus = "confirmed";
  else if (lumper?.blocksPayment || lumper?.status === "Missing")
    lumperWorkflowStatus = "receipt_required";

  const receiptStillRequired =
    lumper != null &&
    lumper.status !== "Not required" &&
    lumper.status !== "Complete";

  const bofNote =
    "RFID supports trailer presence and dock workflow timing; itemized lumper receipt and photos remain authoritative for payroll and claims.";

  const nextAction = receiptStillRequired
    ? "Collect lumper receipt + match to RFID dock timestamp"
    : trailerConfirmedAtDock
      ? "Archive dock RFID trace with POD bundle"
      : "Complete dock RFID validation before releasing trailer";

  return {
    id: `RFID-DOCK-${load.id}`,
    loadId: load.id,
    loadNumber: load.number,
    driverId: load.driverId,
    driverName: driverName(data, load.driverId),
    trailerConfirmedAtDock,
    unloadCheckpointNarrative,
    lumperWorkflowStatus,
    receiptStillRequired,
    bofNote,
    nextAction,
  };
}

export function buildRfidMaintenanceRows(data: BofData): RfidMaintenanceRow[] {
  const byAsset = new Map<string, string[]>();
  for (const l of data.loads) {
    const cur = byAsset.get(l.assetId) ?? [];
    cur.push(l.id);
    byAsset.set(l.assetId, cur);
  }

  const maintMar =
    "moneyAtRisk" in data && Array.isArray(data.moneyAtRisk)
      ? data.moneyAtRisk.filter((m) => /maintenance/i.test(m.category))
      : [];

  const rows: RfidMaintenanceRow[] = [];
  let idx = 0;
  for (const [assetId, loadIds] of byAsset) {
    const mar = maintMar.find(
      (m) =>
        (m.assetId != null && m.assetId === assetId) ||
        (m.loadId != null && loadIds.includes(m.loadId))
    );
    const exposure = mar?.amount ?? Math.round(400 + loadIds.length * 220);
    const exceptionLoads = data.loads.filter(
      (l) => loadIds.includes(l.id) && l.dispatchExceptionFlag
    );
    const serviceZoneVerified = exceptionLoads.length === 0;
    const inspectionCheckpointVerified = loadIds.length <= 4;
    const componentEventLogged = !mar || mar.status !== "At risk";

    rows.push({
      id: `RFID-MAINT-${idx++}`,
      assetId,
      serviceZoneVerified,
      inspectionCheckpointVerified,
      componentEventLogged,
      readinessImpact: mar
        ? "Maintenance register row linked — RFID yard gate confirms asset on property when equipped."
        : "Derived readiness from load volume on asset; schedule RFID yard confirmation.",
      overdueExposureUsd: exposure,
      nextAction: mar
        ? "Close MAR maintenance item; log PM completion to RFID service lane"
        : "Book PM; verify RFID service-bay check-in",
      relatedLoadIds: loadIds.slice(0, 4),
    });
  }

  return rows.sort((a, b) => b.overdueExposureUsd - a.overdueExposureUsd);
}

export function buildRfidFuelExceptionQueue(
  data: BofData,
  limit = 8
): RfidFuelRow[] {
  const out: RfidFuelRow[] = [];
  for (const load of data.loads) {
    const row = buildRfidFuelRowForLoad(data, load.id);
    if (!row) continue;
    if (row.unauthorizedFuelingFlag || !row.routeCheckpointMatch)
      out.push(row);
  }
  return out.slice(0, limit);
}

export function buildFleetFuelAnomalyTotalUsd(data: BofData): number {
  let t = 0;
  for (const load of data.loads) {
    const row = buildRfidFuelRowForLoad(data, load.id);
    if (row) t += row.fuelAnomalyOpportunityUsd;
  }
  return t;
}

export function formatRfidMoneyLine(n: number): string {
  return `${formatUsd(n)} est. opportunity / exposure`;
}

/**
 * When true, the load detail map may show an RFID checkpoint marker aligned with
 * the RFID intelligence panel (verification / attribution — not full tracking).
 */
export function loadShowsRfPanel(data: BofData, loadId: string): boolean {
  return data.loads.some((l) => l.id === loadId);
}
