import Link from "next/link";
import {
  MarketingCommandCenterPreview,
  MarketingCtaPanel,
  MarketingHeroProductSketch,
  MarketingIconCardGrid,
  MarketingPremiumHero,
  MarketingSection,
  MarketingSectionHeader,
} from "@/components/marketing";
import { BofLogo } from "@/components/BofLogo";
import { IconDispatch, IconLoadProof, IconShield } from "@/components/marketing/MarketingHomeIcons";
import type { MarketingIconCardItem } from "@/components/marketing/MarketingIconCardGrid";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BackOfficeFleet | Accountable Operations Command Layer",
  description:
    "BOF is more than software: one accountable operating layer connecting management, drivers, and customers across intake, compliance, proof, settlements, and communication.",
};

const HERO_TRUST = [
  "Accountability over excuses",
  "Automation across intake to settlement",
  "Connected management, driver, and customer views",
  "BOF-native operational control",
] as const;

const DIFFERENTIATOR_POINTS = [
  {
    title: "Most vendors stop at software",
    description:
      "Typical software implementations fail, then execution risk is pushed back onto your team and process.",
  },
  {
    title: "BOF takes operational accountability",
    description:
      "If intake, compliance, proof, settlements, or customer updates are slipping, BOF treats it as an operating failure to solve.",
  },
  {
    title: "Work actually gets done",
    description:
      "Automation, workflow discipline, and BOF-native visibility keep critical actions from being lost in handoffs.",
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
      <MarketingPremiumHero
        titleId="bof-mkt-hero-heading"
        sectionAriaLabelledBy="bof-mkt-hero-heading"
        trustAriaLabel="BOF capability highlights"
        brand={<BofLogo variant="dark" className="bof-mkt-home-hero-logo" priority />}
        eyebrow="Operations accountability platform for fleets"
        title={<>Back-office control for fleets that cannot afford excuses.</>}
        subtitle="We do not just sell software. BOF combines automation, operational discipline, and accountable execution across intake, compliance, proof, settlements, and customer communication."
        support="When something is not getting done, BOF does not hide behind a people problem. BOF is the operating layer that keeps management, drivers, and customers aligned."
        trustItems={HERO_TRUST}
        ctas={
          <>
            <Link href="/book-assessment" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
              Book Fleet Assessment
            </Link>
            <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
              Open Demo
            </Link>
          </>
        }
        visual={
          <MarketingHeroProductSketch
            windowTitle="BOF operating layer"
            caption="One operational fabric connecting management oversight, driver workflows, and customer communication."
          />
        }
      />

      <MarketingSection variant="light" ariaLabelledBy="bof-mkt-different-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-different-heading"
            title="Why BOF is different"
            lead="Software alone is no longer enough. BOF combines platform capability with operational accountability so outcomes improve in the real world."
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
            title="Automation is taking over this industry"
            lead="Winning fleets automate intake, compliance, proof, billing, settlements, and customer communication. Teams that do not automate these workflows will fall behind."
          />
          <MarketingIconCardGrid items={AUTOMATION_ITEMS} variant="feature" />
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="bof-mkt-stakeholder-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-stakeholder-heading"
            title="Pain relief by stakeholder"
            lead="BOF reduces operational pain for leadership, drivers, and customers with one connected operating model."
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
        title="See BOF operate your workflow, not just your software stack"
        lead="Book a fleet assessment and see how BOF improves accountability, automation, and operational execution from start to finish."
      >
        <Link href="/book-assessment" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
          Book Fleet Assessment
        </Link>
        <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
          Open Demo
        </Link>
      </MarketingCtaPanel>
    </>
  );
}
