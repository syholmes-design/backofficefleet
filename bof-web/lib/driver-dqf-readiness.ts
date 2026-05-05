import type { BofData } from "@/lib/load-bof-data";
import { buildDriverDocumentPacket, type DriverDocumentGroupKey, type DriverPacketDocument } from "@/lib/driver-document-packet";
import {
  getDriverCredentialStatus,
  type CanonicalCredentialStatus,
} from "@/lib/driver-credential-status";
import { deriveCredentialStatusFromExpiration } from "@/lib/driver-doc-registry";

export type DriverDqfRowStatus =
  | "ready"
  | "missing"
  | "expired"
  | "expiring_soon"
  | "needs_review"
  | "pending_review";

export type DriverDqfDocumentSource =
  | "public_file"
  | "generated_summary"
  | "template_output"
  | "structured_record"
  | "missing";

export type DriverDqfDocumentRow = {
  canonicalType: string;
  label: string;
  group: DriverDocumentGroupKey | "vault_supplemental";
  status: DriverDqfRowStatus;
  fileUrl?: string;
  expirationDate?: string;
  reviewDate?: string;
  source: DriverDqfDocumentSource;
  notes?: string;
  actionLabel?: string;
  actionHref?: string;
  whyItMatters?: string;
  recommendedFix?: string;
  /** When true, missing does not increment fleet required-missing KPI (insurance optional) */
  optionalForReadiness?: boolean;
};

export type DriverDqfOverallStatus = "ready" | "needs_review" | "action_required" | "blocked";

export type DriverDqfReadinessSummary = {
  driverId: string;
  driverName: string;
  readyCount: number;
  missingCount: number;
  expiredCount: number;
  needsReviewCount: number;
  expiringSoonCount: number;
  overallStatus: DriverDqfOverallStatus;
  nextRecommendedAction: string;
  documents: DriverDqfDocumentRow[];
};

function mapSourceKindToRowSource(kind: DriverPacketDocument["sourceKind"]): DriverDqfDocumentSource {
  if (kind === "missing") return "missing";
  if (kind === "public_file") return "public_file";
  if (kind === "generated_summary") return "generated_summary";
  if (kind === "template_output") return "template_output";
  return "structured_record";
}

function credentialStatusToRowStatus(s: CanonicalCredentialStatus): DriverDqfRowStatus {
  if (s === "valid") return "ready";
  if (s === "missing") return "missing";
  if (s === "expired") return "expired";
  if (s === "expiring_soon") return "expiring_soon";
  return "needs_review";
}

function mergeCoreCredentialStatus(
  canonicalType: string,
  cred: ReturnType<typeof getDriverCredentialStatus>
): DriverDqfRowStatus | null {
  switch (canonicalType) {
    case "cdl":
      return credentialStatusToRowStatus(cred.cdl.status);
    case "medical_card":
      return credentialStatusToRowStatus(cred.medicalCard.status);
    case "mvr":
      return credentialStatusToRowStatus(cred.mvr.status);
    case "fmcsa_compliance":
      return credentialStatusToRowStatus(cred.fmcsa.status);
    default:
      return null;
  }
}

/**
 * Non-credential packet rows: never count EXPIRED without a date past today as expired.
 */
function packetRowToStatus(doc: DriverPacketDocument): DriverDqfRowStatus {
  const hasFile = Boolean(doc.fileUrl?.trim() || doc.previewUrl?.trim());
  const raw = (doc.status || "").trim().toUpperCase().replace(/\s+/g, "_");

  if (!hasFile && (raw === "MISSING" || raw === "")) return "missing";
  if (!hasFile) return "missing";

  const exp = doc.expirationDate?.trim();
  if (exp) {
    const derived = deriveCredentialStatusFromExpiration(exp);
    if (derived === "EXPIRED") return "expired";
    if (derived === "EXPIRING_SOON") return "expiring_soon";
    if (derived === "VALID") {
      if (raw === "EXPIRED") return "needs_review";
      if (raw.includes("PENDING") || raw.includes("REVIEW") || raw === "AT_RISK")
        return "needs_review";
      return "ready";
    }
    return "needs_review";
  }

  if (raw === "EXPIRED") return "needs_review";
  if (raw.includes("PENDING") || raw.includes("REVIEW") || raw === "AT_RISK") return "needs_review";
  if (raw === "VALID" || raw === "COMPLETE") return "ready";
  return hasFile ? "needs_review" : "missing";
}

function vaultHref(driverId: string, path: "vault" | "hr" | "profile"): string {
  const base = `/drivers/${driverId}`;
  if (path === "hr") return `${base}/hr`;
  if (path === "profile") return `${base}/profile`;
  return `${base}/vault`;
}

