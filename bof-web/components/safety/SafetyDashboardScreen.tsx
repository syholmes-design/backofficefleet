"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { AlertOctagon, FileWarning, ShieldAlert, UserX } from "lucide-react";
import { formatExposure } from "./safety-ui";
import {
  getAtRiskSafetyDrivers,
  getSafetyEvidenceByDriverId,
  getSafetyScorecardRows,
  getSafetyScorecardSummary,
  getSafetyViolationActions,
  type SafetyPerformanceTier,
} from "@/lib/safety-scorecard";
import { getSafetyMonthlyTrend } from "@/lib/demo-trends";
import {
  getSafetyEvidenceOpenHref,
  SafetyEvidenceThumb,
} from "@/components/safety/SafetyEvidenceThumb";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { useSafetyStore } from "@/lib/stores/safety-store";
import {
  buildSafetyCommandFeed,
  filterSafetyCommandFeed,
  getSafetyCommandHeroStats,
  type SafetyCommandDriverFilter,
  type SafetyCommandEventTypeFilter,
  type SafetyCommandSeverityFilter,
  type SafetyCommandStatusFilter,
} from "@/lib/safety-command-feed";
import { getDriverSafetyBonusRows } from "@/lib/safety-bonus";
import { SafetyCommandHero } from "@/components/safety/SafetyCommandHero";
import { SafetyCommandFiltersBar } from "@/components/safety/SafetyCommandFiltersBar";
import { SafetyCommandEventList } from "@/components/safety/SafetyCommandEventList";
import { SafetyBonusPanel } from "@/components/safety/SafetyBonusPanel";

