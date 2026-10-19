import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { SessionUserLike } from "@/lib/authorization";

/**
 * Recruiting V2 tenant isolation.
 *
 * Recruiting V2 tables have no tenant column, so a candidate's owning fleet is recorded in
 * `Candidate.applicationSummary.tenant.fleetId` (activation fills it in when missing). That field
 * alone decides visibility; the activation hand-off fleet does not. Every candidate lookup is filtered
 * in the database query by the fleets the signed-in user may work in:
 *   - BOF platform staff (BOF_OPERATIONS, BOF_COMPLIANCE_REVIEW): every candidate;
 *   - fleet HR/operations staff (FLEET_ADMIN, FLEET_MANAGER, FLEET_OPERATIONS): their fleets;
 *   - active aggregator members: every fleet actively affiliated with their aggregator.
 * Drivers, dispatch-only and invited/inactive memberships get no candidates. A candidate with no
 * recorded fleet is visible to BOF platform staff only. Out-of-scope and unknown candidate codes
 * both return the same 404.
 */
export const RECRUITING_PLATFORM_ROLE_CODES = ["BOF_OPERATIONS", "BOF_COMPLIANCE_REVIEW"] as const;
export const RECRUITING_FLEET_ROLE_CODES = ["FLEET_ADMIN", "FLEET_MANAGER", "FLEET_OPERATIONS"] as const;

export type RecruitingScope = { platform: true; fleetIds: string[] } | { platform: false; fleetIds: string[] };

function activeMemberships(user: SessionUserLike) {
  return (user.memberships ?? []).filter((m) => m.status !== "INACTIVE" && m.status !== "INVITED");
}

export async function resolveRecruitingScope(user: SessionUserLike): Promise<RecruitingScope> {
  const memberships = activeMemberships(user);
  if (memberships.some((m) => (RECRUITING_PLATFORM_ROLE_CODES as readonly string[]).includes(m.roleCode))) {
    return { platform: true, fleetIds: [] };
  }
  const fleetIds = new Set(
    memberships.filter((m) => (RECRUITING_FLEET_ROLE_CODES as readonly string[]).includes(m.roleCode)).map((m) => m.fleetId),
  );
  if (user.id) {
    const aggregatorRows = await prisma.aggregatorMembership.findMany({
      where: { userId: user.id, status: "ACTIVE", aggregator: { status: "ACTIVE" } },
      select: { aggregator: { select: { aggregatorFleets: { where: { status: "ACTIVE" }, select: { fleetId: true } } } } },
    });
    for (const row of aggregatorRows) for (const link of row.aggregator.aggregatorFleets) fleetIds.add(link.fleetId);
  }
  return { platform: false, fleetIds: [...fleetIds] };
}

/** Database filter restricting candidates to the scope. */
export function candidateScopeWhere(scope: RecruitingScope): Prisma.CandidateWhereInput {
  if (scope.platform) return {};
  if (scope.fleetIds.length === 0) return { AND: [{ id: { in: [] } }] };
  return {
    AND: [
      {
        OR: scope.fleetIds.map((fleetId) => ({ applicationSummary: { path: ["tenant", "fleetId"], equals: fleetId } })),
      },
    ],
  };
}
