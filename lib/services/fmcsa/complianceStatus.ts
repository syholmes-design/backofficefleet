import { diffCarrierProfiles, evaluateCarrierProfile, type CarrierAlert } from "@/lib/services/fmcsa/carrierMonitoring";
import type { FmcsaCarrierProfile } from "@/lib/services/fmcsa/carrierProfile";
import type { OpenDataCoverage } from "@/lib/services/fmcsa/openData/carrierSync";

/**
 * Derives a fleet's FMCSA compliance status from the evidence of one run.
 *
 * Fail-closed: CLEAR is returned only when at least one source supplied
 * complete, fresh, schema-validated evidence and no source raised an alert.
 * Every other combination (no identity, source down, schema unverified,
 * stale data, carrier not found, required fields missing) is UNVERIFIED,
 * with the reasons listed. Alerts from any source are never suppressed.
 */
export type ComplianceStatus = "CLEAR" | "ATTENTION" | "CRITICAL" | "UNVERIFIED" | "NOT_CONFIGURED";

export type QcMobileEvidence = {
  configured: boolean;
  outcome: "FOUND" | "NOT_FOUND" | "UNAVAILABLE" | "ERROR" | "SKIPPED";
  errorCode?: string | null;
  profile: FmcsaCarrierProfile | null;
  missingElements: string[];
};

export type OpenDataEvidence = {
  /** All three datasets probed: required columns resolved and data fresh. */
  schemaTrusted: boolean;
  schemaIssues: string[];
  coverage: OpenDataCoverage | null;
  profile: FmcsaCarrierProfile | null;
  /** Interpretation gaps (e.g. unrecognized Motus authority values); any gap blocks CLEAR. */
  evidenceIssues?: string[];
};

export type ComplianceInput = {
  usdotNumber: string | null;
  qcmobile: QcMobileEvidence | null;
  openData: OpenDataEvidence | null;
  /** Latest prior complete profiles, for change detection. */
  previous?: { qcmobile?: FmcsaCarrierProfile | null; openData?: FmcsaCarrierProfile | null };
  now?: Date;
};

export type ComplianceDecision = {
  status: ComplianceStatus;
  reasons: string[];
  alerts: CarrierAlert[];
  changeAlerts: CarrierAlert[];
  qcmobileComplete: boolean;
  openDataComplete: boolean;
};

function qcMobileCompleteness(evidence: QcMobileEvidence | null): { complete: boolean; reasons: string[] } {
  if (!evidence || !evidence.configured) return { complete: false, reasons: ["QCMobile is not configured (no webKey)."] };
  if (evidence.outcome === "NOT_FOUND") return { complete: false, reasons: ["QCMobile has no carrier for this USDOT number."] };
  if (evidence.outcome !== "FOUND" || !evidence.profile) {
    return { complete: false, reasons: [`QCMobile lookup did not succeed (${evidence.errorCode ?? evidence.outcome}).`] };
  }
  if (evidence.missingElements.length) {
    return { complete: false, reasons: [`QCMobile response is missing required elements: ${evidence.missingElements.join(", ")}.`] };
  }
  return { complete: true, reasons: [] };
}

function openDataCompleteness(evidence: OpenDataEvidence | null): { complete: boolean; reasons: string[] } {
  if (!evidence) return { complete: false, reasons: ["Open data was not checked."] };
  const reasons: string[] = [];
  if (!evidence.schemaTrusted) {
    reasons.push(`Open-data schemas are not validated: ${evidence.schemaIssues.join("; ") || "validation failed"}.`);
  }
  const coverage = evidence.coverage;
  if (!coverage) reasons.push("Open data returned no coverage for this carrier.");
  else {
    if (coverage.census !== "FOUND") reasons.push(`Company Census: ${coverage.census === "ERROR" ? "query failed" : "carrier not found"}.`);
    if (coverage.motus !== "FOUND") reasons.push(`Motus carrier (authority and insurance): ${coverage.motus === "ERROR" ? "query failed" : "carrier not found"}.`);
    if (coverage.outOfServiceOrders !== "QUERIED") reasons.push("Out-of-service order query failed; absence of an order cannot be confirmed.");
  }
  for (const issue of evidence.evidenceIssues ?? []) reasons.push(`Motus authority/insurance: ${issue}.`);
  const profile = evidence.profile;
  if (profile) {
    if (profile.usdotStatus === null) reasons.push("USDOT status is not reported.");
    else if (profile.usdotStatus.toUpperCase() !== "A") reasons.push(`USDOT status is "${profile.usdotStatus}", not active.`);
    if (profile.commonAuthority === null) reasons.push("Operating authority status is not reported.");
    if (profile.bipdInsuranceRequiredUsd === null || profile.bipdInsuranceOnFileUsd === null) reasons.push("Insurance required/on-file amounts are not reported.");
  } else if (coverage) {
    reasons.push("Open data produced no carrier profile.");
  }
  return { complete: reasons.length === 0, reasons };
}

