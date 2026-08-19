"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { loadStatusChipClass } from "@/components/dispatch/dispatch-ui";
import {
  ApiError,
  formatEnumLabel,
  formatShortDateTime,
  getErrorMessage,
  requestJson,
  type DispatchAssignmentRecord,
  type DispatchLoadRecord,
} from "@/lib/dispatch-workflow-ui";

type Props = {
  fleetId: string | null;
};

export function LoadsPageClient({ fleetId }: Props) {
  const [loads, setLoads] = useState<DispatchLoadRecord[]>([]);
  const [assignmentMap, setAssignmentMap] = useState<Record<string, DispatchAssignmentRecord | null>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLoads = useCallback(async () => {
    if (!fleetId) {
      setLoads([]);
      setAssignmentMap({});
      setError(null);
      return;
    }

    setLoading(true);
    try {
      const nextLoads = await requestJson<DispatchLoadRecord[]>(`/api/dispatch/fleet/${fleetId}/loads`);
      setLoads(nextLoads);
      setError(null);
    } catch (nextError) {
      setLoads([]);
      setAssignmentMap({});
      setError(getErrorMessage(nextError));
    } finally {
      setLoading(false);
    }
  }, [fleetId]);

  const fetchAssignments = useCallback(async (nextLoads: DispatchLoadRecord[]) => {
    if (nextLoads.length === 0) {
      setAssignmentMap({});
      return;
    }

    try {
      const entries = await Promise.all(
        nextLoads.map(async (load) => {
          try {
            const assignment = await requestJson<DispatchAssignmentRecord | null>(
              `/api/dispatch/load/${load.id}/assignment`,
            );
            return [load.id, assignment] as const;
          } catch (nextError) {
            if (nextError instanceof ApiError && nextError.status === 404) {
              return [load.id, null] as const;
            }
            throw nextError;
          }
        }),
      );

      setAssignmentMap(Object.fromEntries(entries));
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    }
  }, []);

  useEffect(() => {
    void fetchLoads();
  }, [fetchLoads]);

  useEffect(() => {
    void fetchAssignments(loads);
  }, [loads, fetchAssignments]);

  const metrics = useMemo(() => {
    const assigned = loads.filter((load) => Boolean(assignmentMap[load.id])).length;
    const delivered = loads.filter((load) => load.status === "DELIVERED").length;
    const planned = loads.filter((load) => load.status === "PLANNED").length;
    return {
      total: loads.length,
      assigned,
      planned,
      delivered,
      needsAssignment: loads.length - assigned,
    };
  }, [assignmentMap, loads]);

  return (
    <div className="bof-page">
      <header className="bof-oper-hero">
        <p className="bof-kicker">Dispatch loads</p>
        <h1 className="bof-title">Authoritative load roster</h1>
        <p className="bof-lead">
          This roster uses the validated dispatch load records for the current fleet. Open a load file to continue the
          assignment, readiness, pre-trip, and release workflow from the canonical operating core.
        </p>
      </header>

      {!fleetId ? (
        <div className="rounded-xl border border-amber-700/40 bg-amber-950/20 p-6 text-sm text-amber-50">
          No accessible fleet context is available for this session.
        </div>
      ) : null}

      {fleetId ? (
        <>
          {error ? (
            <div className="rounded-xl border border-rose-700/40 bg-rose-950/20 p-6 text-sm text-rose-100">
              {error}
            </div>
          ) : null}

          <section className="bof-oper-metrics" aria-label="Fleet load summary">
            <div className="bof-oper-metric">
              <span className="bof-oper-metric-label">Total loads</span>
              <strong className="bof-oper-metric-value">{metrics.total}</strong>
            </div>
            <div className="bof-oper-metric">
              <span className="bof-oper-metric-label">Assigned</span>
              <strong className="bof-oper-metric-value">{metrics.assigned}</strong>
            </div>
            <div className="bof-oper-metric">
              <span className="bof-oper-metric-label">Needs assignment</span>
              <strong className="bof-oper-metric-value">{metrics.needsAssignment}</strong>
            </div>
            <div className="bof-oper-metric">
              <span className="bof-oper-metric-label">Planned</span>
              <strong className="bof-oper-metric-value">{metrics.planned}</strong>
            </div>
            <div className="bof-oper-metric">
              <span className="bof-oper-metric-label">Delivered</span>
              <strong className="bof-oper-metric-value">{metrics.delivered}</strong>
            </div>
          </section>

          <section className="bof-oper-panel" aria-label="Load roster">
            <div className="bof-cc-panel-head">
              <div>
                <h2 className="bof-h2">Current fleet loads</h2>
                <p className="bof-cc-panel-sub">
                  Backend-authoritative load identity, lane, status, and assignment state for the active fleet.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href="/dispatch" className="bof-cc-action-btn bof-cc-action-btn-primary">
                  Open dispatch
                </Link>
                <Link href="/dispatch/intake" className="bof-cc-action-btn">
                  Open load intake
                </Link>
              </div>
            </div>

            {loading ? <div className="bof-loading">Loading authoritative loads...</div> : null}

            {!loading && loads.length === 0 && !error ? (
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-300">
                No persisted loads are available for this fleet yet.
              </div>
            ) : null}

            {loads.length > 0 ? (
              <div className="bof-cc-table-wrap">
                <table className="bof-cc-table">
                  <thead>
                    <tr>
                      <th scope="col">Load</th>
                      <th scope="col">Customer</th>
                      <th scope="col">Lane</th>
                      <th scope="col">Status</th>
                      <th scope="col">Assignment</th>
                      <th scope="col">Updated</th>
                      <th scope="col">Workflow</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loads.map((load) => {
                      const assignment = assignmentMap[load.id];
                      return (
                        <tr key={load.id}>
                          <td>
                            <Link href={`/loads/${load.id}`} className="bof-driver-link">
                              <code className="bof-code">{load.id}</code>
                            </Link>
                          </td>
                          <td>{load.customerName}</td>
                          <td>
                            {load.origin} to {load.destination}
                          </td>
                          <td>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${loadStatusChipClass(load.status)}`}
                            >
                              {formatEnumLabel(load.status)}
                            </span>
                          </td>
                          <td>
                            <span
                              className={[
                                "rounded-full border px-3 py-1 text-xs font-semibold",
                                assignment
                                  ? "border-teal-700/50 bg-teal-950/40 text-teal-100"
                                  : "border-amber-700/50 bg-amber-950/30 text-amber-100",
                              ].join(" ")}
                            >
                              {assignment ? "Assigned" : "Unassigned"}
                            </span>
                          </td>
                          <td>{formatShortDateTime(load.updatedAt)}</td>
                          <td>
                            <div className="flex flex-wrap gap-2">
                              <Link href={`/loads/${load.id}`} className="bof-link-secondary">
                                Open file
                              </Link>
                              <Link href={`/pretrip/${load.id}`} className="bof-link-secondary">
                                Pre-trip
                              </Link>
                              <Link href={`/trip-release/${load.id}`} className="bof-link-secondary">
                                Release
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        </>
      ) : null}
    </div>
  );
}
