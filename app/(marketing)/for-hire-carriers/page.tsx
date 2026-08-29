import type { Metadata } from "next";
import Link from "next/link";
import {
  MarketingCalculatorShell,
  MarketingCommandCenterPreview,
  type CcMockRow,
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
          <MarketingHeroProductSketch
            windowTitle="Carrier command center"
            caption="Reserved for fleet photography, shipper scorecards, or a live capture from the BOF demo environment."
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
            lead="Phase C will wire interactive flows here. Shells match Private Fleets, Government, and Vault for a cohesive premium funnel."
          />
          <div className="bof-mkt-split-2-col">
            <MarketingCalculatorShell
              title="Fleet savings outlook"
              badge="Reserved"
              body="Insurance, legal, recovered revenue, and cash-flow acceleration modeled in the demo command center—surfaced here for prospects without duplicating logic yet."
            />
            <MarketingFormShell
              title="Carrier assessment intake"
              lead="Structured capture for fleet size, shipper mix, and settlement pain—mirroring how BOF onboards elite carriers."
            />
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

      <MarketingSection variant="light" ariaLabelledBy="bof-mkt-forhire-model-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-forhire-model-heading"
            title="The operating model behind a carrier-controlled workday"
            lead="A for-hire carrier is not just moving freight. It is managing a single operating record across dispatch, proof, safety, settlement, and customer expectations."
          />
          <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Dispatch & lane control", "The load starts with a driver, an asset, a service commitment, and a proof path. BOF makes that chain visible before the move begins."],
              ["Proof & service quality", "Lawyers, shippers, and finance all care about the same evidence—POD, seal integrity, damage photos, accessorial records, and timing."],
              ["Claims & settlements", "When exceptions appear, finance and operations need the same record for reconciliation, hold review, and customer-ready explanation."],
              ["Governance & accountability", "Leadership sees severity, owner, and action status instead of a diffuse collection of spreadsheets, inboxes, and phone calls."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Carrier control</p>
                <h3 className="mt-3 text-xl font-semibold text-slate-950">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="bof-mkt-forhire-roles-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-forhire-roles-heading"
            title="Who owns the decision"
            lead="In a for-hire model, the problem is rarely one missing file. It is fragmented accountability across the lane, the supplier, the driver, the safety team, and finance."
          />
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {[
              ["Operations", "Chooses the move and the asset, but needs proof and readiness signals before dispatch is truly controlled."],
              ["Safety", "Controls compliance exposure and needs a single, defensible record around qualification and exceptions."],
              ["Drivers", "Need a clear service standard and proof flow so they are not carrying responsibility through informal channels."],
              ["Finance", "Needs the same sealed, timed evidence the carrier will defend during settlement or invoice review."],
              ["Leadership", "Needs a severity-ranked operating story instead of a collection of working notes and hold queues."],
            ].map(([role, body]) => (
              <div key={role} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-base font-semibold text-slate-950">{role}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="ink" ariaLabelledBy="bof-mkt-forhire-decision-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-forhire-decision-heading"
            title="The decision layer is the real value"
            lead="BOF does not replace the carrier’s operations team. It gives them a defensible control layer for dispatch decisions, proof completion, compliance enforcement, and settlement accountability."
          />
          <div className="mt-8 rounded-3xl border border-white/15 bg-slate-900/60 p-8 text-slate-100">
            <p className="text-sm uppercase tracking-[0.18em] text-teal-300">Decision outcome</p>
            <p className="mt-4 max-w-3xl text-2xl font-semibold leading-8">
              Every load moves with one shared operating record: the driver, the asset, the proof, the exception, and the financial consequence are all connected.
            </p>
          </div>
        </div>
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
