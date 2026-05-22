"use client";

import { useDispatchDashboardStore } from "@/lib/stores/dispatch-dashboard-store";
import { driverNameById } from "@/lib/dispatch-dashboard-seed";
import { formatMoney, proofChipClass } from "./dispatch-ui";

export function SettlementReadinessScreen() {
  const loads = useDispatchDashboardStore((s) => s.loads);
  const drivers = useDispatchDashboardStore((s) => s.drivers);
  const openDrawer = useDispatchDashboardStore((s) => s.openLoadDrawer);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">
      <header>
        <h1 className="text-lg font-semibold text-white">Settlement readiness</h1>
        <p className="mt-1 text-sm text-slate-400">
          Finance view — highlights proof gaps and settlement holds.
        </p>
      </header>

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="min-w-[900px] w-full border-collapse text-left text-sm">
          <thead className="bg-slate-900/95 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">
                Load ID
              </th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">
                Driver
              </th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">
                Customer
              </th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">
                Total pay
              </th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">
                Proof
              </th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">
                Hold
              </th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">
                Hold reason
              </th>
            </tr>
          </thead>
          <tbody>
            {loads.map((l) => {
              const risk = l.settlement_hold || l.proof_status !== "Complete";
              return (
                <tr
                  key={l.load_id}
                  onClick={() => openDrawer(l.load_id)}
                  className={[
                    "cursor-pointer border-b border-slate-800/80 hover:bg-slate-900/80",
                    risk ? "bg-red-950/25" : "",
                  ].join(" ")}
                >
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-teal-300">
                    {l.load_id}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs">
                    {driverNameById(drivers, l.driver_id)}
                  </td>
                  <td className="max-w-[220px] truncate px-3 py-2 text-xs text-slate-300">
                    {l.customer_name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs font-medium text-teal-200">
                    {formatMoney(l.total_pay)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={[
                        "inline-flex rounded px-2 py-0.5 text-[11px] font-medium",
                        proofChipClass(l.proof_status),
                      ].join(" ")}
                    >
                      {l.proof_status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-xs font-medium">
                    {l.settlement_hold ? (
                      <span className="text-red-300">Yes</span>
                    ) : (
                      <span className="text-slate-500">No</span>
                    )}
                  </td>
                  <td className="max-w-[280px] px-3 py-2 text-xs text-slate-400">
                    {l.settlement_hold_reason ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
