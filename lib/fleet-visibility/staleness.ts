import { LOCATION_STALE_MS } from "@/lib/fleet-visibility/constants";

export function isLocationStale(observedAt: Date, now = new Date()): boolean {
  return now.getTime() - observedAt.getTime() > LOCATION_STALE_MS;
}

export function locationFreshnessLabel(
  observedAt: Date | null,
  observationKind: "LIVE" | "SYNTHETIC_TEST" | null,
  now = new Date(),
): "LIVE" | "LAST_KNOWN" | "STALE" | "UNAVAILABLE" | "SYNTHETIC_TEST" {
  if (observationKind === "SYNTHETIC_TEST") return "SYNTHETIC_TEST";
  if (!observedAt) return "UNAVAILABLE";
  if (isLocationStale(observedAt, now)) return "STALE";
  const ageMs = now.getTime() - observedAt.getTime();
  if (ageMs <= 5 * 60 * 1000) return "LIVE";
  return "LAST_KNOWN";
}
