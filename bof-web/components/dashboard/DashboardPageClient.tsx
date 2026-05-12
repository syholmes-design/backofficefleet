"use client";

import Link from "next/link";
import Image from "next/image";

export function DashboardPageClient() {
  return (
    <div className="bof-page bof-cc-page bof-dashboard-page">
      {/* Full-bleed hero section with clean layout */}
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
        {/* Hero image - full-bleed with better positioning to hide baked text */}
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
              objectPosition: "center",
              width: "100%",
              height: "100%",
            }}
            priority
          />
        </div>

        {/* Stronger gradient overlay to hide any baked text */}
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

      {/* Clean action card grid below hero */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "4rem 2rem",
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
          {/* Command Center card */}
          <Link
            href="/command-center"
            style={{
              display: "block",
              padding: "2rem",
              backgroundColor: "rgba(20, 184, 166, 0.08)",
              border: "1px solid rgba(20, 184, 166, 0.2)",
              borderRadius: "12px",
              textDecoration: "none",
              color: "white",
              transition: "all 0.3s ease",
              backdropFilter: "blur(10px)",
              textAlign: "center",
            }}
          >
            <h3
              style={{
                fontSize: "1.3rem",
                fontWeight: "600",
                margin: "0 0 0.5rem 0",
                color: "#14b8a6",
              }}
            >
              Command Center
            </h3>
            <p
              style={{
                fontSize: "0.95rem",
                lineHeight: "1.4",
                margin: "0",
                color: "rgba(255, 255, 255, 0.9)",
              }}
            >
              Operations & exceptions
            </p>
          </Link>

          {/* Drivers card */}
          <Link
            href="/drivers"
            style={{
              display: "block",
              padding: "2rem",
              backgroundColor: "rgba(59, 130, 246, 0.08)",
              border: "1px solid rgba(59, 130, 246, 0.2)",
              borderRadius: "12px",
              textDecoration: "none",
              color: "white",
              transition: "all 0.3s ease",
              backdropFilter: "blur(10px)",
              textAlign: "center",
            }}
          >
            <h3
              style={{
                fontSize: "1.3rem",
                fontWeight: "600",
                margin: "0 0 0.5rem 0",
                color: "#3b82f6",
              }}
            >
              Drivers
            </h3>
            <p
              style={{
                fontSize: "0.95rem",
                lineHeight: "1.4",
                margin: "0",
                color: "rgba(255, 255, 255, 0.9)",
              }}
            >
              Readiness & compliance
            </p>
          </Link>

          {/* Dispatch / Loads card */}
          <Link
            href="/dispatch"
            style={{
              display: "block",
              padding: "2rem",
              backgroundColor: "rgba(168, 85, 247, 0.08)",
              border: "1px solid rgba(168, 85, 247, 0.2)",
              borderRadius: "12px",
              textDecoration: "none",
              color: "white",
              transition: "all 0.3s ease",
              backdropFilter: "blur(10px)",
              textAlign: "center",
            }}
          >
            <h3
              style={{
                fontSize: "1.3rem",
                fontWeight: "600",
                margin: "0 0 0.5rem 0",
                color: "#a855f7",
              }}
            >
              Dispatch / Loads
            </h3>
            <p
              style={{
                fontSize: "0.95rem",
                lineHeight: "1.4",
                margin: "0",
                color: "rgba(255, 255, 255, 0.9)",
              }}
            >
              Dispatch, proof, and load lifecycle
            </p>
          </Link>

          {/* Documents card */}
          <Link
            href="/documents"
            style={{
              display: "block",
              padding: "2rem",
              backgroundColor: "rgba(251, 146, 60, 0.08)",
              border: "1px solid rgba(251, 146, 60, 0.2)",
              borderRadius: "12px",
              textDecoration: "none",
              color: "white",
              transition: "all 0.3s ease",
              backdropFilter: "blur(10px)",
              textAlign: "center",
            }}
          >
            <h3
              style={{
                fontSize: "1.3rem",
                fontWeight: "600",
                margin: "0 0 0.5rem 0",
                color: "#fb923c",
              }}
            >
              Documents
            </h3>
            <p
              style={{
                fontSize: "0.95rem",
                lineHeight: "1.4",
                margin: "0",
                color: "rgba(255, 255, 255, 0.9)",
              }}
            >
              Driver, company, and proof vaults
            </p>
          </Link>

          {/* Settlements card */}
          <Link
            href="/settlements"
            style={{
              display: "block",
              padding: "2rem",
              backgroundColor: "rgba(34, 197, 94, 0.08)",
              border: "1px solid rgba(34, 197, 94, 0.2)",
              borderRadius: "12px",
              textDecoration: "none",
              color: "white",
              transition: "all 0.3s ease",
              backdropFilter: "blur(10px)",
              textAlign: "center",
            }}
          >
            <h3
              style={{
                fontSize: "1.3rem",
                fontWeight: "600",
                margin: "0 0 0.5rem 0",
                color: "#22c55e",
              }}
            >
              Settlements
            </h3>
            <p
              style={{
                fontSize: "0.95rem",
                lineHeight: "1.4",
                margin: "0",
                color: "rgba(255, 255, 255, 0.9)",
              }}
            >
              Pay, deductions, and finance
            </p>
          </Link>

          {/* Safety card */}
          <Link
            href="/safety"
            style={{
              display: "block",
              padding: "2rem",
              backgroundColor: "rgba(239, 68, 68, 0.08)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              borderRadius: "12px",
              textDecoration: "none",
              color: "white",
              transition: "all 0.3s ease",
              backdropFilter: "blur(10px)",
              textAlign: "center",
            }}
          >
            <h3
              style={{
                fontSize: "1.3rem",
                fontWeight: "600",
                margin: "0 0 0.5rem 0",
                color: "#ef4444",
              }}
            >
              Safety
            </h3>
            <p
              style={{
                fontSize: "0.95rem",
                lineHeight: "1.4",
                margin: "0",
                color: "rgba(255, 255, 255, 0.9)",
              }}
            >
              Incidents, scorecards, and risk
            </p>
          </Link>

          {/* Portals card */}
          <Link
            href="/portals"
            style={{
              display: "block",
              padding: "2rem",
              backgroundColor: "rgba(99, 102, 241, 0.08)",
              border: "1px solid rgba(99, 102, 241, 0.2)",
              borderRadius: "12px",
              textDecoration: "none",
              color: "white",
              transition: "all 0.3s ease",
              backdropFilter: "blur(10px)",
              textAlign: "center",
            }}
          >
            <h3
              style={{
                fontSize: "1.3rem",
                fontWeight: "600",
                margin: "0 0 0.5rem 0",
                color: "#6366f1",
              }}
            >
              Portals
            </h3>
            <p
              style={{
                fontSize: "0.95rem",
                lineHeight: "1.4",
                margin: "0",
                color: "rgba(255, 255, 255, 0.9)",
              }}
            >
              Manager, driver, and customer views
            </p>
          </Link>
        </div>
      </section>
    </div>
  );
}
