import type { Metadata } from "next";
import Link from "next/link";
import {
  MarketingCalculatorShell,
  MarketingCommandCenterPreview,
  type CcMockRow,
  MarketingCtaPanel,
  MarketingFormShell,
  MarketingFunnelEntryRow,
  MarketingPrivateFleetsHero,
  MarketingIconCardGrid,
  MarketingProcessSteps,
  MarketingSection,
  MarketingSectionHeader,
  MarketingStatBand,
  MarketingTrustStrip,
} from "@/components/marketing";
import type { MarketingIconCardItem } from "@/components/marketing/MarketingIconCardGrid";
import {
  IconAuditTrail,
  IconBranchSpend,
  IconExecRollup,
  IconOpsRhythm,
  IconPolicyLock,
  IconRiskRadar,
  IconStandardPlaybook,
  IconYardNetwork,
} from "@/components/marketing/MarketingPrivateFleetIcons";

export const metadata: Metadata = {
  title: "Private Fleets | BackOfficeFleet",
  description:
    "Enterprise-level control, visibility, and operational discipline for internal fleets.",
};

const HERO_TRUST = [
  "One internal readiness standard",
  "Dispatch + compliance enforced together",
  "Proof tied to every branch move",
  "Executive-grade visibility",
] as const;

const PRIVATE_CC_ROWS: readonly CcMockRow[] = [
  {
    label: "Yard & branch",
    title: "Internal loads at risk",
    meta: "Open chain of custody · yard-to-yard proof",
    val: "6",
    valClass: "",
  },
  {
    label: "Credential posture",
    title: "Drivers off-standard",
    meta: "Med card variance · policy exceptions",
    val: "4",
    valClass: "",
  },
  {
    label: "Finance pressure",
    title: "Intercompany chargebacks",
    meta: "Allocation disputes · incomplete POD",
    val: "$18K",
    valClass: "bof-mkt-cc-mock-kpi-val--warn",
  },
  {
    label: "Audit readiness",
    title: "Documentation gaps",
    meta: "Version control · verifier sign-off",
    val: "9",
    valClass: "",
  },
  {
    label: "Capital",
    title: "Idle asset exposure",
    meta: "Underutilized power units on internal boards",
    val: "$64K",
    valClass: "bof-mkt-cc-mock-kpi-val--risk",
  },
];

const PRESSURE_ITEMS: MarketingIconCardItem[] = [
  {
    title: "Every branch runs a different playbook",
    description:
      "Internal networks behave like mini-carriers—without a single enforcement layer, standards drift by location.",
    icon: <IconYardNetwork />,
  },
  {
    title: "Policy exists; proof does not",
    description:
      "Drivers and yards follow tribal knowledge while auditors expect a defensible, time-stamped record.",
    icon: <IconPolicyLock />,
  },
  {
    title: "Finance inherits operational ambiguity",
    description:
      "Intercompany moves and captive billing break down when POD, seals, and custody are not on the load.",
    icon: <IconBranchSpend />,
  },
  {
    title: "Board-level risk without operator-level truth",
    description:
      "Executives see lagging indicators while dispatch still clears drivers on spreadsheets and shared drives.",
    icon: <IconAuditTrail />,
  },
];

const CONTROL_ITEMS: MarketingIconCardItem[] = [
  {
    title: "Standardize the internal operating system",
    description:
      "One credential stack, one proof standard, and one escalation model from yard to HQ.",
    icon: <IconStandardPlaybook />,
  },
  {
    title: "Rhythm between dispatch and compliance",
    description:
      "Block movement when readiness fails—before product, patients, or passengers are in motion.",
    icon: <IconOpsRhythm />,
  },
  {
    title: "Risk radar for captive networks",
    description:
      "Surface internal exceptions, holds, and audit findings with the same severity language finance already uses.",
    icon: <IconRiskRadar />,
  },
  {
    title: "Executive roll-up without dilution",
    description:
      "Keep operators in enforcement mode while leadership sees a credible, prioritized operations narrative.",
    icon: <IconExecRollup />,
  },
];

const PROCESS_STEPS = [
  {
    title: "Discover",
    description:
      "Map how each branch clears drivers, captures proof, and closes internal settlements today.",
  },
  {
    title: "Design",
    description:
      "Align policy, dispatch rules, and documentation to a single BOF-ready standard for your captive fleet.",
  },
  {
    title: "Deploy",
    description:
      "Roll out enforcement where it matters first—high-liability lanes, regulated cargo, or audited divisions.",
  },
  {
    title: "Operate",
    description:
      "Run daily operations from the command center with the same discipline you expect from a for-hire partner.",
  },
] as const;

