/**
 * BOF Shared Component:
 * Used by: / (via app/(marketing)/page.tsx)
 * Do not edit for one page unless props/page-specific overrides are used.
 * See docs/BOF_ROUTE_MAP.md.
 */
import Link from "next/link";
import Image from "next/image";
import { MarketingCommandCenterPreview, MarketingCtaPanel } from "@/components/marketing";
import { IconDispatch, IconLoadProof, IconShield } from "@/components/marketing/MarketingHomeIcons";
import { getBofData } from "@/lib/load-bof-data";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BackOfficeFleet | Founding Fleet Back-Office Enforcement Engine",
  description:
    "BackOfficeFleet is the back-office enforcement engine for serious fleets, unifying readiness, dispatch, proof, settlements, compliance, and cash flow.",
};

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


const FEATURE_STRIP = [
  {
    title: "Enforcement",
    body: "Every workflow has a gate. Every gate has an owner.",
  },
  {
    title: "Accountability",
    body: "Every owner is accountable. Nothing falls through.",
  },
  {
    title: "Visibility",
    body: "Real-time visibility across your entire operation.",
  },
  {
    title: "Profitability",
    body: "Eliminate drift, disputes, and revenue leakage.",
  },
  {
    title: "Compliance",
    body: "Stay audit-ready. Stay ahead of risk.",
  },
  {
    title: "Cash Flow",
    body: "Protect cash flow and accelerate settlements.",
  },
] as const;

const PAIN_POINTS = [
  "Drivers are not ready when loads are ready",
  "Proof is missing or late",
  "Settlements drift",
  "Customers escalate preventable issues",
  "Customers cannot escalate without documented history",
  "Compliance gaps go unnoticed",
  "No one owns the workflow end-to-end",
] as const;

const ENFORCEMENT_RULES = [
  {
    step: "01",
    title: "Load gates",
    body: "Loads cannot progress without required proof, route context, and accountable ownership.",
    href: "/dispatch/intake",
  },
  {
    step: "02",
    title: "Driver gates",
    body: "Drivers cannot start work without compliance readiness, document clearance, and dispatch eligibility.",
    href: "/drivers",
  },
  {
    step: "03",
    title: "Settlement gates",
    body: "Settlements cannot release with unresolved proof gaps, holds, claims, or compliance exceptions.",
    href: "/settlements",
  },
  {
    step: "04",
    title: "Compliance gates",
    body: "Expirations, missing files, and safety events trigger action queues before drift becomes exposure.",
    href: "/command-center",
  },
] as const;

const FOUNDING_BENEFITS = [
  "Locked-in lifetime pricing",
  "Direct influence on workflows and enforcement logic",
  "Early access to unreleased modules",
  "Priority onboarding and white-glove support",
  "Co-development sessions with the product team",
  "Operational data insights and reporting",
  "Founding Fleet badge and logo placement",
  "A competitive advantage other fleets will not have for years",
] as const;

const PORTALS = [
  {
    title: "Manager Portal",
    body: "Your command center for dispatch, compliance, settlements, exceptions, and cash flow. Real-time visibility. Zero drift. Full accountability.",
    href: "/portals/manager",
    icon: <IconDispatch />,
  },
  {
    title: "Driver Portal",
    body: "Assignments, documents, readiness, settlements, and communication - all enforced, all in one place.",
    href: "/portals/driver",
    icon: <IconShield />,
  },
  {
    title: "Customer Portal",
    body: "Shipment visibility, proof, exceptions, and invoice readiness. Professional. Transparent. Audit-ready.",
    href: "/portals/customer",
    icon: <IconLoadProof />,
  },
] as const;

