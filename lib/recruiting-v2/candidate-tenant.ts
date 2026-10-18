import type { Prisma } from "@prisma/client";

/** The tenant fleet recorded on a candidate (`applicationSummary.tenant.fleetId`), or null when none is recorded. */
export function candidateTenantFleetId(applicationSummary: Prisma.JsonValue): string | null {
  if (!applicationSummary || typeof applicationSummary !== "object" || Array.isArray(applicationSummary)) return null;
  const tenant = (applicationSummary as Record<string, unknown>).tenant;
  if (!tenant || typeof tenant !== "object" || Array.isArray(tenant)) return null;
  const fleetId = (tenant as Record<string, unknown>).fleetId;
  return typeof fleetId === "string" && fleetId.trim() ? fleetId.trim() : null;
}
