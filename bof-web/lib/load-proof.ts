import type { BofData } from "./load-bof-data";
import { getSafetyEvidenceByLoadId } from "./safety-evidence";
import { getGeneratedLoadDocUrl } from "./load-doc-manifest";
import {
  getLoadEvidenceMeta,
  getLoadEvidenceForLoad,
  getLoadEvidenceManifest,
  getLoadEvidenceUrl,
} from "./load-documents";

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
  section: "core" | "proof" | "exceptions";
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
    | "real";
};

function withResolvedStatus(item: LoadEvidenceItem): LoadEvidenceItem {
  if (item.status === "ready" && !item.url) {
    return {
      ...item,
      status: "missing",
      note: item.note || "File URL missing. Marked Missing to prevent false-ready state.",
    };
  }
  return item;
}

export type LoadDocumentPacket = {
  loadId: string;
  customerName?: string;
  settlementHold: boolean;
  holdReason?: string;
  documents: LoadEvidenceItem[];
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

function toEvidenceStatus(status: LoadProofStatus): LoadEvidenceStatus {
  if (status === "Complete") return "ready";
  if (status === "Pending") return "pending";
  if (status === "Missing") return "missing";
  if (status === "Not required") return "not_applicable";
  return "blocked";
}

function sourceFromUrl(url?: string): LoadEvidenceItem["source"] {
  const u = String(url ?? "").trim();
  if (!u) return undefined;
  if (u.includes("/actual_docs/")) return "actual_docs";
  if (u.includes("/generated/")) return "generated";
  if (u.includes("/evidence/")) return "generated";
  if (u.includes("/proof/")) return "manual_upload";
  return "manual_upload";
}

function sourceFromEvidenceKey(loadId: string, key: Parameters<typeof getLoadEvidenceMeta>[1]) {
  const meta = getLoadEvidenceMeta(loadId, key);
  if (!meta?.source) return undefined;
  if (meta.source === "ai_generated") return "ai_generated";
  if (meta.source === "svg_demo") return "svg_demo";
  if (meta.source === "real") return "real";
  return undefined;
}

function fileNameFromUrl(url?: string): string | undefined {
  const u = String(url ?? "").trim();
  if (!u) return undefined;
  const parts = u.split("/").filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : undefined;
}

function proofByType(items: LoadProofItem[], type: string): LoadProofItem | undefined {
  return items.find((i) => i.type === type);
}

function toEvidenceItem(
  loadId: string,
  label: string,
  section: LoadEvidenceItem["section"],
  type: LoadEvidenceType,
  proof: LoadProofItem | undefined,
  requiredForSettlementRelease: boolean,
  extra?: Partial<LoadEvidenceItem>
): LoadEvidenceItem {
  const status = proof ? toEvidenceStatus(proof.status) : "missing";
  const url = (proof?.fileUrl || proof?.previewUrl || "").trim() || undefined;
  return {
    id: `${loadId}:${type}`,
    loadId,
    label,
    section,
    type,
    status,
    url,
    fileName: fileNameFromUrl(url),
    note: proof?.riskNote || proof?.notes || extra?.note,
    requiredForSettlementRelease,
    source: sourceFromUrl(url) ?? extra?.source,
    ...extra,
  };
}

let hasWarnedPacketCoverage = false;

export function getLoadDocumentPacket(data: BofData, loadId: string): LoadDocumentPacket | null {
  const load = loadRecord(data, loadId);
  if (!load) return null;
  const proofItems = getLoadProofItems(data, loadId);
  const bundle = bundleForLoad(data, loadId);

  const requiredSeal = Boolean(String(load.pickupSeal ?? "").trim() || String(load.deliverySeal ?? "").trim());
  const generatedRate = getGeneratedLoadDocUrl(loadId, "rateConfirmation");
  const generatedBol = getGeneratedLoadDocUrl(loadId, "bol");
  const generatedPod = getGeneratedLoadDocUrl(loadId, "pod");
  const generatedInvoice = getGeneratedLoadDocUrl(loadId, "invoice");
  const generatedWorkOrder = getGeneratedLoadDocUrl(loadId, "workOrder");
  const generatedMasterAgreementReference = getGeneratedLoadDocUrl(
    loadId,
    "masterAgreementReference"
  );
  const generatedSeal = getGeneratedLoadDocUrl(loadId, "sealVerification");
  const generatedRfid = getGeneratedLoadDocUrl(loadId, "rfidProof");
  const generatedCargoPhoto = getGeneratedLoadDocUrl(loadId, "cargoPhoto");
  const generatedSealPickupPhoto = getGeneratedLoadDocUrl(loadId, "sealPickupPhoto");
  const generatedSealDeliveryPhoto = getGeneratedLoadDocUrl(loadId, "sealDeliveryPhoto");
  const generatedSealPhoto = getLoadEvidenceUrl(loadId, "sealPhoto");
  const generatedEquipmentPhoto = getLoadEvidenceUrl(loadId, "equipmentPhoto");
  const generatedPickupPhoto = getLoadEvidenceUrl(loadId, "pickupPhoto");
  const generatedDeliveryPhoto = getLoadEvidenceUrl(loadId, "deliveryPhoto");
  const generatedClaimIntake = getGeneratedLoadDocUrl(loadId, "claimIntake");
  const generatedInsuranceNotification = getGeneratedLoadDocUrl(
    loadId,
    "insuranceNotification"
  );
  const generatedFactoringNotification = getGeneratedLoadDocUrl(
    loadId,
    "factoringNotification"
  );
  const generatedSettlementHoldNotice = getGeneratedLoadDocUrl(
    loadId,
    "settlementHoldNotice"
  );
  const generatedDamagePhotoPacket = getGeneratedLoadDocUrl(
    loadId,
    "damagePhotoPacket"
  );
  const generatedLumper =
    getLoadEvidenceUrl(loadId, "lumperReceipt") ?? getGeneratedLoadDocUrl(loadId, "lumperReceipt");
  const generatedClaim = getGeneratedLoadDocUrl(loadId, "claimPacket");
  const generatedDamagePhoto =
    getLoadEvidenceUrl(loadId, "damagePhoto") ?? getGeneratedLoadDocUrl(loadId, "damageClaimPhoto");
  const generatedClaimEvidence = getLoadEvidenceUrl(loadId, "claimEvidence");
  const generatedEmptyTrailerProof = getLoadEvidenceUrl(loadId, "emptyTrailerProof");
  const generatedRfidDockProof = getLoadEvidenceUrl(loadId, "rfidDockProof");
  const generatedCargoDamagePhoto = getLoadEvidenceUrl(loadId, "cargoDamagePhoto");
  const generatedDamagedPalletPhoto = getLoadEvidenceUrl(loadId, "damagedPalletPhoto");
  const generatedSealMismatchPhoto = getLoadEvidenceUrl(loadId, "sealMismatchPhoto");
  const generatedTempCheckPhoto = getLoadEvidenceUrl(loadId, "tempCheckPhoto");
  const generatedWeightTicketPhoto = getLoadEvidenceUrl(loadId, "weightTicketPhoto");
  const generatedDetentionProofPhoto = getLoadEvidenceUrl(loadId, "detentionProofPhoto");
  const generatedSafetyViolationPhoto = getGeneratedLoadDocUrl(loadId, "safetyViolationPhoto");

  const rate = {
    ...toEvidenceItem(
      loadId,
      "Rate Confirmation",
      "core",
      "rate_confirmation",
      proofByType(proofItems, "Rate Confirmation"),
      true
    ),
    status: generatedRate ? "ready" : "missing",
    url: generatedRate,
    fileName: fileNameFromUrl(generatedRate),
    note: generatedRate
      ? "Generated from load data template."
      : "Required document not generated yet for this load.",
    source: generatedRate ? "generated" : undefined,
  } as LoadEvidenceItem;
  const bol = {
    ...toEvidenceItem(loadId, "BOL", "core", "bol", proofByType(proofItems, "BOL"), true),
    status: generatedBol ? "ready" : "missing",
    url: generatedBol,
    fileName: fileNameFromUrl(generatedBol),
    note: generatedBol
      ? "Generated from load data template."
      : "Required document not generated yet for this load.",
    source: generatedBol ? "generated" : undefined,
  } as LoadEvidenceItem;
  const pod = {
    ...toEvidenceItem(loadId, "POD", "core", "pod", proofByType(proofItems, "POD"), true),
    status: generatedPod ? "ready" : load.status === "Delivered" ? "missing" : "pending",
    url: generatedPod,
    fileName: fileNameFromUrl(generatedPod),
    note: generatedPod
      ? "Generated from load data template."
      : load.status === "Delivered"
        ? "Required POD document missing for delivered load."
        : "POD can be generated once delivery proof is finalized.",
    source: generatedPod ? "generated" : undefined,
  } as LoadEvidenceItem;
  const invoiceOverride = bundle?.items?.Invoice;
  const invoice: LoadEvidenceItem = {
    id: `${loadId}:invoice`,
    loadId,
    label: "Invoice",
    section: "core",
    type: "invoice",
    status: generatedInvoice
      ? "ready"
      : invoiceOverride?.status
        ? toEvidenceStatus(invoiceOverride.status as LoadProofStatus)
        : load.status === "Delivered"
          ? "missing"
          : "pending",
    url: generatedInvoice || String(invoiceOverride?.fileUrl ?? invoiceOverride?.previewUrl ?? "").trim() || undefined,
    fileName: fileNameFromUrl(
      generatedInvoice || String(invoiceOverride?.fileUrl ?? invoiceOverride?.previewUrl ?? "")
    ),
    note:
      String(invoiceOverride?.notes ?? "").trim() ||
      (generatedInvoice
        ? "Generated from load data template."
        : load.status === "Delivered"
          ? "Required invoice is missing for delivered load."
          : "Invoice publishes after delivery confirmation."),
    requiredForSettlementRelease: true,
    source:
      sourceFromUrl(generatedInvoice || String(invoiceOverride?.fileUrl ?? invoiceOverride?.previewUrl ?? "")) ??
      (load.status === "Delivered" ? "generated" : undefined),
  };
  const workOrder: LoadEvidenceItem = {
    id: `${loadId}:work_order`,
    loadId,
    label: "Work Order",
    section: "core",
    type: "work_order",
    status: generatedWorkOrder ? "ready" : "missing",
    url: generatedWorkOrder,
    fileName: fileNameFromUrl(generatedWorkOrder),
    note: generatedWorkOrder
      ? "Generated schedule/work-order document."
      : "Work order missing for this load.",
    requiredForSettlementRelease: true,
    source: generatedWorkOrder ? "generated" : undefined,
  };
  const formalMasterAgreement = Boolean(String(load.masterAgreementId ?? "").trim());
  const masterAgreementReference: LoadEvidenceItem = {
    id: `${loadId}:master_agreement_reference`,
    loadId,
    label: "Master Agreement Reference",
    section: "core",
    type: "master_agreement_reference",
    status: generatedMasterAgreementReference ? "ready" : "missing",
    url: generatedMasterAgreementReference,
    fileName: fileNameFromUrl(generatedMasterAgreementReference),
    note: generatedMasterAgreementReference
      ? formalMasterAgreement
        ? "Reference to executed master agreement on file (approved BOF template)."
        : "Draft reference from approved BOF template — assign masterAgreementId in demo data when MA is executed."
      : "Approved template missing or document not generated.",
    requiredForSettlementRelease: false,
    source: generatedMasterAgreementReference ? "generated" : undefined,
  };
  const cargoUrl = getLoadEvidenceUrl(loadId, "cargoPhoto") ?? generatedCargoPhoto;
  const cargo = {
    ...toEvidenceItem(
    loadId,
    "Cargo photo",
    "proof",
    "cargo_photo",
    proofByType(proofItems, "Pre-Trip Cargo Photo"),
    true
    ),
    status: cargoUrl ? "ready" : "missing",
    url: cargoUrl,
    fileName: fileNameFromUrl(cargoUrl),
    note: cargoUrl
      ? "Cargo condition evidence image."
      : "Cargo photo evidence is missing.",
    source:
      sourceFromEvidenceKey(loadId, "cargoPhoto") ??
      (cargoUrl ? sourceFromUrl(cargoUrl) : undefined),
  } as LoadEvidenceItem;
  const sealPhotoUrl = generatedSealPhoto ?? generatedSealDeliveryPhoto ?? generatedSealPickupPhoto;
  const sealPhoto = {
    ...toEvidenceItem(
      loadId,
      "Seal photo",
      "proof",
      "seal_photo",
      proofByType(proofItems, "Delivery Seal Photo") ?? proofByType(proofItems, "Pickup Seal Photo"),
      requiredSeal
    ),
    status: !requiredSeal ? "not_applicable" : sealPhotoUrl ? "ready" : "missing",
    url: sealPhotoUrl,
    fileName: fileNameFromUrl(sealPhotoUrl),
    note: !requiredSeal
      ? "No seal checkpoint required."
      : sealPhotoUrl
        ? "Combined seal proof image."
        : "Seal photo evidence not generated.",
    source:
      sourceFromEvidenceKey(loadId, "sealPhoto") ??
      (sealPhotoUrl ? sourceFromUrl(sealPhotoUrl) : undefined),
  } as LoadEvidenceItem;
  const equipmentPhoto = {
    ...toEvidenceItem(loadId, "Equipment photo", "proof", "equipment_photo", undefined, false),
    status: generatedEquipmentPhoto ? "ready" : "missing",
    url: generatedEquipmentPhoto,
    fileName: fileNameFromUrl(generatedEquipmentPhoto),
    note: generatedEquipmentPhoto
      ? "Equipment inspection evidence image."
      : "Equipment evidence image not generated.",
    source:
      sourceFromEvidenceKey(loadId, "equipmentPhoto") ??
      (generatedEquipmentPhoto ? sourceFromUrl(generatedEquipmentPhoto) : undefined),
  } as LoadEvidenceItem;
  const pickupPhoto = {
    ...toEvidenceItem(loadId, "Pickup photo", "proof", "pickup_photo", undefined, false),
    status: generatedPickupPhoto ? "ready" : "missing",
    url: generatedPickupPhoto,
    fileName: fileNameFromUrl(generatedPickupPhoto),
    note: generatedPickupPhoto
      ? "Pickup proof image."
      : "Pickup evidence image not generated.",
    source:
      sourceFromEvidenceKey(loadId, "pickupPhoto") ??
      (generatedPickupPhoto ? sourceFromUrl(generatedPickupPhoto) : undefined),
  } as LoadEvidenceItem;
  const deliveryPhoto = {
    ...toEvidenceItem(loadId, "Delivery photo", "proof", "delivery_photo", undefined, false),
    status: generatedDeliveryPhoto ? "ready" : "missing",
    url: generatedDeliveryPhoto,
    fileName: fileNameFromUrl(generatedDeliveryPhoto),
    note: generatedDeliveryPhoto
      ? "Delivery proof image."
      : "Delivery evidence image not generated.",
    source:
      sourceFromEvidenceKey(loadId, "deliveryPhoto") ??
      (generatedDeliveryPhoto ? sourceFromUrl(generatedDeliveryPhoto) : undefined),
  } as LoadEvidenceItem;
  const sealPickupPhoto = {
    ...toEvidenceItem(
      loadId,
      "Seal pickup photo",
      "proof",
      "seal_photo",
      proofByType(proofItems, "Pickup Seal Photo"),
      requiredSeal
    ),
    status: !requiredSeal ? "not_applicable" : generatedSealPickupPhoto ? "ready" : "missing",
    url: generatedSealPickupPhoto,
    fileName: fileNameFromUrl(generatedSealPickupPhoto),
    note: !requiredSeal
      ? "No pickup seal required for this load."
      : generatedSealPickupPhoto
        ? "Pickup seal checkpoint image."
        : "Pickup seal photo missing.",
    source:
      sourceFromEvidenceKey(loadId, "sealPickupPhoto") ??
      (generatedSealPickupPhoto ? sourceFromUrl(generatedSealPickupPhoto) : undefined),
  } as LoadEvidenceItem;
  const sealDeliveryPhoto = {
    ...toEvidenceItem(
      loadId,
      "Seal delivery photo",
      "proof",
      "seal_photo",
      proofByType(proofItems, "Delivery Seal Photo"),
      requiredSeal
    ),
    status: !requiredSeal ? "not_applicable" : generatedSealDeliveryPhoto ? "ready" : "missing",
    url: generatedSealDeliveryPhoto,
    fileName: fileNameFromUrl(generatedSealDeliveryPhoto),
    note: !requiredSeal
      ? "No delivery seal required for this load."
      : generatedSealDeliveryPhoto
        ? "Delivery seal checkpoint image."
        : "Delivery seal photo missing.",
    source:
      sourceFromEvidenceKey(loadId, "sealDeliveryPhoto") ??
      (generatedSealDeliveryPhoto ? sourceFromUrl(generatedSealDeliveryPhoto) : undefined),
  } as LoadEvidenceItem;
  const sealProof =
    proofByType(proofItems, "Delivery Seal Photo") ??
    proofByType(proofItems, "Pickup Seal Photo");
  const seal = {
    ...toEvidenceItem(loadId, "Seal verification sheet", "proof", "seal_photo", sealProof, requiredSeal),
    status: !requiredSeal ? "not_applicable" : generatedSeal ? "ready" : "missing",
    url: generatedSeal,
    fileName: fileNameFromUrl(generatedSeal),
    note: !requiredSeal
      ? "No pickup/delivery seal data on this load."
      : generatedSeal
        ? "Generated from load data template."
        : "Required because this load contains seal checkpoints.",
    source: generatedSeal ? "generated" : undefined,
  } as LoadEvidenceItem;
  const lumperRequired = Boolean(load.status === "Delivered" && settlementLumperFlag(data, load.driverId));
  const lumper = {
    ...toEvidenceItem(
      loadId,
      "Lumper receipt",
      "proof",
      "lumper_receipt",
      proofByType(proofItems, "Lumper Receipt"),
      lumperRequired
    ),
    status: !lumperRequired ? "not_applicable" : generatedLumper ? "ready" : "missing",
    url: generatedLumper,
    fileName: fileNameFromUrl(generatedLumper),
    note: !lumperRequired
      ? "Not required for this settlement path."
      : generatedLumper
        ? "Generated from load data template."
        : "Required lumper receipt not generated yet.",
    source: generatedLumper ? "generated" : undefined,
  } as LoadEvidenceItem;
  const rfid = toEvidenceItem(
    loadId,
    "RFID / geo proof",
    "proof",
    "rfid_proof",
    proofByType(proofItems, "RFID / Dock Validation Record"),
    false,
    { source: "rfid" }
  );
  rfid.status = generatedRfid ? "ready" : "pending";
  rfid.url = generatedRfid;
  rfid.fileName = fileNameFromUrl(generatedRfid);
  rfid.note = generatedRfid
    ? "Generated RFID/geo proof summary."
    : "RFID proof not generated yet for this load.";
  rfid.source = generatedRfid ? "generated" : "rfid";
  const rfidDockProof: LoadEvidenceItem = {
    id: `${loadId}:rfid_dock_proof`,
    loadId,
    label: "RFID proof",
    section: "proof",
    type: "rfid_dock_proof",
    status: generatedRfidDockProof ? "ready" : "pending",
    url: generatedRfidDockProof,
    fileName: fileNameFromUrl(generatedRfidDockProof),
    note: generatedRfidDockProof
      ? "RFID dock proof available."
      : "RFID workflow applies when dock validation is required.",
    requiredForSettlementRelease: false,
    source:
      sourceFromEvidenceKey(loadId, "rfidDockProof") ??
      (generatedRfidDockProof ? sourceFromUrl(generatedRfidDockProof) : "rfid"),
  };
  const emptyTrailerProof: LoadEvidenceItem = {
    id: `${loadId}:empty_trailer_proof`,
    loadId,
    label: "Empty trailer proof",
    section: "proof",
    type: "empty_trailer_proof",
    status: generatedEmptyTrailerProof ? "ready" : load.status === "Delivered" ? "missing" : "pending",
    url: generatedEmptyTrailerProof,
    fileName: fileNameFromUrl(generatedEmptyTrailerProof),
    note: generatedEmptyTrailerProof
      ? "Trailer empty confirmation recorded."
      : "Required after delivery closeout.",
    requiredForSettlementRelease: load.status === "Delivered",
    source:
      sourceFromEvidenceKey(loadId, "emptyTrailerProof") ??
      (generatedEmptyTrailerProof ? sourceFromUrl(generatedEmptyTrailerProof) : undefined),
  };
  const tempCheckPhoto: LoadEvidenceItem = {
    id: `${loadId}:temp_check_photo`,
    loadId,
    label: "Temp check photo",
    section: "proof",
    type: "temp_check_photo",
    status: generatedTempCheckPhoto ? "ready" : "not_applicable",
    url: generatedTempCheckPhoto,
    fileName: fileNameFromUrl(generatedTempCheckPhoto),
    note: "Temperature-controlled lane evidence.",
    requiredForSettlementRelease: false,
    source:
      sourceFromEvidenceKey(loadId, "tempCheckPhoto") ??
      (generatedTempCheckPhoto ? sourceFromUrl(generatedTempCheckPhoto) : undefined),
  };
  const weightTicketPhoto: LoadEvidenceItem = {
    id: `${loadId}:weight_ticket_photo`,
    loadId,
    label: "Weight ticket photo",
    section: "proof",
    type: "weight_ticket_photo",
    status: generatedWeightTicketPhoto ? "ready" : "pending",
    url: generatedWeightTicketPhoto,
    fileName: fileNameFromUrl(generatedWeightTicketPhoto),
    note: "Weight/scale proof for compliance checks.",
    requiredForSettlementRelease: false,
    source:
      sourceFromEvidenceKey(loadId, "weightTicketPhoto") ??
      (generatedWeightTicketPhoto ? sourceFromUrl(generatedWeightTicketPhoto) : undefined),
  };
  const detentionProofPhoto: LoadEvidenceItem = {
    id: `${loadId}:detention_proof_photo`,
    loadId,
    label: "Detention proof photo",
    section: "proof",
    type: "detention_proof_photo",
    status: generatedDetentionProofPhoto ? "ready" : "not_applicable",
    url: generatedDetentionProofPhoto,
    fileName: fileNameFromUrl(generatedDetentionProofPhoto),
    note: "Detention/accessorial evidence when applicable.",
    requiredForSettlementRelease: false,
    source:
      sourceFromEvidenceKey(loadId, "detentionProofPhoto") ??
      (generatedDetentionProofPhoto ? sourceFromUrl(generatedDetentionProofPhoto) : undefined),
  };
  const safetyPhoto = toEvidenceItem(
    loadId,
    "Safety violation photo",
    "exceptions",
    "safety_violation_photo",
    proofByType(proofItems, "Cargo Damage Photos"),
    false,
    {
      status: getSafetyEvidenceByLoadId(loadId).length > 0 ? "ready" : "not_applicable",
      note:
        load.driverId === "DRV-004"
          ? "Tire/asset inspection failure evidence required."
          : load.driverId === "DRV-008"
            ? "HOS/inspection exception evidence for safety review."
            : "No active safety violation media required.",
      source:
        load.driverId === "DRV-004" || load.driverId === "DRV-008" ? "camera" : undefined,
      url: generatedSafetyViolationPhoto || getSafetyEvidenceByLoadId(loadId)[0]?.url,
      fileName: fileNameFromUrl(generatedSafetyViolationPhoto || getSafetyEvidenceByLoadId(loadId)[0]?.url),
    }
  );
  safetyPhoto.status = safetyPhoto.url ? "ready" : safetyPhoto.status;
  const claimRequired = claimApplicable(load, bundle);
  const damagePhoto = {
    ...toEvidenceItem(
      loadId,
      "Damage / claim photo",
      "exceptions",
      "cargo_photo",
      proofByType(proofItems, "Cargo Damage Photos"),
      false,
      { requiredForClaimRelease: claimRequired }
    ),
    status: claimRequired
      ? generatedDamagePhoto
        ? "ready"
        : "missing"
      : "not_applicable",
    url: generatedDamagePhoto,
    fileName: fileNameFromUrl(generatedDamagePhoto),
    note: claimRequired
      ? generatedDamagePhoto
        ? `Damage evidence image linked.${generatedClaimEvidence ? ` Claim evidence file: ${generatedClaimEvidence}.` : ""}`
        : "Damage evidence photo required for claim path."
      : "No active claim path.",
    source:
      sourceFromEvidenceKey(loadId, "cargoDamagePhoto") ??
      (generatedDamagePhoto ? sourceFromUrl(generatedDamagePhoto) : undefined),
  } as LoadEvidenceItem;
  const cargoDamagePhoto: LoadEvidenceItem = {
    id: `${loadId}:cargo_damage_photo`,
    loadId,
    label: "Cargo damage photo",
    section: "exceptions",
    type: "cargo_damage_photo",
    status: generatedCargoDamagePhoto ? "ready" : claimRequired ? "missing" : "not_applicable",
    url: generatedCargoDamagePhoto,
    fileName: fileNameFromUrl(generatedCargoDamagePhoto),
    note: generatedCargoDamagePhoto
      ? "Cargo damage image attached."
      : "Required when claim/damage workflow is active.",
    requiredForSettlementRelease: false,
    requiredForClaimRelease: claimRequired,
    source:
      sourceFromEvidenceKey(loadId, "cargoDamagePhoto") ??
      (generatedCargoDamagePhoto ? sourceFromUrl(generatedCargoDamagePhoto) : undefined),
  };
  const damagedPalletPhoto: LoadEvidenceItem = {
    id: `${loadId}:damaged_pallet_photo`,
    loadId,
    label: "Damaged pallet photo",
    section: "exceptions",
    type: "damaged_pallet_photo",
    status: generatedDamagedPalletPhoto ? "ready" : claimRequired ? "missing" : "not_applicable",
    url: generatedDamagedPalletPhoto,
    fileName: fileNameFromUrl(generatedDamagedPalletPhoto),
    note: generatedDamagedPalletPhoto
      ? "Damaged pallet evidence attached."
      : "Required for cargo damage claims.",
    requiredForSettlementRelease: false,
    requiredForClaimRelease: claimRequired,
    source:
      sourceFromEvidenceKey(loadId, "damagedPalletPhoto") ??
      (generatedDamagedPalletPhoto ? sourceFromUrl(generatedDamagedPalletPhoto) : undefined),
  };
  const sealMismatchPhoto: LoadEvidenceItem = {
    id: `${loadId}:seal_mismatch_photo`,
    loadId,
    label: "Seal mismatch photo",
    section: "exceptions",
    type: "seal_mismatch_photo",
    status:
      String(load.sealStatus).toUpperCase() === "MISMATCH"
        ? generatedSealMismatchPhoto
          ? "ready"
          : "missing"
        : "not_applicable",
    url: generatedSealMismatchPhoto,
    fileName: fileNameFromUrl(generatedSealMismatchPhoto),
    note: "Required when pickup/delivery seal numbers mismatch.",
    requiredForSettlementRelease: false,
    source:
      sourceFromEvidenceKey(loadId, "sealMismatchPhoto") ??
      (generatedSealMismatchPhoto ? sourceFromUrl(generatedSealMismatchPhoto) : undefined),
  };
  const claim = toEvidenceItem(
    loadId,
    "Claim packet",
    "exceptions",
    "claim_packet",
    proofByType(proofItems, "Claim Support Docs"),
    false,
    { requiredForClaimRelease: claimRequired }
  );
  claim.status = claim.requiredForClaimRelease
    ? generatedClaim
      ? "ready"
      : "missing"
    : "not_applicable";
  claim.url = generatedClaim;
  claim.fileName = fileNameFromUrl(generatedClaim);
  claim.note = claim.requiredForClaimRelease
    ? generatedClaim
      ? "Generated claim packet from load exception context."
      : "Claim packet required but not generated."
    : "No claim packet required for this load.";
  claim.source = generatedClaim ? "generated" : claim.source;
  const claimIntake: LoadEvidenceItem = {
    id: `${loadId}:claim_intake`,
    loadId,
    label: "Claim Intake Form",
    section: "exceptions",
    type: "claim_intake",
    status: claim.requiredForClaimRelease
      ? generatedClaimIntake
        ? "ready"
        : "missing"
      : "not_applicable",
    url: generatedClaimIntake,
    fileName: fileNameFromUrl(generatedClaimIntake),
    note: claim.requiredForClaimRelease
      ? generatedClaimIntake
        ? "Generated claim intake form."
        : "Claim intake form required."
      : "No claim intake required.",
    requiredForSettlementRelease: false,
    requiredForClaimRelease: claim.requiredForClaimRelease,
    source: generatedClaimIntake ? "generated" : undefined,
  };
  const damagePhotoPacket: LoadEvidenceItem = {
    id: `${loadId}:damage_photo_packet`,
    loadId,
    label: "Damage Photo Packet",
    section: "exceptions",
    type: "damage_photo_packet",
    status: claim.requiredForClaimRelease
      ? generatedDamagePhotoPacket
        ? "ready"
        : "missing"
      : "not_applicable",
    url: generatedDamagePhotoPacket,
    fileName: fileNameFromUrl(generatedDamagePhotoPacket),
    note: claim.requiredForClaimRelease
      ? generatedDamagePhotoPacket
        ? "Generated damage packet references."
        : "Damage packet required for claim."
      : "No damage packet required.",
    requiredForSettlementRelease: false,
    requiredForClaimRelease: claim.requiredForClaimRelease,
    source: generatedDamagePhotoPacket ? "generated" : undefined,
  };
  const insurance: LoadEvidenceItem = {
    id: `${loadId}:insurance_notice`,
    loadId,
    label: "Insurance notice",
    section: "exceptions",
    type: "insurance_notice",
    status: claim.requiredForClaimRelease
      ? generatedInsuranceNotification
        ? "ready"
        : "pending"
      : "not_applicable",
    url: generatedInsuranceNotification,
    fileName: fileNameFromUrl(generatedInsuranceNotification),
    note: claim.requiredForClaimRelease
      ? "Insurance path is tied to claim packet completeness."
      : "No insurance notice needed for this load.",
    requiredForSettlementRelease: false,
    requiredForClaimRelease: claim.requiredForClaimRelease,
    source:
      sourceFromUrl(generatedInsuranceNotification) ??
      (claim.requiredForClaimRelease ? "generated" : undefined),
  };
  const factoringNotification: LoadEvidenceItem = {
    id: `${loadId}:factoring_notification`,
    loadId,
    label: "Factoring Notification",
    section: "exceptions",
    type: "factoring_notification",
    status: generatedFactoringNotification ? "ready" : "missing",
    url: generatedFactoringNotification,
    fileName: fileNameFromUrl(generatedFactoringNotification),
    note: generatedFactoringNotification
      ? "Generated AR/factoring collectability notice."
      : "Factoring notification not generated.",
    requiredForSettlementRelease: false,
    source: generatedFactoringNotification ? "generated" : undefined,
  };
  const settlementHoldNotice: LoadEvidenceItem = {
    id: `${loadId}:settlement_hold_notice`,
    loadId,
    label: "Settlement Hold Notice",
    section: "exceptions",
    type: "settlement_hold_notice",
    status: generatedSettlementHoldNotice ? "ready" : "not_applicable",
    url: generatedSettlementHoldNotice,
    fileName: fileNameFromUrl(generatedSettlementHoldNotice),
    note: generatedSettlementHoldNotice
      ? "Generated settlement hold notice."
      : "No active settlement hold notice generated.",
    requiredForSettlementRelease: false,
    source: generatedSettlementHoldNotice ? "generated" : undefined,
  };

  const safetyEvidenceDocuments: LoadEvidenceItem[] = getSafetyEvidenceByLoadId(loadId).map(
    (ev) => ({
      id: ev.id,
      loadId,
      label: ev.label,
      section: "exceptions",
      type:
        ev.type === "cargo_damage"
          ? "cargo_photo"
          : "safety_violation_photo",
      status: "ready",
      url: ev.url,
      fileName: fileNameFromUrl(ev.url),
      note: ev.note,
      requiredForSettlementRelease: false,
      source: "camera",
    })
  );

  const documents = [
    rate,
    bol,
    pod,
    invoice,
    workOrder,
    masterAgreementReference,
    cargo,
    sealPhoto,
    sealPickupPhoto,
    sealDeliveryPhoto,
    equipmentPhoto,
    pickupPhoto,
    deliveryPhoto,
    emptyTrailerProof,
    seal,
    lumper,
    rfid,
    rfidDockProof,
    tempCheckPhoto,
    weightTicketPhoto,
    detentionProofPhoto,
    damagePhoto,
    cargoDamagePhoto,
    damagedPalletPhoto,
    sealMismatchPhoto,
    damagePhotoPacket,
    claimIntake,
    safetyPhoto,
    claim,
    insurance,
    factoringNotification,
    settlementHoldNotice,
    ...safetyEvidenceDocuments,
  ].map(withResolvedStatus);
  const blockers = documents.filter(
    (d) =>
      d.requiredForSettlementRelease &&
      !(d.status === "ready" || d.status === "not_applicable")
  );

  if (
    !hasWarnedPacketCoverage &&
    typeof process !== "undefined" &&
    process.env.NODE_ENV !== "production"
  ) {
    hasWarnedPacketCoverage = true;
    const allLoadIds = data.loads.map((l) => l.id);
    const withPackets = allLoadIds.filter((id) => getLoadDocumentPacket(data, id) != null).length;
    const packetGaps = allLoadIds.filter((id) => getLoadDocumentPacket(data, id) == null);
    if (packetGaps.length > 0 || withPackets !== allLoadIds.length) {
      console.warn("[load-proof] packet coverage gap", {
        totalLoads: allLoadIds.length,
        loadsWithDocumentPackets: withPackets,
        loadsMissingPacket: packetGaps,
      });
    }
  }

  return {
    loadId,
    customerName: customerFromLoad(load),
    settlementHold: blockers.length > 0,
    holdReason:
      blockers.length > 0
        ? `Settlement hold is on — missing required proof: ${blockers
            .map((b) => b.label)
            .join(", ")}`
        : "Settlement release supported — all required proof is on file.",
    documents,
  };
}

function customerFromLoad(load: NonNullable<ReturnType<typeof loadRecord>>): string {
  const part = load.origin.split(" - ")[0]?.trim() || load.origin;
  return part.length > 56 ? `${part.slice(0, 53)}…` : part;
}

export function getLoadEvidenceForSettlement(data: BofData, loadIds: string[]) {
  return loadIds
    .map((lid) => getLoadDocumentPacket(data, lid))
    .filter((packet): packet is LoadDocumentPacket => Boolean(packet));
}

export { getLoadEvidenceManifest, getLoadEvidenceForLoad };
