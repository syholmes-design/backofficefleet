"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import {
  useSettlementsPayrollStore,
  countByStatus,
  sumNetPendingExport,
} from "@/lib/stores/settlements-payroll-store";
import type { Settlement } from "@/types/settlements-payroll";
import {
  formatPayrollCurrency,
  settlementRowDisplayChipClass,
} from "./settlements-payroll-ui";
import { getPayrollMonthlyTrend } from "@/lib/demo-trends";
import {
  getSettlementPeriods,
  getSettlementRowsForPeriod,
  getSettlementSummaryForPeriod,
  type CurrentSettlementRowInput,
  type SettlementPeriodRow,
} from "@/lib/settlement-periods";

type StatusFilterValue = "" | Settlement["status"] | "Hold / Review";
type AccentFilter = null | "safety" | "backhaul";

function workbookForRow(
  settlements: Settlement[],
  settlementId: string
): Settlement | undefined {
  return settlements.find((x) => x.settlement_id === settlementId);
}

function displayStatusLabel(
  row: SettlementPeriodRow,
  isCurrent: boolean,
  settlements: Settlement[]
): string {
  if (!isCurrent) {
    if (row.status === "Paid") return "Paid";
    if (row.status === "Pending" || row.status === "On Hold") return "Hold / Review";
    return row.status;
  }
  const st = workbookForRow(settlements, row.settlementId);
  if (!st) return row.status;
  if (st.settlement_hold) return "Hold / Review";
  if (st.status === "Exported") return "Exported";
  if (st.status === "Ready for Export") return "Ready for Export";
  return "Draft";
}

function statusChipClassForDisplay(label: string) {
  return settlementRowDisplayChipClass(label);
}

