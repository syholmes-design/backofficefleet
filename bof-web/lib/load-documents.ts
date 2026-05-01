import evidenceManifestRaw from "@/lib/generated/load-evidence-manifest.json";

export type LoadEvidenceKey =
  | "cargoPhoto"
  | "sealPhoto"
  | "sealPickupPhoto"
  | "sealDeliveryPhoto"
  | "equipmentPhoto"
  | "pickupPhoto"
  | "deliveryPhoto"
  | "emptyTrailerProof"
  | "lumperReceipt"
  | "damagePhoto"
  | "cargoDamagePhoto"
  | "damagedPalletPhoto"
  | "sealMismatchPhoto"
  | "claimEvidence"
  | "rfidDockProof"
  | "tempCheckPhoto"
  | "weightTicketPhoto"
  | "detentionProofPhoto"
  | "safetyViolationPhoto";

export type LoadEvidenceSource = "real" | "ai_generated" | "svg_demo";
export type LoadEvidenceManifestValue =
  | string
  | {
      url: string;
      source?: LoadEvidenceSource;
      label?: string;
      promptSummary?: string;
      generatedAt?: string;
    };
export type LoadEvidenceManifestEntry = Partial<Record<LoadEvidenceKey, LoadEvidenceManifestValue>>;
type LoadEvidenceManifest = Record<string, LoadEvidenceManifestEntry>;

const manifest = (evidenceManifestRaw ?? {}) as LoadEvidenceManifest;

function normalizeLoadId(loadId: string): string {
  const raw = String(loadId ?? "").trim().toUpperCase();
  const digits = raw.match(/\d+/)?.[0] ?? "";
  if (!digits) return raw;
  return `L${digits.padStart(3, "0")}`;
}

export function getLoadEvidenceEntry(loadId: string): LoadEvidenceManifestEntry {
  const normalized = normalizeLoadId(loadId);
  return manifest[normalized] ?? manifest[loadId] ?? {};
}

export function getLoadEvidenceManifest(): LoadEvidenceManifest {
  return manifest;
}

export function getLoadEvidenceForLoad(loadId: string): LoadEvidenceManifestEntry {
  return getLoadEvidenceEntry(loadId);
}

export function getLoadEvidenceUrl(
  loadId: string,
  key: LoadEvidenceKey
): string | undefined {
  const raw = getLoadEvidenceEntry(loadId)[key];
  if (!raw) return undefined;
  const value = typeof raw === "string" ? raw : String(raw.url ?? "");
  return value.length > 0 ? value : undefined;
}

export function getLoadEvidenceMeta(loadId: string, key: LoadEvidenceKey) {
  const raw = getLoadEvidenceEntry(loadId)[key];
  if (!raw || typeof raw === "string") return undefined;
  return raw;
}

