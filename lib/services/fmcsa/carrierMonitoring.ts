import type { FmcsaCarrierProfile } from "@/lib/services/fmcsa/carrierProfile";

/**
 * Carrier compliance monitoring: pure rules over FMCSA carrier profiles.
 *
 * evaluateCarrierProfile() raises conditions present in one snapshot.
 * diffCarrierProfiles() raises changes between two snapshots.
 * Neither stops dispatch; findings are evidence for BOF compliance review,
 * consistent with the existing FMCSA verification layer.
 */
export type CarrierAlertSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type CarrierAlertCode =
  | "NOT_ALLOWED_TO_OPERATE"
  | "OUT_OF_SERVICE_ORDER"
  | "USDOT_INACTIVE"
  | "OPERATING_AUTHORITY_INACTIVE"
  | "BIPD_INSURANCE_BELOW_REQUIRED"
  | "UNSATISFACTORY_SAFETY_RATING"
  | "CONDITIONAL_SAFETY_RATING"
  | "MCS150_OUTDATED"
  | "ALLOWED_TO_OPERATE_CHANGED"
  | "AUTHORITY_STATUS_CHANGED"
  | "SAFETY_RATING_CHANGED"
  | "LEGAL_NAME_CHANGED"
  | "POWER_UNITS_CHANGED";

export type CarrierAlert = {
  code: CarrierAlertCode;
  severity: CarrierAlertSeverity;
  usdot: string;
  message: string;
  previous?: string | null;
  current?: string | null;
  source: FmcsaCarrierProfile["source"];
  observedAt: string;
};

export const MCS150_MAX_AGE_DAYS = 730;

function alert(
  profile: FmcsaCarrierProfile,
  code: CarrierAlertCode,
  severity: CarrierAlertSeverity,
  message: string,
  previous?: string | null,
  current?: string | null,
): CarrierAlert {
  const row: CarrierAlert = { code, severity, usdot: profile.usdot, message, source: profile.source, observedAt: profile.retrievedAt };
  if (previous !== undefined) row.previous = previous;
  if (current !== undefined) row.current = current;
  return row;
}

function daysBetween(fromIso: string, to: Date): number {
  return Math.floor((to.getTime() - new Date(`${fromIso}T00:00:00Z`).getTime()) / 86_400_000);
}

/** Conditions that need attention in a single snapshot. */
export function evaluateCarrierProfile(profile: FmcsaCarrierProfile, now: Date = new Date()): CarrierAlert[] {
  const alerts: CarrierAlert[] = [];

  if (profile.allowedToOperate === false) {
    alerts.push(alert(profile, "NOT_ALLOWED_TO_OPERATE", "CRITICAL", "FMCSA reports the carrier is not allowed to operate."));
  }
  if (profile.outOfServiceDate) {
    alerts.push(
      alert(profile, "OUT_OF_SERVICE_ORDER", "CRITICAL", `FMCSA lists an out-of-service date of ${profile.outOfServiceDate}.`, null, profile.outOfServiceDate),
    );
  }
  if (profile.usdotStatus && profile.usdotStatus.toUpperCase() === "I") {
    alerts.push(alert(profile, "USDOT_INACTIVE", "HIGH", "The USDOT number is inactive."));
  }

  // For-hire carriers hold common and/or contract authority. Alert only when the
  // source reports a for-hire authority that is no longer active AND none is
  // active: an old inactive authority alongside an active one (common in the
  // Motus per-authority history) is not a compliance problem.
  const forHire = [
    ["Common", profile.commonAuthority],
    ["Contract", profile.contractAuthority],
  ] as const;
  const anyActive = forHire.some(([, status]) => status === "ACTIVE");
  if (!anyActive) {
    for (const [label, status] of forHire) {
      if (status === "INACTIVE" || status === "REVOKED") {
        alerts.push(alert(profile, "OPERATING_AUTHORITY_INACTIVE", "HIGH", `${label} operating authority is ${status.toLowerCase()}.`, null, status));
      }
    }
  }

  if (
    profile.bipdInsuranceRequiredUsd !== null &&
    profile.bipdInsuranceRequiredUsd > 0 &&
    profile.bipdInsuranceOnFileUsd !== null &&
    profile.bipdInsuranceOnFileUsd < profile.bipdInsuranceRequiredUsd
  ) {
    alerts.push(
      alert(
        profile,
        "BIPD_INSURANCE_BELOW_REQUIRED",
        "HIGH",
        profile.insuranceAmountUnit === "FMCSA_PUBLISHED"
          ? `BI&PD coverage on file (${profile.bipdInsuranceOnFileUsd.toLocaleString("en-US")}) is below the required minimum (${profile.bipdInsuranceRequiredUsd.toLocaleString("en-US")}), as published by FMCSA.`
          : `BIPD liability insurance on file ($${profile.bipdInsuranceOnFileUsd.toLocaleString("en-US")}) is below the required $${profile.bipdInsuranceRequiredUsd.toLocaleString("en-US")}.`,
        String(profile.bipdInsuranceRequiredUsd),
        String(profile.bipdInsuranceOnFileUsd),
      ),
    );
  }

  const rating = profile.safetyRating?.trim().toUpperCase().charAt(0) ?? null;
  if (rating === "U") {
    alerts.push(alert(profile, "UNSATISFACTORY_SAFETY_RATING", "CRITICAL", "FMCSA safety rating is Unsatisfactory.", null, profile.safetyRating));
  } else if (rating === "C") {
    alerts.push(alert(profile, "CONDITIONAL_SAFETY_RATING", "MEDIUM", "FMCSA safety rating is Conditional.", null, profile.safetyRating));
  }

  const mcs150Stale =
    profile.mcs150Outdated === true ||
    (profile.mcs150Date !== null && daysBetween(profile.mcs150Date, now) > MCS150_MAX_AGE_DAYS);
  if (mcs150Stale) {
    alerts.push(
      alert(profile, "MCS150_OUTDATED", "MEDIUM", "The MCS-150 biennial update is overdue.", null, profile.mcs150Date),
    );
  }

  return alerts;
}