export function SettlementsDashboardScreen() {
  const { data } = useBofDemoData();
  const settlements = useSettlementsPayrollStore((s) => s.settlements);
  const lines = useSettlementsPayrollStore((s) => s.lines);
  const openDrawer = useSettlementsPayrollStore((s) => s.openDrawer);
  const generatedDocs = useSettlementsPayrollStore((s) => s.generatedDocsBySettlementId);

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [driverIdFilter, setDriverIdFilter] = useState("");
  const [statusF, setStatusF] = useState<StatusFilterValue>("");
  const [holdOnly, setHoldOnly] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState("current-2026-04-01");
  const [accentFilter, setAccentFilter] = useState<AccentFilter>(null);
  const [detailCard, setDetailCard] = useState<null | "hold" | "draft" | "ready" | "safety" | "backhaul">(null);

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
  const trendMaxNet = useMemo(
    () => Math.max(...payrollMonthlyTrend.map((r) => r.netPay), 1),
    [payrollMonthlyTrend]
  );

  const settlementPeriods = useMemo(() => getSettlementPeriods(), []);
  const selectedPeriod = useMemo(
    () => settlementPeriods.find((p) => p.id === selectedPeriodId) ?? settlementPeriods[0],
    [selectedPeriodId, settlementPeriods]
  );

  const driverOptions = useMemo(() => {
    return [...data.drivers].sort((a, b) => a.id.localeCompare(b.id));
  }, [data.drivers]);

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
          s.total_gross_pay - s.total_deductions !== 0
            ? Math.max(0, s.net_pay - (s.total_gross_pay - s.total_deductions))
            : 0,
      })),
    [settlements, settlementEarningsById]
  );

  const periodRows = useMemo(
    () => getSettlementRowsForPeriod(selectedPeriod.id, currentPeriodRows),
    [selectedPeriod.id, currentPeriodRows]
  );

  const fullSummary = useMemo(() => getSettlementSummaryForPeriod(periodRows), [periodRows]);
  const fuelTotal = useMemo(
    () => periodRows.reduce((a, r) => a + (r.fuelReimbursement ?? 0), 0),
    [periodRows]
  );

  const filtered = useMemo(() => {
    return periodRows.filter((s) => {
      if (driverIdFilter && s.driverId !== driverIdFilter) return false;

      if (selectedPeriod.isCurrent && dateFrom) {
        const st = workbookForRow(settlements, s.settlementId);
        if (st?.period_end && st.period_end < dateFrom) return false;
      }
      if (selectedPeriod.isCurrent && dateTo) {
        const st = workbookForRow(settlements, s.settlementId);
        if (st?.period_start && st.period_start > dateTo) return false;
      }

      if (accentFilter === "safety" && s.safetyBonus <= 0) return false;
      if (accentFilter === "backhaul" && s.backhaulPay <= 0) return false;

      if (holdOnly) {
        if (selectedPeriod.isCurrent) {
          const st = workbookForRow(settlements, s.settlementId);
          if (!st?.settlement_hold) return false;
        } else if (s.status !== "Pending" && s.status !== "On Hold") return false;
      }

      if (statusF === "Hold / Review") {
        if (selectedPeriod.isCurrent) {
          const st = workbookForRow(settlements, s.settlementId);
          if (!st?.settlement_hold) return false;
        } else if (s.status !== "Pending" && s.status !== "On Hold") return false;
      } else if (statusF) {
        if (statusF === "Exported") {
          if (selectedPeriod.isCurrent) {
            const st = workbookForRow(settlements, s.settlementId);
            if (st?.status !== "Exported") return false;
          } else if (s.status !== "Paid") return false;
        } else if (statusF === "Ready for Export") {
          if (!selectedPeriod.isCurrent) return false;
          const st = workbookForRow(settlements, s.settlementId);
          if (st?.status !== "Ready for Export") return false;
        } else if (statusF === "Draft") {
          if (!selectedPeriod.isCurrent) return false;
          const st = workbookForRow(settlements, s.settlementId);
          if (st?.status !== "Draft" || st.settlement_hold) return false;
        }
      }

      return true;
    });
  }, [
    periodRows,
    driverIdFilter,
    statusF,
    holdOnly,
    dateFrom,
    dateTo,
    selectedPeriod.isCurrent,
    settlements,
    accentFilter,
  ]);

  const periodSummary = useMemo(() => getSettlementSummaryForPeriod(filtered), [filtered]);

  const rowsForDetail = (kind: typeof detailCard) => {
    if (!kind) return [];
    if (kind === "hold") {
      return periodRows.filter((r) => {
        if (selectedPeriod.isCurrent) return workbookForRow(settlements, r.settlementId)?.settlement_hold;
        return r.status === "Pending" || r.status === "On Hold";
      });
    }
    if (kind === "draft") {
      return periodRows.filter((r) => {
        if (!selectedPeriod.isCurrent) return false;
        const st = workbookForRow(settlements, r.settlementId);
        return st?.status === "Draft" && !st.settlement_hold;
      });
    }
    if (kind === "ready") {
      return periodRows.filter((r) => {
        if (!selectedPeriod.isCurrent) return false;
        return workbookForRow(settlements, r.settlementId)?.status === "Ready for Export";
      });
    }
    if (kind === "safety") return periodRows.filter((r) => r.safetyBonus > 0);
    if (kind === "backhaul") return periodRows.filter((r) => r.backhaulPay > 0);
    return [];
  };

  const clearFilters = () => {
    setDriverIdFilter("");
    setStatusF("");
    setHoldOnly(false);
    setDateFrom("");
    setDateTo("");
    setAccentFilter(null);
    setDetailCard(null);
  };

  const hasActiveFilters =
    Boolean(driverIdFilter) ||
    Boolean(statusF) ||
    holdOnly ||
    Boolean(dateFrom) ||
    Boolean(dateTo) ||
    Boolean(accentFilter);

  const scrollTo = (id: string) => {
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="bof-settlements-command flex min-h-0 flex-1 flex-col gap-6 px-4 py-6 text-base sm:px-6 lg:pb-44">
      <section className="relative overflow-hidden rounded-xl border border-teal-900/40 bg-gradient-to-br from-slate-950 via-slate-950 to-teal-950/35 px-5 py-6 sm:px-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-600/12 via-transparent to-transparent" />
        <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-teal-400/90">
          Driver Pay Operations
        </p>
        <h1 className="relative mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Settlement Command Center
        </h1>
        <p className="relative mt-2 max-w-3xl text-sm leading-relaxed text-slate-300 sm:text-base">
          Review driver pay, backhaul recovery, safety bonuses, deductions, holds, and release
          readiness across the fleet.
        </p>
        <div className="relative mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-amber-700/60 bg-amber-950/40 px-4 py-2.5 text-sm font-semibold text-amber-50 hover:bg-amber-900/45"
            onClick={() => {
              setDetailCard(null);
              setHoldOnly(true);
              setStatusF("");
              setAccentFilter(null);
              scrollTo("settlements-table");
            }}
          >
            Review Holds
          </button>
          <Link
            href="/settlements?tab=export"
            className="rounded-lg border border-teal-600/60 bg-teal-900/35 px-4 py-2.5 text-sm font-semibold text-teal-50 hover:bg-teal-900/55"
          >
            Open Ready for Export
          </Link>
          <button
            type="button"
            className="rounded-lg border border-slate-600 bg-slate-900/80 px-4 py-2.5 text-sm font-semibold text-slate-100 hover:bg-slate-800"
            onClick={() => scrollTo("settlements-payroll-trend")}
          >
            View Payroll Trend
          </button>
        </div>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <HeroMetric
            label="Total net pay"
            value={formatPayrollCurrency(fullSummary.totalNetPay)}
            hint="Current period (all drivers)"
            onClick={() => {
              clearFilters();
              scrollTo("settlements-table");
            }}
          />
          <HeroMetric
            label="Pending / draft"
            value={kpis.draft}
            hint="Workbook draft (no hold)"
            onClick={() => {
              clearFilters();
              setStatusF("Draft");
              setDetailCard(null);
              scrollTo("settlements-table");
            }}
            onToggleDetail={() => setDetailCard((c) => (c === "draft" ? null : "draft"))}
            detailOpen={detailCard === "draft"}
          />
          <HeroMetric
            label="Hold / review"
            value={kpis.onHold}
            hint="Settlement hold active"
            onClick={() => {
              clearFilters();
              setHoldOnly(true);
              scrollTo("settlements-table");
            }}
            onToggleDetail={() => setDetailCard((c) => (c === "hold" ? null : "hold"))}
            detailOpen={detailCard === "hold"}
          />
          <HeroMetric
            label="Safety bonuses"
            value={formatPayrollCurrency(fullSummary.totalSafetyBonus)}
            hint="Period total"
            onClick={() => {
              clearFilters();
              setDetailCard(null);
              setAccentFilter("safety");
              scrollTo("settlements-table");
            }}
            onToggleDetail={() => setDetailCard((c) => (c === "safety" ? null : "safety"))}
            detailOpen={detailCard === "safety"}
          />
          <HeroMetric
            label="Backhaul recovery"
            value={formatPayrollCurrency(fullSummary.totalBackhaulPay)}
            hint="Driver backhaul pay (period)"
            onClick={() => {
              clearFilters();
              setDetailCard(null);
              setAccentFilter("backhaul");
              scrollTo("settlements-table");
            }}
            onToggleDetail={() => setDetailCard((c) => (c === "backhaul" ? null : "backhaul"))}
            detailOpen={detailCard === "backhaul"}
          />
          <HeroMetric
            label="Fuel reimbursements"
            value={formatPayrollCurrency(fuelTotal)}
            hint="Derived from workbook rows"
          />
          <HeroMetric
            label="Ready for export"
            value={kpis.ready}
            hint="Cleared for payroll batch"
            onClick={() => {
              clearFilters();
              setDetailCard(null);
              setStatusF("Ready for Export");
              scrollTo("settlements-table");
            }}
            onToggleDetail={() => setDetailCard((c) => (c === "ready" ? null : "ready"))}
            detailOpen={detailCard === "ready"}
          />
        </div>

        {detailCard ? (
          <div className="relative mt-4 rounded-lg border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-200">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-white">
                {detailCard === "hold" && "Drivers on hold / review"}
                {detailCard === "draft" && "Drivers in draft (no hold)"}
                {detailCard === "ready" && "Drivers ready for export"}
                {detailCard === "safety" && "Drivers with safety bonus"}
                {detailCard === "backhaul" && "Drivers with backhaul pay"}
              </p>
              <button
                type="button"
                className="text-xs text-teal-400 hover:text-teal-300"
                onClick={() => setDetailCard(null)}
              >
                Close
              </button>
            </div>
            <ul className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm">
              {rowsForDetail(detailCard).map((r) => {
                const why =
                  detailCard === "hold"
                    ? selectedPeriod.isCurrent
                      ? workbookForRow(settlements, r.settlementId)?.settlement_hold_reason ??
                        "Settlement hold"
                      : "Archived period — pending / hold lane"
                    : detailCard === "draft"
                      ? "Payroll workbook draft — complete proof then mark ready"
                      : detailCard === "ready"
                        ? "Proof complete, no blocking hold"
                        : detailCard === "safety"
                          ? `Safety bonus ${formatPayrollCurrency(r.safetyBonus)}`
                          : `Backhaul pay ${formatPayrollCurrency(r.backhaulPay)}`;
                return (
                  <li
                    key={`${detailCard}-${r.settlementId}-${r.driverId}`}
                    className="flex flex-col gap-0.5 rounded border border-slate-800/80 bg-slate-950/50 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <span>
                      <span className="font-medium text-white">{r.driverName}</span>{" "}
                      <span className="font-mono text-slate-400">{r.driverId}</span>
                    </span>
                    <span className="text-xs text-slate-400">{why}</span>
                    {selectedPeriod.isCurrent ? (
                      <button
                        type="button"
                        className="text-left text-xs font-semibold text-teal-400 hover:text-teal-300 sm:text-right"
                        onClick={() => openDrawer(r.settlementId)}
                      >
                        Open settlement →
                      </button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/35 p-5">
        <div className="mb-4 flex items-center gap-2 text-slate-300">
          <Filter className="h-5 w-5 text-teal-500" aria-hidden />
          <span className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Filters
          </span>
        </div>

        {hasActiveFilters ? (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {driverIdFilter ? (
              <span className="rounded-full border border-teal-700/50 bg-teal-950/40 px-3 py-1 text-sm text-teal-100">
                Driver: {driverIdFilter}
              </span>
            ) : null}
            {statusF ? (
              <span className="rounded-full border border-amber-700/50 bg-amber-950/35 px-3 py-1 text-sm text-amber-100">
                Status: {statusF}
              </span>
            ) : null}
            {holdOnly ? (
              <span className="rounded-full border border-rose-800/50 bg-rose-950/35 px-3 py-1 text-sm text-rose-100">
                Hold only
              </span>
            ) : null}
            {accentFilter === "safety" ? (
              <span className="rounded-full border border-amber-700/50 bg-amber-950/35 px-3 py-1 text-sm text-amber-100">
                Safety bonus &gt; 0
              </span>
            ) : null}
            {accentFilter === "backhaul" ? (
              <span className="rounded-full border border-teal-700/50 bg-teal-950/35 px-3 py-1 text-sm text-teal-100">
                Backhaul pay &gt; 0
              </span>
            ) : null}
            {(dateFrom || dateTo) && (
              <span className="rounded-full border border-slate-600 bg-slate-900 px-3 py-1 text-sm text-slate-200">
                Date range
              </span>
            )}
            <button
              type="button"
              className="rounded-full border border-slate-600 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="block text-sm font-medium text-slate-400">
            Settlement period
            <select
              value={selectedPeriodId}
              onChange={(e) => setSelectedPeriodId(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-base text-slate-100"
            >
              {settlementPeriods.map((period) => (
                <option key={period.id} value={period.id}>
                  {period.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-400">
            Driver
            <select
              value={driverIdFilter}
              onChange={(e) => setDriverIdFilter(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-base text-slate-100"
            >
              <option value="">All drivers</option>
              {driverOptions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.id}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-400">
            Status
            <select
              value={statusF}
              onChange={(e) => setStatusF((e.target.value || "") as StatusFilterValue)}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-base text-slate-100"
            >
              <option value="">All</option>
              <option value="Draft">Draft</option>
              <option value="Hold / Review">Hold / Review</option>
              <option value="Ready for Export">Ready for Export</option>
              <option value="Exported">Exported</option>
            </select>
          </label>
          <label className="flex cursor-pointer items-end gap-3 pb-1 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={holdOnly}
              onChange={(e) => setHoldOnly(e.target.checked)}
              className="mt-2 h-4 w-4 rounded border-slate-600"
            />
            Settlement hold only
          </label>
        </div>

        <button
          type="button"
          className="mt-4 flex items-center gap-2 text-sm font-medium text-teal-400 hover:text-teal-300"
          onClick={() => setAdvancedOpen((o) => !o)}
        >
          {advancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Advanced filters (period start / end)
        </button>
        {advancedOpen ? (
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-slate-400">
              Period start ≥
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                disabled={!selectedPeriod.isCurrent}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-base text-slate-100 disabled:opacity-40"
              />
            </label>
            <label className="block text-sm text-slate-400">
              Period end ≤
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                disabled={!selectedPeriod.isCurrent}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-base text-slate-100 disabled:opacity-40"
              />
            </label>
          </div>
        ) : null}

        <p className="mt-4 text-sm text-slate-500">
          Current period uses workbook settlement detail. Prior periods use demo archive summaries
          for trend review.
        </p>
      </section>

      <section id="settlements-table">
        <h2 className="mb-3 text-lg font-semibold text-slate-100">Driver settlement table</h2>
        {selectedPeriod.isCurrent && currentPeriodRows.length === 0 && (
          <div className="mb-3 rounded-lg border border-rose-900/50 bg-rose-950/25 px-4 py-3 text-sm text-rose-100">
            Settlement workbook rows unavailable.
          </div>
        )}
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full min-w-[960px] border-collapse text-left">
            <thead className="bg-slate-900/95 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="border-b border-slate-800 px-4 py-3">Driver</th>
                <th className="border-b border-slate-800 px-4 py-3">Driver ID</th>
                {selectedPeriod.isCurrent && (
                  <th className="border-b border-slate-800 px-4 py-3">Period</th>
                )}
                {selectedPeriod.isCurrent && (
                  <th className="border-b border-slate-800 px-4 py-3 text-right">Base</th>
                )}
                <th className="border-b border-slate-800 px-4 py-3 text-right">Backhaul</th>
                <th className="border-b border-slate-800 px-4 py-3 text-right">Safety bonus</th>
                <th className="border-b border-slate-800 px-4 py-3 text-right">Gross</th>
                <th className="border-b border-slate-800 px-4 py-3 text-right">Deductions</th>
                <th className="border-b border-slate-800 px-4 py-3 text-right">Net</th>
                <th className="border-b border-slate-800 px-4 py-3">Status</th>
                <th className="border-b border-slate-800 px-4 py-3">Settlement ID</th>
                <th className="border-b border-slate-800 px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="text-slate-200">
              {filtered.map((s) => {
                const display = displayStatusLabel(s, selectedPeriod.isCurrent, settlements);
                const st = selectedPeriod.isCurrent ? workbookForRow(settlements, s.settlementId) : undefined;
                const onHold = Boolean(st?.settlement_hold);
                const needsReview =
                  selectedPeriod.isCurrent && (onHold || st?.status === "Draft");
                const lineLoadIds = selectedPeriod.isCurrent
                  ? [...new Set(lines.filter((l) => l.settlement_id === s.settlementId && l.load_id).map((l) => l.load_id!))]
                  : [];
                return (
                  <tr
                    key={`${selectedPeriod.id}-${s.settlementId}-${s.driverId}`}
                    className={[
                      "border-b border-slate-800/80 text-[15px] leading-relaxed",
                      onHold ? "bg-amber-950/15" : "hover:bg-slate-900/60",
                    ].join(" ")}
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-white">{s.driverName}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-slate-400">{s.driverId}</td>
                    {selectedPeriod.isCurrent && (
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-slate-400">
                        {workbookForRow(settlements, s.settlementId)?.period_start} →{" "}
                        {workbookForRow(settlements, s.settlementId)?.period_end}
                      </td>
                    )}
                    {selectedPeriod.isCurrent && (
                      <td className="px-4 py-3 text-right font-mono text-sm">
                        {formatPayrollCurrency(settlementEarningsById.get(s.settlementId)?.base ?? 0)}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right font-mono text-sm text-teal-200">
                      {formatPayrollCurrency(s.backhaulPay)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-amber-200">
                      {formatPayrollCurrency(s.safetyBonus)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm">{formatPayrollCurrency(s.grossPay)}</td>
                    <td className="px-4 py-3 text-right font-mono text-sm">
                      {formatPayrollCurrency(s.totalDeductions)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-teal-200">
                      {formatPayrollCurrency(s.netPay)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className={[
                          "inline-flex rounded-md px-2.5 py-1 text-sm font-semibold",
                          statusChipClassForDisplay(display),
                        ].join(" ")}
                        onClick={() => {
                          if (selectedPeriod.isCurrent) openDrawer(s.settlementId);
                        }}
                        disabled={!selectedPeriod.isCurrent}
                        title={selectedPeriod.isCurrent ? "Open settlement detail" : undefined}
                      >
                        {display}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-teal-300">{s.settlementId || "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1.5 sm:flex-row sm:flex-wrap sm:items-center">
                        {selectedPeriod.isCurrent ? (
                          <>
                            <button
                              type="button"
                              className="text-left text-sm font-semibold text-teal-400 hover:text-teal-300"
                              onClick={() => openDrawer(s.settlementId)}
                            >
                              Open settlement
                            </button>
                            {(needsReview || onHold || st?.status === "Draft") && (
                              <button
                                type="button"
                                className="text-left text-sm font-semibold text-amber-300 hover:text-amber-200"
                                onClick={() => openDrawer(s.settlementId)}
                              >
                                View review
                              </button>
                            )}
                            <Link
                              href={`/drivers/${s.driverId}`}
                              className="text-sm font-semibold text-slate-300 hover:text-white"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Open driver
                            </Link>
                            {lineLoadIds.length > 0 ? (
                              <Link
                                href={`/dispatch?loadId=${encodeURIComponent(lineLoadIds[0]!)}&driverId=${encodeURIComponent(s.driverId)}`}
                                className="text-sm font-semibold text-slate-300 hover:text-white"
                              >
                                Source load{lineLoadIds.length > 1 ? "s" : ""}
                              </Link>
                            ) : null}
                            {generatedDocs[s.settlementId]?.summaryUrl && (
                              <a
                                href={generatedDocs[s.settlementId]!.summaryUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-teal-400 hover:text-teal-300"
                              >
                                Summary doc
                              </a>
                            )}
                          </>
                        ) : (
                          <span className="text-sm text-slate-500">Archived period</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section id="settlements-holds" className="rounded-xl border border-slate-800 bg-slate-900/35 p-5">
        <h2 className="mb-3 text-lg font-semibold text-slate-100">Period summary (filtered view)</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <SummaryKpi label="Total gross pay" value={formatPayrollCurrency(periodSummary.totalGrossPay)} />
          <SummaryKpi label="Total backhaul pay" value={formatPayrollCurrency(periodSummary.totalBackhaulPay)} />
          <SummaryKpi label="Total safety bonus" value={formatPayrollCurrency(periodSummary.totalSafetyBonus)} />
          <SummaryKpi label="Total deductions" value={formatPayrollCurrency(periodSummary.totalDeductions)} />
          <SummaryKpi label="Total net pay" value={formatPayrollCurrency(periodSummary.totalNetPay)} />
          <SummaryKpi label="Pending / on hold (rows)" value={periodSummary.pendingOrOnHold} />
        </div>
      </section>

      <section id="settlements-payroll-trend" className="rounded-xl border border-slate-800 bg-slate-900/35 p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-slate-100">Historical payroll trends</h2>
          <span className="rounded-md bg-slate-900 px-3 py-1 text-sm text-slate-400">Demo trend data</span>
        </div>
        <div className="overflow-x-auto rounded-lg border border-slate-800">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead className="bg-slate-900/95 text-xs font-semibold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="border-b border-slate-800 px-3 py-3">Month</th>
                <th className="border-b border-slate-800 px-3 py-3">Net pay</th>
                <th className="border-b border-slate-800 px-3 py-3">Gross pay</th>
                <th className="border-b border-slate-800 px-3 py-3">Backhaul pay</th>
                <th className="border-b border-slate-800 px-3 py-3">Safety bonus</th>
                <th className="border-b border-slate-800 px-3 py-3">Deductions</th>
                <th className="border-b border-slate-800 px-3 py-3">Fuel reimb.</th>
              </tr>
            </thead>
            <tbody className="text-[15px] text-slate-200">
              {payrollMonthlyTrend.map((row) => (
                <tr key={row.month} className="border-b border-slate-800/80">
                  <td className="px-3 py-2.5 font-medium text-white">{row.month}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-2 rounded-full bg-teal-500/90"
                          style={{ width: `${Math.max(6, (row.netPay / trendMaxNet) * 100)}%` }}
                        />
                      </div>
                      <span className="font-mono text-teal-200">{formatPayrollCurrency(row.netPay)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-mono text-teal-300">{formatPayrollCurrency(row.grossPay)}</td>
                  <td className="px-3 py-2.5 font-mono text-emerald-300">{formatPayrollCurrency(row.backhaulPay)}</td>
                  <td className="px-3 py-2.5 font-mono text-amber-200">{formatPayrollCurrency(row.safetyBonus)}</td>
                  <td className="px-3 py-2.5 font-mono">{formatPayrollCurrency(row.deductions)}</td>
                  <td className="px-3 py-2.5 font-mono">{formatPayrollCurrency(row.fuelReimbursements)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/25 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Source details</h3>
        <p className="mt-2 text-sm text-slate-500">
          Settlement rows are sourced from the active payroll workbook, normalized during build, and
          enriched with BOF safety bonus and document/proof status. Load-level proof lives on{" "}
          <Link href="/dispatch" className="text-teal-400 hover:text-teal-300">
            Dispatch
          </Link>{" "}
          and{" "}
          <Link href="/loads" className="text-teal-400 hover:text-teal-300">
            Loads
          </Link>
          .
        </p>
      </section>
    </div>
  );
}

function HeroMetric({
  label,
  value,
  hint,
  onClick,
  onToggleDetail,
  detailOpen,
}: {
  label: string;
  value: string | number;
  hint?: string;
  onClick?: () => void;
  onToggleDetail?: () => void;
  detailOpen?: boolean;
}) {
  const interactive = Boolean(onClick) || Boolean(onToggleDetail);
  const body = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </>
  );
  return (
    <div
      className={[
        "rounded-lg border border-slate-800/90 bg-slate-900/55 p-4",
        interactive ? "transition hover:border-teal-700/50 hover:bg-slate-900/90" : "",
      ].join(" ")}
    >
      {onClick ? (
        <button type="button" onClick={onClick} className="w-full text-left">
          {body}
        </button>
      ) : (
        <div className="w-full text-left">{body}</div>
      )}
      {onToggleDetail ? (
        <button
          type="button"
          className="mt-2 text-xs font-semibold text-teal-400 hover:text-teal-300"
          onClick={(e) => {
            e.stopPropagation();
            onToggleDetail();
          }}
        >
          {detailOpen ? "Hide driver list" : "Who is included?"}
        </button>
      ) : null}
    </div>
  );
}

function SummaryKpi({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-semibold tabular-nums text-white">{value}</p>
    </div>
  );
}
