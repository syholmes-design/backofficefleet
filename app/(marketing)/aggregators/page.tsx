import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getCarrierDispatchGate, getCarrierGateEscalations } from "@/lib/carrier-dispatch-gates";
import { getCarrierRegistry, getCarrierRegistryStats } from "@/lib/carrier-registry";

export const metadata: Metadata = {
  title: "Aggregators | BackOfficeFleet",
  description: "Operational infrastructure for aggregator and carrier networks: readiness, documents, proof, exceptions, and back-office coordination.",
};

const FOCUS = [
  ["Network readiness", "See which carrier, driver, equipment, and document records are ready, blocked, or need review."],
  ["Document control", "Keep insurance, qualification, proof, claims, and settlement-support records connected to the work."],
  ["Administrative scale", "Support more participating fleets without building every back-office function from scratch."],
] as const;

export default function AggregatorsPage() {
  const carriers = getCarrierRegistry();
  const stats = getCarrierRegistryStats(carriers);
  const escalations = getCarrierGateEscalations(carriers).slice(0, 4);

  return (
    <main className="bof-home-redesign bg-slate-50 text-slate-950">
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <Image src="/assets/images/recovered/aggregator-partner-offer-desktop.webp" alt="Aggregator partner and fleet operations team reviewing a bounded operating program" fill priority sizes="100vw" className="object-cover opacity-45" />
        <div className="absolute inset-0 bg-slate-950/70" aria-hidden />
        <div className="bof-mkt-container relative z-10 grid min-h-[560px] items-center gap-8 py-20 lg:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="bof-home-eyebrow">For aggregator and carrier networks</p>
            <h1 className="max-w-3xl text-5xl font-extrabold tracking-tight md:text-6xl">Turn fleet relationships into a clearer readiness conversation.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">BOF gives aggregators an operating layer for carrier readiness, document control, proof visibility, exceptions, settlements, and administrative follow-through without becoming a broker, dispatcher, or marketplace.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/book-assessment?sector=aggregator&source=aggregators" className="inline-flex bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Fleet Assessment</Link>
              <Link href="/dashboard" className="inline-flex bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Open Operations</Link>
            </div>
          </div>
          <div className="hidden lg:block" aria-hidden />
        </div>
      </section>

      <section className="bof-home-section bof-home-section--white">
        <div className="bof-mkt-container">
          <div className="bof-home-section-head">
            <p className="bof-home-eyebrow">Aggregator operating layer</p>
            <h2>Available capacity is not always usable capacity.</h2>
            <p>BOF helps network operators organize the evidence and follow-up needed to understand readiness before an operating decision depends on it.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">{FOCUS.map(([title, body]) => <article key={title} className="bof-home-why-card"><strong>{title}</strong><p>{body}</p></article>)}</div>
        </div>
      </section>

      <section className="bof-home-section bof-home-section--soft">
        <div className="bof-mkt-container">
          <div className="mb-8 max-w-3xl">
            <p className="bof-home-eyebrow">Network operating model</p>
            <h2 className="text-3xl font-bold text-slate-950">The network still needs a single administrative truth.</h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Carrier readiness", "Carrier capacity is only useful when documentation, compliance, and proof are aligned to the service the network is counting on."],
              ["Carrier packet control", "The network has to know which carriers are compliant, complete, and ready to move without chasing scattered records."],
              ["Capacity governance", "Operational leaders need a usable picture of actual available capacity, not a spreadsheet of theoretical names and numbers."],
              ["Executive roll-up", "The board or executive team needs a severity-ranked network view with the owners and gaps already attached."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Network control</p>
                <h3 className="mt-3 text-xl font-semibold text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bof-home-section bof-home-section--white">
        <div className="bof-mkt-container">
          <div className="mb-8 max-w-3xl">
            <p className="bof-home-eyebrow">Aggregator command center</p>
            <h2 className="text-3xl font-bold text-slate-950">What needs attention right now</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">This operating snapshot reuses the existing carrier registry and dispatch gate logic to surface network-level action across carriers, packet status, and manager review. It is a demo operating surface using current BOF data rather than a new backend.</p>
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Carrier network", `${stats.total}`, "registry records"],
              ["Ready", `${stats.ready}`, "clear packet and authority"],
              ["Review / watch", `${stats.review + stats.watch}`, "needs manager attention"],
              ["Blocked", `${stats.blocked}`, "dispatch and release hold"],
            ].map(([label, value, helper]) => (
              <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
                <strong className="mt-3 block text-3xl font-black text-slate-950">{value}</strong>
                <span className="mt-2 block text-sm text-slate-600">{helper}</span>
              </div>
            ))}
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Network priorities</p>
                  <h3 className="mt-1 text-xl font-bold text-slate-950">Management action queue</h3>
                </div>
                <Link href="/carriers" className="text-sm font-semibold text-slate-700 hover:text-slate-950">Open carrier registry</Link>
              </div>
              <div className="space-y-3">
                {escalations.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-950">{item.title}</p>
                        <p className="mt-1 text-sm text-slate-600">{item.carrierName}</p>
                      </div>
                      <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                        item.tone === "blocked" ? "border-red-300 bg-red-100 text-red-700" :
                        item.tone === "watch" ? "border-amber-300 bg-amber-100 text-amber-700" :
                        "border-sky-300 bg-sky-100 text-sky-700"
                      }`}>
                        {item.tone}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{item.impact}</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Next action</span>
                      <Link href={item.href} className="text-sm font-semibold text-slate-900">{item.nextAction}</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">Network snapshot</p>
              <h3 className="mt-2 text-xl font-bold text-white">Carrier readiness at a glance</h3>
              <div className="mt-5 space-y-3">
                {carriers.slice(0, 4).map((carrier) => {
                  const gate = getCarrierDispatchGate(carrier);
                  return (
                    <div key={carrier.id} className="rounded-2xl border border-slate-700 bg-slate-900/80 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{carrier.dba}</p>
                          <p className="text-xs text-slate-400">{carrier.homeTerminal}</p>
                        </div>
                        <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] ${
                          gate.tone === "ready" ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200" :
                          gate.tone === "watch" ? "border-amber-400/40 bg-amber-400/10 text-amber-200" :
                          gate.tone === "blocked" ? "border-red-400/40 bg-red-400/10 text-red-200" :
                          "border-sky-400/40 bg-sky-400/10 text-sky-200"
                        }`}>
                          {carrier.readinessStatus}
                        </span>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-2">
                          <div className="text-slate-400">Packet</div>
                          <div className="mt-1 font-bold text-white">{gate.packetPercent}%</div>
                        </div>
                        <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-2">
                          <div className="text-slate-400">Gate</div>
                          <div className="mt-1 font-bold text-white">{gate.indicator}</div>
                        </div>
                        <div className="rounded-lg border border-slate-700 bg-slate-950/70 p-2">
                          <div className="text-slate-400">Owner</div>
                          <div className="mt-1 font-bold text-white">{carrier.managerOwner}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bof-home-section bof-home-section--white">
        <div className="bof-mkt-container">
          <div className="mb-8 max-w-3xl">
            <p className="bof-home-eyebrow">Accountability model</p>
            <h2 className="text-3xl font-bold text-slate-950">Who owns the decision across the network</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {[
              ["Network operations", "Owns readiness and the carrier-to-capacity conversation across the operating network."],
              ["Carrier managers", "Need a usable view of compliance, proof, and service health without chasing agencies and carriers manually."],
              ["Compliance", "Protects the network from record drift, missing package elements, and repeated service exceptions."],
              ["Finance", "Needs a clean view of settlement, billing, and exposure before the network decides who is actually ready to move."],
              ["Executive leadership", "Needs a roll-up of risk, exposure, and capacity that does not collapse into a backlog of informal updates."],
            ].map(([role, body]) => (
              <div key={role} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-base font-semibold text-slate-950">{role}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bof-home-section bof-home-section--soft">
        <div className="bof-mkt-container">
          <div className="mb-8 max-w-3xl">
            <p className="bof-home-eyebrow">Decision layer</p>
            <h2 className="text-3xl font-bold text-slate-950">The network needs a governed operating layer, not another marketplace abstraction.</h2>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-950 p-8 text-white shadow-sm">
            <p className="text-sm uppercase tracking-[0.18em] text-teal-300">Operational outcome</p>
            <p className="mt-4 max-w-4xl text-2xl font-semibold leading-8">
              BOF helps the network turn capacity into a managed operating asset: clearer readiness, more consistent evidence, fewer disputed handoffs, and a serious executive picture of what is actually useable.
            </p>
          </div>
        </div>
      </section>

      <section className="bof-home-section bof-home-section--soft">
        <div className="bof-mkt-container flex flex-wrap items-center justify-between gap-5">
          <div>
            <p className="bof-home-eyebrow">Explore the deeper BOF architecture</p>
            <h2>Start with the network question that needs a clearer owner.</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">Open Operations</Link>
            <Link href="/documents" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">Open Documents</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
