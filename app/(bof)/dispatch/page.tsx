/**
 * BOF Route Owner:
 * URL: /dispatch
 * Type: DISPATCH
 * Primary component: DispatchPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { Suspense } from "react";
import { auth } from "@/auth";
import { DispatchShell } from "@/components/dispatch/DispatchShell";
import { prisma } from "@/lib/prisma";
import { resolveContext } from "@/lib/services/contextResolver";
import {
  listDriverOperationalSummaries,
  type DriverOperationalSummary,
} from "@/lib/services/driverOperationalReadModelService";
import { getPrimaryFleetId, type SessionWithMemberships } from "@/lib/session-fleet";

export const metadata = {
  title: "Dispatch | BOF",
  description: "Dispatch board, assignments, exceptions, and settlement readiness",
};

export default async function DispatchPage() {
  const session = (await auth()) as SessionWithMemberships;
  const context = await resolveContext(session?.user ?? null);
  const fleetId =
    context.employmentContexts[0]?.fleetId ??
    getPrimaryFleetId(session);
  const driverOperationalSummaries: DriverOperationalSummary[] =
    session?.user?.id && fleetId ? await listDriverOperationalSummaries(session.user, fleetId) : [];
  const drivers = fleetId
    ? await prisma.driver.findMany({
        where: { fleetId },
        orderBy: [{ status: "asc" }, { firstName: "asc" }, { lastName: "asc" }],
        select: {
          id: true,
          fleetId: true,
          firstName: true,
          lastName: true,
          email: true,
          status: true,
        },
      })
    : [];

  return (
    <div className="bof-page bof-dispatch-page-wrap">
      <Suspense
        fallback={
          <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center bg-slate-950 text-sm text-slate-400">
            Loading dispatch...
          </div>
        }
      >
        <DispatchShell fleetId={fleetId} drivers={drivers} driverOperationalSummaries={driverOperationalSummaries} />
      </Suspense>
    </div>
  );
}