function explainRow(row: DriverDqfDocumentRow, driverId: string): DriverDqfDocumentRow {
  if (row.status === "ready") return row;
  const v = vaultHref(driverId, "vault");
  const hr = vaultHref(driverId, "hr");
  const base = { ...row };
  if (row.canonicalType === "medical_card" && row.status === "expired") {
    return {
      ...base,
      whyItMatters: "Blocks dispatch assignment until a current medical certificate is on file.",
      recommendedFix: "Upload the renewed medical card and confirm expiration dates in the vault.",
      actionLabel: "Open vault / HR",
      actionHref: row.fileUrl ? v : hr,
    };
  }
  if (row.canonicalType === "cdl" && (row.status === "expired" || row.status === "missing")) {
    return {
      ...base,
      whyItMatters: "CDL must be current for regulated operation and dispatch eligibility.",
      recommendedFix: "Upload a valid CDL image/PDF with correct expiration metadata.",
      actionLabel: "Open vault",
      actionHref: v,
    };
  }
  if (row.canonicalType === "w9" && row.status === "missing") {
    return {
      ...base,
      whyItMatters: "Settlements and 1099 payroll flows need a signed W-9 on file.",
      recommendedFix: "Upload the signed W-9 to the driver file so settlements can be released.",
      actionLabel: "Open HR",
      actionHref: hr,
    };
  }
  if (row.canonicalType === "bank_information" && row.status === "missing") {
    return {
      ...base,
      whyItMatters: "Payroll cannot release funds without verified direct-deposit instructions.",
      recommendedFix: "Add the bank information form or direct-deposit document in the driver file.",
      actionLabel: "Open HR",
      actionHref: hr,
    };
  }
  return {
    ...base,
    whyItMatters: "This driver-file item needs review before the file can be fully cleared.",
    recommendedFix: "Open the driver vault, confirm the specific item status, and update the missing or outdated file.",
    actionLabel: "Open vault",
    actionHref: v,
  };
}

const SUPPLEMENTAL_FILES: Array<{ canonicalType: string; label: string; file: string }> = [
  { canonicalType: "road_test_certificate", label: "Road Test Certificate", file: "road-test-certificate.html" },
  { canonicalType: "prior_employer_inquiry", label: "Prior Employer Inquiry", file: "prior_employer_inquiry.html" },
  { canonicalType: "annual_review_qual_file", label: "Annual Review (Qualification File)", file: "qualification-file.html" },
  { canonicalType: "drug_test_result", label: "Drug Test Result", file: "drug_test_result.html" },
];

function supplementalRows(driverId: string): DriverDqfDocumentRow[] {
  return SUPPLEMENTAL_FILES.map((s) => {
    const url = `/generated/drivers/${driverId}/${s.file}`;
    return {
      canonicalType: s.canonicalType,
      label: s.label,
      group: "vault_supplemental",
      status: "ready",
      fileUrl: url,
      source: "generated_summary",
      notes: "Generated compliance artifact",
      actionLabel: "Open file",
      actionHref: url,
      optionalForReadiness: true,
    };
  });
}

/**
 * Single source of truth for driver vault DQF readiness: canonical packet + credential resolver
 * for core credentials; conservative expired classification; summaries excluded from required KPIs.
 */
export function getDriverDqfReadinessSummary(data: BofData, driverId: string): DriverDqfReadinessSummary {
  const driver = data.drivers.find((d) => d.id === driverId);
  const driverName = driver?.name ?? driverId;
  const packet = buildDriverDocumentPacket(data, driverId);
  const cred = getDriverCredentialStatus(data, driverId);

  const rows: DriverDqfDocumentRow[] = [];

  for (const doc of packet.documents) {
    const credOverride = doc.group === "core_dqf" ? mergeCoreCredentialStatus(doc.canonicalType, cred) : null;
    const status: DriverDqfRowStatus = credOverride ?? packetRowToStatus(doc);
    const optional = doc.canonicalType === "insurance_card";

    const src = mapSourceKindToRowSource(doc.sourceKind);

    rows.push(
      explainRow(
        {
          canonicalType: doc.canonicalType,
          label: doc.label,
          group: doc.group,
          status,
          fileUrl: doc.fileUrl ?? doc.previewUrl,
          expirationDate: doc.expirationDate,
          reviewDate: undefined,
          source: src,
          notes: doc.notes,
          optionalForReadiness: optional,
        },
        driverId
      )
    );
  }

  rows.push(...supplementalRows(driverId));

  let readyCount = 0;
  let missingCount = 0;
  let expiredCount = 0;
  let needsReviewCount = 0;
  let expiringSoonCount = 0;

  /** KPIs reflect Core DQF only — HR workflow + summaries + supplemental do not inflate fleet gates. */
  for (const r of rows) {
    if (r.group !== "core_dqf") continue;
    if (r.optionalForReadiness && r.status === "missing") continue;
    if (r.status === "ready") readyCount += 1;
    else if (r.status === "missing") missingCount += 1;
    else if (r.status === "expired") expiredCount += 1;
    else if (r.status === "expiring_soon") expiringSoonCount += 1;
    else needsReviewCount += 1;
  }

  let overallStatus: DriverDqfOverallStatus = "ready";
  if (expiredCount > 0 || missingCount > 0) overallStatus = "action_required";
  else if (needsReviewCount > 0 || expiringSoonCount > 0) overallStatus = "needs_review";

  let nextRecommendedAction = "DQF packet looks current — spot-check expirations before long haul.";
  if (expiredCount > 0) {
    nextRecommendedAction = "Renew or replace expired credentials before assigning loads.";
  } else if (missingCount > 0) {
    nextRecommendedAction = "Upload missing core DQF documents to restore dispatch readiness.";
  } else if (needsReviewCount > 0) {
    nextRecommendedAction = "Clear pending reviews (dates, scans, or HR attestations) for documents on file.";
  } else if (expiringSoonCount > 0) {
    nextRecommendedAction = "Schedule renewals for documents expiring within 60 days.";
  }

  return {
    driverId,
    driverName,
    readyCount,
    missingCount,
    expiredCount,
    needsReviewCount,
    expiringSoonCount,
    overallStatus,
    nextRecommendedAction,
    documents: rows,
  };
}

export function filterDqfRowsByGroup(
  rows: DriverDqfDocumentRow[],
  group: DriverDqfDocumentRow["group"]
): DriverDqfDocumentRow[] {
  return rows.filter((r) => r.group === group);
}
