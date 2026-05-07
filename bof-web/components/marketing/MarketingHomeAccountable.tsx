/**
 * BOF Shared Component:
 * Used by: / (via app/(marketing)/page.tsx)
 * Do not edit for one page unless props/page-specific overrides are used.
 * See docs/BOF_ROUTE_MAP.md.
 */
import Link from "next/link";
import Image from "next/image";
import {
  MarketingCommandCenterPreview,
  MarketingCtaPanel,
  MarketingIconCardGrid,
  MarketingServiceTiers,
  MarketingSection,
  MarketingSectionHeader,
} from "@/components/marketing";
import { BofLogo } from "@/components/BofLogo";
import { BookDemoLink } from "@/components/BookDemoLink";
import { IconDispatch, IconLoadProof, IconShield } from "@/components/marketing/MarketingHomeIcons";
import type { MarketingIconCardItem } from "@/components/marketing/MarketingIconCardGrid";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "BackOfficeFleet | The Complete Back-Office Operating System for Trucking",
  description:
    "BOF is the back-office operating system that unifies dispatch, driver management, fleet financials, compliance, and customer communication. One platform for complete operational control and profitability.",
};

const DIFFERENTIATOR_POINTS = [
  {
    title: "Unified Operating System",
    description:
      "BOF is the complete back-office operating system that unifies dispatch, driver management, fleet financials, compliance, and customer communication in one platform.",
  },
  {
    title: "Real-Time Operational Control",
    description:
      "From dispatch to settlement, BOF provides complete visibility and control over every aspect of your trucking operation with real-time data and automated workflows.",
  },
  {
    title: "Profitability-First Design",
    description:
      "Every feature is built to improve your bottom line. BOF connects operational data directly to financial outcomes, helping you make smarter decisions faster.",
  },
] as const;

const AUTOMATION_ITEMS: MarketingIconCardItem[] = [
  {
    title: "Dispatch & Load Management",
    description: "Automated load intake, intelligent dispatch, and real-time load tracking across your entire fleet.",
    icon: <IconDispatch />,
  },
  {
    title: "Driver Management & Compliance",
    description: "Complete driver lifecycle management, credential tracking, and automated compliance monitoring.",
    icon: <IconShield />,
  },
  {
    title: "Fleet Financials & Settlement",
    description: "Real-time profitability tracking, driver pay/settlement methods, and comprehensive cash flow management.",
    icon: <IconLoadProof />,
  },
  {
    title: "Document & Proof Management",
    description: "Automated document workflows, proof capture, and audit-ready documentation packages.",
    icon: <IconLoadProof />,
  },
  {
    title: "Customer Communication & Portals",
    description: "Automated customer updates, portal access, and professional communication workflows.",
    icon: <IconDispatch />,
  },
];

const STAKEHOLDER_PAIN = [
  {
    title: "For management / ownership",
    points: [
      "Complete operational visibility across dispatch, drivers, and finances",
      "Real-time profitability tracking and cash flow management",
      "Automated compliance monitoring and audit readiness",
    ],
  },
  {
    title: "For for-hire carriers",
    points: [
      "Unified dispatch and compliance workflows eliminate credential drift",
      "Integrated proof capture tied directly to settlement and billing",
      "Automated revenue protection and dispute resolution",
      "Scalable driver management with automated enforcement",
    ],
  },
  {
    title: "For drivers",
    points: [
      "Clear dispatch instructions and automated readiness checks",
      "Simplified document workflows and faster issue resolution",
      "Transparent pay/settlement methods and fewer disputes",
    ],
  },
  {
    title: "For customers",
    points: [
      "Real-time shipment tracking and automated status updates",
      "Professional customer portal with document access",
      "Consistent service quality and communication",
    ],
  },
] as const;

