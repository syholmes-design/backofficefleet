"use client";

import { useMemo, useState } from "react";
import { useSettlementsPayrollStore } from "@/lib/stores/settlements-payroll-store";
import { formatPayrollCurrency, settlementStatusChipClass } from "./settlements-payroll-ui";

export function ExportPayrollScreen() {
  const settlements = useSettlementsPayrollStore((s) => s.settlements);
  const exportSelectedToPayroll = useSettlementsPayrollStore(
    (s) => s.exportSelectedToPayroll
  );

  const ready = useMemo(
    () => settlements.filter((s) => s.status === "Ready for Export"),
    [settlements]
  );

  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const allIds = useMemo(() => ready.map((s) => s.settlement_id), [ready]);
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(allIds));
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 p-5">
      <header>
        <h1 className="text-lg font-semibold tracking-tight text-white">
          Export to payroll
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">
          Only settlements in <strong className="text-slate-300">Ready for Export</strong>{" "}
          appear here. Export assigns a batch reference and moves rows to{" "}
          <strong className="text-slate-300">Exported</strong> (demo transition).
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => {
            const ids = [...selected];
            if (ids.length === 0) {
              window.alert("Select at least one settlement.");
              return;
            }
            const batch = exportSelectedToPayroll(ids);
            window.alert(`Exported ${ids.length} settlement(s) as ${batch}`);
            setSelected(new Set());
          }}
          className="rounded border border-teal-600 bg-teal-800/40 px-4 py-2 text-sm font-medium text-teal-50 hover:bg-teal-800/60"
        >
          Export to payroll
        </button>
        <span className="text-xs text-slate-500">
          {selected.size} selected · {ready.length} ready
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead className="bg-slate-900/95 text-[10px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="border-b border-slate-800 px-2 py-2 font-medium w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  disabled={ready.length === 0}
                  aria-label="Select all"
                  className="rounded border-slate-600"
                />
              </th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">
                Settlement ID
              </th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">Driver</th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">Period</th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium text-right">
                Net pay
              </th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {ready.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-6 text-center text-sm text-slate-500"
                >
                  No settlements ready for export. Mark rows as ready from the
                  dashboard detail drawer (holds and line rules must pass).
                </td>
              </tr>
            ) : (
              ready.map((s) => (
                <tr key={s.settlement_id} className="border-b border-slate-800/80">
                  <td className="px-2 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(s.settlement_id)}
                      onChange={() => toggle(s.settlement_id)}
                      className="rounded border-slate-600"
                    />
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-teal-300">
                    {s.settlement_id}
                  </td>
                  <td className="px-3 py-2 text-xs">{s.driver_name}</td>
                  <td className="px-3 py-2 font-mono text-xs text-slate-400">
                    {s.period_start} → {s.period_end}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs font-semibold text-teal-200">
                    {formatPayrollCurrency(s.net_pay)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={[
                        "inline-flex rounded px-2 py-0.5 text-[11px] font-semibold",
                        settlementStatusChipClass(s.status),
                      ].join(" ")}
                    >
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
