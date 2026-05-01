import type { BofData } from "./load-bof-data";
import type { TripPacketValidation } from "./load-trip-packet";
import {
  getLoadEvidenceForLoad,
  getLoadEvidenceManifest,
  getLoadEvidenceUrl,
} from "./load-documents";
import { tripPacketToLoadDocumentPacket } from "./load-trip-packet";

export const LOAD_PROOF_TYPES = [
  "Rate Confirmation",
  "BOL",
  "Signed BOL",
  "POD",
  "Fuel Receipt",
  "Pickup Seal Photo",
  "Delivery Seal Photo",
  "Pre-Trip Cargo Photo",
  "Delivery / Empty-Trailer Photo",
  "Lumper Receipt",
  "RFID / Dock Validation Record",
  "Cargo Damage Photos",
  "Claim Support Docs",
] as const;

export type LoadProofStatus =
  | "Complete"
  | "Pending"
  | "Missing"
  | "Not required"
  | "Disputed";

/** UI label: Complete → Present */
export function proofStatusDisplay(status: LoadProofStatus): string {
  if (status === "Complete") return "Present";
  return status;
}

export function getLoadProofSummary(items: LoadProofItem[]) {
  const applicable = items.filter((i) => i.status !== "Not required");
  const complete = applicable.filter((i) => i.status === "Complete").length;
  const blockingCount = items.filter((i) => i.blocksPayment).length;
  const disputeSensitiveCount = items.filter((i) => i.disputeExposure).length;
  const completionPct =
    applicable.length === 0
      ? 100
      : Math.round((complete / applicable.length) * 100);
  return {
    completionPct,
    blockingCount,
    disputeSensitiveCount,
    applicableCount: applicable.length,
    completeCount: complete,
  };
}

export type LoadProofItem = {
  type: string;
  status: LoadProofStatus;
  blocksPayment: boolean;
  /** Exposure for disputes / chargeback defense */
  disputeExposure: boolean;
  /** Suggested RF / ops follow-up */
  rfAction?: string;
  riskNote?: string;
  fileUrl?: string;
  previewUrl?: string;
  /** Ops / finance free-text on this proof line */
  notes?: string;
};

export type LoadProofBundle = {
  claimApplicable?: boolean;
  /** Keys are proof type labels (e.g. "Rate Confirmation"); values omit `type` — it comes from the key at merge time. */
  items?: Partial<Record<string, Partial<LoadProofItem>>>;
};

export type LoadEvidenceType =
  | "rate_confirmation"
  | "bol"
  | "pod"
  | "invoice"
  | "work_order"
  | "master_agreement_reference"
  | "cargo_photo"
  | "seal_photo"
  | "equipment_photo"
  | "pickup_photo"
  | "delivery_photo"
  | "empty_trailer_proof"
  | "seal_mismatch_photo"
  | "cargo_damage_photo"
  | "damaged_pallet_photo"
  | "temp_check_photo"
  | "weight_ticket_photo"
  | "detention_proof_photo"
  | "safety_violation_photo"
  | "lumper_receipt"
  | "rfid_proof"
  | "rfid_dock_proof"
  | "claim_intake"
  | "factoring_notification"
  | "settlement_hold_notice"
  | "damage_photo_packet"
  | "claim_packet"
  | "insurance_notice";

export type LoadEvidenceStatus =
  | "ready"
  | "pending"
  | "missing"
  | "not_applicable"
  | "blocked";

export type LoadEvidenceItem = {
  id: string;
  loadId: string;
  label: string;
  section: "core" | "proof" | "exceptions" | "reference";
  type: LoadEvidenceType;
  status: LoadEvidenceStatus;
  url?: string;
  fileName?: string;
  note?: string;
  requiredForSettlementRelease: boolean;
  requiredForClaimRelease?: boolean;
  uploadedAt?: string;
  source?:
    | "actual_docs"
    | "generated"
    | "manual_upload"
    | "rfid"
    | "camera"
    | "ai_generated"
    | "svg_demo"
    | "real"
    | "missing";
};

export type LoadDocumentPacket = {
  loadId: string;
  customerName?: string;
  settlementHold: boolean;
  holdReason?: string;
  documents: LoadEvidenceItem[];
  /** Canonical trip packet validation (delivered-load checklist, filing summary). */
  tripValidation?: TripPacketValidation;
};

