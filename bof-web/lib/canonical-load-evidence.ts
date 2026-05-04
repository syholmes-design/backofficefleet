import type { BofData } from "@/lib/load-bof-data";
import { getGeneratedLoadDocUrl } from "@/lib/load-doc-manifest";
import { getLoadEvidenceMeta, getLoadEvidenceUrl } from "@/lib/load-documents";

export type BofLoadEvidenceType =
  | "rate_confirmation"
  | "bol"
  | "pod"
  | "seal_pickup_photo"
  | "seal_delivery_photo"
  | "cargo_pickup_photo"
  | "cargo_delivery_photo"
  | "lumper_receipt"
  | "rfid_geo_proof"
  | "claim_photo"
  | "insurance_packet";

export type BofLoadEvidence = {
  loadId: string;
  evidenceType: BofLoadEvidenceType;
  title: string;
  status: "available" | "missing" | "placeholder" | "not_required";
  url?: string;
  thumbnailUrl?: string;
  fileName?: string;
  mimeType?: string;
  reason?: string;
  driverId?: string;
  sealRef?: string;
  workOrder?: string;
  createdAt?: string;
};

type BofLoad = BofData["loads"][number];

type EvidenceDef = {
  evidenceType: BofLoadEvidenceType;
  title: string;
  resolve: (load: BofLoad) => string | undefined;
  required: (data: BofData, load: BofLoad) => boolean;
  notRequiredReason?: (data: BofData, load: BofLoad) => string;
};

function fileNameFromUrl(url?: string): string | undefined {
  const normalized = String(url ?? "").trim();
  if (!normalized) return undefined;
  const parts = normalized.split("/").filter(Boolean);
  return parts[parts.length - 1];
}

function mimeTypeFromUrl(url?: string): string | undefined {
  const normalized = String(url ?? "").trim().toLowerCase();
  if (!normalized) return undefined;
  if (normalized.endsWith(".png")) return "image/png";
  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) return "image/jpeg";
  if (normalized.endsWith(".webp")) return "image/webp";
  if (normalized.endsWith(".gif")) return "image/gif";
  if (normalized.endsWith(".pdf")) return "application/pdf";
  if (normalized.endsWith(".html") || normalized.endsWith(".htm")) return "text/html";
  if (normalized.endsWith(".svg")) return "image/svg+xml";
  return undefined;
}

function isPlaceholderUrl(url?: string): boolean {
  const normalized = String(url ?? "").trim().toLowerCase();
  if (!normalized) return false;
  return normalized.includes("/mocks/") || normalized.endsWith(".svg");
}

