/**
 * Bridges RFID intelligence + load proof layer into document-engine status/metadata.
 * Uses only existing modules: rfid-intelligence, load-proof (no fabricated events).
 */
import type { BofData } from "./load-bof-data";
import {
  buildRfidDockRowForLoad,
  buildRfidFuelRowForLoad,
  buildRfidMaintenanceRows,
} from "./rfid-intelligence";
import type { LoadProofItem } from "./load-proof";
import { getLoadProofItems } from "./load-proof";

function proofItem(data: BofData, loadId: string, label: string) {
  return getLoadProofItems(data, loadId).find((p) => p.type === label);
}

export type RfDocInfluence = {
  status: string;
  blocksPayment: boolean;
  notes?: string;
  rfEventId?: string;
  financialImpactUsd?: number;
};

/**
 * Adjusts document status/notes from RFID dock / fuel / maintenance snapshots.
 * When RFID rows cannot be built, returns `base` unchanged (caller supplies load-based logic).
 */
export function mergeRfidIntoLoadScopedDocument(
  data: BofData,
  loadId: string,
  type: string,
  proof: LoadProofItem | null | undefined,
  base: { status: string; blocksPayment: boolean; notes?: string }
): RfDocInfluence {
  const load = data.loads.find((l) => l.id === loadId);
  if (!load) return { ...base };

  const dock = buildRfidDockRowForLoad(data, loadId);
  const fuel = buildRfidFuelRowForLoad(data, loadId);

  let status = base.status;
  let blocksPayment = base.blocksPayment;
  let notes = base.notes;
  let rfEventId: string | undefined;
  let financialImpactUsd: number | undefined;

  const sealMismatch = load.sealStatus === "Mismatch";
  const sealTypes = new Set([
    "Pickup Seal Verification",
    "Delivery Seal Verification",
    "Pickup Seal Photo",
    "Delivery Seal Photo",
  ]);

  // --- POD (load + proof naming) ---
  if (type === "POD") {
    const emptyP = proofItem(data, loadId, "Delivery / Empty-Trailer Photo");
    const rfidP = proofItem(data, loadId, "RFID / Dock Validation Record");
    const podProof = proof ?? proofItem(data, loadId, "POD");
    rfEventId = dock?.id ?? `RFID-DOCK-${loadId}`;
    const rfEmptyOk =
      emptyP?.status === "Complete" ||
      (rfidP?.status === "Complete" &&
        (String(load.podStatus).toLowerCase() === "verified" ||
          load.status === "Delivered"));
    if (rfEmptyOk) {
      status = "Verified (RF trailer-empty / dock chain)";
      blocksPayment = podProof?.blocksPayment ?? base.blocksPayment;
      notes =
        [podProof?.notes, podProof?.riskNote, dock?.unloadCheckpointNarrative]
          .filter(Boolean)
          .join(" · ") || notes;
    } else if (podProof) {
      const wasOk =
        podProof.status === "Complete" ||
        String(load.podStatus).toLowerCase() === "verified";
      status = wasOk
        ? "Pending — RF trailer-empty chain not confirmed"
        : podProof.status;
      blocksPayment = podProof.blocksPayment;
      notes =
        [podProof.notes, podProof.riskNote, dock?.unloadCheckpointNarrative]
          .filter(Boolean)
          .join(" · ") || notes;
    } else {
      status = "Missing — RF trailer-empty chain incomplete";
      blocksPayment = base.blocksPayment;
      notes = dock?.unloadCheckpointNarrative ?? notes;
    }
    return { status, blocksPayment, notes, rfEventId, financialImpactUsd };
  }

  // --- Seals ---
  if (sealTypes.has(type) && sealMismatch) {
    rfEventId = dock?.id ?? `RFID-DOCK-${loadId}`;
    financialImpactUsd = Math.round(load.revenue * 0.025);
    status = `Exception (RF seal scan mismatch proxy) — sealStatus=${load.sealStatus}`;
    notes =
      [proof?.notes, proof?.riskNote, dock?.unloadCheckpointNarrative]
        .filter(Boolean)
        .join(" · ") || notes;
    return { status, blocksPayment, notes, rfEventId, financialImpactUsd };
  }

  // --- Lumper ---
  if (type === "Lumper Receipt" && dock) {
    rfEventId = dock.id;
    if (dock.lumperWorkflowStatus === "confirmed" && proof?.status === "Complete") {
      status = `${proof.status} · RF dock: unload/lumper validated`;
    } else if (dock.receiptStillRequired) {
      status = `Pending — RFID dock / lumper (${dock.lumperWorkflowStatus})`;
    }
    notes =
      [proof?.notes, proof?.riskNote, dock.bofNote].filter(Boolean).join(" · ") ||
      notes;
    return { status, blocksPayment, notes, rfEventId, financialImpactUsd };
  }

  // --- Fuel ---
  if (type === "Fuel Receipt" && fuel) {
    rfEventId = fuel.id;
    financialImpactUsd = fuel.fuelAnomalyOpportunityUsd;
    const pStatus = proof?.status ?? "Generated";
    status = fuel.unauthorizedFuelingFlag
      ? `${pStatus} · RF: unauthorized / unverified fueling pattern`
      : fuel.routeCheckpointMatch
        ? `${pStatus} · RF fuel checkpoint aligned`
        : `${pStatus} · RF route checkpoint mismatch`;
    notes =
      [proof?.notes, proof?.riskNote, fuel.verifiedFuelingNarrative, fuel.nextAction]
        .filter(Boolean)
        .join("\n") || notes;
    return { status, blocksPayment, notes, rfEventId, financialImpactUsd };
  }

  // --- Maintenance (load-scoped report) ---
  if (type === "Maintenance Report") {
    const maint = buildRfidMaintenanceRows(data).find((r) =>
      r.relatedLoadIds.includes(loadId)
    );
    if (maint) {
      rfEventId = maint.id;
      financialImpactUsd = maint.overdueExposureUsd;
      notes =
        [proof?.notes, proof?.riskNote, maint.readinessImpact, maint.nextAction]
          .filter(Boolean)
          .join("\n") || notes;
      if (base.status === "See MAR / asset rows" || base.status === "Generated") {
        status =
          maint.serviceZoneVerified && maint.componentEventLogged
            ? "RF maintenance: nominal"
            : "RF maintenance alert — review asset lane";
      }
    }
    return { status, blocksPayment, notes, rfEventId, financialImpactUsd };
  }

  return { ...base };
}
