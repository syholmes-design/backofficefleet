import Link from "next/link";
import {
  MarketingCommandCenterPreview,
  MarketingCtaPanel,
  MarketingHomeIntegratedHero,
  MarketingIconCardGrid,
  MarketingServiceTiers,
  MarketingSection,
  MarketingSectionHeader,
} from "@/components/marketing";
import { BofLogo } from "@/components/BofLogo";
import { IconDispatch, IconLoadProof, IconShield } from "@/components/marketing/MarketingHomeIcons";
import type { MarketingIconCardItem } from "@/components/marketing/MarketingIconCardGrid";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BackOfficeFleet | Front office built so drivers can win",
  description:
    "When dispatch, proof, and billing signals disagree, the whole operation misses. BOF aligns the front office with what drivers need—pretrip discipline, clean documentation, and truth that holds through settlement and claims.",
};

const HERO_TRUST = [
  "Ground truth that survives dispatch and billing",
  "Pretrip, proof, and packet discipline as advantage",
  "From driver cab to owner desk—one accountable cadence",
  "A road dog, not a watchdog: reward the work that usually goes unseen",
] as const;

const DIFFERENTIATOR_POINTS = [
  {
    title: "Drivers already know the gap",
    description:
      "They know what they are missing, what the shipper promised, and when the plan quietly changed. The failure mode is a front office that is not built to make them successful.",
  },
  {
    title: "The front office has to earn alignment",
    description:
      "When contract, customer expectation, and dispatch direction drift apart, the driver pays first—then the fleet pays in lost miles, late paperwork, and fights at settlement. BOF keeps those signals intentionally tied together.",
  },
  {
    title: "BOF is operational, not performative",
    description:
      "We turn pre-trip rigor, proof capture, and documentation into leverage—cleaner handoffs, faster answers, and fewer surprises when money and risk are on the line.",
  },
] as const;

const AUTOMATION_ITEMS: MarketingIconCardItem[] = [
  {
    title: "Intake automation",
    description: "Convert incoming packets into controlled workflows instead of inbox backlog.",
    icon: <IconDispatch />,
  },
  {
    title: "Compliance automation",
    description: "Surface credential and readiness gaps before they become dispatch or audit failures.",
    icon: <IconShield />,
  },
  {
    title: "Proof and settlement automation",
    description: "Tie POD, seal, and document quality directly to billing and settlement outcomes.",
    icon: <IconLoadProof />,
  },
  {
    title: "Carrier revenue protection",
    description: "Settlement intelligence and holds surface in one command narrative—prioritized by capital impact.",
    icon: <IconLoadProof />,
  },
  {
    title: "Customer communication automation",
    description: "Provide clear, timely updates and stronger documentation without manual follow-up loops.",
    icon: <IconDispatch />,
  },
];

const STAKEHOLDER_PAIN = [
  {
    title: "For management / ownership",
    points: [
      "System-level visibility and accountability",
      "Fewer missed details and fewer reactive escalations",
      "Better control over compliance, proof, settlements, and exceptions",
    ],
  },
  {
    title: "For for-hire carriers",
    points: [
      "Dispatch moves faster than compliance can keep up—credential drift hides until audits",
      "Proof lives everywhere except the load record—finance can't tie evidence to disputes",
      "Disputes eat margin before leadership sees the pattern—soft costs and customer churn",
      "No enforcement layer—trackers show dots but don't stop unqualified drivers",
    ],
  },
  {
    title: "For drivers",
    points: [
      "Fewer surprises before and during dispatch",
      "Clear readiness and less document confusion",
      "Faster issue resolution with fewer settlement disputes",
    ],
  },
  {
    title: "For customers",
    points: [
      "Cleaner communication and faster responses",
      "Better proof quality and documentation confidence",
      "More consistent execution across the full load lifecycle",
    ],
  },
] as const;

