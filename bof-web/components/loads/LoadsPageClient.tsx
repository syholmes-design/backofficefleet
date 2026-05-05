"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { LoadsDispatchTable } from "@/components/LoadsDispatchTable";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { OPS_COPY } from "@/lib/ops-copy";
import { buildDispatchLoadsFromBofData } from "@/lib/dispatch-dashboard-seed";
import { getDispatchCommandSummary } from "@/lib/dispatch/dispatch-command-metrics";
import { DispatchRouteMapClient } from "@/components/dispatch/DispatchRouteMapClient";
import { DispatchAttentionQueue } from "@/components/dispatch/DispatchAttentionQueue";

export function LoadsPageClient() {
  const { data, resetDemoRiskOverrides } = useBofDemoData();
  const [selectedLoadId, setSelectedLoadId] = useState<string | undefined>();
  const mapLoads = useMemo(() => buildDispatchLoadsFromBofData(data), [data]);
  const totals = useMemo(() => {
    const all = data.loads.length;
    const pending = data.loads.filter((l) => l.status === "Pending").length;
    const inMotion = data.loads.filter((l) => l.status === "En Route").length;
    const complete = data.loads.filter((l) => l.status === "Delivered").length;
    return { all, pending, inMotion, complete };
  }, [data.loads]);
  const dispatchFleet = useMemo(() => getDispatchCommandSummary(data), [data]);

  return (
    <div className="bof-page">
      <h1 className="bof-title">Loads / dispatch</h1>
      <p className="bof-lead">{OPS_COPY.loadsLead}</p>
      <section className="bof-oper-metrics" aria-label="Dispatch summary">
        <div className="bof-oper-metric">
          <span className="bof-oper-metric-label">Total loads</span>
          <strong className="bof-oper-metric-value">{totals.all}</strong>
        </div>
        <div className="bof-oper-metric">
          <span className="bof-oper-metric-label">Pending</span>
          <strong className="bof-oper-metric-value">{totals.pending}</strong>
        </div>
        <div className="bof-oper-metric">
          <span className="bof-oper-metric-label">En route</span>
          <strong className="bof-oper-metric-value">{totals.inMotion}</strong>
        </div>
        <div className="bof-oper-metric">
          <span className="bof-oper-metric-label">Delivered</span>
          <strong className="bof-oper-metric-value">{totals.complete}</strong>
        </div>
        <div className="bof-oper-metric">
          <span className="bof-oper-metric-label">Active (canonical)</span>
          <strong className="bof-oper-metric-value">{dispatchFleet.activeLoads}</strong>
        </div>
        <div className="bof-oper-metric">
          <span className="bof-oper-metric-label">Loads at risk</span>
          <strong className="bof-oper-metric-value">{dispatchFleet.loadsAtRisk}</strong>
        </div>
        <div className="bof-oper-metric">
          <span className="bof-oper-metric-label">Blocked driver on load</span>
          <strong className="bof-oper-metric-value">{dispatchFleet.loadsWithDispatchBlockedDriver}</strong>
        </div>
        <div className="bof-oper-metric">
          <span className="bof-oper-metric-label">Proof gaps</span>
          <strong className="bof-oper-metric-value">{dispatchFleet.missingOrWeakProofLoads}</strong>
        </div>
      </section>

      <section className="bof-oper-panel" aria-label="Load document readiness">
        <div className="bof-cc-panel-head">
          <h2 className="bof-h2">Load Document Readiness</h2>
          <p className="bof-cc-panel-sub">BOF tracks paperwork and proof needed to release, monitor, deliver, bill, and settle every load</p>
        </div>
        <div className="bof-cc-table-wrap">
          <table className="bof-cc-table">
            <thead>
              <tr>
                <th scope="col">Packet complete</th>
                <th scope="col">Missing required proof</th>
                <th scope="col">Settlement ready</th>
                <th scope="col">Total loads</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong className="bof-cc-metric-value">{dispatchFleet.proofCompleteLoads}</strong>
                </td>
                <td>
                  <strong className="bof-cc-metric-value">{dispatchFleet.missingOrWeakProofLoads}</strong>
                </td>
                <td>
                  <strong className="bof-cc-metric-value">{dispatchFleet.settlementOrClaimHolds}</strong>
                </td>
                <td>
                  <strong className="bof-cc-metric-value">{totals.all}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: "0.75rem" }}>
          <Link href="/documents" className="bof-cc-action-btn" style={{ marginRight: "0.5rem" }}>
            View document workspace
          </Link>
          <Link href="/documents/vault" className="bof-cc-action-btn">
            Open load vault workspace
          </Link>
        </div>
      </section>

      <DispatchAttentionQueue variant="light" limit={6} className="bof-oper-panel bof-oper-panel-tight" />

      <section className="bof-oper-panel bof-oper-panel-tight" aria-label="Dispatch table">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
          <button
            type="button"
            className="bof-link-secondary"
            onClick={resetDemoRiskOverrides}
            style={{ fontSize: 12 }}
          >
            Reset demo risk overrides
          </button>
        </div>
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <LoadsDispatchTable
            data={data}
            selectedLoadId={selectedLoadId}
            onSelectLoad={setSelectedLoadId}
          />
          <DispatchRouteMapClient
            loads={mapLoads}
            selectedLoadId={selectedLoadId}
            onSelectLoad={setSelectedLoadId}
            mode="all"
          />
        </div>
      </section>

      <p className="bof-muted bof-small">
        <Link href="/dashboard" className="bof-link-secondary">
          ← Back to dashboard
        </Link>
        {" · "}
        <Link href="/dispatch" className="bof-link-secondary">
          Dispatch board
        </Link>
        {" · "}
        <Link href="/command-center" className="bof-link-secondary">
          Command Center
        </Link>
      </p>
    </div>
  );
}
