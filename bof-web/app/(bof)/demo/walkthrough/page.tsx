/**
 * BOF Route Owner:
 * URL: /demo/walkthrough
 * Type: DEMO
 * Primary component: DemoWalkthroughPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for guided demo walkthrough work.
 */
import Link from "next/link";
import { getDemoPersonas, getDemoWalkthroughSteps } from "@/lib/demo-access";

export const metadata = {
  title: "Guided Operations Walkthrough | BOF Demo",
  description: "A guided BackOfficeFleet walkthrough from command-center triage through dispatch, carrier readiness, proof, safety, and finance release.",
};

export default function DemoWalkthroughPage() {
  const steps = getDemoWalkthroughSteps();
  const personas = getDemoPersonas();

  return (
    <div className="bof-page">
      <section className="rounded-2xl border border-slate-700 bg-slate-950 p-6 shadow-2xl shadow-black/25 md:p-10">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-teal-300">Guided Operations Walkthrough</p>
        <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_0.72fr] lg:items-end">
          <div>
            <h1 className="max-w-4xl text-4xl font-black tracking-tight text-white md:text-6xl">
              Follow the BOF enforcement path from triage to cash release.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
              This walkthrough keeps the demo focused on the core operating system story: driver readiness, carrier
              packet control, dispatch gates, reload fit, proof packets, safety escalation, and settlement release.
            </p>
          </div>
          <div className="rounded-2xl border border-teal-400/30 bg-teal-400/10 p-5">
            <h2 className="text-lg font-black text-white">Recommended pace</h2>
            <p className="mt-2 text-sm leading-6 text-teal-50">
              Start with the Command Center, then move through Dispatch, Carrier Registry, Packet Evidence,
              Settlements, and Safety. Each stop shows a consequence and an owner action.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/command-center" className="rounded-lg bg-teal-400 px-4 py-2 text-sm font-black text-slate-950 hover:bg-teal-300">
                Start triage
              </Link>
              <Link href="/demo" className="rounded-lg border border-teal-300/50 px-4 py-2 text-sm font-black text-teal-100 hover:bg-teal-400/10">
                Back to demo paths
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="walkthrough-steps">
        <h2 id="walkthrough-steps" className="text-3xl font-black text-white">
          Walkthrough sequence
        </h2>
        <div className="mt-5 grid gap-4">
          {steps.map((step, index) => (
            <article key={step.id} className="rounded-2xl border border-slate-700 bg-slate-950/75 p-5">
              <div className="grid gap-4 lg:grid-cols-[auto_1fr_auto] lg:items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-teal-400/40 bg-teal-400/10 text-lg font-black text-teal-100">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white">{step.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">Owner: {step.owner}</p>
                </div>
                <Link
                  href={step.route}
                  className="rounded-lg border border-teal-400/40 px-4 py-2 text-sm font-bold text-teal-100 hover:bg-teal-400/10"
                >
                  Open route
                </Link>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Operational outcome</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{step.outcome}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Proof point</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{step.proofPoint}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-slate-700 bg-slate-950/75 p-6" aria-labelledby="persona-shortcuts">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-300">Persona shortcuts</p>
            <h2 id="persona-shortcuts" className="mt-2 text-3xl font-black text-white">
              Jump to the workflow that matters to the visitor.
            </h2>
          </div>
          <Link href="/demo" className="text-sm font-bold text-teal-200 hover:text-teal-100">
            View all demo paths
          </Link>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {personas.map((persona) => (
            <Link
              key={persona.id}
              href={persona.primaryRoute}
              className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 transition hover:border-teal-400/50 hover:bg-slate-900"
            >
              <p className="font-black text-white">{persona.label}</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">{persona.summary}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
