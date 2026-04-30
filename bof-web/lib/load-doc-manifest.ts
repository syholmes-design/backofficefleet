import rawManifest from "@/lib/generated/load-doc-manifest.json";

export type GeneratedLoadDocKey =
  | "rateConfirmation"
  | "bol"
  | "pod"
  | "invoice"
  | "lumperReceipt"
  | "sealVerification"
  | "rfidProof"
  | "claimPacket";

export type GeneratedLoadDocEntry = Partial<Record<GeneratedLoadDocKey, string>>;

type GeneratedLoadDocManifest = Record<string, GeneratedLoadDocEntry>;

const manifest = (rawManifest ?? {}) as GeneratedLoadDocManifest;

export function normalizeLoadId(loadId: string): string {
  const raw = String(loadId ?? "").trim().toUpperCase();
  const digits = raw.match(/\d+/)?.[0] ?? "";
  if (!digits) return raw;
  return `L${digits.padStart(3, "0")}`;
}

export function getGeneratedLoadDocEntry(loadId: string): GeneratedLoadDocEntry {
  const normalized = normalizeLoadId(loadId);
  return manifest[normalized] ?? manifest[loadId] ?? {};
}

export function getGeneratedLoadDocUrl(
  loadId: string,
  key: GeneratedLoadDocKey
): string | undefined {
  const raw = getGeneratedLoadDocEntry(loadId)[key];
  if (!raw) return undefined;
  const normalized = String(raw).trim();
  return normalized.length > 0 ? normalized : undefined;
}

