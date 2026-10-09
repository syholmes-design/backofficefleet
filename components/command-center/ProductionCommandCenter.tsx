"use client";

import Link from "next/link";
import { useMemo } from "react";
import { LiveOperatingSpinePanel, useLiveOperatingSpine } from "@/components/operations/LiveOperatingSpinePanel";
import { SambaIntelligencePanel } from "@/components/operations/SambaIntelligencePanel";

function pickupStatusLabel(status: string) {
  switch (status) {
    case "PENDING":
      return "Awaiting decision";
    case "AUTHORIZED":
      return "Authorized";
    case "RELEASED":
      return "Released to pickup";
    case "STOPPED":
      return "Stopped";
    default:
      return status;
  }
}

function dockDispositionLabel(disposition: string | undefined) {
  switch (disposition) {
    case "PENDING":
      return "Dock check pending";
    case "RELEASE":
      return "Cleared at dock";
    case "STOP":
      return "Held at dock";
    default:
      return disposition ? disposition.replaceAll("_", " ") : "";
  }
}

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

  const settlementHolds = spine?.heldSettlements ?? [];
  const equipmentAttention = (spine?.equipment ?? []).filter((unit) => /OOS|OUT_OF_SERVICE|UNAVAILABLE/i.test(unit.status));
  const proofsRequiringReview = spine?.proofsRequiringReview ?? [];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="rounded-xl border border-emerald-500/30 bg-slate-950/80 p-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Command Center</p>
        <h1 className="mt-2 text-3xl font-black text-white">Fleet operations</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          Counts reflect your signed-in fleet’s current loads, equipment, settlements, and pickup gates.
        </p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="mt-4 rounded border border-emerald-500/50 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-950"
        >
          Refresh
        </button>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5" aria-busy={loading}>
        {[
          { label: "Active loads", value: kpis.loadCount, hint: "Loads in your fleet" },
          { label: "Delivered", value: kpis.delivered, hint: "Marked delivered" },
          { label: "Fleet equipment", value: kpis.equipmentCount, hint: "Units on your roster" },
          { label: "Equipment attention", value: kpis.oos, hint: "Out of service or unavailable" },
          { label: "Settlement holds", value: kpis.holdCount, hint: "Settlements on hold" },
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
          Operations data is not live for this session. Contact your administrator before acting on these counts.
        </p>
      ) : null}

      <LiveOperatingSpinePanel title="Current operations" live={live} />

      <section className="rounded-xl border border-amber-500/30 bg-slate-900/40 p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Needs attention</p>
          <h2 className="mt-1 text-lg font-bold text-white">Immediate attention</h2>
          <p className="mt-1 text-sm text-slate-400">
            Settlement holds and equipment that is out of service or unavailable.
          </p>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
            <h3 className="text-sm font-bold text-white">Settlement holds</h3>
            {loading ? <p className="mt-2 text-sm text-slate-400">Loading settlement holds…</p> : null}
            {!loading && settlementHolds.length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">No settlement holds in your fleet.</p>
            ) : null}
            {settlementHolds.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm">
                {settlementHolds.map((hold) => (
                  <li key={hold.id} className="border-t border-slate-800 pt-2 first:border-t-0 first:pt-0">
                    <Link className="font-semibold text-teal-200 underline" href={`/trip-release/${hold.loadId}`}>
                      Open load
                    </Link>
                    <p className="mt-1 text-xs text-slate-400">{hold.holdReason || hold.status}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-4">
            <h3 className="text-sm font-bold text-white">Equipment attention</h3>
            {loading ? <p className="mt-2 text-sm text-slate-400">Loading equipment…</p> : null}
            {!loading && equipmentAttention.length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">No unavailable or out-of-service equipment in your fleet.</p>
            ) : null}
            {equipmentAttention.length > 0 ? (
              <ul className="mt-3 space-y-2 text-sm">
                {equipmentAttention.map((unit) => (
                  <li key={unit.id} className="border-t border-slate-800 pt-2 first:border-t-0 first:pt-0">
                    <Link className="font-semibold text-teal-200 underline" href="/dispatch">
                      {unit.unitNumber}
                    </Link>
                    <p className="mt-1 text-xs text-slate-400">{unit.status.replaceAll("_", " ")}</p>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Proof</p>
          <h2 className="mt-1 text-lg font-bold text-white">Proof review</h2>
          <p className="mt-1 text-sm text-slate-400">
            Delivery proofs that are rejected, missing, or marked as an exception.
          </p>
        </div>
        {loading ? <p className="mt-4 text-sm text-slate-400">Loading proof review…</p> : null}
        {!loading && proofsRequiringReview.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">No proofs currently need review.</p>
        ) : null}
        {proofsRequiringReview.length > 0 ? (
          <ul className="mt-4 divide-y divide-slate-800 rounded-lg border border-slate-800 bg-slate-950/40">
            {proofsRequiringReview.map((proof) => (
              <li key={proof.id} className="p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-white">
                    {proof.proofType} · {proof.status}
                  </p>
                  {proof.settlementStatus === "HELD" ? (
                    <Link className="text-teal-200 underline" href={`/trip-release/${proof.loadId}`}>
                      Open trip release
                    </Link>
                  ) : (
                    <Link className="text-teal-200 underline" href={`/trip-release/${proof.loadId}`}>
                      Open load
                    </Link>
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-400">Load {proof.loadId.slice(0, 8)}</p>
                {proof.exceptionStatus ? <p className="mt-2 text-sm text-slate-300">{proof.exceptionStatus}</p> : null}
                {proof.settlementStatus ? (
                  <p className="mt-2 text-xs text-slate-400">Settlement: {proof.settlementStatus}</p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <SambaIntelligencePanel loadId={spine?.loads[0]?.id} />

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-lg font-bold text-white">Pickup authorization</h2>
        <p className="mt-1 text-xs text-slate-400">
          After trip release, pickup must pass authorization and dock verification. System records show status only — they are not proof of who or what is at the dock.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Awaiting decision", value: kpis.pickupPending },
            { label: "Released to pickup", value: kpis.pickupReleased },
            { label: "Stopped", value: kpis.pickupStopped },
            { label: "Dock check pending", value: kpis.physicalPending },
            { label: "Authorized, dock not verified", value: kpis.physicalVerification },
            { label: "Cleared at dock", value: kpis.physicalReleased },
            { label: "Held or exception at dock", value: kpis.physicalStopped },
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
                  {pickupStatusLabel(row.status)}
                </Link>
                {row.physicalDisposition ? ` · ${dockDispositionLabel(row.physicalDisposition)}` : ""}{" "}
                {row.reason ? `— ${row.reason}` : null}
              </li>
            ))}
        </ul>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <h2 className="text-lg font-bold text-white">Related workflows</h2>
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
              Settlement holds
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
