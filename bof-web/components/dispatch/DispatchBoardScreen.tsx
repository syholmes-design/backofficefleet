"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Filter, Search } from "lucide-react";
import type { Load, LoadStatus } from "@/types/dispatch";
import { useDispatchDashboardStore } from "@/lib/stores/dispatch-dashboard-store";
import { driverNameById } from "@/lib/dispatch-dashboard-seed";
import { getBofData } from "@/lib/load-bof-data";
import { getMockBackhaulOpportunities } from "@/lib/backhaul-opportunity-engine";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { getLoadRiskExplanation } from "@/lib/load-risk-explanation";
import {
  formatMoney,
  loadStatusChipClass,
  orderedStatusGroups,
  proofChipClass,
  sealChipClass,
} from "./dispatch-ui";
import { DispatchRouteMapClient } from "./DispatchRouteMapClient";

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
  const { data, demoRiskOverrides } = useBofDemoData();
  const loads = useDispatchDashboardStore((s) => s.loads);
  const drivers = useDispatchDashboardStore((s) => s.drivers);
  const boardFilters = useDispatchDashboardStore((s) => s.boardFilters);
  const setBoardFilters = useDispatchDashboardStore((s) => s.setBoardFilters);
  const openLoadDrawer = useDispatchDashboardStore((s) => s.openLoadDrawer);
  const selectedLoadId = useDispatchDashboardStore((s) => s.selectedLoadId);
  const selectLoad = useDispatchDashboardStore((s) => s.selectLoad);

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

  const backhaulOpportunities = useMemo(
    () => getMockBackhaulOpportunities(getBofData()),
    []
  );
  const backhaulByLoadId = useMemo(
    () => new Map(backhaulOpportunities.map((o) => [o.linkedLoadId, o])),
    [backhaulOpportunities]
  );
  const backhaulRelevantLoads = useMemo(
    () =>
      loads.filter(
        (l) =>
          l.backhaulScanStatus &&
          l.backhaulScanStatus !== "not_scanned" &&
          (l.status === "In Transit" || l.status === "Delivered" || l.status === "Assigned")
      ),
    [loads]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-white">
            Dispatch board
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-400">
            Dense operational view — grouped by lifecycle status. Row opens load detail.
          </p>
        </div>
        <Link
          href="/dispatch/intake"
          className="shrink-0 rounded-md border border-teal-700/60 bg-teal-950/40 px-3 py-2 text-xs font-semibold text-teal-100 hover:bg-teal-900/45"
        >
          Start load (intake)
        </Link>
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

      <section className="grid min-h-0 gap-4 lg:grid-cols-[1.1fr_1.4fr]">
        <div className="rounded-lg border border-slate-800 bg-slate-900/30 p-4">
          <h2 className="text-sm font-semibold text-slate-100">Route operations</h2>
          <p className="mt-1 text-xs text-slate-400">
            Click a row or map marker to select and open the load drawer.
          </p>
          <div className="mt-3 space-y-2 text-xs text-slate-300">
            <div className="flex items-center justify-between rounded border border-slate-800 px-2 py-1.5">
              <span>In Transit</span>
              <strong>{filtered.filter((l) => l.routeStatus === "in_transit").length}</strong>
            </div>
            <div className="flex items-center justify-between rounded border border-slate-800 px-2 py-1.5">
              <span>At Risk / Delayed</span>
              <strong>
                {
                  filtered.filter(
                    (l) => l.routeStatus === "at_risk" || l.routeStatus === "delayed"
                  ).length
                }
              </strong>
            </div>
            <div className="flex items-center justify-between rounded border border-slate-800 px-2 py-1.5">
              <span>Delivered</span>
              <strong>{filtered.filter((l) => l.routeStatus === "delivered").length}</strong>
            </div>
            <div className="flex items-center justify-between rounded border border-slate-800 px-2 py-1.5">
              <span>Selected load</span>
              <strong className="font-mono text-teal-300">{selectedLoadId ?? "—"}</strong>
            </div>
          </div>
        </div>
        <DispatchRouteMapClient
          loads={filtered}
          selectedLoadId={selectedLoadId ?? undefined}
          onSelectLoad={(loadId) => {
            selectLoad(loadId);
            openLoadDrawer(loadId);
          }}
          mode="all"
        />
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
                      (() => {
                        const risk = getLoadRiskExplanation(data, l.load_id, demoRiskOverrides);
                        const riskLabel =
                          risk.riskStatus === "blocked"
                            ? `Blocked: ${risk.primaryReasonLabel}`
                            : risk.riskStatus === "at_risk"
                              ? `At Risk: ${risk.primaryReasonLabel}`
                              : risk.riskStatus === "needs_review"
                                ? `Review: ${risk.primaryReasonLabel}`
                                : "Clean";
                        return (
                      <tr
                        key={l.load_id}
                        className={[
                          "cursor-pointer border-b border-slate-800/80 hover:bg-slate-900/80",
                          l.load_id === selectedLoadId ? "bg-slate-900/70 ring-1 ring-teal-700/40" : "",
                        ].join(" ")}
                        onClick={() => {
                          selectLoad(l.load_id);
                          openLoadDrawer(l.load_id);
                        }}
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
                          <div className="mt-1 text-[10px] text-slate-400">{riskLabel}</div>
                          {risk.riskStatus !== "clean" ? (
                            <button
                              type="button"
                              className="mt-1 text-[10px] text-teal-300 hover:text-teal-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                selectLoad(l.load_id);
                                openLoadDrawer(l.load_id);
                              }}
                            >
                              Why at risk?
                            </button>
                          ) : null}
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
                        );
                      })()
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}

        <section>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">
            Backhaul Opportunities
            <span className="rounded bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-slate-400">
              Backhaul opportunity feed — demo data
            </span>
          </h2>
          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="min-w-[1150px] w-full border-collapse text-left text-sm">
              <thead className="bg-slate-900/95 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="border-b border-slate-800 px-3 py-2 font-medium">Load</th>
                  <th className="border-b border-slate-800 px-3 py-2 font-medium">Scan status</th>
                  <th className="border-b border-slate-800 px-3 py-2 font-medium">Deadhead avoided</th>
                  <th className="border-b border-slate-800 px-3 py-2 font-medium">Lane</th>
                  <th className="border-b border-slate-800 px-3 py-2 font-medium">Rate</th>
                  <th className="border-b border-slate-800 px-3 py-2 font-medium">Driver Backhaul Pay</th>
                  <th className="border-b border-slate-800 px-3 py-2 font-medium">BOF Backhaul Bonus</th>
                  <th className="border-b border-slate-800 px-3 py-2 font-medium">Net Fleet Recovery</th>
                  <th className="border-b border-slate-800 px-3 py-2 font-medium">Confidence</th>
                  <th className="border-b border-slate-800 px-3 py-2 font-medium">Recommended action</th>
                </tr>
              </thead>
              <tbody className="text-slate-200">
                {backhaulRelevantLoads.map((l) => {
                  const opp = backhaulByLoadId.get(l.load_id);
                  const statusLabel =
                    opp?.status === "pending_approval"
                      ? "Pending Approval"
                      : l.backhaulScanStatus === "booked"
                      ? "Booked"
                      : l.backhaulScanStatus === "opportunity_found"
                        ? "Opportunity Found"
                        : l.backhaulScanStatus === "scanning"
                          ? "Scanning"
                          : l.backhaulScanStatus === "no_match"
                            ? "No Match"
                            : l.backhaulScanStatus === "declined"
                              ? "Declined"
                              : "Not Scanned";
                  const statusClass =
                    opp?.status === "pending_approval"
                      ? "bg-amber-900/30 text-amber-300 ring-1 ring-amber-700/50"
                      : l.backhaulScanStatus === "booked"
                      ? "bg-teal-900/35 text-teal-300 ring-1 ring-teal-700/50"
                      : l.backhaulScanStatus === "opportunity_found"
                        ? "bg-teal-900/30 text-teal-200 ring-1 ring-teal-700/40"
                        : l.backhaulScanStatus === "scanning"
                          ? "bg-amber-900/25 text-amber-300 ring-1 ring-amber-700/40"
                          : l.backhaulScanStatus === "no_match"
                            ? "bg-slate-800 text-slate-300 ring-1 ring-slate-700/70"
                            : l.backhaulScanStatus === "declined"
                              ? "bg-rose-900/30 text-rose-300 ring-1 ring-rose-700/50"
                              : "bg-slate-800 text-slate-300";
                  const recommendedAction =
                    opp?.status === "pending_approval"
                      ? "Manager approval required before booking"
                      : opp?.status === "booked"
                        ? `Booked · link to settlement line (${opp.opportunityId})`
                        : l.backhaulScanStatus === "no_match"
                          ? "No lane match within timing/equipment constraints"
                          : "Review lane and approve recommendation";
                  return (
                    <tr key={`bh-${l.load_id}`} className="border-b border-slate-800/80 hover:bg-slate-900/60">
                      <td className="px-3 py-2 text-xs">
                        <div className="font-mono text-teal-300">{l.load_id}</div>
                        <div className="text-slate-500">{l.destinationMarket ?? l.destination}</div>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-semibold ${statusClass}`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {l.estimatedDeadheadMiles ? `${l.estimatedDeadheadMiles} mi` : "—"}
                      </td>
                      <td className="px-3 py-2 text-xs">
                        {opp ? `${opp.pickupCity}, ${opp.pickupState} → ${opp.deliveryCity}, ${opp.deliveryState}` : "No qualifying lane"}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{opp ? formatMoney(opp.rate) : "—"}</td>
                      <td className="px-3 py-2 font-mono text-xs text-teal-200">{opp ? formatMoney(opp.driverBackhaulPay) : "—"}</td>
                      <td className="px-3 py-2 font-mono text-xs text-amber-200">{opp ? formatMoney(opp.bofBackhaulBonus) : "—"}</td>
                      <td className="px-3 py-2 font-mono text-xs">{opp ? formatMoney(opp.netFleetRecovery) : "—"}</td>
                      <td className="px-3 py-2 text-xs">{opp ? `${opp.confidenceScore}%` : "—"}</td>
                      <td className="px-3 py-2 text-xs text-slate-300">{recommendedAction}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
