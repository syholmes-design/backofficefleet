"use client";

import Link from "next/link";
import Image from "next/image";

// Helper array for action card configuration with distinct images and proper cropping
const ACTION_CARDS = [
  {
    title: "Operational Overview",
    subtitle: "Operations & exceptions",
    href: "/dashboard",
    cta: "Open",
    imageSrc: "/generated/marketing/dispatch-command-center-hero.png",
    imagePosition: "center 40%",
    color: "#14b8a6",
  },
  {
    title: "Drivers",
    subtitle: "Readiness & compliance",
    href: "/drivers",
    cta: "Review",
    imageSrc: "/assets/images/bof-landing-hero-clean.png",
    imagePosition: "center 35%",
    color: "#3b82f6",
  },
  {
    title: "Dispatch / Loads",
    subtitle: "Dispatch, proof, and load lifecycle",
    href: "/dispatch",
    cta: "Explore",
    imageSrc: "/evidence/loads/L001/trailer-loaded.jpg",
    imagePosition: "center 50%",
    color: "#a855f7",
  },
  {
    title: "Documents",
    subtitle: "Driver, company, and proof vaults",
    href: "/documents",
    cta: "View",
    imageSrc: "/assets/images/hero-bof-vault.png",
    imagePosition: "center 45%",
    color: "#fb923c",
  },
  {
    title: "Settlements",
    subtitle: "Pay, deductions, and finance",
    href: "/settlements",
    cta: "View",
    imageSrc: "/generated/marketing/bof-back-office-operating-system-hero.png",
    imagePosition: "center 40%",
    color: "#22c55e",
  },
  {
    title: "Safety",
    subtitle: "Incidents, scorecards, and risk",
    href: "/safety",
    cta: "View",
    imageSrc: "/assets/images/safety_event_evidence_1.png",
    imagePosition: "center 60%",
    color: "#ef4444",
  },
  {
    title: "Portals",
    subtitle: "Manager, driver, and customer views",
    href: "/portals",
    cta: "Access",
    imageSrc: "/assets/images/private-fleets-hero-new.png",
    imagePosition: "center 50%",
    color: "#6366f1",
  },
];

const HERO_CTA_LINKS = [
  { label: "Open Dashboard", href: "/dashboard", primary: true },
  { label: "Review Driver Readiness", href: "/drivers" },
  { label: "View Settlements", href: "/settlements" },
  { label: "Explore Dispatch Proof", href: "/dispatch" },
];

export function DashboardPageClient() {
  return (
    <div className="bof-page bof-cc-page bof-dashboard-page" style={{ paddingBottom: '6rem' }}>
      {/* Full-bleed demo lobby hero with premium dispatch-command-center-hero.png background */}
      <section
        className="bof-dashboard-lobby-hero"
        style={{
          position: "relative",
          width: "100vw",
          marginLeft: "calc(50% - 50vw)",
          marginRight: "calc(50% - 50vw)",
          minHeight: "clamp(600px, 58vw, 760px)",
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
            minHeight: "clamp(600px, 58vw, 760px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "4.5rem 2rem 4rem",
          }}
        >
          {/* Title and subtitle section */}
          <div
            className="bof-dashboard-lobby-copy"
            style={{
              textAlign: "center",
              maxWidth: "1100px",
              margin: "0 auto",
            }}
          >
            <h1
              style={{
                fontSize: "clamp(2.25rem, 4.4vw, 3.65rem)",
                fontWeight: "700",
                lineHeight: "1.1",
                margin: "0 0 1.15rem 0",
                color: "#ffffff",
                textShadow: "0 2px 4px rgba(0,0,0,0.4)",
              }}
            >
              Start the BackOfficeFleet demo
            </h1>
            <p
              style={{
                fontSize: "clamp(1rem, 2vw, 1.22rem)",
                lineHeight: "1.5",
                color: "rgba(255, 255, 255, 0.95)",
                margin: "0 0 2rem 0",
                maxWidth: "800px",
                marginLeft: "auto",
                marginRight: "auto",
                textShadow: "0 1px 2px rgba(0,0,0,0.4)",
              }}
            >
              Begin with the owner view, then follow the live demo path through blocked work, driver readiness, proof, settlement holds, safety exposure, maintenance blocks, and customer-facing transparency.
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

        </div>
        <style jsx>{`
          .bof-dashboard-hero-cta:hover {
            transform: translateY(-2px);
            border-color: rgba(153, 246, 228, 0.82) !important;
            background-color: rgba(20, 184, 166, 0.82) !important;
          }

          .bof-dashboard-hero-cta:focus-visible {
            outline: 3px solid rgba(153, 246, 228, 0.95);
            outline-offset: 3px;
          }
        `}</style>
      </section>

      {/* Premium action card grid with cropped thumbnails */}
      <section
        className="bof-dashboard-section bof-dashboard-action-section"
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
              className="bof-dashboard-action-card"
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
                  loading="eager"
                  sizes="(max-width: 700px) 100vw, 33vw"
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
