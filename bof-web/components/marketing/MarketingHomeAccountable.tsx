/**
 * BOF Shared Component:
 * Used by: / (via app/(marketing)/page.tsx)
 * Do not edit for one page unless props/page-specific overrides are used.
 * See docs/BOF_ROUTE_MAP.md.
 */
import Link from "next/link";
import Image from "next/image";
import { MarketingCommandCenterPreview, MarketingCtaPanel, MarketingServiceTiers } from "@/components/marketing";
import { BookDemoLink } from "@/components/BookDemoLink";
import { IconDispatch, IconLoadProof, IconShield } from "@/components/marketing/MarketingHomeIcons";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BackOfficeFleet | The Complete Back-Office Operating System for Trucking",
  description:
    "BOF is the back-office operating system that unifies dispatch, driver management, fleet financials, compliance, customer communication, proof, and settlement workflows.",
};

const HERO_METRICS = [
  { label: "Loads Ready", value: "24", href: "/dispatch" },
  { label: "Needs Action", value: "8", href: "/command-center" },
  { label: "Settlement Holds", value: "6", href: "/settlements" },
  { label: "Readiness", value: "82%", href: "/dispatch" },
] as const;

const OPERATING_FLOW = [
  {
    step: "01",
    title: "Intake the load",
    body: "Capture customer requirements, route context, driver fit, equipment needs, and billing terms before dispatch commits.",
    href: "/dispatch/intake",
  },
  {
    step: "02",
    title: "Release dispatch",
    body: "Validate driver readiness, route support, fuel planning, compliance blockers, and proof requirements.",
    href: "/dispatch",
  },
  {
    step: "03",
    title: "Control proof",
    body: "Tie BOL, POD, seal, RFID, photos, detention, and claims evidence to the load lifecycle.",
    href: "/documents",
  },
  {
    step: "04",
    title: "Close settlement",
    body: "Review gross pay, deductions, reimbursements, holds, safety events, and final net pay from the same record.",
    href: "/settlements",
  },
] as const;

const CAPABILITIES = [
  {
    title: "Dispatch and Exceptions",
    body: "Load readiness, driver assignment, route support, fuel stops, rest stops, and exception ownership.",
    href: "/dispatch",
    icon: <IconDispatch />,
  },
  {
    title: "Driver and HR Readiness",
    body: "Driver files, credentials, HR/payroll records, emergency contacts, compliance gaps, and dispatch eligibility.",
    href: "/drivers",
    icon: <IconShield />,
  },
  {
    title: "Documents and Proof",
    body: "BOL, POD, invoices, rate confirmations, claim packets, safety evidence, and operating vault records.",
    href: "/documents",
    icon: <IconLoadProof />,
  },
  {
    title: "Settlements and Payroll",
    body: "Gross-to-net review, deductions, reimbursements, backhaul pay, bonuses, holds, and settlement release.",
    href: "/settlements",
    icon: <IconLoadProof />,
  },
  {
    title: "Safety and Risk",
    body: "Driver scorecards, event queues, corrective action, dispatch holds, claims exposure, and evidence review.",
    href: "/safety",
    icon: <IconShield />,
  },
  {
    title: "Fleet Financials",
    body: "Cash at risk, profitability, factoring, receivables, debt timing, reserve releases, and management reporting.",
    href: "/fleet-financials",
    icon: <IconDispatch />,
  },
] as const;

const PORTALS = [
  {
    title: "Manager Portal",
    body: "Control the back office with action queues, financial exposure, driver readiness, and operating proof.",
    href: "/portals/manager",
  },
  {
    title: "Driver Portal",
    body: "Give drivers one place for dispatch, documents, trip release, pay review, and compliance tasks.",
    href: "/portals/driver",
  },
  {
    title: "Customer Portal",
    body: "Show shipment status, proof, exceptions, invoice readiness, and professional customer updates.",
    href: "/portals/customer",
  },
  {
    title: "Operations Vault",
    body: "Organize SOPs, policies, HR, payroll, finance, vendor, AI, insurance, and governance controls.",
    href: "/documents/company-operations-vault",
  },
] as const;

const DEMO_LINKS = [
  { label: "Command Center", href: "/command-center" },
  { label: "Dispatch", href: "/dispatch" },
  { label: "Drivers", href: "/drivers" },
  { label: "Documents", href: "/documents" },
  { label: "Settlements", href: "/settlements" },
  { label: "Safety", href: "/safety" },
] as const;