function loadRecord(data: BofData, loadId: string) {
  return data.loads.find((l) => l.id === loadId) ?? null;
}

function bundleForLoad(data: BofData, loadId: string): LoadProofBundle | null {
  if (!("loadProofBundles" in data) || !data.loadProofBundles) return null;
  const bundles = data.loadProofBundles as Record<string, LoadProofBundle>;
  return bundles[loadId] ?? null;
}

function settlementLumperFlag(data: BofData, driverId: string) {
  if (!("settlements" in data) || !Array.isArray(data.settlements)) return false;
  const s = data.settlements.find((x) => x.driverId === driverId);
  return /lumper/i.test(s?.pendingReason ?? "");
}

function claimApplicable(load: NonNullable<ReturnType<typeof loadRecord>>, bundle: LoadProofBundle | null) {
  if (bundle?.claimApplicable != null) return bundle.claimApplicable;
  return (
    load.dispatchExceptionFlag ||
    (load.status === "Delivered" && load.sealStatus === "Mismatch")
  );
}

/** Derive default proof stack from `loads[]` + optional settlement hint; merge JSON bundle overrides by type. */
export function getLoadProofItems(data: BofData, loadId: string): LoadProofItem[] {
  const load = loadRecord(data, loadId);
  if (!load) return [];

  const bundle = bundleForLoad(data, loadId);
  const overrides = bundle?.items ?? {};
  const delivered = load.status === "Delivered";
  const pendingAssign = load.status === "Pending";
  const lumperHold = settlementLumperFlag(data, load.driverId);
  const showClaim = claimApplicable(load, bundle);

  const pod = load.podStatus?.toLowerCase() ?? "";
  const podComplete = pod === "verified";
  const podPending = pod === "pending";

  const hasPickupSeal = Boolean(String(load.pickupSeal ?? "").trim());
  const hasDeliverySeal = Boolean(String(load.deliverySeal ?? "").trim());

  const sealMismatch = load.sealStatus === "Mismatch";

  const derived: LoadProofItem[] = [
    {
      type: "Rate Confirmation",
      status: pendingAssign ? "Pending" : "Complete",
      blocksPayment: delivered && pendingAssign,
      disputeExposure: false,
      rfAction: pendingAssign ? "Obtain signed rate confirmation before dispatch" : undefined,
      riskNote: pendingAssign ? "Cannot clear for payment without RC on file" : undefined,
    },
    {
      type: "BOL",
      status: pendingAssign
        ? "Pending"
        : delivered && sealMismatch
          ? "Disputed"
          : delivered || load.status === "En Route"
            ? "Complete"
            : "Pending",
      blocksPayment: delivered && pendingAssign,
      disputeExposure: sealMismatch && delivered,
      rfAction: sealMismatch ? "Align BOL with seal verification" : undefined,
      riskNote: sealMismatch ? "Seal mismatch increases dispute risk on BOL" : undefined,
    },
    {
      type: "Signed BOL",
      status: pendingAssign
        ? "Pending"
        : delivered && sealMismatch
          ? "Disputed"
          : delivered || load.status === "En Route"
            ? "Complete"
            : "Pending",
      blocksPayment: false,
      disputeExposure: sealMismatch && delivered,
      rfAction: sealMismatch ? "Obtain signed shipper BOL matching seal IDs" : undefined,
      riskNote: undefined,
    },
    {
      type: "POD",
      status: podComplete
        ? "Complete"
        : delivered && podPending && sealMismatch
          ? "Disputed"
          : podPending
            ? "Pending"
            : delivered
              ? "Missing"
              : "Pending",
      blocksPayment: delivered && !podComplete,
      disputeExposure: delivered && !podComplete,
      rfAction:
        delivered && !podComplete
          ? "Upload and verify POD to release payment"
          : podPending
            ? "Complete POD verification workflow"
            : undefined,
      riskNote: delivered && !podComplete ? "POD required for settlement release" : undefined,
    },
    {
      type: "Fuel Receipt",
      status: delivered ? "Pending" : "Not required",
      blocksPayment: false,
      disputeExposure: delivered,
      rfAction: delivered ? "Retain itemized fuel receipt for audit" : undefined,
      riskNote: undefined,
    },
    {
      type: "Pickup Seal Photo",
      status: hasPickupSeal ? "Pending" : "Missing",
      blocksPayment: delivered && !hasPickupSeal,
      disputeExposure: delivered && !hasPickupSeal,
      rfAction: hasPickupSeal ? "Attach timestamped pickup seal image" : "Capture pickup seal at shipper",
      riskNote: !hasPickupSeal ? "No pickup seal reference — cargo custody weak" : undefined,
    },
    {
      type: "Delivery Seal Photo",
      status: hasDeliverySeal ? "Pending" : "Missing",
      blocksPayment: delivered && !hasDeliverySeal,
      disputeExposure: delivered && (!hasDeliverySeal || sealMismatch),
      rfAction: hasDeliverySeal
        ? sealMismatch
          ? "Re-verify delivery seal vs BOL"
          : "Confirm delivery seal image in file"
        : "Capture delivery seal at consignee",
      riskNote:
        !hasDeliverySeal || sealMismatch
          ? "Delivery seal gap or mismatch — payment and claims risk"
          : undefined,
    },
    {
      type: "Pre-Trip Cargo Photo",
      status: delivered ? "Pending" : "Missing",
      blocksPayment: false,
      disputeExposure: delivered,
      rfAction: "Archive pre-trip cargo condition photos",
      riskNote: "Needed for cargo claims defense",
    },
    {
      type: "Delivery / Empty-Trailer Photo",
      status: delivered ? "Pending" : "Not required",
      blocksPayment: false,
      disputeExposure: delivered,
      rfAction: delivered ? "Confirm empty trailer / delivery condition" : undefined,
    },
    {
      type: "Lumper Receipt",
      status: lumperHold ? "Missing" : delivered ? "Not required" : "Pending",
      blocksPayment: lumperHold,
      disputeExposure: lumperHold,
      rfAction: lumperHold ? "Upload lumper receipt to clear payroll hold" : undefined,
      riskNote: lumperHold ? "Payroll flagged missing lumper documentation" : undefined,
    },
    {
      type: "RFID / Dock Validation Record",
      status:
        delivered && load.sealStatus === "OK" && hasDeliverySeal && hasPickupSeal
          ? "Complete"
          : "Pending",
      blocksPayment: false,
      disputeExposure: false,
      rfAction: "Confirm dock scan / RFID handoff where equipped",
      riskNote:
        "RFID verifies checkpoint / attribution — does not replace BOL, POD, or lumper receipt where required",
    },
    {
      type: "Cargo Damage Photos",
      status: showClaim ? "Pending" : "Not required",
      blocksPayment: false,
      disputeExposure: showClaim,
      rfAction: showClaim ? "Archive timestamped damage set for carrier claim" : undefined,
      riskNote: showClaim ? "Concealed / delivery damage — retain photo set" : undefined,
    },
    {
      type: "Claim Support Docs",
      status: showClaim ? "Pending" : "Not required",
      blocksPayment: showClaim && delivered,
      disputeExposure: showClaim,
      rfAction: showClaim ? "Assemble claim file (photos, BOL, correspondence)" : undefined,
      riskNote: showClaim ? "Active or potential claim — hold supporting proofs" : undefined,
    },
  ];

  const withOverrides = derived.map((item) => {
    const o = overrides[item.type];
    if (!o) return item;
    return {
      ...item,
      ...o,
      type: item.type,
    };
  });

  return attachDemoEvidenceFileUrls(loadId, withOverrides);
}

