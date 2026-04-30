import type { Metadata } from "next";
import Link from "next/link";
import {
  MarketingCalculatorShell,
  MarketingCommandCenterPreview,
  type CcMockRow,
  MarketingCtaPanel,
  MarketingFormShell,
  MarketingFunnelEntryRow,
  MarketingBofVaultHero,
  MarketingIconCardGrid,
  MarketingProcessSteps,
  MarketingSection,
  MarketingSectionHeader,
  MarketingStatBand,
  MarketingTrustStrip,
} from "@/components/marketing";
import type { MarketingIconCardItem } from "@/components/marketing/MarketingIconCardGrid";
import {
  IconAuditReadiness,
  IconCredentialStack,
  IconDispatchHook,
  IconFleetVerifier,
  IconUploadOnce,
  IconVaultLock,
  IconVerifyCheck,
  IconVersionFork,
} from "@/components/marketing/MarketingVaultIcons";

export const metadata: Metadata = {
  title: "BOF Vault | BackOfficeFleet",
  description:
    "Drivers upload once. Fleets verify instantly. Compliance stays current.",
};

const HERO_TRUST = [
  "Driver-controlled document storage",
  "Organized by credential and requirement",
  "Readiness checks before the next job depends on it",
  "Clear view of missing, expired, or review-needed items",
] as const;

const VAULT_CC_ROWS: readonly CcMockRow[] = [
  {
    label: "Vault queue",
    title: "Documents awaiting verification",
    meta: "CDL · Med card · MVR variance",
    val: "18",
    valClass: "",
  },
  {
    label: "Credential drift",
    title: "Version conflicts",
    meta: "Superseded uploads · policy mismatch",
    val: "5",
    valClass: "bof-mkt-cc-mock-kpi-val--warn",
  },
  {
    label: "Dispatch hooks",
    title: "Loads blocked on proof",
    meta: "Vault status → readiness gate",
    val: "7",
    valClass: "",
  },
  {
    label: "Settlement bridge",
    title: "Holds tied to missing proof",
    meta: "Linkage to money-at-risk narratives",
    val: "$31K",
    valClass: "",
  },
  {
    label: "Security posture",
    title: "PII exposure watch",
    meta: "Access trails · controlled distribution",
    val: "Low",
    valClass: "",
  },
];

const PRESSURE_ITEMS: MarketingIconCardItem[] = [
  {
    title: "Drivers re-upload the same credential everywhere",
    description:
      "Every broker, yard, and internal system asks for another copy—version drift becomes inevitable and auditors see chaos.",
    icon: <IconUploadOnce />,
  },
  {
    title: "Verification happens in email threads, not systems",
    description:
      "Fleet teams bless files without structured checks against dispatch rules, settlement holds, or compliance windows.",
    icon: <IconVerifyCheck />,
  },
  {
    title: "No authoritative record when disputes ignite",
    description:
      "Finance and legal reconstruct proof from attachments instead of opening a single, time-stamped chain of custody.",
    icon: <IconVersionFork />,
  },
  {
    title: "Security theater instead of controlled access",
    description:
      "Sensitive files live in shared drives with loose permissions—far from the enterprise posture elite fleets expect.",
    icon: <IconVaultLock />,
  },
];

const CONTROL_ITEMS: MarketingIconCardItem[] = [
  {
    title: "Credential stack with versioning",
    description:
      "Drivers upload once; BOF Vault tracks status, superseded files, and who verified each artifact against fleet policy.",
    icon: <IconCredentialStack />,
  },
  {
    title: "Fleet verification against real rules",
    description:
      "Pair vault status with dispatch, settlement, and compliance engines so approvals mean the same thing in every department.",
    icon: <IconFleetVerifier />,
  },
  {
    title: "Operational hooks—not a passive archive",
    description:
      "Vault health feeds the command center, driver readiness, and settlement intelligence without duplicate data entry.",
    icon: <IconDispatchHook />,
  },
  {
    title: "Audit readiness by construction",
    description:
      "Evidence packets stay structured for regulators, customers, and internal audit—mirroring the BOF demo document vault.",
    icon: <IconAuditReadiness />,
  },
];

const PROCESS_STEPS = [
  {
    title: "Ingest",
    description:
      "Centralize uploads with clear ownership, classification, and retention aligned to your risk committee’s standards.",
  },
  {
    title: "Verify",
    description:
      "Apply fleet-defined checks, dual control where required, and automatic alignment to dispatch readiness rules.",
  },
  {
    title: "Govern",
    description:
      "Surface drift, expirations, and exceptions in the same severity language operations and finance already use.",
  },
  {
    title: "Integrate",
    description:
      "Push verified truth into BOF command center workflows—settlements, audits, and partner-facing attestations stay synchronized.",
  },
] as const;

