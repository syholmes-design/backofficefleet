import type { Metadata } from "next";
import Link from "next/link";
import {
  MarketingCalculatorShell,
  MarketingCommandCenterPreview,
  type CcMockRow,
  MarketingCtaPanel,
  MarketingFormShell,
  MarketingFunnelEntryRow,
  MarketingHeroImagePanel,
  MarketingIconCardGrid,
  MarketingPremiumHero,
  MarketingProcessSteps,
  MarketingSection,
  MarketingSectionHeader,
  MarketingStatBand,
  MarketingTrustStrip,
} from "@/components/marketing";
import type { MarketingIconCardItem } from "@/components/marketing/MarketingIconCardGrid";
import {
  IconCamera,
  IconDispatch,
  IconDispute,
  IconLedger,
  IconLoadProof,
  IconShield,
  IconTruth,
} from "@/components/marketing/MarketingHomeIcons";

export const metadata: Metadata = {
  title: "For-Hire Carriers | BackOfficeFleet",
  description:
    "From dispatch to delivery — enforce compliance and protect every load.",
};

const HERO_TRUST = [
  "Primary wedge for BOF",
  "Dispatch + compliance enforced",
  "Proof tied to revenue",
  "Settlement intelligence built-in",
] as const;

const FOR_HIRE_CC_ROWS: readonly CcMockRow[] = [
  {
    label: "Attention queue",
    title: "Drivers off readiness",
    meta: "Med card · CDL · MVR exceptions",
    val: "9",
    valClass: "",
  },
  {
    label: "Loads",
    title: "Proof gaps on active lanes",
    meta: "POD · seal · photo package",
    val: "5",
    valClass: "bof-mkt-cc-mock-kpi-val--warn",
  },
  {
    label: "Claims",
    title: "Dispute-ready exposure",
    meta: "Packet completeness score",
    val: "$38K",
    valClass: "",
  },
  {
    label: "Compliance",
    title: "Enforcement events",
    meta: "Auditable blocks & overrides",
    val: "14",
    valClass: "",
  },
  {
    label: "Finance",
    title: "Money at risk",
    meta: "Held settlements · carrier cash",
    val: "$112K",
    valClass: "bof-mkt-cc-mock-kpi-val--risk",
  },
];

const PRESSURE_ITEMS: MarketingIconCardItem[] = [
  {
    title: "Dispatch moves faster than compliance can keep up",
    description:
      "Brokers and planners optimize for miles while credential drift hides in spreadsheets until insurance or a shipper audit finds it.",
    icon: <IconDispatch />,
  },
  {
    title: "Proof lives everywhere except the load record",
    description:
      "Photos, BOLs, and seal photos clog inboxes—finance cannot tie evidence to the exact move that triggered the dispute.",
    icon: <IconLoadProof />,
  },
  {
    title: "Disputes eat margin before leadership sees the pattern",
    description:
      "Exception volume looks manageable until you add up soft costs, rework, and customer churn tied to inconsistent proof.",
    icon: <IconDispute />,
  },
  {
    title: "No enforcement layer—only visibility theater",
    description:
      "Trackers show dots; they do not stop an unqualified driver or a load missing the packet your contract actually requires.",
    icon: <IconTruth />,
  },
];

const CONTROL_ITEMS: MarketingIconCardItem[] = [
  {
    title: "Control every load before it rolls",
    description:
      "Readiness checks, asset assignment, and exception context live on the load—not buried in tribal knowledge.",
    icon: <IconDispatch />,
  },
  {
    title: "Never miss compliance again",
    description:
      "CDL, med card, and MVR enforcement tied to dispatch decisions with the same severity language your safety team already uses.",
    icon: <IconShield />,
  },
  {
    title: "Proof that gets you paid",
    description:
      "Structured POD, seals, and photos tied to settlements and money-at-risk views so finance releases with confidence.",
    icon: <IconCamera />,
  },
  {
    title: "Protect carrier revenue",
    description:
      "Settlement intelligence, holds, and proof gaps surface in one command narrative—prioritized by capital impact.",
    icon: <IconLedger />,
  },
];

const PROCESS_STEPS = [
  {
    title: "Discover",
    description:
      "Map dispatch, safety, and finance workflows to see where proof and credentials actually break—not where policies say they should work.",
  },
  {
    title: "Design",
    description:
      "Align enforcement rules, shipper commitments, and settlement triggers to a single BOF-ready operating model.",
  },
  {
    title: "Deploy",
    description:
      "Roll out command-center discipline lane by lane—starting with the freight that carries the most revenue or regulatory weight.",
  },
  {
    title: "Operate",
    description:
      "Run the carrier from the BOF command center with continuous readiness, dispute-ready packets, and executive roll-ups that stay honest.",
  },
] as const;

