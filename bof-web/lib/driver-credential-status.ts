import type { BofData } from "@/lib/load-bof-data";
import type { DocumentSignal } from "@/lib/document-ui";
import { documentSignalLabel } from "@/lib/document-ui";
import {
  deriveCredentialStatusFromExpiration,
  getDriverDocumentByType,
  getDriverMedicalCardStatus,
  getDriverMvrStatus,
} from "@/lib/driver-doc-registry";

/** Canonical medical / MVR resolvers — single import surface (`@/lib/driver-credential-status`). */
export { getDriverMedicalCardStatus, getDriverMvrStatus } from "./driver-doc-registry";
export type { DriverMedicalCardStatus, DriverMvrStatus } from "./driver-doc-registry";

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
  /** Resolver explanation (dashboard / compliance reconciliation). */
  reason?: string;
  /** Which credential slot this record represents (copy/copy consistency). */
  slot?: "cdl" | "medicalCard" | "mvr" | "fmcsa";
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
  source: string,
  slot?: CredentialRecord["slot"]
): CredentialRecord {
  if (expirationDate) {
    const derived = deriveCredentialStatusFromExpiration(expirationDate);
    if (derived === "VALID") return { status: "valid", expirationDate, fileUrl, source, slot };
    if (derived === "EXPIRING_SOON")
      return { status: "expiring_soon", expirationDate, fileUrl, source, slot };
    if (derived === "EXPIRED") return { status: "expired", expirationDate, fileUrl, source, slot };
  }
  if (fileUrl) {
    return {
      status: "pending_review",
      expirationDate,
      fileUrl,
      source,
      slot,
    };
  }
  return { status: "missing", expirationDate, fileUrl, source, slot };
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

  const mvrCanon = getDriverMvrStatus(data, driverId);

  const fmcsaReview = byType.get("FMCSA")?.expirationDate?.trim() || undefined;
  const fmcsaFile = getDriverDocumentByType(driverId, "FMCSA");
  const fmcsa = fromDateAndFile(fmcsaReview, fmcsaFile, "driver_doc_registry", "fmcsa");

  return {
    driverId,
    cdl: fromDateAndFile(cdlExp, cdlFile, "driver_doc_registry", "cdl"),
    medicalCard: {
      slot: "medicalCard",
      status: med.status,
      expirationDate: med.expirationDate,
      fileUrl: med.fileUrl,
      source: med.source,
      reason: med.reason,
    },
    mvr: {
      slot: "mvr",
      status: mvrCanon.status,
      expirationDate: mvrCanon.expirationDate,
      fileUrl: mvrCanon.fileUrl,
      source: mvrCanon.source,
      reason: mvrCanon.reason,
    },
    fmcsa: {
      ...fmcsa,
      reviewDate: fmcsaReview,
    },
  };
}

/** Seed compliance incidents can drift from structured documents — suppress document-backed MVR noise. */
export function complianceIncidentSuppressedByCanonicalMvr(
  data: BofData,
  incident: { type?: string; driverId?: string }
): boolean {
  const title = String(incident.type ?? "").trim().toLowerCase();
  if (!title.includes("mvr")) return false;
  if (!/\b(review|required|expired|missing|due|stale|qualification)\b/i.test(String(incident.type ?? "")))
    return false;
  const id = String(incident.driverId ?? "").trim();
  if (!id) return false;
  return getDriverMvrStatus(data, id).status === "valid";
}

/** When an MVR-titled compliance incident is kept, align headline with canonical MVR (not stale CMP copy). */
export function refineMvrComplianceIncidentPresentation(
  data: BofData,
  incident: { type: string; driverId: string; severity: string }
): { title: string; severity: "critical" | "high" | "medium" } | null {
  const t = incident.type.toLowerCase();
  if (!t.includes("mvr")) return null;
  const mvr = getDriverMvrStatus(data, incident.driverId);
  switch (mvr.status) {
    case "valid":
      return null;
    case "expired":
      return {
        title: `MVR expired${mvr.expirationDate ? ` (${mvr.expirationDate})` : ""} — renewal required`,
        severity: "critical",
      };
    case "missing":
      return {
        title: "MVR missing — upload or order current motor vehicle record",
        severity: "critical",
      };
    case "expiring_soon":
      return {
        title: `MVR expiring soon (${mvr.expirationDate ?? "see vault"}) — schedule review`,
        severity: "high",
      };
    case "pending_review":
      return {
        title: "Open compliance review: MVR qualification review",
        severity: "high",
      };
    default:
      return null;
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
      : "Expiring soon";
  }
  if (record.status === "pending_review") {
    if (record.fileUrl && !record.expirationDate) {
      return record.slot === "mvr"
        ? "On file — review date needs review"
        : "On file — expiration needs review";
    }
    if (!record.fileUrl && record.expirationDate) return "Status recorded — file missing";
    return "Pending review";
  }
  if (!record.fileUrl && !record.expirationDate) return "Missing / needs review";
  if (record.fileUrl && !record.expirationDate) {
    return record.slot === "mvr"
      ? "On file — review date needs review"
      : "On file — expiration needs review";
  }
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