const OPERATING_LAYERS = [
  {
    title: "Company Operations Vault",
    body: "Your entire operational brain - centralized, structured, and enforced. Policies, SOPs, HR records, payroll procedures, compliance controls, safety documentation, audit-ready records, AI governance, and vendor controls.",
    href: "/documents",
    icon: <IconLoadProof />,
    cta: "Open the vault",
  },
  {
    title: "Fleet Financials",
    body: "A financial layer built for trucking: load-level profitability, cash-flow forecasting, factoring visibility, billing blockers, settlement timing, and asset and debt allocation.",
    href: "/settlements",
    icon: <IconDispatch />,
    cta: "Review settlement controls",
  },
  {
    title: "Command Center",
    body: "A real-time priority queue showing drivers at risk, loads at risk, claims exposure, compliance violations, and money at risk. Your entire operation - triaged and enforced.",
    href: "/command-center",
    icon: <IconShield />,
    cta: "Open command center",
  },
] as const;

const DEMO_CARDS = [
  { label: "Command Center", href: "/command-center" },
  { label: "Dispatch Proof Workflow", href: "/dispatch" },
  { label: "Settlements & Factoring", href: "/settlements" },
  { label: "Safety & Claims", href: "/safety" },
  { label: "Driver Readiness", href: "/drivers" },
  { label: "Company Operations Vault", href: "/documents" },
  { label: "Maintenance", href: "/maintenance" },
] as const;

