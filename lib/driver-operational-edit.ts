type ComplianceStatus = "VALID" | "EXPIRING_SOON" | "EXPIRED" | "PENDING REVIEW";
export type DocStatusTag = "VALID" | "EXPIRING_SOON" | "EXPIRED" | "PENDING REVIEW";

const DAY_MS = 86400000;

function parseDate(raw: string | null | undefined): Date | null {
  if (!raw?.trim()) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function daysUntil(raw: string | null | undefined): number | null {
  const d = parseDate(raw);
  if (!d) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / DAY_MS);
}

/**
 * Derives a document status from an expiration date only.
 * Missing / unparsable dates are **not** treated as expired (avoids wiping good credentials in the demo).
 */
export function deriveDocStatusFromExpiration(
  expirationDate: string | null | undefined
): DocStatusTag {
  const days = daysUntil(expirationDate);
  if (days == null) return "PENDING REVIEW";
  if (days < 0) return "EXPIRED";
  if (days <= 60) return "EXPIRING_SOON";
  return "VALID";
}

export function deriveComplianceStatusFromDates({
  cdlExpirationDate,
  medCardExpirationDate,
}: {
  cdlExpirationDate: string | null | undefined;
  medCardExpirationDate: string | null | undefined;
}): ComplianceStatus {
  const cdlStatus = deriveDocStatusFromExpiration(cdlExpirationDate);
  const medStatus = deriveDocStatusFromExpiration(medCardExpirationDate);
  if (cdlStatus === "EXPIRED" || medStatus === "EXPIRED") return "EXPIRED";
  if (cdlStatus === "EXPIRING_SOON" || medStatus === "EXPIRING_SOON") return "EXPIRING_SOON";
  if (cdlStatus === "PENDING REVIEW" || medStatus === "PENDING REVIEW") return "PENDING REVIEW";
  return "VALID";
}
