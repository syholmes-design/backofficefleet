import { getLoadEvidenceEntry, getLoadEvidenceMeta, getLoadEvidenceUrl, type LoadEvidenceKey } from "@/lib/load-documents";

export type LoadProofAssetType =
  | "cargoPickup"
  | "cargoDelivery"
  | "pickupPhoto"
  | "deliveryPhoto"
  | "sealPhoto"
  | "sealPickup"
  | "sealDelivery"
  | "emptyTrailer"
  | "rfidDockProof"
  | "claimEvidence"
  | "damagePhoto"
  | "lumperReceipt"
  | "proofCardComposite";

type ManifestBackedType = Exclude<LoadProofAssetType, "proofCardComposite">;

export type LoadProofCompositeKind =
  | "claim"
  | "sealException"
  | "exception"
  | "rerouteWeather"
  | "factoring"
  | "standard";

const MANIFEST_KEYS: Record<ManifestBackedType, LoadEvidenceKey[]> = {
  cargoPickup: ["cargoPhoto"],
  cargoDelivery: ["cargoDeliveryPhoto", "deliveryPhoto"],
  pickupPhoto: ["pickupPhoto"],
  deliveryPhoto: ["deliveryPhoto"],
  sealPhoto: ["sealPhoto"],
  sealPickup: ["sealPickupPhoto", "sealPhoto"],
  sealDelivery: ["sealDeliveryPhoto", "sealPhoto"],
  emptyTrailer: ["emptyTrailerProof", "deliveryPhoto"],
  rfidDockProof: ["rfidDockProof"],
  claimEvidence: ["claimEvidence", "cargoDamagePhoto", "damagePhoto"],
  damagePhoto: ["damagePhoto", "cargoDamagePhoto", "claimEvidence"],
  lumperReceipt: ["lumperReceipt"],
};

const FALLBACK_BLOCKED_BY_LOAD: Partial<Record<LoadProofAssetType, Set<string>>> = {
  lumperReceipt: new Set(["L011"]),
};

function normalizeLoadId(loadId: string): string {
  const raw = String(loadId ?? "").trim().toUpperCase();
  const digits = raw.match(/\d+/)?.[0] ?? "";
  if (!digits) return raw;
  return `L${digits.padStart(3, "0")}`;
}

function loadNumber(loadId: string): string {
  return normalizeLoadId(loadId).replace(/^L/, "");
}