export default function MarketingHomeAccountable() {
  const heroMetrics = getHeroMetrics();

  return (
    <main className="bof-home-redesign">
      <section className="bof-home-hero" aria-labelledby="bof-mkt-hero-heading">
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
            <p className="bof-home-eyebrow">Become a Founding Fleet</p>
            <h1 id="bof-mkt-hero-heading">Shape the Operating System That Will Run the Next Decade of Trucking</h1>
            <p className="bof-home-hero__lead">
              BackOfficeFleet is not a TMS, not a dispatch service, and not ordinary SaaS. It is the back-office
              enforcement engine for serious fleets.
            </p>
            <p className="bof-home-hero__lead">
              The trucking back office is broken - scattered tools, manual processes, missing proof, settlement drift,
              compliance gaps, and constant fire drills.
            </p>
            <p className="bof-home-hero__lead">
              BackOfficeFleet is the first enforcement-driven operating system that unifies the entire back-office
              lifecycle - and we are inviting 10 fleets to help shape it.
            </p>
            <div className="bof-home-hero__ctas" aria-label="Primary actions">
              <Link href="/apply" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
                Apply to Become a Founding Fleet
              </Link>
              <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
                Explore the Demo
              </Link>
            </div>
          </div>

          <aside className="bof-home-hero__panel" aria-label="Founding Fleet operating snapshot">
            <div className="bof-home-hero__panel-head">
              <span>Command Center</span>
              <strong>Live</strong>
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

      <section className="bg-[#071827] text-white" aria-label="BackOfficeFleet operating advantages">
        <div className="bof-mkt-container grid gap-4 py-6 md:grid-cols-3 xl:grid-cols-6">
          {FEATURE_STRIP.map((item) => (
            <div key={item.title} className="border-white/10 md:border-r md:pr-4">
              <p className="text-sm font-bold uppercase tracking-wide text-sky-300">{item.title}</p>
              <p className="mt-1 text-sm leading-5 text-slate-200">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bof-home-demo-strip" aria-label="Demo entry points">
        <div className="bof-mkt-container bof-home-demo-strip__inner">
          <span>Explore the BOF Demo</span>
          <div>
            {DEMO_CARDS.slice(0, 6).map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bof-home-section bof-home-section--white" aria-labelledby="bof-home-why-heading">
        <div className="bof-mkt-container">
          <div className="bof-home-section-head">
            <p className="bof-home-eyebrow">Why BackOfficeFleet Exists</p>
            <h2 id="bof-home-why-heading">The back office is the last part of trucking still running on email, PDFs, and human memory.</h2>
            <p>
              Fleets lose money every week because work moves faster than the back office can enforce it.
            </p>
          </div>
          <div className="bof-home-flow-grid">
            {PAIN_POINTS.map((item, index) => (
              <article key={item} className="bof-home-flow-card">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{item}</h3>
                <p>BOF turns this gap into an owned workflow with visibility, evidence, and release logic.</p>
              </article>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-teal-200 bg-teal-50 p-6 text-slate-900">
            <p className="text-lg font-semibold">
              BackOfficeFleet enforces the entire operational lifecycle - driver readiness → load execution → proof →
              settlement → cash flow.
            </p>
            <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-teal-800">
              This is not a TMS. This is not a dispatch service. This is the back-office enforcement engine.
            </p>
          </div>
        </div>
      </section>

      <section className="bof-home-section bof-home-section--soft" aria-labelledby="bof-home-control-heading">
        <div className="bof-mkt-container">
          <div className="bof-home-section-head">
            <p className="bof-home-eyebrow">The Enforcement Engine</p>
            <h2 id="bof-home-control-heading">BackOfficeFleet does not just help you manage your back office. It enforces it.</h2>
            <p>
              Every workflow has a gate. Every gate has an owner. Every owner is accountable. This is how fleets
              eliminate drift, disputes, and revenue leakage.
            </p>
          </div>
          <div className="bof-home-flow-grid">
            {ENFORCEMENT_RULES.map((item) => (
              <Link key={item.title} href={item.href} className="bof-home-flow-card">
                <span>{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <strong>Open enforcement path &rarr;</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bof-home-section bof-home-section--white" aria-labelledby="bof-home-founding-heading">
        <div className="bof-mkt-container">
          <div className="bof-home-section-head">
            <p className="bof-home-eyebrow">Why Founding Fleets Matter</p>
            <h2 id="bof-home-founding-heading">Help shape the operating system that will define the next decade of trucking operations.</h2>
            <p>
              We want the fleets who understand the stakes to help shape it. This is not a subscription. This is a
              strategic partnership.
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
            <Link href="/apply" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
              Apply to Become a Founding Fleet
            </Link>
          </div>
        </div>
      </section>

      <section className="bof-home-section bof-home-section--soft" aria-labelledby="bof-home-portals-heading">
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

      <section className="bof-home-section bof-home-section--white" aria-labelledby="bof-home-layers-heading">
        <div className="bof-mkt-container">
          <div className="bof-home-section-head">
            <p className="bof-home-eyebrow">Operating Layers</p>
            <h2 id="bof-home-layers-heading">Vault, financials, and command center in one enforced system.</h2>
            <p>
              BackOfficeFleet turns the back office into a structured, clickable system of record instead of a
              collection of unmanaged files and conversations.
            </p>
          </div>
          <div className="bof-home-capability-grid">
            {OPERATING_LAYERS.map((item) => (
              <Link key={item.title} href={item.href} className="bof-home-capability-card">
                <span className="bof-home-capability-card__icon">{item.icon}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <strong>{item.cta} &rarr;</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bof-home-section bof-home-section--ink" aria-labelledby="bof-mkt-cc-heading">
        <MarketingCommandCenterPreview
          headingId="bof-mkt-cc-heading"
          title="Your entire operation - triaged and enforced."
          lead="The command center shows drivers at risk, loads at risk, claims exposure, compliance violations, and money at risk in one real-time priority queue."
          demoLabel="Open the command center &rarr;"
        />
      </section>

      <section className="bof-home-section bof-home-section--soft" aria-labelledby="bof-home-demo-heading">
        <div className="bof-mkt-container">
          <div className="bof-home-section-head">
            <p className="bof-home-eyebrow">Explore the BOF Demo</p>
            <h2 id="bof-home-demo-heading">Open the workflows that show the enforcement engine in motion.</h2>
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

      <MarketingCtaPanel
        id="bof-mkt-final-cta-heading"
        title="Join the 10 Fleets Shaping the Future of Back-Office Operations"
        lead="Founding Fleets will help define the enforcement logic, workflows, and operating standards that serious trucking companies will rely on next."
      >
        <Link href="/apply" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
          Apply to Become a Founding Fleet
        </Link>
        <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
          Explore the Demo
        </Link>
      </MarketingCtaPanel>
    </main>
  );
}
