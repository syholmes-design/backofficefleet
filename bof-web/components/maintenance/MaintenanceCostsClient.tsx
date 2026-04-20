"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import {
  listMaintenanceAssetSummaries,
  listMaintenanceCostRows,
  sumAllMarEstimatedSpend,
} from "@/lib/maintenance-data";

function formatUsd(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    n || 0
  );
}

export function MaintenanceCostsClient() {
  const { data } = useBofDemoData();
  const summaries = useMemo(() => listMaintenanceAssetSummaries(data), [data]);
  const rows = useMemo(() => listMaintenanceCostRows(summaries), [summaries]);
  const totalEst = useMemo(() => sumAllMarEstimatedSpend(rows), [rows]);
  const highCostOpen = useMemo(
    () => rows.filter((r) => r.estimated_cost >= 4000 && /open|at risk/i.test(r.status)),
    [rows]
  );

  return (
    <>
      <section className="maint-kpi-row" aria-label="Cost KPIs">
        <div className="maint-kpi">
          <p className="maint-kpi-label">Total estimated (MAR on assets)</p>
          <p className="maint-kpi-value">{formatUsd(totalEst)}</p>
        </div>
        <div className="maint-kpi">
          <p className="maint-kpi-label">Total actual</p>
          <p className="maint-kpi-value maint-cell-muted">—</p>
          <p className="maint-kpi-hint">Not in BOF JSON</p>
        </div>
        <div className="maint-kpi">
          <p className="maint-kpi-label">High-cost open / at risk</p>
          <p className="maint-kpi-value">{highCostOpen.length}</p>
        </div>
      </section>

      <div className="maint-table-wrap">
        <table className="maint-table">
          <thead>
            <tr>
              <th>Unit</th>
              <th>Vendor / owner</th>
              <th>MAR type</th>
              <th>Estimated</th>
              <th>Actual</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.record_id} className={r.estimated_cost >= 4000 ? "maint-row-high" : undefined}>
                <td>
                  <Link href={`/maintenance/${r.asset_id}`} className="maint-table-link">
                    {r.unit_number}
                  </Link>
                </td>
                <td>{r.vendor_name}</td>
                <td>{r.maintenance_type}</td>
                <td>{formatUsd(r.estimated_cost)}</td>
                <td className="maint-cell-muted">{r.actual_cost_display}</td>
                <td>{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="bof-muted bof-small" style={{ marginTop: "0.75rem" }}>
        Vendor column maps to MAR <code className="bof-code">owner</code>. Extend with AP / shop integrations when
        available.
      </p>
    </>
  );
}
