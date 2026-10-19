import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import type { SessionUserLike } from "@/lib/authorization";

export { candidateTenantFleetId } from "@/lib/recruiting-v2/candidate-tenant";

// Scope rules live in candidate-scope.ts (no Next.js imports, so services and tests can use them).
export {
  RECRUITING_FLEET_ROLE_CODES,
  RECRUITING_PLATFORM_ROLE_CODES,
  candidateScopeWhere,
  resolveRecruitingScope,
  type RecruitingScope,
} from "@/lib/recruiting-v2/candidate-scope";
import { candidateScopeWhere, resolveRecruitingScope, type RecruitingScope } from "@/lib/recruiting-v2/candidate-scope";

export type RecruitingCandidateAccess = {
  user: SessionUserLike;
  scope: RecruitingScope;
  /** Unique where for the requested candidate, already restricted to the user's scope. */
  where: Prisma.CandidateWhereUniqueInput;
};

/**
 * Session and tenant gate for /api/recruiting-v2/[...]/[candidateId] routes.
 * Returns a 401 response without a session; otherwise a scoped `where` for candidate queries.
 */
export async function requireRecruitingCandidateAccess(
  candidateCode: string,
): Promise<{ response: NextResponse; access?: undefined } | { response?: undefined; access: RecruitingCandidateAccess }> {
  const session = await auth();
  const user = session?.user as SessionUserLike | undefined;
  if (!user?.id) {
    return { response: NextResponse.json({ error: "Unauthorized", code: "AUTH_REQUIRED" }, { status: 401 }) };
  }
  const scope = await resolveRecruitingScope(user);
  return { access: { user, scope, where: { candidateCode, AND: [candidateScopeWhere(scope)] } } };
}

export function candidateNotFoundResponse() {
  return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
}
