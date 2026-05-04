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
  title: "BackOfficeFleet | Front office built so drivers can win",
  description:
    "When dispatch, proof, and billing signals disagree, the whole operation misses. BOF aligns the front office with what drivers need—pretrip discipline, clean documentation, and truth that holds through settlement and claims.",
};

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
              src="/generated/marketing/demoheroimage.png"
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
                    Executive Operations Cockpit
                  </p>
                  <h1
                    id="bof-mkt-hero-heading"
                    style={{
                      margin: "0.55rem 0 0",
                      color: "#fff",
                      fontWeight: 700,
                      lineHeight: 1.14,
                      fontSize: "clamp(1.85rem, 4vw, 3.15rem)",
                    }}
                  >
                    The Back Office Platform Built for Freight Operations
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
                    BOF unifies dispatch, drivers, documents, compliance, proof, settlements, and revenue risk in one operating
                    view.
                  </p>
                  <div
                    className="bof-mkt-home-hero-integrated__ctas"
                    style={{ marginTop: "1.15rem", flexWrap: "wrap", rowGap: "0.5rem" }}
                  >
                    <BookDemoLink className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary">
                      Book a Demo
                    </BookDemoLink>
                    <Link href="/dispatch" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
                      Open Dispatch Board
                    </Link>
                    <Link href="/dashboard#attention-queue" className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary">
                      Review Attention Queue
                    </Link>
                  </div>

                  <nav aria-label="BOF by fleet type" style={{ marginTop: "1.35rem" }}>
                    <ul
                      className="bof-mkt-home-audience__list"
                      style={{
                        justifyContent: "flex-start",
                        margin: 0,
                      }}
                    >
                      <li>
                        <Link href="/for-hire-carriers" className="bof-mkt-home-audience__pill">
                          For-Hire Carriers
                        </Link>
                      </li>
                      <li>
                        <Link href="/private-fleets" className="bof-mkt-home-audience__pill">
                          Private Fleets
                        </Link>
                      </li>
                      <li>
                        <Link href="/government" className="bof-mkt-home-audience__pill">
                          Government
                        </Link>
                      </li>
                    </ul>
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
