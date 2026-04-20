"use client";

import Link from "next/link";
import { useMemo } from "react";
import { LoadsDispatchTable } from "@/components/LoadsDispatchTable";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { OPS_COPY } from "@/lib/ops-copy";

export function LoadsPageClient() {
  const { data } = useBofDemoData();
  const totals = useMemo(() => {
    const all = data.loads.length;
    const pending = data.loads.filter((l) => l.status === "Pending").length;
    const inMotion = data.loads.filter((l) => l.status === "En Route").length;
    const complete = data.loads.filter((l) => l.status === "Delivered").length;
    return { all, pending, inMotion, complete };
  }, [data.loads]);

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
      </section>

      <section className="bof-oper-panel bof-oper-panel-tight" aria-label="Dispatch table">
        <LoadsDispatchTable data={data} />
      </section>

      <p className="bof-muted bof-small">
        <Link href="/dashboard" className="bof-link-secondary">
          ← Back to dashboard
        </Link>
      </p>
    </div>
  );
}
