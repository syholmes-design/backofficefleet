import { auth } from "@/auth";
import { FleetVisibilityMapClient } from "@/components/fleet-visibility/FleetVisibilityMapClient";
import { resolveContext } from "@/lib/services/contextResolver";
import { getPrimaryFleetId, type SessionWithMemberships } from "@/lib/session-fleet";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Fleet Map | BOF",
  description: "Unified fleet visibility from persisted GPS observations",
};

export default async function FleetMapPage() {
  const session = (await auth()) as SessionWithMemberships;
  const context = await resolveContext(session?.user ?? null);
  const fleetId = context.employmentContexts[0]?.fleetId ?? getPrimaryFleetId(session);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 px-6 py-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-500">UOS · Fleet visibility</p>
            <h1 className="text-xl font-semibold">Unified fleet map</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Live and last-known positions from the normalized GPS integration layer. Demo dispatch route interpolation is not shown here.
            </p>
          </div>
          <Link href="/dispatch" className="text-sm text-teal-400 hover:underline">
            ← Dispatch
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-6">
        {fleetId ? (
          <FleetVisibilityMapClient fleetId={fleetId} />
        ) : (
          <p className="text-sm text-amber-200">Select a fleet context to view authorized vehicles.</p>
        )}
      </main>
    </div>
  );
}
