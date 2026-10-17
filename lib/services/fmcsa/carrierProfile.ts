import { normalizeUsdot, unwrapQcMobileCarrier } from "@/lib/services/fmcsa/normalize";

/**
 * Source-neutral FMCSA carrier profile used for compliance monitoring.
 * Built from QCMobile (live lookup) or FMCSA open data (bulk sync), so the
 * same change detection runs whichever source is configured.
 *
 * Every field is nullable: a missing value means "source did not say",
 * never "false". Monitoring must not raise alerts from absent data.
 */
export type FmcsaAuthorityStatus = "ACTIVE" | "INACTIVE" | "NONE" | "PENDING" | "REVOKED" | "UNKNOWN";

export type FmcsaCarrierProfile = {
  source: "QCMOBILE" | "OPEN_DATA";
  usdot: string;
  legalName: string | null;
  dbaName: string | null;
  /** FMCSA USDOT status: A (active) / I (inactive), as published. */
  usdotStatus: string | null;
  allowedToOperate: boolean | null;
  outOfServiceDate: string | null;
  commonAuthority: FmcsaAuthorityStatus | null;
  contractAuthority: FmcsaAuthorityStatus | null;
  brokerAuthority: FmcsaAuthorityStatus | null;
  bipdInsuranceOnFileUsd: number | null;
  bipdInsuranceRequiredUsd: number | null;
  safetyRating: string | null;
  safetyRatingDate: string | null;
  powerUnits: number | null;
  drivers: number | null;
  /** Date of the carrier's last MCS-150 biennial update (ISO yyyy-mm-dd). */
  mcs150Date: string | null;
  mcs150Outdated: boolean | null;
  retrievedAt: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function readText(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

export function readNumber(record: Record<string, unknown>, keys: string[]): number | null {
  const text = readText(record, keys);
  if (text === null) return null;
  const parsed = Number(text.replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseYesNo(value: string | null): boolean | null {
  if (!value) return null;
  const upper = value.toUpperCase();
  if (upper === "Y" || upper === "YES" || upper === "TRUE") return true;
  if (upper === "N" || upper === "NO" || upper === "FALSE") return false;
  return null;
}

/** QCMobile and L&I publish authority as A/I/N (and sometimes words). */
export function parseAuthorityStatus(value: string | null): FmcsaAuthorityStatus | null {
  if (!value) return null;
  const upper = value.trim().toUpperCase();
  if (upper === "A" || upper === "ACTIVE") return "ACTIVE";
  if (upper === "I" || upper === "INACTIVE") return "INACTIVE";
  if (upper === "N" || upper === "NONE") return "NONE";
  if (upper === "P" || upper === "PENDING") return "PENDING";
  if (upper === "R" || upper === "REVOKED") return "REVOKED";
  return "UNKNOWN";
}

/** Accepts ISO, yyyymmdd, mm/dd/yyyy and Socrata floating timestamps. */
export function toIsoDate(value: string | null): string | null {
  if (!value) return null;
  const text = value.trim();
  let match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  match = /^(\d{4})(\d{2})(\d{2})$/.exec(text);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
  if (match) return `${match[3]}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`;
  match = /^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/.exec(text);
  if (match) {
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const month = months.indexOf(match[2].toUpperCase());
    if (month < 0) return null;
    const year = match[3].length === 2 ? `20${match[3]}` : match[3];
    return `${year}-${String(month + 1).padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  }
  return null;
}

/**
 * QCMobile carrier element names follow the developer site's "API elements"
 * page. Names not confirmed against a live response are read with aliases.
 * QCMobile reports insurance amounts in thousands of dollars.
 */
export function qcMobileCarrierProfile(payload: unknown, retrievedAt: Date): FmcsaCarrierProfile | null {
  const carrier = unwrapQcMobileCarrier(payload);
  if (!isRecord(carrier)) return null;
  const usdot = normalizeUsdot(readText(carrier, ["dotNumber"]));
  if (!usdot) return null;
  const thousands = (keys: string[]) => {
    const value = readNumber(carrier, keys);
    return value === null ? null : value * 1000;
  };
  return {
    source: "QCMOBILE",
    usdot,
    legalName: readText(carrier, ["legalName"]),
    dbaName: readText(carrier, ["dbaName"]),
    usdotStatus: readText(carrier, ["statusCode"]),
    allowedToOperate: parseYesNo(readText(carrier, ["allowedToOperate", "allowToOperate"])),
    outOfServiceDate: toIsoDate(readText(carrier, ["oosDate", "outOfServiceDate"])),
    commonAuthority: parseAuthorityStatus(readText(carrier, ["commonAuthorityStatus"])),
    contractAuthority: parseAuthorityStatus(readText(carrier, ["contractAuthorityStatus"])),
    brokerAuthority: parseAuthorityStatus(readText(carrier, ["brokerAuthorityStatus"])),
    bipdInsuranceOnFileUsd: thousands(["bipdInsuranceOnFile"]),
    bipdInsuranceRequiredUsd: thousands(["bipdRequiredAmount"]),
    safetyRating: readText(carrier, ["safetyRating"]),
    safetyRatingDate: toIsoDate(readText(carrier, ["safetyRatingDate"])),
    powerUnits: readNumber(carrier, ["totalPowerUnits"]),
    drivers: readNumber(carrier, ["totalDrivers"]),
    mcs150Date: null,
    mcs150Outdated: parseYesNo(readText(carrier, ["mcs150Outdated"])),
    retrievedAt: retrievedAt.toISOString(),
  };
}
