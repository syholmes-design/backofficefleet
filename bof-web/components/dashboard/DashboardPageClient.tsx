"use client";

import Link from "next/link";
import Image from "next/image";

// Helper array for action card configuration with distinct images and proper cropping
const ACTION_CARDS = [
  {
    title: "Command Center",
    subtitle: "Operations & exceptions",
    href: "/command-center",
    cta: "Open →",
    imageSrc: "/generated/marketing/dispatch-command-center-hero.png",
    imagePosition: "center 40%",
    color: "#14b8a6",
  },
  {
    title: "Drivers",
    subtitle: "Readiness & compliance",
    href: "/drivers",
    cta: "Review →",
    imageSrc: "/assets/images/bof-landing-hero-clean.png",
    imagePosition: "center 35%",
    color: "#3b82f6",
  },
  {
    title: "Dispatch / Loads",
    subtitle: "Dispatch, proof, and load lifecycle",
    href: "/dispatch",
    cta: "Explore →",
    imageSrc: "/evidence/loads/L001/trailer-loaded.jpg",
    imagePosition: "center 50%",
    color: "#a855f7",
  },
  {
    title: "Documents",
    subtitle: "Driver, company, and proof vaults",
    href: "/documents",
    cta: "View →",
    imageSrc: "/assets/images/hero-bof-vault.png",
    imagePosition: "center 45%",
    color: "#fb923c",
  },
  {
    title: "Settlements",
    subtitle: "Pay, deductions, and finance",
    href: "/settlements",
    cta: "View →",
    imageSrc: "/generated/marketing/bof-back-office-operating-system-hero.png",
    imagePosition: "center 40%",
    color: "#22c55e",
  },
  {
    title: "Safety",
    subtitle: "Incidents, scorecards, and risk",
    href: "/safety",
    cta: "View →",
    imageSrc: "/assets/images/safety_event_evidence_1.png",
    imagePosition: "center 60%",
    color: "#ef4444",
  },
  {
    title: "Portals",
    subtitle: "Manager, driver, and customer views",
    href: "/portals",
    cta: "Access →",
    imageSrc: "/assets/images/private-fleets-hero-new.png",
    imagePosition: "center 50%",
    color: "#6366f1",
  },
];

const HERO_CTA_LINKS = [
  { label: "Open Command Center", href: "/command-center", primary: true },
  { label: "Review Driver Readiness", href: "/drivers" },
  { label: "View Settlements", href: "/settlements" },
  { label: "Explore Dispatch Proof", href: "/dispatch" },
];

const HERO_KPI_LINKS = [
  {
    label: "Loads Ready",
    value: "24",
    href: "/dispatch",
    helper: "Dispatch-ready loads with route, proof, and driver checks.",
  },
  {
    label: "Needs Action",
    value: "8",
    href: "/command-center",
    helper: "Open operational risks across dispatch, safety, settlement, and compliance.",
  },
  {
    label: "Documents Ready",
    value: "15",
    href: "/documents",
    helper: "Driver, load, finance, and company-operation documents available.",
  },
  {
    label: "Settlement Blockers",
    value: "6",
    href: "/settlements",
    helper: "Holds tied to proof, safety, claims, or compliance gaps.",
  },
  {
    label: "Proof Complete",
    value: "43",
    href: "/dispatch",
    helper: "BOL, POD, RFID, seal, cargo, and delivery proof records.",
  },
  {
    label: "Dispatch Readiness",
    value: "82%",
    href: "/dispatch",
    helper: "Loads that pass readiness, route, compliance, and proof checks.",
  },
];

