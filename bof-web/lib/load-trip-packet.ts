/**
 * Canonical BOF trip document packet — single ordered, deduped source for
 * load detail, dispatch drawer, settlements, and validators.
 * URLs come only from load-doc-manifest + load-evidence-manifest (via helpers).
 */

import type { BofData } from "./load-bof-data";
import type {
  LoadDocumentPacket,
  LoadEvidenceItem,
  LoadEvidenceStatus,
  LoadEvidenceType,
  LoadProofBundle,
} from "./load-proof";
import { getGeneratedLoadDocUrl } from "./load-doc-manifest";
import { getLoadEvidenceMeta, getLoadEvidenceUrl } from "./load-documents";

export type TripPacketGroupId = "core" | "proof" | "exceptions" | "reference";

export type TripPacketUiStatus =
  | "complete"
  | "needs_filing"
  | "missing_required"
  | "exceptions_open";

export type TripPacketRow = {
  /** Stable unique key within packet */
  key: string;
  label: string;
  group: TripPacketGroupId;
  status: LoadEvidenceStatus;
  url?: string;
  note?: string;
  requiredForSettlementRelease: boolean;
  requiredForClaimRelease?: boolean;
  /** Counted for delivered-load minimum checklist */
  deliveredMinimum?: boolean;
  loadEvidenceType: LoadEvidenceType;
  source?: LoadEvidenceItem["source"];
};

export type TripPacketValidation = {
  loadId: string;
  status: TripPacketUiStatus;
  requiredCount: number;
  readyCount: number;
  missingCount: number;
  exceptionCount: number;
  missingRequiredLabels: string[];
  recommendedAction: string;
};

