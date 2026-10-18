"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MarketingCommandCenterPreview } from "@/components/marketing/MarketingCommandCenterPreview";
import { BOF_RUNTIME_LINKS } from "@/lib/marketing-runtime-links";

const DEMO_METRICS = [
  { label: "Drivers at Risk", value: 4, display: (n: number) => String(n), href: "/safety", hint: "Readiness / safety review" },
  { label: "Loads at Risk", value: 7, display: (n: number) => String(n), href: "/demo/dispatch", hint: "Load execution exceptions" },
  { label: "Claims Exposure", value: 82, display: (n: number) => `$${n}k`, href: "/rf-actions", hint: "Proof / claims queue" },
  { label: "Money at Risk", value: 214, display: (n: number) => `$${n}k`, href: "/money-at-risk", hint: "Settlement / cash holds" },
] as const;

const LIFECYCLE = [
  {
    stage: "Driver readiness",
    body: "Inputs, credentials, equipment, and people are ready before work starts.",
    href: "/demo/drivers",
    evidence: "CDL / med card / assignment eligibility",
    next: "Release only after readiness clears",
  },
  {
    stage: "Load execution",
    body: "Dispatch context, appointments, routes, and operating requirements stay connected.",
    href: "/demo/dispatch",
    evidence: "Assignment, trip release, pickup gate",
    next: "Blocked work stays owned",
  },
  {
    stage: "Proof",
    body: "Documents, photos, seals, POD, and exception evidence attach to the movement.",
    href: BOF_RUNTIME_LINKS.vault,
    evidence: "POD / seal / photo packet",
    next: "Missing proof holds settlement",
  },
  {
    stage: "Settlement",
    body: "Proof, holds, deductions, accessorials, and pay stay aligned.",
    href: "/demo/settlements",
    evidence: "Hold reason + owner",
    next: "Pay follows completed record",
  },
  {
    stage: "Cash flow",
    body: "Billing blockers, claims exposure, factoring readiness, and money at risk stay visible.",
    href: "/money-at-risk",
    evidence: "Exposure tied to the same load",
    next: "Cash waits on resolved proof",
  },
] as const;

const CC_ROWS = [
  {
    label: "Readiness",
    title: "Driver readiness issue",
    meta: "Illustrative: HOS coaching hold · owner Safety",
    val: "HOLD",
    valClass: "bof-mkt-cc-mock-kpi-val--warn",
    href: "/safety",
  },
  {
    label: "Load",
    title: "Load exception",
    meta: "Illustrative: L001 proof packet needs closeout",
    val: "L001",
    valClass: "bof-mkt-cc-mock-kpi-val--warn",
    href: "/demo/loads",
  },
  {
    label: "Proof",
    title: "Proof gap",
    meta: "Illustrative: missing POD blocks settlement",
    val: "GAP",
    valClass: "bof-mkt-cc-mock-kpi-val--risk",
    href: BOF_RUNTIME_LINKS.vault,
  },
  {
    label: "Settlement",
    title: "Settlement hold",
    meta: "Illustrative: QR lumper closeout · $180",
    val: "$180",
    valClass: "bof-mkt-cc-mock-kpi-val--warn",
    href: "/demo/settlements",
  },
  {
    label: "Cash",
    title: "Cash exposure",
    meta: "Illustrative: money at risk remains attached to the load",
    val: "MAR",
    valClass: "bof-mkt-cc-mock-kpi-val--risk",
    href: "/money-at-risk",
  },
] as const;

function prefersReducedMotion() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function useDemoCount(target: number) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    let frame = 0;
    const steps = 22;
    const id = window.setInterval(() => {
      frame += 1;
      setValue(Math.round((target * frame) / steps));
      if (frame >= steps) window.clearInterval(id);
    }, 42);
    return () => window.clearInterval(id);
  }, [target]);
  return value;
}

function DemoMetric({
  label,
  target,
  display,
  href,
  hint,
}: {
  label: string;
  target: number;
  display: (n: number) => string;
  href: string;
  hint: string;
}) {
  const n = useDemoCount(target);
  return (
    <Link href={href} className="bof-home-hero__metric">
      <span>{label}</span>
      <strong>{display(n)}</strong>
      <em className="bof-home-hero__metric-hint">{hint}</em>
    </Link>
  );
}

/** The five service areas: each opens its service page, which leads on to the detail pages and demos. */
const HERO_PROOF = [
  ["Recruiting & onboarding", "/business-operations/driver-onboarding"],
  ["Qualification & compliance", "/services/drivers"],
  ["Dispatch administration", "/services/dispatch"],
  ["Documentation & vault", "/services/documents"],
  ["Settlements & payroll support", "/services/settlements"],
] as const;

