"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ClipboardCheck,
  PackageCheck,
  ShieldCheck,
  Truck,
  UserRoundCheck,
} from "lucide-react";
import { loadStatusChipClass } from "./dispatch-ui";
import {
  fetchLoadWorkflowSnapshot,
  formatDateTime,
  formatEnumLabel,
  formatShortDateTime,
  getErrorMessage,
  getJsonStringArray,
  statusTone,
  type DispatchAssignmentRecord,
  type DispatchLoadRecord,
  type DispatchLoadWorkflowSnapshot,
} from "@/lib/dispatch-workflow-ui";

type Props = {
  fleetId: string;
  loads: DispatchLoadRecord[];
  loadsLoading: boolean;
  loadsError: string | null;
  assignmentMap: Record<string, DispatchAssignmentRecord | null>;
  selectedLoadId: string | null;
  onSelectLoad: (loadId: string) => void;
  onOpenLoad: (loadId: string) => void;
  onOpenAssign: (loadId: string) => void;
  onRefresh: () => Promise<void>;
  refreshKey: number;
  demoMode?: boolean;
  relationshipSpine: Record<string, {
    driverId?: string;
    assetId?: string;
    trailerId?: string;
    safetyEventIds: string[];
    workOrderIds: string[];
    rfidEventIds: string[];
    claimIds: string[];
    evidenceRecordIds: string[];
    evidenceReferences: string[];
    documentReferences: string[];
  }>;
};

function MetricCard({
  label,
  value,
  detail,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  detail: string;
  tone: "ready" | "warning" | "blocked" | "info";
  icon: typeof Truck;
}) {
  const toneClass =
    tone === "ready"
      ? "border-emerald-700/50 bg-emerald-950/35 text-emerald-200"
      : tone === "warning"
        ? "border-amber-700/50 bg-amber-950/35 text-amber-200"
        : tone === "blocked"
          ? "border-rose-700/55 bg-rose-950/40 text-rose-200"
          : "border-cyan-700/45 bg-cyan-950/30 text-cyan-100";

  return (
    <div className={`rounded-lg border p-4 ${toneClass}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{label}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
        </div>
        <Icon className="h-5 w-5 opacity-80" aria-hidden />
      </div>
      <p className="mt-3 text-sm leading-5 opacity-85">{detail}</p>
    </div>
  );
}

function WorkflowCard({
  title,
  status,
  detail,
  meta,
}: {
  title: string;
  status: string;
  detail: string;
  meta?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/65 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{title}</p>
          <p className="mt-2 text-lg font-bold text-white">{detail}</p>
        </div>
        <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusTone(status, title === "Driver Readiness" ? "readiness" : title === "Pre-Trip" ? "pretrip" : "release")}`}>
          {formatEnumLabel(status)}
        </span>
      </div>
      {meta ? <p className="mt-2 text-xs text-slate-400">{meta}</p> : null}
    </div>
  );
}

