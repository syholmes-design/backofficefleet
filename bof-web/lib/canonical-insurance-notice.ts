/** Canonical Delta Advanced Trucking insurance incident notification (demo reference load). */
export const CANONICAL_INSURANCE_NOTICE_URL =
  "/generated/loads/L001/insurance-notification.html";

export const CANONICAL_INSURANCE_NOTICE_LABEL = "Insurance Incident Notification";

const STALE_INSURANCE_NOTICE_PATH =
  /^\/generated\/(?:loads|claims)\/L\d{3}\/(?:insurance-notification|insurance-packet)\.html$/i;

/** Legacy per-load / claims-folder notices — not used as the active insurance link. */
export function isStaleInsuranceNoticePath(url: string | undefined | null): boolean {
  const raw = String(url ?? "").trim();
  if (!raw.length) return false;
  if (raw === CANONICAL_INSURANCE_NOTICE_URL) return false;
  return STALE_INSURANCE_NOTICE_PATH.test(raw);
}

/** Resolves any insurance-notification manifest or href candidate to the canonical notice. */
export function resolveCanonicalInsuranceNoticeUrl(
  candidate?: string | null
): string | undefined {
  const raw = String(candidate ?? "").trim();
  if (!raw.length) return undefined;
  return CANONICAL_INSURANCE_NOTICE_URL;
}