export default function MarketingHomeAccountable() {
  return (
    <>
      <section className="bof-home-tight-hero" aria-labelledby="bof-mkt-hero-heading">
        <div className="bof-mkt-container">
          <div
            style={{
              position: "relative",
              width: "100%",
              minHeight: "clamp(520px, 68vw, 680px)",
              maxHeight: "680px",
              borderRadius: "14px",
              overflow: "hidden",
              background: "#030712",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {/* Background art only — do not use bof-mkt-home-hero-integrated__image here:
                globals force object-fit:contain under .bof-home-tight-hero and expose baked-in screenshot chrome. */}
            <Image
              src="/generated/marketing/demoheroimage-v2.png"
              alt="BOF demo operations hero visual"
              fill
              priority
              sizes="100vw"
              style={{
                zIndex: 0,
                objectFit: "cover",
                objectPosition: "right top",
              }}
            />

            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 2,
                pointerEvents: "none",
                background:
                  "linear-gradient(90deg, #030712 0%, rgba(3,7,18,0.96) 10%, rgba(3,7,18,0.82) 38%, rgba(3,7,18,0.2) 72%, rgba(3,7,18,0.06) 100%)",
              }}
            />

            <div
              aria-hidden
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: "clamp(150px, 24vw, 210px)",
                zIndex: 2,
                pointerEvents: "none",
                background:
                  "linear-gradient(to top, #030712 0%, rgba(3,7,18,0.95) 42%, rgba(3,7,18,0.5) 72%, transparent 100%)",
              }}
            />

            <div
              aria-hidden
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                height: "clamp(64px, 11vw, 92px)",
                zIndex: 2,
                pointerEvents: "none",
                background: "linear-gradient(to bottom, rgba(3,7,18,0.88) 0%, transparent 100%)",
              }}
            />

            <div
              style={{
                position: "relative",
                zIndex: 4,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "clamp(520px, 68vw, 680px)",
                maxHeight: "680px",
                padding: "clamp(16px, 2.6vw, 30px)",
              }}
            >
              <div style={{ position: "relative", zIndex: 5 }}>
                <BofLogo variant="dark" className="bof-mkt-home-hero-logo" priority />
              </div>

              <div
                style={{
                  flex: "1 1 auto",
                  display: "flex",
                  alignItems: "center",
                  paddingBottom: "clamp(6px, 1.5vw, 14px)",
                }}
              >
                <div style={{ maxWidth: "760px", width: "100%" }}>
                  <p
                    style={{
                      margin: 0,
                      color: "#5eead4",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                    }}
                  >
                    Back-Office Operating System
                  </p>
                  <h1
                    id="bof-mkt-hero-heading"
                    style={{
                      margin: "0.55rem 0 0",
                      color: "#fff",
                      fontWeight: 700,
                      lineHeight: 1.14,
                      fontSize: "clamp(1.8rem, 3.8vw, 3rem)",
                    }}
                  >
                    BOF takes over the back office for fleets.
                  </h1>
                  <p
                    style={{
                      margin: "0.95rem 0 0",
                      color: "#e2e8f0",
                      fontSize: "clamp(1rem, 1.8vw, 1.22rem)",
                      lineHeight: 1.55,
                      maxWidth: "56ch",
                    }}
                  >
                    Dispatch, documents, driver readiness, HR, payroll, finance, factoring, compliance, customer proof, fleet financials, and audit-ready records — all connected in one accountable operating system.
                  </p>
                  <div
                    className="bof-mkt-home-hero-integrated__ctas"
                    style={{ marginTop: "1.15rem", flexWrap: "wrap", rowGap: "0.5rem" }}
                  >
                    <Link href="/command-center" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
                      Open Command Center
                    </Link>
                    <Link href="/fleet-financials" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
                      View Fleet Financials
                    </Link>
                    <Link href="/drivers" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
                      Review Driver Management
                    </Link>
                  </div>
                  <p style={{ margin: "0.65rem 0 0", color: "#94a3b8", fontSize: "0.86rem" }}>
                    Live demo data · 12 drivers · 12 loads · document and proof workflows wired
                  </p>
                  <p style={{ margin: "0.45rem 0 0", fontSize: "0.9rem" }}>
                    <BookDemoLink className="text-teal-300 hover:text-teal-200">Talk to BOF</BookDemoLink>
                  </p>

                  <nav aria-label="BOF by fleet type" style={{ marginTop: "1.35rem" }}>
                    <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.9rem" }}>
                      Built for:{" "}
                      <Link href="/for-hire-carriers" className="text-slate-200 hover:text-white">
                        For-Hire Carriers
                      </Link>{" "}
                      ·{" "}
                      <Link href="/private-fleets" className="text-slate-200 hover:text-white">
                        Private Fleets
                      </Link>{" "}
                      ·{" "}
                      <Link href="/government" className="text-slate-200 hover:text-white">
                        Government Fleets
                      </Link>
                    </p>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <MarketingSection variant="light" ariaLabelledBy="bof-mkt-different-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-different-heading"
            title="The Complete Back-Office Operating System"
            lead="BOF unifies every aspect of trucking operations—dispatch, drivers, finances, compliance, and customer communication—in one powerful platform built for profitability and scale."
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
            title="Complete Operational Control"
            lead="BOF provides the tools and automation to manage every aspect of your trucking operation. From dispatch to settlement, every workflow is designed for efficiency, accuracy, and profitability."
          />
          <MarketingIconCardGrid items={AUTOMATION_ITEMS} variant="feature" />
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="bof-mkt-portals-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-portals-heading"
            title="Three Portals. One Operating System."
            lead="BOF provides specialized portals for each stakeholder, all unified through the same back-office operating system."
          />
          <div className="bof-mkt-hub">
            <article className="bof-mkt-hub-node bof-mkt-hub-node--top">
              <h3>Manager Portal</h3>
              <p>Control the fleet back office with operational insights, cash flow visibility, and audit readiness metrics.</p>
              <Link href="/portals/manager" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary" style={{ marginTop: '1rem' }}>
                Open Manager Portal
              </Link>
            </article>
            <article className="bof-mkt-hub-core">
              <h3>BOF</h3>
              <p>Unified Operating System</p>
            </article>
            <article className="bof-mkt-hub-node bof-mkt-hub-node--left">
              <h3>Driver Portal</h3>
              <p>Execute assignments and manage required documents, settlements, and compliance workflows.</p>
              <Link href="/portals/driver" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary" style={{ marginTop: '1rem' }}>
                Open Driver Portal
              </Link>
            </article>
            <article className="bof-mkt-hub-node bof-mkt-hub-node--right">
              <h3>Customer Portal</h3>
              <p>See shipment status, proof, exceptions, and invoice readiness with professional communication.</p>
              <Link href="/portals/customer" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary" style={{ marginTop: '1rem' }}>
                Open Customer Portal
              </Link>
            </article>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="bof-mkt-service-tiers-heading">
        <MarketingServiceTiers />
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="bof-mkt-stakeholder-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-stakeholder-heading"
            title="Benefits for Every Role"
            lead="From management to drivers to customers, BOF provides specific benefits that improve efficiency, profitability, and communication across your entire operation."
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

      <MarketingSection variant="white" ariaLabelledBy="bof-mkt-vault-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-vault-heading"
            title="Company Operations Vault"
            lead="Policies, SOPs, HR records, payroll procedures, finance controls, privacy/security policies, AI governance, vendor controls, and audit-readiness documents organized by business function."
          />
          <div className="bof-mkt-hub">
            <article className="bof-mkt-hub-core">
              <h3>Complete Document Management</h3>
              <p>All operational policies, procedures, and compliance documents centralized and organized by business function for easy access and audit readiness.</p>
              <Link href="/documents/company-operations-vault" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary" style={{ marginTop: '1rem' }}>
                Open Company Operations Vault
              </Link>
            </article>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="white" ariaLabelledBy="bof-mkt-center-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-center-heading"
            title="The Back-Office Operating System"
            lead="BOF connects every aspect of your trucking operation—dispatch, drivers, fleet financials, compliance, and customers—through one unified platform."
          />
          <div className="bof-mkt-hub">
            <article className="bof-mkt-hub-node bof-mkt-hub-node--top">
              <h3>Fleet Financials</h3>
              <p>Turn each load into a financial event with load-level profitability, editable assumptions, cash-flow forecasts, factoring visibility, asset/debt allocation, and management P&L previews. Identify billing blockers, accelerate receivables, model factoring decisions, and forecast settlement, fuel, insurance, debt, and reserve-release timing.</p>
              <Link href="/fleet-financials" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary" style={{ marginTop: '1rem' }}>
                Open Fleet Financials
              </Link>
            </article>
            <article className="bof-mkt-hub-core">
              <h3>BOF</h3>
              <p>Back-Office Operating System</p>
            </article>
            <article className="bof-mkt-hub-node bof-mkt-hub-node--left">
              <h3>Driver Management & Compliance</h3>
              <p>BOF supports employee drivers and owner-operators with worker-type specific onboarding, HR/payroll records, owner-operator packets, settlement methods, and policy acknowledgments. Fuel, mileage, proof, invoice, settlement, and asset records are organized for tax and regulatory audit readiness.</p>
            </article>
            <article className="bof-mkt-hub-node bof-mkt-hub-node--right">
              <h3>Dispatch & Operations</h3>
              <p>Trucking dispatch, load proof, BOL/POD management, customer visibility, claims/exceptions handling, and document readiness—all connected through the same operating system.</p>
            </article>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="light" ariaLabelledBy="bof-mkt-preview-heading">
        <div className="bof-mkt-container">
          <MarketingSectionHeader
            titleId="bof-mkt-preview-heading"
            title="Experience the Complete Back-Office Operating System"
            lead="Explore the live BOF dashboards that demonstrate complete operational control and profitability management."
          />
          <div className="bof-mkt-preview-grid">
            <Link href="/command-center" className="bof-mkt-preview-card">
              <h3>Command Center</h3>
              <p>Complete operational overview, KPIs, and system-wide visibility.</p>
              <span>Open command center</span>
            </Link>
            <Link href="/fleet-financials" className="bof-mkt-preview-card">
              <h3>Fleet Financials</h3>
              <p>Real-time profitability, driver settlements, and cash flow management.</p>
              <span>View fleet financials</span>
            </Link>
            <Link href="/drivers" className="bof-mkt-preview-card">
              <h3>Driver Management</h3>
              <p>Driver lifecycle, compliance, readiness, and settlement workflows.</p>
              <span>Manage drivers</span>
            </Link>
          </div>
        </div>
      </MarketingSection>

      <MarketingSection variant="alt" className="bof-mkt-cc" ariaLabelledBy="bof-mkt-cc-heading">
        <MarketingCommandCenterPreview headingId="bof-mkt-cc-heading" />
      </MarketingSection>

      <MarketingCtaPanel
        id="bof-mkt-final-cta-heading"
        title="Transform Your Back-Office Operations"
        lead="Schedule a personalized demo of BOF's complete back-office operating system. See how unified dispatch, driver management, fleet financials, and compliance can transform your profitability and operational control."
      >
        <Link href="/book-assessment" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
          Schedule Demo
        </Link>
        <Link href="/command-center" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
          Explore System
        </Link>
      </MarketingCtaPanel>
    </>
  );
}
