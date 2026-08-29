"use client";

import React, { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { loadStatusChipClass } from "@/components/dispatch/dispatch-ui";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { buildPretripTabletModel } from "@/lib/pretrip-tablet";
import {
  ApiError,
  formatEnumLabel,
  getErrorMessage,
  requestJson,
  type DispatchAssignmentRecord,
  type DispatchLoadRecord,
} from "@/lib/dispatch-workflow-ui";

type Props = {
  fleetId: string | null;
};

export function LoadsPageClient({ fleetId }: Props) {
  const { data: demoData } = useBofDemoData();
  const [loads, setLoads] = useState<DispatchLoadRecord[]>([]);
  const [assignmentMap, setAssignmentMap] = useState<Record<string, DispatchAssignmentRecord | null>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedLoadId, setExpandedLoadId] = useState<string | null>(null);

  const demoLoads = useMemo<DispatchLoadRecord[]>(() => {
    return (demoData.loads as Array<Record<string, unknown>>).map((load) => {
      const inferredLoad = load as Record<string, unknown>;
      const referenceNumber =
        (typeof inferredLoad.referenceNumber === "string" && inferredLoad.referenceNumber.trim()) ||
        (typeof inferredLoad.rateConfirmationNumber === "string" && inferredLoad.rateConfirmationNumber.trim()) ||
        null;

      return {
        id: String(inferredLoad.id ?? ""),
        fleetId: "demo-fleet",
        customerName: String(inferredLoad.customerName ?? "Unknown customer"),
        origin: String(inferredLoad.origin ?? "Unknown origin"),
        destination: String(inferredLoad.destination ?? "Unknown destination"),
        pickupWindowStart: typeof inferredLoad.pickupAt === "string" ? inferredLoad.pickupAt : null,
        pickupWindowEnd: typeof inferredLoad.pickupAt === "string" ? inferredLoad.pickupAt : null,
        deliveryWindowStart: typeof inferredLoad.deliveryAt === "string" ? inferredLoad.deliveryAt : null,
        deliveryWindowEnd: typeof inferredLoad.deliveryAt === "string" ? inferredLoad.deliveryAt : null,
        referenceNumber,
        secondaryReferenceNumber: null,
        status: String(inferredLoad.status ?? "Planned"),
        createdAt: typeof inferredLoad.pickupAt === "string" ? inferredLoad.pickupAt : new Date().toISOString(),
        updatedAt: typeof inferredLoad.deliveryAt === "string" ? inferredLoad.deliveryAt : typeof inferredLoad.pickupAt === "string" ? inferredLoad.pickupAt : new Date().toISOString(),
      };
    });
  }, [demoData.loads]);

  const rosterLoads = fleetId ? loads : demoLoads;

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
    const assigned = rosterLoads.filter((load) => Boolean(assignmentMap[load.id])).length;
    const delivered = rosterLoads.filter((load) => load.status === "DELIVERED").length;
    const planned = rosterLoads.filter((load) => load.status === "PLANNED").length;
    return {
      total: rosterLoads.length,
      assigned,
      planned,
      delivered,
      needsAssignment: rosterLoads.length - assigned,
    };
  }, [assignmentMap, rosterLoads]);

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

        {!loading && rosterLoads.length === 0 && !error ? (
          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-6 text-sm text-slate-300">
            No persisted loads are available for this fleet yet.
          </div>
        ) : null}

        {rosterLoads.length > 0 ? (
          <div className="bof-cc-table-wrap">
            <table className="bof-cc-table">
              <thead>
                <tr>
                  <th scope="col">Load & Ref</th>
                  <th scope="col">Customer & Route</th>
                  <th scope="col">Assigned Driver & Truck</th>
                  <th scope="col">Pre-Trip Inspection</th>
                  <th scope="col">Status & Holds</th>
                  <th scope="col">Workflow Actions</th>
                </tr>
              </thead>
              <tbody>
                {rosterLoads.map((load) => {
                  const pretripModel = buildPretripTabletModel(demoData, load.id);
                  const fullLoadRecord = demoData.loads.find((l) => l.id === load.id) as Record<string, unknown> | undefined;
                  const isExpanded = expandedLoadId === load.id;

                  const driverId = (typeof fullLoadRecord?.driverId === "string" && fullLoadRecord.driverId) || "DRV-001";
                  const assetId = pretripModel?.assetId || (typeof fullLoadRecord?.assetId === "string" && fullLoadRecord.assetId) || "T-102";
                  const trailerNumber = (typeof fullLoadRecord?.trailerNumber === "string" && fullLoadRecord.trailerNumber) || "TRL-2854";
                  const customerName = load.customerName || (typeof fullLoadRecord?.customerName === "string" && fullLoadRecord.customerName) || "Peachtree Foods";
                  const commodity = (typeof fullLoadRecord?.commodity === "string" && fullLoadRecord.commodity) || "";
                  const weight = typeof fullLoadRecord?.weight === "number" ? fullLoadRecord.weight : null;
                  const settlementHold = Boolean(fullLoadRecord?.settlementHold);
                  const settlementHoldReason = typeof fullLoadRecord?.settlementHoldReason === "string" ? fullLoadRecord.settlementHoldReason : "";

                  return (
                    <Fragment key={load.id}>
                      <tr className="align-top">
                        <td>
                          <div>
                            <Link href={`/loads/${load.id}`} className="bof-driver-link">
                              <code className="bof-code font-bold">{load.id}</code>
                            </Link>
                            <div className="mt-1 text-[11px] font-mono text-slate-400">
                              Ref: {load.referenceNumber || `501-${load.id}`}
                            </div>
                          </div>
                        </td>

                        <td>
                          <div>
                            <strong className="text-sm text-slate-100">{customerName}</strong>
                            <p className="mt-0.5 text-xs text-slate-300">
                              {load.origin} → {load.destination}
                            </p>
                            {commodity ? (
                              <p className="mt-1 text-[11px] text-slate-400">
                                {commodity} {weight ? `(${weight.toLocaleString()} lbs)` : ""}
                              </p>
                            ) : null}
                          </div>
                        </td>

                        <td>
                          <div>
                            <p className="text-xs font-semibold text-slate-100">
                              <Link href={`/drivers/${driverId}`} className="hover:text-teal-200 hover:underline">
                                {pretripModel?.driverName || driverId} ({driverId})
                              </Link>
                            </p>
                            <p className="mt-1 text-xs text-slate-300">
                              Truck:{" "}
                              <Link href={`/maintenance/${assetId}`} className="font-mono text-teal-300 hover:underline">
                                {assetId}
                              </Link>{" "}
                              · Trailer: <span className="font-mono text-slate-300">{trailerNumber}</span>
                            </p>
                          </div>
                        </td>

                        <td>
                          <div>
                            {pretripModel ? (
                              <div className="flex items-center gap-2">
                                <span
                                  className={`rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                                    pretripModel.overall === "READY"
                                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                                      : "border-rose-500/40 bg-rose-500/10 text-rose-300"
                                  }`}
                                >
                                  {pretripModel.overall}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setExpandedLoadId(isExpanded ? null : load.id)}
                                  className="text-xs text-teal-300 underline hover:text-teal-100"
                                >
                                  {isExpanded ? "Hide pre-trip" : "View pre-trip"}
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500">Not initialized</span>
                            )}
                            {pretripModel && pretripModel.blockReasons.length > 0 ? (
                              <p className="mt-1.5 text-[11px] font-medium text-rose-300">
                                {pretripModel.blockReasons[0]}
                              </p>
                            ) : null}
                          </div>
                        </td>

                        <td>
                          <div className="space-y-1.5">
                            <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${loadStatusChipClass(load.status)}`}>
                              {formatEnumLabel(load.status)}
                            </span>
                            {settlementHold ? (
                              <p className="text-[11px] font-medium text-rose-300" title={settlementHoldReason}>
                                ⚠️ Settlement Hold
                              </p>
                            ) : null}
                          </div>
                        </td>

                        <td>
                          <div className="flex flex-wrap gap-1.5">
                            <Link href={`/pretrip/${load.id}`} className="bof-link-secondary">
                              Pre-trip report
                            </Link>
                            <Link href={`/loads/${load.id}`} className="bof-link-secondary">
                              Open file
                            </Link>
                            <Link href={`/trip-release/${load.id}`} className="bof-link-secondary">
                              Trip release
                            </Link>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Pre-trip Report Summary Drawer */}
                      {isExpanded && pretripModel ? (
                        <tr className="bg-slate-900/60">
                          <td colSpan={6} className="p-4 border-t border-b border-teal-900/40">
                            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                              <div className="flex items-center justify-between gap-4 mb-3 border-b border-slate-800 pb-3">
                                <div>
                                  <h3 className="text-sm font-bold text-white">Pre-Trip Report Inspection Details for Load {load.id}</h3>
                                  <p className="text-xs text-slate-400">Driver {pretripModel.driverName} ({pretripModel.driverId}) · Truck {pretripModel.assetId}</p>
                                </div>
                                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                                  pretripModel.overall === "READY" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-rose-500/40 bg-rose-500/10 text-rose-300"
                                }`}>
                                  Overall: {pretripModel.overall}
                                </span>
                              </div>

                              {pretripModel.blockReasons.length > 0 ? (
                                <div className="mb-3 rounded-lg border border-rose-900/50 bg-rose-950/30 p-2.5 text-xs text-rose-200">
                                  <strong>Inspection Block Reasons: </strong> {pretripModel.blockReasons.join(" · ")}
                                </div>
                              ) : null}

                              <div className="grid gap-3 md:grid-cols-3">
                                {pretripModel.sections.map((sec) => (
                                  <div key={sec.id} className="rounded-lg border border-slate-800 bg-slate-900/80 p-3 text-xs">
                                    <span className="font-bold text-teal-300">{sec.letter}. {sec.title}</span>
                                    <ul className="mt-2 space-y-1 text-slate-300">
                                      {sec.lines.map((l) => (
                                        <li key={l.id} className="flex items-center justify-between">
                                          <span>{l.label}:</span>
                                          <span className={`font-semibold ${l.status === 'OK' ? 'text-emerald-400' : l.status === 'Warning' ? 'text-amber-400' : 'text-rose-400'}`}>
                                            {l.status}
                                          </span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </div>
  );
}