/** When generated demo evidence exists on disk, surface URLs and mark line items Present. */
function attachDemoEvidenceFileUrls(loadId: string, items: LoadProofItem[]): LoadProofItem[] {
  const urlByType: Record<string, string | undefined> = {
    "Pickup Seal Photo": getLoadEvidenceUrl(loadId, "sealPickupPhoto"),
    "Delivery Seal Photo": getLoadEvidenceUrl(loadId, "sealDeliveryPhoto"),
    "Pre-Trip Cargo Photo": getLoadEvidenceUrl(loadId, "cargoPhoto"),
    "Delivery / Empty-Trailer Photo": getLoadEvidenceUrl(loadId, "deliveryPhoto"),
    "Cargo Damage Photos": getLoadEvidenceUrl(loadId, "damagePhoto"),
    "Claim Support Docs": getLoadEvidenceUrl(loadId, "claimEvidence"),
  };

  return items.map((item) => {
    const url = urlByType[item.type];
    if (!url) return item;
    const merged: LoadProofItem = {
      ...item,
      fileUrl: item.fileUrl ?? url,
      previewUrl: item.previewUrl ?? url,
    };
    if (item.status === "Disputed") return merged;
    return { ...merged, status: "Complete" };
  });
}

export function proofBlockingCount(items: LoadProofItem[]) {
  return items.filter((i) => i.blocksPayment).length;
}

