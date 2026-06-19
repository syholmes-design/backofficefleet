/**
 * BOF Shared Component:
 * Used by: / (via app/(marketing)/page.tsx)
 * Do not edit for one page unless props/page-specific overrides are used.
 * See docs/BOF_ROUTE_MAP.md.
 */
import Link from "next/link";
import Image from "next/image";
import { FreightCompliancePulse } from "@/components/marketing/FreightCompliancePulse";
import { IconDispatch, IconLoadProof, IconShield } from "@/components/marketing/MarketingHomeIcons";
import { getBofData } from "@/lib/load-bof-data";

function formatHomepageCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function getHeroMetrics() {
  const data = getBofData();
  const openMoneyRows = (data.moneyAtRisk ?? []).filter((row) => {
    const status = String(row.status ?? "").trim().toLowerCase();
    return status !== "closed" && status !== "resolved";
  });
  const driversAtRisk = new Set(openMoneyRows.map((row) => row.driverId).filter(Boolean)).size;
  const loadsAtRisk = new Set(openMoneyRows.map((row) => row.loadId).filter(Boolean)).size;
  const claimsExposure =
    Number(data.moneyAtRiskSummary?.claimsExposure ?? 0) ||
    openMoneyRows
      .filter((row) => /claim/i.test(String(row.category ?? "")))
      .reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  const totalAtRisk =
    Number(data.moneyAtRiskSummary?.totalAtRisk ?? 0) ||
    openMoneyRows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);

  return [
    { label: "Drivers at Risk", value: String(driversAtRisk), href: "/drivers" },
    { label: "Loads at Risk", value: String(loadsAtRisk), href: "/dispatch" },
    { label: "Claims Exposure", value: formatHomepageCurrency(claimsExposure), href: "/safety" },
    { label: "Money at Risk", value: formatHomepageCurrency(totalAtRisk), href: "/command-center" },
  ] as const;
}

const FOUNDING_FLEET_HREF = "/founding-fleet";

const PAIN_POINTS = [
  "Drivers aren’t ready when loads are ready",
  "Proof is missing or late",
  "Settlements drift",
  "Customers escalate preventable issues",
  "Compliance gaps go unnoticed",
  "No one owns the workflow end-to-end",
] as const;

const WORKFLOW_PANELS = [
  {
    title: "Driver Readiness",
    body: "CDL, medical card, MVR, HR, safety, and settlement holds are checked before a driver is released.",
    gate: "Drivers cannot start work without compliance readiness.",
    icon: <IconShield />,
  },
  {
    title: "Load Execution",
    body: "Dispatch sees the route, customer requirements, equipment status, fuel plan, and rest-stop plan in one view.",
    gate: "Loads cannot progress without required operating context.",
    icon: <IconDispatch />,
  },
  {
    title: "Proof",
    body: "BOL, POD, cargo photos, seal proof, RFID records, and exception evidence attach to the load record.",
    gate: "Proof gaps become owned action items before they become disputes.",
    icon: <IconLoadProof />,
  },
  {
    title: "Settlement",
    body: "Holds, deductions, accessorials, factoring readiness, and driver pay are reconciled against the proof packet.",
    gate: "Settlements cannot release with unresolved exceptions.",
    icon: <IconLoadProof />,
  },
  {
    title: "Cash Flow",
    body: "Billing blockers, claim exposure, factoring packets, and money at risk move into a priority queue.",
    gate: "Every dollar has evidence, status, and an owner.",
    icon: <IconDispatch />,
  },
] as const;

const FOUNDING_BENEFITS = [
  "Locked-in lifetime pricing",
  "Direct influence on workflows and enforcement logic",
  "Early access to unreleased modules",
  "Priority onboarding and white-glove support",
  "Co-development sessions with the product team",
  "Operational insights and reporting",
  "Founding Fleet badge and logo placement",
  "A competitive advantage other fleets won’t have for years",
] as const;

const PORTALS = [
  {
    title: "Manager Portal",
    body: "Command center for dispatch, compliance, settlements, exceptions, and cash flow.",
    href: "/portals/manager",
    icon: <IconDispatch />,
  },
  {
    title: "Driver Portal",
    body: "Assignments, documents, readiness, settlements, and communication in one enforced workflow.",
    href: "/portals/driver",
    icon: <IconShield />,
  },
  {
    title: "Customer Portal",
    body: "Shipment visibility, proof, exceptions, and invoice readiness.",
    href: "/customer-portal/load-intake",
    icon: <IconLoadProof />,
  },
] as const;