export default function PrivateFleetsPage() {
  return (
    <>
      <MarketingPrivateFleetsHero
        titleId="bof-mkt-private-hero-heading"
        sectionAriaLabelledBy="bof-mkt-private-hero-heading"
        eyebrow="Private fleets · enterprise operations"
        title={<>Enterprise Control for Captive Fleet Networks</>}
        subtitle="Standardize compliance, proof, and dispatch enforcement across yards, branches, and internal boards—without turning your operation into a patchwork of spreadsheets."
        support="BOF treats private fleets with the same operational rigor as for-hire carriers: one command center, one readiness bar, one defensible record."
        trustItems={HERO_TRUST}
        trustAriaLabel="Private fleet highlights"
        imageSrc="/assets/images/private-fleets-hero-new.png"
        imageAlt="Enterprise private fleet control center with unified operations across yards and branches"
        imageCaption="Standardized private-fleet governance: one command center, one readiness bar, one defensible record across all locations."
        ctas={
          <>
            <Link
              href="/book-assessment?sector=private-fleet"
              className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary"
            >
              Take The Assessment
            </Link>
            <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
              See The Demo
            </Link>
          </>
        }
      />

      <MarketingSection variant="light" ariaLabelledBy="bof-mkt-private-stats-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-private-stats-heading"
            aside={<span className="bof-mkt-badge-neutral">Illustrative posture model</span>}
            title="Operational credibility at a glance"
            lead="Private fleet leaders need numbers that feel finance-grade—not marketing fluff. These markers mirror how BOF narrates risk inside the demo command center."
          />
          <MarketingStatBand
            stats={[
              {
                label: "Credential coverage",
                value: "99%",
                hint: "Target operating posture when enforcement precedes dispatch.",
              },
              {
                label: "Internal boards unified",
                value: "1",
                hint: "Single readiness narrative across branches and captive brokers.",
              },
              {
                label: "Audit-ready events",
                value: "24/7",
                hint: "Time-stamped enforcement instead of reconstructed inboxes.",
              },
              {
                label: "Executive roll-up",
                value: "Live",
                hint: "Severity, capital, and owners on one operations surface.",
              },
            ]}
          />
        </div>
      </MarketingSection>

      <MarketingSection variant="white" id="pressure" ariaLabelledBy="bof-mkt-private-pressure-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-private-pressure-heading"
            title="Where private fleets feel the pressure first"
            lead="Internal networks hide risk in handoffs. BOF exposes those seams before they become customer, patient, or regulator incidents."
          />
          <MarketingIconCardGrid items={PRESSURE_ITEMS} variant="pain" />
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="bof-mkt-private-control-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-private-control-heading"
            title="What BOF enforces for captive operations"
            lead="The same premium command-center experience as for-hire carriers—tuned for internal accountability, branch variance, and audit defense."
          />
          <MarketingIconCardGrid items={CONTROL_ITEMS} variant="feature" />
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="bof-mkt-private-funnel-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-private-funnel-heading"
            title="Assessment & savings outlook"
            lead="Quantify internal leakage and administrative drag, then run the same structured assessment used across BOF marketing—client-side drafts only in this demo."
          />
          <div className="bof-mkt-split-2-col">
            <MarketingCalculatorShell
              title="Fleet savings outlook"
              badge="Live"
              body="Private fleets still lose margin to proof gaps, branch variance, and settlement friction. The calculator translates pain levels into directional savings categories aligned with BOF."
            />
            <MarketingFormShell
              title="Fleet assessment intake"
              lead="Document captive network context, compliance pressure, and handoff risk so the next conversation stays executive-grade."
            />
          </div>
          <div className="bof-mkt-funnel-marketing-entry">
            <MarketingFunnelEntryRow sector="private-fleet" />
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="ink" ariaLabelledBy="bof-mkt-private-process-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-private-process-heading"
            title="How engagements run for private fleets"
            lead="A disciplined sequence that respects procurement, IT, and field operations—mirroring how elite BOF deployments are led in the field."
          />
          <MarketingProcessSteps steps={PROCESS_STEPS} />
          <MarketingTrustStrip
            label="Designed for"
            items={[
              "Healthcare logistics",
              "Food & beverage captive fleets",
              "Industrial distribution",
              "Public sector adjacency",
            ]}
          />
        </div>
      </MarketingSection>

      <MarketingSection variant="alt" className="bof-mkt-cc" ariaLabelledBy="bof-mkt-private-cc-heading">
        <MarketingCommandCenterPreview
          headingId="bof-mkt-private-cc-heading"
          rows={PRIVATE_CC_ROWS}
          title="What leadership would see Monday morning"
          lead="Swap illustrative metrics for your internal boards—BOF still tells one severity-ranked story across compliance, proof, and capital."
          demoLabel="Open the demo command center →"
        />
      </MarketingSection>

      <MarketingCtaPanel
        id="bof-mkt-private-final-cta"
        title="Bring the same enforcement rigor to your internal fleet"
        lead="Book a private fleet assessment. We map branch variance, readiness gaps, and settlement pressure—then show how BOF would govern it in production."
      >
        <Link href="/book-assessment?sector=private-fleet" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
          Take The Assessment
        </Link>
        <Link href="/dashboard" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
          See The Demo
        </Link>
      </MarketingCtaPanel>
    </>
  );
}
