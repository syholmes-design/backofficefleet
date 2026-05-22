"use client";

import { useMemo } from "react";
import { useDispatchDashboardStore } from "@/lib/stores/dispatch-dashboard-store";
import { driverNameById } from "@/lib/dispatch-dashboard-seed";
import { proofChipClass, sealChipClass } from "./dispatch-ui";

export function ExceptionViewScreen() {
  const loads = useDispatchDashboardStore((s) => s.loads);
  const drivers = useDispatchDashboardStore((s) => s.drivers);
  const openDrawer = useDispatchDashboardStore((s) => s.openLoadDrawer);

  const rows = useMemo(
    () =>
      loads.filter(
        (l) => l.status === "Exception" || l.exception_flag === true
      ),
    [loads]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">
      <header>
        <h1 className="text-lg font-semibold text-white">Exception view</h1>
        <p className="mt-1 text-sm text-slate-400">
          Loads in <strong>Exception</strong> status or with{" "}
          <strong>exception_flag</strong> set.
        </p>
      </header>

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="min-w-[960px] w-full border-collapse text-left text-sm">
          <thead className="bg-slate-900/95 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">
                Load ID
              </th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">
                Customer
              </th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">
                Driver
              </th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">
                Exception reason
              </th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">
                Seal
              </th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">
                Proof
              </th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">
                Insurance claim
              </th>
            </tr>
          </thead>
          <tbody className="text-slate-200">
            {rows.map((l) => (
              <tr
                key={l.load_id}
                className="cursor-pointer border-b border-slate-800/80 hover:bg-slate-900/80"
                onClick={() => openDrawer(l.load_id)}
              >
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-teal-300">
                  {l.load_id}
                </td>
                <td className="max-w-[200px] truncate px-3 py-2 text-xs">
                  {l.customer_name}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-xs">
                  {driverNameById(drivers, l.driver_id)}
                </td>
                <td className="max-w-[280px] px-3 py-2 text-xs text-slate-300">
                  {l.exception_reason ?? "—"}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={[
                      "inline-flex rounded px-2 py-0.5 text-[11px] font-medium",
                      sealChipClass(l.seal_status),
                    ].join(" ")}
                  >
                    {l.seal_status}
                  </span>
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
                <td className="px-3 py-2 text-xs">
                  {l.insurance_claim_needed ? (
                    <span className="font-medium text-amber-300">Yes</span>
                  ) : (
                    <span className="text-slate-500">No</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length === 0 && (
        <p className="text-sm text-slate-500">No exception rows in the mock set.</p>
      )}
    </div>
  );
}
