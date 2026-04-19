import type { Metadata } from "next";
import Link from "next/link";
import {
  MarketingCalculatorShell,
  MarketingCommandCenterPreview,
  MarketingCtaPanel,
  MarketingFormShell,
  MarketingHeroProductSketch,
  MarketingIconCardGrid,
  MarketingPremiumHero,
  MarketingProcessSteps,
  MarketingSection,
  MarketingSectionHeader,
  MarketingStatBand,
  MarketingTrustStrip,
  MarketingValuePillars,
} from "@/components/marketing";
import type { MarketingIconCardItem } from "@/components/marketing/MarketingIconCardGrid";
import {
  IconCamera,
  IconDispatch,
  IconDispute,
  IconDocWarning,
  IconLedger,
  IconLoadProof,
  IconShield,
  IconTruth,
} from "@/components/marketing/MarketingHomeIcons";

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

const HOME_STATS = [
  {
    label: "Readiness enforcement",
    value: "Live",
    hint: "Dispatch and compliance share one BOF gate—not parallel spreadsheets.",
  },
  {
    label: "Proof on the load",
    value: "Structured",
    hint: "POD, seals, and photos tied to settlement intelligence in the demo.",
  },
  {
    label: "Command narrative",
    value: "Unified",
    hint: "Severity, owners, and capital impact ranked for leadership and ops.",
  },
  {
    label: "Audit posture",
    value: "Defensible",
    hint: "Time-stamped enforcement instead of reconstructed email chains.",
  },
] as const;

const HOME_PROCESS = [
  {
    title: "Discover",
    description:
      "Expose where compliance, proof, dispatch, and settlements diverge inside your live operation—not where policies claim they align.",
  },
  {
    title: "Design",
    description:
      "Translate BOF enforcement into your lanes, shipper commitments, and finance triggers with the same premium standard as sector programs.",
  },
  {
    title: "Deploy",
    description:
      "Stand up the command center with the readiness, proof, and settlement views your teams already recognize from the demo.",
  },
  {
    title: "Operate",
    description:
      "Run daily operations with continuous enforcement, dispute-ready packets, and executive roll-ups that stay credible under scrutiny.",
  },
] as const;

const HOME_TRUST_STRIP = [
  "For-hire carriers",
  "Private captive fleets",
  "Government & regulated programs",
  "BOF Vault credential fabric",
] as const;

const PAIN_ITEMS: MarketingIconCardItem[] = [
  {
    title: "Drivers with expired documents",
    description: "Credential gaps surface after the truck is already rolling.",
    icon: <IconDocWarning />,
  },
  {
    title: "Loads without proper proof",
    description: "POD, seals, and photos live in inboxes—not on the load record.",
    icon: <IconLoadProof />,
  },
  {
    title: "Disputes slowing down payment",
    description: "Finance waits while operations reconstruct what actually happened.",
    icon: <IconDispute />,
  },
  {
    title: "No single source of truth",
    description: "Tools that track don’t enforce—leaders still guess where risk sits.",
    icon: <IconTruth />,
  },
];

const FEATURE_ITEMS: MarketingIconCardItem[] = [
  {
    title: "Dispatch Control",
    description: "Assign drivers, track loads, enforce readiness",
    icon: <IconDispatch />,
  },
  {
    title: "Compliance Enforcement",
    description: "Block non-compliant drivers before risk happens",
    icon: <IconShield />,
  },
  {
    title: "Proof & POD System",
    description: "Photos, seals, GPS = verified delivery",
    icon: <IconCamera />,
  },
  {
    title: "Settlement Intelligence",
    description: "Know what gets paid, what gets held, and why",
    icon: <IconLedger />,
  },
];

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
      <MarketingPremiumHero
        titleId="bof-mkt-hero-heading"
        sectionAriaLabelledBy="bof-mkt-hero-heading"
        trustAriaLabel="BOF capability highlights"
        eyebrow="For-hire carriers · operations & compliance"
        title={<>Run Your Trucking Operation Without Blind Spots</>}
        subtitle="Compliance, dispatch, proof, and settlements — all in one command center built for for-hire carriers."
        support="Stop chasing documents, missing proof, and compliance gaps. BOF enforces operations in real time."
        trustItems={HERO_TRUST}
        ctas={
          <>
            <Link
              href="/book-assessment"
              className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary"
            >
              Book Fleet Assessment
            </Link>
            <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
              Open Demo
            </Link>
          </>
        }
        visual={
          <MarketingHeroProductSketch
            windowTitle="Operations command view"
            caption="Fleet and command-center imagery can replace this panel — layout reserved for photography or product UI."
          />
        }
      />

      <MarketingSection variant="light" ariaLabelledBy="bof-mkt-home-stats-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-home-stats-heading"
            aside={<span className="bof-mkt-badge-neutral">Illustrative posture model</span>}
            title="Operational credibility at a glance"
            lead="The same stat-band rhythm as Private Fleets, Government, Vault, and For-Hire—grounding the home story before we unpack pain and product depth."
          />
          <MarketingStatBand stats={HOME_STATS} />
        </div>
      </MarketingSection>

      <MarketingSection variant="white" id="pain" ariaLabelledBy="bof-mkt-pain-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-pain-heading"
            title={"What You're Managing Today"}
            lead="Modern trucking operations break down when compliance, proof, dispatch, and settlements live in different places."
          />
          <MarketingIconCardGrid items={PAIN_ITEMS} variant="pain" />
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="bof-mkt-product-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-product-heading"
            title="What BOF Does"
            lead="BOF enforces the operational controls carriers need to move freight, protect revenue, and reduce risk."
          />
          <MarketingIconCardGrid items={FEATURE_ITEMS} variant="feature" />
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="bof-mkt-home-funnel-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-home-funnel-heading"
            title="Assessment & savings outlook"
            lead="Phase C will wire interactive flows here. These shells mirror sector pages so the premium funnel stays visually consistent site-wide."
          />
          <div className="bof-mkt-split-2-col">
            <MarketingCalculatorShell
              title="Fleet savings outlook"
              badge="Reserved"
              body="BOF already models insurance, legal exposure, recovered revenue, and cash-flow acceleration inside the demo command center. This card will host the public calculator without duplicating math."
            />
            <MarketingFormShell
              title="Fleet assessment intake"
              lead="Structured qualification, scheduling, and context capture will live here—matching the enterprise assessment workflow across marketing."
            />
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="ink" ariaLabelledBy="bof-mkt-home-process-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-home-process-heading"
            title="How BOF engagements stay disciplined"
            lead="The same four-step cadence we use on sector pages—so prospects feel one premium operating system, not a different story on every click."
          />
          <MarketingProcessSteps steps={HOME_PROCESS} />
          <MarketingTrustStrip label="One platform narrative across" items={HOME_TRUST_STRIP} />
        </div>
      </MarketingSection>

      <MarketingSection variant="alt" className="bof-mkt-cc" ariaLabelledBy="bof-mkt-cc-heading">
        <MarketingCommandCenterPreview headingId="bof-mkt-cc-heading" />
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="bof-mkt-value-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader titleId="bof-mkt-value-heading" title="Why Carriers Choose BOF" />
          <MarketingValuePillars items={VALUE_PILLARS} />
        </div>
      </MarketingSection>

      <MarketingCtaPanel
        id="bof-mkt-final-cta-heading"
        title="See What BOF Would Surface In Your Operation"
        lead="Book a fleet assessment and see where compliance gaps, proof failures, and revenue risk are slowing you down."
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