export default function MarketingHomeAccountable() {
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
            <p className="bof-home-eyebrow">Back-Office Operating System for Trucking</p>
            <h1 id="bof-mkt-hero-heading">BOF runs the back office behind every load.</h1>
            <p className="bof-home-hero__lead">
              BackOfficeFleet connects dispatch, driver readiness, documents, HR, payroll, finance, settlements,
              maintenance, procurement, RFID proof, safety, and exception management in one accountable operating system.
            </p>
            <div className="bof-home-hero__ctas" aria-label="Primary actions">
              <Link href="/book-assessment" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
                Take the Assessment
              </Link>
              <Link href="/command-center" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
                Explore the Demo
              </Link>
              <BookDemoLink className="bof-home-hero__text-link">Talk to BOF</BookDemoLink>
            </div>
          </div>

          <aside className="bof-home-hero__panel" aria-label="BOF operating snapshot">
            <div className="bof-home-hero__panel-head">
              <span>Live operating queue</span>
              <strong>May 20</strong>
            </div>
            <div className="bof-home-hero__metric-grid">
              {HERO_METRICS.map((metric) => (
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

      <section className="bof-home-demo-strip" aria-label="Demo entry points">
        <div className="bof-mkt-container bof-home-demo-strip__inner">
          <span>Open a live workflow</span>
          <div>
            {DEMO_LINKS.map((link) => (
              <Link key={link.href} href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bof-home-section bof-home-section--white" aria-labelledby="bof-home-flow-heading">
        <div className="bof-mkt-container">
          <div className="bof-home-section-head">
            <p className="bof-home-eyebrow">Operating Flow</p>
            <h2 id="bof-home-flow-heading">One record from load intake to pay release.</h2>
            <p>
              BOF is not a collection of disconnected dashboards. The same operating record moves through dispatch,
              proof, documents, safety, settlement, and finance.
            </p>
          </div>
          <div className="bof-home-flow-grid">
            {OPERATING_FLOW.map((item) => (
              <Link key={item.title} href={item.href} className="bof-home-flow-card">
                <span>{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bof-home-section bof-home-section--soft" aria-labelledby="bof-home-control-heading">
        <div className="bof-mkt-container">
          <div className="bof-home-section-head">
            <p className="bof-home-eyebrow">Operational Control</p>
            <h2 id="bof-home-control-heading">The back office functions that keep a fleet moving.</h2>
            <p>
              Each module is actionable. Operators can open the queue, review supporting records, resolve blockers, and
              move the next load, driver, or settlement forward.
            </p>
          </div>
          <div className="bof-home-capability-grid">
            {CAPABILITIES.map((item) => (
              <Link key={item.title} href={item.href} className="bof-home-capability-card">
                <span className="bof-home-capability-card__icon">{item.icon}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <strong>Open workflow &rarr;</strong>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bof-home-section bof-home-section--white" aria-labelledby="bof-home-portals-heading">
        <div className="bof-mkt-container bof-home-split">
          <div className="bof-home-section-head">
            <p className="bof-home-eyebrow">Portals and Vault</p>
            <h2 id="bof-home-portals-heading">Every role sees the same operation through the right door.</h2>
            <p>
              Managers, drivers, customers, and internal administrators work from one controlled source of truth, not
              side spreadsheets and message threads.
            </p>
          </div>
          <div className="bof-home-portal-grid">
            {PORTALS.map((portal) => (
              <Link key={portal.title} href={portal.href} className="bof-home-portal-card">
                <h3>{portal.title}</h3>
                <p>{portal.body}</p>
                <span>Open &rarr;</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bof-home-section bof-home-section--soft" aria-labelledby="bof-mkt-service-tiers-heading">
        <MarketingServiceTiers />
      </section>

      <section className="bof-home-section bof-home-section--ink" aria-labelledby="bof-mkt-cc-heading">
        <MarketingCommandCenterPreview
          headingId="bof-mkt-cc-heading"
          title="What needs attention right now"
          lead="The command center turns dispatch blockers, safety events, proof gaps, settlement holds, and money at risk into a single operating queue with owners and next actions."
          demoLabel="Open the command center &rarr;"
        />
      </section>

      <MarketingCtaPanel
        id="bof-mkt-final-cta-heading"
        title="Find the back-office gaps holding your fleet back"
        lead="Take the Fleet Back Office Assessment to see where dispatch, documents, driver readiness, financials, compliance, and customer proof can be tightened into one operating system."
      >
        <Link href="/book-assessment" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
          Take the Assessment
        </Link>
        <Link href="/command-center" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
          Explore System
        </Link>
      </MarketingCtaPanel>
    </main>
  );
}
