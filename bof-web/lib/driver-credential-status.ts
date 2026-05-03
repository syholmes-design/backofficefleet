import type { BofData } from "@/lib/load-bof-data";
import type { DocumentSignal } from "@/lib/document-ui";
import { documentSignalLabel } from "@/lib/document-ui";
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

export type CredentialRecord = {
  status: CanonicalCredentialStatus;
  expirationDate?: string;
  reviewDate?: string;
  fileUrl?: string;
  source: string;
};

/** Alias for panels that surface canonical resolver slices next to raw document rows. */
export type CanonicalCredentialRecord = CredentialRecord;

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

  const credOverride = data.driverCredentialOverrides?.[driverId];

  const cdlExp =
    credOverride?.cdlExpirationDate?.trim() ||
    byType.get("CDL")?.expirationDate?.trim() ||
    undefined;
  const cdlFile = getDriverDocumentByType(driverId, "CDL");

  const med = getDriverMedicalCardStatus(data, driverId);

  const mvrExp =
    credOverride?.mvrReviewDate?.trim() ||
    byType.get("MVR")?.expirationDate?.trim() ||
    undefined;
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
      : "Expiring soon";
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

export function canonicalCredentialBadgeLabel(record: CredentialRecord): string {
  switch (record.status) {
    case "valid":
      return "VALID";
    case "expired":
      return "EXPIRED";
    case "missing":
      return "MISSING";
    case "expiring_soon":
      return "EXPIRING_SOON";
    case "pending_review":
    default:
      return "PENDING REVIEW";
  }
}

/** Dispatch-style severity mapping for medical credential slices (HR packet). */
export function medicalCanonicalSignal(record: CredentialRecord): DocumentSignal {
  if (record.status === "expired" || record.status === "missing") return "blocking";
  if (record.status === "expiring_soon" || record.status === "pending_review") return "at-risk";
  return "resolved";
}

export function medicalCanonicalSignalLabel(signal: DocumentSignal): string {
  return documentSignalLabel(signal);
}