function publicUrlExists(url?: string): boolean {
  const normalized = String(url ?? "").trim();
  if (!normalized.startsWith("/")) return false;

  if (typeof window !== "undefined") {
    return false;
  }

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

function fallbackCandidates(loadId: string, type: LoadProofAssetType): string[] {
  const id = normalizeLoadId(loadId);
  const num = loadNumber(id);
  const base = `/evidence/loads/${id}`;

  switch (type) {
    case "cargoPickup":
      return [`${base}/cargo-pickup.jpg`, `${base}/cargo-photo.png`, `${base}/cargo-photo.jpg`, `${base}/cargo-photo.svg`];
    case "cargoDelivery":
      return [`${base}/cargo-delivery.jpg`, `${base}/delivery-photo.png`, `${base}/delivery-photo.jpg`, `${base}/delivery-photo.svg`];
    case "pickupPhoto":
      return [`${base}/pickup-photo.jpg`, `${base}/pickup-photo.png`, `${base}/pickup-photo.svg`];
    case "deliveryPhoto":
      return [`${base}/delivery-photo.jpg`, `${base}/delivery-photo.png`, `${base}/delivery-photo.svg`];
    case "sealPhoto":
      return [`${base}/seal-photo.png`, `${base}/seal-photo.jpg`, `${base}/seal-photo.svg`];
    case "sealPickup":
      return [`${base}/seal-pickup-photo.png`, `${base}/seal-pickup.jpg`, `${base}/seal-pickup-photo.svg`, `${base}/seal-photo.png`];
    case "sealDelivery":
      return [
        `${base}/seal-delivery-photo.png`,
        `${base}/seal-delivery.jpg`,
        `${base}/seal-delivery.png`,
        `${base}/l004-seal-delivery-photo-seal-61043.png`,
        `${base}/seal-delivery-photo.svg`,
      ];
    case "emptyTrailer":
      return [`${base}/empty-trailer-proof.png`, `${base}/trailer-empty.jpg`, `${base}/empty-trailer-proof.svg`, `${base}/delivery-photo.png`];
    case "rfidDockProof":
      return [`${base}/rfid-dock-proof.png`, `${base}/rfid-dock-proof.svg`];
    case "claimEvidence":
      return [`${base}/claim-evidence.png`, `${base}/cargo-damage-photo.png`, `${base}/damage-photo.png`, `${base}/damage-photo.jpg`];
    case "damagePhoto":
      return [`${base}/damage-photo.png`, `${base}/damage-photo.jpg`, `${base}/cargo-damage-photo.png`, `${base}/claim-evidence.png`];
    case "lumperReceipt":
      return [`${base}/lumper-receipt-photo.jpg`, `${base}/lumper-receipt.png`, `${base}/lumper-receipt.jpg`];
    case "proofCardComposite":
      return [
        `${base}/load${num}-proof-cards.png`,
        `${base}/load${num}-seal-exception-proof-cards.png`,
        `${base}/load${num}-claim-proof-cards.png`,
        `${base}/load${num}-exception-proof-cards.png`,
        `${base}/load${num}-reroute-proof-cards.png`,
        `${base}/load${num}-proof-packet-composite.png`,
      ];
  }
}

function firstExistingPublicUrl(candidates: string[]): string | undefined {
  return candidates.find((candidate) => publicUrlExists(candidate));
}

function compositeKindFromUrl(url?: string): LoadProofCompositeKind {
  const name = String(url ?? "").toLowerCase();
  if (name.includes("claim-proof")) return "claim";
  if (name.includes("seal-exception")) return "sealException";
  if (name.includes("exception-proof")) return "exception";
  if (name.includes("reroute-proof")) return "rerouteWeather";
  if (name.includes("proof-packet-composite")) return "factoring";
  return "standard";
}

export function getLoadProofCompositeKind(loadId: string, url?: string): LoadProofCompositeKind {
  const resolvedUrl = url ?? resolveLoadProofAsset(loadId, "proofCardComposite");
  return compositeKindFromUrl(resolvedUrl);
}

export function getLoadProofCompositeLabel(loadId: string, url?: string): string {
  switch (getLoadProofCompositeKind(loadId, url)) {
    case "claim":
      return "Claim Proof Preview";
    case "sealException":
      return "Seal Exception Proof Preview";
    case "exception":
      return "Exception Proof Preview";
    case "rerouteWeather":
      return "Reroute / Weather Proof Preview";
    case "factoring":
      return "Factoring / Proof Packet Preview";
    case "standard":
    default:
      return "Proof Packet Preview";
  }
}

export function isLoadProofCompositeException(kind: LoadProofCompositeKind): boolean {
  return kind === "claim" || kind === "sealException" || kind === "exception" || kind === "rerouteWeather";
}

export function resolveLoadProofAsset(loadId: string, type: LoadProofAssetType): string | undefined {
  const id = normalizeLoadId(loadId);

  if (type === "proofCardComposite") {
    const manifestUrl = getLoadEvidenceUrl(id, "proofCardComposite");
    return manifestUrl ?? firstExistingPublicUrl(fallbackCandidates(id, type));
  }

  for (const key of MANIFEST_KEYS[type]) {
    const meta = getLoadEvidenceMeta(id, key);
    if (meta?.source === "missing" || meta?.applicable === false) continue;
    const url = getLoadEvidenceUrl(id, key);
      if (url) return url;
  }

  if (FALLBACK_BLOCKED_BY_LOAD[type]?.has(id)) return undefined;

  return firstExistingPublicUrl(fallbackCandidates(id, type));
}

export function resolveLoadProofAssets(loadId: string): Partial<Record<LoadProofAssetType, string>> {
  const types: LoadProofAssetType[] = [
    "cargoPickup",
    "cargoDelivery",
    "pickupPhoto",
    "deliveryPhoto",
    "sealPhoto",
    "sealPickup",
    "sealDelivery",
    "emptyTrailer",
    "rfidDockProof",
    "claimEvidence",
    "damagePhoto",
    "lumperReceipt",
    "proofCardComposite",
  ];
  return Object.fromEntries(types.map((type) => [type, resolveLoadProofAsset(loadId, type)]).filter(([, url]) => Boolean(url)));
}

export function hasLoadProofManifestEntry(loadId: string): boolean {
  return Object.keys(getLoadEvidenceEntry(loadId)).length > 0;
}
