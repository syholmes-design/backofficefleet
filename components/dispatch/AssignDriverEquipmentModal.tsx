"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertOctagon, LoaderCircle, X } from "lucide-react";
import {
  driverDisplayName,
  fetchAssignmentDetailsForLoad,
  formatEnumLabel,
  getErrorMessage,
  requestJson,
  statusTone,
  type DispatchAssignmentRecord,
  type DispatchDriverOption,
  type DispatchEquipmentRecord,
  type DispatchLoadRecord,
} from "@/lib/dispatch-workflow-ui";
import type { DriverOperationalSummary } from "@/lib/services/driverOperationalReadModelService";

type Props = {
  open: boolean;
  loadId: string | null;
  fleetId: string | null;
  drivers: DispatchDriverOption[];
  driverOperationalSummaries: DriverOperationalSummary[];
  onClose: () => void;
  onSaved: () => Promise<void>;
};

function driverOperationalBadge(summary: DriverOperationalSummary | undefined) {
  if (!summary?.readiness) {
    return {
      readinessClass: "border-slate-700 bg-slate-900/70 text-slate-300",
      readinessText: "Readiness not evaluated",
      qualificationText: summary?.qualification
        ? `Qualification ${formatEnumLabel(summary.qualification.qualificationStatus)}`
        : "Qualification not evaluated",
    };
  }

  return {
    readinessClass: statusTone(summary.readiness.readinessStatus, "readiness"),
    readinessText: `Readiness ${formatEnumLabel(summary.readiness.readinessStatus)}`,
    qualificationText: summary.qualification
      ? `Qualification ${formatEnumLabel(summary.qualification.qualificationStatus)}`
      : "Qualification not evaluated",
  };
}

