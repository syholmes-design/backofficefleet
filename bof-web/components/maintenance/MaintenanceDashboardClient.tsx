"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import {
  buildAttentionItems,
  computeMaintenanceKpis,
  listMaintenanceAssetSummaries,
} from "@/lib/maintenance-data";

function formatUsd(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    n
  );
}

function ReadinessBadge({ r }: { r: string }) {
  const cls =
    r === "Ready"
      ? "maint-badge maint-badge-ready"
      : r === "At Risk"
        ? "maint-badge maint-badge-risk"
        : r === "Blocked"
          ? "maint-badge maint-badge-blocked"
          : "maint-badge maint-badge-oos";
  return <span className={cls}>{r}</span>;
}

export function MaintenanceDashboardClient() {
  const { data } = useBofDemoData();
  const summaries = useMemo(() => listMaintenanceAssetSummaries(data), [data]);
  const kpis = useMemo(() => computeMaintenanceKpis(data, summaries), [data, summaries]);
  const attention = useMemo(() => buildAttentionItems(data, summaries), [data, summaries]);

  return (
    <>
      <section className="maint-kpi-row" aria-label="Maintenance KPIs">
        <div className="maint-kpi">
          <p className="maint-kpi-label">Units ready</p>
          <p className="maint-kpi-value">{kpis.units_ready}</p>
        </div>
        <div className="maint-kpi">
          <p className="maint-kpi-label">PM due soon</p>
          <p className="maint-kpi-value">{kpis.pm_due_soon}</p>
          <p className="maint-kpi-hint">MAR At risk · maintenance category</p>
        </div>
        <div className="maint-kpi">
          <p className="maint-kpi-label">PM overdue signal</p>
          <p className="maint-kpi-value">{kpis.pm_overdue}</p>
          <p className="maint-kpi-hint">From MAR root cause text</p>
        </div>
        <div className="maint-kpi">
          <p className="maint-kpi-label">Open MAR on assets</p>
          <p className="maint-kpi-value">{kpis.open_repair_issues}</p>
        </div>
        <div className="maint-kpi">
          <p className="maint-kpi-label">Out of service</p>
          <p className="maint-kpi-value">{kpis.oos_units}</p>
        </div>
        <div className="maint-kpi">
          <p className="maint-kpi-label">Est. maint. spend (MAR)</p>
          <p className="maint-kpi-value">{formatUsd(kpis.estimated_maintenance_spend)}</p>
        </div>
      </section>

      <div className="maint-dashboard-grid">
        <section className="maint-card maint-card-wide" aria-labelledby="maint-table-title">
          <h2 id="maint-table-title" className="maint-card-title">
            Asset maintenance status
          </h2>
          <div className="maint-table-wrap">
            <table className="maint-table">
              <thead>
                <tr>
                  <th>Unit</th>
                  <th>Type</th>
                  <th>Fleet status</th>
                  <th>Readiness</th>
                  <th>PM status</th>
                  <th>Inspection</th>
                  <th>Open MAR</th>
                  <th>OOS</th>
                  <th>Terminal</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((s) => (
                  <tr key={s.asset_id} className="maint-table-row-click">
                    <td>
                      <Link href={`/maintenance/${s.asset_id}`} className="maint-table-link">
                        {s.unit_number}
                      </Link>
                    </td>
                    <td>{s.kind === "tractor" ? "Tractor" : "Trailer"}</td>
                    <td>{s.fleet_status}</td>
                    <td>
                      <ReadinessBadge r={s.readiness} />
                    </td>
                    <td className="maint-cell-muted">{s.pm_status_label}</td>
                    <td className="maint-cell-muted">{s.inspection_status_label}</td>
                    <td>{s.open_mar_count}</td>
                    <td>{s.oos ? "Yes" : "No"}</td>
                    <td className="maint-cell-muted">{s.current_terminal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="maint-card maint-attention" aria-labelledby="maint-attn-title">
          <h2 id="maint-attn-title" className="maint-card-title">
            What needs attention
          </h2>
          {attention.length === 0 ? (
            <p className="bof-muted bof-small">No MAR-driven attention items on this snapshot.</p>
          ) : (
            <ul className="maint-attention-list">
              {attention.map((a) => (
                <li key={a.id}>
                  <Link href={a.href} className="maint-attention-link">
                    <span className="maint-attention-kind">{a.kind}</span>
                    <span className="maint-attention-title">{a.title}</span>
                    <span className="maint-attention-detail">{a.detail}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </>
  );
}
