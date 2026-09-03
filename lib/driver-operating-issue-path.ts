import type { BofData } from "@/lib/load-bof-data";
import { getDriverById } from "@/lib/driver-queries";
import {
  getDriverDqfReadinessSummary,
  type DriverDqfDocumentRow,
} from "@/lib/driver-dqf-readiness";
import {
  DISPATCH_BLOCKER_REASON_IDS,
  getDriverDispatchEligibility,
} from "@/lib/driver-dispatch-eligibility";

export type DriverOperatingIssueStatus = "expired" | "expiring_soon" | "missing";

export type DriverOperatingIssuePath = {
  id: string;
  problem: string;
  recordName: string;
  documentType: string;
  driverId: string;
  driverName: string;
  status: DriverOperatingIssueStatus;
  expirationDate?: string;
  fileOnRecord: boolean;
  evidenceHref?: string;
  cause: string;
  requiredCorrection: string;
  owner: string;
  authorityToChange: string;
  exceptionCapability: string;
  responseCapability: string;
  responseRecorded?: {
    kind: "demo_hard_gate_acknowledge";
    action: string;
    by: string;
    at: string;
  };
  dispatchImpact: string;
  dqfImpact: string;
  nextStep: string;
  recheck: string;
  actionHref?: string;
  actionLabel?: string;
};

const EXCEPTION_GAP =
  "Exception approval workflow not yet implemented. A demo hard-gate acknowledgement is not an exception approval.";

const AUTHORITY =
  "Change the source driver-file date or scan (vault / Source of Truth). Eligibility and DQF re-evaluate from those helpers. No production exception approver is modeled.";

const RECHECK =
  "After the source record is updated, reload this screen. DQF, credential status, and getDriverDispatchEligibility re-run on current data. Demo acknowledgement is session-only and is not a production close.";

function ownerForRow(row: DriverDqfDocumentRow): string {
  if (row.canonicalType === "fmcsa_compliance") return "Compliance Team";
  if (row.canonicalType === "cdl" || row.canonicalType === "medical_card" || row.canonicalType === "mvr") {
    return "Compliance Team";
  }
  if (
    row.canonicalType === "i9" ||
    row.canonicalType === "w9" ||
    row.canonicalType === "bank_information" ||
    row.group === "hr_workflow"
  ) {
    return "HR Team";
  }
  return "Operations Team";
}

function causeForRow(row: DriverDqfDocumentRow): string {
  if (row.canonicalType === "fmcsa_compliance" && row.status === "expired") {
    return "FMCSA / Clearinghouse query or review date is past due. A CDL scan on file does not satisfy this query.";
  }
  if (row.canonicalType === "fmcsa_compliance" && row.status === "missing") {
    return "FMCSA / Clearinghouse documentation is not on the driver file.";
  }
  if (row.canonicalType === "medical_card" && row.status === "expired") {
    return "Medical certification expiration date is past due.";
  }
  if (row.canonicalType === "medical_card" && row.status === "expiring_soon") {
    return "Medical certification is approaching its expiration date.";
  }
  if (row.canonicalType === "cdl" && row.status === "expired") {
    return "CDL expiration date is past due.";
  }
  if (row.canonicalType === "mvr" && row.status === "expired") {
    return "MVR review date is past due.";
  }
  if (row.status === "missing") {
    return `${row.label} is not on the indexed driver file.`;
  }
  if (row.status === "expired") {
    return `${row.label} expiration or review date is past due.`;
  }
  return `${row.label} is approaching expiration.`;
}

function correctionForRow(row: DriverDqfDocumentRow): string {
  if (row.recommendedFix?.trim()) return row.recommendedFix;
  if (row.canonicalType === "fmcsa_compliance") {
    return "Run a current Clearinghouse query and update the review date on the driver file.";
  }
  if (row.canonicalType === "medical_card" && row.status === "expired") {
    return "Obtain a current medical certificate and upload it to the driver vault.";
  }
  if (row.canonicalType === "medical_card" && row.status === "expiring_soon") {
    return "Schedule or complete the medical exam before expiration. The vault can record a demo appointment affirmation; that is not a new card.";
  }
  if (row.status === "missing") {
    return `Upload ${row.label} to the driver vault.`;
  }
  return `Replace ${row.label} with a current file and date, then reload this screen.`;
}

function dispatchImpactForRow(
  row: DriverDqfDocumentRow,
  eligibility: ReturnType<typeof getDriverDispatchEligibility>
): string {
  const hard = eligibility.hardBlockerDetails;
  if (row.canonicalType === "fmcsa_compliance") {
    const gate = hard.find(
      (b) =>
        b.id === DISPATCH_BLOCKER_REASON_IDS.fmcsa_not_cleared ||
        b.id === DISPATCH_BLOCKER_REASON_IDS.fmcsa_dispatch_block
    );
    if (gate) return `Dispatch hard gate: ${gate.message}`;
    return "Does not currently hard-block dispatch; treat as a compliance file item.";
  }
  if (row.canonicalType === "cdl") {
    const gate = hard.find(
      (b) =>
        b.id === DISPATCH_BLOCKER_REASON_IDS.cdl_expired || b.id === DISPATCH_BLOCKER_REASON_IDS.cdl_missing
    );
    if (gate) return `Dispatch hard gate: ${gate.message}`;
    return "CDL is not a current dispatch hard gate for this driver.";
  }
  if (row.canonicalType === "medical_card") {
    const gate = hard.find(
      (b) =>
        b.id === DISPATCH_BLOCKER_REASON_IDS.medical_card_expired ||
        b.id === DISPATCH_BLOCKER_REASON_IDS.medical_card_missing
    );
    if (gate) return `Dispatch hard gate: ${gate.message}`;
    if (row.status === "expiring_soon") {
      return "Does not hard-block dispatch today. If not renewed, it can become a medical hard gate.";
    }
    return "Medical card is not a current dispatch hard gate for this driver.";
  }
  if (eligibility.status === "blocked") {
    return `Driver dispatch status is blocked (${eligibility.label}). This document is not the listed hard gate unless named there.`;
  }
  if (eligibility.status === "needs_review") {
    return `Driver dispatch status is Needs Review: ${eligibility.label}`;
  }
  return "No dispatch hard gate from this document on the current eligibility result.";
}

