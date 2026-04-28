"use client";

import { useMemo, useState } from "react";
import { Filter } from "lucide-react";
import { useSettlementsPayrollStore, countByStatus, sumNetPendingExport } from "@/lib/stores/settlements-payroll-store";
import type { Settlement } from "@/types/settlements-payroll";
import { formatPayrollCurrency, settlementStatusChipClass } from "./settlements-payroll-ui";
import { getPayrollMonthlyTrend } from "@/lib/demo-trends";
import {
  getSettlementPeriods,
  getSettlementRowsForPeriod,
  getSettlementSummaryForPeriod,
  type CurrentSettlementRowInput,
} from "@/lib/settlement-periods";

export function SettlementsDashboardScreen() {
  const settlements = useSettlementsPayrollStore((s) => s.settlements);
  const lines = useSettlementsPayrollStore((s) => s.lines);
  const openDrawer = useSettlementsPayrollStore((s) => s.openDrawer);
  const generatedDocs = useSettlementsPayrollStore(
    (s) => s.generatedDocsBySettlementId
  );

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [driverQ, setDriverQ] = useState("");
  const [statusF, setStatusF] = useState<"" | Settlement["status"]>("");
  const [holdOnly, setHoldOnly] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState("current-2026-04-01");

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
  const payrollMonthlyTrend = useMemo(() => getPayrollMonthlyTrend(), []);
  const settlementPeriods = useMemo(() => getSettlementPeriods(), []);
  const selectedPeriod = useMemo(
    () =>
      settlementPeriods.find((p) => p.id === selectedPeriodId) ?? settlementPeriods[0],
    [selectedPeriodId, settlementPeriods]
  );
  const settlementEarningsById = useMemo(() => {
    const out = new Map<
      string,
      { base: number; backhaul: number; safetyBonus: number; gross: number }
    >();
    for (const line of lines) {
      const cur = out.get(line.settlement_id) ?? {
        base: 0,
        backhaul: 0,
        safetyBonus: 0,
        gross: 0,
      };
      if (line.type === "Earnings") {
        cur.gross += line.amount;
        if (line.description === "Base earnings (Payroll_Clean)") cur.base += line.amount;
        else if (line.description.includes("Backhaul pay")) cur.backhaul += line.amount;
        else if (line.description.includes("Safety bonus")) cur.safetyBonus += line.amount;
      }
      out.set(line.settlement_id, cur);
    }
    return out;
  }, [lines]);

  const currentPeriodRows = useMemo<CurrentSettlementRowInput[]>(
    () =>
      settlements.map((s) => ({
        settlementId: s.settlement_id,
        driverId: s.driver_id,
        driverName: s.driver_name,
        status: s.status,
        baseEarnings: settlementEarningsById.get(s.settlement_id)?.base ?? 0,
        grossPay: s.total_gross_pay,
        totalDeductions: s.total_deductions,
        netPay: s.net_pay,
        backhaulPay: settlementEarningsById.get(s.settlement_id)?.backhaul ?? 0,
        safetyBonus: settlementEarningsById.get(s.settlement_id)?.safetyBonus ?? 0,
        fuelReimbursement:
          (s.total_gross_pay - s.total_deductions) !== 0
            ? Math.max(0, s.net_pay - (s.total_gross_pay - s.total_deductions))
            : 0,
      })),
    [settlements, settlementEarningsById]
  );

  const periodRows = useMemo(
    () => getSettlementRowsForPeriod(selectedPeriod.id, currentPeriodRows),
    [selectedPeriod.id, currentPeriodRows]
  );

  const filtered = useMemo(() => {
    return periodRows.filter((s) => {
      if (driverQ) {
        const q = driverQ.toLowerCase();
        if (!s.driverName.toLowerCase().includes(q) && !s.driverId.toLowerCase().includes(q))
          return false;
      }
      if (statusF && s.status !== statusF) return false;
      if (holdOnly && !(s.status === "Pending" || s.status === "On Hold")) return false;
      if (selectedPeriod.isCurrent && dateFrom && "period_end" in s && (s as unknown as Settlement).period_end < dateFrom) return false;
      if (selectedPeriod.isCurrent && dateTo && "period_start" in s && (s as unknown as Settlement).period_start > dateTo) return false;
      return true;
    });
  }, [periodRows, driverQ, statusF, holdOnly, dateFrom, dateTo, selectedPeriod.isCurrent]);

  const periodSummary = useMemo(
    () => getSettlementSummaryForPeriod(filtered),
    [filtered]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 p-5">
      <header>
        <h1 className="text-lg font-semibold tracking-tight text-white">
          Settlements dashboard
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">
          Review driver settlement status, earnings, deductions, backhaul pay,
          safety bonuses, and pending exceptions.
        </p>
      </header>

      <section className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
        <div className="mb-3 flex items-center gap-2 text-slate-300">
          <Filter className="h-4 w-4 text-teal-500" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Filters
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-xs text-slate-500">
            Settlement Period
            <select
              value={selectedPeriod.id}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
            >
              {settlementPeriods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-500">
            Period start ≥
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              disabled={!selectedPeriod.isCurrent}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-500">
            Period end ≤
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              disabled={!selectedPeriod.isCurrent}
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
        <p className="mt-3 text-xs text-slate-500">
          Current period uses workbook settlement detail. Prior periods use demo archive summaries for trend review.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-100">
          Driver settlement table
        </h2>
        {selectedPeriod.isCurrent && currentPeriodRows.length === 0 && (
          <div className="mb-2 rounded border border-rose-900/50 bg-rose-950/20 px-3 py-2 text-xs text-rose-200">
            Settlement workbook rows unavailable.
          </div>
        )}
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full min-w-[960px] border-collapse text-left text-sm">
            <thead className="bg-slate-900/95 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="border-b border-slate-800 px-3 py-2 font-medium">
                  Driver
                </th>
                <th className="border-b border-slate-800 px-3 py-2 font-medium">Driver ID</th>
                {selectedPeriod.isCurrent && (
                  <th className="border-b border-slate-800 px-3 py-2 font-medium">Period</th>
                )}
                {selectedPeriod.isCurrent && (
                  <th className="border-b border-slate-800 px-3 py-2 font-medium text-right">Base</th>
                )}
                <th className="border-b border-slate-800 px-3 py-2 font-medium text-right">Backhaul</th>
                <th className="border-b border-slate-800 px-3 py-2 font-medium text-right">Safety bonus</th>
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
                <th className="border-b border-slate-800 px-3 py-2 font-medium">Settlement ID</th>
                <th className="border-b border-slate-800 px-3 py-2 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="text-slate-200">
              {filtered.map((s) => (
                <tr
                  key={`${selectedPeriod.id}-${s.settlementId}-${s.driverId}`}
                  className={[
                    "border-b border-slate-800/80",
                    selectedPeriod.isCurrent ? "cursor-pointer hover:bg-slate-900/80" : "",
                  ].join(" ")}
                  onClick={() => {
                    if (selectedPeriod.isCurrent) openDrawer(s.settlementId);
                  }}
                >
                  <td className="px-3 py-2 text-xs">
                    <div className="font-medium text-slate-100">{s.driverName}</div>
                  </td>
                  <td className="px-3 py-2 font-mono text-[10px] text-slate-500">
                    {s.driverId}
                  </td>
                  {selectedPeriod.isCurrent && (
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-slate-400">
                      {
                        settlements.find((row) => row.settlement_id === s.settlementId)?.period_start
                      }{" "}
                      →{" "}
                      {
                        settlements.find((row) => row.settlement_id === s.settlementId)?.period_end
                      }
                    </td>
                  )}
                  {selectedPeriod.isCurrent && (
                    <td className="px-3 py-2 text-right font-mono text-xs">
                      {formatPayrollCurrency(
                        settlementEarningsById.get(s.settlementId)?.base ?? 0
                      )}
                    </td>
                  )}
                  <td className="px-3 py-2 text-right font-mono text-xs text-teal-200">
                    {formatPayrollCurrency(s.backhaulPay)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs text-amber-200">
                    {formatPayrollCurrency(s.safetyBonus)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs">
                    {formatPayrollCurrency(s.grossPay)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs">
                    {formatPayrollCurrency(s.totalDeductions)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-xs font-semibold text-teal-200">
                    {formatPayrollCurrency(s.netPay)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={[
                        "inline-flex rounded px-2 py-0.5 text-[11px] font-semibold",
                        s.status === "Pending" || s.status === "On Hold"
                          ? "bg-amber-900/30 text-amber-300 ring-1 ring-amber-700/50"
                          : s.status === "Paid" || s.status === "Exported"
                            ? "bg-teal-900/35 text-teal-300 ring-1 ring-teal-700/50"
                            : settlementStatusChipClass(s.status as Settlement["status"]),
                      ].join(" ")}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-teal-300">
                    {s.settlementId || "—"}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {selectedPeriod.isCurrent ? (
                      generatedDocs[s.settlementId] ? (
                        <div className="mt-1 flex flex-wrap gap-2 text-[10px]">
                          {generatedDocs[s.settlementId]?.summaryUrl && (
                            <a
                              href={generatedDocs[s.settlementId]!.summaryUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bof-link-secondary"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Summary
                            </a>
                          )}
                          {generatedDocs[s.settlementId]?.holdUrl && (
                            <a
                              href={generatedDocs[s.settlementId]!.holdUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bof-link-secondary"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Hold
                            </a>
                          )}
                          {generatedDocs[s.settlementId]?.insuranceUrl && (
                            <a
                              href={generatedDocs[s.settlementId]!.insuranceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bof-link-secondary"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Insurance
                            </a>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">Open settlement</span>
                      )
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                          Archived summary
                        </span>
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                          Export
                        </span>
                        <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-400">
                          View unavailable
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-100">
          Exceptions / pending holds
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Pending / on hold" value={periodSummary.pendingOrOnHold} />
          <Kpi label="Draft" value={kpis.draft} />
          <Kpi label="Ready for export" value={kpis.ready} />
          <Kpi label="Net pay pending" value={formatPayrollCurrency(periodSummary.totalNetPay)} />
        </div>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-100">
          Summary totals
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <Kpi label="Total gross pay" value={formatPayrollCurrency(periodSummary.totalGrossPay)} />
          <Kpi label="Total backhaul pay" value={formatPayrollCurrency(periodSummary.totalBackhaulPay)} />
          <Kpi label="Total safety bonus" value={formatPayrollCurrency(periodSummary.totalSafetyBonus)} />
          <Kpi label="Total deductions" value={formatPayrollCurrency(periodSummary.totalDeductions)} />
          <Kpi label="Total net pay" value={formatPayrollCurrency(periodSummary.totalNetPay)} />
          <Kpi label="Pending / on hold" value={periodSummary.pendingOrOnHold} />
        </div>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-100">
            Historical payroll trends
          </h2>
          <span className="rounded bg-slate-900 px-2 py-0.5 text-[11px] text-slate-400">
            Demo trend data
          </span>
        </div>
        <div className="overflow-x-auto rounded border border-slate-800">
          <table className="w-full min-w-[920px] border-collapse text-left text-xs">
            <thead className="bg-slate-900/90 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="border-b border-slate-800 px-2 py-2 font-medium">Month</th>
                <th className="border-b border-slate-800 px-2 py-2 font-medium">Gross Pay</th>
                <th className="border-b border-slate-800 px-2 py-2 font-medium">Backhaul Pay</th>
                <th className="border-b border-slate-800 px-2 py-2 font-medium">Safety Bonus</th>
                <th className="border-b border-slate-800 px-2 py-2 font-medium">Deductions</th>
                <th className="border-b border-slate-800 px-2 py-2 font-medium">Fuel Reimb.</th>
                <th className="border-b border-slate-800 px-2 py-2 font-medium">Net Pay</th>
              </tr>
            </thead>
            <tbody className="text-slate-200">
              {payrollMonthlyTrend.map((row) => (
                <tr key={row.month} className="border-b border-slate-800/80">
                  <td className="px-2 py-1.5 font-medium text-slate-100">{row.month}</td>
                  <td className="px-2 py-1.5 font-mono text-teal-300">
                    {formatPayrollCurrency(row.grossPay)}
                  </td>
                  <td className="px-2 py-1.5 font-mono text-emerald-300">
                    {formatPayrollCurrency(row.backhaulPay)}
                  </td>
                  <td className="px-2 py-1.5 font-mono text-amber-200">
                    {formatPayrollCurrency(row.safetyBonus)}
                  </td>
                  <td className="px-2 py-1.5 font-mono">
                    {formatPayrollCurrency(row.deductions)}
                  </td>
                  <td className="px-2 py-1.5 font-mono">
                    {formatPayrollCurrency(row.fuelReimbursements)}
                  </td>
                  <td className="px-2 py-1.5 font-mono font-semibold text-teal-200">
                    {formatPayrollCurrency(row.netPay)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-slate-800 bg-slate-900/20 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Source details
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Settlement rows are sourced from the active payroll workbook,
          normalized during build:data, and enriched with BOF safety bonus and
          document/proof status.
        </p>
      </section>

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
