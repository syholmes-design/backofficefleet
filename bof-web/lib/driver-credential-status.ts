import type { BofData } from "@/lib/load-bof-data";
import type { DocumentSignal } from "@/lib/document-ui";
import { documentSignalLabel } from "@/lib/document-ui";
import { getDriverOperationalProfile } from "@/lib/driver-operational-profile";
import {
  deriveCredentialStatusFromExpiration,
  getDriverDocumentByType,
  getDriverDocumentPacket,
  getDriverMedicalCardStatus,
  getDriverMvrStatus,
  getDriverPublicDocPath,
  resolveDriverBankInformationUrl,
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
  issueDate?: string;
  examinerName?: string;
  fileUrl?: string;
  source: string;
  /** Resolver explanation (dashboard / compliance reconciliation). */
  reason?: string;
  slot?: "cdl" | "medicalCard" | "mvr" | "fmcsa";
  /** Stable slot label for UI / validation */
  label?: string;
};

/** Alias for panels that surface canonical resolver slices next to raw document rows. */
export type CanonicalCredentialRecord = CredentialRecord;

export type DriverCredentialStatus = {
  driverId: string;
  cdl: CredentialRecord;
  medicalCard: CredentialRecord;
  mvr: CredentialRecord;
  fmcsa: CredentialRecord;
  w9: CredentialRecord;
  bankInformation: CredentialRecord;
  emergencyContact: CredentialRecord;
  insuranceCard: CredentialRecord;
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

function medicalExpanded(data: BofData, driverId: string) {
  const dm = (
    data as BofData & {
      driverMedicalExpanded?: Record<
        string,
        { medicalIssueDate?: string; medicalExaminerName?: string }
      >;
    }
  ).driverMedicalExpanded?.[driverId];
  return dm;
}

function sliceEmergencyContact(data: BofData, driverId: string): CredentialRecord {
  const profile = getDriverOperationalProfile(data, driverId);
  const fileUrl = getDriverPublicDocPath(driverId, "Emergency Contact");
  const name = profile?.primaryEmergencyName?.trim();
  const phone = profile?.primaryEmergencyPhone?.trim();
  const structured = Boolean(name && phone);
  if (structured) {
    return {
      label: "Emergency Contact",
      status: "valid",
      fileUrl,
      source: "driver_operational_profile+dqf_registry",
      reason: "Primary emergency contact fields populated on driver / HR seed",
    };
  }
  if (fileUrl) {
    return {
      label: "Emergency Contact",
      status: "pending_review",
      fileUrl,
      source: "driver_doc_registry",
      reason: "Emergency contact artifact indexed — structured primary fields incomplete",
    };
  }
  return {
    label: "Emergency Contact",
    status: "missing",
    source: "driver_operational_profile+dqf_registry",
    reason: "No indexed emergency contact form and no primary name/phone pair",
  };
}

function sliceBankInformation(data: BofData, driverId: string): CredentialRecord {
  const profile = getDriverOperationalProfile(data, driverId);
  const fileUrl = resolveDriverBankInformationUrl(driverId);
  const hasCore = Boolean(profile?.bankName?.trim() && profile?.bankAccountLast4?.trim());
  if (hasCore && fileUrl) {
    return {
      label: "Bank Information",
      status: "valid",
      fileUrl,
      source: "driver_operational_profile+dqf_registry",
      reason: "Bank identity fields and canonical bank card indexed",
    };
  }
  if (fileUrl) {
    return {
      label: "Bank Information",
      status: "pending_review",
      fileUrl,
      source: "driver_doc_registry",
      reason: "Canonical bank card on file — structured banking fields may need review",
    };
  }
  if (hasCore) {
    return {
      label: "Bank Information",
      status: "pending_review",
      source: "driver_operational_profile",
      reason: "Structured bank fields present without indexed canonical bank card URL",
    };
  }
  return {
    label: "Bank Information",
    status: "missing",
    source: "driver_operational_profile+dqf_registry",
    reason: "No bank card URL and incomplete structured bank fields",
  };
}

/** Maps canonical resolver status to demo document row status strings (matches legacy `rowStatus`). */
export function credentialRecordToLegacyRowStatus(record: CredentialRecord): string {
  return canonicalCredentialBadgeLabel(record);
}

/**
 * Single-line compliance card value: prefer structured dates; never blank-file when indexed URL exists.
 */
export function complianceCredentialPrimaryLine(
  record: CredentialRecord,
  mode: "expiration" | "fmcsa_review" | "mvr_review"
): string {
  let date: string | undefined;
  if (mode === "fmcsa_review") {
    date = record.reviewDate?.trim() || record.expirationDate?.trim();
  } else if (mode === "mvr_review") {
    date = record.expirationDate?.trim() || record.reviewDate?.trim();
  } else {
    date = record.expirationDate?.trim();
  }
  if (date) return date;
  if (record.fileUrl?.trim()) return "On file — date needs review";
  return "Missing / needs review";
}

export function getDriverCredentialStatus(data: BofData, driverId: string): DriverCredentialStatus {
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
  const expanded = medicalExpanded(data, driverId);
  const issueFromExpanded = expanded?.medicalIssueDate?.trim() || undefined;
  const examinerFromExpanded = expanded?.medicalExaminerName?.trim() || undefined;

  const mvrCanon = getDriverMvrStatus(data, driverId);

  const fmcsaReview = byType.get("FMCSA")?.expirationDate?.trim() || undefined;
  const fmcsaFile = getDriverDocumentByType(driverId, "FMCSA");
  const fmcsaBase = fromDateAndFile(fmcsaReview, fmcsaFile, "driver_doc_registry", "fmcsa");

  const w9Row = byType.get("W-9");
  const w9Exp = w9Row?.expirationDate?.trim() || undefined;
  const w9File = getDriverDocumentByType(driverId, "W-9");

  const insRow = byType.get("Insurance Card");
  const insExp = insRow?.expirationDate?.trim() || undefined;
  const insFile = getDriverDocumentByType(driverId, "Insurance Card");

  return {
    driverId,
    cdl: { ...fromDateAndFile(cdlExp, cdlFile, "driver_doc_registry", "cdl"), label: "CDL" },
    medicalCard: {
      slot: "medicalCard",
      label: "Medical Card",
      status: med.status,
      expirationDate: med.expirationDate,
      issueDate: issueFromExpanded,
      examinerName: examinerFromExpanded,
      fileUrl: med.fileUrl,
      source: med.source,
      reason: med.reason,
    },
    mvr: {
      slot: "mvr",
      label: "MVR",
      status: mvrCanon.status,
      expirationDate: mvrCanon.expirationDate,
      reviewDate: mvrCanon.expirationDate,
      fileUrl: mvrCanon.fileUrl,
      source: mvrCanon.source,
      reason: mvrCanon.reason,
    },
    fmcsa: {
      ...fmcsaBase,
      label: "FMCSA Compliance",
      reviewDate: fmcsaReview,
    },
    w9: { ...fromDateAndFile(w9Exp, w9File, "driver_doc_registry"), label: "W-9" },
    bankInformation: sliceBankInformation(data, driverId),
    emergencyContact: sliceEmergencyContact(data, driverId),
    insuranceCard: {
      ...fromDateAndFile(insExp, insFile, "driver_doc_registry"),
      label: "Insurance Card",
    },
  };
}

/**
 * HR / registry-facing canonical rows: statuses and dates come only from `getDriverCredentialStatus`.
 * Generated summaries (e.g. DQF summary SVG) are not used as expiration sources here.
 */
export function getCanonicalDriverDocuments(data: BofData, driverId: string) {
  const cred = getDriverCredentialStatus(data, driverId);
  const packet = getDriverDocumentPacket(driverId);
  const byType = new Map(
    data.documents.filter((d) => d.driverId === driverId).map((d) => [d.type, d])
  );

  const i9Row = byType.get("I-9");

  return [
    {
      type: "CDL" as const,
      status: credentialRecordToLegacyRowStatus(cred.cdl),
      expirationDate: cred.cdl.expirationDate,
      fileUrl: packet.cdl,
      previewUrl: packet.cdl,
    },
    {
      type: "Insurance Card" as const,
      status: credentialRecordToLegacyRowStatus(cred.insuranceCard),
      expirationDate: cred.insuranceCard.expirationDate,
      fileUrl: packet.insuranceCard ?? cred.insuranceCard.fileUrl,
      previewUrl: packet.insuranceCard ?? cred.insuranceCard.fileUrl,
    },
    {
      type: "Medical Card" as const,
      status: credentialRecordToLegacyRowStatus(cred.medicalCard),
      expirationDate: cred.medicalCard.expirationDate,
      fileUrl: packet.medicalCard,
      previewUrl: packet.medicalCard,
    },
    {
      type: "MVR" as const,
      status: credentialRecordToLegacyRowStatus(cred.mvr),
      expirationDate: cred.mvr.expirationDate,
      fileUrl: packet.mvr,
      previewUrl: packet.mvr,
    },
    {
      type: "I-9" as const,
      status: packet.i9 ? i9Row?.status ?? "VALID" : "MISSING",
      expirationDate: i9Row?.expirationDate,
      fileUrl: packet.i9,
      previewUrl: packet.i9,
    },
    {
      type: "FMCSA" as const,
      status: credentialRecordToLegacyRowStatus(cred.fmcsa),
      expirationDate: cred.fmcsa.reviewDate ?? cred.fmcsa.expirationDate,
      fileUrl: packet.fmcsaCompliance,
      previewUrl: packet.fmcsaCompliance,
    },
    {
      type: "W-9" as const,
      status: credentialRecordToLegacyRowStatus(cred.w9),
      expirationDate: cred.w9.expirationDate,
      fileUrl: packet.w9,
      previewUrl: packet.w9,
    },
    {
      type: "Bank Info" as const,
      status: credentialRecordToLegacyRowStatus(cred.bankInformation),
      expirationDate: byType.get("Bank Info")?.expirationDate,
      fileUrl: packet.bankInformation,
      previewUrl: packet.bankInformation,
    },
    {
      type: "Emergency Contact" as const,
      status: credentialRecordToLegacyRowStatus(cred.emergencyContact),
      fileUrl: packet.emergencyContact,
      previewUrl: packet.emergencyContact,
    },
  ];
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

export function credentialDisplayText(record: CredentialRecord): string {
  if (record.status === "expired") {
    return record.expirationDate ? `Expired on ${record.expirationDate}` : "Expired";
  }
  if (record.status === "valid") {
    return record.expirationDate ? `Valid through ${record.expirationDate}` : "Valid";
  }
  if (record.status === "expiring_soon") {
    return record.expirationDate ? `Expiring soon on ${record.expirationDate}` : "Expiring soon";
  }
  if (record.status === "pending_review") {
    if (record.fileUrl && !record.expirationDate && !record.reviewDate) {
      return record.slot === "mvr"
        ? "On file — review date needs review"
        : "On file — date needs review";
    }
    if (!record.fileUrl && record.expirationDate) return "Status recorded — file missing";
    return "Pending review";
  }
  if (!record.fileUrl && !record.expirationDate && !record.reviewDate) return "Missing / needs review";
  if (record.fileUrl && !record.expirationDate && !record.reviewDate) {
    return record.slot === "mvr" ? "On file — review date needs review" : "On file — date needs review";
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
