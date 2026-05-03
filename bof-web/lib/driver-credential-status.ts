import type { BofData } from "@/lib/load-bof-data";
import {
  deriveCredentialStatusFromExpiration,
  getDriverDocumentByType,
  getDriverMedicalCardStatus,
} from "@/lib/driver-doc-registry";

/** Canonical medical resolver — re-exported for a single import surface (`@/lib/driver-credential-status`). */
export { getDriverMedicalCardStatus } from "./driver-doc-registry";
export type { DriverMedicalCardStatus } from "./driver-doc-registry";

export type CanonicalCredentialStatus =
  | "valid"
  | "expiring_soon"
  | "expired"
  | "missing"
  | "pending_review";

export type CanonicalCredentialRecord = {
  status: CanonicalCredentialStatus;
  expirationDate?: string;
  reviewDate?: string;
  fileUrl?: string;
  source: string;
};

type CredentialRecord = CanonicalCredentialRecord;

export type DriverCredentialStatus = {
  driverId: string;
  cdl: CredentialRecord;
  medicalCard: CredentialRecord;
  mvr: CredentialRecord;
  fmcsa: CredentialRecord;
};

function fromDateAndFile(
  expirationDate: string | undefined,
  fileUrl: string | undefined,
  source: string
): CredentialRecord {
  if (expirationDate) {
    const derived = deriveCredentialStatusFromExpiration(expirationDate);
    if (derived === "VALID") return { status: "valid", expirationDate, fileUrl, source };
    if (derived === "EXPIRING_SOON")
      return { status: "expiring_soon", expirationDate, fileUrl, source };
    if (derived === "EXPIRED") return { status: "expired", expirationDate, fileUrl, source };
  }
  if (fileUrl) {
    return {
      status: "pending_review",
      expirationDate,
      fileUrl,
      source,
    };
  }
  return { status: "missing", expirationDate, fileUrl, source };
}

export function getDriverCredentialStatus(
  data: BofData,
  driverId: string
): DriverCredentialStatus {
  const byType = new Map(
    data.documents.filter((d) => d.driverId === driverId).map((d) => [d.type, d])
  );

  const cdlExp = byType.get("CDL")?.expirationDate?.trim() || undefined;
  const cdlFile = getDriverDocumentByType(driverId, "CDL");

  const med = getDriverMedicalCardStatus(data, driverId);

  const mvrExp = byType.get("MVR")?.expirationDate?.trim() || undefined;
  const mvrFile = getDriverDocumentByType(driverId, "MVR");

  const fmcsaReview = byType.get("FMCSA")?.expirationDate?.trim() || undefined;
  const fmcsaFile = getDriverDocumentByType(driverId, "FMCSA");
  const fmcsa = fromDateAndFile(fmcsaReview, fmcsaFile, "driver_doc_registry");

  return {
    driverId,
    cdl: fromDateAndFile(cdlExp, cdlFile, "driver_doc_registry"),
    medicalCard: {
      status: med.status,
      expirationDate: med.expirationDate,
      fileUrl: med.fileUrl,
      source: med.source,
    },
    mvr: fromDateAndFile(mvrExp, mvrFile, "driver_doc_registry"),
    fmcsa: {
      ...fmcsa,
      reviewDate: fmcsaReview,
    },
  };
}

/** Maps canonical resolver status to legacy document badge styles (VALID / EXPIRED / …). */
export function canonicalCredentialBadgeLabel(record: CanonicalCredentialRecord): string {
  switch (record.status) {
    case "valid":
      return "VALID";
    case "expired":
      return "EXPIRED";
    case "missing":
      return "MISSING";
    case "expiring_soon":
      return "AT RISK";
    case "pending_review":
      return "PENDING REVIEW";
    default:
      return "UNKNOWN";
  }
}

export type CanonicalMedicalSignal = "blocking" | "expired" | "missing" | "at-risk" | "resolved";

/** Signal line for medical UI — derived only from canonical status, not raw documents[].status. */
export function medicalCanonicalSignal(record: CanonicalCredentialRecord): CanonicalMedicalSignal {
  switch (record.status) {
    case "expired":
      return "expired";
    case "missing":
      return "missing";
    case "expiring_soon":
    case "pending_review":
      return "at-risk";
    case "valid":
    default:
      return "resolved";
  }
}

export function medicalCanonicalSignalLabel(signal: CanonicalMedicalSignal): string {
  switch (signal) {
    case "expired":
      return "Medical expired — renewal required";
    case "missing":
      return "Medical certificate missing";
    case "at-risk":
      return "Medical needs attention or review";
    default:
      return "Medical credential in good standing";
  }
}

export function credentialDisplayText(
  record: CredentialRecord
): string {
  if (record.status === "expired") {
    return record.expirationDate
      ? `Expired on ${record.expirationDate}`
      : "Expired";
  }
  if (record.status === "valid") {
    return record.expirationDate
      ? `Valid through ${record.expirationDate}`
      : "Valid";
  }
  if (record.status === "expiring_soon") {
    return record.expirationDate
      ? `Expiring soon on ${record.expirationDate}`
      : "Expiring soon — date pending";
  }
  if (record.status === "pending_review") {
    if (record.fileUrl && !record.expirationDate) return "On file — expiration needs review";
    if (!record.fileUrl && record.expirationDate) return "Status recorded — file missing";
    return "Pending review";
  }
  if (!record.fileUrl && !record.expirationDate) return "Missing / needs review";
  if (record.fileUrl && !record.expirationDate) return "On file — expiration needs review";
  if (!record.fileUrl && record.expirationDate) return "Status recorded — file missing";
  return "Missing / needs review";
}