export function proofItemsForDriverLoads(data: BofData, driverId: string) {
  return data.loads
    .filter((l) => l.driverId === driverId)
    .map((l) => ({
      load: l,
      items: getLoadProofItems(data, l.id),
      blocking: proofBlockingCount(getLoadProofItems(data, l.id)),
    }));
}

export type ProofRiskRow = {
  id: string;
  category: string;
  driver: string;
  driverId: string;
  loadId: string;
  assetId: string;
  amount: number;
  rootCause: string;
  nextBestAction: string;
  owner: string;
  status: string;
};

export function buildProofRiskRows(data: BofData): ProofRiskRow[] {
  const rows: ProofRiskRow[] = [];
  for (const load of data.loads) {
    const items = getLoadProofItems(data, load.id);
    const blocking = items.filter((i) => i.blocksPayment);
    if (blocking.length === 0) continue;
    const driver = data.drivers.find((d) => d.id === load.driverId);
    rows.push({
      id: `PR-${load.id}`,
      category: "Proof / payment hold",
      driver: driver?.name ?? load.driverId,
      driverId: load.driverId,
      loadId: load.id,
      assetId: load.assetId,
      amount: load.revenue,
      rootCause: `${blocking.length} proof item(s) blocking payment: ${blocking.map((b) => b.type).join("; ")}`,
      nextBestAction: "Close proof gaps on load record before settlement release",
      owner: "Finance / Dispatch",
      status: "Open",
    });
  }
  return rows;
}

export type RfActionRow = {
  id: string;
  loadId: string;
  loadNumber: string;
  proofType: string;
  priority: "P0" | "P1" | "P2";
  action: string;
  owner: string;
  blocksPayment: boolean;
  driverId: string;
  driverName: string;
};

export function buildRfActions(data: BofData): RfActionRow[] {
  const out: RfActionRow[] = [];
  for (const load of data.loads) {
    const items = getLoadProofItems(data, load.id);
    const driver = data.drivers.find((d) => d.id === load.driverId);
    for (const item of items) {
      if (item.status === "Complete" || item.status === "Not required") continue;
      if (
        !item.blocksPayment &&
        !item.disputeExposure &&
        item.status !== "Missing"
      )
        continue;
      const p0 = item.blocksPayment;
      const p1 = item.disputeExposure && !p0;
      out.push({
        id: `RF-${load.id}-${item.type.replace(/\s+/g, "-")}`,
        loadId: load.id,
        loadNumber: load.number,
        proofType: item.type,
        priority: p0 ? "P0" : p1 ? "P1" : "P2",
        action: item.rfAction ?? `Resolve ${item.type} for load ${load.number}`,
        owner: item.blocksPayment ? "Finance & Dispatch" : "Dispatch",
        blocksPayment: item.blocksPayment,
        driverId: load.driverId,
        driverName: driver?.name ?? load.driverId,
      });
    }
  }
  const order = { P0: 0, P1: 1, P2: 2 };
  out.sort(
    (a, b) => order[a.priority] - order[b.priority] || a.id.localeCompare(b.id)
  );
  return out;
}


export function getLoadDocumentPacket(data: BofData, loadId: string): LoadDocumentPacket | null {
  return tripPacketToLoadDocumentPacket(data, loadId);
}

export function getLoadEvidenceForSettlement(data: BofData, loadIds: string[]) {
  return loadIds
    .map((lid) => getLoadDocumentPacket(data, lid))
    .filter((packet): packet is LoadDocumentPacket => Boolean(packet));
}

export { getLoadEvidenceManifest, getLoadEvidenceForLoad };
