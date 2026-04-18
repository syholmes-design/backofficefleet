"use client";

import { useMemo } from "react";
import { Filter, Search } from "lucide-react";
import type { Load, LoadStatus } from "@/types/dispatch";
import { useDispatchDashboardStore } from "@/lib/stores/dispatch-dashboard-store";
import { driverNameById } from "@/lib/dispatch-dashboard-seed";
import {
  loadStatusChipClass,
  orderedStatusGroups,
  proofChipClass,
  sealChipClass,
} from "./dispatch-ui";

function applyBoardFilters(
  loads: Load[],
  f: {
    dateFrom: string;
    dateTo: string;
    customer: string;
    status: "" | LoadStatus;
    driver: string;
  },
  driverNames: Map<string, string>
): Load[] {
  return loads.filter((l) => {
    if (f.customer && !l.customer_name.toLowerCase().includes(f.customer.toLowerCase()))
      return false;
    if (f.status && l.status !== f.status) return false;
    if (f.driver) {
      const q = f.driver.toLowerCase();
      const name = (l.driver_id && driverNames.get(l.driver_id)) || "";
      if (
        !l.driver_id?.toLowerCase().includes(q) &&
        !name.toLowerCase().includes(q)
      )
        return false;
    }
    if (f.dateFrom && l.pickup_datetime < f.dateFrom) return false;
    if (f.dateTo && l.pickup_datetime > f.dateTo) return false;
    return true;
  });
}

export function DispatchBoardScreen() {
  const loads = useDispatchDashboardStore((s) => s.loads);
  const drivers = useDispatchDashboardStore((s) => s.drivers);
  const boardFilters = useDispatchDashboardStore((s) => s.boardFilters);
  const setBoardFilters = useDispatchDashboardStore((s) => s.setBoardFilters);
  const openLoadDrawer = useDispatchDashboardStore((s) => s.openLoadDrawer);

  const nameById = useMemo(
    () => new Map(drivers.map((d) => [d.driver_id, d.name])),
    [drivers]
  );

  const filtered = useMemo(
    () => applyBoardFilters(loads, boardFilters, nameById),
    [loads, boardFilters, nameById]
  );

  const grouped = useMemo(() => {
    const m = new Map<LoadStatus, Load[]>();
    for (const s of orderedStatusGroups()) m.set(s, []);
    for (const l of filtered) {
      const arr = m.get(l.status);
      if (arr) arr.push(l);
    }
    return m;
  }, [filtered]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">
      <header>
        <h1 className="text-lg font-semibold tracking-tight text-white">
          Dispatch board
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-400">
          Dense operational view — grouped by lifecycle status. Row opens load detail.
        </p>
      </header>

      <section className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2 text-slate-300">
          <Filter className="h-4 w-4 text-teal-500" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Filters
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block text-xs text-slate-500">
            Date from
            <input
              type="datetime-local"
              value={boardFilters.dateFrom}
              onChange={(e) => setBoardFilters({ dateFrom: e.target.value })}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
            />
          </label>
          <label className="block text-xs text-slate-500">
            Date to
            <input
              type="datetime-local"
              value={boardFilters.dateTo}
              onChange={(e) => setBoardFilters({ dateTo: e.target.value })}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
            />
          </label>
          <label className="block text-xs text-slate-500">
            Customer contains
            <input
              type="search"
              value={boardFilters.customer}
              onChange={(e) => setBoardFilters({ customer: e.target.value })}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
              placeholder="Search…"
            />
          </label>
          <label className="block text-xs text-slate-500">
            Status
            <select
              value={boardFilters.status}
              onChange={(e) =>
                setBoardFilters({
                  status: (e.target.value || "") as "" | LoadStatus,
                })
              }
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
            >
              <option value="">All</option>
              {orderedStatusGroups().map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Search className="h-3 w-3" aria-hidden />
              Driver id / name
            </span>
            <input
              type="search"
              value={boardFilters.driver}
              onChange={(e) => setBoardFilters({ driver: e.target.value })}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
              placeholder="DRV-… or name"
            />
          </label>
        </div>
      </section>

      <div className="min-h-0 flex-1 space-y-8 overflow-y-auto pb-8">
        {orderedStatusGroups().map((status) => {
          const rows = grouped.get(status) ?? [];
          if (rows.length === 0) return null;
          return (
            <section key={status}>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
                <span
                  className={[
                    "inline-flex rounded px-2 py-0.5 text-xs font-semibold",
                    loadStatusChipClass(status),
                  ].join(" ")}
                >
                  {status}
                </span>
                <span className="text-slate-500">({rows.length})</span>
              </h2>
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="min-w-[1100px] w-full border-collapse text-left text-sm">
                  <thead className="sticky top-0 z-10 bg-slate-900/95 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="border-b border-slate-800 px-3 py-2 font-medium">
                        Load ID
                      </th>
                      <th className="border-b border-slate-800 px-3 py-2 font-medium">
                        Customer
                      </th>
                      <th className="border-b border-slate-800 px-3 py-2 font-medium">
                        Origin
                      </th>
                      <th className="border-b border-slate-800 px-3 py-2 font-medium">
                        Destination
                      </th>
                      <th className="border-b border-slate-800 px-3 py-2 font-medium">
                        Pickup
                      </th>
                      <th className="border-b border-slate-800 px-3 py-2 font-medium">
                        Delivery
                      </th>
                      <th className="border-b border-slate-800 px-3 py-2 font-medium">
                        Status
                      </th>
                      <th className="border-b border-slate-800 px-3 py-2 font-medium">
                        Driver
                      </th>
                      <th className="border-b border-slate-800 px-3 py-2 font-medium">
                        Tractor
                      </th>
                      <th className="border-b border-slate-800 px-3 py-2 font-medium">
                        Trailer
                      </th>
                      <th className="border-b border-slate-800 px-3 py-2 font-medium">
                        Proof
                      </th>
                      <th className="border-b border-slate-800 px-3 py-2 font-medium">
                        Seal
                      </th>
                      <th className="border-b border-slate-800 px-3 py-2 font-medium">
                        Exc.
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-200">
                    {rows.map((l) => (
                      <tr
                        key={l.load_id}
                        className="cursor-pointer border-b border-slate-800/80 hover:bg-slate-900/80"
                        onClick={() => openLoadDrawer(l.load_id)}
                      >
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-teal-300">
                          {l.load_id}
                        </td>
                        <td className="max-w-[140px] truncate px-3 py-2 text-xs">
                          {l.customer_name}
                        </td>
                        <td className="max-w-[160px] truncate px-3 py-2 text-xs text-slate-400">
                          {l.origin}
                        </td>
                        <td className="max-w-[160px] truncate px-3 py-2 text-xs text-slate-400">
                          {l.destination}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-400">
                          {l.pickup_datetime.replace("T", " ")}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-400">
                          {l.delivery_datetime.replace("T", " ")}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={[
                              "inline-flex rounded px-2 py-0.5 text-[11px] font-semibold",
                              loadStatusChipClass(l.status),
                              l.settlement_hold ? " ring-1 ring-red-500/60" : "",
                            ].join(" ")}
                          >
                            {l.status}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-xs">
                          {driverNameById(drivers, l.driver_id)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">
                          {l.tractor_id ?? "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">
                          {l.trailer_id ?? "—"}
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
                        <td className="px-3 py-2 text-center text-xs">
                          {l.exception_flag ? (
                            <span className="text-red-400">Y</span>
                          ) : (
                            <span className="text-slate-600">·</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
