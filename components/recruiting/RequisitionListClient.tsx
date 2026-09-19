"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import "./recruiting.css";

type RequisitionListItem = {
  id: string;
  publicNumber: string;
  status: string;
  recruitingPipelineState: string;
  positionTitle: string | null;
  targetStartDate: string | null;
  dateSubmitted: string | null;
  numberOfPositions: number;
  requestingManagerName: string | null;
  fleet: { id: string; name: string };
  approvals: Array<{ decision: string }>;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

export function RequisitionListClient({ initialRows }: { initialRows: RequisitionListItem[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    return initialRows.filter((row) => {
      if (status !== "ALL" && row.status !== status) return false;
      const haystack = `${row.publicNumber} ${row.positionTitle ?? ""} ${row.fleet.name} ${row.requestingManagerName ?? ""}`.toLowerCase();
      return haystack.includes(query.trim().toLowerCase());
    });
  }, [initialRows, query, status]);

  async function createDraft() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/recruiting/requisitions", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Unable to create requisition");
      router.push(`/recruiting/requisitions/${payload.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create requisition");
      setBusy(false);
    }
  }

  return (
    <div className="bof-recruiting">
      <div className="bof-recruiting-header">
        <div>
          <h1>Recruiting requisitions</h1>
          <p className="bof-recruiting-lede">
            Authorized workforce need for a fleet position. This surface stops at Approved / Ready for Recruiting. It does not create a Driver or open DriverIntake.
          </p>
          <p className="bof-recruiting-lede">
            <Link href="/recruiting/workspace">Recruiting workspace</Link>
            {" · "}
            <Link href="/recruiting-v2">Recruiting v2 documents</Link>
          </p>
        </div>
        <button className="bof-recruiting-create" type="button" onClick={createDraft} disabled={busy}>
          {busy ? "Creating…" : "Create requisition"}
        </button>
      </div>
      {error ? <p className="bof-recruiting-error">{error}</p> : null}
      <div className="bof-recruiting-toolbar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search number, position, fleet, manager" aria-label="Search requisitions" />
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
          <option value="ALL">All statuses</option>
          {["DRAFT", "SUBMITTED", "UNDER_REVIEW", "APPROVED", "ON_HOLD", "CANCELLED", "FILLED"].map((value) => (
            <option key={value} value={value}>
              {value.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </div>
      <table className="bof-recruiting-table">
        <thead>
          <tr>
            <th>Requisition</th>
            <th>Status</th>
            <th>Fleet</th>
            <th>Position</th>
            <th>Target start</th>
            <th>Submitted</th>
            <th>Positions</th>
            <th>Requesting manager</th>
            <th>Review</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={9}>No requisitions match the current filter.</td>
            </tr>
          ) : (
            rows.map((row) => {
              const approvedCount = row.approvals.filter((item) => item.decision === "APPROVED").length;
              return (
                <tr key={row.id}>
                  <td>
                    <Link href={`/recruiting/requisitions/${row.id}`}>{row.publicNumber}</Link>
                  </td>
                  <td>
                    <span className="bof-recruiting-status">{row.status.replaceAll("_", " ")}</span>
                  </td>
                  <td>{row.fleet.name}</td>
                  <td>{row.positionTitle || "—"}</td>
                  <td>{formatDate(row.targetStartDate)}</td>
                  <td>{formatDate(row.dateSubmitted)}</td>
                  <td>{row.numberOfPositions}</td>
                  <td>{row.requestingManagerName || "—"}</td>
                  <td>
                    {approvedCount}/{row.approvals.length} approved
                    <div className="bof-recruiting-note">{row.recruitingPipelineState.replaceAll("_", " ")}</div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
