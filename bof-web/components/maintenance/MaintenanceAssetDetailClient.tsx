"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import {
  dispatchImpactForAsset,
  getMaintenanceAssetSummary,
  isHighSeverityMar,
  isMaintenanceMar,
  listMaintenanceCostRows,
  repairLikeMarsForAsset,
} from "@/lib/maintenance-data";

function formatUsd(n: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(
    n || 0
  );
}

function Badge({ r }: { r: string }) {
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

export function MaintenanceAssetDetailClient({ assetId }: { assetId: string }) {
  const { data } = useBofDemoData();
  const summary = useMemo(() => getMaintenanceAssetSummary(data, assetId), [data, assetId]);
  const impacts = useMemo(
    () => (summary ? dispatchImpactForAsset(data, assetId, summary) : []),
    [data, assetId, summary]
  );
  const costRows = useMemo(() => {
    const all = listMaintenanceCostRows(
      summary ? [summary] : []
    );
    return all.filter((r) => r.asset_id === assetId);
  }, [summary, assetId]);
  const maintMars = useMemo(
    () => summary?.mar_rows.filter((m) => isMaintenanceMar(m)) ?? [],
    [summary]
  );
  const repairMars = useMemo(
    () => (summary ? repairLikeMarsForAsset(data, assetId) : []),
    [data, assetId, summary]
  );

  const estSpend = useMemo(
    () => maintMars.reduce((a, m) => a + (Number(m.amount) || 0), 0),
    [maintMars]
  );

  if (!summary) {
    return (
      <p className="bof-muted">
        Asset <code className="bof-code">{assetId}</code> not found in the maintenance catalog.
      </p>
    );
  }

  return (
    <>
      <header className="maint-detail-header">
        <div>
          <h2 className="bof-title bof-title-tight">
            {summary.unit_number}{" "}
            <code className="bof-code">{summary.asset_id}</code>
          </h2>
          <p className="bof-muted bof-small">
            {summary.kind === "tractor" ? "Tractor" : "Trailer"} · {summary.fleet_status} ·{" "}
            {summary.current_terminal}
          </p>
        </div>
        <Link href="/maintenance" className="bof-link-secondary bof-small">
          ← All assets
        </Link>
      </header>

      <section className="maint-card maint-readiness-banner">
        <h3 className="maint-card-title">Equipment readiness</h3>
        <p className="maint-readiness-row">
          <Badge r={summary.readiness} />
          <span className="maint-readiness-reason">{summary.readiness_reason}</span>
        </p>
      </section>

      <div className="maint-detail-grid">
        <section className="maint-card">
          <h3 className="maint-card-title">A. Preventive maintenance</h3>
          <p className="bof-muted bof-small maint-section-lead">
            PM calendar rows are not stored separately in BOF JSON; maintenance-driven signals come from
            moneyAtRisk when category references maintenance.
          </p>
          {maintMars.length === 0 ? (
            <p className="bof-small">No maintenance-category MAR on this asset.</p>
          ) : (
            <table className="maint-table maint-table-compact">
              <thead>
                <tr>
                  <th>Record</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {maintMars.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <Link href="/money-at-risk" className="maint-table-link">
                        {m.id}
                      </Link>
                    </td>
                    <td>{m.status}</td>
                    <td>{formatUsd(Number(m.amount) || 0)}</td>
                    <td className="maint-cell-muted">{m.rootCause}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="bof-muted bof-small" style={{ marginTop: "0.75rem" }}>
            PM history (shop tickets): not in BOF dataset.
          </p>
        </section>

        <section className="maint-card">
          <h3 className="maint-card-title">B. Inspections</h3>
          <p className="bof-muted bof-small maint-section-lead">
            Annual / periodic inspection table is not in demo JSON — show readiness placeholder only.
          </p>
          <table className="maint-table maint-table-compact">
            <thead>
              <tr>
                <th>Type</th>
                <th>Last</th>
                <th>Expiration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>DVIR / periodic</td>
                <td>—</td>
                <td>—</td>
                <td className="maint-cell-muted">{summary.inspection_status_label}</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="maint-card maint-card-wide">
          <h3 className="maint-card-title">C. Repair issues (MAR on asset)</h3>
          {repairMars.length === 0 ? (
            <p className="bof-small">No MAR rows reference this asset.</p>
          ) : (
            <div className="maint-table-wrap">
              <table className="maint-table maint-table-compact">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Category</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>OOS</th>
                    <th>Linked load</th>
                  </tr>
                </thead>
                <tbody>
                  {repairMars.map((m) => (
                    <tr key={m.id} className={isHighSeverityMar(m) ? "maint-row-high" : undefined}>
                      <td>{m.id}</td>
                      <td>{m.category}</td>
                      <td>{isHighSeverityMar(m) ? "HIGH" : "STD"}</td>
                      <td>{m.status}</td>
                      <td>{summary.oos ? "Yes" : "No"}</td>
                      <td>{m.loadId ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="maint-card">
          <h3 className="maint-card-title">D. Cost summary</h3>
          <dl className="maint-dl">
            <dt>Estimated (maintenance MAR)</dt>
            <dd>{formatUsd(estSpend)}</dd>
            <dt>Actual spend</dt>
            <dd className="maint-cell-muted">Not in BOF JSON</dd>
            <dt>Vendor / owner (MAR)</dt>
            <dd>{maintMars.map((m) => m.owner).filter(Boolean).join(", ") || "—"}</dd>
          </dl>
          {costRows.length > 0 && (
            <table className="maint-table maint-table-compact" style={{ marginTop: "0.75rem" }}>
              <thead>
                <tr>
                  <th>MAR</th>
                  <th>Type</th>
                  <th>Est.</th>
                </tr>
              </thead>
              <tbody>
                {costRows.map((r) => (
                  <tr key={r.record_id}>
                    <td>{r.record_id}</td>
                    <td>{r.maintenance_type}</td>
                    <td>{formatUsd(r.estimated_cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="maint-card maint-card-wide">
          <h3 className="maint-card-title">E. Dispatch impact</h3>
          {impacts.length === 0 ? (
            <p className="bof-small">
              No active Pending / En Route loads flagged for dispatch impact from this readiness snapshot, or
              unit is ready.
            </p>
          ) : (
            <ul className="maint-impact-list">
              {impacts.map((im) => (
                <li key={im.load_id}>
                  <strong>{im.impact_status}</strong> — {im.message}{" "}
                  <Link href={`/loads/${im.load_id}`} className="bof-link-secondary">
                    Open load
                  </Link>{" "}
                  <Link href={`/trip-release/${im.load_id}`} className="bof-link-secondary">
                    Trip release
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="bof-muted bof-small" style={{ marginTop: "0.5rem" }}>
            Power loads: {summary.loads_as_power.map((l) => l.id).join(", ") || "—"} · Trailer-linked loads:{" "}
            {summary.loads_as_trailer.map((l) => l.id).join(", ") || "—"}
          </p>
        </section>
      </div>
    </>
  );
}