const DEMO_CARDS = [
  { label: "Demo Dashboard", href: "/dashboard" },
  { label: "Command Center", href: "/command-center" },
  { label: "Dispatch Proof Workflow", href: "/dispatch" },
  { label: "Settlements & Factoring", href: "/settlements" },
  { label: "Safety & Claims", href: "/safety" },
  { label: "Driver Readiness", href: "/drivers" },
  { label: "Company Operations Vault", href: "/documents" },
  { label: "Maintenance", href: "/maintenance" },
] as const;

const COMMAND_CENTER_SIGNALS = [
  "Drivers at risk",
  "Loads at risk",
  "Claims exposure",
  "Compliance violations",
  "Money at risk",
] as const;

const BLOG_PREVIEWS = [
  {
    title: "Why trucking back offices need enforcement, not more dashboards",
    href: "/blog/enforcement-engine-trucking-back-office",
  },
  {
    title: "Why proof packets control settlement and cash flow",
    href: "/blog/proof-packets-settlements-cash-flow",
  },
  {
    title: "How driver readiness prevents dispatch failure",
    href: "/blog/driver-readiness-dispatch-failure",
  },
] as const;

export default function MarketingHomeAccountable() {
  const heroMetrics = getHeroMetrics();

  return (
    <main className="bof-home-redesign bg-slate-50 text-slate-950">
      <section id="hero" className="bof-home-hero" aria-labelledby="bof-mkt-hero-heading">
        <Image
          src="/generated/marketing/demoheroimage-v2.png"
          alt="Professional truck driver operating on the road at sunrise"
          fill
          priority
          sizes="100vw"
          className="bof-home-hero__image"
        />
        <div className="bof-home-hero__overlay" aria-hidden />
        <div className="bof-mkt-container bof-home-hero__content">
          <div className="bof-home-hero__copy">
            <p className="bof-home-eyebrow">Back-office operating system for trucking</p>
            <h1 id="bof-mkt-hero-heading">Become a Founding Fleet</h1>
            <p className="text-xl font-semibold leading-8 text-white md:text-2xl">
              Shape the Operating System That Will Run the Next Decade of Trucking
            </p>
            <p className="bof-home-hero__lead">
              The trucking back office is broken. BackOfficeFleet enforces the entire operational lifecycle — from
              driver readiness → load execution → proof → settlement → cash flow — and we’re inviting 10 fleets to
              help shape it.
            </p>
            <ul className="bof-home-proof-list" aria-label="What the live demo proves">
              <li>Enterprise-grade</li>
              <li>Enforcement-driven</li>
              <li>Founding Fleet access</li>
              <li>Premium partnership</li>
            </ul>
            <div className="bof-home-hero__ctas" aria-label="Primary actions">
              <Link href={FOUNDING_FLEET_HREF} className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
                Apply to Become a Founding Fleet
              </Link>
              <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
                Explore the Demo
              </Link>
            </div>
          </div>

          <aside className="bof-home-hero__panel" aria-label="Founding Fleet operating snapshot">
            <div className="bof-home-hero__panel-head">
              <span>Enforcement snapshot</span>
              <strong>Live demo</strong>
            </div>
            <div className="bof-home-hero__metric-grid">
              {heroMetrics.map((metric) => (
                <Link key={metric.label} href={metric.href} className="bof-home-hero__metric">
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </Link>
              ))}
            </div>
            <p>
              Every number opens the workflow that owns it: dispatch proof, driver blockers, settlement holds, safety
              exposure, and cash at risk.
            </p>
          </aside>
        </div>
      </section>

      <nav className="bof-home-demo-strip" aria-label="Demo entry points">
        <div className="bof-mkt-container bof-home-demo-strip__inner">
          <span>Explore the demo</span>
          <div>
            {DEMO_CARDS.slice(0, 6).map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <FreightCompliancePulse variant="compact" />

      <section id="why-exists" className="bof-home-section bof-home-section--white" aria-labelledby="bof-home-why-heading">
        <div className="bof-mkt-container grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="bof-home-eyebrow">Why BackOfficeFleet Exists</p>
            <h2 id="bof-home-why-heading">
              The trucking back office still runs on email, PDFs, spreadsheets, memory, disconnected dispatch tools,
              and reactive cleanup.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Fleets lose money every week because the operating record is scattered. BOF turns the chain of work into
              one enforced lifecycle: driver readiness → load execution → proof → settlement → cash flow.
            </p>
            <div className="mt-8 grid gap-3">
              {PAIN_POINTS.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-cyan-500" aria-hidden />
                  <p className="font-semibold text-slate-900">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-4 shadow-2xl">
            <Image
              src="/generated/marketing/operations-file-cabinet-watermark.png"
              alt="BackOfficeFleet operations file cabinet showing documents, proof packets, SOPs, and operating records"
              width={980}
              height={720}
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="h-auto w-full rounded-[1.35rem] border border-white/10 object-cover"
            />
            <div className="grid gap-3 pt-4 sm:grid-cols-3">
              {["Proof packets", "Driver files", "Settlement controls"].map((label) => (
                <span key={label} className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-2 text-center text-xs font-bold uppercase tracking-wide text-cyan-100">
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="enforcement-engine" className="bof-home-section bof-home-section--soft" aria-labelledby="bof-home-control-heading">
        <div className="bof-mkt-container">
          <div className="bof-home-section-head">
            <p className="bof-home-eyebrow">The Enforcement Engine</p>
            <h2 id="bof-home-control-heading">BackOfficeFleet doesn’t “help you manage” your back office — it enforces it.</h2>
            <p>
              Driver Readiness → Load Execution → Proof → Settlement → Cash Flow. Every workflow has a gate. Every
              gate has an owner. Every owner is accountable.
            </p>
          </div>
          <div className="grid gap-4 lg:grid-cols-5">
            {WORKFLOW_PANELS.map((item, index) => (
              <article key={item.title} className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-700">
                  {item.icon}
                </span>
                <h3>{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{item.body}</p>
                <p className="mt-4 rounded-xl bg-slate-100 p-3 text-xs font-bold uppercase tracking-wide text-slate-700">
                  {item.gate}
                </p>
                {index < WORKFLOW_PANELS.length - 1 ? (
                  <span className="absolute -right-3 top-1/2 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-cyan-500 text-sm font-black text-white lg:flex" aria-hidden>
                    →
                  </span>
                ) : null}
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="founding-fleet" className="bof-home-section bof-home-section--white" aria-labelledby="bof-home-founding-heading">
        <div className="bof-mkt-container">
          <div className="bof-home-section-head">
            <p className="bof-home-eyebrow">Founding Fleet Program</p>
            <h2 id="bof-home-founding-heading">Why Founding Fleets Matter</h2>
            <p>
              We’re building the operating system that will define the next decade of trucking operations — and we want
              the fleets who understand the stakes to help shape it. This is not a subscription. This is a strategic
              partnership.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {FOUNDING_BENEFITS.map((benefit) => (
              <div key={benefit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">{benefit}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link href={FOUNDING_FLEET_HREF} className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
              Apply to Become a Founding Fleet
            </Link>
          </div>
        </div>
      </section>

      <section id="portals" className="bof-home-section bof-home-section--soft" aria-labelledby="bof-home-portals-heading">
        <div className="bof-mkt-container">
          <div className="bof-home-section-head">
            <p className="bof-home-eyebrow">The Three Portals</p>
            <h2 id="bof-home-portals-heading">Every role sees the same operation through the right door.</h2>
            <p>
              Managers, drivers, and customers work from one enforced operating record, with the financial and
              operational visibility appropriate to each role.
            </p>
          </div>
          <div className="bof-home-capability-grid">
            {PORTALS.map((portal) => (
              <Link key={portal.title} href={portal.href} className="bof-home-capability-card">
                <span className="bof-home-capability-card__icon">{portal.icon}</span>
                <h3>{portal.title}</h3>
                <p>{portal.body}</p>
                <strong>Open portal &rarr;</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="vault" className="bof-home-section bof-home-section--white" aria-labelledby="bof-home-vault-heading">
        <div className="bof-mkt-container">
          <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="bof-home-eyebrow">Company Operations Vault</p>
              <h2 id="bof-home-vault-heading">Your entire operational brain — centralized, structured, and enforced.</h2>
              <p className="mt-5 text-lg leading-8 text-slate-600">
                Centralized SOPs, HR records, payroll procedures, compliance controls, safety documentation,
                audit-ready records, AI governance, and vendor controls.
              </p>
              <Link href="/documents" className="mt-8 inline-flex bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
                Open Document Vault
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {["Policies & SOPs", "HR records", "Payroll procedures", "Compliance controls", "Safety documentation", "Audit-ready records", "AI governance", "Vendor controls"].map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 font-semibold text-slate-900">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="financials" className="bof-home-section bof-home-section--soft" aria-labelledby="bof-home-financials-heading">
        <div className="bof-mkt-container grid items-center gap-8 lg:grid-cols-[1fr_0.95fr]">
          <div>
            <p className="bof-home-eyebrow">Fleet Financials</p>
            <h2 id="bof-home-financials-heading">A complete financial layer built for trucking.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              Load-level profitability, billing blockers, factoring visibility, settlement timing, cash-flow
              forecasting, and asset/debt allocation. Every dollar accounted for. Every exception enforced.
            </p>
            <Link href="/settlements" className="mt-8 inline-flex bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
              View Settlements & Factoring
            </Link>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
            {[
              ["Load-level profitability", "Margin and cost exposure by move"],
              ["Factoring visibility", "Packet readiness and blockers"],
              ["Settlement timing", "Driver pay, holds, and release status"],
              ["Cash-flow forecasting", "Money at risk before it drifts"],
            ].map(([title, body]) => (
              <div key={title} className="border-b border-slate-200 py-4 last:border-b-0">
                <p className="font-bold text-slate-950">{title}</p>
                <p className="text-sm text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="command-center" className="bof-home-section bof-home-section--ink" aria-labelledby="bof-mkt-cc-heading">
        <div className="bof-mkt-container grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="bof-home-eyebrow">Command Center</p>
            <h2 id="bof-mkt-cc-heading">Your entire operation — triaged and enforced.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">
              A real-time priority queue shows the operating risks that need ownership before they become lost money,
              customer escalations, or compliance exposure.
            </p>
            <Link href="/command-center" className="mt-8 inline-flex bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
              Open Command Center
            </Link>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
            <div className="grid gap-4 sm:grid-cols-2">
              {COMMAND_CENTER_SIGNALS.map((signal, index) => (
                <Link key={signal} href="/command-center" className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/60 hover:bg-cyan-300/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-300">
                  <span className="text-xs font-bold uppercase tracking-wide text-cyan-200">Signal {index + 1}</span>
                  <p className="mt-2 text-xl font-black text-white">{signal}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="demo-preview" className="bof-home-section bof-home-section--soft" aria-labelledby="bof-home-demo-heading">
        <div className="bof-mkt-container">
          <div className="bof-home-section-head">
            <p className="bof-home-eyebrow">Explore the BOF Demo</p>
            <h2 id="bof-home-demo-heading">Open the workflows that show the operating system in motion.</h2>
            <p>
              Each card opens a real demo route for dispatch proof, settlements, safety, driver readiness, operating
              documents, and fleet maintenance.
            </p>
          </div>
          <div className="bof-home-capability-grid">
            {DEMO_CARDS.map((card) => (
              <Link key={card.href} href={card.href} className="bof-home-capability-card">
                <h3>{card.label}</h3>
                <p>Open the live BOF workflow for this part of the operating system.</p>
                <strong>Explore &rarr;</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="blog-preview" className="bof-home-section bof-home-section--white" aria-labelledby="bof-home-blog-heading">
        <div className="bof-mkt-container">
          <div className="bof-home-section-head">
            <p className="bof-home-eyebrow">Fleet Intelligence</p>
            <h2 id="bof-home-blog-heading">Fleet Intelligence: Insights from the Enforcement Engine</h2>
            <p>
              Read the operating philosophy behind BOF: enforcement, proof control, driver readiness, and back-office
              modernization for serious fleets.
            </p>
          </div>
          <div className="bof-home-capability-grid">
            {BLOG_PREVIEWS.map((article) => (
              <Link key={article.href} href={article.href} className="bof-home-capability-card">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-600">
                  Fleet Intelligence
                </span>
                <h3>{article.title}</h3>
                <p>Read the full article in the Fleet Intelligence library.</p>
                <strong>Read article &rarr;</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section id="final-cta" className="bof-home-section bof-home-section--ink" aria-labelledby="bof-mkt-final-cta-heading">
        <div className="bof-mkt-container rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center shadow-2xl md:p-12">
          <p className="bof-home-eyebrow">Founding Fleet Program</p>
          <h2 id="bof-mkt-final-cta-heading">Join the 10 Fleets Shaping the Future of Back-Office Operations</h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Founding Fleets will help define the proof standards, release logic, workflows, and operating reports
            serious trucking companies will rely on next.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={FOUNDING_FLEET_HREF} className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
              Apply to Become a Founding Fleet
            </Link>
            <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
              Explore the Demo
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
