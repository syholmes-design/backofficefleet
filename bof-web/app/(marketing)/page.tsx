import type { Metadata } from "next";
import Link from "next/link";
import {
  MarketingCommandCenterPreview,
  MarketingCtaPanel,
  MarketingHeroProductSketch,
  MarketingIconCardGrid,
  MarketingPremiumHero,
  MarketingSection,
  MarketingSectionHeader,
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
          <MarketingHeroProductSketch caption="Fleet and command-center imagery can replace this panel — layout reserved for photography or product UI." />
        }
      />

      <MarketingSection variant="light" id="pain" ariaLabelledBy="bof-mkt-pain-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-pain-heading"
            title={"What You're Managing Today"}
            lead="Modern trucking operations break down when compliance, proof, dispatch, and settlements live in different places."
          />
          <MarketingIconCardGrid items={PAIN_ITEMS} variant="pain" />
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="bof-mkt-product-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-product-heading"
            title="What BOF Does"
            lead="BOF enforces the operational controls carriers need to move freight, protect revenue, and reduce risk."
          />
          <MarketingIconCardGrid items={FEATURE_ITEMS} variant="feature" />
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