/** Changes between two snapshots of the same carrier. */
export function diffCarrierProfiles(previous: FmcsaCarrierProfile, current: FmcsaCarrierProfile): CarrierAlert[] {
  if (previous.usdot !== current.usdot) {
    throw new Error("diffCarrierProfiles requires two snapshots of the same USDOT number");
  }
  const alerts: CarrierAlert[] = [];
  const known = <T>(a: T | null, b: T | null) => a !== null && b !== null;

  if (known(previous.allowedToOperate, current.allowedToOperate) && previous.allowedToOperate !== current.allowedToOperate) {
    alerts.push(
      alert(
        current,
        "ALLOWED_TO_OPERATE_CHANGED",
        current.allowedToOperate ? "LOW" : "CRITICAL",
        current.allowedToOperate ? "Carrier is again allowed to operate." : "Carrier is no longer allowed to operate.",
        String(previous.allowedToOperate),
        String(current.allowedToOperate),
      ),
    );
  }

  for (const [label, before, after] of [
    ["Common", previous.commonAuthority, current.commonAuthority],
    ["Contract", previous.contractAuthority, current.contractAuthority],
    ["Broker", previous.brokerAuthority, current.brokerAuthority],
  ] as const) {
    if (known(before, after) && before !== after) {
      const lost = before === "ACTIVE";
      alerts.push(
        alert(current, "AUTHORITY_STATUS_CHANGED", lost ? "HIGH" : "LOW", `${label} authority changed from ${before} to ${after}.`, before, after),
      );
    }
  }

  if (known(previous.safetyRating, current.safetyRating) && previous.safetyRating !== current.safetyRating) {
    const worse = /^[CU]/i.test(current.safetyRating ?? "");
    alerts.push(
      alert(
        current,
        "SAFETY_RATING_CHANGED",
        worse ? "HIGH" : "LOW",
        `Safety rating changed from ${previous.safetyRating} to ${current.safetyRating}.`,
        previous.safetyRating,
        current.safetyRating,
      ),
    );
  }

  if (known(previous.legalName, current.legalName) && previous.legalName!.toLowerCase() !== current.legalName!.toLowerCase()) {
    alerts.push(
      alert(current, "LEGAL_NAME_CHANGED", "MEDIUM", "The carrier's legal name changed.", previous.legalName, current.legalName),
    );
  }

  if (known(previous.powerUnits, current.powerUnits) && previous.powerUnits! > 0) {
    const change = Math.abs(current.powerUnits! - previous.powerUnits!) / previous.powerUnits!;
    if (change >= 0.5) {
      alerts.push(
        alert(
          current,
          "POWER_UNITS_CHANGED",
          "LOW",
          `Reported power units changed from ${previous.powerUnits} to ${current.powerUnits}.`,
          String(previous.powerUnits),
          String(current.powerUnits),
        ),
      );
    }
  }

  return alerts;
}