export default function BofVaultPage() {
  return (
    <>
      <MarketingBofVaultHero
        titleId="bof-mkt-vault-hero-heading"
        sectionAriaLabelledBy="bof-mkt-vault-hero-heading"
        eyebrow="BOF Vault · Driver readiness"
        title={<>Keep Your Driving Documents Ready Before You Need Them</>}
        subtitle="BOF Vault gives drivers one secure place to upload, organize, and maintain the records that matter—so expired, missing, or incomplete documents do not slow the next opportunity."
        support="Upload once. BOF helps evaluate your file, flag issues, and keep your credentials ready for onboarding, dispatch, or carrier review when the time comes."
        trustItems={HERO_TRUST}
        trustAriaLabel="BOF Vault capability highlights"
        imageSrc="/assets/images/BofVaultHero2.png"
        imageAlt="Driver-controlled BOF Vault document storage and readiness system"
        ctas={null}
      />

      <MarketingSection variant="light" ariaLabelledBy="bof-mkt-vault-stats-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-vault-stats-heading"
            aside={<span className="bof-mkt-badge-neutral">Illustrative posture model</span>}
            title="Enterprise-grade credential posture"
            lead="These markers mirror how BOF narrates document health inside the demo—swap them for your fleet’s verified KPIs when ready."
          />
          <MarketingStatBand
            stats={[
              {
                label: "Single source",
                value: "1",
                hint: "One driver file of record feeding operational systems.",
              },
              {
                label: "Verification SLA",
                value: "< 24h",
                hint: "Target posture when fleet teams clear high-volume queues daily.",
              },
              {
                label: "Version integrity",
                value: "100%",
                hint: "Superseded artifacts remain traceable for audit replay.",
              },
              {
                label: "Security tier",
                value: "Zero-trust",
                hint: "Controlled access paths aligned to enterprise procurement standards.",
              },
            ]}
          />
        </div>
      </MarketingSection>

      <MarketingSection variant="white" id="pressure" ariaLabelledBy="bof-mkt-vault-pressure-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-vault-pressure-heading"
            title="Where credential programs break first"
            lead="BOF Vault exists because scattered files quietly cap how elite your enforcement can feel—internally and in front of customers."
          />
          <MarketingIconCardGrid items={PRESSURE_ITEMS} variant="pain" />
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="bof-mkt-vault-control-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-vault-control-heading"
            title="What BOF Vault delivers inside the ecosystem"
            lead="Premium, secure, operationally credible—Vault is the document spine that makes the command center believable."
          />
          <MarketingIconCardGrid items={CONTROL_ITEMS} variant="feature" />
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="bof-mkt-vault-funnel-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-vault-funnel-heading"
            title="Assessment & savings outlook"
            lead="Run the same live calculator and assessment as the rest of BOF marketing—then qualify for a strategy conversation when you are ready to talk integrations."
          />
          <div className="bof-mkt-split-2-col">
            <MarketingCalculatorShell
              title="Credential economics outlook"
              badge="Live"
              body="Directional savings narrative for high-assurance fleets: compliance variance, proof friction, and admin recovery—grounded in the shared BOF savings engine."
            />
            <MarketingFormShell
              title="Vault readiness intake"
              lead="Use the structured assessment to capture verifier workflows, integration targets, and urgency alongside fleet scale."
            />
          </div>
          <div className="bof-mkt-funnel-marketing-entry">
            <MarketingFunnelEntryRow />
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="ink" ariaLabelledBy="bof-mkt-vault-process-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-vault-process-heading"
            title="How vault programs roll out with BOF"
            lead="Security, operations, and compliance stay in lockstep—mirroring the same disciplined cadence as private fleet and government deployments."
          />
          <MarketingProcessSteps steps={PROCESS_STEPS} />
          <MarketingTrustStrip
            label="Trusted by teams who care about"
            items={[
              "SOC-style governance",
              "Settlement-ready proof",
              "Partner audits",
              "Regulated cargo programs",
            ]}
          />
        </div>
      </MarketingSection>

      <MarketingSection variant="alt" className="bof-mkt-cc" ariaLabelledBy="bof-mkt-vault-cc-heading">
        <MarketingCommandCenterPreview
          headingId="bof-mkt-vault-cc-heading"
          rows={VAULT_CC_ROWS}
          title="How vault health surfaces inside the command center"
          lead="The same premium BOF command view—now narrating credential queues, dispatch blocks, and settlement pressure tied back to vault truth."
          demoLabel="Open the demo command center →"
        />
      </MarketingSection>

      <MarketingCtaPanel
        id="bof-mkt-vault-final-cta"
        title="Make credentials as defensible as your operations"
        lead="Book a vault + command center assessment. We map upload chaos, verifier gaps, and integration debt—then show how BOF ties it together."
      >
        <Link href="/book-assessment" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
          Take The Assessment
        </Link>
        <Link href="/drivers" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
          See The Demo
        </Link>
      </MarketingCtaPanel>
    </>
  );
}