function publicUrlExists(url?: string): boolean {
  const normalized = String(url ?? "").trim();
  if (!normalized.startsWith("/")) return false;
  if (typeof window !== "undefined") return true;
  try {
    const req: (id: string) => unknown = eval("require");
    const fs = req("fs") as typeof import("fs");
    const path = req("path") as typeof import("path");
    const full = path.join(process.cwd(), "public", normalized.replace(/^\/+/, "").replace(/\//g, path.sep));
    return fs.existsSync(full);
  } catch {
    return false;
  }
}

function isClaimContext(load: BofLoad): boolean {
  return Boolean(load.dispatchExceptionFlag) || String(load.sealStatus).toUpperCase() === "MISMATCH";
}

function hasLumperContext(data: BofData, load: BofLoad): boolean {
  const bundle = (data.loadProofBundles as Record<string, { items?: Record<string, { status?: string; notes?: string }> }> | undefined)?.[
    load.id
  ]?.items?.["Lumper Receipt"];
  const bundleStatus = String(bundle?.status ?? "").trim().toLowerCase();
  if (bundleStatus === "complete" || bundleStatus === "pending" || bundleStatus === "missing" || bundleStatus === "disputed") {
    return true;
  }
  if (bundleStatus === "not required") return false;
  const settlement = data.settlements.find((row) => row.driverId === load.driverId);
  const text = `${settlement?.pendingReason ?? ""} ${settlement?.loadProofStatus ?? ""}`.toLowerCase();
  return /lumper/.test(text);
}

function hasClaimContext(data: BofData, load: BofLoad): boolean {
  const bundle = (data.loadProofBundles as Record<string, { items?: Record<string, { status?: string; notes?: string }> }> | undefined)?.[
    load.id
  ]?.items?.["Claim Support Docs"];
  const bundleStatus = String(bundle?.status ?? "").trim().toLowerCase();
  if (bundleStatus === "complete" || bundleStatus === "pending" || bundleStatus === "missing" || bundleStatus === "disputed") {
    return true;
  }
  if (bundleStatus === "not required") return false;
  const rows = (data.moneyAtRisk ?? []).filter((row) => {
    const sameLoad = String(row.loadId ?? "").trim() === load.id;
    if (sameLoad) return true;
    if (row.driverId !== load.driverId) return false;
    const category = String(row.category ?? "").toLowerCase();
    const rootCause = String(row.rootCause ?? "").toLowerCase();
    return /claim|damage|cargo|dispute|theft/.test(`${category} ${rootCause}`);
  });
  return rows.length > 0;
}

function requiresDeliverySealVerification(load: BofLoad): boolean {
  if (load.id === "L004") return true;
  if (String(load.sealStatus).toUpperCase() === "MISMATCH") return true;
  return false;
}

function resolveSealDeliveryUrl(load: BofLoad): string | undefined {
  if (load.id !== "L004") {
    return getLoadEvidenceUrl(load.id, "sealDeliveryPhoto") ?? getGeneratedLoadDocUrl(load.id, "sealDeliveryPhoto");
  }
  const preferred = "/generated/evidence/l004-seal-delivery-photo-seal-61043.png";
  return preferred;
}

function firstExistingPublicUrl(candidates: string[]): string | undefined {
  for (const candidate of candidates) {
    if (publicUrlExists(candidate)) return candidate;
  }
  return undefined;
}

const EVIDENCE_DEFS: EvidenceDef[] = [
  {
    evidenceType: "rate_confirmation",
    title: "Rate Confirmation",
    resolve: (load) => getGeneratedLoadDocUrl(load.id, "rateConfirmation"),
    required: () => true,
  },
  {
    evidenceType: "bol",
    title: "Bill of Lading",
    resolve: (load) => getGeneratedLoadDocUrl(load.id, "bol"),
    required: () => true,
  },
  {
    evidenceType: "pod",
    title: "Proof of Delivery",
    resolve: (load) => getGeneratedLoadDocUrl(load.id, "pod"),
    required: () => true,
  },
  {
    evidenceType: "seal_pickup_photo",
    title: "Seal Pickup Photo",
    resolve: (load) => getLoadEvidenceUrl(load.id, "sealPickupPhoto") ?? getGeneratedLoadDocUrl(load.id, "sealPickupPhoto"),
    required: () => true,
  },
  {
    evidenceType: "seal_delivery_photo",
    title: "Seal Delivery Photo",
    resolve: (load) => resolveSealDeliveryUrl(load),
    required: (_, load) => requiresDeliverySealVerification(load),
    notRequiredReason: (_, load) =>
      `Seal delivery verification is not required for ${load.id} because no delivery seal exception is active.`,
  },
  {
    evidenceType: "cargo_pickup_photo",
    title: "Cargo Pickup Photo",
    resolve: (load) => getLoadEvidenceUrl(load.id, "cargoPhoto") ?? getGeneratedLoadDocUrl(load.id, "cargoPhoto"),
    required: () => false,
  },
  {
    evidenceType: "cargo_delivery_photo",
    title: "Cargo Delivery Photo",
    resolve: (load) => getLoadEvidenceUrl(load.id, "deliveryPhoto"),
    required: () => false,
  },
  {
    evidenceType: "lumper_receipt",
    title: "Lumper Receipt",
    resolve: (load) =>
      firstExistingPublicUrl([
        `/evidence/loads/${load.id}/lumper-receipt.png`,
        `/evidence/loads/${load.id}/lumper-receipt.jpg`,
      ]) ??
      getLoadEvidenceUrl(load.id, "lumperReceipt") ??
      getGeneratedLoadDocUrl(load.id, "lumperReceipt") ??
      `/evidence/loads/${load.id}/lumper-receipt.png`,
    required: (data, load) => hasLumperContext(data, load),
    notRequiredReason: () =>
      "Lumper receipt is not required because no lumper/unload payment context is present on the load settlement trail.",
  },
  {
    evidenceType: "rfid_geo_proof",
    title: "RFID / Geo Proof",
    resolve: (load) => getLoadEvidenceUrl(load.id, "rfidDockProof") ?? getGeneratedLoadDocUrl(load.id, "rfidProof"),
    required: () => false,
  },
  {
    evidenceType: "claim_photo",
    title: "Claim Photo Evidence",
    resolve: (load) =>
      firstExistingPublicUrl([
        `/evidence/loads/${load.id}/cargo-damage-photo.png`,
        `/evidence/loads/${load.id}/claim-evidence.png`,
        `/evidence/loads/${load.id}/damage-photo.png`,
      ]) ??
      getLoadEvidenceUrl(load.id, "damagePhoto") ??
      getLoadEvidenceUrl(load.id, "cargoDamagePhoto") ??
      getGeneratedLoadDocUrl(load.id, "damageClaimPhoto") ??
      `/evidence/loads/${load.id}/cargo-damage-photo.png`,
    required: (data, load) => hasClaimContext(data, load),
    notRequiredReason: (_, load) =>
      `No active claim/damage incident context is linked to ${load.id} in canonical money-at-risk rows.`,
  },
  {
    evidenceType: "insurance_packet",
    title: "Insurance Packet",
    resolve: (load) => getGeneratedLoadDocUrl(load.id, "insuranceNotification"),
    required: (_data, load) => isClaimContext(load),
    notRequiredReason: () => "Insurance packet is only required for claim workflows.",
  },
];

function buildEvidenceRecord(data: BofData, load: BofLoad, def: EvidenceDef): BofLoadEvidence {
  const required = def.required(data, load);
  const rawUrl = def.resolve(load);
  const normalizedUrl = rawUrl?.trim() || undefined;
  const exists = publicUrlExists(normalizedUrl);
  const placeholder = isPlaceholderUrl(normalizedUrl);
  const metaReason =
    def.evidenceType === "seal_pickup_photo"
      ? getLoadEvidenceMeta(load.id, "sealPickupPhoto")?.reason
      : def.evidenceType === "seal_delivery_photo"
        ? getLoadEvidenceMeta(load.id, "sealDeliveryPhoto")?.reason
        : undefined;

  let status: BofLoadEvidence["status"] = "missing";
  let reason: string | undefined;
  if (!required) {
    status = "not_required";
    reason = def.notRequiredReason?.(data, load);
  } else if (!normalizedUrl) {
    status = "missing";
    reason = "No generated evidence file exists yet for this load/evidence type.";
  } else if (!exists) {
    status = "missing";
    reason = "No generated evidence file exists yet for this load/evidence type.";
  } else if (placeholder) {
    status = "placeholder";
    reason = "Only placeholder evidence is available; replace with a canonical file.";
  } else {
    status = "available";
  }

  if (load.id === "L004" && def.evidenceType === "seal_delivery_photo" && status !== "available") {
    reason = "Missing required file /generated/evidence/l004-seal-delivery-photo-seal-61043.png.";
  }

  return {
    loadId: load.id,
    evidenceType: def.evidenceType,
    title: def.title,
    status,
    url: status === "available" || status === "placeholder" ? normalizedUrl : undefined,
    thumbnailUrl: status === "available" || status === "placeholder" ? normalizedUrl : undefined,
    fileName: fileNameFromUrl(normalizedUrl),
    mimeType: mimeTypeFromUrl(normalizedUrl),
    reason: reason ?? metaReason,
    driverId: load.driverId,
    sealRef: def.evidenceType === "seal_delivery_photo" ? load.deliverySeal : def.evidenceType === "seal_pickup_photo" ? load.pickupSeal : undefined,
    workOrder: load.workOrderId,
  };
}

export function getCanonicalLoadEvidenceForLoad(data: BofData, loadId: string): BofLoadEvidence[] {
  const cached = data.loadEvidenceRecords?.[loadId];
  if (cached?.length) return cached;
  const load = data.loads.find((row) => row.id === loadId);
  if (!load) return [];
  return EVIDENCE_DEFS.map((def) => buildEvidenceRecord(data, load, def));
}

export function getCanonicalLoadEvidence(data: BofData): Record<string, BofLoadEvidence[]> {
  const out: Record<string, BofLoadEvidence[]> = {};
  for (const load of data.loads) {
    out[load.id] = getCanonicalLoadEvidenceForLoad(data, load.id);
  }
  return out;
}

export function getCanonicalLoadEvidenceByType(
  data: BofData,
  loadId: string,
  evidenceType: BofLoadEvidenceType
): BofLoadEvidence | undefined {
  return getCanonicalLoadEvidenceForLoad(data, loadId).find((row) => row.evidenceType === evidenceType);
}
