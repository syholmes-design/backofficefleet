"use client";

import Link from "next/link";
import { useMemo } from "react";
import { LiveOperatingSpinePanel, useLiveOperatingSpine } from "@/components/operations/LiveOperatingSpinePanel";
import { SambaIntelligencePanel } from "@/components/operations/SambaIntelligencePanel";

export function ProductionCommandCenter() {
  const live = useLiveOperatingSpine();
  const { spine, error, loading, refresh } = live;

  const kpis = useMemo(() => {
    const loads = spine?.loads ?? [];
    const equipment = spine?.equipment ?? [];
    const holds = spine?.heldSettlements ?? [];
    const pickups = spine?.pickupAuthorizations ?? [];
    const delivered = loads.filter((load) => String(load.status).toUpperCase() === "DELIVERED").length;
    const oos = equipment.filter((unit) => /OOS|OUT_OF_SERVICE|UNAVAILABLE/i.test(unit.status)).length;
    return {
      loadCount: loads.length,
      delivered,
      equipmentCount: equipment.length,
      oos,
      holdCount: holds.length,
      pickupPending: pickups.filter((row) => row.status === "PENDING" || row.status === "AUTHORIZED").length,
      pickupReleased: pickups.filter((row) => row.status === "RELEASED").length,
      pickupStopped: pickups.filter((row) => row.status === "STOPPED").length,
      physicalPending: pickups.filter((row) => (row.physicalDisposition ?? "PENDING") === "PENDING").length,
      physicalVerification: pickups.filter((row) => row.status === "AUTHORIZED" && (row.physicalDisposition ?? "PENDING") === "PENDING").length,
      physicalReleased: pickups.filter((row) => row.physicalDisposition === "RELEASE").length,
      physicalStopped: pickups.filter((row) => row.physicalDisposition === "STOP" || row.physicalException).length,
      authority: spine?.authority ?? null,
    };
  }, [spine]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="rounded-xl border border-emerald-500/30 bg-slate-950/80 p-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">LIVE Command Center</p>
        <h1 className="mt-2 text-3xl font-black text-white">Production operating feeds</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          KPIs below are derived only from <code className="text-emerald-200">GET /api/dispatch/operating-spine</code>{" "}
          (authority LIVE). DEMO JSON, workbook rows, and reference material are not used as operational state.
        </p>
        <p className="mt-3 text-sm text-slate-400">
          Preserved DEMO Command Center:{" "}
          <Link className="text-amber-200 underline" href="/demo/command-center">
            /demo/command-center
          </Link>
        </p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="mt-4 rounded border border-emerald-500/50 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-950"
        >
          Refresh LIVE
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" aria-busy={loading}>
        {[
          { label: "LIVE loads", value: kpis.loadCount, hint: "Prisma Load rows in operator scope" },
          { label: "Delivered", value: kpis.delivered, hint: "Load.status DELIVERED" },
          { label: "LIVE equipment", value: kpis.equipmentCount, hint: "Prisma Equipment rows" },
          { label: "Equipment attention", value: kpis.oos, hint: "OOS / unavailable status strings" },
          { label: "Settlement holds", value: kpis.holdCount, hint: "Prisma Settlement HELD" },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-black text-white">{spine ? card.value : "—"}</p>
            <p className="mt-1 text-xs text-slate-400">{card.hint}</p>
          </div>
        ))}
      </div>

      {error ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-950/40 p-3 text-sm text-amber-100">{error}</p>
      ) : null}

      {kpis.authority && kpis.authority !== "LIVE" ? (
        <p className="rounded-lg border border-rose-500/40 bg-rose-950/40 p-3 text-sm text-rose-100">
          BLOCKED: operating-spine authority is {kpis.authority}, not LIVE.
        </p>
      ) : null}

      <LiveOperatingSpinePanel title="LIVE Command Center consumption" live={live} />

      <SambaIntelligencePanel />

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-lg font-bold text-white">Pickup authorization (LIVE)</h2>
        <p className="mt-1 text-xs text-slate-400">
          Separate dock gate after trip release. Phase 1 status and Phase 2 physical disposition come from the same
          operating-spine payload. Stored driver and equipment records are not physical dock proof.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Pending / authorized", value: kpis.pickupPending },
            { label: "RELEASED", value: kpis.pickupReleased },
            { label: "STOPPED", value: kpis.pickupStopped },
            { label: "Physical pending", value: kpis.physicalPending },
            { label: "Verification", value: kpis.physicalVerification },
            { label: "Physical RELEASE", value: kpis.physicalReleased },
            { label: "Physical STOP / exception", value: kpis.physicalStopped },
          ].map((card) => (
            <div key={card.label} className="rounded-lg border border-slate-800 bg-slate-950/60 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
              <p className="mt-1 text-2xl font-black text-white">{spine ? card.value : "—"}</p>
            </div>
          ))}
        </div>
        <ul className="mt-4 space-y-1 text-sm text-slate-300">
          {(spine?.pickupAuthorizations ?? [])
            .filter((row) => row.status === "STOPPED" || row.status === "RELEASED" || row.status === "PENDING" || row.status === "AUTHORIZED")
            .slice(0, 8)
            .map((row) => (
              <li key={row.id}>
                <Link className="text-teal-200 underline" href={`/dispatch/pickup?loadId=${row.loadId}`}>
                  {row.status}
                </Link>
                {row.physicalDisposition ? ` · physical ${row.physicalDisposition}` : ""}{" "}
                {row.reason ? `— ${row.reason}` : null}
              </li>
            ))}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-lg font-bold text-white">Domain links (LIVE consumers)</h2>
        <ul className="mt-3 grid gap-2 text-sm text-teal-200 sm:grid-cols-2 lg:grid-cols-4">
          <li>
            <Link className="underline" href="/loads">
              Loads
            </Link>
          </li>
          <li>
            <Link className="underline" href="/dispatch">
              Dispatch
            </Link>
          </li>
          <li>
            <Link className="underline" href="/drivers">
              Drivers
            </Link>
          </li>
          <li>
            <Link className="underline" href="/settlements">
              Settlements
            </Link>
          </li>
          <li>
            <Link className="underline" href="/dispatch/pickup">
              Pickup authorization
            </Link>
          </li>
          <li>
            <Link className="underline" href="/dispatch/pickup/dock">
              Shipper dock
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}
