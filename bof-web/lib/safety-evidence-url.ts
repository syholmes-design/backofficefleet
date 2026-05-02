/**
 * Resolves demo safety violation stills under `/evidence/safety/*`.
 * DRV-004 / DRV-008 demo stills ship as PNG crops; legacy `.png` → `.svg` swap applies only when both paths are listed.
 * Legacy `.png` URLs that map to an existing `.svg` still resolve to the SVG.
 */

export type ResolvedSafetyEvidenceUrl = {
  /** Use in `src` / `href` when `ready` */
  url: string | null;
  /** True when a file committed under `public/evidence/safety/` backs this URL */
  ready: boolean;
};

/** Canonical public paths that ship with the repo (must match files on disk). */
export const SAFETY_EVIDENCE_PUBLIC_PATHS: readonly string[] = [
  "/evidence/safety/b102-tires-irregular-wear.png",
  "/evidence/safety/pre-trip-tire-tread-depth.png",
  "/evidence/safety/cargo-damage-punctured-box.png",
  "/evidence/safety/safety-equipment-fire-extinguisher-tag.png",
  "/evidence/safety/l405-hos-eld-violation.png",
  "/evidence/safety/logbook-review-reset-violation.png",
  "/evidence/safety/trailer-brake-lining-worn.png",
  "/evidence/safety/cargo-damage-wrapped-pallet.png",
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