function matchingDemoOverride(
  data: BofData,
  driverId: string,
  row: DriverDqfDocumentRow
): DriverOperatingIssuePath["responseRecorded"] | undefined {
  const rec = data.driverDispatchBlockerOverrides?.[driverId];
  if (!rec?.resolvedReasonIds?.length) return undefined;
  const want: string[] = [];
  if (row.canonicalType === "fmcsa_compliance") {
    want.push(DISPATCH_BLOCKER_REASON_IDS.fmcsa_not_cleared, DISPATCH_BLOCKER_REASON_IDS.fmcsa_dispatch_block);
  }
  if (row.canonicalType === "cdl") {
    want.push(DISPATCH_BLOCKER_REASON_IDS.cdl_expired, DISPATCH_BLOCKER_REASON_IDS.cdl_missing);
  }
  if (row.canonicalType === "medical_card") {
    want.push(DISPATCH_BLOCKER_REASON_IDS.medical_card_expired, DISPATCH_BLOCKER_REASON_IDS.medical_card_missing);
  }
  if (!want.some((id) => rec.resolvedReasonIds.includes(id))) return undefined;
  return {
    kind: "demo_hard_gate_acknowledge",
    action: rec.note?.trim() || "Demo hard-gate acknowledgement (session override)",
    by: rec.resolvedBy,
    at: rec.resolvedAt,
  };
}

function toPath(
  data: BofData,
  driverId: string,
  driverName: string,
  row: DriverDqfDocumentRow,
  eligibility: ReturnType<typeof getDriverDispatchEligibility>
): DriverOperatingIssuePath | null {
  if (row.status !== "expired" && row.status !== "expiring_soon" && row.status !== "missing") return null;
  if (row.optionalForReadiness && row.status === "missing") return null;
  if (row.group !== "core_dqf") return null;

  const responseRecorded = matchingDemoOverride(data, driverId, row);
  const fileOnRecord = Boolean(row.fileUrl?.trim());

  return {
    id: `op-issue:${driverId}:${row.canonicalType}:${row.status}`,
    problem: `${row.label} is ${row.status.replace(/_/g, " ")}`,
    recordName: row.label,
    documentType: row.canonicalType,
    driverId,
    driverName,
    status: row.status,
    expirationDate: row.expirationDate ?? row.reviewDate,
    fileOnRecord,
    evidenceHref: row.fileUrl ?? row.actionHref,
    cause: causeForRow(row),
    requiredCorrection: correctionForRow(row),
    owner: ownerForRow(row),
    authorityToChange: AUTHORITY,
    exceptionCapability: EXCEPTION_GAP,
    responseCapability: responseRecorded
      ? "A demo hard-gate acknowledgement is on this session. That is acknowledged, not corrected or exception-approved."
      : "No production response record exists for this item. Driver hub can demo-acknowledge a matching dispatch hard gate; that does not update the source date.",
    responseRecorded,
    dispatchImpact: dispatchImpactForRow(row, eligibility),
    dqfImpact:
      row.status === "expired" || row.status === "missing"
        ? "Counts toward DQF action-required for core qualification documents."
        : "Counts toward DQF needs-review (expiring soon).",
    nextStep: row.actionLabel
      ? `${row.actionLabel}. Then reload so helpers recheck the source record.`
      : "Open the named file or vault row, complete the correction, then reload this screen.",
    recheck: RECHECK,
    actionHref: row.actionHref ?? row.fileUrl ?? `/drivers/${driverId}/vault`,
    actionLabel: row.actionLabel ?? (fileOnRecord ? "Open document" : "Open vault"),
  };
}

/** Named expired / expiring / missing core DQF items with the operating path — not a second readiness engine. */
export function getDriverOperatingIssuePaths(data: BofData, driverId: string): DriverOperatingIssuePath[] {
  const driver = getDriverById(data, driverId);
  const driverName = driver?.name ?? driverId;
  const dqf = getDriverDqfReadinessSummary(data, driverId);
  const eligibility = getDriverDispatchEligibility(data, driverId);

  const rank = (s: DriverOperatingIssueStatus) => (s === "expired" ? 0 : s === "missing" ? 1 : 2);
  return dqf.documents
    .map((row) => toPath(data, driverId, driverName, row, eligibility))
    .filter((row): row is DriverOperatingIssuePath => row != null)
    .sort((a, b) => rank(a.status) - rank(b.status) || a.recordName.localeCompare(b.recordName));
}