function CommandWorkspaceLinks({ loadId }: { loadId: string }) {
  const links = [
    { href: `/loads/${loadId}`, label: "Manager load file", icon: ClipboardCheck },
    { href: `/pretrip/${loadId}`, label: "Driver pre-trip packet", icon: ShieldCheck },
    { href: `/trip-release/${loadId}`, label: "Dispatch release", icon: PackageCheck },
  ];

  return (
    <section className="rounded-xl border border-teal-800/55 bg-teal-950/18 p-5 shadow-[0_0_40px_rgba(20,184,166,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Selected load workspaces</p>
          <h2 className="mt-2 text-2xl font-black text-white">Use the current BOF workflow pages</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
            The board remains the dispatch command surface while manager file, pre-trip, and release stay on their
            existing BOF pages.
          </p>
        </div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-lg border border-slate-800 bg-slate-950/65 p-4 text-slate-200 transition hover:-translate-y-0.5 hover:border-teal-500/55 hover:bg-slate-900"
          >
            <Icon className="h-5 w-5 text-teal-300" aria-hidden />
            <p className="mt-3 text-base font-black">{label}</p>
            <p className="mt-3 text-xs font-bold text-teal-300 group-hover:text-teal-100">{href}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

export function DispatchBoardScreen({
  loads,
  loadsLoading,
  loadsError,
  assignmentMap,
  selectedLoadId,
  onSelectLoad,
  onOpenLoad,
  onOpenAssign,
  onRefresh,
  refreshKey,
  demoMode = false,
  relationshipSpine,
}: Props) {
  const selectedLoad = useMemo(
    () => loads.find((load) => load.id === selectedLoadId) ?? loads[0] ?? null,
    [loads, selectedLoadId],
  );

  const [workflow, setWorkflow] = useState<DispatchLoadWorkflowSnapshot | null>(null);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);

  useEffect(() => {
    if (demoMode) {
      setWorkflow(null);
      setWorkflowError(null);
      setWorkflowLoading(false);
      return;
    }

    if (!selectedLoad) {
      setWorkflow(null);
      setWorkflowError(null);
      return;
    }

    let cancelled = false;

    async function run() {
      setWorkflowLoading(true);
      try {
        const nextWorkflow = await fetchLoadWorkflowSnapshot(selectedLoad.id);
        if (!cancelled) {
          setWorkflow(nextWorkflow);
          setWorkflowError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setWorkflow(null);
          setWorkflowError(getErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setWorkflowLoading(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [demoMode, refreshKey, selectedLoad]);

  const assignedCount = useMemo(
    () => Object.values(assignmentMap).filter((assignment) => assignment?.status === "ACTIVE").length,
    [assignmentMap],
  );

  const deliveredCount = useMemo(
    () => loads.filter((load) => load.status === "DELIVERED").length,
    [loads],
  );

  const plannedCount = useMemo(
    () => loads.filter((load) => load.status === "PLANNED").length,
    [loads],
  );

  const blockedCount = useMemo(
    () =>
      loads.filter((load) => {
        const assignment = assignmentMap[load.id];
        return !assignment || load.status === "EXCEPTION";
      }).length,
    [assignmentMap, loads],
  );

  const filteredRows = loads;

  const readinessReasons = getJsonStringArray(workflow?.readiness?.reasonCodes).join(", ");
  const latestReleaseReasons = getJsonStringArray(workflow?.latestRelease?.reasonCodes);
  const selectedRelationship = selectedLoad ? relationshipSpine[selectedLoad.id] : undefined;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-6 lg:px-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Truck}
          label="Loads on board"
          value={loads.length}
          detail={demoMode ? "Canonical BOF demo load source." : "Backend load list from the current fleet."}
          tone="ready"
        />
        <MetricCard
          icon={UserRoundCheck}
          label="Active assignments"
          value={assignedCount}
          detail={demoMode ? "Assignment records are not available in the demo source." : "Current active assignments from authoritative dispatch records."}
          tone={assignedCount > 0 ? "info" : "warning"}
        />
        <MetricCard
          icon={PackageCheck}
          label="Delivered"
          value={deliveredCount}
          detail={demoMode ? "Based on canonical load status." : "Delivered loads based on backend load status."}
          tone="ready"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Needs attention"
          value={blockedCount}
          detail={`${plannedCount} loads are planned or missing assignment data.`}
          tone={blockedCount > 0 ? "warning" : "ready"}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-xl border border-slate-800 bg-slate-900/45 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Selected command file</p>
              <h2 className="mt-2 break-all text-2xl font-black text-white sm:text-3xl">
                {selectedLoad?.id ?? "No load selected"}
              </h2>
              <p className="mt-2 text-base text-slate-300">{selectedLoad?.customerName ?? "Select a backend load"}</p>
              {selectedLoad ? (
                <p className="mt-1 text-sm text-slate-400">
                  {selectedLoad.origin} to {selectedLoad.destination}
                </p>
              ) : null}
            </div>
            {selectedLoad ? (
              <span className={`rounded-full px-3 py-1 text-sm font-bold ${loadStatusChipClass(selectedLoad.status)}`}>
                {formatEnumLabel(selectedLoad.status)}
              </span>
            ) : null}
          </div>

          {selectedLoad ? (
            <>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-800 bg-slate-950/65 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Pickup window</p>
                  <p className="mt-2 text-lg font-bold text-white">{formatDateTime(selectedLoad.pickupWindowStart)}</p>
                  <p className="text-sm text-slate-400">Delivery {formatDateTime(selectedLoad.deliveryWindowStart)}</p>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950/65 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Assignment status</p>
                  <p className="mt-2 text-lg font-bold text-white">
                    {assignmentMap[selectedLoad.id]?.status === "ACTIVE" ? "Assigned" : "Unassigned"}
                  </p>
                  <p className="text-sm text-slate-400">
                    {assignmentMap[selectedLoad.id]?.assignedAt
                      ? `Assigned ${formatShortDateTime(assignmentMap[selectedLoad.id]?.assignedAt)}`
                      : "No active assignment for this load."}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                <WorkflowCard
                  title="Driver Readiness"
                  status={workflow?.readiness?.status ?? "NOT_READY"}
                  detail={workflow?.readiness?.summary ?? workflow?.readinessError ?? "Readiness not available yet."}
                  meta={
                    workflow?.readiness
                      ? `Reasons: ${readinessReasons || "None"} · Evaluated ${formatShortDateTime(workflow.readiness.evaluatedAt)}`
                      : undefined
                  }
                />
                <WorkflowCard
                  title="Pre-Trip"
                  status={workflow?.preTrip?.status ?? "NOT_STARTED"}
                  detail={
                    workflow?.preTrip
                      ? `${workflow.preTrip.items.length} checklist items, ${workflow.preTrip.defects.length} recorded defects`
                      : workflow?.assignment
                        ? "Pre-trip not started."
                        : "Assign driver and equipment before pre-trip."
                  }
                  meta={
                    workflow?.preTrip?.completedAt
                      ? `Completed ${formatShortDateTime(workflow.preTrip.completedAt)}`
                      : workflow?.preTrip?.status === "BLOCKED"
                        ? "Blocking defect is currently holding completion."
                        : undefined
                  }
                />
                <WorkflowCard
                  title="Assignment / Equipment"
                  status={workflow?.assignment?.status ?? "UNASSIGNED"}
                  detail={
                    workflow?.assignment
                      ? `${workflow.assignment.driver?.firstName ?? workflow.assignment.driverId} · ${workflow.assignment.tractorEquipment?.unitNumber ?? workflow.assignment.tractorEquipmentId}`
                      : demoMode
                        ? `${selectedRelationship?.driverId ?? "Driver not available"} · Truck ${selectedRelationship?.assetId ?? "not available"}`
                        : "No active assignment"
                  }
                  meta={
                    workflow?.assignment?.trailerEquipment
                      ? `Trailer ${workflow.assignment.trailerEquipment.unitNumber}`
                      : demoMode
                        ? `Trailer ${selectedRelationship?.trailerId ?? "Not available"}`
                        : "Trailer optional"
                  }
                />
                <WorkflowCard
                  title="Dispatch Release"
                  status={workflow?.latestRelease?.disposition ?? "HOLD"}
                  detail={workflow?.latestRelease?.summary ?? "No release has been evaluated for the active assignment."}
                  meta={
                    workflow?.latestRelease
                      ? `Policy ${workflow.latestRelease.policyVersion} · ${formatShortDateTime(workflow.latestRelease.evaluatedAt)}`
                      : "Use the release page to request an authoritative evaluation."
                  }
                />
              </div>

              {demoMode ? (
                <div className="mt-5 rounded-lg border border-cyan-800/50 bg-cyan-950/20 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-cyan-300">Canonical relationship spine</p>
                  <div className="mt-3 grid gap-3 text-sm text-slate-200 sm:grid-cols-2 lg:grid-cols-3">
                    <p>Driver: <strong>{selectedRelationship?.driverId ?? "Not available"}</strong></p>
                    <p>Truck: <strong>{selectedRelationship?.assetId ?? "Not available"}</strong></p>
                    <p>Trailer: <strong>{selectedRelationship?.trailerId ?? "Not available"}</strong></p>
                    <p>Safety events: <strong>{selectedRelationship?.safetyEventIds.length ?? 0}</strong></p>
                    <p>Evidence records: <strong>{selectedRelationship?.evidenceRecordIds.length ?? 0}</strong></p>
                    <p>Documents: <strong>{selectedRelationship?.documentReferences.length ?? 0}</strong></p>
                    <p>Work orders: <strong>{selectedRelationship?.workOrderIds.length ?? 0}</strong></p>
                    <p>RFID events: <strong>{selectedRelationship?.rfidEventIds.length ?? 0}</strong></p>
                    <p>Claims: <strong>{selectedRelationship?.claimIds.length ?? 0}</strong></p>
                  </div>
                  <p className="mt-3 text-xs text-slate-400">
                    Readiness, exception, and release decisions remain on their existing BOF workflow pages; no demo assignment or release record is synthesized here.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedRelationship?.driverId ? (
                      <Link
                        href={`/drivers/${selectedRelationship.driverId}/safety`}
                        className="rounded border border-cyan-700/50 px-3 py-1.5 text-xs font-semibold text-cyan-100 hover:bg-cyan-900/30"
                      >
                        Open driver safety
                      </Link>
                    ) : null}
                    <Link
                      href={`/dispatch?view=exceptions&loadId=${selectedLoad.id}`}
                      className="rounded border border-amber-700/50 px-3 py-1.5 text-xs font-semibold text-amber-100 hover:bg-amber-900/30"
                    >
                      Review exceptions
                    </Link>
                  </div>
                </div>
              ) : null}

              {latestReleaseReasons.length > 0 ? (
                <div className="mt-5 rounded-lg border border-amber-700/45 bg-amber-950/25 p-4">
                  <p className="flex items-center gap-2 text-sm font-bold text-amber-200">
                    <AlertTriangle className="h-4 w-4" aria-hidden />
                    Latest release reason codes
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-amber-50/90">
                    {latestReleaseReasons.map((reasonCode) => (
                      <li key={reasonCode}>- {reasonCode}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={`/loads/${selectedLoad.id}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-900"
                >
                  Open load file
                </Link>
                <Link
                  href={`/pretrip/${selectedLoad.id}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-teal-600 bg-teal-900/20 px-4 py-2 text-sm font-bold text-teal-100 hover:bg-teal-900/40"
                >
                  Open pre-trip
                </Link>
                <Link
                  href={`/trip-release/${selectedLoad.id}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-teal-600 bg-teal-900/20 px-4 py-2 text-sm font-bold text-teal-100 hover:bg-teal-900/40"
                >
                  Open release
                </Link>
                <button
                  type="button"
                  onClick={() => onOpenAssign(selectedLoad.id)}
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-teal-600 bg-teal-900/20 px-4 py-2 text-sm font-bold text-teal-100 hover:bg-teal-900/40"
                >
                  Change assignment
                </button>
              </div>
            </>
          ) : (
            <p className="mt-5 text-sm text-slate-400">No loads are currently available for this fleet.</p>
          )}
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/45 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Backend dispatch board</p>
              <h2 className="mt-2 text-2xl font-bold text-white">Authoritative load rows</h2>
            </div>
            <button
              type="button"
              onClick={() => void onRefresh()}
              className="rounded-md border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
            >
              Refresh
            </button>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            {demoMode
              ? "Canonical BOF load rows are shown here as the dispatch control view; backend assignment state is displayed when an authorized fleet context exists."
              : "Loads, statuses, and assignment presence now come from backend records."}
          </p>
          {loadsError ? (
            <div className="mt-5 rounded-lg border border-rose-700/50 bg-rose-950/30 p-4 text-sm text-rose-100">
              {loadsError}
            </div>
          ) : null}
          {workflowError ? (
            <div className="mt-3 rounded-lg border border-amber-700/50 bg-amber-950/30 p-4 text-sm text-amber-100">
              {workflowError}
            </div>
          ) : null}
          <div className="mt-5 grid gap-3">
            {loadsLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="animate-pulse rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                  <div className="h-4 w-32 rounded bg-slate-800" />
                  <div className="mt-3 h-3 w-56 rounded bg-slate-900" />
                  <div className="mt-3 h-3 w-40 rounded bg-slate-900" />
                </div>
              ))
            ) : filteredRows.length === 0 ? (
              <p className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">
                No backend loads are available for this fleet.
              </p>
            ) : (
              filteredRows.map((load) => {
                const assignment = assignmentMap[load.id];
                const active = load.id === selectedLoad?.id;

                return (
                  <article
                    key={load.id}
                    className={`rounded-xl border p-4 transition ${
                      active ? "border-teal-500/65 bg-teal-950/20" : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <button
                          type="button"
                          onClick={() => onSelectLoad(load.id)}
                          className="text-left text-lg font-black text-white hover:text-teal-100"
                        >
                          {load.id}
                        </button>
                        <p className="mt-1 text-sm text-slate-300">{load.customerName}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {load.origin} to {load.destination}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${loadStatusChipClass(load.status)}`}>
                          {formatEnumLabel(load.status)}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${
                            assignment?.status === "ACTIVE"
                              ? "border-cyan-700/50 bg-cyan-950/30 text-cyan-100"
                              : "border-slate-700 bg-slate-900/70 text-slate-200"
                          }`}
                        >
                          {assignment?.status === "ACTIVE" ? "Assigned" : "Unassigned"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">Pickup</p>
                        <p className="mt-1 text-sm text-slate-200">{formatDateTime(load.pickupWindowStart)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">Delivery</p>
                        <p className="mt-1 text-sm text-slate-200">{formatDateTime(load.deliveryWindowStart)}</p>
                      </div>
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-slate-500">Reference</p>
                        <p className="mt-1 text-sm text-slate-200">{load.referenceNumber ?? "—"}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenLoad(load.id)}
                        className="rounded border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-900"
                      >
                        Open detail
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenAssign(load.id)}
                        className="rounded border border-teal-600 px-3 py-1.5 text-xs font-medium text-teal-100 hover:bg-teal-900/30"
                      >
                        Assign
                      </button>
                      <Link
                        href={`/pretrip/${load.id}`}
                        className="rounded border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-900"
                      >
                        Pre-trip
                      </Link>
                      <Link
                        href={`/trip-release/${load.id}`}
                        className="rounded border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-900"
                      >
                        Release
                      </Link>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>

      {selectedLoad ? <CommandWorkspaceLinks loadId={selectedLoad.id} /> : null}

      {workflowLoading && selectedLoad ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/45 p-4 text-sm text-slate-400">
          Loading workflow state for {selectedLoad.id}...
        </div>
      ) : null}
    </div>
  );
}
