import type { BofData } from "@/lib/load-bof-data";
import manifestRaw from "@/lib/generated/driver-doc-manifest.json";
import publicDocIndexRaw from "@/lib/generated/driver-public-doc-index.json";
import canonicalBankCardFiles from "@/lib/driver-canonical-bank-cards.json";

export type DriverDocManifestKey =
  | "cdl"
  | "insuranceCard"
  | "medicalCard"
  | "mvr"
  | "w9"
  | "i9"
  | "emergencyContact"
  | "bankInformation"
  | "fmcsaCompliance"
  | "dqfComplianceSummary";

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
  "FMCSA DQF Compliance Summary": "dqfComplianceSummary",
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
    /** Canonical USCIS I-9 PDF — driverId only: i9-drv-009.pdf */
    "I-9": `${root}/i9-${driverId.toLowerCase()}`,
    /** Canonical IRS W-9 PDF keyed by driverId only (e.g. w9-drv-009.pdf). */
    "W-9": `${root}/w9-${driverId.toLowerCase()}`,
    FMCSA: `${root}/fmcsa-compliance`,
    "FMCSA Compliance": `${root}/fmcsa-compliance`,
    "FMCSA DQF Compliance Summary": `${root}/dqf-compliance-summary`,
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
    /** Canonical I-9 PDF only when listed in driver-public-doc-index (sync from disk); no generated HTML fallback. */
    i9: getDriverPublicDocPath(driverId, "I-9"),
    w9: getDriverPublicDocPath(driverId, "W-9") ?? merged.w9,
    fmcsaCompliance:
      getDriverPublicDocPath(driverId, "FMCSA Compliance") ?? merged.fmcsaCompliance,
    dqfComplianceSummary:
      getDriverPublicDocPath(driverId, "FMCSA DQF Compliance Summary") ??
      merged.dqfComplianceSummary,
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

export type DriverMedicalCardCanonicalStatus =
  | "valid"
  | "expiring_soon"
  | "expired"
  | "pending_review"
  | "missing";

export type DriverMedicalCardStatusSource =
  | "runtime_override"
  | "canonical_document"
  | "structured_demo_data"
  | "driver_doc_registry"
  | "missing";

export type DriverMedicalCardStatus = {
  driverId: string;
  documentType: "medical_card";
  fileUrl?: string;
  expirationDate?: string;
  status: DriverMedicalCardCanonicalStatus;
  /** Row status string used across DocumentRow / dispatch (VALID, EXPIRED, …). */
  rowStatus: string;
  source: DriverMedicalCardStatusSource;
  reason: string;
};

function pickCanonicalMedicalRow(data: BofData, driverId: string) {
  const rows = data.documents.filter(
    (d) => d.driverId === driverId && d.type === "Medical Card"
  );
  if (rows.length === 0) return null;
  const primary = rows.find((r) => r.docTier === "primary");
  return primary ?? rows[0];
}

function medicalStatusFromDerived(
  derived: string,
): { status: DriverMedicalCardCanonicalStatus; rowStatus: string } {
  switch (derived) {
    case "VALID":
      return { status: "valid", rowStatus: "VALID" };
    case "EXPIRING_SOON":
      return { status: "expiring_soon", rowStatus: "EXPIRING_SOON" };
    case "EXPIRED":
      return { status: "expired", rowStatus: "EXPIRED" };
    default:
      return { status: "pending_review", rowStatus: "PENDING REVIEW" };
  }
}

/**
 * Canonical medical card resolver: keyed by driverId; derives status from structured expirationDate.
 * Ignores stale `status` on the Medical Card row when expirationDate is present.
 */
