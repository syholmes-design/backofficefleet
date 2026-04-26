import type { Metadata } from "next";
import Link from "next/link";
import {
  MarketingCalculatorShell,
  MarketingCommandCenterPreview,
  type CcMockRow,
  MarketingCtaPanel,
  MarketingFormShell,
  MarketingFunnelEntryRow,
  MarketingGovernmentHero,
  MarketingIconCardGrid,
  MarketingProcessSteps,
  MarketingSection,
  MarketingSectionHeader,
  MarketingStatBand,
  MarketingTrustStrip,
} from "@/components/marketing";
import type { MarketingIconCardItem } from "@/components/marketing/MarketingIconCardGrid";
import {
  IconCitizenService,
  IconContinuousAssurance,
  IconEvidencePacket,
  IconGavelRisk,
  IconInteragencySync,
  IconOversightTower,
  IconPublicLedger,
  IconSealChain,
} from "@/components/marketing/MarketingGovernmentIcons";

export const metadata: Metadata = {
  title: "Government | BackOfficeFleet",
  description:
    "Audit-ready fleet operations with enforced compliance and documentation.",
};

const HERO_TRUST = [
  "Defensible enforcement logs",
  "Grant & policy alignment",
  "Public accountability by design",
  "Command-center oversight",
] as const;

const GOV_CC_ROWS: readonly CcMockRow[] = [
  {
    label: "Fleet eligibility",
    title: "Vehicles cleared to operate",
    meta: "Credential + inspection posture · exceptions routed",
    val: "142",
    valClass: "",
  },
  {
    label: "Open findings",
    title: "Audit remediation queue",
    meta: "Verifier sign-off · document version gaps",
    val: "11",
    valClass: "bof-mkt-cc-mock-kpi-val--warn",
  },
  {
    label: "Citizen-facing risk",
    title: "Service-level exposure",
    meta: "Late proof · chain-of-custody breaks",
    val: "3",
    valClass: "",
  },
  {
    label: "Grants & programs",
    title: "Compliance attestations",
    meta: "Reporting period · evidence packet status",
    val: "Due",
    valClass: "",
  },
  {
    label: "Taxpayer capital",
    title: "Held procurement releases",
    meta: "Incomplete proof packages on contracted moves",
    val: "$210K",
    valClass: "bof-mkt-cc-mock-kpi-val--risk",
  },
];

const PRESSURE_ITEMS: MarketingIconCardItem[] = [
  {
    title: "Accountability without a single operational record",
    description:
      "Legislative and IG scrutiny intensifies while dispatch, safety, and finance still reconcile truth from inboxes and attachments.",
    icon: <IconPublicLedger />,
  },
  {
    title: "Proof scattered across systems of record",
    description:
      "Telematics, HRIS, and procurement tools each hold a fragment—none enforce whether a driver or asset was actually cleared to move.",
    icon: <IconSealChain />,
  },
  {
    title: "Oversight arrives after the mission already left the yard",
    description:
      "Supervisors need proactive blocks and escalations, not post-incident reconstructions when public trust is on the line.",
    icon: <IconOversightTower />,
  },
  {
    title: "Political and legal exposure from inconsistent enforcement",
    description:
      "When readiness rules differ by garage, bureau, or contractor, auditors hear a story your operators never intended to tell.",
    icon: <IconGavelRisk />,
  },
];

const CONTROL_ITEMS: MarketingIconCardItem[] = [
  {
    title: "Citizen-service grade readiness",
    description:
      "Treat every move like a regulated service: one readiness bar, one proof standard, and one escalation path leadership can defend.",
    icon: <IconCitizenService />,
  },
  {
    title: "Evidence packets, not folder dumps",
    description:
      "Structured credential, inspection, and load-proof records that survive FOIA, grant reporting, and continuity reviews.",
    icon: <IconEvidencePacket />,
  },
  {
    title: "Interagency and contractor alignment",
    description:
      "Give primes and subs the same enforcement language—BOF narrates severity, owners, and remediation without diluting policy.",
    icon: <IconInteragencySync />,
  },
  {
    title: "Continuous assurance, not annual theater",
    description:
      "Operate from a command center that stays current as rules, vehicles, and crews change—mirroring how BOF runs in elite fleet programs.",
    icon: <IconContinuousAssurance />,
  },
];

const PROCESS_STEPS = [
  {
    title: "Mobilize",
    description:
      "Inventory garages, contractors, and mission profiles where enforcement must be absolute—not advisory.",
  },
  {
    title: "Align",
    description:
      "Map policy, procurement clauses, and safety mandates to a single BOF-ready documentation and dispatch standard.",
  },
  {
    title: "Instrument",
    description:
      "Wire the command center so leadership sees the same queue operators clear before keys are issued.",
  },
  {
    title: "Assure",
    description:
      "Run continuous oversight with audit-friendly logs, remediation owners, and severity-ranked narratives finance already trusts.",
  },
] as const;

