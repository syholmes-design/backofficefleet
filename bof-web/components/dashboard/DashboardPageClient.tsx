"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { formatUsd } from "@/lib/format-money";
import {
  getDashboardTodayChanges,
  getSettlementStatusChartData,
  type BreakdownPoint,
  type DashboardKpi,
} from "@/lib/dashboard-insights";
import {
  buildExecutiveDashboardModel,
  type ExecutiveDashboardOwnerItem,
} from "@/lib/dashboard-command-summary";
import { settlementTotals } from "@/lib/executive-layer";
import { getPayrollMonthlyTrend } from "@/lib/demo-trends";
import { getClientLoadRequests } from "@/lib/client-load-requests";
import { useIntakeEngineStore } from "@/lib/stores/intake-engine-store";
import { ActionableSummary } from "@/components/actionability/ActionableSummary";
import { getDemoActionabilityIssues } from "@/lib/actionability/demo-actionability";

const SEV_ORDER: Record<ExecutiveDashboardOwnerItem["severity"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
};

export function DashboardPageClient() {
  const { data } = useBofDemoData();
  const intakeCommandCenterItems = useIntakeEngineStore((s) => s.commandCenterIntakeItems);

  const st = useMemo(() => settlementTotals(data), [data]);
  const exec = useMemo(
    () => buildExecutiveDashboardModel(data, intakeCommandCenterItems),
    [data, intakeCommandCenterItems]
  );
  const settlementStatus = useMemo(() => getSettlementStatusChartData(data), [data]);
  const pendingClientLoadRequests = useMemo(
    () =>
      getClientLoadRequests(data).filter(
        (request) => request.status !== "converted_to_load" && request.status !== "rejected"
      ).length,
    [data]
  );
  const todayChanges = useMemo(() => getDashboardTodayChanges(data), [data]);
  const payrollTrend = useMemo(() => getPayrollMonthlyTrend(), []);
  const topRiskLoads = useMemo(
    () =>
      data.loads
        .filter((load) => load.dispatchExceptionFlag || load.sealStatus !== "OK" || load.podStatus === "pending")
        .slice(0, 3),
    [data]
  );

  const [expandedReadiness, setExpandedReadiness] = useState<Record<string, boolean>>({});
  const actionabilityIssues = useMemo(() => getDemoActionabilityIssues(data), [data]);

  /** Command-center KPI strip — every value is derived in `buildExecutiveDashboardModel` from BOF + merged CC queue. */
  const commandKpis = useMemo<Array<DashboardKpi & { href?: string }>>(
    () => [
      {
        label: "Active Loads",
        value: exec.topSummary.activeLoads,
        hint: "En route + pending loads in the dispatch register.",
        tone: exec.topSummary.activeLoads > 5 ? "info" : "warn",
        delta: "Same load list as dispatch",
        href: "/dispatch",
      },
      {
        label: "Loads At Risk",
        value: exec.topSummary.loadsAtRisk,
        hint: "Exception, seal mismatch, or pending proof on active loads.",
        tone: exec.topSummary.loadsAtRisk > 3 ? "danger" : "warn",
        delta: exec.topSummary.loadsAtRisk > 0 ? "Review dispatch proof stack" : "No flagged loads",
        href: "/loads",
      },
      {
        label: "Dispatch Blocked",
        value: exec.topSummary.dispatchBlockedDrivers,
        hint: "Drivers in canonical dispatch-blocked review state.",
        tone: exec.topSummary.dispatchBlockedDrivers > 0 ? "danger" : "ok",
        delta:
          exec.topSummary.dispatchBlockedDrivers > 0
            ? "Clear compliance / document gates"
            : "No dispatch hard-gates",
        href: "/drivers",
      },
      {
        label: "Documents Needing Action",
        value: exec.topSummary.documentsNeedingAction,
        hint: "Compliance + credential queue rows from the same Command Center feed.",
        tone: exec.topSummary.documentsNeedingAction > 0 ? "warn" : "ok",
        delta: "Each row maps to a CC item",
        href: "/command-center",
      },
      {
        label: "Settlement Holds",
        value: exec.topSummary.settlementHolds,
        hint: "Drivers in pending / on-hold settlement posture (settlement totals).",
        tone: exec.topSummary.settlementHolds > 0 ? "warn" : "ok",
        delta: exec.topSummary.settlementHolds > 0 ? "Release queue active" : "Settlement queue clear",
        href: "/settlements",
      },
      {
        label: "Claim Exposure",
        value: formatUsd(exec.topSummary.claimExposureUsd),
        hint: "Open claim-linked rows in the money-at-risk register.",
        tone: exec.topSummary.claimExposureUsd > 0 ? "danger" : "ok",
        delta: exec.topSummary.claimExposureUsd > 0 ? "Exposure open" : "No claim-linked exposure",
        href: "/money-at-risk",
      },
    ],
    [exec.topSummary]
  );

  const criticalQueue = exec.ownerAttentionQueue.filter((item) => item.severity === "critical");
  const prioritizedQueue = useMemo(() => {
    return [...exec.ownerAttentionQueue].sort(
      (a, b) => SEV_ORDER[a.severity] - SEV_ORDER[b.severity] || a.id.localeCompare(b.id)
    );
  }, [exec.ownerAttentionQueue]);
  const queuePreview = prioritizedQueue.slice(0, 4);
  const snapshotAlert = prioritizedQueue[0] ?? null;

  const proofPendingLoads = useMemo(
    () =>
      data.loads.filter((l) => String(l.podStatus ?? "").toLowerCase() === "pending").length,
    [data.loads]
  );

  return (
    <div className="bof-page bof-cc-page bof-dashboard-page">
      <section className="bof-dashboard-hero bof-dashboard-hero--premium" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        color: 'white',
        padding: '8rem 2rem 4rem',
        borderRadius: '0 0 2rem 2rem',
        position: 'relative',
        overflow: 'hidden',
        marginTop: '0'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 30% 20%, rgba(20, 184, 166, 0.1) 0%, transparent 50%)',
          zIndex: 1
        }} />
        <div style={{
          maxWidth: '100%',
          margin: '0 auto',
          position: 'relative',
          zIndex: 2
        }}>
          {/* Full-width hero image spanning entire page width */}
          <div style={{
            width: '100%',
            height: '560px',
            position: 'relative',
            marginBottom: '4rem',
            borderRadius: '0 0 1rem 1rem',
            overflow: 'hidden'
          }}>
            <Image
              src="/marketing/bof-hero-fleet-command-1440x900.png"
              alt="BackOfficeFleet Command Center Dashboard - Complete back-office operations including dispatch, compliance, documents, finance, settlements, maintenance, and RFID proof workflows"
              fill
              style={{
                objectFit: 'cover',
                objectPosition: 'center',
                width: '100%',
                height: '100%'
              }}
              priority
            />
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.1) 50%, transparent 100%)',
              pointerEvents: 'none'
            }} />
            {/* BackOfficeFleet logo overlay */}
            <div style={{
              position: 'absolute',
              top: '2rem',
              left: '2rem',
              zIndex: 3
            }}>
              <Image
                src="/logo/boflogo-light.png"
                alt="BackOfficeFleet"
                width={120}
                height={40}
                style={{
                  filter: 'brightness(1) contrast(1.1)'
                }}
              />
            </div>
          </div>

          {/* Hero title and subtitle - positioned below image with clear spacing */}
          <div style={{
            textAlign: 'center',
            marginBottom: '3rem',
            paddingTop: '2rem'
          }}>
            <h1 style={{
              fontSize: 'clamp(2.5rem, 6vw, 4rem)',
              fontWeight: '700',
              lineHeight: '1.1',
              margin: '0 0 1.5rem 0',
              background: 'linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              BOF Demo Command Center
            </h1>
            <p style={{
              fontSize: 'clamp(1.25rem, 3vw, 1.5rem)',
              lineHeight: '1.6',
              color: 'rgba(255, 255, 255, 0.9)',
              margin: '0 0 2rem 0',
              maxWidth: '900px',
              marginLeft: 'auto',
              marginRight: 'auto'
            }}>
              See how BackOfficeFleet takes over dispatch, compliance, documents, HR, payroll, finance, settlements, maintenance, procurement, RFID proof, and exception management in one accountable operating system.
            </p>
          </div>

          {/* CTA buttons */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginBottom: '3rem'
          }}>
            <Link href="/command-center" style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '1rem 2rem',
              backgroundColor: '#14b8a6',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              border: 'none',
              cursor: 'pointer'
            }}>
              Open Command Center
            </Link>
            <Link href="/drivers" style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '1rem 2rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              Review Driver Readiness
            </Link>
            <Link href="/settlements" style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '1rem 2rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              View Settlements
            </Link>
            <Link href="/dispatch" style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '1rem 2rem',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '1.1rem',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              Explore Dispatch Proof
            </Link>
          </div>

          {/* Supporting copy */}
          <div style={{
            textAlign: 'center',
            marginBottom: '3rem',
            maxWidth: '800px',
            margin: '0 auto 3rem auto'
          }}>
            <p style={{
              fontSize: '1.1rem',
              lineHeight: '1.6',
              color: 'rgba(255, 255, 255, 0.8)',
              margin: '0'
            }}>
              Built for fleet owners who want world-class service, measurable savings, fewer exceptions, stronger compliance, and better operational control without adding internal headcount.
            </p>
          </div>

          {/* Proof boxes */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            maxWidth: '1200px',
            margin: '0 auto'
          }}>
            {[
              { title: 'World-Class Service', desc: 'Dedicated back-office operations team', href: '/command-center' },
              { title: 'Exception Management', desc: 'Proactive issue resolution and prevention', href: '/command-center' },
              { title: 'Savings & Procurement', desc: 'Group buying power and cost optimization', href: '/fleet-savings' },
              { title: 'Maintenance Programs', desc: 'Preventive maintenance and fleet readiness', href: '/maintenance' },
              { title: 'RFID & Proof', desc: 'Automated workflows and customer visibility', href: '/loads' }
            ].map((proof, idx) => (
              <Link key={idx} href={proof.href} style={{
                textDecoration: 'none',
                color: 'inherit',
                display: 'block'
              }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '1.5rem',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  height: '100%'
                }}>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#14b8a6',
                    margin: '0 0 0.75rem 0'
                  }}>
                    {proof.title}
                  </h3>
                  <p style={{
                    fontSize: '0.95rem',
                    color: 'rgba(255, 255, 255, 0.8)',
                    margin: '0',
                    lineHeight: '1.4'
                  }}>
                    {proof.desc}
                  </p>
                  <div style={{
                    marginTop: '1rem',
                    fontSize: '0.8rem',
                    color: '#14b8a6',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}>
                    Explore →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bof-cc-panel" style={{ margin: '2rem 0' }} aria-label="Executive Operating Snapshot">
        <div className="bof-cc-panel-head">
          <h2 className="bof-h2">Executive Operating Snapshot</h2>
          <p className="bof-cc-panel-sub" style={{ marginTop: "0.35rem" }}>
            Comprehensive BOF operating metrics across all service lanes
          </p>
        </div>
        <div className="bof-cc-kpi-grid">
          {commandKpis.map((kpi) => (
            <KpiCard key={kpi.label} kpi={kpi} />
          ))}
          {/* Additional executive metrics */}
          <div className="bof-cc-kpi-card">
            <div className="bof-cc-kpi-card-header">
              <h3 className="bof-cc-kpi-label">Settlement Velocity</h3>
            </div>
            <div className="bof-cc-kpi-card-value">
              <span className="bof-cc-kpi-number">{st.totalGross > 0 ? 'Ready' : '0'}</span>
            </div>
            <div className="bof-cc-kpi-card-hint">
              Ready for immediate processing
            </div>
            <div className="bof-cc-kpi-card-delta">
              <Link href="/settlements" className="bof-link-secondary">View settlements →</Link>
            </div>
          </div>
          <div className="bof-cc-kpi-card">
            <div className="bof-cc-kpi-card-header">
              <h3 className="bof-cc-kpi-label">Driver Readiness</h3>
            </div>
            <div className="bof-cc-kpi-card-value">
              <span className="bof-cc-kpi-number">{exec.driverReadiness.find(r => r.label === 'Ready')?.value || 0}</span>
              <span className="bof-cc-kpi-unit">ready</span>
            </div>
            <div className="bof-cc-kpi-card-hint">
              Fully compliant and dispatch-eligible
            </div>
            <div className="bof-cc-kpi-card-delta">
              <Link href="/drivers" className="bof-link-secondary">Review drivers →</Link>
            </div>
          </div>
          <div className="bof-cc-kpi-card">
            <div className="bof-cc-kpi-card-header">
              <h3 className="bof-cc-kpi-label">Proof Completion</h3>
            </div>
            <div className="bof-cc-kpi-card-value">
              <span className="bof-cc-kpi-number">{data.loads.length - proofPendingLoads}</span>
              <span className="bof-cc-kpi-unit">completed</span>
            </div>
            <div className="bof-cc-kpi-card-hint">
              Load proof and customer visibility
            </div>
            <div className="bof-cc-kpi-card-delta">
              <Link href="/dispatch" className="bof-link-secondary">View dispatch →</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bof-cc-panel bof-cc-attention-priority" aria-label="Exception Management Queue" id="attention-queue">
        <div className="bof-cc-panel-head">
          <h2 className="bof-h2">Exception Management Queue</h2>
          <Link href="/command-center" className="bof-link-secondary">Open full queue →</Link>
        </div>
        <p className="bof-cc-panel-sub">
          BOF&apos;s proactive exception management across all service lanes — severity matches canonical queue priority
        </p>
        {criticalQueue.length > 0 ? (
          <div className="bof-cc-critical-banner">
            <strong>{criticalQueue.length}</strong> item{criticalQueue.length === 1 ? "" : "s"} at critical severity
            (compliance / hard gates).
          </div>
        ) : (
          <p className="bof-cc-panel-sub">No critical-severity queue items right now.</p>
        )}
        <div className="bof-cc-queue-cards">
          {queuePreview.map((item) => (
            <article key={item.id} className={`bof-cc-queue-card bof-cc-queue-${item.severity}`}>
              <div className="bof-cc-queue-head">
                <span className={`bof-cc-sev bof-cc-sev-${item.severity}`}>{item.severity}</span>
                <span className="bof-cc-chip bof-cc-chip-info">{item.area}</span>
                <span className="bof-cc-chip bof-cc-chip-info">{item.entityType}</span>
              </div>
              <p className="bof-cc-queue-target">{item.target}</p>
              <p className="bof-cc-queue-issue">{item.issue}</p>
              <p className="bof-cc-queue-fix"><strong>Recommended fix:</strong> {item.recommendedFix}</p>
              <div className="bof-cc-queue-foot">
                <span>{item.financialImpact ? formatUsd(item.financialImpact) : "No direct amount"}</span>
                <span style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", justifyContent: "flex-end" }}>
                  {item.reviewDriverId ? (
                    <Link href={`/drivers/${item.reviewDriverId}#driver-review`} className="bof-cc-action-btn">
                      View driver review
                    </Link>
                  ) : null}
                  {item.reviewLoadId ? (
                    <Link href={`/loads/${item.reviewLoadId}#load-review`} className="bof-cc-action-btn">
                      View load review
                    </Link>
                  ) : null}
                  <Link href={item.actionHref} className="bof-cc-action-btn bof-cc-action-btn-primary">
                    {item.actionLabel}
                  </Link>
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="bof-cc-panel" style={{ margin: '2rem 0' }} aria-label="Back-Office Service Coverage">
        <div className="bof-cc-panel-head">
          <h2 className="bof-h2">Back-Office Service Coverage</h2>
          <p className="bof-cc-panel-sub" style={{ marginTop: "0.35rem" }}>
            Complete BOF operating system service lanes for mid-sized fleets
          </p>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {[
            {
              title: 'Dispatch & Load Management',
              description: 'Real-time dispatch, load optimization, and customer proof workflows',
              href: '/dispatch',
              icon: '🚚'
            },
            {
              title: 'Documents & Compliance',
              description: 'Driver credentials, regulatory compliance, and document automation',
              href: '/documents',
              icon: '📋'
            },
            {
              title: 'Driver Readiness / HR Support',
              description: 'Driver onboarding, HR policies, payroll integration, and readiness tracking',
              href: '/drivers',
              icon: '👥'
            },
            {
              title: 'Payroll / Settlements',
              description: 'Settlement processing, payroll deductions, and cash flow management',
              href: '/settlements',
              icon: '💰'
            },
            {
              title: 'Finance / Cash Flow',
              description: 'Revenue tracking, factoring support, and audit-ready financial records',
              href: '/fleet-financials',
              icon: '📊'
            },
            {
              title: 'Maintenance Programs',
              description: 'Preventive maintenance scheduling, asset tracking, and fleet readiness',
              href: '/maintenance',
              icon: '🔧'
            },
            {
              title: 'Procurement / Buying Consortium',
              description: 'Group purchasing power, vendor management, and cost optimization',
              href: '/fleet-savings',
              icon: '🛒'
            },
            {
              title: 'RFID / Proof / Customer Visibility',
              description: 'Automated proof workflows, RFID tracking, and customer portal access',
              href: '/dispatch',
              icon: '📡'
            },
            {
              title: 'Insurance / Claims Support',
              description: 'Claims management, insurance coordination, and risk mitigation',
              href: '/money-at-risk',
              icon: '🛡️'
            }
          ].map((service, idx) => (
            <div key={idx} style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '1.5rem',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}>
              <Link href={service.href} style={{
                textDecoration: 'none',
                color: 'inherit',
                display: 'block'
              }}>
                <div style={{
                  fontSize: '2rem',
                  marginBottom: '0.75rem'
                }}>
                  {service.icon}
                </div>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: '0 0 0.5rem 0'
                }}>
                  {service.title}
                </h3>
                <p style={{
                  fontSize: '0.875rem',
                  color: '#64748b',
                  margin: '0',
                  lineHeight: '1.4'
                }}>
                  {service.description}
                </p>
                <div style={{
                  marginTop: '1rem',
                  fontSize: '0.875rem',
                  color: '#14b8a6',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  Explore service →
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="bof-cc-panel" style={{ margin: '2rem 0' }} aria-label="Savings & Operational Leverage">
        <div className="bof-cc-panel-head">
          <h2 className="bof-h2">Savings & Operational Leverage</h2>
          <p className="bof-cc-panel-sub" style={{ marginTop: "0.35rem" }}>
            Measurable value creation across BOF service lanes
          </p>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem'
        }}>
          {[
            {
              title: 'Procurement Savings',
              value: 'Group Buying Power',
              description: 'Leverage BOF&apos;s procurement consortium for fuel, tires, parts, and services'
            },
            {
              title: 'Exception Reduction',
              value: 'Proactive Management',
              description: 'Reduce compliance issues, document gaps, and service failures through automation'
            },
            {
              title: 'Settlement Velocity',
              value: 'Faster Processing',
              description: 'Accelerate settlement review and improve cash flow for carriers and drivers'
            },
            {
              title: 'Document Readiness',
              value: 'Automated Tracking',
              description: 'Maintain 100% document compliance with automated expiration monitoring'
            },
            {
              title: 'Maintenance Discipline',
              value: 'Preventive Programs',
              description: 'Reduce breakdowns and extend asset life through scheduled maintenance'
            },
            {
              title: 'Headcount Leverage',
              value: 'World-Class Service',
              description: 'Access enterprise-level back-office operations without adding internal staff'
            }
          ].map((value, idx) => (
            <div key={idx} style={{
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '1px solid #bbf7d0',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: '#166534',
                margin: '0 0 0.5rem 0'
              }}>
                {value.title}
              </h3>
              <div style={{
                fontSize: '0.875rem',
                color: '#15803d',
                fontWeight: '500',
                marginBottom: '0.5rem'
              }}>
                {value.value}
              </div>
              <p style={{
                fontSize: '0.875rem',
                color: '#166534',
                margin: '0',
                lineHeight: '1.4'
              }}>
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Existing operational sections moved to bottom */}
      <section className="bof-dashboard-route-snapshot" aria-label="Route and alert snapshot" style={{ margin: '2rem 0' }}>
        <RouteSnapshotCard
          priorityAlert={snapshotAlert}
          loadsAtRisk={exec.topSummary.loadsAtRisk}
          topRiskLoads={topRiskLoads}
        />
      </section>

      <ActionableSummary title="Demo Actionability Queue" issues={actionabilityIssues} />

      <section className="bof-cc-chart-grid" aria-label="Fleet breakdown charts" style={{ margin: '2rem 0' }}>
        <DonutChartCard
          title="Fleet Risk Breakdown"
          subtitle="Counts of Command Center items by lane (same feed as the queue above)."
          data={exec.fleetRiskFromAlerts}
        />
        <div className="bof-cc-panel">
          <BarChartCard
            title="Driver Readiness"
            subtitle="Ready, action needed (only when review lists issues), dispatch blocked."
            data={exec.driverReadiness}
          />
          <div className="bof-cc-panel-sub" style={{ marginTop: "0.75rem" }}>
            <strong>Details</strong> — plain-language driver review reasons and recommended next steps.
          </div>
          <ul className="bof-cc-notes" style={{ listStyle: "none", padding: 0, marginTop: "0.5rem" }}>
            {exec.driverReadinessDetails
              .filter((r) => r.segment !== "ready")
              .map((row) => (
                <li key={row.driverId} className="bof-cc-note bof-cc-note-warn" style={{ marginBottom: "0.35rem" }}>
                  <button
                    type="button"
                    className="bof-link-secondary"
                    style={{ background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit" }}
                    onClick={() =>
                      setExpandedReadiness((prev) => ({ ...prev, [row.driverId]: !prev[row.driverId] }))
                    }
                  >
                    {row.driverId} — {row.segment === "blocked" ? "Dispatch blocked" : "Action needed"}
                    {expandedReadiness[row.driverId] ? " ▲" : " ▼"}
                  </button>
                  {expandedReadiness[row.driverId] ? (
                    <ul style={{ marginTop: "0.35rem", paddingLeft: "1.1rem" }}>
                      {row.reasonLines.length ? (
                        row.reasonLines.map((line, idx) => (
                          <li key={`${row.driverId}-reason-${idx}`}>{line}</li>
                        ))
                      ) : (
                        <li>No specific issues listed</li>
                      )}
                    </ul>
                  ) : null}
                </li>
              ))}
          </ul>
        </div>
      </section>

      <section className="bof-cc-panel" aria-label="Settlement status and trends" style={{ margin: '2rem 0' }}>
        <div className="bof-cc-panel-head">
          <h2 className="bof-h2">Settlement status and trends</h2>
        </div>
        <div className="bof-cc-panel-sub" style={{ marginTop: "0.35rem" }}>
          Settlement register totals and monthly trend
        </div>
        <div className="bof-cc-settlement-grid">
          <div className="bof-cc-settlement-totals">
            <div className="bof-cc-settlement-row">
              <span className="bof-cc-settlement-label">Total Gross Pay</span>
              <span className="bof-cc-settlement-value">{formatUsd(st.totalGross)}</span>
            </div>
            <div className="bof-cc-settlement-row">
              <span className="bof-cc-settlement-label">Total Net Pay</span>
              <span className="bof-cc-settlement-value">{formatUsd(st.totalNet)}</span>
            </div>
            <div className="bof-cc-settlement-row">
              <span className="bof-cc-settlement-label">Backhaul Pay</span>
              <span className="bof-cc-settlement-value">{formatUsd(st.totalBackhaul)}</span>
            </div>
            <div className="bof-cc-settlement-row">
              <span className="bof-cc-settlement-label">Pending / Hold</span>
              <span className="bof-cc-settlement-value">{st.pendingOrHold}</span>
            </div>
          </div>
          <div className="bof-cc-settlement-chart">
            <BarChartCard
              title="Monthly settlement trend"
              subtitle="Settlement counts by month (last 6 months)"
              data={settlementStatus}
            />
          </div>
        </div>
      </section>

      <section className="bof-cc-panel" aria-label="Payroll and financial trends" style={{ margin: '2rem 0' }}>
        <div className="bof-cc-panel-head">
          <h2 className="bof-h2">Payroll and financial trends</h2>
        </div>
        <div className="bof-cc-panel-sub" style={{ marginTop: "0.35rem" }}>
          Monthly payroll trends and client load requests
        </div>
        <div className="bof-cc-payroll-grid">
          <div className="bof-cc-payroll-chart">
            <BarChartCard
              title="Monthly payroll trend"
              subtitle="Payroll amounts by month (last 6 months)"
              data={payrollTrend.map(t => ({ label: t.month, value: t.baseEarnings + t.backhaulPay, tone: 'info' as const }))}
            />
          </div>
          <div className="bof-cc-client-requests">
            <div className="bof-cc-client-requests-header">
              <h3 className="bof-h3">Client load requests</h3>
            </div>
            <div className="bof-cc-client-requests-content">
              <div className="bof-cc-client-requests-row">
                <span className="bof-cc-client-requests-label">Pending requests</span>
                <span className="bof-cc-client-requests-value">{pendingClientLoadRequests}</span>
              </div>
              <div className="bof-cc-client-requests-row">
                <span className="bof-cc-client-requests-label">Total requests</span>
                <span className="bof-cc-client-requests-value">{getClientLoadRequests(data).length}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bof-cc-panel" aria-label="Today's changes" style={{ margin: '2rem 0' }}>
        <div className="bof-cc-panel-head">
          <h2 className="bof-h2">Today&apos;s changes</h2>
        </div>
        <div className="bof-cc-panel-sub" style={{ marginTop: "0.35rem" }}>
          Real-time updates from BOF registers and Command Center queue
        </div>
        <div className="bof-cc-today-changes">
          {todayChanges.map((change, idx) => (
            <div key={idx} className="bof-cc-today-change">
              <span className="bof-cc-today-change-description">{change}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="bof-dashboard-bottom-spacer" aria-hidden />
    </div>
  );
}
            


function RouteSnapshotCard({
  priorityAlert,
  loadsAtRisk,
  topRiskLoads,
}: {
  priorityAlert: ExecutiveDashboardOwnerItem | null;
  loadsAtRisk: number;
  topRiskLoads: Array<{ id: string; origin: string; destination: string; status: string; sealStatus: string }>;
}) {
  return (
    <aside className="bof-cc-route-panel bof-dashboard-route-snapshot__panel" aria-label="Route summary visual">
      <h3 className="bof-cc-panel-title">Route &amp; Alert Snapshot</h3>
      <p className="bof-cc-panel-sub">{loadsAtRisk} loads currently at risk across active lanes.</p>
      {priorityAlert ? (
        <div className="bof-cc-critical-note">
          <span className={`bof-cc-sev bof-cc-sev-${priorityAlert.severity}`}>{priorityAlert.severity}</span>
          <span className="bof-cc-chip bof-cc-chip-info" style={{ marginLeft: "0.35rem" }}>
            {priorityAlert.entityType} · {priorityAlert.entityId}
          </span>
          <strong>{priorityAlert.issue}</strong>
          <p>{priorityAlert.recommendedFix}</p>
          <p>
            <Link href={priorityAlert.actionHref} className="bof-cc-table-link">
              {priorityAlert.actionLabel} →
            </Link>
          </p>
        </div>
      ) : (
        <p className="bof-cc-route-empty">No queue items in the merged Command Center feed.</p>
      )}
      <RouteSummaryPanel loadsAtRisk={loadsAtRisk} topRiskLoads={topRiskLoads} />
      <div className="bof-dashboard-route-snapshot__links">
        <Link href="/dispatch" className="bof-cc-table-link">
          Open full dispatch board →
        </Link>
        <Link href="/dashboard#attention-queue" className="bof-cc-table-link">
          Jump to attention queue →
        </Link>
      </div>
    </aside>
  );
}

function KpiCard({ kpi }: { kpi: DashboardKpi & { href?: string } }) {
  const body = (
    <article className={`bof-cc-kpi bof-cc-tone-${kpi.tone}`}>
      <p className="bof-cc-kpi-label">{kpi.label}</p>
      <p className="bof-cc-kpi-value">{kpi.value}</p>
      <p className="bof-cc-kpi-hint">{kpi.hint}</p>
      {kpi.delta ? <p className="bof-cc-kpi-delta">{kpi.delta}</p> : null}
    </article>
  );
  if (!kpi.href) return body;
  return (
    <Link href={kpi.href} className="bof-cc-kpi-link">
      {body}
    </Link>
  );
}

function toneClass(tone: BreakdownPoint["tone"], idx = 0): string {
  if (tone === "ok") return "bof-cc-bar-ok";
  if (tone === "warn") return "bof-cc-bar-warn";
  if (tone === "danger") return "bof-cc-bar-danger";
  const fallbacks = ["bof-cc-bar-info", "bof-cc-bar-ok", "bof-cc-bar-warn", "bof-cc-bar-danger"];
  return fallbacks[idx % fallbacks.length];
}

function DonutChartCard({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle: string;
  data: BreakdownPoint[];
}) {
  const total = data.reduce((sum, point) => sum + point.value, 0);
  const safeTotal = total || 1;
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <article className="bof-cc-panel">
      <h3 className="bof-cc-panel-title">{title}</h3>
      <p className="bof-cc-panel-sub">{subtitle}</p>
      <div className="bof-cc-donut-layout">
        <svg viewBox="0 0 140 140" className="bof-cc-donut-svg" role="img" aria-label={title}>
          <circle cx="70" cy="70" r={radius} className="bof-cc-donut-track" />
          {data.map((point, idx) => {
            const ratio = point.value / safeTotal;
            const slice = Math.max(0, ratio * circumference);
            const segment = (
              <circle
                key={point.label}
                cx="70"
                cy="70"
                r={radius}
                className={`bof-cc-donut-slice ${toneClass(point.tone, idx)}`}
                strokeDasharray={`${slice} ${Math.max(0, circumference - slice)}`}
                strokeDashoffset={-offset}
              />
            );
            offset += slice;
            return segment;
          })}
          <text x="70" y="64" textAnchor="middle" className="bof-cc-donut-total-label">
            Total
          </text>
          <text x="70" y="82" textAnchor="middle" className="bof-cc-donut-total-value">
            {total}
          </text>
        </svg>
        <div className="bof-cc-bars">
          {data.map((point) => {
            const width = Math.max(8, (point.value / safeTotal) * 100);
            return (
              <div key={point.label} className="bof-cc-bar-row">
                <div className="bof-cc-bar-meta">
                  <span>{point.label}</span>
                  <strong>{point.value}</strong>
                </div>
                <div className="bof-cc-bar-track">
                  <div className={`bof-cc-bar-fill ${toneClass(point.tone)}`} style={{ width: `${width}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

function BarChartCard({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle: string;
  data: BreakdownPoint[];
}) {
  const max = Math.max(...data.map((point) => point.value), 1);
  return (
    <article className="bof-cc-panel">
      <h3 className="bof-cc-panel-title">{title}</h3>
      <p className="bof-cc-panel-sub">{subtitle}</p>
      <div className="bof-cc-vbar-chart" role="img" aria-label={title}>
        {data.map((point, idx) => (
          <div key={point.label} className="bof-cc-vbar-col">
            <div className="bof-cc-vbar-value">{point.value}</div>
            <div className="bof-cc-vbar-track">
              <div
                className={`bof-cc-vbar-fill ${toneClass(point.tone, idx)}`}
                style={{ height: `${Math.max(10, (point.value / max) * 100)}%` }}
              />
            </div>
            <div className="bof-cc-vbar-label">{point.label}</div>
          </div>
        ))}
      </div>
    </article>
  );
}


function RouteSummaryPanel({
  loadsAtRisk,
  topRiskLoads,
}: {
  loadsAtRisk: number;
  topRiskLoads: Array<{ id: string; origin: string; destination: string; status: string; sealStatus: string }>;
}) {
  const topOrigins = Array.from(new Set(topRiskLoads.map((load) => load.origin))).slice(0, 3);
  const topDestinations = Array.from(new Set(topRiskLoads.map((load) => load.destination))).slice(0, 3);
  return (
    <div className="bof-cc-route-summary-body" aria-label="Route summary visual detail">
      <div className="bof-cc-route-pills">
        {topOrigins.length ? <span className="bof-cc-chip bof-cc-chip-info">Origins: {topOrigins.join(", ")}</span> : null}
        {topDestinations.length ? <span className="bof-cc-chip bof-cc-chip-info">Destinations: {topDestinations.join(", ")}</span> : null}
      </div>
      <svg viewBox="0 0 360 120" className="bof-cc-route-svg" role="img" aria-label="Route summary">
        <path d="M 20 92 C 82 20, 162 118, 234 45 C 272 12, 315 40, 340 22" className="bof-cc-route-line" />
        <circle cx="20" cy="92" r="5" className="bof-cc-route-node-start" />
        <circle cx="234" cy="45" r="5" className="bof-cc-route-node-mid" />
        <circle cx="340" cy="22" r="5" className="bof-cc-route-node-end" />
      </svg>
      <div className="bof-cc-route-list">
        {topRiskLoads.length ? (
          topRiskLoads.map((load) => (
            <div key={load.id} className="bof-cc-route-row">
              <strong>{load.id}</strong>
              <span>{load.origin} → {load.destination}</span>
              <span className="bof-cc-route-status">{load.status} · Seal {load.sealStatus}</span>
            </div>
          ))
        ) : (
          <p className="bof-cc-route-empty">
            {loadsAtRisk > 0 ? "Risk lanes available in dispatch map." : "No active risk lanes detected."}
          </p>
        )}
      </div>
    </div>
  );
}
