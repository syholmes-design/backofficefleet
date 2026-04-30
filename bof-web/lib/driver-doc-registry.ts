import type { BofData } from "@/lib/load-bof-data";
import manifestRaw from "@/lib/generated/driver-doc-manifest.json";
import { getDriverOperationalProfile } from "@/lib/driver-operational-profile";

export type DriverDocManifestKey =
  | "cdl"
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
  "Medical Card": "medicalCard",
  MVR: "mvr",
  "W-9": "w9",
  "I-9": "i9",
  "Emergency Contact": "emergencyContact",
  "Bank Info": "bankInformation",
  FMCSA: "fmcsaCompliance",
};

const driverDocManifest = (manifestRaw ?? {}) as DriverDocManifest;

export function getDriverDocumentPacket(driverId: string): DriverDocManifestEntry {
  return driverDocManifest[driverId] ?? {};
}

export function getDriverDocumentByType(
  driverId: string,
  type: string
): string | undefined {
  const key = DRIVER_DOC_TYPE_TO_KEY[type];
  if (!key) return undefined;
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
      status: deriveCredentialStatusFromExpiration(byType.get("CDL")?.expirationDate),
      expirationDate: byType.get("CDL")?.expirationDate,
      fileUrl: packet.cdl,
      previewUrl: packet.cdl,
    },
    {
      type: "Medical Card",
      status: deriveCredentialStatusFromExpiration(
        byType.get("Medical Card")?.expirationDate
      ),
      expirationDate: byType.get("Medical Card")?.expirationDate,
      fileUrl: packet.medicalCard,
      previewUrl: packet.medicalCard,
    },
    {
      type: "MVR",
      status: byType.get("MVR")?.status ?? "MISSING",
      expirationDate: byType.get("MVR")?.expirationDate,
      fileUrl: packet.mvr,
      previewUrl: packet.mvr,
    },
    {
      type: "I-9",
      status: byType.get("I-9")?.status ?? "MISSING",
      expirationDate: byType.get("I-9")?.expirationDate,
      fileUrl: packet.i9,
      previewUrl: packet.i9,
    },
    {
      type: "FMCSA",
      status: byType.get("FMCSA")?.status ?? "MISSING",
      expirationDate: byType.get("FMCSA")?.expirationDate,
      fileUrl: packet.fmcsaCompliance,
      previewUrl: packet.fmcsaCompliance,
    },
    {
      type: "W-9",
      status: byType.get("W-9")?.status ?? "MISSING",
      expirationDate: byType.get("W-9")?.expirationDate,
      fileUrl: packet.w9,
      previewUrl: packet.w9,
    },
    {
      type: "Bank Info",
      status: profile?.hasMissingBank ? "MISSING" : byType.get("Bank Info")?.status ?? "VALID",
      expirationDate: byType.get("Bank Info")?.expirationDate,
      fileUrl: packet.bankInformation,
      previewUrl: packet.bankInformation,
    },
    {
      type: "Emergency Contact",
      status:
        profile?.hasMissingEmergencyPrimary || profile?.hasMissingEmergencySecondary
          ? "MISSING"
          : "VALID",
      expirationDate: undefined,
      fileUrl: packet.emergencyContact,
      previewUrl: packet.emergencyContact,
    },
  ];
}

