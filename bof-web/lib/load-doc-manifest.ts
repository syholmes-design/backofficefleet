import rawManifest from "@/lib/generated/load-doc-manifest.json";
import { resolveSafetyEvidencePublicUrl } from "@/lib/safety-evidence-url";

export type GeneratedLoadDocKey =
  | "rateConfirmation"
  | "bol"
  | "pod"
  | "invoice"
  | "workOrder"
  | "masterAgreementReference"
  | "sealVerification"
  | "rfidProof"
  | "claimPacket"
  | "claimIntake"
  | "insuranceNotification"
  | "factoringNotification"
  | "settlementHoldNotice"
  | "damagePhotoPacket"
  | "cargoPhoto"
  | "sealPickupPhoto"
  | "sealDeliveryPhoto"
  | "equipmentPhoto"
  | "pickupPhoto"
  | "deliveryPhoto"
  | "lumperReceipt"
  | "damageClaimPhoto"
  | "safetyViolationPhoto"
  | "claimEvidence";

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
  if (!normalized.length) return undefined;
  if (key === "safetyViolationPhoto") {
    const resolved = resolveSafetyEvidencePublicUrl(normalized);
    return resolved.url ?? undefined;
  }
  return normalized;
}