const HERO_PATH = [
  ["Capabilities", "#capabilities"],
  ["Trip lifecycle", "#trip-lifecycle"],
  ["Savings model", "/fleet-savings"],
  ["Interactive demo", "/interactive-demo"],
  ["Take the Assessment", "/assessment"],
] as const;

export function MarketingHomeHeroExperience() {
  return (
    <>
      <section id="hero" className="bof-home-hero bof-home-hero--services" aria-labelledby="bof-mkt-hero-heading">
        <div className="bof-mkt-container bof-home-hero__content bof-home-hero__content--services">
          <div className="bof-home-hero__copy">
            <p className="bof-home-eyebrow">Outsourced transportation back-office operations</p>
            <h1 id="bof-mkt-hero-heading">Enterprise back-office operations for aggregators and carriers</h1>
            <p className="bof-home-hero__subhead">
              BackOfficeFleet performs centralized recruiting, compliance, dispatch administration, documentation,
              safety, settlements, and financial support—so networks scale without duplicating admin teams.
            </p>
            <p className="bof-home-hero__lead">
              Dispatch stays with the carrier. BOF does not become the broker, marketplace, or motor carrier of record.
              Technology supports our operators; the service is managed back-office execution.
            </p>
            <ul className="bof-home-proof-list" aria-label="Core service areas">
              {HERO_PROOF.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} data-testid="home-service-card">
                    {label} <span aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="bof-home-hero__ctas" aria-label="Primary actions">
              <Link href="/assessment" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary" data-testid="home-take-assessment">
                Take the Assessment
              </Link>
              <Link href="/contact" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
                Contact BOF
              </Link>
              <Link href="#capabilities" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
                View capabilities
              </Link>
            </div>
            <nav className="bof-home-hero__ctas" aria-label="Homepage sections">
              <Link href="/aggregators" className="bof-home-hero__text-link">
                For aggregators
              </Link>
              <Link href="#demo-the-difference" className="bof-home-hero__text-link">
                See sample workflows
              </Link>
              <Link href="#we-save-you-money" className="bof-home-hero__text-link">
                Savings estimate
              </Link>
            </nav>
          </div>
          <figure className="bof-home-hero__figure">
            <div className="bof-home-hero__visual-media">
              <Image
                src="/approved/bofhero.png"
                alt="Commercial truck on a highway at sunrise, representing active fleet operations"
                fill
                priority
                sizes="(max-width: 959px) 92vw, 46vw"
                className="bof-home-hero__image"
              />
            </div>
            <figcaption className="bof-home-hero__caption">
              Field operations stay with your carriers. BOF runs the back office that keeps them qualified, documented,
              and paid.
            </figcaption>
          </figure>
        </div>
      </section>
      <nav className="bof-home-hero-strip" aria-label="Explore the homepage">
        <div className="bof-mkt-container bof-home-hero-strip__inner">
          {HERO_PATH.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}

export function MarketingHomeDemoSnapshot() {
  return (
    <div className="bof-home-hero__panel">
      <div className="bof-home-hero__panel-head">
        <span>Sample operating snapshot</span>
        <strong>Not live fleet data</strong>
      </div>
      <div className="bof-home-hero__metric-grid">
        {DEMO_METRICS.map((metric) => (
          <DemoMetric
            key={metric.label}
            label={metric.label}
            target={metric.value}
            display={metric.display}
            href={metric.href}
            hint={metric.hint}
          />
        ))}
      </div>
      <p>These counts are a labeled sample. They are not production fleet totals. Each card opens an existing BOF route.</p>
    </div>
  );
}

export function MarketingHomeLifecycle() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section id="what-bof-operates" className="bof-home-section bof-home-section--white" aria-labelledby="what-bof-operates-heading">
      <div className="bof-mkt-container">
        <div className="bof-home-section-head">
          <p className="bof-home-eyebrow">What BOF operates</p>
          <h2 id="what-bof-operates-heading">Administrative work tied to each movement</h2>
          <p>From readiness through cash—one accountable record instead of disconnected admin queues.</p>
        </div>
        <ol className="bof-home-timeline">
          {LIFECYCLE.map((item, index) => (
            <li
              key={item.stage}
              className={`bof-home-timeline__item${open === item.stage ? " is-open" : ""}`}
              onMouseEnter={() => setOpen(item.stage)}
              onMouseLeave={() => setOpen(null)}
              onFocus={() => setOpen(item.stage)}
              onBlur={() => setOpen(null)}
            >
              <span>0{index + 1}</span>
              <strong>{item.stage}</strong>
              <p>{item.body}</p>
              <p className="bof-home-timeline__evidence">
                Evidence: {item.evidence}. Next: {item.next}.
              </p>
              <Link href={item.href}>Open existing workflow</Link>
              {index < LIFECYCLE.length - 1 ? <i aria-hidden>→</i> : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function MarketingHomeCommandPreview() {
  return (
    <section id="demo-the-difference" className="bof-home-section bof-home-section--soft" aria-labelledby="demo-difference-heading">
      <div className="bof-mkt-container mb-8">
        <div className="bof-home-section-head">
          <p className="bof-home-eyebrow">Demo the difference</p>
          <h2 id="demo-difference-heading">A sample operating picture, labeled as a sample.</h2>
          <p>The counts below are illustrative. They are not a live customer fleet and they are not production totals.</p>
        </div>
        <MarketingHomeDemoSnapshot />
        <MarketingHomeDemoFilm />
      </div>
      <MarketingCommandCenterPreview
        rows={CC_ROWS}
        headingId="demo-command-heading"
        title="Information becomes action when the operating layer owns the next move."
        lead="Supporting technology helps BOF operators see signals and assign next actions. This preview uses existing BOF demo routes—it is not a live production fleet feed."
        demoHref="/dashboard"
        demoLabel="Open the demo lobby"
        statusBadge="Demo snapshot"
      />
      <div className="bof-mkt-container mt-4">
        <Link href="/demo/command-center" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
          Open the DEMO Command Center
        </Link>
      </div>
    </section>
  );
}

const WORKFLOW_CARDS = [
  { stage: "01 Ready", title: "Drivers", href: "/demo/drivers", evidence: "Readiness, credentials, assignment eligibility" },
  { stage: "02 Load", title: "Dispatch", href: "/demo/dispatch", evidence: "Execution exceptions and trip ownership" },
  { stage: "03 Proof", title: "Operations Vault", href: "/bof-vault", evidence: "POD, seals, photos, document packet" },
  { stage: "04 Settle", title: "Settlements", href: "/demo/settlements", evidence: "Holds, deductions, pay alignment" },
  { stage: "05 Cash", title: "Money at risk", href: "/money-at-risk", evidence: "Exposure attached to the same load" },
  { stage: "06 Tower", title: "Command Center", href: "/demo/command-center", evidence: "Signals with owner and next action" },
] as const;

const DEMO_FILMS = [
  { name: "bof-aggregator.mp4", poster: "bof-aggregator.jpg", label: "Aggregator network" },
  { name: "bof-fleet-owner.mp4", poster: "bof-fleet-owner.jpg", label: "Fleet owner" },
  { name: "bof-business-operations.mp4", poster: "bof-business-operations.jpg", label: "Business operations" },
  { name: "bof-driver-vault.mp4", poster: "bof-driver-vault.jpg", label: "Driver vault" },
  { name: "bof-customer-portal-load-intake.mp4", poster: "bof-customer-portal-load-intake.jpg", label: "Load intake" },
] as const;

function demoMediaUrl(name: string) {
  return `/api/marketing-demo-media?name=${encodeURIComponent(name)}`;
}

function MarketingHomeDemoFilm() {
  const [active, setActive] = useState<(typeof DEMO_FILMS)[number]>(DEMO_FILMS[0]);
  return (
    <div className="bof-home-film">
      <div className="bof-home-section-head">
        <p className="bof-home-eyebrow">Existing BOF demonstrations</p>
        <h3>Watch the operating walkthroughs already produced for BOF.</h3>
        <p>These are the existing BOF demonstration videos, including the aggregator walkthrough. They are not a separate analytics recording.</p>
      </div>
      <video
        key={active.name}
        className="bof-home-film__player"
        controls
        preload="none"
        poster={demoMediaUrl(active.poster)}
        aria-label={active.label}
      >
        <source src={demoMediaUrl(active.name)} type="video/mp4" />
      </video>
      <div className="bof-home-film__choices" role="group" aria-label="Choose a demonstration">
        {DEMO_FILMS.map((film) => (
          <button
            key={film.name}
            type="button"
            aria-pressed={film.name === active.name}
            onClick={() => setActive(film)}
          >
            {film.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MarketingHomeWorkflowCards() {
  return (
    <section id="workflows" className="bof-home-section bof-home-section--ink" aria-labelledby="workflows-heading">
      <div className="bof-mkt-container">
        <div className="bof-home-section-head bof-home-section-head--inverse">
          <p className="bof-home-eyebrow">Operating workflows</p>
          <h2 id="workflows-heading">Every number opens the workflow that owns it.</h2>
          <p>These cards use existing BOF demo/runtime routes. Hover to see the evidence that belongs to that stage.</p>
        </div>
        <div className="bof-home-workflow">
          {WORKFLOW_CARDS.map((card, index) => (
            <Link key={card.title} href={card.href} className="bof-home-workflow__step">
              <span>{card.stage}</span>
              <strong>{card.title}</strong>
              <em className="bof-home-workflow__evidence">{card.evidence}</em>
              {index < WORKFLOW_CARDS.length - 1 ? <i aria-hidden>→</i> : null}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