const SEVERITY_RANK = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 } as const;

export function deriveComplianceStatus(input: ComplianceInput): ComplianceDecision {
  const now = input.now ?? new Date();
  if (!input.usdotNumber) {
    return {
      status: "NOT_CONFIGURED",
      reasons: ["No USDOT number is recorded for this fleet."],
      alerts: [],
      changeAlerts: [],
      qcmobileComplete: false,
      openDataComplete: false,
    };
  }

  const alerts: CarrierAlert[] = [];
  const changeAlerts: CarrierAlert[] = [];
  for (const profile of [input.qcmobile?.profile, input.openData?.profile]) {
    if (profile) alerts.push(...evaluateCarrierProfile(profile, now));
  }
  const pairs: Array<[FmcsaCarrierProfile | null | undefined, FmcsaCarrierProfile | null | undefined]> = [
    [input.previous?.qcmobile, input.qcmobile?.profile],
    [input.previous?.openData, input.openData?.profile],
  ];
  for (const [before, after] of pairs) {
    if (before && after && before.usdot === after.usdot) changeAlerts.push(...diffCarrierProfiles(before, after));
  }

  const qc = qcMobileCompleteness(input.qcmobile);
  const od = openDataCompleteness(input.openData);
  const worst = Math.max(0, ...alerts.map((row) => SEVERITY_RANK[row.severity]), ...changeAlerts.filter((row) => row.severity !== "LOW").map((row) => SEVERITY_RANK[row.severity]));

  const reasons: string[] = [];
  let status: ComplianceStatus;
  if (worst >= SEVERITY_RANK.CRITICAL) {
    status = "CRITICAL";
    reasons.push(...[...alerts, ...changeAlerts].filter((row) => row.severity === "CRITICAL").map((row) => row.message));
  } else if (worst >= SEVERITY_RANK.MEDIUM) {
    status = "ATTENTION";
    reasons.push(...[...alerts, ...changeAlerts].filter((row) => row.severity !== "LOW").map((row) => row.message));
  } else if (qc.complete || od.complete) {
    status = "CLEAR";
    reasons.push(`No alerts from complete ${[qc.complete && "QCMobile", od.complete && "open-data"].filter(Boolean).join(" and ")} evidence.`);
  } else {
    status = "UNVERIFIED";
    reasons.push("No source supplied complete, validated, current evidence.");
  }
  // Evidence gaps are always disclosed, even alongside alerts.
  if (status !== "CLEAR") reasons.push(...qc.reasons, ...od.reasons);

  return { status, reasons: [...new Set(reasons)], alerts, changeAlerts, qcmobileComplete: qc.complete, openDataComplete: od.complete };
}

/** A stored CLEAR older than this is reported as UNVERIFIED (stale). */
export const DEFAULT_RESULT_MAX_AGE_HOURS = 36;

export function resultMaxAgeHours(env: Record<string, string | undefined> = process.env): number {
  const parsed = Number(env.FMCSA_MONITORING_MAX_RESULT_AGE_HOURS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_RESULT_MAX_AGE_HOURS;
}

/** Presentation-time staleness: an old CLEAR is not a current clearance. */
export function effectiveStatus(
  status: ComplianceStatus,
  evaluatedAt: Date,
  now: Date = new Date(),
  maxAgeHours: number = resultMaxAgeHours(),
): { status: ComplianceStatus; stale: boolean } {
  const stale = now.getTime() - evaluatedAt.getTime() > maxAgeHours * 3_600_000;
  if (stale && status === "CLEAR") return { status: "UNVERIFIED", stale };
  return { status, stale };
}
