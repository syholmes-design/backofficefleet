import type { BofData } from "@/lib/load-bof-data";
import manifestRaw from "@/lib/generated/driver-doc-manifest.json";
import publicDocIndexRaw from "@/lib/generated/driver-public-doc-index.json";
import canonicalBankCardFiles from "@/lib/driver-canonical-bank-cards.json";
import { getDriverOperationalProfile } from "@/lib/driver-operational-profile";

export type DriverDocManifestKey =
  | "cdl"
  | "insuranceCard"
  | "medicalCard"
  | "mvr"
  | "w9"
  | "i9"
  | "emergencyContact"
  | "bankInformation"
  | "fmcsaCompliance";

export type DriverDocManifestEntry = Partial<Record<DriverDocManifestKey, string>>;

type DriverDocManifest = Record<string, DriverDocManifestEntry>;

const DRIVER_DOC_TYPE_TO_KEY: Record<string, DriverDocManifestKey> = {
  CDL: "cdl",
  "Insurance Card": "insuranceCard",
  "Medical Card": "medicalCard",
  MVR: "mvr",
  "W-9": "w9",
  "I-9": "i9",
  "Emergency Contact": "emergencyContact",
  "Bank Info": "bankInformation",
  FMCSA: "fmcsaCompliance",
};

const driverDocManifest = (manifestRaw ?? {}) as DriverDocManifest;
const publicDocIndex = (publicDocIndexRaw ?? { files: [] }) as {
  generatedAt?: string;
  files: string[];
};
const PUBLIC_FILES = new Set((publicDocIndex.files ?? []).map((x) => x.trim()));
const EXT_PRIORITY = [".pdf", ".png", ".jpg", ".jpeg", ".html"] as const;

const DRIVER_CANONICAL_BANK_CARD_FILE = canonicalBankCardFiles as Record<string, string>;

function driverSuffix(driverId: string): string {
  const n = driverId.replace(/^DRV-/, "").trim();
  return n.padStart(3, "0");
}

function resolveByPriority(basePath: string): string | undefined {
  for (const ext of EXT_PRIORITY) {
    const p = `${basePath}${ext}`;
    if (PUBLIC_FILES.has(p)) return p;
  }
  return undefined;
}

function sourcePathForType(driverId: string, type: string): string | undefined {
  const suffix = driverSuffix(driverId);
  const root = `/documents/drivers/${driverId}`;
  const byType: Record<string, string> = {
    "Emergency Contact": `${root}/ec-card-drv-${suffix}`,
    CDL: `${root}/cdlnew-${suffix}`,
    "Insurance Card": `${root}/icard-drv-${suffix}`,
    "Medical Card": `${root}/Medical Card-${suffix}`,
    MVR: `${root}/mvr-card-drv-${suffix}`,
    "I-9": `${root}/i9`,
    "W-9": `${root}/w9`,
    FMCSA: `${root}/fmcsa-compliance`,
    "FMCSA Compliance": `${root}/fmcsa-compliance`,
  };
  return byType[type];
}

/** Expected public URL for the canonical bank-card HTML (may not be on disk / in index yet). */
export function getExpectedBankCardPublicPath(driverId: string): string | undefined {
  const file = DRIVER_CANONICAL_BANK_CARD_FILE[driverId];
  if (!file) return undefined;
  return `/documents/drivers/${driverId}/${file}`;
}

/**
 * Canonical driver bank card under /documents/drivers/{id}/, keyed by driverId only.
 * Prefers bank-card-DRV-xxx-Name.html; falls back to legacy bank-card-drv-xxx when indexed.
 * Does not use /generated/.../bank-information.html.
 */
export function resolveDriverBankInformationUrl(driverId: string): string | undefined {
  const canonical = getExpectedBankCardPublicPath(driverId);
  if (canonical && PUBLIC_FILES.has(canonical)) return canonical;
  const suffix = driverSuffix(driverId);
  const root = `/documents/drivers/${driverId}`;
  return resolveByPriority(`${root}/bank-card-drv-${suffix}`);
}

export function getDriverPublicDocPath(
  driverId: string,
  type: string
): string | undefined {
  if (type === "Bank Info" || type === "Bank Information") {
    return resolveDriverBankInformationUrl(driverId);
  }
  const base = sourcePathForType(driverId, type);
  if (!base) return undefined;
  return resolveByPriority(base);
}

export function getDriverDocumentPacket(driverId: string): DriverDocManifestEntry {
  const merged = driverDocManifest[driverId] ?? {};
  return {
    ...merged,
    emergencyContact:
      getDriverPublicDocPath(driverId, "Emergency Contact") ?? merged.emergencyContact,
    cdl: getDriverPublicDocPath(driverId, "CDL") ?? merged.cdl,
    insuranceCard:
      getDriverPublicDocPath(driverId, "Insurance Card") ?? merged.insuranceCard,
    medicalCard:
      getDriverPublicDocPath(driverId, "Medical Card") ?? merged.medicalCard,
    bankInformation: resolveDriverBankInformationUrl(driverId),
    mvr: getDriverPublicDocPath(driverId, "MVR") ?? merged.mvr,
    i9: getDriverPublicDocPath(driverId, "I-9") ?? merged.i9,
    w9: getDriverPublicDocPath(driverId, "W-9") ?? merged.w9,
    fmcsaCompliance:
      getDriverPublicDocPath(driverId, "FMCSA Compliance") ?? merged.fmcsaCompliance,
  };
}

