import evidenceManifestRaw from "@/lib/generated/load-evidence-manifest.json";

export type LoadEvidenceKey =
  | "cargoPhoto"
  | "sealPhoto"
  | "equipmentPhoto"
  | "pickupPhoto";

export type LoadEvidenceManifestEntry = Partial<Record<LoadEvidenceKey, string>>;
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

export function getLoadEvidenceUrl(
  loadId: string,
  key: LoadEvidenceKey
): string | undefined {
  const raw = getLoadEvidenceEntry(loadId)[key];
  if (!raw) return undefined;
  const value = String(raw).trim();
  return value.length > 0 ? value : undefined;
}

