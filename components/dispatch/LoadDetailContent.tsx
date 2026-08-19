"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClipboardCheck, Link2, ShieldAlert, Truck } from "lucide-react";
import { LoadStatusTimeline } from "./LoadStatusTimeline";
import { loadStatusChipClass } from "./dispatch-ui";
import {
  fetchLoadWorkflowSnapshot,
  formatDateTime,
  formatEnumLabel,
  formatShortDateTime,
  getErrorMessage,
  getJsonStringArray,
  statusTone,
  type DispatchLoadRecord,
  type DispatchLoadWorkflowSnapshot,
} from "@/lib/dispatch-workflow-ui";

type Props = {
  load: DispatchLoadRecord;
  onClose?: () => void;
  onOpenAssignModal?: (loadId: string) => void;
  refreshKey?: number;
};

type DetailTab = "overview" | "assignment" | "proof" | "documents" | "exceptions" | "settlement";

const TABS: { id: DetailTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "assignment", label: "Assignment" },
  { id: "proof", label: "Proof / Evidence" },
  { id: "documents", label: "Documents" },
  { id: "exceptions", label: "Exceptions" },
  { id: "settlement", label: "Settlement / Finance" },
];

function WorkflowLine({
  label,
  value,
  tone,
  detail,
}: {
  label: string;
  value: string;
  tone: "readiness" | "pretrip" | "release" | "equipment";
  detail?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-sm font-semibold text-slate-100">{value}</p>
        </div>
        <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${statusTone(value, tone)}`}>
          {formatEnumLabel(value)}
        </span>
      </div>
      {detail ? <p className="mt-2 text-xs text-slate-400">{detail}</p> : null}
    </div>
  );
}

export function LoadDetailContent({ load, onClose, onOpenAssignModal, refreshKey = 0 }: Props) {
  const [tab, setTab] = useState<DetailTab>("overview");
  const [workflow, setWorkflow] = useState<DispatchLoadWorkflowSnapshot | null>(null);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setWorkflowLoading(true);
      try {
        const nextWorkflow = await fetchLoadWorkflowSnapshot(load.id);
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
  }, [load.id, refreshKey]);

  const readinessReasons = getJsonStringArray(workflow?.readiness?.reasonCodes);
  const releaseReasons = getJsonStringArray(workflow?.latestRelease?.reasonCodes);

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-800 px-5 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Load</p>
          <h2 className="text-lg font-semibold text-white">{load.id}</h2>
          <p className="text-sm text-slate-400">{load.customerName}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${loadStatusChipClass(load.status)}`}>
            {formatEnumLabel(load.status)}
          </span>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
            >
              Close
            </button>
          ) : null}
        </div>
      </header>

      <div className="shrink-0 border-b border-slate-800 px-5 pt-3">
        <nav className="flex gap-1 overflow-x-auto pb-2" aria-label="Load detail sections">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={[
                "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                tab === item.id
                  ? "bg-teal-950/50 text-teal-100 ring-1 ring-teal-700/50"
                  : "text-slate-400 hover:bg-slate-900 hover:text-slate-200",
              ].join(" ")}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {tab === "overview" ? (
          <>
            <LoadStatusTimeline status={formatEnumLabel(load.status) as never} />
            <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Lane &amp; schedule</h3>
              <dl className="grid gap-2 text-sm text-slate-300">
                <div className="flex flex-col gap-0.5">
                  <dt className="text-[11px] uppercase text-slate-500">Pickup</dt>
                  <dd>{load.origin}</dd>
                  <dd className="text-xs text-slate-500">{formatDateTime(load.pickupWindowStart)}</dd>
                </div>
                <div className="flex flex-col gap-0.5 border-t border-slate-800 pt-2">
                  <dt className="text-[11px] uppercase text-slate-500">Delivery</dt>
                  <dd>{load.destination}</dd>
                  <dd className="text-xs text-slate-500">{formatDateTime(load.deliveryWindowStart)}</dd>
                </div>
                <div className="flex flex-col gap-0.5 border-t border-slate-800 pt-2">
                  <dt className="text-[11px] uppercase text-slate-500">Reference</dt>
                  <dd>{load.referenceNumber ?? "—"}</dd>
                </div>
              </dl>
            </section>
            <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Workflow decision hierarchy</h3>
              <div className="grid gap-3 md:grid-cols-2">
                <WorkflowLine
                  label="Driver readiness"
                  value={workflow?.readiness?.status ?? "NOT_READY"}
                  tone="readiness"
                  detail={workflow?.readiness?.summary ?? workflow?.readinessError ?? "Readiness is not currently available."}
                />
                <WorkflowLine
                  label="Assignment / equipment"
                  value={workflow?.assignment?.status ?? "UNASSIGNED"}
                  tone="equipment"
                  detail={
                    workflow?.assignment
                      ? `${workflow.assignment.driver?.firstName ?? workflow.assignment.driverId} · ${workflow.assignment.tractorEquipment?.unitNumber ?? workflow.assignment.tractorEquipmentId}`
                      : "No active assignment"
                  }
                />
                <WorkflowLine
                  label="Pre-trip"
                  value={workflow?.preTrip?.status ?? "NOT_STARTED"}
                  tone="pretrip"
                  detail={
                    workflow?.preTrip
                      ? `${workflow.preTrip.items.length} checklist items, ${workflow.preTrip.defects.length} defects`
                      : workflow?.assignment
                        ? "Pre-trip has not started."
                        : "Assign this load first."
                  }
                />
                <WorkflowLine
                  label="Dispatch release"
                  value={workflow?.latestRelease?.disposition ?? "HOLD"}
                  tone="release"
                  detail={workflow?.latestRelease?.summary ?? "No authoritative release decision is stored yet."}
                />
              </div>
            </section>
          </>
        ) : null}

        {tab === "assignment" ? (
          <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Truck className="h-3.5 w-3.5 text-teal-500" />
              Assignment
            </h3>
            {workflowLoading ? (
              <p className="text-sm text-slate-400">Loading assignment workflow...</p>
            ) : workflowError ? (
              <p className="rounded border border-rose-700/50 bg-rose-950/20 p-3 text-sm text-rose-100">{workflowError}</p>
            ) : (
              <>
                <dl className="grid gap-3 text-sm">
                  <div className="flex justify-between gap-4 border-b border-slate-800 pb-2">
                    <dt className="text-slate-500">Driver</dt>
                    <dd className="font-medium text-slate-100">
                      {workflow?.assignment?.driver
                        ? `${workflow.assignment.driver.firstName} ${workflow.assignment.driver.lastName}`
                        : workflow?.assignment?.driverId ?? "Unassigned"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-slate-800 pb-2">
                    <dt className="text-slate-500">Tractor</dt>
                    <dd className="font-medium text-slate-100">
                      {workflow?.assignment?.tractorEquipment?.unitNumber ?? workflow?.assignment?.tractorEquipmentId ?? "Unassigned"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4 border-b border-slate-800 pb-2">
                    <dt className="text-slate-500">Trailer</dt>
                    <dd className="font-medium text-slate-100">
                      {workflow?.assignment?.trailerEquipment?.unitNumber ?? workflow?.assignment?.trailerEquipmentId ?? "Optional / none"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Assignment status</dt>
                    <dd className="font-medium text-slate-100">{workflow?.assignment?.status ?? "UNASSIGNED"}</dd>
                  </div>
                </dl>

                {onOpenAssignModal ? (
                  <button
                    type="button"
                    onClick={() => onOpenAssignModal(load.id)}
                    className="mt-4 rounded border border-teal-600 bg-teal-900/20 px-3 py-2 text-sm font-medium text-teal-100 hover:bg-teal-900/40"
                  >
                    Open assignment modal
                  </button>
                ) : null}
              </>
            )}
          </section>
        ) : null}

        {tab === "proof" ? (
          <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <ClipboardCheck className="h-3.5 w-3.5 text-teal-500" />
              Proof / Evidence
            </h3>
            <p className="text-sm text-slate-300">
              Pre-trip and release now source authoritative checklist and release decisions from backend APIs. Use the
              workflow pages below to review the operational packet without recreating those decisions in the client.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={`/pretrip/${load.id}`} className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900">
                Open pre-trip packet
              </Link>
              <Link href={`/trip-release/${load.id}`} className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900">
                Open release workflow
              </Link>
            </div>
          </section>
        ) : null}

        {tab === "documents" ? (
          <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Link2 className="h-3.5 w-3.5 text-teal-500" />
              Documents
            </h3>
            <p className="text-sm text-slate-300">
              The dispatch integration keeps the existing BOF document ecosystem intact while the dispatch workflow now
              reads backend load, assignment, readiness, pre-trip, and release state from validated APIs.
            </p>
          </section>
        ) : null}

        {tab === "exceptions" ? (
          <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <ShieldAlert className="h-3.5 w-3.5 text-teal-500" />
              Exceptions
            </h3>
            {releaseReasons.length > 0 ? (
              <ul className="space-y-2 text-sm text-slate-200">
                {releaseReasons.map((reasonCode) => (
                  <li key={reasonCode} className="rounded border border-slate-800 bg-slate-950/40 p-3">
                    <p className="font-semibold">{reasonCode}</p>
                    <p className="mt-1 text-xs text-slate-400">{workflow?.latestRelease?.summary}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-300">No release blockers or holds are currently recorded for this load.</p>
            )}
          </section>
        ) : null}

        {tab === "settlement" ? (
          <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Link2 className="h-3.5 w-3.5 text-teal-500" />
              Settlement readiness
            </h3>
            <p className="text-sm text-slate-300">
              This Step 12 integration preserves the existing settlement surfaces. Dispatch release history and pre-trip
              evidence are now available from authoritative backend workflow records.
            </p>
            {workflow?.latestRelease ? (
              <div className="mt-4 rounded border border-slate-800 bg-slate-950/40 p-3 text-sm text-slate-200">
                Latest release: {workflow.latestRelease.disposition} · {formatShortDateTime(workflow.latestRelease.evaluatedAt)}
              </div>
            ) : null}
          </section>
        ) : null}
      </div>

      <footer className="shrink-0 space-y-2 border-t border-slate-800 bg-slate-950/90 px-5 py-3">
        <p className="text-[10px] uppercase tracking-wide text-slate-500">Operational links</p>
        <div className="flex flex-wrap gap-2">
          <Link href={`/pretrip/${load.id}`} className="rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700">
            Pre-trip
          </Link>
          <Link href={`/trip-release/${load.id}`} className="rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700">
            Dispatch release
          </Link>
          {workflow?.readiness ? (
            <span className="rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-300">
              Readiness {workflow.readiness.status} · {formatShortDateTime(workflow.readiness.evaluatedAt)}
            </span>
          ) : null}
          {workflow?.latestRelease ? (
            <span className="rounded border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-300">
              Release {workflow.latestRelease.disposition} · {formatShortDateTime(workflow.latestRelease.evaluatedAt)}
            </span>
          ) : null}
        </div>
        {workflow?.readiness ? (
          <p className="text-[11px] text-slate-500">
            Readiness reasons: {readinessReasons.length > 0 ? readinessReasons.join(", ") : "None"} · Evaluator{" "}
            {workflow.readiness.evaluatedByUserId ?? "System"}
          </p>
        ) : null}
      </footer>
    </div>
  );
}
