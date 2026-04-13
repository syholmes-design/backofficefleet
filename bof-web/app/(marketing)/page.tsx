import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "BackOfficeFleet | Operations & Compliance Command Center",
  description:
    "Compliance, dispatch, proof, and settlements in one command center for for-hire carriers. Not a fleet tracker.",
};

const HERO_TRUST = [
  "Dispatch Control",
  "Compliance Enforcement",
  "Proof That Gets You Paid",
  "Settlement Intelligence",
] as const;

function IconDocWarning() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M10 13h4M10 17h4" />
      <path d="M12 9v4" strokeLinecap="round" />
    </svg>
  );
}

function IconLoadProof() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
    </svg>
  );
}

function IconDispute() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" />
    </svg>
  );
}

function IconTruth() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" strokeLinecap="round" />
    </svg>
  );
}

function IconDispatch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 7h18M3 12h12M3 17h8" strokeLinecap="round" />
      <circle cx="18" cy="12" r="3" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconCamera() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function IconLedger() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8M8 11h8" strokeLinecap="round" />
    </svg>
  );
}

const PAIN_ITEMS = [
  {
    title: "Drivers with expired documents",
    text: "Credential gaps surface after the truck is already rolling.",
    Icon: IconDocWarning,
  },
  {
    title: "Loads without proper proof",
    text: "POD, seals, and photos live in inboxes—not on the load record.",
    Icon: IconLoadProof,
  },
  {
    title: "Disputes slowing down payment",
    text: "Finance waits while operations reconstruct what actually happened.",
    Icon: IconDispute,
  },
  {
    title: "No single source of truth",
    text: "Tools that track don’t enforce—leaders still guess where risk sits.",
    Icon: IconTruth,
  },
] as const;

const FEATURE_ITEMS = [
  {
    title: "Dispatch Control",
    text: "Assign drivers, track loads, enforce readiness",
    Icon: IconDispatch,
  },
  {
    title: "Compliance Enforcement",
    text: "Block non-compliant drivers before risk happens",
    Icon: IconShield,
  },
  {
    title: "Proof & POD System",
    text: "Photos, seals, GPS = verified delivery",
    Icon: IconCamera,
  },
  {
    title: "Settlement Intelligence",
    text: "Know what gets paid, what gets held, and why",
    Icon: IconLedger,
  },
] as const;

const CC_MOCK_ROWS = [
  {
    label: "Attention queue",
    title: "Drivers at risk",
    meta: "Expired med card · 2 dispatch blocks",
    val: "7",
    valClass: "" as const,
  },
  {
    label: "Loads",
    title: "Loads at risk",
    meta: "Open POD · seal mismatch",
    val: "4",
    valClass: "" as const,
  },
  {
    label: "Claims",
    title: "Claim exposure",
    meta: "Dispute-ready packet in progress",
    val: "$42K",
    valClass: "bof-mkt-cc-mock-kpi-val--warn" as const,
  },
  {
    label: "Compliance",
    title: "Compliance violations",
    meta: "Auditable enforcement events",
    val: "11",
    valClass: "" as const,
  },
  {
    label: "Finance",
    title: "Money at risk",
    meta: "Held pay · settlement blocks",
    val: "$128K",
    valClass: "bof-mkt-cc-mock-kpi-val--risk" as const,
  },
] as const;

const VALUE_PILLARS = [
  {
    title: "Faster Payments",
    text: "Proof and settlement signals stay aligned so releases happen with confidence.",
  },
  {
    title: "Fewer Disputes",
    text: "Structured evidence and next actions before disagreements harden.",
  },
  {
    title: "Compliance Enforcement",
    text: "Stop unqualified dispatch instead of discovering gaps after the fact.",
  },
  {
    title: "Executive Visibility",
    text: "One operations narrative—prioritized by severity and capital impact.",
  },
] as const;

