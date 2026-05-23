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

export const metadata = {
  title: "Carrier Registry | BOF",
  description: "Carrier packet readiness and dispatch eligibility",
};

const toneClasses = {
  ready: "border-emerald-400/40 bg-emerald-400/10 text-emerald-200",
  review: "border-amber-400/40 bg-amber-400/10 text-amber-200",
  watch: "border-sky-400/40 bg-sky-400/10 text-sky-200",
  blocked: "border-red-400/40 bg-red-400/10 text-red-200",
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

  return (
    <div className="bof-page">
      <section className="rounded-2xl border border-slate-700/70 bg-slate-950/80 p-6 shadow-2xl shadow-black/20 md:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-teal-300">Carrier readiness engine</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-white md:text-5xl">Carrier Registry</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
              BOF tracks carrier authority, insurance, W-9, agreement, payment, lane, and equipment readiness before
              a carrier can enter the dispatch flow. This is carrier packet control, not a generic CRM.
            </p>
          </div>
          <div className="rounded-xl border border-teal-400/30 bg-teal-400/10 p-4 text-sm text-teal-100">
            <strong className="block text-lg text-white">{stats.dispatchEligible} dispatch eligible</strong>
            <span>Out of {stats.total} demo carrier records</span>
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
          <div key={label} className="rounded-xl border border-slate-700 bg-slate-900/80 p-4">
            <p className="text-sm text-slate-400">{label}</p>
            <strong className="mt-2 block text-3xl text-white">{value}</strong>
            <span className="mt-1 block text-xs text-slate-500">{helper}</span>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-2xl border border-slate-700 bg-slate-950/70 p-4 md:p-6" aria-label="Carrier command board">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-black text-white">Carrier command board</h2>
            <p className="text-sm text-slate-400">Packet controls, dispatch eligibility, and next action by carrier.</p>
          </div>
          <Link href="/dispatch" className="rounded-lg border border-teal-400/40 px-4 py-2 text-sm font-bold text-teal-200 hover:bg-teal-400/10">
            View dispatch board
          </Link>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {carriers.map((carrier) => {
            const packet = getCarrierPacketSummary(carrier);
            const tone = getCarrierStatusTone(carrier.readinessStatus);

            return (
              <Link
                key={carrier.id}
                href={`/carriers/${carrier.id}`}
                className="group rounded-xl border border-slate-700 bg-slate-900/80 p-5 transition hover:border-teal-400/60 hover:bg-slate-900"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-xl font-black text-white">{carrier.dba}</h3>
                      <StatusPill tone={tone}>{carrier.readinessStatus}</StatusPill>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">{carrier.legalName}</p>
                    <p className="mt-2 text-sm text-slate-300">
                      DOT {carrier.dotNumber} / {carrier.mcNumber}
                    </p>
                  </div>
                  <div className="text-left md:text-right">
                    <strong className="text-3xl text-white">{carrier.readinessScore}</strong>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Readiness</p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg bg-slate-950/70 p-3">
                    <p className="text-xs text-slate-500">Packet complete</p>
                    <strong className="text-lg text-white">{packet.percent}%</strong>
                    <p className="text-xs text-slate-400">
                      {packet.ready}/{packet.total} controls ready
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-950/70 p-3">
                    <p className="text-xs text-slate-500">Dispatch eligibility</p>
                    <strong className="text-sm text-white">{carrier.dispatchEligibility}</strong>
                  </div>
                  <div className="rounded-lg bg-slate-950/70 p-3">
                    <p className="text-xs text-slate-500">Owner</p>
                    <strong className="text-sm text-white">{carrier.managerOwner}</strong>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm font-semibold text-teal-200">Next action</p>
                  <p className="mt-1 text-sm text-slate-300">{carrier.nextAction}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
