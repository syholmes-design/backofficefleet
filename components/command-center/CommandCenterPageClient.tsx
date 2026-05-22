"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import {
  buildCommandCenterKpiStrip,
  enrichCommandCenterItemList,
  enrichCommandCenterItems,
} from "@/lib/command-center-system";
import { useIntakeEngineStore } from "@/lib/stores/intake-engine-store";
import { getBackhaulPendingApprovalAlert } from "@/lib/backhaul-opportunity-engine";
import { buildCommandCenterIssueViewModels } from "@/lib/command-center/command-center-issue-view-model";
import { CommandCenterKpis } from "./CommandCenterKpis";
import { CommandCenterActionBoard } from "./CommandCenterActionBoard";

export function CommandCenterPageClient() {
  const { data } = useBofDemoData();
  const intakeCommandCenterItems = useIntakeEngineStore(
    (s) => s.commandCenterIntakeItems
  );

  const enrichedItems = useMemo(() => {
    const fromIntake = enrichCommandCenterItemList(data, intakeCommandCenterItems);
    const fromRegisters = enrichCommandCenterItems(data);
    return [...fromIntake, ...fromRegisters];
  }, [data, intakeCommandCenterItems]);
  
  const issueViewModels = useMemo(
    () => buildCommandCenterIssueViewModels(data, enrichedItems),
    [data, enrichedItems]
  );
  
  const kpiStrip = useMemo(() => buildCommandCenterKpiStrip(data), [data]);
  const backhaulPendingAlert = useMemo(
    () => getBackhaulPendingApprovalAlert(data),
    [data]
  );

  // Calculate current posture metrics
  const criticalIssues = issueViewModels.filter(i => i.severityLabel === "Critical").length;
  const revenueAtRisk = kpiStrip.totalMoneyAtRisk;
  const driversBlocked = kpiStrip.driversAtRisk;
  const loadsMissingProof = issueViewModels.filter(i => i.issueType === "proof_documents").length;

  return (
    <div className="bof-page bof-cc-page" style={{ paddingBottom: '6rem' }}>
      {/* Header Section */}
      <section className="bof-cc-hero" style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '3rem 2rem 2rem',
        margin: '0 -2rem',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: '700',
            color: '#ffffff',
            margin: '0 0 1rem 0',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            Command Center: what needs an owner now
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: 'rgba(255, 255, 255, 0.9)',
            margin: '0 0 2rem 0',
            maxWidth: '800px',
            lineHeight: '1.6'
          }}>
            This is the live triage view for the demo. It shows which work is blocked, how much money is exposed, who owns the next action, and which workflow proves the fix.
          </p>
          
          {/* Signal Chips */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '2rem'
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
              Blocked work first
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
              Money at risk visible
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
              Every issue has an owner
            </span>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem', marginBottom: '2rem' }}>
          {/* Main Content Area */}
          <div>
            {/* KPI Row */}
            <CommandCenterKpis 
              criticalIssues={criticalIssues}
              revenueAtRisk={revenueAtRisk}
              driversBlocked={driversBlocked}
              loadsMissingProof={loadsMissingProof}
            />

            {/* Action Board */}
            <CommandCenterActionBoard 
              issues={issueViewModels}
              backhaulAlert={backhaulPendingAlert || undefined}
            />
          </div>

          {/* Right Sidebar - Current Posture */}
          <div>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '1.5rem',
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: '600',
                color: '#ffffff',
                margin: '0 0 1rem 0'
              }}>
                Current Posture
              </h3>
              
              <div style={{ marginBottom: '1rem' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                    System Status
                  </span>
                  <span style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: criticalIssues > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                    border: criticalIssues > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    color: criticalIssues > 0 ? '#ef4444' : '#22c55e',
                    fontWeight: '500'
                  }}>
                    {criticalIssues > 0 ? 'Critical Issues' : 'Stable'}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{
                  fontSize: '0.9rem',
                  color: 'rgba(255, 255, 255, 0.9)',
                  margin: '0 0 0.5rem 0'
                }}>
                  Open Reviews
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <Link href="/settlements" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.5rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '0.85rem',
                    transition: 'background 0.2s ease'
                  }}>
                    <span>Revenue Review</span>
                    <span style={{ color: '#fb923c' }}>
                      {kpiStrip.settlementHoldsCount}
                    </span>
                  </Link>
                  <Link href="/drivers" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.5rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '0.85rem',
                    transition: 'background 0.2s ease'
                  }}>
                    <span>Driver Review</span>
                    <span style={{ color: '#3b82f6' }}>
                      {driversBlocked}
                    </span>
                  </Link>
                  <Link href="/dispatch" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.5rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '6px',
                    textDecoration: 'none',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '0.85rem',
                    transition: 'background 0.2s ease'
                  }}>
                    <span>Proof Gaps</span>
                    <span style={{ color: '#a855f7' }}>
                      {loadsMissingProof}
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Operational Framing Sections */}
        <section style={{ marginTop: '3rem' }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#ffffff',
            margin: '0 0 1rem 0'
          }}>
            How BOF Works
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem'
          }}>
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#22c55e',
                margin: '0 0 0.5rem 0'
              }}>
                Exception-Led Workflow
              </h3>
              <p style={{
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: '0',
                lineHeight: '1.5'
              }}>
                BOF monitors all operational data and surfaces only true exceptions that require attention, eliminating inbox noise.
              </p>
            </div>
            
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#fb923c',
                margin: '0 0 0.5rem 0'
              }}>
                What BOF Surfaces
              </h3>
              <p style={{
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: '0',
                lineHeight: '1.5'
              }}>
                Proof gaps, settlement holds, driver readiness issues, maintenance risk, claims exposure, and customer-impacting delays.
              </p>
            </div>
            
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '1.5rem'
            }}>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: '600',
                color: '#a855f7',
                margin: '0 0 0.5rem 0'
              }}>
                Expected Effect
              </h3>
              <p style={{
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.8)',
                margin: '0',
                lineHeight: '1.5'
              }}>
                Fewer surprises, less firefighting, faster resolution, lower operational drag, and more predictable service.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