export default function GovernmentPage() {
  return (
    <>
      <MarketingGovernmentHero
        titleId="bof-mkt-gov-hero-heading"
        sectionAriaLabelledBy="bof-mkt-gov-hero-heading"
        eyebrow="Government & regulated fleets · public accountability"
        title={<>Audit-Ready Fleet Operations With Enforced Compliance</>}
        subtitle="When taxpayer trust is on the line, BOF aligns day-to-day fleet operations with documentation, oversight, and risk mitigation—without replacing your procurement stack or telematics investments."
        support="The same premium enforcement posture BOF delivers to elite private fleets—expressed for agencies, authorities, and contractors who answer to the public."
        trustItems={HERO_TRUST}
        trustAriaLabel="Government program highlights"
        imageSrc="/assets/images/hero-government-cinematic.png"
        imageAlt="Government and regulated fleet field and command operations at a glance"
        imageCaption="Audit-ready posture: evidence packets, oversight queues, and traceable readiness—one band, not a separate product mock."
        ctas={
          <>
            <Link
              href="/book-assessment"
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

      <MarketingSection variant="light" ariaLabelledBy="bof-mkt-gov-stats-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-gov-stats-heading"
            aside={<span className="bof-mkt-badge-neutral">Illustrative posture model</span>}
            title="Operational credibility for public-sector fleets"
            lead="Numbers that mirror how BOF narrates risk in the demo—ready to be replaced with your agency’s own readiness and audit posture."
          />
          <MarketingStatBand
            stats={[
              {
                label: "Policy alignment",
                value: "100%",
                hint: "Target posture when dispatch and compliance share one enforcement layer.",
              },
              {
                label: "Evidence continuity",
                value: "Live",
                hint: "Versioned credentials and proof tied to each move—not reconstructed after the fact.",
              },
              {
                label: "Oversight queue",
                value: "Unified",
                hint: "One severity-ranked narrative for safety, finance, and executive sponsors.",
              },
              {
                label: "Public accountability",
                value: "Traceable",
                hint: "Time-stamped enforcement decisions your IG team can replay with confidence.",
              },
            ]}
          />
        </div>
      </MarketingSection>

      <MarketingSection variant="white" id="pressure" ariaLabelledBy="bof-mkt-gov-pressure-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-gov-pressure-heading"
            title="Where public-sector fleets feel the heat first"
            lead="Citizens expect the same operational discipline behind the scenes that they see on the street. BOF exposes gaps before they become headlines."
          />
          <MarketingIconCardGrid items={PRESSURE_ITEMS} variant="pain" />
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="bof-mkt-gov-control-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-gov-control-heading"
            title="What BOF enforces for government programs"
            lead="Structured enforcement, premium command-center polish, and documentation that holds up when oversight tightens."
          />
          <MarketingIconCardGrid items={CONTROL_ITEMS} variant="feature" />
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="bof-mkt-gov-funnel-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-gov-funnel-heading"
            title="Assessment & savings outlook"
            lead="Stress-test directional economics and capture regulated-fleet context before a strategy call. Experiences match the rest of the BOF marketing system."
          />
          <div className="bof-mkt-split-2-col">
            <MarketingCalculatorShell
              title="Program economics outlook"
              badge="Live"
              body="Illustrative impact across risk, admin recovery, and operational leakage—useful when building internal business cases for command-center modernization."
            />
            <MarketingFormShell
              title="Agency assessment intake"
              lead="Surface compliance documentation load, proof standards, and stakeholder readiness—aligned with how BOF scopes public-sector programs."
            />
          </div>
          <div className="bof-mkt-funnel-marketing-entry">
            <MarketingFunnelEntryRow />
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="ink" ariaLabelledBy="bof-mkt-gov-process-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-gov-process-heading"
            title="How engagements run for government fleets"
            lead="Procurement-friendly sequencing that respects IT security, union partnerships, and field realities—without slowing enforcement design."
          />
          <MarketingProcessSteps steps={PROCESS_STEPS} />
          <MarketingTrustStrip
            label="Built for"
            items={[
              "Municipal transit & utilities",
              "State DOT & maintenance fleets",
              "Defense-adjacent logistics",
              "Human services & emergency response",
            ]}
          />
        </div>
      </MarketingSection>

      <MarketingSection variant="alt" className="bof-mkt-cc" ariaLabelledBy="bof-mkt-gov-cc-heading">
        <MarketingCommandCenterPreview
          headingId="bof-mkt-gov-cc-heading"
          rows={GOV_CC_ROWS}
          title="What your oversight team would see on Monday"
          lead="Swap illustrative metrics for your garages, contractors, and programs—BOF still tells one severity-ranked story across compliance, proof, and capital."
          demoLabel="Open the demo command center →"
        />
      </MarketingSection>

      <MarketingCtaPanel
        id="bof-mkt-gov-final-cta"
        title="Bring defensible fleet enforcement to your agency"
        lead="Book a government fleet assessment. We map documentation gaps, contractor variance, and capital risk—then show how BOF would govern it under public scrutiny."
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