export function getDriverMedicalCardStatus(
  data: BofData,
  driverId: string
): DriverMedicalCardStatus {
  const fileUrl = getDriverDocumentByType(driverId, "Medical Card");
  const row = pickCanonicalMedicalRow(data, driverId);
  const overrideExp =
    data.driverCredentialOverrides?.[driverId]?.medicalCardExpirationDate?.trim() || undefined;

  if (overrideExp) {
    const derived = deriveCredentialStatusFromExpiration(overrideExp);
    const { status, rowStatus } = medicalStatusFromDerived(derived);
    return {
      driverId,
      documentType: "medical_card",
      fileUrl: fileUrl ?? undefined,
      expirationDate: overrideExp,
      status,
      rowStatus,
      source: "runtime_override",
      reason:
        "Runtime credential override (Safety expirations / demo editor) — scoped to this driverId only",
    };
  }

  const expandedExp =
    (
      data.driverMedicalExpanded as Record<string, { medicalExpirationDate?: string }> | undefined
    )?.[driverId]?.medicalExpirationDate?.trim() || undefined;

  if (!row) {
    if (expandedExp) {
      const derived = deriveCredentialStatusFromExpiration(expandedExp);
      const { status, rowStatus } = medicalStatusFromDerived(derived);
      return {
        driverId,
        documentType: "medical_card",
        fileUrl: fileUrl ?? undefined,
        expirationDate: expandedExp,
        status,
        rowStatus,
        source: "structured_demo_data",
        reason: "driverMedicalExpanded.medicalExpirationDate (no documents[] Medical Card row)",
      };
    }
    if (!fileUrl) {
      return {
        driverId,
        documentType: "medical_card",
        status: "missing",
        rowStatus: "MISSING",
        source: "missing",
        reason: "No Medical Card row in demo documents and no indexed file URL",
      };
    }
    return {
      driverId,
      documentType: "medical_card",
      fileUrl,
      status: "pending_review",
      rowStatus: "PENDING REVIEW",
      source: "driver_doc_registry",
      reason: "Indexed medical card file without structured Medical Card row",
    };
  }

  const expirationDate = row.expirationDate?.trim() || undefined;

  if (expirationDate) {
    const derived = deriveCredentialStatusFromExpiration(expirationDate);
    const { status, rowStatus } = medicalStatusFromDerived(derived);
    return {
      driverId,
      documentType: "medical_card",
      fileUrl: fileUrl ?? undefined,
      expirationDate,
      status,
      rowStatus,
      source: "canonical_document",
      reason:
        "expirationDate on canonical Medical Card row (status derived from date, not stale row.status)",
    };
  }

  if (expandedExp) {
    const derived = deriveCredentialStatusFromExpiration(expandedExp);
    const { status, rowStatus } = medicalStatusFromDerived(derived);
    return {
      driverId,
      documentType: "medical_card",
      fileUrl: fileUrl ?? undefined,
      expirationDate: expandedExp,
      status,
      rowStatus,
      source: "structured_demo_data",
      reason:
        "driverMedicalExpanded.medicalExpirationDate — documents row missing expirationDate",
    };
  }

  if (fileUrl) {
    return {
      driverId,
      documentType: "medical_card",
      fileUrl,
      expirationDate: undefined,
      status: "pending_review",
      rowStatus: "PENDING REVIEW",
      source: "canonical_document",
      reason:
        "Medical Card row present without expirationDate; file on file — pending review",
    };
  }

  return {
    driverId,
    documentType: "medical_card",
    expirationDate: undefined,
    status: "missing",
    rowStatus: "MISSING",
    source: "missing",
    reason: "Medical Card row without expirationDate and no indexed file",
  };
}

export function medicalCardHardBlockReason(med: DriverMedicalCardStatus): string | null {
  if (med.status === "expired" && med.expirationDate) {
    return `Medical Card expired on ${med.expirationDate}`;
  }
  if (med.status === "missing") {
    return "Medical Card missing";
  }
  return null;
}

export function medicalCardSoftWarningReason(med: DriverMedicalCardStatus): string | null {
  if (med.status === "expiring_soon" && med.expirationDate) {
    return `Medical Card expiring soon on ${med.expirationDate}`;
  }
  if (med.status === "pending_review") {
    return med.expirationDate
      ? `Medical Card pending review (expiration ${med.expirationDate})`
      : "Medical Card on file — expiration needs review";
  }
  return null;
}

export type DriverMvrCanonicalStatus = DriverMedicalCardCanonicalStatus;

export type DriverMvrStatusSource =
  | "runtime_override"
  | "canonical_document"
  | "driver_doc_registry"
  | "missing";