export function AssignDriverEquipmentModal({
  open,
  loadId,
  fleetId,
  drivers,
  driverOperationalSummaries,
  onClose,
  onSaved,
}: Props) {
  const [load, setLoad] = useState<DispatchLoadRecord | null>(null);
  const [equipment, setEquipment] = useState<DispatchEquipmentRecord[]>([]);
  const [assignment, setAssignment] = useState<DispatchAssignmentRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [driverId, setDriverId] = useState("");
  const [tractorId, setTractorId] = useState("");
  const [trailerId, setTrailerId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !loadId || !fleetId) {
      return;
    }

    const currentLoadId = loadId;
    const currentFleetId = fleetId;
    let cancelled = false;

    async function run() {
      setLoading(true);
      setError(null);
      setMessage(null);

      try {
        const [nextLoad, nextEquipment, nextAssignment] = await Promise.all([
          requestJson<DispatchLoadRecord>(`/api/dispatch/load/${currentLoadId}`),
          requestJson<DispatchEquipmentRecord[]>(`/api/dispatch/fleet/${currentFleetId}/equipment`),
          fetchAssignmentDetailsForLoad(currentLoadId),
        ]);

        if (cancelled) {
          return;
        }

        setLoad(nextLoad);
        setEquipment(nextEquipment);
        setAssignment(nextAssignment);
        setDriverId(nextAssignment?.driverId ?? "");
        setTractorId(nextAssignment?.tractorEquipmentId ?? "");
        setTrailerId(nextAssignment?.trailerEquipmentId ?? "");
      } catch (nextError) {
        if (!cancelled) {
          setError(getErrorMessage(nextError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [fleetId, loadId, open]);

  const tractors = useMemo(
    () => equipment.filter((item) => item.equipmentType === "TRACTOR"),
    [equipment],
  );
  const driverSummaryMap = useMemo(
    () => new Map(driverOperationalSummaries.map((summary) => [summary.driverId, summary])),
    [driverOperationalSummaries],
  );
  const trailers = useMemo(
    () => equipment.filter((item) => item.equipmentType === "TRAILER"),
    [equipment],
  );

  const canSave = Boolean(driverId) && Boolean(tractorId) && !saving;

  async function refreshAssignmentState() {
    if (!loadId) {
      return;
    }

    const nextAssignment = await fetchAssignmentDetailsForLoad(loadId);
    setAssignment(nextAssignment);
    setDriverId(nextAssignment?.driverId ?? "");
    setTractorId(nextAssignment?.tractorEquipmentId ?? "");
    setTrailerId(nextAssignment?.trailerEquipmentId ?? "");
  }

  async function handleSave() {
    if (!loadId || !canSave) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await requestJson<DispatchAssignmentRecord>("/api/dispatch/assignment", {
        method: "POST",
        body: JSON.stringify({
          loadId,
          driverId,
          tractorId,
          trailerId: trailerId || null,
        }),
      });

      await refreshAssignmentState();
      await onSaved();
      setMessage("Assignment saved from authoritative dispatch APIs.");
      onClose();
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setSaving(false);
    }
  }

  async function handleUnassign() {
    if (!assignment?.id) {
      return;
    }

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      await requestJson<DispatchAssignmentRecord>(`/api/dispatch/assignment/${assignment.id}/unassign`, {
        method: "POST",
        body: JSON.stringify({ status: "SUPERSEDED" }),
      });

      setAssignment(null);
      setDriverId("");
      setTractorId("");
      setTrailerId("");
      await onSaved();
      setMessage("Active assignment was unassigned.");
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setSaving(false);
    }
  }

  if (!open || !loadId) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-slate-800 bg-slate-950 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-modal-title"
      >
        <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div>
            <h2 id="assign-modal-title" className="text-base font-semibold text-white">
              Assign driver &amp; equipment
            </h2>
            <p className="text-xs text-slate-500">
              Load <span className="font-mono text-teal-400">{load?.id ?? loadId}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-slate-400 hover:bg-slate-900 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {loading ? (
          <div className="flex min-h-[280px] items-center justify-center gap-3 text-sm text-slate-400">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            Loading authoritative dispatch state...
          </div>
        ) : (
          <>
            {error ? (
              <div className="mx-4 mt-4 flex gap-2 rounded border border-rose-800 bg-rose-950/50 p-3 text-sm text-rose-100">
                <AlertOctagon className="h-5 w-5 shrink-0" aria-hidden />
                <div>
                  <p className="font-semibold">Operational issue</p>
                  <p className="mt-1 text-xs text-rose-100/90">{error}</p>
                </div>
              </div>
            ) : null}
            {message ? (
              <div className="mx-4 mt-4 rounded border border-emerald-700/50 bg-emerald-950/40 p-3 text-sm text-emerald-100">
                {message}
              </div>
            ) : null}

            {assignment ? (
              <div className="mx-4 mt-4 rounded border border-cyan-700/40 bg-cyan-950/20 p-3 text-sm text-cyan-100">
                Active assignment is currently attached to this load. Unassign it before creating a replacement if the
                backend reports a conflict.
              </div>
            ) : null}

            <div className="grid min-h-0 flex-1 gap-0 overflow-hidden md:grid-cols-3">
              <Panel title="Drivers">
                {drivers.map((driver) => {
                  const selected = driver.id === driverId;
                  const status = driverOperationalBadge(driverSummaryMap.get(driver.id));
                  return (
                    <button
                      key={driver.id}
                      type="button"
                      onClick={() => setDriverId(driver.id)}
                      className={[
                        "w-full rounded border px-2 py-2 text-left text-xs",
                        selected
                          ? "border-teal-500 bg-teal-950/40 text-teal-50"
                          : "border-slate-800 bg-slate-900/60 text-slate-200 hover:border-slate-600",
                      ].join(" ")}
                    >
                      <div className="font-medium">{driverDisplayName(driver)}</div>
                      <div className="font-mono text-[10px] text-slate-500">{driver.id}</div>
                      <div className="mt-1 text-[10px] uppercase text-slate-500">{driver.status}</div>
                      <div className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] ${status.readinessClass}`}>
                        {status.readinessText}
                      </div>
                      <div className="mt-1 text-[10px] text-slate-400">{status.qualificationText}</div>
                    </button>
                  );
                })}
              </Panel>

              <Panel title="Tractors">
                {tractors.map((tractor) => (
                  <button
                    key={tractor.id}
                    type="button"
                    onClick={() => setTractorId(tractor.id)}
                    className={[
                      "w-full rounded border px-2 py-2 text-left text-xs",
                      tractorId === tractor.id
                        ? "border-teal-500 bg-teal-950/40 text-teal-50"
                        : "border-slate-800 bg-slate-900/60 text-slate-200 hover:border-slate-600",
                    ].join(" ")}
                  >
                    <div className="font-medium">{tractor.unitNumber}</div>
                    <div className="font-mono text-[10px] text-slate-500">{tractor.id}</div>
                    <div className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] uppercase ${statusTone(tractor.status, "equipment")}`}>
                      {formatEnumLabel(tractor.status)}
                    </div>
                  </button>
                ))}
              </Panel>

              <Panel title="Trailers">
                <button
                  type="button"
                  onClick={() => setTrailerId("")}
                  className={[
                    "mb-1 w-full rounded border px-2 py-1.5 text-left text-[11px]",
                    trailerId === ""
                      ? "border-teal-500 bg-teal-950/30 text-teal-50"
                      : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-600",
                  ].join(" ")}
                >
                  No trailer
                </button>
                {trailers.map((trailer) => (
                  <button
                    key={trailer.id}
                    type="button"
                    onClick={() => setTrailerId(trailer.id)}
                    className={[
                      "w-full rounded border px-2 py-2 text-left text-xs",
                      trailerId === trailer.id
                        ? "border-teal-500 bg-teal-950/40 text-teal-50"
                        : "border-slate-800 bg-slate-900/60 text-slate-200 hover:border-slate-600",
                    ].join(" ")}
                  >
                    <div className="font-medium">{trailer.unitNumber}</div>
                    <div className="font-mono text-[10px] text-slate-500">{trailer.id}</div>
                    <div className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] uppercase ${statusTone(trailer.status, "equipment")}`}>
                      {formatEnumLabel(trailer.status)}
                    </div>
                  </button>
                ))}
              </Panel>
            </div>

            <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-800 px-4 py-3">
              <div className="mr-auto max-w-md space-y-1">
                <p className="text-[11px] text-slate-500">
                  Driver and tractor are required. Trailer is optional. Any assignment conflict is returned inline from
                  the backend.
                </p>
              </div>
              {assignment ? (
                <button
                  type="button"
                  onClick={() => void handleUnassign()}
                  disabled={saving}
                  className="rounded border border-amber-700 bg-amber-950/30 px-3 py-1.5 text-sm text-amber-100 hover:bg-amber-900/40 disabled:opacity-40"
                >
                  Unassign current
                </button>
              ) : null}
              <button
                type="button"
                onClick={onClose}
                className="rounded border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!canSave}
                onClick={() => void handleSave()}
                className="rounded border border-teal-600 bg-teal-800/40 px-3 py-1.5 text-sm font-medium text-teal-50 hover:bg-teal-800/60 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Save assignment
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[240px] flex-col border-b border-slate-800 md:border-b-0 md:border-r md:border-slate-800 last:border-r-0">
      <div className="border-b border-slate-800 bg-slate-900/50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">{children}</div>
    </div>
  );
}
