"use client";

import { useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { useSettlementsPayrollStore, countByStatus, sumNetPendingExport } from "@/lib/stores/settlements-payroll-store";
import type { Settlement } from "@/types/settlements-payroll";
import { formatPayrollCurrency, settlementStatusChipClass } from "./settlements-payroll-ui";
import { BofAdvantageCard, BofAdvantageStrip } from "@/components/bof-advantage/BofAdvantageCard";

export function SettlementsDashboardScreen() {
  const settlements = useSettlementsPayrollStore((s) => s.settlements);
  const openDrawer = useSettlementsPayrollStore((s) => s.openDrawer);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [driverQ, setDriverQ] = useState("");
  const [statusF, setStatusF] = useState<"" | Settlement["status"]>("");
  const [holdOnly, setHoldOnly] = useState(false);

  const kpis = useMemo(
    () => ({
      draft: countByStatus(settlements, "Draft"),
      ready: countByStatus(settlements, "Ready for Export"),
      exported: countByStatus(settlements, "Exported"),
      onHold: settlements.filter((s) => s.settlement_hold).length,
      netPending: sumNetPendingExport(settlements),
    }),
    [settlements]
  );

  const filtered = useMemo(() => {
    return settlements.filter((s) => {
      if (driverQ) {
        const q = driverQ.toLowerCase();
        if (
          !s.driver_name.toLowerCase().includes(q) &&
          !s.driver_id.toLowerCase().includes(q)
        )
          return false;
      }
      if (statusF && s.status !== statusF) return false;
      if (holdOnly && !s.settlement_hold) return false;
      if (dateFrom && s.period_end < dateFrom) return false;
      if (dateTo && s.period_start > dateTo) return false;
      return true;
    });
  }, [settlements, driverQ, statusF, holdOnly, dateFrom, dateTo]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 p-5">
      <header>
        <h1 className="text-lg font-semibold tracking-tight text-white">
          Settlements dashboard
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">
          Rows derived from <span className="font-mono text-slate-300">demo-data.json</span>{" "}
          Payroll_Clean merge. Net pay is recomputed from settlement lines (gross −
          deductions). Open a row for line detail and export rules.
        </p>
      </header>

      <BofAdvantageStrip>
        <BofAdvantageCard
          eyebrow="Settlement acceleration"
          title="Proof-linked readiness for export"
          subtitle="Demo store — status counts from merged payroll rows"
          value={`${kpis.ready} settlement(s) in Ready for Export`}
          delta={
            kpis.onHold
              ? `${kpis.onHold} on hold — complete packets clear most demo holds faster`
              : "No settlement holds flagged on this snapshot"
          }
          explanation="Ready / hold counts are BOF-backed from the settlements store. Acceleration hours are illustrative until proof-to-pay timestamps exist."
          tone={kpis.onHold ? "caution" : "positive"}
        />
        <BofAdvantageCard
          eyebrow="Admin Time Reduced"
          title="Complete packet handling"
          subtitle="Illustrative back-office minutes avoided per ready settlement"
          value={`~${Math.max(15, Math.round(kpis.ready * 22 + kpis.draft * 6))} min demo equivalent / week`}
          delta={`${kpis.draft} still in Draft — tighter proof linkage reduces rework loops`}
          explanation="Minute estimate is a labeled demo placeholder; wire to export queue + document completion events for production."
          tone="neutral"
        />
      </BofAdvantageStrip>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Kpi label="Draft" value={kpis.draft} />
        <Kpi label="Ready for export" value={kpis.ready} />
        <Kpi label="Exported" value={kpis.exported} />
        <Kpi label="On hold" value={kpis.onHold} />
        <Kpi label="Net pay pending (non-exported)" value={formatPayrollCurrency(kpis.netPending)} />
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
        <div className="mb-3 flex items-center gap-2 text-slate-300">
          <Filter className="h-4 w-4 text-teal-500" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Filters
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-xs text-slate-500">
            Period start ≥
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-500">
            Period end ≤
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-500">
            Driver
            <input
              value={driverQ}
              onChange={(e) => setDriverQ(e.target.value)}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
              placeholder="Name or DRV-…"
            />
          </label>
          <label className="text-xs text-slate-500">
            Status
            <select
              value={statusF}
              onChange={(e) =>
                setStatusF((e.target.value || "") as "" | Settlement["status"])
              }
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
            >
              <option value="">All</option>
              <option value="Draft">Draft</option>
              <option value="Ready for Export">Ready for Export</option>
              <option value="Exported">Exported</option>
            </select>
          </label>
          <label className="flex cursor-pointer items-end gap-2 pb-1 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={holdOnly}
              onChange={(e) => setHoldOnly(e.target.checked)}
              className="rounded border-slate-600"
            />
            Settlement hold only
          </label>
        </div>
      </section>

      <div className="overflow-x-auto rounded-lg border border-slate-800">
        <table className="w-full min-w-[960px] border-collapse text-left text-sm">
          <thead className="bg-slate-900/95 text-[10px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">
                Settlement ID
              </th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">
                Driver
              </th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">Period</th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium text-right">
                Gross
              </th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium text-right">
                Deductions
              </th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium text-right">
                Net
              </th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">Status</th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">Hold</th>
            </tr>
          </thead>
          <tbody className="text-slate-200">
            {filtered.map((s) => (
              <tr
                key={s.settlement_id}
                className="cursor-pointer border-b border-slate-800/80 hover:bg-slate-900/80"
                onClick={() => openDrawer(s.settlement_id)}
              >
                <td className="px-3 py-2 font-mono text-xs text-teal-300">
                  {s.settlement_id}
                </td>
                <td className="px-3 py-2 text-xs">
                  <div className="font-medium text-slate-100">{s.driver_name}</div>
                  <div className="font-mono text-[10px] text-slate-500">{s.driver_id}</div>
                </td>
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-400">
                  {s.period_start} → {s.period_end}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs">
                  {formatPayrollCurrency(s.total_gross_pay)}
                </td>
                <td className="px-3 py-2 text-right font-mono text-xs">
                  {formatPayrollCurrency(s.total_deductions)}
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
                <td className="px-3 py-2 text-xs">
                  {s.settlement_hold ? (
                    <span className="font-medium text-red-300">Hold</span>
                  ) : (
                    <span className="text-slate-600">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}