export function DashboardPageClient() {
  return (
    <div className="bof-page bof-cc-page bof-dashboard-page" style={{ paddingBottom: '6rem' }}>
      {/* Full-bleed hero section with premium dispatch-command-center-hero.png background */}
      <section
        style={{
          position: "relative",
          width: "100vw",
          marginLeft: "calc(50% - 50vw)",
          marginRight: "calc(50% - 50vw)",
          minHeight: "clamp(720px, 70vw, 900px)",
          overflow: "hidden",
          background: "#020617",
        }}
      >
        {/* Premium hero image with dispatch-command-center-hero.png (no baked-in text) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1,
          }}
        >
          <Image
            src="/generated/marketing/dispatch-command-center-hero.png"
            alt="BackOfficeFleet Command Center Dashboard - Complete back-office operations including dispatch, compliance, documents, finance, settlements, maintenance, and RFID proof workflows"
            fill
            style={{
              objectFit: "cover",
              objectPosition: "center 40%",
              width: "100%",
              height: "100%",
            }}
            priority
          />
        </div>

        {/* Stronger dark gradient overlay for better text readability */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(180deg, rgba(2,6,23,0.96) 0%, rgba(2,6,23,0.86) 42%, rgba(2,6,23,0.97) 100%)",
            zIndex: 2,
          }}
        />

        {/* Hero content overlay */}
        <div
          style={{
            position: "relative",
            zIndex: 4,
            minHeight: "clamp(720px, 70vw, 900px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "6rem 2rem 5rem",
          }}
        >
          {/* Title and subtitle section */}
          <div
            style={{
              textAlign: "center",
              maxWidth: "1100px",
              margin: "0 auto",
            }}
          >
            <h1
              style={{
                fontSize: "clamp(2.5rem, 5vw, 4rem)",
                fontWeight: "700",
                lineHeight: "1.1",
                margin: "0 0 1.5rem 0",
                color: "#ffffff",
                textShadow: "0 2px 4px rgba(0,0,0,0.4)",
              }}
            >
              BackOfficeFleet Command Center
            </h1>
            <p
              style={{
                fontSize: "clamp(1.1rem, 2.5vw, 1.4rem)",
                lineHeight: "1.6",
                color: "rgba(255, 255, 255, 0.95)",
                margin: "0 0 2.5rem 0",
                maxWidth: "800px",
                marginLeft: "auto",
                marginRight: "auto",
                textShadow: "0 1px 2px rgba(0,0,0,0.4)",
              }}
            >
              See how BackOfficeFleet manages dispatch, compliance, documents, HR, payroll, finance, settlements, maintenance, procurement, RFID proof, and exception management in one accountable operating system.
            </p>

            {/* Primary CTA buttons */}
            <div
              style={{
                display: "flex",
                gap: "1rem",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              {HERO_CTA_LINKS.map((cta) => (
                <Link
                  key={cta.href}
                  href={cta.href}
                  className="bof-dashboard-hero-cta"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "56px",
                    padding: "1rem 1.45rem",
                    backgroundColor: cta.primary ? "#14b8a6" : "rgba(255, 255, 255, 0.15)",
                    color: "white",
                    textDecoration: "none",
                    borderRadius: "8px",
                    fontSize: "1.05rem",
                    fontWeight: "700",
                    transition: "all 0.2s ease",
                    border: cta.primary ? "1px solid rgba(153, 246, 228, 0.55)" : "1px solid rgba(255, 255, 255, 0.3)",
                    cursor: "pointer",
                    boxShadow: cta.primary ? "0 18px 36px rgba(20, 184, 166, 0.22)" : "0 12px 26px rgba(0,0,0,0.18)",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  {cta.label} &rarr;
                </Link>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "1rem",
              width: "100%",
              maxWidth: "1120px",
              marginTop: "3rem",
            }}
          >
            {HERO_KPI_LINKS.map((card) => (
              <Link
                key={card.label}
                href={card.href}
                className="bof-dashboard-hero-kpi"
                aria-label={`${card.label}: ${card.helper}`}
                style={{
                  display: "block",
                  minHeight: "150px",
                  padding: "1.25rem",
                  color: "white",
                  textAlign: "left",
                  textDecoration: "none",
                  borderRadius: "14px",
                  border: "1px solid rgba(255, 255, 255, 0.14)",
                  backgroundColor: "rgba(2, 6, 23, 0.72)",
                  boxShadow: "0 20px 40px rgba(0, 0, 0, 0.28)",
                  backdropFilter: "blur(14px)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: "rgba(226, 232, 240, 0.88)",
                        fontSize: "0.95rem",
                        fontWeight: 700,
                      }}
                    >
                      {card.label}
                    </div>
                    <div
                      style={{
                        color: "#ffffff",
                        fontSize: "2.4rem",
                        fontWeight: 800,
                        letterSpacing: "0",
                        lineHeight: 1.1,
                        marginTop: "0.55rem",
                      }}
                    >
                      {card.value}
                    </div>
                  </div>
                  <span
                    style={{
                      border: "1px solid rgba(45, 212, 191, 0.32)",
                      borderRadius: "999px",
                      color: "#ccfbf1",
                      backgroundColor: "rgba(20, 184, 166, 0.12)",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      padding: "0.35rem 0.65rem",
                    }}
                  >
                    Open
                  </span>
                </div>
                <p
                  style={{
                    color: "rgba(203, 213, 225, 0.9)",
                    fontSize: "0.92rem",
                    lineHeight: 1.55,
                    margin: "1rem 0 0",
                  }}
                >
                  {card.helper}
                </p>
              </Link>
            ))}
          </div>
        </div>
        <style jsx>{`
          .bof-dashboard-hero-cta:hover {
            transform: translateY(-2px);
            border-color: rgba(153, 246, 228, 0.82) !important;
            background-color: rgba(20, 184, 166, 0.82) !important;
          }

          .bof-dashboard-hero-cta:focus-visible,
          .bof-dashboard-hero-kpi:focus-visible {
            outline: 3px solid rgba(153, 246, 228, 0.95);
            outline-offset: 3px;
          }

          .bof-dashboard-hero-kpi:hover {
            transform: translateY(-4px);
            border-color: rgba(153, 246, 228, 0.68) !important;
            background-color: rgba(15, 23, 42, 0.88) !important;
          }
        `}</style>
      </section>

      {/* Fleet Operations Manager Card */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "2rem 2rem 4rem",
        }}
        aria-label="Fleet Operations Manager"
      >
        <Link
          href="/command-center"
          style={{
            display: "block",
            textDecoration: "none",
            color: "inherit",
            borderRadius: "16px",
            overflow: "hidden",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            backdropFilter: "blur(10px)",
            transition: "all 0.3s ease",
            cursor: "pointer",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 2fr",
              gap: "2rem",
              minHeight: "200px",
            }}
          >
            {/* Manager visual from dispatch-command-center-hero.png */}
            <div
              style={{
                position: "relative",
                overflow: "hidden",
                borderRadius: "12px",
              }}
            >
              <Image
                src="/generated/marketing/dispatch-command-center-hero.png"
                alt="Fleet Operations Manager reviewing dispatch and compliance data"
                fill
                style={{
                  objectFit: "cover",
                  objectPosition: "center 30%",
                }}
              />
            </div>

            {/* Manager content */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                padding: "2rem",
              }}
            >
              <h2
                style={{
                  fontSize: "1.8rem",
                  fontWeight: "600",
                  color: "#ffffff",
                  margin: "0 0 1rem 0",
                }}
              >
                Fleet Operations Manager
              </h2>
              <p
                style={{
                  fontSize: "1.1rem",
                  lineHeight: "1.6",
                  color: "rgba(255, 255, 255, 0.9)",
                  margin: "0 0 1.5rem 0",
                }}
              >
                Reviewing driver readiness, dispatch exceptions, document holds, safety events, and settlement issues before today&apos;s loads move.
              </p>

              {/* Status chips */}
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  marginBottom: "1.5rem",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0.25rem 0.75rem",
                    backgroundColor: "rgba(34, 197, 94, 0.2)",
                    border: "1px solid rgba(34, 197, 94, 0.3)",
                    borderRadius: "20px",
                    fontSize: "0.85rem",
                    color: "#22c55e",
                    fontWeight: "500",
                  }}
                >
                  Driver readiness
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0.25rem 0.75rem",
                    backgroundColor: "rgba(251, 146, 60, 0.2)",
                    border: "1px solid rgba(251, 146, 60, 0.3)",
                    borderRadius: "20px",
                    fontSize: "0.85rem",
                    color: "#fb923c",
                    fontWeight: "500",
                  }}
                >
                  Dispatch exceptions
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0.25rem 0.75rem",
                    backgroundColor: "rgba(239, 68, 68, 0.2)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    borderRadius: "20px",
                    fontSize: "0.85rem",
                    color: "#ef4444",
                    fontWeight: "500",
                  }}
                >
                  Document holds
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0.25rem 0.75rem",
                    backgroundColor: "rgba(168, 85, 247, 0.2)",
                    border: "1px solid rgba(168, 85, 247, 0.3)",
                    borderRadius: "20px",
                    fontSize: "0.85rem",
                    color: "#a855f7",
                    fontWeight: "500",
                  }}
                >
                  Settlement review
                </span>
              </div>

              {/* CTA */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  color: "#14b8a6",
                  fontWeight: "600",
                  fontSize: "1rem",
                }}
              >
                Open Command Center →
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* Premium action card grid with cropped thumbnails */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 2rem 4rem",
        }}
        aria-label="Quick access to main BOF features"
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: "3rem",
          }}
        >
          <h2
            style={{
              fontSize: "2rem",
              fontWeight: "600",
              color: "#ffffff",
              margin: "0 0 1rem 0",
            }}
          >
            Complete Fleet Operations
          </h2>
          <p
            style={{
              fontSize: "1.1rem",
              color: "rgba(255, 255, 255, 0.8)",
              margin: "0",
              maxWidth: "600px",
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            Click any area to explore the complete BackOfficeFleet operating system
          </p>
        </div>
        
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
          }}
        >
          {ACTION_CARDS.map((card, index) => (
            <Link
              key={index}
              href={card.href}
              style={{
                display: "block",
                textDecoration: "none",
                color: "inherit",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                borderRadius: "12px",
                overflow: "hidden",
                transition: "all 0.3s ease",
                backdropFilter: "blur(10px)",
                cursor: "pointer",
              }}
              aria-label={`Navigate to ${card.title}: ${card.subtitle}`}
            >
              {/* Card thumbnail with individual images and proper cropping */}
              <div
                style={{
                  position: "relative",
                  height: "120px",
                  overflow: "hidden",
                }}
              >
                <Image
                  src={card.imageSrc}
                  alt={`${card.title} - ${card.subtitle}`}
                  fill
                  style={{
                    objectFit: "cover",
                    objectPosition: card.imagePosition,
                  }}
                />
                {/* Overlay gradient for text readability */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "60px",
                    background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
                  }}
                />
              </div>

              {/* Card content */}
              <div
                style={{
                  padding: "1.5rem",
                }}
              >
                <h3
                  style={{
                    fontSize: "1.3rem",
                    fontWeight: "600",
                    margin: "0 0 0.5rem 0",
                    color: card.color,
                  }}
                >
                  {card.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.95rem",
                    lineHeight: "1.4",
                    margin: "0 0 1rem 0",
                    color: "rgba(255, 255, 255, 0.9)",
                  }}
                >
                  {card.subtitle}
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: card.color,
                    fontWeight: "600",
                    fontSize: "0.9rem",
                  }}
                >
                  {card.cta}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
