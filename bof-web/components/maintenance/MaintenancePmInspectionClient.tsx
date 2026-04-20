"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { listMaintenanceAssetSummaries } from "@/lib/maintenance-data";

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

export function MaintenancePmInspectionClient() {
  const { data } = useBofDemoData();
  const rows = useMemo(() => listMaintenanceAssetSummaries(data), [data]);
  const [terminal, setTerminal] = useState("");
  const [assetType, setAssetType] = useState<"" | "tractor" | "trailer">("");
  const [pmFilter, setPmFilter] = useState<"" | "alert" | "none">("");
  const [inspFilter, setInspFilter] = useState<"" | "missing">("");

  const filtered = useMemo(() => {
    return rows.filter((s) => {
      if (assetType && s.kind !== assetType) return false;
      if (terminal && !s.current_terminal.toLowerCase().includes(terminal.toLowerCase())) return false;
      if (pmFilter === "alert" && !/at risk|overdue|maintenance/i.test(s.pm_status_label)) return false;
      if (pmFilter === "none" && /maintenance|at risk/i.test(s.pm_status_label)) return false;
      if (inspFilter === "missing" && s.inspection_status_label !== "Not in BOF dataset") return false;
      return true;
    });
  }, [rows, terminal, assetType, pmFilter, inspFilter]);

  return (
    <>
      <div className="maint-filters">
        <label className="maint-filter">
          <span>Terminal</span>
          <input
            type="search"
            value={terminal}
            onChange={(e) => setTerminal(e.target.value)}
            placeholder="Filter text…"
          />
        </label>
        <label className="maint-filter">
          <span>Asset type</span>
          <select value={assetType} onChange={(e) => setAssetType(e.target.value as typeof assetType)}>
            <option value="">All</option>
            <option value="tractor">Tractor</option>
            <option value="trailer">Trailer</option>
          </select>
        </label>
        <label className="maint-filter">
          <span>PM status</span>
          <select value={pmFilter} onChange={(e) => setPmFilter(e.target.value as typeof pmFilter)}>
            <option value="">All</option>
            <option value="alert">MAR / PM alert</option>
            <option value="none">No MAR PM line</option>
          </select>
        </label>
        <label className="maint-filter">
          <span>Inspection</span>
          <select value={inspFilter} onChange={(e) => setInspFilter(e.target.value as typeof inspFilter)}>
            <option value="">All</option>
            <option value="missing">Placeholder only (not in JSON)</option>
          </select>
        </label>
      </div>

      <div className="maint-table-wrap">
        <table className="maint-table">
          <thead>
            <tr>
              <th>Unit</th>
              <th>Type</th>
              <th>PM due</th>
              <th>PM status</th>
              <th>Inspection type</th>
              <th>Inspection exp.</th>
              <th>Readiness</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.asset_id}>
                <td>
                  <Link href={`/maintenance/${s.asset_id}`} className="maint-table-link">
                    {s.unit_number}
                  </Link>
                </td>
                <td>{s.kind === "tractor" ? "Tractor" : "Trailer"}</td>
                <td className="maint-cell-muted">{s.pm_due_display}</td>
                <td>{s.pm_status_label}</td>
                <td className="maint-cell-muted">DVIR / periodic (not modeled)</td>
                <td className="maint-cell-muted">{s.inspection_expiration_display}</td>
                <td>
                  <Badge r={s.readiness} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
