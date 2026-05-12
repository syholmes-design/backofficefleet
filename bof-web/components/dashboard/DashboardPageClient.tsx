"use client";

import Link from "next/link";
import Image from "next/image";

// Helper array for action card configuration
const ACTION_CARDS = [
  {
    title: "Command Center",
    subtitle: "Operations & exceptions",
    href: "/command-center",
    cta: "Open →",
    imagePosition: "10% 68%",
    color: "#14b8a6",
  },
  {
    title: "Drivers",
    subtitle: "Readiness & compliance",
    href: "/drivers",
    cta: "Review →",
    imagePosition: "22% 68%",
    color: "#3b82f6",
  },
  {
    title: "Dispatch / Loads",
    subtitle: "Dispatch, proof, and load lifecycle",
    href: "/dispatch",
    cta: "Explore →",
    imagePosition: "40% 68%",
    color: "#a855f7",
  },
  {
    title: "Documents",
    subtitle: "Driver, company, and proof vaults",
    href: "/documents",
    cta: "View →",
    imagePosition: "52% 68%",
    color: "#fb923c",
  },
  {
    title: "Settlements",
    subtitle: "Pay, deductions, and finance",
    href: "/settlements",
    cta: "View →",
    imagePosition: "64% 68%",
    color: "#22c55e",
  },
  {
    title: "Safety",
    subtitle: "Incidents, scorecards, and risk",
    href: "/safety",
    cta: "View →",
    imagePosition: "78% 68%",
    color: "#ef4444",
  },
  {
    title: "Portals",
    subtitle: "Manager, driver, and customer views",
    href: "/portals",
    cta: "Access →",
    imagePosition: "92% 68%",
    color: "#6366f1",
  },
];

export function DashboardPageClient() {
  return (
    <div className="bof-page bof-cc-page bof-dashboard-page">
      {/* Full-bleed hero section with premium Command_Image.png background */}
      <section
        style={{
          position: "relative",
          width: "100vw",
          marginLeft: "calc(50% - 50vw)",
          marginRight: "calc(50% - 50vw)",
          minHeight: "clamp(460px, 48vw, 680px)",
          overflow: "hidden",
          background: "#020617",
        }}
      >
        {/* Premium hero image with Command_Image.png */}
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
            src="/generated/marketing/Command_Image.png"
            alt="BackOfficeFleet Command Center Dashboard - Complete back-office operations including dispatch, compliance, documents, finance, settlements, maintenance, and RFID proof workflows"
            fill
            style={{
              objectFit: "cover",
              objectPosition: "40% 35%",
              width: "100%",
              height: "100%",
            }}
            priority
          />
        </div>

        {/* Dark gradient overlay for readability */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(135deg, rgba(2,6,23,0.85) 0%, rgba(2,6,23,0.6) 50%, rgba(2,6,23,0.4) 100%)",
            zIndex: 2,
          }}
        />

        {/* Hero content overlay */}
        <div
          style={{
            position: "relative",
            zIndex: 4,
            minHeight: "clamp(460px, 48vw, 680px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            padding: "6rem 2rem 4rem",
          }}
        >
          {/* Title and subtitle section */}
          <div
            style={{
              textAlign: "center",
              maxWidth: "900px",
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
              BOF Demo Command Center
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
              <Link
                href="/command-center"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "1rem 2rem",
                  backgroundColor: "#14b8a6",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "8px",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                }}
              >
                Open Command Center →
              </Link>
              <Link
                href="/drivers"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "1rem 2rem",
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "8px",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  backdropFilter: "blur(10px)",
                }}
              >
                Review Driver Readiness →
              </Link>
              <Link
                href="/settlements"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "1rem 2rem",
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "8px",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  backdropFilter: "blur(10px)",
                }}
              >
                View Settlements →
              </Link>
              <Link
                href="/dispatch"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "1rem 2rem",
                  backgroundColor: "rgba(255, 255, 255, 0.15)",
                  color: "white",
                  textDecoration: "none",
                  borderRadius: "8px",
                  fontSize: "1.1rem",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  backdropFilter: "blur(10px)",
                }}
              >
                Explore Dispatch Proof →
              </Link>
            </div>
          </div>
        </div>
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
            {/* Manager visual from Command_Image.png */}
            <div
              style={{
                position: "relative",
                overflow: "hidden",
                borderRadius: "12px",
              }}
            >
              <Image
                src="/generated/marketing/Command_Image.png"
                alt="Fleet Operations Manager reviewing dispatch and compliance data"
                fill
                style={{
                  objectFit: "cover",
                  objectPosition: "80% 18%",
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
              {/* Card thumbnail from Command_Image.png */}
              <div
                style={{
                  position: "relative",
                  height: "120px",
                  overflow: "hidden",
                }}
              >
                <Image
                  src="/generated/marketing/Command_Image.png"
                  alt={`${card.title} interface preview`}
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
