"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PackageCheck, ShieldCheck, Truck, UserRoundCheck } from "lucide-react";
import { DispatchReleaseHistory } from "./DispatchReleaseHistory";
import {
  ApiError,
  fetchLoadWorkflowSnapshot,
  formatDateTime,
  formatEnumLabel,
  formatShortDateTime,
  getErrorMessage,
  getJsonStringArray,
  getReleaseReasonSource,
  requestJson,
  statusTone,
  type DispatchLoadRecord,
  type DispatchLoadWorkflowSnapshot,
  type DispatchReleaseRecord,
} from "@/lib/dispatch-workflow-ui";

function Chip({ children, tone }: { children: React.ReactNode; tone: "ok" | "warn" | "bad" | "muted" }) {
  const cls =
    tone === "ok"
      ? "trip-release-chip trip-release-chip-ok"
      : tone === "warn"
        ? "trip-release-chip trip-release-chip-warn"
        : tone === "bad"
          ? "trip-release-chip trip-release-chip-bad"
          : "trip-release-chip trip-release-chip-muted";
  return <span className={cls}>{children}</span>;
}

export function DriverTripReleaseClient({ loadId }: { loadId: string }) {
  const [load, setLoad] = useState<DispatchLoadRecord | null>(null);
  const [workflow, setWorkflow] = useState<DispatchLoadWorkflowSnapshot | null>(null);
  const [history, setHistory] = useState<DispatchReleaseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const refreshReleaseState = useCallback(async () => {
    setLoading(true);
    try {
      const [nextLoad, nextWorkflow, nextHistory] = await Promise.all([
        requestJson<DispatchLoadRecord>(`/api/dispatch/load/${loadId}`),
        fetchLoadWorkflowSnapshot(loadId),
        requestJson<DispatchReleaseRecord[]>(`/api/dispatch/release/${loadId}/history`),
      ]);
      setLoad(nextLoad);
      setWorkflow(nextWorkflow);
      setHistory(nextHistory);
      setError(null);
    } catch (nextError) {
      setLoad(null);
      setWorkflow(null);
      setHistory([]);
      setError(getErrorMessage(nextError));
    } finally {
      setLoading(false);
    }
  }, [loadId]);

  useEffect(() => {
    void refreshReleaseState();
  }, [refreshReleaseState]);

  const latestRelease = workflow?.latestRelease ?? history[0] ?? null;
  const latestReasonCodes = getJsonStringArray(latestRelease?.reasonCodes);
  const bannerTone =
    latestRelease?.disposition === "RELEASED"
      ? "cleared"
      : latestRelease?.disposition === "CONDITIONALLY_RELEASED"
        ? "risk"
        : latestRelease?.disposition === "HOLD"
          ? "risk"
          : "blocked";

  async function handleEvaluateRelease() {
    setEvaluating(true);
    setFlash(null);
    setError(null);

    try {
      const response = await fetch(`/api/dispatch/release/${loadId}`, {
        method: "POST",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const text = await response.text();
      const body = text ? (JSON.parse(text) as DispatchReleaseRecord | { error?: string }) : null;

      if (!response.ok && response.status !== 409) {
        const message =
          body && typeof body === "object" && "error" in body && typeof body.error === "string"
            ? body.error
            : response.statusText;
        throw new ApiError(message || "Request failed", response.status, body);
      }

      await refreshReleaseState();

      const disposition =
        body && typeof body === "object" && "disposition" in body && typeof body.disposition === "string"
          ? body.disposition
          : "RELEASED";
      setFlash(
        response.status === 409
          ? `Release evaluation returned ${disposition}. Backend hold/block reasons are shown below.`
          : `Release evaluation returned ${disposition}.`,
      );
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setEvaluating(false);
    }
  }

  const blockersAndHolds = useMemo(() => {
    if (!latestRelease) {
      return [];
    }

    return latestReasonCodes.map((reasonCode) => ({
      reasonCode,
      source: getReleaseReasonSource(reasonCode),
      summary: latestRelease.summary,
    }));
  }, [latestReasonCodes, latestRelease]);

  return (
    <div className="bof-page trip-release-page">
      <nav className="bof-breadcrumb" aria-label="Breadcrumb">
        <Link href="/loads">Loads</Link>
        <span aria-hidden> / </span>
        <span>Trip release - {load?.id ?? loadId}</span>
      </nav>

      <header className="trip-release-header">
        <div>
          <h1 className="bof-title bof-title-tight">
            Dispatch release - <span className="trip-release-teal">{load?.customerName ?? "Loading load"}</span>{" "}
            <code className="bof-code">{load?.id ?? loadId}</code>
          </h1>
          <p className="bof-muted bof-small">
            Release is now evaluated, stored, and displayed from authoritative backend dispatch records.
          </p>
        </div>
      </header>

      {error ? (
        <div className="trip-release-banner trip-release-banner--blocked">
          <p className="trip-release-banner-status">{error}</p>
        </div>
      ) : null}

      <div className={`trip-release-banner trip-release-banner--${bannerTone}`}>
        <div className="trip-release-banner-row">
          <div>
            <p className="trip-release-banner-label">Dispatch release</p>
            <p className="trip-release-banner-status">
              {latestRelease ? formatEnumLabel(latestRelease.disposition) : "Not evaluated"}
            </p>
            <p className="trip-release-banner-reason">
              {latestRelease?.summary ?? "Request a release evaluation once assignment, readiness, and pre-trip are in place."}
            </p>
          </div>
          <div className="trip-release-banner-counts">
            <span>
              <strong>{latestReasonCodes.length}</strong> reason code{latestReasonCodes.length === 1 ? "" : "s"}
            </span>
            <span>
              <strong>{history.length}</strong> historical release{history.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <p className="trip-release-banner-hint">
          CONDITIONALLY_RELEASED means the backend authorized a conditional operational release. HOLD means the load is
          not released.
        </p>
      </div>

      {flash ? <p className="trip-release-flash trip-release-flash-info">{flash}</p> : null}
      {loading ? <p className="trip-release-flash trip-release-flash-info">Loading release workflow...</p> : null}

      <div className="trip-release-layout">
        <div className="trip-release-main">
          <section className="trip-release-card" aria-labelledby="tr-overview">
            <h2 id="tr-overview" className="trip-release-card-title">
              Current load context
            </h2>
            <table className="trip-release-table">
              <tbody>
                <tr>
                  <th scope="row">Customer</th>
                  <td>{load?.customerName ?? "—"}</td>
                </tr>
                <tr>
                  <th scope="row">Origin</th>
                  <td>{load?.origin ?? "—"}</td>
                </tr>
                <tr>
                  <th scope="row">Destination</th>
                  <td>{load?.destination ?? "—"}</td>
                </tr>
                <tr>
                  <th scope="row">Pickup</th>
                  <td>{formatDateTime(load?.pickupWindowStart)}</td>
                </tr>
                <tr>
                  <th scope="row">Delivery</th>
                  <td>{formatDateTime(load?.deliveryWindowStart)}</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="trip-release-card" aria-labelledby="tr-hierarchy">
            <h2 id="tr-hierarchy" className="trip-release-card-title">
              Decision hierarchy
            </h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-slate-800 bg-slate-950/55 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Driver readiness</p>
                <div className="mt-2 flex items-center gap-2">
                  <UserRoundCheck className="h-4 w-4 text-teal-300" aria-hidden />
                  <Chip tone={workflow?.readiness?.status === "READY" ? "ok" : workflow?.readiness?.status === "CONDITIONAL" ? "warn" : "bad"}>
                    {workflow?.readiness?.status ?? "NOT_READY"}
                  </Chip>
                </div>
                <p className="mt-2 text-sm text-slate-300">
                  {workflow?.readiness?.summary ?? workflow?.readinessError ?? "Readiness not currently available."}
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/55 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Assignment / equipment</p>
                <div className="mt-2 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-teal-300" aria-hidden />
                  <Chip tone={workflow?.assignment ? "ok" : "bad"}>
                    {workflow?.assignment?.status ?? "UNASSIGNED"}
                  </Chip>
                </div>
                <p className="mt-2 text-sm text-slate-300">
                  {workflow?.assignment
                    ? `${workflow.assignment.driver?.firstName ?? workflow.assignment.driverId} · ${workflow.assignment.tractorEquipment?.unitNumber ?? workflow.assignment.tractorEquipmentId}${workflow.assignment.trailerEquipment ? ` · trailer ${workflow.assignment.trailerEquipment.unitNumber}` : ""}`
                    : "No active assignment exists for this load."}
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/55 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pre-trip</p>
                <div className="mt-2 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-teal-300" aria-hidden />
                  <Chip
                    tone={
                      workflow?.preTrip?.status === "COMPLETED"
                        ? "ok"
                        : workflow?.preTrip?.status === "OPEN"
                          ? "warn"
                          : "bad"
                    }
                  >
                    {workflow?.preTrip?.status ?? "NOT_STARTED"}
                  </Chip>
                </div>
                <p className="mt-2 text-sm text-slate-300">
                  {workflow?.preTrip
                    ? `${workflow.preTrip.items.length} checklist items · ${workflow.preTrip.defects.length} defects`
                    : workflow?.assignment
                      ? "No pre-trip has been started for the active assignment."
                      : "Assignment is required before pre-trip can start."}
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-950/55 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dispatch release</p>
                <div className="mt-2 flex items-center gap-2">
                  <PackageCheck className="h-4 w-4 text-teal-300" aria-hidden />
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusTone(latestRelease?.disposition ?? "HOLD", "release")}`}>
                    {latestRelease?.disposition ?? "HOLD"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-300">
                  {latestRelease?.summary ?? "No stored release decision yet."}
                </p>
              </div>
            </div>
          </section>

          <section className="trip-release-card" aria-labelledby="tr-release">
            <h2 id="tr-release" className="trip-release-card-title">
              Latest release decision
            </h2>
            <table className="trip-release-table">
              <tbody>
                <tr>
                  <th scope="row">Disposition</th>
                  <td>{latestRelease ? formatEnumLabel(latestRelease.disposition) : "Not evaluated"}</td>
                </tr>
                <tr>
                  <th scope="row">Summary</th>
                  <td>{latestRelease?.summary ?? "—"}</td>
                </tr>
                <tr>
                  <th scope="row">Reason codes</th>
                  <td>{latestReasonCodes.length > 0 ? latestReasonCodes.join(", ") : "None"}</td>
                </tr>
                <tr>
                  <th scope="row">Evaluated</th>
                  <td>{latestRelease ? formatShortDateTime(latestRelease.evaluatedAt) : "—"}</td>
                </tr>
                <tr>
                  <th scope="row">Evaluator</th>
                  <td>{latestRelease?.evaluatedByUserId ?? "System"}</td>
                </tr>
                <tr>
                  <th scope="row">Policy version</th>
                  <td>{latestRelease?.policyVersion ?? "—"}</td>
                </tr>
              </tbody>
            </table>
            <div className="trip-release-actions">
              <Link href={`/pretrip/${loadId}`}>Open pre-trip tablet</Link>
              <Link href={`/loads/${loadId}`}>Open manager load file</Link>
            </div>
          </section>

          <section className="trip-release-card" aria-labelledby="tr-history">
            <h2 id="tr-history" className="trip-release-card-title">
              Release history
            </h2>
            <DispatchReleaseHistory releases={history} latestReleaseId={latestRelease?.id ?? null} />
          </section>
        </div>

        <aside className="trip-release-side" aria-labelledby="tr-panel">
          <h2 id="tr-panel" className="trip-release-card-title">
            Blockers &amp; holds
          </h2>
          {blockersAndHolds.length === 0 ? (
            <p className="bof-muted bof-small">No current blocker or hold reason codes are recorded.</p>
          ) : (
            <div className="trip-release-panel-block">
              <h3 className="trip-release-panel-sub">
                {latestRelease?.disposition === "HOLD" ? "Hold reasons" : "Blocking reasons"}
              </h3>
              <ul className="trip-release-checklist">
                {blockersAndHolds.map((entry) => (
                  <li
                    key={entry.reasonCode}
                    className={`trip-release-check-item ${
                      latestRelease?.disposition === "HOLD"
                        ? "trip-release-check-item--warn"
                        : "trip-release-check-item--block"
                    }`}
                  >
                    <span className="trip-release-check-cat">{entry.source}</span>
                    <p>{entry.reasonCode}</p>
                    <p className="bof-muted bof-small">{entry.summary}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {workflow?.readiness ? (
            <div className="trip-release-panel-block">
              <h3 className="trip-release-panel-sub">Readiness reasons</h3>
              <ul className="trip-release-checklist">
                {(getJsonStringArray(workflow.readiness.reasonCodes).length > 0
                  ? getJsonStringArray(workflow.readiness.reasonCodes)
                  : ["No readiness reason codes"]).map((reasonCode) => (
                  <li key={reasonCode} className="trip-release-check-item trip-release-check-item--warn">
                    <span className="trip-release-check-cat">Driver</span>
                    <p>{reasonCode}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {workflow?.preTrip?.defects && workflow.preTrip.defects.length > 0 ? (
            <div className="trip-release-panel-block">
              <h3 className="trip-release-panel-sub">Pre-trip defects</h3>
              <ul className="trip-release-checklist">
                {workflow.preTrip.defects.map((defect) => (
                  <li key={defect.id} className="trip-release-check-item trip-release-check-item--warn">
                    <span className="trip-release-check-cat">Pre-Trip</span>
                    <p>
                      {defect.itemCode} · {defect.description}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>

      <footer className="trip-release-footer">
        <button
          type="button"
          className="trip-release-btn trip-release-btn-primary"
          disabled={evaluating}
          onClick={() => void handleEvaluateRelease()}
        >
          Request release evaluation
        </button>
        <Link href="/dispatch" className="trip-release-btn trip-release-btn-secondary">
          Open dispatch packet
        </Link>
        {latestRelease ? (
          <p className="trip-release-footer-note">
            Latest result: {latestRelease.disposition} at {formatShortDateTime(latestRelease.evaluatedAt)}.
          </p>
        ) : (
          <p className="trip-release-footer-note">
            Release disposition is not calculated locally. Use the button above to request the backend evaluation.
          </p>
        )}
      </footer>
    </div>
  );
}
