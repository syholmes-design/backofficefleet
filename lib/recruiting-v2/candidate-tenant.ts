import type { Prisma } from "@prisma/client";

/** The fleet recorded on a candidate, or null when none is recorded. */
export function candidateTenantFleetId(applicationSummary: Prisma.JsonValue): string | null {
  if (!applicationSummary || typeof applicationSummary !== "object" || Array.isArray(applicationSummary)) return null;
  const summary = applicationSummary as Record<string, unknown>;
  for (const key of ["tenant", "recruitingV2DriverHandoff"]) {
    const value = summary[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const fleetId = (value as Record<string, unknown>).fleetId;
      if (typeof fleetId === "string" && fleetId.trim()) return fleetId.trim();
    }
  }
  return null;
}