export default function MarketingHomePage() {
  return (
    <>
      <section
        className="bof-mkt-hero-premium"
        aria-labelledby="bof-mkt-hero-heading"
      >
        <div className="bof-mkt-container bof-mkt-hero-premium-grid">
          <div className="bof-mkt-hero-premium-copy">
            <p className="bof-mkt-hero-premium-eyebrow">
              For-hire carriers · operations &amp; compliance
            </p>
            <h1 id="bof-mkt-hero-heading" className="bof-mkt-hero-premium-title">
              Run Your Trucking Operation Without Blind Spots
            </h1>
            <p className="bof-mkt-hero-premium-sub">
              Compliance, dispatch, proof, and settlements — all in one command
              center built for for-hire carriers.
            </p>
            <p className="bof-mkt-hero-premium-support">
              Stop chasing documents, missing proof, and compliance gaps. BOF
              enforces operations in real time.
            </p>
            <div className="bof-mkt-hero-premium-ctas">
              <Link
                href="/book-assessment"
                className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary"
              >
                Book Fleet Assessment
              </Link>
              <Link
                href="/dashboard"
                className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary"
              >
                Open Demo
              </Link>
            </div>
            <ul
              className="bof-mkt-hero-trust"
              aria-label="BOF capability highlights"
            >
              {HERO_TRUST.map((label) => (
                <li key={label}>
                  <span className="bof-mkt-hero-trust-mark" aria-hidden />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bof-mkt-hero-premium-visual">
            <div className="bof-mkt-hero-visual-card">
              <div className="bof-mkt-hero-visual-frame" aria-hidden>
                <div className="bof-mkt-hero-visual-header">
                  <span className="bof-mkt-hero-visual-dot" />
                  <span className="bof-mkt-hero-visual-dot" />
                  <span className="bof-mkt-hero-visual-dot" />
                  <span className="bof-mkt-hero-visual-title">
                    Operations command view
                  </span>
                </div>
                <div className="bof-mkt-hero-visual-body">
                  <div className="bof-mkt-hero-visual-row bof-mkt-hero-visual-row--accent" />
                  <div className="bof-mkt-hero-visual-row" />
                  <div className="bof-mkt-hero-visual-row" />
                  <div className="bof-mkt-hero-visual-row bof-mkt-hero-visual-row--muted" />
                </div>
              </div>
              <p className="bof-mkt-hero-visual-caption">
                Fleet and command-center imagery can replace this panel — layout
                reserved for photography or product UI.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        className="bof-mkt-section bof-mkt-section-light"
        id="pain"
        aria-labelledby="bof-mkt-pain-heading"
      >
        <div className="bof-mkt-container">
          <header className="bof-mkt-section-head">
            <h2 id="bof-mkt-pain-heading" className="bof-mkt-section-title">
              What You&apos;re Managing Today
            </h2>
            <p className="bof-mkt-section-lead">
              Modern trucking operations break down when compliance, proof,
              dispatch, and settlements live in different places.
            </p>
          </header>
          <ul className="bof-mkt-pain-grid-premium">
            {PAIN_ITEMS.map(({ title, text, Icon }) => (
              <li key={title} className="bof-mkt-pain-card-premium">
                <div className="bof-mkt-pain-card-premium-icon" aria-hidden>
                  <Icon />
                </div>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section
        className="bof-mkt-section bof-mkt-section-white"
        aria-labelledby="bof-mkt-product-heading"
      >
        <div className="bof-mkt-container">
          <header className="bof-mkt-section-head">
            <h2 id="bof-mkt-product-heading" className="bof-mkt-section-title">
              What BOF Does
            </h2>
            <p className="bof-mkt-section-lead">
              BOF enforces the operational controls carriers need to move freight,
              protect revenue, and reduce risk.
            </p>
          </header>
          <div className="bof-mkt-feature-grid-premium">
            {FEATURE_ITEMS.map(({ title, text, Icon }) => (
              <article key={title} className="bof-mkt-feature-card-premium">
                <div className="bof-mkt-feature-card-premium-icon" aria-hidden>
                  <Icon />
                </div>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        className="bof-mkt-section bof-mkt-section-alt bof-mkt-cc"
        aria-labelledby="bof-mkt-cc-heading"
      >
        <div className="bof-mkt-container">
          <div className="bof-mkt-cc-split">
            <div className="bof-mkt-cc-split-copy">
              <h2 id="bof-mkt-cc-heading" className="bof-mkt-cc-title">
                What Needs Attention Right Now
              </h2>
              <p className="bof-mkt-cc-lead">
                BOF gives operations leaders a real-time command center for
                compliance, proof, settlements, and financial risk.
              </p>
              <div className="bof-mkt-cc-split-foot">
                <Link href="/command-center" className="bof-mkt-inline-link">
                  Explore the command center in the demo →
                </Link>
              </div>
            </div>
            <div className="bof-mkt-cc-mock-wrap">
              <div className="bof-mkt-cc-mock" aria-label="Command center preview">
                <div className="bof-mkt-cc-mock-head">
                  <div className="bof-mkt-cc-mock-head-left">
                    <div className="bof-mkt-cc-mock-dots" aria-hidden>
                      <span className="bof-mkt-cc-mock-dot" />
                      <span className="bof-mkt-cc-mock-dot" />
                      <span className="bof-mkt-cc-mock-dot" />
                    </div>
                    <span className="bof-mkt-cc-mock-title">BOF Command Center</span>
                  </div>
                  <span className="bof-mkt-cc-mock-live">Live priority</span>
                </div>
                <div className="bof-mkt-cc-mock-body">
                  {CC_MOCK_ROWS.map((row) => (
                    <div key={row.title} className="bof-mkt-cc-mock-kpi">
                      <div>
                        <div className="bof-mkt-cc-mock-kpi-label">{row.label}</div>
                        <p className="bof-mkt-cc-mock-kpi-title">{row.title}</p>
                        <p className="bof-mkt-cc-mock-kpi-meta">{row.meta}</p>
                      </div>
                      <div
                        className={
                          row.valClass
                            ? `bof-mkt-cc-mock-kpi-val ${row.valClass}`
                            : "bof-mkt-cc-mock-kpi-val"
                        }
                      >
                        {row.val}
                      </div>
                    </div>
                  ))}
                  <p className="bof-mkt-cc-mock-foot">
                    Illustrative metrics — your operation surfaces its own queue,
                    owners, and next actions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="bof-mkt-section bof-mkt-section-light"
        aria-labelledby="bof-mkt-value-heading"
      >
        <div className="bof-mkt-container">
          <header className="bof-mkt-section-head">
            <h2 id="bof-mkt-value-heading" className="bof-mkt-section-title">
              Why Carriers Choose BOF
            </h2>
          </header>
          <div className="bof-mkt-value-grid">
            {VALUE_PILLARS.map(({ title, text }) => (
              <div key={title} className="bof-mkt-value-card">
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="bof-mkt-cta-final"
        aria-labelledby="bof-mkt-final-cta-heading"
      >
        <div className="bof-mkt-container bof-mkt-cta-final-inner">
          <h2 id="bof-mkt-final-cta-heading" className="bof-mkt-cta-final-title">
            See What BOF Would Surface In Your Operation
          </h2>
          <p className="bof-mkt-cta-final-lead">
            Book a fleet assessment and see where compliance gaps, proof failures,
            and revenue risk are slowing you down.
          </p>
          <div className="bof-mkt-hero-premium-ctas">
            <Link
              href="/book-assessment"
              className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary"
            >
              Book Fleet Assessment
            </Link>
            <Link
              href="/dashboard"
              className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary"
            >
              Open Demo
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
