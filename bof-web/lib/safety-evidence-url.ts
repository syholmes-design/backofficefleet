/**
 * Resolves demo safety violation stills under `/evidence/safety/*`.
 * Source JSON may reference legacy `.png` names; committed assets are deterministic SVGs.
 */

export type ResolvedSafetyEvidenceUrl = {
  /** Use in `src` / `href` when `ready` */
  url: string | null;
  /** True when a file committed under `public/evidence/safety/` backs this URL */
  ready: boolean;
};

/** Canonical public paths that ship with the repo (must match files on disk). */
export const SAFETY_EVIDENCE_PUBLIC_PATHS: readonly string[] = [
  "/evidence/safety/p_patel_b102_tire_irregular_wear.svg",
  "/evidence/safety/p_patel_pretrip_tire_tread_depth.svg",
  "/evidence/safety/p_patel_cargo_damage_box_puncture.svg",
  "/evidence/safety/p_patel_safety_equipment_extinguisher.svg",
  "/evidence/safety/l_smith_l405_hos_violation_eld.svg",
  "/evidence/safety/l_smith_logbook_review_violation.svg",
  "/evidence/safety/l_smith_trailer_brake_inspection.svg",
  "/evidence/safety/l_smith_cargo_damage_pallet_wrap.svg",
] as const;

const PATH_SET = new Set<string>(SAFETY_EVIDENCE_PUBLIC_PATHS);

export function isSafetyEvidencePublicPath(url: string): boolean {
  const u = String(url ?? "").trim();
  return u.startsWith("/evidence/safety/");
}

/**
 * @param raw — URL from demo data (e.g. `/evidence/safety/foo.png` or `.svg`)
 */
/** Alias for callers that prefer a “getter” name; resolves by public URL path (demo data). */
export const getSafetyEvidenceUrl = resolveSafetyEvidencePublicUrl;

export function resolveSafetyEvidencePublicUrl(
  raw: string | undefined | null
): ResolvedSafetyEvidenceUrl {
  const u = String(raw ?? "").trim();
  if (!u) return { url: null, ready: false };
  if (!u.startsWith("/evidence/safety/")) {
    return { url: u, ready: true };
  }
  if (PATH_SET.has(u)) return { url: u, ready: true };
  const swapped = u.replace(/\.png$/i, ".svg");
  if (PATH_SET.has(swapped)) return { url: swapped, ready: true };
  return { url: null, ready: false };
}
