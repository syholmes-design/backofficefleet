import type { SambaTemporalLabel } from "@/lib/services/samba/types";

/** Presentation buckets only. Not a cache TTL or operational policy. */
const CURRENT_MS = 24 * 60 * 60 * 1000;
const RECENT_MS = 7 * 24 * 60 * 60 * 1000;

export function sambaTemporalLabel(timestamp: Date | string | null | undefined, freshness?: string | null): SambaTemporalLabel {
  if (freshness === "STALE") return "STALE";
  if (freshness === "UNAVAILABLE") return "UNAVAILABLE";
  if (!timestamp) return "UNAVAILABLE";
  const ms = typeof timestamp === "string" ? Date.parse(timestamp) : timestamp.getTime();
  if (!Number.isFinite(ms)) return "UNAVAILABLE";
  const age = Date.now() - ms;
  if (age <= CURRENT_MS) return "CURRENT";
  if (age <= RECENT_MS) return "RECENT";
  return "HISTORICAL";
}