export default function ForHireCarriersPage() {
  return (
    <>
      <MarketingPremiumHero
        titleId="bof-mkt-forhire-hero-heading"
        sectionAriaLabelledBy="bof-mkt-forhire-hero-heading"
        eyebrow="For-hire carriers · primary wedge"
        title={"Built for Carriers Who Can't Afford Mistakes"}
        subtitle="From dispatch to delivery—enforce compliance, capture defensible proof, and protect every load without bolting on another passive tracker."
        support="BOF is the operations and compliance command center for carriers who treat every move like it is finance-grade—because it is."
        trustItems={HERO_TRUST}
        trustAriaLabel="For-hire carrier highlights"
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
          <MarketingHeroImagePanel
            windowTitle="Carrier command center"
            imagePath="/mocks/mock_equipment.jpg"
            fallbackImagePath="/assets/images/hero-regular-fleets.jpg"
            caption="Dispatch, proof, and compliance posture from one carrier command-center view."
          />
        }
      />

      <MarketingSection variant="light" ariaLabelledBy="bof-mkt-forhire-stats-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-forhire-stats-heading"
            aside={<span className="bof-mkt-badge-neutral">Illustrative posture model</span>}
            title="Carrier-grade operational credibility"
            lead="The same stat language used across BOF sector pages—mirroring how the demo narrates readiness, proof, and capital at risk."
          />
          <MarketingStatBand
            stats={[
              {
                label: "Readiness coverage",
                value: "100%",
                hint: "Target posture when dispatch cannot bypass enforcement.",
              },
              {
                label: "Proof on the load",
                value: "1:1",
                hint: "Structured packets tied to each move—not inbox archaeology.",
              },
              {
                label: "Settlement alignment",
                value: "Live",
                hint: "Finance sees the same severity-ranked queue as operations.",
              },
              {
                label: "Dispute readiness",
                value: "High",
                hint: "Evidence posture carriers defend in shipper and insurance reviews.",
              },
            ]}
          />
        </div>
      </MarketingSection>

      <MarketingSection variant="white" id="pressure" ariaLabelledBy="bof-mkt-forhire-pressure-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-forhire-pressure-heading"
            title="Where for-hire carriers lose first"
            lead="The wedge BOF was built for—tighten these seams before they become customer churn, insurance findings, or settlement holds."
          />
          <MarketingIconCardGrid items={PRESSURE_ITEMS} variant="pain" />
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="bof-mkt-forhire-control-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-forhire-control-heading"
            title="What BOF enforces on every lane"
            lead="Premium command-center experience with the enforcement depth carriers expect at the highest end of the market."
          />
          <MarketingIconCardGrid items={CONTROL_ITEMS} variant="feature" />
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="bof-mkt-forhire-funnel-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-forhire-funnel-heading"
            title="Assessment & savings outlook"
            lead="Use the live calculator and assessment from any sector page—the same premium funnel as home. Drafts stay in-browser; forms are not sent to a server in this demo."
          />
          <div className="bof-mkt-split-2-col">
            <MarketingCalculatorShell
              title="Fleet savings outlook"
              badge="Live"
              body="Model directional monthly impact for for-hire networks—proof disputes, settlement drag, compliance variance, and admin chase—using the shared BOF savings engine."
            />
            <MarketingFormShell
              title="Carrier assessment intake"
              lead="Capture fleet scale, lanes, pain areas, and urgency so BOF strategists can treat the conversation as operational due diligence."
            />
          </div>
          <div className="bof-mkt-funnel-marketing-entry">
            <MarketingFunnelEntryRow />
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="ink" ariaLabelledBy="bof-mkt-forhire-process-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-forhire-process-heading"
            title="How carrier engagements run with BOF"
            lead="Fast where it helps, disciplined where it protects—mirroring the same cadence as private fleet and government programs."
          />
          <MarketingProcessSteps steps={PROCESS_STEPS} />
          <MarketingTrustStrip
            label="Built for"
            items={[
              "OTR refrigerated",
              "Dedicated shipper programs",
              "High-value flatbed",
              "Intermodal drayage",
            ]}
          />
        </div>
      </MarketingSection>

      <MarketingSection variant="alt" className="bof-mkt-cc" ariaLabelledBy="bof-mkt-forhire-cc-heading">
        <MarketingCommandCenterPreview
          headingId="bof-mkt-forhire-cc-heading"
          rows={FOR_HIRE_CC_ROWS}
          title="What your command center would stress-test daily"
          lead="Swap illustrative metrics for your terminals—BOF still tells one severity-ranked story across compliance, proof, and capital."
          demoLabel="Open the demo command center →"
        />
      </MarketingSection>

      <MarketingCtaPanel
        id="bof-mkt-forhire-final-cta"
        title="See the carrier-grade BOF command center on your data"
        lead="Book a fleet assessment. We map dispatch risk, credential drift, and settlement pressure—then show how BOF would govern it in production."
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
