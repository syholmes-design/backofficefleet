"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { listMaintenanceAssetSummaries, listRepairIssueRows } from "@/lib/maintenance-data";

export function MaintenanceRepairsClient() {
  const { data } = useBofDemoData();
  const summaries = useMemo(() => listMaintenanceAssetSummaries(data), [data]);
  const issues = useMemo(() => listRepairIssueRows(data, summaries), [data, summaries]);
  const [severity, setSeverity] = useState<"" | "HIGH" | "MEDIUM">("");
  const [status, setStatus] = useState("");
  const [oos, setOos] = useState<"" | "yes" | "no">("");
  const [terminal, setTerminal] = useState("");

  const filtered = useMemo(() => {
    return issues.filter((r) => {
      if (severity && r.severity !== severity) return false;
      if (status && !(r.status ?? "").toLowerCase().includes(status.toLowerCase())) return false;
      if (oos === "yes" && !r.out_of_service) return false;
      if (oos === "no" && r.out_of_service) return false;
      if (terminal) {
        const s = summaries.find((x) => x.asset_id === r.asset_id);
        if (!s?.current_terminal.toLowerCase().includes(terminal.toLowerCase())) return false;
      }
      return true;
    });
  }, [issues, severity, status, oos, terminal, summaries]);

  return (
    <>
      <div className="maint-filters">
        <label className="maint-filter">
          <span>Severity</span>
          <select value={severity} onChange={(e) => setSeverity(e.target.value as typeof severity)}>
            <option value="">All</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
          </select>
        </label>
        <label className="maint-filter">
          <span>Status contains</span>
          <input value={status} onChange={(e) => setStatus(e.target.value)} placeholder="Open, Blocked…" />
        </label>
        <label className="maint-filter">
          <span>OOS</span>
          <select value={oos} onChange={(e) => setOos(e.target.value as typeof oos)}>
            <option value="">All</option>
            <option value="yes">Unit OOS</option>
            <option value="no">Unit not OOS</option>
          </select>
        </label>
        <label className="maint-filter">
          <span>Terminal</span>
          <input value={terminal} onChange={(e) => setTerminal(e.target.value)} placeholder="Filter…" />
        </label>
      </div>

      <div className="maint-table-wrap">
        <table className="maint-table">
          <thead>
            <tr>
              <th>Unit</th>
              <th>Type</th>
              <th>Issue</th>
              <th>Severity</th>
              <th>Status</th>
              <th>OOS</th>
              <th>Load</th>
              <th>Reported</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
                <tr
                  key={r.issue_id}
                  className={r.severity === "HIGH" || r.out_of_service ? "maint-row-high" : undefined}
                >
                  <td>
                    <Link href={`/maintenance/${r.asset_id}`} className="maint-table-link">
                      {r.unit_number}
                    </Link>
                  </td>
                  <td>{r.kind === "tractor" ? "Tractor" : "Trailer"}</td>
                  <td>{r.description}</td>
                  <td>{r.severity}</td>
                  <td>{r.status}</td>
                  <td>{r.out_of_service ? "Yes" : "No"}</td>
                  <td>{r.linked_load_id ? <Link href={`/loads/${r.linked_load_id}`}>{r.linked_load_id}</Link> : "—"}</td>
                  <td className="maint-cell-muted">{r.reported_display}</td>
                </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="bof-muted bof-small" style={{ marginTop: "0.75rem" }}>
        Rows are derived from <code className="bof-code">moneyAtRisk[]</code> where <code className="bof-code">assetId</code>{" "}
        is set. HIGH = blocked MAR or amount ≥ $4k open/at risk.
      </p>
    </>
  );
}
