/**
 * BOF Route Owner:
 * URL: /demo
 * Type: DEMO
 * Primary component: DemoAccessPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for guided demo access and persona entry work.
 */
import Link from "next/link";
import {
  getDemoAccessSurfaces,
  getDemoAccessTiers,
  getDemoPersonas,
} from "@/lib/demo-access";

export const metadata = {
  title: "Explore BOF | BackOfficeFleet Demo",
  description: "Role-based BackOfficeFleet demo entry points for fleet owners, dispatchers, carrier operations, compliance, and investors.",
};

const tierTone: Record<string, string> = {
  public: "border-slate-600 bg-slate-900/70 text-slate-200",
  self_guided: "border-teal-400/40 bg-teal-400/10 text-teal-100",
  guided_demo: "border-sky-400/40 bg-sky-400/10 text-sky-100",
  trusted_access: "border-amber-400/40 bg-amber-400/10 text-amber-100",
  internal: "border-violet-400/40 bg-violet-400/10 text-violet-100",
};

export default function DemoAccessPage() {
  const personas = getDemoPersonas();
  const tiers = getDemoAccessTiers();
  const surfaces = getDemoAccessSurfaces();

  return (
    <div className="bof-page">
      <section className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl shadow-black/25">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="p-6 md:p-10">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-teal-300">Controlled demo access</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-white md:text-6xl">
              Explore BOF by operational role.
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300 md:text-lg">
              BackOfficeFleet is easiest to understand when each visitor follows the workflow they own: dispatch
              movement, carrier readiness, packet verification, finance release, or executive triage.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/demo/walkthrough"
                className="rounded-xl bg-teal-400 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-teal-300"
              >
                Guided Operations Walkthrough
              </Link>
              <Link
                href="/dashboard"
                className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-black text-white transition hover:border-slate-400 hover:bg-slate-900"
              >
                Experience BOF Operations
              </Link>
              <Link
                href="/founding-fleet"
                className="rounded-xl border border-sky-400/50 px-5 py-3 text-sm font-black text-sky-100 transition hover:bg-sky-400/10"
              >
                Request Guided Walkthrough
              </Link>
            </div>
          </div>
          <div className="border-t border-slate-800 bg-slate-900/70 p-6 lg:border-l lg:border-t-0 md:p-8">
            <h2 className="text-xl font-black text-white">Demo access tiers</h2>
            <div className="mt-5 grid gap-3">
              {tiers.map((tier) => (
                <div key={tier.id} className={`rounded-xl border p-4 ${tierTone[tier.id]}`}>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-black text-white">{tier.label}</h3>
                    <span className="rounded-full border border-current px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em]">
                      {tier.id.replace("_", " ")}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6">{tier.summary}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-300">{tier.boundary}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="persona-entry">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-300">Persona-based exploration</p>
            <h2 id="persona-entry" className="mt-2 text-3xl font-black text-white">
              Choose the demo path that matches the buyer.
            </h2>
          </div>
          <Link href="/demo/walkthrough" className="text-sm font-bold text-teal-200 hover:text-teal-100">
            Open full walkthrough
          </Link>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {personas.map((persona) => (
            <article key={persona.id} className="rounded-2xl border border-slate-700 bg-slate-950/75 p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white">{persona.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{persona.summary}</p>
                </div>
                <Link
                  href={persona.primaryRoute}
                  className="shrink-0 rounded-lg border border-teal-400/40 px-4 py-2 text-sm font-bold text-teal-100 hover:bg-teal-400/10"
                >
                  {persona.routeLabel}
                </Link>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {persona.focusAreas.map((area) => (
                  <span key={area} className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300">
                    {area}
                  </span>
                ))}
              </div>
              <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Guided prompt</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{persona.guidedPrompt}</p>
              </div>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <Link href={persona.primaryRoute} className="font-bold text-teal-200 hover:text-teal-100">
                  Open primary route
                </Link>
                <Link href={persona.secondaryRoute} className="font-bold text-sky-200 hover:text-sky-100">
                  Continue workflow
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]" aria-labelledby="demo-boundaries">
        <div className="rounded-2xl border border-teal-400/30 bg-teal-400/10 p-6">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-teal-200">Guided access</p>
          <h2 id="demo-boundaries" className="mt-3 text-3xl font-black text-white">
            Keep the demo on the strongest operating path.
          </h2>
          <p className="mt-4 text-sm leading-7 text-teal-50">
            BOF remains open for self-guided review, but workspace and setup-style routes are better shown with
            context so buyers see the enforcement engine instead of raw scaffolding.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-700 bg-slate-950/75 p-5">
          <h3 className="text-xl font-black text-white">Guided-demo recommendations</h3>
          <div className="mt-4 grid gap-3">
            {surfaces.map((surface) => (
              <div key={surface.route} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-bold text-white">{surface.label}</p>
                    <p className="mt-1 text-sm text-slate-400">{surface.route}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.12em] ${tierTone[surface.recommendedTier]}`}>
                    {surface.recommendedTier.replace("_", " ")}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{surface.framing}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