export function getDriverDocumentByType(
  driverId: string,
  type: string
): string | undefined {
  const key = DRIVER_DOC_TYPE_TO_KEY[type];
  if (!key) return undefined;
  const direct = getDriverPublicDocPath(driverId, type);
  if (direct) return direct;
  if (key === "bankInformation") return undefined;
  const value = getDriverDocumentPacket(driverId)[key];
  if (!value) return undefined;
  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : undefined;
}

function toDateOnly(value?: string): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function deriveCredentialStatusFromExpiration(expirationDate?: string): string {
  const exp = toDateOnly(expirationDate);
  if (!exp) return "MISSING";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (exp < today) return "EXPIRED";
  const sixtyDays = new Date(today);
  sixtyDays.setDate(today.getDate() + 60);
  if (exp <= sixtyDays) return "EXPIRING_SOON";
  return "VALID";
}

export function describeCredentialExpiration(expirationDate?: string): string {
  const exp = toDateOnly(expirationDate);
  if (!exp) return "Missing / needs review";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.ceil((exp.getTime() - today.getTime()) / 86400000);
  if (days < 0) return `Expired ${Math.abs(days)} day(s) ago`;
  if (days <= 60) return `Expiring in ${days} day(s)`;
  return `Current (${days} day(s) remaining)`;
}

export function getCanonicalDriverDocuments(data: BofData, driverId: string) {
  const packet = getDriverDocumentPacket(driverId);
  const byType = new Map(
    data.documents
      .filter((d) => d.driverId === driverId)
      .map((d) => [d.type, d])
  );

  const profile = getDriverOperationalProfile(data, driverId);
  return [
    {
      type: "CDL",
      status: getDriverDocumentByType(driverId, "CDL")
        ? deriveCredentialStatusFromExpiration(byType.get("CDL")?.expirationDate)
        : "MISSING",
      expirationDate: byType.get("CDL")?.expirationDate,
      fileUrl: packet.cdl,
      previewUrl: packet.cdl,
    },
    {
      type: "Insurance Card",
      status: packet.insuranceCard ? "VALID" : "MISSING",
      expirationDate: byType.get("Insurance Card")?.expirationDate,
      fileUrl: packet.insuranceCard,
      previewUrl: packet.insuranceCard,
    },
    {
      type: "Medical Card",
      status: getDriverDocumentByType(driverId, "Medical Card")
        ? deriveCredentialStatusFromExpiration(byType.get("Medical Card")?.expirationDate)
        : "MISSING",
      expirationDate: byType.get("Medical Card")?.expirationDate,
      fileUrl: packet.medicalCard,
      previewUrl: packet.medicalCard,
    },
    {
      type: "MVR",
      status: packet.mvr ? byType.get("MVR")?.status ?? "VALID" : "MISSING",
      expirationDate: byType.get("MVR")?.expirationDate,
      fileUrl: packet.mvr,
      previewUrl: packet.mvr,
    },
    {
      type: "I-9",
      status: packet.i9 ? byType.get("I-9")?.status ?? "VALID" : "MISSING",
      expirationDate: byType.get("I-9")?.expirationDate,
      fileUrl: packet.i9,
      previewUrl: packet.i9,
    },
    {
      type: "FMCSA",
      status: packet.fmcsaCompliance
        ? byType.get("FMCSA")?.status ?? "VALID"
        : "MISSING",
      expirationDate: byType.get("FMCSA")?.expirationDate,
      fileUrl: packet.fmcsaCompliance,
      previewUrl: packet.fmcsaCompliance,
    },
    {
      type: "W-9",
      status: packet.w9 ? byType.get("W-9")?.status ?? "VALID" : "MISSING",
      expirationDate: byType.get("W-9")?.expirationDate,
      fileUrl: packet.w9,
      previewUrl: packet.w9,
    },
    {
      type: "Bank Info",
      status:
        profile?.hasMissingBank || !packet.bankInformation
          ? "MISSING"
          : byType.get("Bank Info")?.status ?? "VALID",
      expirationDate: byType.get("Bank Info")?.expirationDate,
      fileUrl: packet.bankInformation,
      previewUrl: packet.bankInformation,
    },
    {
      type: "Emergency Contact",
      status:
        profile?.hasMissingEmergencyPrimary ||
        profile?.hasMissingEmergencySecondary ||
        !packet.emergencyContact
          ? "MISSING"
          : "VALID",
      expirationDate: undefined,
      fileUrl: packet.emergencyContact,
      previewUrl: packet.emergencyContact,
    },
  ];
}

