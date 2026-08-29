/**
 * BOF Route Owner:
 * URL: /carriers
 * Type: DEMO
 * Primary component: CarrierRegistryPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for carrier registry route-level MVP work.
 */
import Link from "next/link";
import {
  getCarrierPacketSummary,
  getCarrierRegistry,
  getCarrierRegistryStats,
  getCarrierStatusTone,
} from "@/lib/carrier-registry";
import { getCarrierDispatchGate, getCarrierGateStats } from "@/lib/carrier-dispatch-gates";

export const metadata = {
  title: "Carrier Registry | BOF",
  description: "Carrier packet readiness and dispatch eligibility",
};

const toneClasses = {
  ready: "border-emerald-300 bg-emerald-100 text-emerald-800",
  review: "border-amber-300 bg-amber-100 text-amber-800",
  watch: "border-sky-300 bg-sky-100 text-sky-800",
  blocked: "border-red-300 bg-red-100 text-red-800",
};

function StatusPill({ tone, children }: { tone: keyof typeof toneClasses; children: React.ReactNode }) {
  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${toneClasses[tone]}`}>
      {children}
    </span>
  );
}

export default function CarrierRegistryPage() {
  const carriers = getCarrierRegistry();
  const stats = getCarrierRegistryStats(carriers);
  const gateStats = getCarrierGateStats(carriers);

  return (
    <div className="bof-page bg-slate-50 text-slate-900 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-teal-700">Carrier readiness engine</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950 md:text-5xl">Carrier Registry</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
              BOF tracks carrier authority, insurance, W-9, agreement, payment, lane, and equipment readiness before
              a carrier can enter the dispatch flow. This is carrier packet control, not a generic CRM.
            </p>
          </div>
          <div className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900">
            <strong className="block text-lg text-slate-950">{gateStats.allowed} cleared / {gateStats.blocked} blocked</strong>
            <span>Carrier assignment gates enforce packet readiness before dispatch.</span>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3 xl:grid-cols-6" aria-label="Carrier registry summary">
        {[
          ["Total carriers", stats.total, "Registry records"],
          ["Ready", stats.ready, "Clean packet"],
          ["Review", stats.review, "Needs packet owner"],
          ["Watch", stats.watch, "Manager attention"],
          ["Blocked", stats.blocked, "Cannot dispatch"],
          ["Insurance issues", stats.expiringInsurance, "Expired or renewal watch"],
        ].map(([label, value, helper]) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-600">{label}</p>
            <strong className="mt-2 block text-3xl font-extrabold text-slate-950">{value}</strong>
            <span className="mt-1 block text-xs text-slate-500">{helper}</span>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" aria-label="Carrier command board">
        <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-950">Carrier command board</h2>
            <p className="text-sm text-slate-600">Packet controls, dispatch eligibility, and next action by carrier.</p>
          </div>
          <Link href="/dispatch" className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-bold text-slate-800 transition hover:bg-slate-200 hover:text-slate-950">
            View dispatch board
          </Link>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {carriers.map((carrier) => {
            const packet = getCarrierPacketSummary(carrier);
            const tone = getCarrierStatusTone(carrier.readinessStatus);
            const gate = getCarrierDispatchGate(carrier);

            return (
              <Link
                key={carrier.id}
                href={`/carriers/${carrier.id}`}
                className="group rounded-xl border border-slate-200 bg-slate-50 p-5 transition hover:border-teal-500 hover:bg-white hover:shadow-md"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-black text-slate-950 group-hover:text-teal-800 transition-colors">{carrier.dba}</h3>
                      <StatusPill tone={tone}>{carrier.readinessStatus}</StatusPill>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{carrier.legalName}</p>
                    <p className="mt-2 text-xs font-mono font-medium text-slate-700">
                      DOT {carrier.dotNumber} / {carrier.mcNumber}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <strong className="text-3xl font-extrabold text-slate-950">{carrier.readinessScore}</strong>
                    <p className="text-xs uppercase tracking-[0.18em] font-bold text-slate-500">Readiness</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
                    <p className="text-xs font-semibold text-slate-500">Packet complete</p>
                    <strong className="text-lg font-bold text-slate-950">{packet.percent}%</strong>
                    <p className="text-xs text-slate-600">
                      {packet.ready}/{packet.total} controls ready
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
                    <p className="text-xs font-semibold text-slate-500">Dispatch eligibility</p>
                    <strong className="text-sm font-bold text-slate-950">{gate.indicator}</strong>
                    <p className="mt-1 text-xs text-slate-600">{gate.assignmentSimulation}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-xs">
                    <p className="text-xs font-semibold text-slate-500">Owner</p>
                    <strong className="text-sm font-bold text-slate-950">{carrier.managerOwner}</strong>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-teal-800">Dispatch gate</p>
                    <p className="mt-1 text-sm leading-6 text-slate-700">{gate.operationalRisk}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-teal-800">Next action</p>
                    <p className="mt-1 text-sm leading-6 text-slate-900 font-semibold">{gate.requiredNextAction}</p>
                  </div>
                </div>

                <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Reload-qualified regions</p>
                  <p className="mt-1 text-sm text-slate-800 font-medium">{carrier.reloadQualifiedRegions.join(" / ")}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