export default function MarketingHomeAccountable() {
  return (
    <>
      <MarketingHomeIntegratedHero
        className="bof-home-tight-hero"
        titleId="bof-mkt-hero-heading"
        sectionAriaLabelledBy="bof-mkt-hero-heading"
        eyebrow="Back office, built for the driver, accountable to the fleet"
        brand={<BofLogo variant="dark" className="bof-mkt-home-hero-logo" priority />}
        title={<>The Front Office Has to Be Built for Drivers to Win—Signal to Signal, Mile to Mile.</>}
        subtitle="If dispatch, customers, and proof are telling different stories, the line misses as a system—and your drivers feel it first. BOF is the connective layer that makes front-office decisions match the reality in the cab and on the yard."
        support="We are a road dog, not a watchdog. BOF rewards the pre-trip checks, the careful documentation, and the quiet professionalism that too often get skipped in reporting—and turns them into the proof you need for billing, settlement, and claims when it counts."
        trustItems={HERO_TRUST}
        trustAriaLabel="BOF capability highlights"
        imageSrc="/assets/images/bof-landing-hero-clean.png"
        imageAlt="BOF operational layer connecting management oversight, driver workflows, and customer communication"
        ctas={
          <>
            <Link href="/book-assessment" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
              Take The Assessment
            </Link>
            <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
              See The Demo
            </Link>
          </>
        }
      />

      <MarketingSection variant="light" ariaLabelledBy="bof-mkt-different-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-different-heading"
            title="Why BOF is different"
            lead="Trucking does not break because nobody cares—it breaks when what the business thinks is true is not what the driver can execute. BOF is built to close that gap, not to decorate it."
          />
          <div className="bof-mkt-differentiator-grid">
            {DIFFERENTIATOR_POINTS.map((item) => (
              <article key={item.title} className="bof-mkt-differentiator-card">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="bof-mkt-auto-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-auto-heading"
            title="Where winning fleets put the work"
            lead="The advantage is not a prettier dashboard. It is disciplined intake, ironclad pretrip and proof habits, and packet quality that still makes sense at settlement. BOF encodes that discipline so it scales past your best shift lead."
          />
          <MarketingIconCardGrid items={AUTOMATION_ITEMS} variant="feature" />
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="bof-mkt-service-tiers-heading">
        <MarketingServiceTiers />
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="bof-mkt-stakeholder-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-stakeholder-heading"
            title="What changes for each part of the line"
            lead="From the first dispatch note to the last dollar released, everyone has to be looking at the same load story. BOF makes that feel operational, not aspirational."
          />
          <div className="bof-mkt-stakeholder-grid">
            {STAKEHOLDER_PAIN.map((group) => (
              <article key={group.title} className="bof-mkt-stakeholder-card">
                <h3>{group.title}</h3>
                <ul>
                  {group.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="bof-mkt-center-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-center-heading"
            title="At the center of it all: BOF"
            lead="Management dashboard, driver workflow, and customer portal stay connected through BOF as the coordinating operating layer."
          />
          <div className="bof-mkt-hub">
            <article className="bof-mkt-hub-node bof-mkt-hub-node--top">
              <h3>Management dashboard</h3>
              <p>Executive visibility, compliance posture, proof quality, exceptions, and settlement risk in one command view.</p>
            </article>
            <article className="bof-mkt-hub-core">
              <h3>BOF</h3>
              <p>Accountable operating layer</p>
            </article>
            <article className="bof-mkt-hub-node bof-mkt-hub-node--left">
              <h3>Driver workflow</h3>
              <p>Readiness, credential clarity, issue follow-up, and cleaner proof handoff to reduce disputes.</p>
            </article>
            <article className="bof-mkt-hub-node bof-mkt-hub-node--right">
              <h3>Customer dashboard / portal</h3>
              <p>Cleaner communication, faster responses, better proof, and stronger confidence in execution.</p>
            </article>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="bof-mkt-preview-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-preview-heading"
            title="Dashboard preview across the operation"
            lead="Open the live BOF views used by management, drivers, and customers."
          />
          <div className="bof-mkt-preview-grid">
            <Link href="/dashboard" className="bof-mkt-preview-card">
              <h3>Management view</h3>
              <p>Command center KPIs, risk posture, and operational priorities.</p>
              <span>Open dashboard</span>
            </Link>
            <Link href="/drivers/DRV-001" className="bof-mkt-preview-card">
              <h3>Driver view</h3>
              <p>Driver readiness, compliance stack, and document workflow.</p>
              <span>Open driver workflow</span>
            </Link>
            <Link href="/shipper-portal/L001" className="bof-mkt-preview-card">
              <h3>Customer view</h3>
              <p>Portal-style shipment communication and proof visibility.</p>
              <span>Open customer portal</span>
            </Link>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="alt" className="bof-mkt-cc" ariaLabelledBy="bof-mkt-cc-heading">
        <MarketingCommandCenterPreview headingId="bof-mkt-cc-heading" />
      </MarketingSection>

      <MarketingCtaPanel
        id="bof-mkt-final-cta-heading"
        title="Make the front office as serious as the miles you run"
        lead="Book a fleet assessment. We walk the signal path—intake, dispatch, proof, settlement, and claims—and show what it looks like when those layers stop arguing with each other."
      >
        <Link href="/book-assessment" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
          Take The Assessment
        </Link>
        <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
          See The Demo
        </Link>
      </MarketingCtaPanel>
    </>
  );
}