export type TripPacket = {
  loadId: string;
  rows: TripPacketRow[];
  validation: TripPacketValidation;
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

function settlementHoldApplicable(data: BofData, driverId: string) {
  if (!("settlements" in data) || !Array.isArray(data.settlements)) return false;
  const s = data.settlements.find((x) => x.driverId === driverId);
  return String(s?.status ?? "")
    .trim()
    .toLowerCase() === "hold";
}

function claimApplicable(
  load: NonNullable<ReturnType<typeof loadRecord>>,
  bundle: LoadProofBundle | null
) {
  if (bundle?.claimApplicable != null) return bundle.claimApplicable;
  return (
    Boolean(load.dispatchExceptionFlag) ||
    (load.status === "Delivered" && load.sealStatus === "Mismatch")
  );
}

function fileNameFromUrl(url?: string): string | undefined {
  const u = String(url ?? "").trim();
  if (!u) return undefined;
  const parts = u.split("/").filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : undefined;
}

function srcFromEvidence(loadId: string, key: Parameters<typeof getLoadEvidenceMeta>[1]) {
  const meta = getLoadEvidenceMeta(loadId, key);
  if (!meta?.source) return undefined;
  if (meta.source === "missing") return undefined;
  if (meta.source === "ai_generated") return "ai_generated" as const;
  if (meta.source === "svg_demo") return "svg_demo" as const;
  if (meta.source === "real") return "real" as const;
  return undefined;
}

function srcFromUrl(url?: string): LoadEvidenceItem["source"] {
  const u = String(url ?? "").trim();
  if (!u) return undefined;
  if (u.includes("/actual_docs/")) return "actual_docs";
  if (u.includes("/generated/")) return "generated";
  if (u.includes("/evidence/")) {
    if (/\.svg$/i.test(u)) return "svg_demo";
    if (/\.(png|jpe?g|webp|gif)$/i.test(u)) return "real";
    return "generated";
  }
  return "manual_upload";
}

function withResolvedRow(row: TripPacketRow): TripPacketRow {
  if (row.status === "ready" && !row.url) {
    return {
      ...row,
      status: "missing",
      note: row.note || "Marked Missing — no file URL on record.",
    };
  }
  return row;
}

function customerFromLoad(load: NonNullable<ReturnType<typeof loadRecord>>): string {
  const part = load.origin.split(" - ")[0]?.trim() || load.origin;
  return part.length > 56 ? `${part.slice(0, 53)}…` : part;
}

/** Build canonical ordered packet rows (deduped by key). */
export function buildTripDocumentPacket(data: BofData, loadId: string): TripPacket | null {
  const load = loadRecord(data, loadId);
  if (!load) return null;

  const bundle = bundleForLoad(data, loadId);
  const delivered = load.status === "Delivered";
  const claimOk = claimApplicable(load, bundle);
  const requiredSeal = Boolean(
    String(load.pickupSeal ?? "").trim() || String(load.deliverySeal ?? "").trim()
  );
  const lumperRequired = Boolean(
    delivered && (settlementLumperFlag(data, load.driverId) || false)
  );
  const sealMismatch = String(load.sealStatus ?? "").toUpperCase() === "MISMATCH";
  const holdApplicable = settlementHoldApplicable(data, load.driverId);

  const gen = (k: Parameters<typeof getGeneratedLoadDocUrl>[1]) => getGeneratedLoadDocUrl(loadId, k);
  const ev = (k: Parameters<typeof getLoadEvidenceUrl>[1]) => getLoadEvidenceUrl(loadId, k);

  const rateUrl = gen("rateConfirmation");
  const bolUrl = gen("bol");
  const podUrl = gen("pod");
  const invoiceUrl =
    gen("invoice") ||
    String(bundle?.items?.Invoice?.fileUrl ?? bundle?.items?.Invoice?.previewUrl ?? "").trim() ||
    undefined;
  const workOrderUrl = gen("workOrder");
  const masterUrl = gen("masterAgreementReference");

  const pickupPhotoUrl = ev("pickupPhoto");
  const cargoPhotoUrl = ev("cargoPhoto") ?? gen("cargoPhoto");
  const sealPickupUrl = ev("sealPickupPhoto") ?? gen("sealPickupPhoto");
  const sealDeliveryUrl = ev("sealDeliveryPhoto") ?? gen("sealDeliveryPhoto");
  const emptyTrailerUrl = ev("emptyTrailerProof");
  const deliveryPhotoUrl = ev("deliveryPhoto");
  const deliveryMergedUrl = emptyTrailerUrl || deliveryPhotoUrl;
  const rfidDockProofUrl = ev("rfidDockProof");
  const rfidUrl = rfidDockProofUrl || gen("rfidProof");
  const rfidEvidenceType: LoadEvidenceType = rfidDockProofUrl ? "rfid_dock_proof" : "rfid_proof";
  const lumperUrl = ev("lumperReceipt") ?? gen("lumperReceipt");

  const claimIntakeUrl = gen("claimIntake");
  const claimPacketUrl = gen("claimPacket");
  const damagePhotoPacketUrl = gen("damagePhotoPacket");
  const insuranceUrl = gen("insuranceNotification");
  const settlementHoldNoticeUrl = gen("settlementHoldNotice");
  const factoringUrl = gen("factoringNotification");
  const sealMismatchPhotoUrl = ev("sealMismatchPhoto");

  const rowsUncached: TripPacketRow[] = [
    {
      key: "rate_confirmation",
      label: "Rate Confirmation",
      group: "core",
      status: rateUrl ? "ready" : "missing",
      url: rateUrl,
      note: rateUrl ? undefined : "Manifest-backed rate confirmation not found.",
      requiredForSettlementRelease: true,
      deliveredMinimum: true,
      loadEvidenceType: "rate_confirmation",
      source: rateUrl ? srcFromUrl(rateUrl) : undefined,
    },
    {
      key: "work_order",
      label: "Work Order / Trip Schedule",
      group: "core",
      status: workOrderUrl ? "ready" : "missing",
      url: workOrderUrl,
      note: workOrderUrl ? undefined : "Work order document not generated.",
      requiredForSettlementRelease: true,
      deliveredMinimum: true,
      loadEvidenceType: "work_order",
      source: workOrderUrl ? srcFromUrl(workOrderUrl) : undefined,
    },
    {
      key: "bol",
      label: "Bill of Lading",
      group: "core",
      status: bolUrl ? "ready" : "missing",
      url: bolUrl,
      note: bolUrl ? undefined : "BOL not generated for this load.",
      requiredForSettlementRelease: true,
      deliveredMinimum: true,
      loadEvidenceType: "bol",
      source: bolUrl ? srcFromUrl(bolUrl) : undefined,
    },
    {
      key: "pod",
      label: "Proof of Delivery",
      group: "core",
      status: podUrl ? "ready" : delivered ? "missing" : "pending",
      url: podUrl,
      note: podUrl ? undefined : delivered ? "POD required for delivered load." : "POD pending until delivery.",
      requiredForSettlementRelease: true,
      deliveredMinimum: true,
      loadEvidenceType: "pod",
      source: podUrl ? srcFromUrl(podUrl) : undefined,
    },
    {
      key: "invoice",
      label: "Invoice",
      group: "core",
      status: invoiceUrl ? "ready" : delivered ? "missing" : "pending",
      url: invoiceUrl,
      note: invoiceUrl ? undefined : delivered ? "Invoice required after delivery." : "Invoice pending.",
      requiredForSettlementRelease: true,
      deliveredMinimum: true,
      loadEvidenceType: "invoice",
      source: invoiceUrl ? srcFromUrl(invoiceUrl) : undefined,
    },
    {
      key: "pickup_photo",
      label: "Pickup photo",
      group: "proof",
      status: pickupPhotoUrl ? "ready" : "missing",
      url: pickupPhotoUrl,
      note: pickupPhotoUrl ? undefined : "Pickup evidence not on file.",
      requiredForSettlementRelease: false,
      deliveredMinimum: false,
      loadEvidenceType: "pickup_photo",
      source: srcFromEvidence(loadId, "pickupPhoto") ?? srcFromUrl(pickupPhotoUrl),
    },
    {
      key: "cargo_photo",
      label: "Cargo photo",
      group: "proof",
      status: cargoPhotoUrl ? "ready" : "missing",
      url: cargoPhotoUrl,
      note: cargoPhotoUrl ? undefined : "Cargo condition photo missing.",
      requiredForSettlementRelease: false,
      deliveredMinimum: false,
      loadEvidenceType: "cargo_photo",
      source: srcFromEvidence(loadId, "cargoPhoto") ?? srcFromUrl(cargoPhotoUrl),
    },
    {
      key: "seal_pickup_photo",
      label: "Seal pickup photo",
      group: "proof",
      status: !requiredSeal ? "not_applicable" : sealPickupUrl ? "ready" : "missing",
      url: requiredSeal ? sealPickupUrl : undefined,
      note: !requiredSeal ? "No seal on this trip." : sealPickupUrl ? undefined : "Pickup seal photo missing.",
      requiredForSettlementRelease: requiredSeal,
      deliveredMinimum: requiredSeal,
      loadEvidenceType: "seal_photo",
      source: srcFromEvidence(loadId, "sealPickupPhoto") ?? srcFromUrl(sealPickupUrl),
    },
    {
      key: "seal_delivery_photo",
      label: "Seal delivery photo",
      group: "proof",
      status: !requiredSeal ? "not_applicable" : sealDeliveryUrl ? "ready" : "missing",
      url: requiredSeal ? sealDeliveryUrl : undefined,
      note: !requiredSeal ? "No seal on this trip." : sealDeliveryUrl ? undefined : "Delivery seal photo missing.",
      requiredForSettlementRelease: requiredSeal,
      deliveredMinimum: requiredSeal,
      loadEvidenceType: "seal_photo",
      source: srcFromEvidence(loadId, "sealDeliveryPhoto") ?? srcFromUrl(sealDeliveryUrl),
    },
    {
      key: "delivery_empty_trailer",
      label: "Delivery / empty-trailer proof",
      group: "proof",
      status: deliveryMergedUrl ? "ready" : delivered ? "missing" : "pending",
      url: deliveryMergedUrl,
      note: deliveryMergedUrl
        ? undefined
        : delivered
          ? "Delivery or empty-trailer proof required."
          : "Awaiting delivery closeout.",
      requiredForSettlementRelease: delivered,
      deliveredMinimum: delivered,
      loadEvidenceType: "empty_trailer_proof",
      source:
        srcFromEvidence(loadId, "emptyTrailerProof") ??
        srcFromEvidence(loadId, "deliveryPhoto") ??
        srcFromUrl(deliveryMergedUrl),
    },
    {
      key: "rfid_geo",
      label: "RFID / geo proof",
      group: "proof",
      status: rfidUrl ? "ready" : "pending",
      url: rfidUrl,
      note: rfidUrl ? undefined : "RFID/geo summary not generated.",
      requiredForSettlementRelease: false,
      deliveredMinimum: false,
      loadEvidenceType: rfidEvidenceType,
      source:
        srcFromEvidence(loadId, "rfidDockProof") ??
        (rfidUrl ? srcFromUrl(rfidUrl) : "rfid"),
    },
    {
      key: "lumper_receipt",
      label: "Lumper receipt",
      group: "proof",
      status: !lumperRequired ? "not_applicable" : lumperUrl ? "ready" : "missing",
      url: lumperRequired ? lumperUrl : undefined,
      note: !lumperRequired ? "Not required for this trip." : lumperUrl ? undefined : "Lumper receipt required.",
      requiredForSettlementRelease: lumperRequired,
      deliveredMinimum: lumperRequired,
      loadEvidenceType: "lumper_receipt",
      source: srcFromEvidence(loadId, "lumperReceipt") ?? srcFromUrl(lumperUrl),
    },
    {
      key: "claim_intake",
      label: "Claim intake",
      group: "exceptions",
      status: !claimOk ? "not_applicable" : claimIntakeUrl ? "ready" : "missing",
      url: claimOk ? claimIntakeUrl : undefined,
      note: !claimOk ? "No claim workflow." : claimIntakeUrl ? undefined : "Claim intake missing.",
      requiredForSettlementRelease: false,
      requiredForClaimRelease: claimOk,
      deliveredMinimum: claimOk,
      loadEvidenceType: "claim_intake",
      source: claimIntakeUrl ? srcFromUrl(claimIntakeUrl) : undefined,
    },
    {
      key: "claim_packet",
      label: "Claim packet",
      group: "exceptions",
      status: !claimOk ? "not_applicable" : claimPacketUrl ? "ready" : "missing",
      url: claimOk ? claimPacketUrl : undefined,
      note: !claimOk ? "No claim workflow." : claimPacketUrl ? undefined : "Claim packet missing.",
      requiredForSettlementRelease: false,
      requiredForClaimRelease: claimOk,
      deliveredMinimum: claimOk,
      loadEvidenceType: "claim_packet",
      source: claimPacketUrl ? srcFromUrl(claimPacketUrl) : undefined,
    },
    {
      key: "damage_photo_packet",
      label: "Damage photo packet",
      group: "exceptions",
      status: !claimOk ? "not_applicable" : damagePhotoPacketUrl ? "ready" : "missing",
      url: claimOk ? damagePhotoPacketUrl : undefined,
      note: !claimOk ? "No claim workflow." : damagePhotoPacketUrl ? undefined : "Damage packet missing.",
      requiredForSettlementRelease: false,
      requiredForClaimRelease: claimOk,
      deliveredMinimum: claimOk,
      loadEvidenceType: "damage_photo_packet",
      source: damagePhotoPacketUrl ? srcFromUrl(damagePhotoPacketUrl) : undefined,
    },
    {
      key: "insurance_notification",
      label: "Insurance notification",
      group: "exceptions",
      status: !claimOk ? "not_applicable" : insuranceUrl ? "ready" : "missing",
      url: claimOk ? insuranceUrl : undefined,
      note: !claimOk ? "No claim workflow." : insuranceUrl ? undefined : "Insurance notification missing.",
      requiredForSettlementRelease: false,
      requiredForClaimRelease: claimOk,
      deliveredMinimum: claimOk,
      loadEvidenceType: "insurance_notice",
      source: insuranceUrl ? srcFromUrl(insuranceUrl) : undefined,
    },
    {
      key: "settlement_hold_notice",
      label: "Settlement hold notice",
      group: "exceptions",
      status: !holdApplicable ? "not_applicable" : settlementHoldNoticeUrl ? "ready" : "missing",
      url: holdApplicable ? settlementHoldNoticeUrl || undefined : undefined,
      note: !holdApplicable
        ? "No payroll settlement hold on file for this driver."
        : settlementHoldNoticeUrl
          ? "Hold notice on file."
          : "Settlement hold active — notice missing.",
      requiredForSettlementRelease: false,
      deliveredMinimum: holdApplicable,
      loadEvidenceType: "settlement_hold_notice",
      source: settlementHoldNoticeUrl ? srcFromUrl(settlementHoldNoticeUrl) : undefined,
    },
    {
      key: "factoring_notification",
      label: "Factoring notification",
      group: "exceptions",
      status: factoringUrl ? "ready" : "not_applicable",
      url: factoringUrl || undefined,
      note: factoringUrl ? undefined : "Factoring notice not generated for this load.",
      requiredForSettlementRelease: false,
      deliveredMinimum: false,
      loadEvidenceType: "factoring_notification",
      source: factoringUrl ? srcFromUrl(factoringUrl) : undefined,
    },
    {
      key: "seal_mismatch_photo",
      label: "Seal mismatch photo",
      group: "exceptions",
      status: !sealMismatch ? "not_applicable" : sealMismatchPhotoUrl ? "ready" : "missing",
      url: sealMismatch ? sealMismatchPhotoUrl : undefined,
      note: !sealMismatch ? "No seal mismatch." : sealMismatchPhotoUrl ? undefined : "Evidence required for mismatch.",
      requiredForSettlementRelease: false,
      deliveredMinimum: sealMismatch,
      loadEvidenceType: "seal_mismatch_photo",
      source: srcFromEvidence(loadId, "sealMismatchPhoto") ?? srcFromUrl(sealMismatchPhotoUrl),
    },
    {
      key: "master_agreement_reference",
      label: "Master agreement reference",
      group: "reference",
      status: masterUrl ? "ready" : "missing",
      url: masterUrl,
      note: masterUrl ? undefined : "Reference template not generated.",
      requiredForSettlementRelease: false,
      deliveredMinimum: false,
      loadEvidenceType: "master_agreement_reference",
      source: masterUrl ? srcFromUrl(masterUrl) : undefined,
    },
  ];

  const rows = rowsUncached.map(withResolvedRow);
  const validation = computeTripPacketValidation(loadId, load, delivered, rows);

  return { loadId, rows, validation };
}

function rowIsTripReady(r: TripPacketRow): boolean {
  return r.status === "ready" && Boolean(String(r.url ?? "").trim());
}

/** Rows counted for summary chips (excludes reference, optional RFID, non-generated factoring). */
function rowCountsForTripTotals(r: TripPacketRow): boolean {
  if (r.status === "not_applicable") return false;
  if (r.group === "reference") return false;
  if (r.key === "rfid_geo") return false;
  if (r.key === "factoring_notification" && !r.url) return false;
  return true;
}

export function computeTripPacketValidation(
  loadId: string,
  load: NonNullable<ReturnType<typeof loadRecord>>,
  delivered: boolean,
  rows: TripPacketRow[]
): TripPacketValidation {
  const totalsRows = rows.filter(rowCountsForTripTotals);
  const requiredCount = totalsRows.length;
  const readyCount = totalsRows.filter(rowIsTripReady).length;
  const missingCount = requiredCount - readyCount;

  const deliveredRequirementRows = delivered
    ? rows.filter((r) => {
        if (r.status === "not_applicable") return false;
        return Boolean(r.deliveredMinimum || r.requiredForClaimRelease);
      })
    : [];

  const missingDeliveredReq = deliveredRequirementRows.filter((r) => !rowIsTripReady(r));
  const missingRequiredLabels = missingDeliveredReq.map((r) => r.label);

  const incompleteExceptionDocs = rows.filter(
    (r) => r.group === "exceptions" && r.status !== "not_applicable" && !rowIsTripReady(r)
  );
  const exceptionCount = incompleteExceptionDocs.length;

  const dispatchException = Boolean(load.dispatchExceptionFlag);
  const exceptionsOpenSignal =
    dispatchException || incompleteExceptionDocs.length > 0;

  let status: TripPacketUiStatus = "needs_filing";
  if (!delivered) {
    status = exceptionsOpenSignal ? "exceptions_open" : "needs_filing";
  } else if (missingDeliveredReq.length > 0) {
    status = "missing_required";
  } else if (exceptionsOpenSignal) {
    status = "exceptions_open";
  } else if (missingCount > 0) {
    status = "needs_filing";
  } else {
    status = "complete";
  }

  let recommendedAction = "Review packet and open missing documents.";
  if (status === "complete") recommendedAction = "Trip packet complete — ready to file.";
  else if (status === "missing_required")
    recommendedAction = `Delivered load missing required items: ${missingRequiredLabels.slice(0, 8).join(", ")}${missingRequiredLabels.length > 8 ? "…" : ""}`;
  else if (status === "exceptions_open")
    recommendedAction = "Resolve exceptions / claim / hold items before filing.";
  else if (!delivered) recommendedAction = "Trip in progress — finalize packet after delivery.";

  return {
    loadId,
    status,
    requiredCount,
    readyCount,
    missingCount,
    exceptionCount,
    missingRequiredLabels,
    recommendedAction,
  };
}

function rowToEvidenceItem(loadId: string, row: TripPacketRow): LoadEvidenceItem {
  const section: LoadEvidenceItem["section"] =
    row.group === "exceptions"
      ? "exceptions"
      : row.group === "proof"
        ? "proof"
        : row.group === "reference"
          ? "reference"
          : "core";
  const url = row.url?.trim() || undefined;
  let status = row.status;
  if (status === "ready" && !url) status = "missing";

  return {
    id: `${loadId}:${row.key}`,
    loadId,
    label: row.label,
    section,
    type: row.loadEvidenceType,
    status,
    url,
    fileName: fileNameFromUrl(url),
    note: row.note,
    requiredForSettlementRelease: row.requiredForSettlementRelease,
    requiredForClaimRelease: row.requiredForClaimRelease,
    source: row.source ?? srcFromUrl(url),
  };
}

/** Legacy packet shape for settlements / APIs expecting LoadDocumentPacket. */
export function tripPacketToLoadDocumentPacket(data: BofData, loadId: string): LoadDocumentPacket | null {
  const trip = buildTripDocumentPacket(data, loadId);
  const load = loadRecord(data, loadId);
  if (!trip || !load) return null;

  const documents = trip.rows.map((r) => {
    const ev = rowToEvidenceItem(loadId, r);
    if (ev.status === "ready" && !ev.url) {
      return {
        ...ev,
        status: "missing" as const,
        note: ev.note || "URL missing — not Ready.",
      };
    }
    return ev;
  });

  const blockers = documents.filter(
    (d) =>
      d.requiredForSettlementRelease &&
      !(d.status === "ready" || d.status === "not_applicable")
  );

  return {
    loadId,
    customerName: customerFromLoad(load),
    settlementHold: blockers.length > 0,
    holdReason:
      blockers.length > 0
        ? `Missing required proof: ${blockers.map((b) => b.label).join(", ")}`
        : "Settlement release supported — required proof on file.",
    documents,
    tripValidation: trip.validation,
  };
}

export const TRIP_PACKET_GROUP_LABEL: Record<TripPacketGroupId, string> = {
  core: "Core Trip Documents",
  proof: "Proof & Media",
  exceptions: "Exceptions / Claims",
  reference: "Reference Documents",
};

const GROUP_ORDER: TripPacketGroupId[] = ["core", "proof", "exceptions", "reference"];

/** Group packet rows for UI (optionally hides not-applicable rows). */
export function groupTripPacketRows(
  trip: TripPacket | null,
  options?: { hideNotApplicable?: boolean }
): { group: TripPacketGroupId; label: string; rows: TripPacketRow[] }[] {
  if (!trip) return [];
  const hide = options?.hideNotApplicable !== false;
  return GROUP_ORDER.map((group) => ({
    group,
    label: TRIP_PACKET_GROUP_LABEL[group],
    rows: trip.rows.filter((r) => r.group === group && (!hide || r.status !== "not_applicable")),
  })).filter((g) => g.rows.length > 0);
}

export function tripPacketUiLabel(status: TripPacketUiStatus): string {
  switch (status) {
    case "complete":
      return "Trip Packet Complete";
    case "needs_filing":
      return "Needs Filing";
    case "missing_required":
      return "Missing Required Docs";
    case "exceptions_open":
      return "Exceptions Open";
    default:
      return status;
  }
}

export function filingReadinessLabel(
  v: TripPacketValidation,
  delivered: boolean
): "Ready to file" | "Needs review" {
  if (!delivered) return "Needs review";
  if (v.status === "complete") return "Ready to file";
  return "Needs review";
}