export type DriverMvrStatus = {
  driverId: string;
  documentType: "mvr";
  fileUrl?: string;
  expirationDate?: string;
  status: DriverMvrCanonicalStatus;
  rowStatus: string;
  source: DriverMvrStatusSource;
  reason: string;
};

function pickCanonicalMvrRow(data: BofData, driverId: string) {
  const rows = data.documents.filter(
    (d) => d.driverId === driverId && d.type === "MVR"
  );
  if (rows.length === 0) return null;
  const primary = rows.find((r) => r.docTier === "primary");
  return primary ?? rows[0];
}

function mvrCanonicalToRowStatus(s: DriverMvrCanonicalStatus): string {
  switch (s) {
    case "valid":
      return "VALID";
    case "expiring_soon":
      return "EXPIRING_SOON";
    case "expired":
      return "EXPIRED";
    case "pending_review":
      return "PENDING REVIEW";
    default:
      return "MISSING";
  }
}

/**
 * Canonical MVR resolver keyed by driverId: derives status from structured expirationDate and indexed file.
 * Ignores stale `documents[].status` when expirationDate is present (same policy as Medical Card).
 */
export function getDriverMvrStatus(data: BofData, driverId: string): DriverMvrStatus {
  const fileUrl = getDriverDocumentByType(driverId, "MVR");
  const row = pickCanonicalMvrRow(data, driverId);
  const overrideExp =
    data.driverCredentialOverrides?.[driverId]?.mvrReviewDate?.trim() || undefined;

  if (overrideExp) {
    const derived = deriveCredentialStatusFromExpiration(overrideExp);
    let status: DriverMvrCanonicalStatus;
    switch (derived) {
      case "VALID":
        status = "valid";
        break;
      case "EXPIRING_SOON":
        status = "expiring_soon";
        break;
      case "EXPIRED":
        status = "expired";
        break;
      default:
        status = "pending_review";
        break;
    }
    return {
      driverId,
      documentType: "mvr",
      fileUrl: fileUrl ?? undefined,
      expirationDate: overrideExp,
      status,
      rowStatus: mvrCanonicalToRowStatus(status),
      source: "runtime_override",
      reason:
        "Runtime credential override — scoped to this driverId; precedes seed MVR row",
    };
  }

  if (!row) {
    if (!fileUrl) {
      return {
        driverId,
        documentType: "mvr",
        status: "missing",
        rowStatus: "MISSING",
        source: "missing",
        reason: "No MVR row in demo documents and no indexed file URL",
      };
    }
    return {
      driverId,
      documentType: "mvr",
      fileUrl,
      status: "pending_review",
      rowStatus: "PENDING REVIEW",
      source: "driver_doc_registry",
      reason: "Indexed MVR file without structured MVR documents row",
    };
  }

  const expirationDate = row.expirationDate?.trim() || undefined;

  if (expirationDate) {
    const derived = deriveCredentialStatusFromExpiration(expirationDate);
    let status: DriverMvrCanonicalStatus;
    switch (derived) {
      case "VALID":
        status = "valid";
        break;
      case "EXPIRING_SOON":
        status = "expiring_soon";
        break;
      case "EXPIRED":
        status = "expired";
        break;
      default:
        status = "pending_review";
        break;
    }
    return {
      driverId,
      documentType: "mvr",
      fileUrl: fileUrl ?? undefined,
      expirationDate,
      status,
      rowStatus: mvrCanonicalToRowStatus(status),
      source: "canonical_document",
      reason:
        "expirationDate on canonical MVR row (status derived from date, not stale row.status or complianceIncidents)",
    };
  }

  if (fileUrl) {
    return {
      driverId,
      documentType: "mvr",
      fileUrl,
      expirationDate: undefined,
      status: "pending_review",
      rowStatus: "PENDING REVIEW",
      source: "canonical_document",
      reason:
        "MVR documents row without expirationDate; file on file — review date needs verification",
    };
  }

  return {
    driverId,
    documentType: "mvr",
    expirationDate: undefined,
    status: "missing",
    rowStatus: "MISSING",
    source: "canonical_document",
    reason: "MVR row without expirationDate and no indexed file",
  };
}

