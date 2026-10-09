"use client";

import Link from "next/link";
import { useLiveOperatingSpine } from "@/components/operations/LiveOperatingSpinePanel";

export function SettlementsPayrollPageClient() {
  const { spine, error, loading, refresh } = useLiveOperatingSpine();
  const holds = spine?.heldSettlements ?? [];

  return (
    <div className="bof-settlements-payroll-wrap min-h-0 px-4 pb-8">
      <header className="mt-6 rounded-xl border border-emerald-500/30 bg-slate-950/80 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Settlements</p>
        <h1 className="mt-2 text-2xl font-black text-white">Settlement holds</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          These holds are recorded when proof on a load is rejected. This page is not live payroll.
          Driver-week payroll planning stays in the{" "}
          <Link className="text-amber-200 underline" href="/demo/settlements">
            training payroll workbook
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="mt-4 rounded border border-emerald-500/50 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-950"
        >
          Refresh
        </button>
      </header>
      {loading ? <p className="mt-4 text-sm text-slate-400">Loading settlement holds…</p> : null}
      {error ? <p className="mt-4 text-sm text-amber-200">{error}</p> : null}
      <section className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
        <table className="min-w-full text-left text-sm text-slate-100">
          <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Hold</th>
              <th className="px-3 py-2">Load</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Reason</th>
            </tr>
          </thead>
          <tbody>
            {holds.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-slate-400" colSpan={4}>
                  No settlement holds in your fleet.
                </td>
              </tr>
            ) : (
              holds.map((hold) => (
                <tr key={hold.id} className="border-t border-slate-800">
                  <td className="px-3 py-2 font-mono text-xs">{hold.id.slice(0, 8)}</td>
                  <td className="px-3 py-2">
                    <Link className="text-teal-200 underline" href={`/trip-release/${hold.loadId}`}>
                      Open load
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
