"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MarketingCommandCenterPreview } from "@/components/marketing/MarketingCommandCenterPreview";
import { BOF_RUNTIME_LINKS } from "@/lib/marketing-runtime-links";

const DEMO_METRICS = [
  { label: "Drivers at Risk", value: 4, display: (n: number) => String(n), href: "/safety", hint: "Readiness / safety review" },
  { label: "Loads at Risk", value: 7, display: (n: number) => String(n), href: BOF_RUNTIME_LINKS.dispatch, hint: "Load execution exceptions" },
  { label: "Claims Exposure", value: 82, display: (n: number) => `$${n}k`, href: "/rf-actions", hint: "Proof / claims queue" },
  { label: "Money at Risk", value: 214, display: (n: number) => `$${n}k`, href: "/money-at-risk", hint: "Settlement / cash holds" },
] as const;

const LIFECYCLE = [
  {
    stage: "Driver readiness",
    body: "Inputs, credentials, equipment, and people are ready before work starts.",
    href: "/drivers",
    evidence: "CDL / med card / assignment eligibility",
    next: "Release only after readiness clears",
  },
  {
    stage: "Load execution",
    body: "Dispatch context, appointments, routes, and operating requirements stay connected.",
    href: BOF_RUNTIME_LINKS.dispatch,
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
    href: "/settlements",
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
    href: "/loads/L001",
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
    href: "/settlements",
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

function BrandS() {
  return (
    <svg className="bof-home-s" viewBox="0 0 220 280" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="bofHomeSFill" x1="20%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#ecfeff" />
          <stop offset="32%" stopColor="#5eead4" />
          <stop offset="68%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#0f766e" />
        </linearGradient>
        <linearGradient id="bofHomeSSheen" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
          <stop offset="40%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
        <filter id="bofHomeSGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        filter="url(#bofHomeSGlow)"
        fill="url(#bofHomeSFill)"
        d="M168 58c-8-22-32-40-72-40-48 0-78 24-82 62-3 32 16 50 58 64l36 12c22 8 30 16 28 30-2 18-18 28-46 28-32 0-50-12-56-34l-38 8c10 42 48 66 96 66 54 0 88-26 94-68 6-40-18-60-64-76l-34-12c-20-7-28-15-26-28 2-16 16-24 40-24 24 0 40 10 46 30z"
      />
      <path
        fill="url(#bofHomeSSheen)"
        d="M96 28c38 0 62 16 70 40-8-8-22-16-44-16-30 0-50 12-54 34-2 10 0 18 8 26-28-10-40-28-38-52 4-22 24-32 58-32z"
      />
    </svg>
  );
}

export function MarketingHomeHeroExperience() {
  return (
    <section id="hero" className="bof-home-hero" aria-labelledby="bof-mkt-hero-heading">
      <Image
        src="/approved/bofhero.png"
        alt="Professional truck driver operating on the road at sunrise"
        fill
        priority
        sizes="100vw"
        className="bof-home-hero__image"
      />
      <div className="bof-home-hero__overlay" aria-hidden />
      <div className="bof-mkt-container bof-home-hero__content">
        <div className="bof-home-hero__copy">
          <p className="bof-home-eyebrow">BackOfficeFleet · CONTROL • COMPLY • CLEAR</p>
          <h1 id="bof-mkt-hero-heading">The Operating Layer for Transportation Businesses</h1>
          <p className="text-xl font-semibold leading-8 text-white md:text-2xl">
            Connect the systems, people, proof, and decisions that keep transportation moving.
          </p>
          <p className="bof-home-hero__lead">
            BOF gives carriers, private fleets, aggregators, brokers, and logistics companies one operating environment
            for readiness, load execution, compliance, exceptions, documentation, settlements, and cash flow.
          </p>
          <p className="bof-home-hero__flow-line" aria-hidden>
            Driver readiness → Load execution → Proof → Settlement → Cash flow
          </p>
          <div className="bof-home-hero__ctas" aria-label="Primary actions">
            <Link href="/book-assessment" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
              Request a BOF Assessment
            </Link>
            <Link href={BOF_RUNTIME_LINKS.dashboard} className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
              See BOF in Action
            </Link>
          </div>
        </div>
        <div className="bof-home-hero__visual">
          <div className="bof-home-hero__signal" aria-hidden>
            <span className="bof-home-hero__signal-node" data-stage="Ready" />
            <span className="bof-home-hero__signal-node" data-stage="Load" />
            <span className="bof-home-hero__signal-node" data-stage="Proof" />
            <span className="bof-home-hero__signal-node" data-stage="Settle" />
            <span className="bof-home-hero__signal-node" data-stage="Cash" />
          </div>
          <div className="bof-home-hero__panel">
            <div className="bof-home-hero__panel-head">
              <span>Demo operating snapshot</span>
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
            <p>Hover a metric for the owning workflow. Click opens the existing BOF route. Values are a labeled demo snapshot, not production counts.</p>
          </div>
          <BrandS />
        </div>
      </div>
    </section>
  );
}

export function MarketingHomeLifecycle() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section id="what-bof-operates" className="bof-home-section bof-home-section--white" aria-labelledby="what-bof-operates-heading">
      <div className="bof-mkt-container">
        <div className="bof-home-section-head">
          <p className="bof-home-eyebrow">What BOF operates</p>
          <h2 id="what-bof-operates-heading">The operating environment behind every movement</h2>
          <p>One enforced record from readiness through cash — not five disconnected tools.</p>
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
    <section id="command-center" className="bof-home-section bof-home-section--soft" aria-labelledby="command-center-heading">
      <MarketingCommandCenterPreview
        rows={CC_ROWS}
        headingId="command-center-heading"
        title="Information becomes action when the operating layer owns the next move."
        lead="The Command Center is where transportation signals become accountable decisions, not just another dashboard. This is an illustrative demo surface using existing BOF demo routes — not a live production fleet feed. Each row has a status, an owner workflow, and a next action."
        demoHref={BOF_RUNTIME_LINKS.commandCenter}
        demoLabel="Explore the Command Center"
        statusBadge="Demo snapshot"
      />
    </section>
  );
}

const WORKFLOW_CARDS = [
  { stage: "01 Ready", title: "Drivers", href: "/drivers", evidence: "Readiness, credentials, assignment eligibility" },
  { stage: "02 Load", title: "Dispatch", href: BOF_RUNTIME_LINKS.dispatch, evidence: "Execution exceptions and trip ownership" },
  { stage: "03 Proof", title: "Operations Vault", href: BOF_RUNTIME_LINKS.vault, evidence: "POD, seals, photos, document packet" },
  { stage: "04 Settle", title: "Settlements", href: "/settlements", evidence: "Holds, deductions, pay alignment" },
  { stage: "05 Cash", title: "Money at risk", href: "/money-at-risk", evidence: "Exposure attached to the same load" },
  { stage: "06 Tower", title: "Command Center", href: BOF_RUNTIME_LINKS.commandCenter, evidence: "Signals with owner and next action" },
] as const;

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