export function SafetyDashboardScreen() {
  // Source: main-source-v2_enhanced_bof_aligned.xlsx
  const { data } = useBofDemoData();
  const storeEvents = useSafetyStore((s) => s.events);
  const openEventDrawer = useSafetyStore((s) => s.openEventDrawer);
  const setEventStatus = useSafetyStore((s) => s.setEventStatus);

  const [eventType, setEventType] = useState<SafetyCommandEventTypeFilter>("all");
  const [driverFilter, setDriverFilter] = useState<SafetyCommandDriverFilter>("all");
  const [severity, setSeverity] = useState<SafetyCommandSeverityFilter>("all");
  const [status, setStatus] = useState<SafetyCommandStatusFilter>("all");

  const safetyScorecardRows = useMemo(() => getSafetyScorecardRows(), []);
  const safetyScoreSummary = useMemo(() => getSafetyScorecardSummary(), []);
  const atRiskSafetyDrivers = useMemo(() => getAtRiskSafetyDrivers(), []);
  const safetyViolationActions = useMemo(() => getSafetyViolationActions(), []);
  const safetyMonthlyTrend = useMemo(() => getSafetyMonthlyTrend(), []);

  const feed = useMemo(() => buildSafetyCommandFeed(data, storeEvents), [data, storeEvents]);
  const heroStats = useMemo(() => getSafetyCommandHeroStats(data, feed), [data, feed]);
  const filteredFeed = useMemo(
    () => filterSafetyCommandFeed(feed, { eventType, driverId: driverFilter, severity, status }),
    [feed, eventType, driverFilter, severity, status]
  );
  const bonusRows = useMemo(() => getDriverSafetyBonusRows(data), [data]);
  const driverIds = useMemo(
    () => [...(data.drivers ?? [])].map((d) => d.id).sort(),
    [data.drivers]
  );

  const evidenceByDriverId = useMemo(() => {
    const out = new Map<string, ReturnType<typeof getSafetyEvidenceByDriverId>>();
    for (const row of safetyScorecardRows) out.set(row.driverId, getSafetyEvidenceByDriverId(row.driverId));
    return out;
  }, [safetyScorecardRows]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 p-5" style={{ paddingBottom: '6rem' }}>
      {/* Safety Command Center Hero */}
      <section style={{
        position: 'relative',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '3rem 2rem 2rem',
        margin: '-1.25rem -1.25rem 2rem -1.25rem',
        borderRadius: '0 0 12px 12px',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 1
        }}>
          <Image
            src="/generated/marketing/safety/Safety_image.png"
            alt="Safety Command Center"
            fill
            style={{
              objectFit: 'cover',
              objectPosition: 'center 30%'
            }}
          />
        </div>
        
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, rgba(2,6,23,0.95) 0%, rgba(2,6,23,0.85) 40%, rgba(2,6,23,0.7) 70%, rgba(2,6,23,0.5) 100%)',
          zIndex: 2
        }} />
        
        <div style={{ position: 'relative', zIndex: 3 }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#ffffff',
            margin: '0 0 1rem 0',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            Safety Command Center
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: 'rgba(255, 255, 255, 0.9)',
            margin: '0 0 2rem 0',
            maxWidth: '800px',
            lineHeight: '1.6'
          }}>
            Monitor driver safety scorecards, evidence, violations, readiness impacts, and coaching actions before they become dispatch, claims, or settlement problems.
          </p>
          
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(34, 197, 94, 0.2)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: '20px',
              fontSize: '0.85rem',
              color: '#22c55e',
              fontWeight: '500'
            }}>
              Driver scorecards
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(251, 146, 60, 0.2)',
              border: '1px solid rgba(251, 146, 60, 0.3)',
              borderRadius: '20px',
              fontSize: '0.85rem',
              color: '#fb923c',
              fontWeight: '500'
            }}>
              Evidence review
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(168, 85, 247, 0.2)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              borderRadius: '20px',
              fontSize: '0.85rem',
              color: '#a855f7',
              fontWeight: '500'
            }}>
              Coaching required
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '0.5rem 1rem',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '20px',
              fontSize: '0.85rem',
              color: '#ef4444',
              fontWeight: '500'
            }}>
              Dispatch impact
            </span>
          </div>
        </div>
      </section>

      {/* KPI Cards */}
      <section>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#ffffff',
          margin: '0 0 1rem 0'
        }}>
          Safety Metrics Overview
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div style={{
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: '8px',
            padding: '1rem'
          }}>
            <div style={{
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.25rem'
            }}>
              Scored Drivers
            </div>
            <div style={{
              fontSize: '1.8rem',
              fontWeight: '700',
              color: '#22c55e',
              marginBottom: '0.25rem'
            }}>
              {safetyScoreSummary.scoredDrivers}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              Active safety monitoring
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(251, 146, 60, 0.1)',
            border: '1px solid rgba(251, 146, 60, 0.2)',
            borderRadius: '8px',
            padding: '1rem'
          }}>
            <div style={{
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.25rem'
            }}>
              Elite Tier %
            </div>
            <div style={{
              fontSize: '1.8rem',
              fontWeight: '700',
              color: '#fb923c',
              marginBottom: '0.25rem'
            }}>
              {Math.round(safetyScoreSummary.eliteTierPct)}%
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              Top performers
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '8px',
            padding: '1rem'
          }}>
            <div style={{
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.25rem'
            }}>
              At-Risk Drivers
            </div>
            <div style={{
              fontSize: '1.8rem',
              fontWeight: '700',
              color: '#ef4444',
              marginBottom: '0.25rem'
            }}>
              {safetyScoreSummary.atRiskDrivers}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              Require immediate attention
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '8px',
            padding: '1rem'
          }}>
            <div style={{
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.25rem'
            }}>
              Open Safety Evidence
            </div>
            <div style={{
              fontSize: '1.8rem',
              fontWeight: '700',
              color: '#3b82f6',
              marginBottom: '0.25rem'
            }}>
              {Array.from(evidenceByDriverId.values()).reduce((sum, evidence) => sum + evidence.length, 0)}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              Items requiring review
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            border: '1px solid rgba(168, 85, 247, 0.2)',
            borderRadius: '8px',
            padding: '1rem'
          }}>
            <div style={{
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.25rem'
            }}>
              Cargo Damage Exposure
            </div>
            <div style={{
              fontSize: '1.8rem',
              fontWeight: '700',
              color: '#a855f7',
              marginBottom: '0.25rem'
            }}>
              {formatExposure(safetyScoreSummary.cargoDamageExposureUsd)}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              Financial risk
            </div>
          </div>

          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '8px',
            padding: '1rem'
          }}>
            <div style={{
              fontSize: '0.85rem',
              color: 'rgba(255, 255, 255, 0.7)',
              marginBottom: '0.25rem'
            }}>
              Safety Bonus Earned
            </div>
            <div style={{
              fontSize: '1.8rem',
              fontWeight: '700',
              color: '#10b981',
              marginBottom: '0.25rem'
            }}>
              {formatExposure(safetyScoreSummary.safetyBonusEarnedUsd)}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.6)'
            }}>
              Performance rewards
            </div>
          </div>
        </div>
      </section>

      {/* Compact Driver Safety Roster */}
      <section>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#ffffff',
          margin: '0 0 1rem 0'
        }}>
          Driver Safety Roster
        </h2>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem',
            padding: '1rem'
          }}>
            {safetyScorecardRows.map((row) => (
              <div key={row.driverId} style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <Link href={`/drivers/${row.driverId}/profile`} style={{
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: '#22c55e',
                    textDecoration: 'none'
                  }}>
                    {row.driverName}
                  </Link>
                  <TierChip tier={row.performanceTier} />
                </div>
                
                <div style={{
                  fontSize: '0.8rem',
                  color: 'rgba(255, 255, 255, 0.6)',
                  marginBottom: '0.75rem'
                }}>
                  {row.driverId}
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  marginBottom: '0.75rem'
                }}>
                  <div>
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>HOS: </span>
                    <span style={{ color: row.hosCompliancePct < 90 ? '#ef4444' : '#22c55e' }}>
                      {row.hosCompliancePct}%
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>OOS: </span>
                    <span>{row.oosViolations}</span>
                  </div>
                  <div>
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Inspection: </span>
                    <span style={{
                      color: row.tireAssetInspection === 'Fail' ? '#ef4444' : '#22c55e'
                    }}>
                      {row.tireAssetInspection}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Damage: </span>
                    <span style={{ color: row.cargoDamageUsd > 0 ? '#ef4444' : '#22c55e' }}>
                      {formatExposure(row.cargoDamageUsd)}
                    </span>
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.85rem'
                }}>
                  <span style={{ color: '#10b981' }}>
                    Bonus: {formatExposure(row.safetyBonusUsd)}
                  </span>
                  <Link
                    href={`/drivers/${row.driverId}/safety`}
                    style={{
                      padding: '0.25rem 0.75rem',
                      backgroundColor: 'rgba(34, 197, 94, 0.2)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      borderRadius: '4px',
                      color: '#22c55e',
                      textDecoration: 'none',
                      fontSize: '0.75rem',
                      fontWeight: '500'
                    }}
                  >
                    Review →
                  </Link>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{
            padding: '0.5rem 1rem',
            fontSize: '0.75rem',
            color: 'rgba(255, 255, 255, 0.5)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            DRV-012 (Robert Johnson): No safety score on file.
          </div>
        </div>
      </section>

      {/* At-Risk Drivers Section */}
      <section>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#ffffff',
          margin: '0 0 1rem 0'
        }}>
          At-Risk Drivers / Required Actions
        </h2>
        {atRiskSafetyDrivers.length > 0 ? (
          <div style={{
            display: 'grid',
            gap: '1rem'
          }}>
            {atRiskSafetyDrivers.map((row) => (
              <div key={row.driverId} style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                padding: '1rem'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '0.5rem'
                }}>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: '600',
                    color: '#ef4444',
                    margin: '0'
                  }}>
                    {row.driverName}
                  </h3>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    color: '#ef4444',
                    fontWeight: '500',
                    textTransform: 'uppercase'
                  }}>
                    High Risk
                  </span>
                </div>
                
                <p style={{
                  fontSize: '0.9rem',
                  color: 'rgba(255, 255, 255, 0.8)',
                  margin: '0 0 1rem 0',
                  lineHeight: '1.4'
                }}>
                  {row.driverId === "DRV-004"
                    ? "Failed tire/asset inspection and cargo damage."
                    : "HOS compliance below standard, failed tire/asset inspection, and high cargo damage."}
                </p>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{
                    fontSize: '0.85rem',
                    color: 'rgba(255, 255, 255, 0.7)'
                  }}>
                    <strong>Recommended Action:</strong> Immediate coaching and inspection review
                  </div>
                  <Link
                    href={`/drivers/${row.driverId}/safety`}
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      borderRadius: '6px',
                      color: '#ef4444',
                      textDecoration: 'none',
                      fontSize: '0.85rem',
                      fontWeight: '500'
                    }}
                  >
                    Take Action →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            padding: '2rem',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: '1rem',
              color: '#22c55e',
              margin: '0'
            }}>
              No active at-risk drivers. Continue monitoring evidence and coaching completion.
            </p>
          </div>
        )}
      </section>

      {/* Safety Evidence Section */}
      <section>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#ffffff',
          margin: '0 0 1rem 0'
        }}>
          Safety Evidence Review
        </h2>
        <div style={{
          display: 'grid',
          gap: '1rem'
        }}>
          {["DRV-004", "DRV-008"].map((driverId) => {
            const evidence = evidenceByDriverId.get(driverId) ?? [];
            if (evidence.length === 0) return null;
            
            return (
              <div key={driverId} style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '1rem'
              }}>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  color: '#ffffff',
                  margin: '0 0 1rem 0'
                }}>
                  {evidence[0]?.driverName} ({driverId})
                </h3>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '1rem'
                }}>
                  {evidence.map((item) => (
                    <div key={item.id} style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        position: 'relative',
                        height: '150px',
                        overflow: 'hidden'
                      }}>
                        <Image
                          src={item.url}
                          alt={item.label}
                          fill
                          className="object-cover"
                          style={{
                            objectPosition: 'center'
                          }}
                        />
                        <div style={{
                          position: 'absolute',
                          top: '0.5rem',
                          right: '0.5rem',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: item.severity === 'high' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(251, 146, 60, 0.9)',
                          borderRadius: '4px',
                          fontSize: '0.7rem',
                          color: '#ffffff',
                          fontWeight: '500',
                          textTransform: 'uppercase'
                        }}>
                          {item.severity === 'high' ? 'High' : 'Medium'}
                        </div>
                      </div>
                      
                      <div style={{ padding: '1rem' }}>
                        <h4 style={{
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          color: '#ffffff',
                          margin: '0 0 0.5rem 0'
                        }}>
                          {item.label}
                        </h4>
                        
                        <p style={{
                          fontSize: '0.8rem',
                          color: 'rgba(255, 255, 255, 0.7)',
                          margin: '0 0 0.5rem 0',
                          lineHeight: '1.4'
                        }}>
                          {item.note}
                        </p>
                        
                        <div style={{
                          fontSize: '0.75rem',
                          color: 'rgba(255, 255, 255, 0.5)',
                          marginBottom: '1rem'
                        }}>
                          {item.date}
                          {item.location ? ` · ${item.location}` : ""}
                        </div>
                        
                        {getSafetyEvidenceOpenHref(item.url) ? (
                          <a
                            href={getSafetyEvidenceOpenHref(item.url)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-block',
                              padding: '0.5rem 1rem',
                              backgroundColor: 'rgba(34, 197, 94, 0.2)',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              borderRadius: '6px',
                              color: '#22c55e',
                              textDecoration: 'none',
                              fontSize: '0.85rem',
                              fontWeight: '500'
                            }}
                          >
                            Open Evidence →
                          </a>
                        ) : (
                          <span style={{
                            display: 'inline-block',
                            padding: '0.5rem 1rem',
                            backgroundColor: 'rgba(107, 114, 128, 0.2)',
                            border: '1px solid rgba(107, 114, 128, 0.3)',
                            borderRadius: '6px',
                            color: '#6b7280',
                            fontSize: '0.85rem',
                            fontWeight: '500'
                          }}>
                            Evidence Unavailable
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 6-Month Safety Trend */}
      <section>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#ffffff',
          margin: '0 0 1rem 0'
        }}>
          6-Month Safety Trend
        </h2>
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '1rem',
          overflowX: 'auto'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '1rem'
          }}>
            {safetyMonthlyTrend.map((row) => (
              <div key={row.month} style={{
                textAlign: 'center',
                padding: '1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px'
              }}>
                <div style={{
                  fontSize: '0.8rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                  marginBottom: '0.5rem'
                }}>
                  {row.month}
                </div>
                <div style={{
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  color: '#22c55e',
                  marginBottom: '0.25rem'
                }}>
                  {row.safetyScore}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  HOS: {row.avgHosCompliance}%
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}>
                  At Risk: {row.atRiskDrivers}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Provenance Note */}
      <section style={{
        padding: '1rem',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '8px',
        fontSize: '0.8rem',
        color: 'rgba(255, 255, 255, 0.6)'
      }}>
        <p style={{ margin: '0' }}>
          <strong>Data Source:</strong> Safety bonus and incident data sourced from 
          <code style={{ color: '#22c55e' }}>public/data/main-source-v2_enhanced_bof_aligned.xlsx</code>. 
          Evidence photos linked to specific safety incidents. Some maintenance-photo fields not present in v2 source.
        </p>
      </section>
    </div>
  );
}

function TierChip({ tier }: { tier: SafetyPerformanceTier }) {
  const cls =
    tier === "Elite"
      ? "bg-teal-900/35 text-teal-300 ring-1 ring-teal-700/50"
      : tier === "Standard"
        ? "bg-amber-900/30 text-amber-300 ring-1 ring-amber-700/40"
        : "bg-rose-900/40 text-rose-300 ring-1 ring-rose-700/55";
  return <span className={`inline-flex rounded px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{tier}</span>;
}

function KpiCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
        {icon}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{value}</p>
      {sub && <p className="mt-1 text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}
