"use client";

import Link from "next/link";
import { LiveOperatingSpinePanel, useLiveOperatingSpine } from "@/components/operations/LiveOperatingSpinePanel";

export function SettlementsPayrollPageClient() {
  const { spine, error, loading } = useLiveOperatingSpine();
  const holds = spine?.heldSettlements ?? [];

  return (
    <div className="bof-settlements-payroll-wrap min-h-0 px-4 pb-8">
      <div className="pt-3">
        <LiveOperatingSpinePanel title="LIVE settlement holds from proof rejection" />
      </div>
      <header className="mt-6 rounded-xl border border-emerald-500/30 bg-slate-950/80 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">LIVE settlements</p>
        <h1 className="mt-2 text-2xl font-black text-white">Prisma settlement status</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          Authoritative settlement status is Prisma <code className="text-emerald-200">Settlement.status</code>.
          Production this page does not display workbook payroll Hold/review. Planning workbook remains at{" "}
          <Link className="text-amber-200 underline" href="/settlements/workbook">
            /settlements/workbook
          </Link>{" "}
          and{" "}
          <Link className="text-amber-200 underline" href="/demo/settlements">
            /demo/settlements
          </Link>
          .
        </p>
      </header>
      {loading ? <p className="mt-4 text-sm text-slate-400">Loading LIVE holds…</p> : null}
      {error ? <p className="mt-4 text-sm text-amber-200">{error}</p> : null}
      <section className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
        <table className="min-w-full text-left text-sm text-slate-100">
          <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Settlement id</th>
              <th className="px-3 py-2">Load</th>
              <th className="px-3 py-2">LIVE status</th>
              <th className="px-3 py-2">Hold reason</th>
            </tr>
          </thead>
          <tbody>
            {holds.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-slate-400" colSpan={4}>
                  No LIVE HELD settlements in this operator scope.
                </td>
              </tr>
            ) : (
              holds.map((hold) => (
                <tr key={hold.id} className="border-t border-slate-800">
                  <td className="px-3 py-2 font-mono text-xs">{hold.id}</td>
                  <td className="px-3 py-2">
                    <Link className="text-teal-200 underline" href={`/trip-release/${hold.loadId}`}>
                      {hold.loadId}
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-semibold">{hold.status}</td>
                  <td className="px-3 py-2 text-slate-300">{hold.holdReason || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
