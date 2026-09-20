import type { FmcsaNormalizedCarrier, FmcsaQueryKind } from "@/lib/services/fmcsa/types";

export function digitsOnly(value: string | null | undefined): string | null {
  const digits = String(value ?? "").replace(/\D/g, "");
  return digits.length > 0 ? digits : null;
}

export function normalizeUsdot(value: string | null | undefined): string | null {
  return digitsOnly(value);
}

export function normalizeDocket(value: string | null | undefined): string | null {
  return digitsOnly(value);
}

export function parseQueryKind(kind: string | null | undefined): FmcsaQueryKind | null {
  if (kind === "USDOT" || kind === "DOCKET") return kind;
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

/**
 * Unwrap documented QCMobile envelopes: content.carrier or a carrier object.
 * Unknown keys are ignored. Official element names are preferred, with the
 * community `allowedToOperate` / `phyZipcode` aliases accepted when present.
 */
export function unwrapQcMobileCarrier(payload: unknown): Record<string, unknown> | null {
  if (!isRecord(payload)) return null;
  const content = payload.content;
  if (Array.isArray(content)) {
    const first = content[0];
    if (isRecord(first) && isRecord(first.carrier)) return first.carrier;
    if (isRecord(first) && first.dotNumber != null) return first;
  }
  if (isRecord(content) && isRecord(content.carrier)) return content.carrier;
  if (isRecord(content) && content.dotNumber != null) return content;
  if (payload.dotNumber != null) return payload;
  return null;
}

export function normalizeQcMobileCarrier(payload: unknown): FmcsaNormalizedCarrier | null {
  const carrier = unwrapQcMobileCarrier(payload);
  if (!carrier) return null;
  const usdot = normalizeUsdot(readString(carrier, ["dotNumber"]));
  const legalName = readString(carrier, ["legalName"]);
  const dbaName = readString(carrier, ["dbaName"]);
  const docketNumber = normalizeDocket(readString(carrier, ["mcNumber"]));
  if (!usdot && !legalName && !dbaName && !docketNumber) return null;
  return {
    usdot,
    docketNumber,
    legalName,
    dbaName,
    allowToOperate: readString(carrier, ["allowToOperate", "allowedToOperate"]),
    outOfService: readString(carrier, ["outOfService"]),
    outOfServiceDate: readString(carrier, ["outOfServiceDate"]),
  };
}

export function compareText(bof: string | null | undefined, fmcsa: string | null | undefined): "MATCH" | "MISMATCH" | "UNVERIFIED" | "UNAVAILABLE" {
  const left = bof?.trim().replace(/\s+/g, " ").toLowerCase() || null;
  const right = fmcsa?.trim().replace(/\s+/g, " ").toLowerCase() || null;
  if (!right) return "UNAVAILABLE";
  if (!left) return "UNVERIFIED";
  return left === right ? "MATCH" : "MISMATCH";
}

export function compareIdentifier(bof: string | null | undefined, fmcsa: string | null | undefined): "MATCH" | "MISMATCH" | "UNVERIFIED" | "UNAVAILABLE" {
  const left = digitsOnly(bof);
  const right = digitsOnly(fmcsa);
  if (!right) return "UNAVAILABLE";
  if (!left) return "UNVERIFIED";
  return left === right ? "MATCH" : "MISMATCH";
}

export function compareOperatingStatus(bofAuthorityStatus: string | null | undefined, allowToOperate: string | null | undefined) {
  if (!allowToOperate) return "UNAVAILABLE" as const;
  if (!bofAuthorityStatus) return "UNVERIFIED" as const;
  const allowed = allowToOperate.toUpperCase() === "Y";
  const bofActive = bofAuthorityStatus.toLowerCase() === "active";
  if (allowed && bofActive) return "MATCH" as const;
  if (!allowed && !bofActive) return "MATCH" as const;
  return "MISMATCH" as const;
}
