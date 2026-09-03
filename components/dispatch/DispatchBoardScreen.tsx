"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ClipboardCheck,
  PackageCheck,
  ShieldCheck,
} from "lucide-react";
import { loadStatusChipClass } from "./dispatch-ui";
import { DispatchTriageBoard } from "./DispatchTriageBoard";
import { DispatchOperatingTimeline } from "./DispatchOperatingTimeline";
import { DispatchAssetCards } from "@/components/dispatch/DispatchAssetCards";
import { RfidProofChainV4 } from "@/components/rfid-v4/RfidProofChainV4";
import { RouteIntelligenceV4 } from "@/components/route-intelligence-v4/RouteIntelligenceV4";
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
import { buildPretripTabletModel } from "@/lib/pretrip-tablet";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { OpsModuleMasthead } from "@/components/ops-visual/OpsModuleMasthead";
import { OpsWorkflowRail } from "@/components/ops-visual/OpsWorkflowRail";
import {
  getCanonicalDispatchBoardKpis,
  getCanonicalDispatchLoadState,
} from "@/lib/dispatch/canonical-dispatch-operating-state";

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
  const { data: bofData } = useBofDemoData();

  const displayLoads = useMemo(() => {
    if (!demoMode) return loads;
    if (loads.length > 0) return loads;
    return bofData.loads.map((load) => ({
      id: load.id,
      fleetId: "demo-fleet",
      customerName: String((load as { customerName?: string }).customerName ?? "Not available"),
      origin: String(load.origin ?? "Not available"),
      destination: String(load.destination ?? "Not available"),
      pickupWindowStart: typeof load.pickupAt === "string" ? load.pickupAt : null,
      pickupWindowEnd: typeof load.pickupAt === "string" ? load.pickupAt : null,
      deliveryWindowStart: typeof load.deliveryAt === "string" ? load.deliveryAt : null,
      deliveryWindowEnd: typeof load.deliveryAt === "string" ? load.deliveryAt : null,
      referenceNumber: typeof (load as { referenceNumber?: string }).referenceNumber === "string" ? (load as { referenceNumber?: string }).referenceNumber ?? null : null,
      secondaryReferenceNumber: null,
      status: String(load.status ?? "Pending"),
      createdAt: typeof load.pickupAt === "string" ? load.pickupAt : "",
      updatedAt: typeof load.deliveryAt === "string" ? load.deliveryAt : typeof load.pickupAt === "string" ? load.pickupAt : "",
    }));
  }, [bofData.loads, demoMode, loads]);

  const selectedLoad = useMemo(
    () => displayLoads.find((load) => load.id === selectedLoadId) ?? displayLoads[0] ?? null,
    [displayLoads, selectedLoadId],
  );

  const selectedPretripTablet = useMemo(() => {
    if (!selectedLoad) return null;
    return buildPretripTabletModel(bofData, selectedLoad.id);
  }, [bofData, selectedLoad]);

  const [workflow, setWorkflow] = useState<DispatchLoadWorkflowSnapshot | null>(null);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [timelineLoadId, setTimelineLoadId] = useState<string | null>(null);

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

  const canonicalKpis = useMemo(
    () => (demoMode ? getCanonicalDispatchBoardKpis(bofData) : null),
    [bofData, demoMode],
  );

  const selectedOperating = useMemo(
    () => (demoMode && selectedLoad ? getCanonicalDispatchLoadState(bofData, selectedLoad.id) : null),
    [bofData, demoMode, selectedLoad],
  );

  const assignedCount = useMemo(() => {
    if (canonicalKpis) return canonicalKpis.activeAssignments;
    return Object.values(assignmentMap).filter((assignment) => assignment?.status === "ACTIVE").length;
  }, [assignmentMap, canonicalKpis]);

  const deliveredCount = useMemo(() => {
    if (canonicalKpis) return canonicalKpis.delivered;
    return loads.filter((load) => String(load.status).toUpperCase() === "DELIVERED").length;
  }, [canonicalKpis, loads]);

  const blockedCount = useMemo(() => {
    if (canonicalKpis) return canonicalKpis.needsAttention;
    return loads.filter((load) => {
      const assignment = assignmentMap[load.id];
      return !assignment || String(load.status).toUpperCase() === "EXCEPTION";
    }).length;
  }, [assignmentMap, canonicalKpis, loads]);

  const filteredRows = displayLoads;

  const readinessReasons = getJsonStringArray(workflow?.readiness?.reasonCodes).join(", ");
  const latestReleaseReasons = getJsonStringArray(workflow?.latestRelease?.reasonCodes);
  const selectedRelationship = selectedLoad ? relationshipSpine[selectedLoad.id] : undefined;

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <OpsModuleMasthead
        eyebrow="Dispatch triage"
        title="CRITICAL · MAJOR · MINOR"
        description="Operational urgency is separate from load readiness. Canonical gates still decide whether a load can move; this board ranks how serious the open issue is."
        imageSrc="/generated/marketing/dispatch-command-center-hero-photo.png"
        imageAlt="Dispatch command workspace"
        imagePosition="center right"
        chips={
          demoMode && canonicalKpis
            ? [
                { label: "Loads on Board", value: canonicalKpis.loadsOnBoard, hint: "Canonical demo loads", href: "#dispatch-board" },
                { label: "Active Assignments", value: canonicalKpis.activeAssignments, hint: "Canonical driver assignment", href: "#dispatch-board" },
                { label: "Delivered", value: canonicalKpis.delivered, hint: "Canonical status", href: "#dispatch-board" },
                { label: "Needs Attention", value: canonicalKpis.needsAttention, hint: "Open operating blockers", href: "#dispatch-triage" },
              ]
            : [
                { label: "Loads on Board", value: loads.length, hint: "Current fleet list", href: "#dispatch-board" },
                { label: "Active Assignments", value: assignedCount, href: "#dispatch-board" },
                { label: "Delivered", value: deliveredCount, href: "#dispatch-board" },
                { label: "Needs Attention", value: blockedCount, href: "#dispatch-triage" },
              ]
        }
      />
      <DispatchTriageBoard demoMode={demoMode} onSelectLoad={onSelectLoad} onOpenAssign={onOpenAssign} />
      <OpsWorkflowRail
        headingId="bof-dispatch-operating-flow"
        eyebrow="Dispatch sequence"
        title="Assignment, readiness, proof, and attention on one board"
        description="Canonical load identity stays in place. The sequence below uses the same operating counts as the board — not a second data source."
        steps={[
          {
            step: "Loads",
            title: "On the board",
            detail: demoMode ? "Canonical BOF demo load source." : "Current fleet load list.",
            value: canonicalKpis ? canonicalKpis.loadsOnBoard : loads.length,
            tone: "ready",
          },
          {
            step: "Assigned",
            title: "Driver and equipment",
            detail: demoMode ? "Canonical driver assignment on the load record." : "Active assignment records.",
            value: assignedCount,
            tone: assignedCount > 0 ? "neutral" : "warning",
          },
          {
            step: "Delivered",
            title: "Completed movement",
            detail: demoMode ? "Based on canonical load status." : "Delivered loads from backend status.",
            value: deliveredCount,
            tone: "ready",
          },
          {
            step: "Attention",
            title: "Operating blockers",
            detail: demoMode
              ? "Unassigned, pre-trip hold, seal/proof exception, or settlement hold."
              : "Loads without an active assignment or in exception.",
            value: blockedCount,
            tone: blockedCount > 0 ? "blocked" : "ready",
          },
        ]}
      />

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
                    {assignmentMap[selectedLoad.id]?.status === "ACTIVE"
                      ? "Assigned"
                      : selectedOperating?.assigned
                        ? "Assigned"
                        : "Unassigned"}
                  </p>
                  <p className="text-sm text-slate-400">
                    {assignmentMap[selectedLoad.id]?.assignedAt
                      ? `Assigned ${formatShortDateTime(assignmentMap[selectedLoad.id]?.assignedAt)}`
                      : selectedOperating?.driverName
                        ? `Assigned to ${selectedOperating.driverName}`
                        : "No active assignment for this load."}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                <WorkflowCard
                  title="Driver Readiness"
                  status={
                    workflow?.readiness?.status ??
                    (demoMode
                      ? selectedPretripTablet?.overall === "READY"
                        ? "READY"
                        : "NOT_READY"
                      : "NOT_READY")
                  }
                  detail={
                    workflow?.readiness?.summary ??
                    workflow?.readinessError ??
                    (demoMode
                      ? selectedPretripTablet?.overall === "READY"
                        ? `Driver ${selectedPretripTablet.driverName} meets all BOF compliance, CDL, medical, and HOS rules.`
                        : `Readiness held: ${selectedPretripTablet?.blockReasons.join("; ") || "Missing driver credentials or open compliance incident."}`
                      : "Readiness not available yet.")
                  }
                  meta={
                    workflow?.readiness
                      ? `Reasons: ${readinessReasons || "None"} · Evaluated ${formatShortDateTime(workflow.readiness.evaluatedAt)}`
                      : demoMode
                        ? `Evaluated from canonical driver ${selectedPretripTablet?.driverId ?? selectedRelationship?.driverId ?? "N/A"} record`
                        : undefined
                  }
                />
                <WorkflowCard
                  title="Pre-Trip"
                  status={
                    workflow?.preTrip?.status ??
                    (demoMode
                      ? selectedPretripTablet?.overall === "READY"
                        ? "PASSED"
                        : selectedPretripTablet?.blockReasons.some((r) => /maintenance|defect|tire/i.test(r))
                          ? "BLOCKED"
                          : "IN_PROGRESS"
                      : "NOT_STARTED")
                  }
                  detail={
                    workflow?.preTrip
                      ? `${workflow.preTrip.items.length} checklist items, ${workflow.preTrip.defects.length} recorded defects`
                      : demoMode
                        ? selectedPretripTablet?.overall === "READY"
                          ? `Pre-trip complete: 6 inspection sections verified (A–F) for truck ${selectedPretripTablet.assetId}.`
                          : `Pre-trip inspect status: ${selectedPretripTablet?.blockReasons.join(", ") || "Inspection in progress."}`
                        : workflow?.assignment
                          ? "Pre-trip not started."
                          : "Assign driver and equipment before pre-trip."
                  }
                  meta={
                    workflow?.preTrip?.completedAt
                      ? `Completed ${formatShortDateTime(workflow.preTrip.completedAt)}`
                      : workflow?.preTrip?.status === "BLOCKED"
                        ? "Blocking defect is currently holding completion."
                        : demoMode
                          ? `Truck ${selectedPretripTablet?.assetId ?? selectedRelationship?.assetId ?? "N/A"}`
                          : undefined
                  }
                />
                <WorkflowCard
                  title="Assignment / Equipment"
                  status={
                    workflow?.assignment?.status ??
                    (selectedOperating?.assigned ? "ACTIVE" : "UNASSIGNED")
                  }
                  detail={
                    workflow?.assignment
                      ? `${workflow.assignment.driver?.firstName ?? workflow.assignment.driverId} · ${workflow.assignment.tractorEquipment?.unitNumber ?? workflow.assignment.tractorEquipmentId}`
                      : selectedOperating
                        ? `${selectedOperating.driverName ?? selectedOperating.driverId ?? "Driver not available"} · Truck ${selectedOperating.assetId ?? "not available"}`
                        : "No active assignment"
                  }
                  meta={
                    workflow?.assignment?.trailerEquipment
                      ? `Trailer ${workflow.assignment.trailerEquipment.unitNumber}`
                      : selectedOperating?.trailerId
                        ? `Trailer ${selectedOperating.trailerId}`
                        : "Trailer optional"
                  }
                />
                <WorkflowCard
                  title="Dispatch Release"
                  status={
                    workflow?.latestRelease?.disposition ??
                    selectedOperating?.releaseDisposition ??
                    "HOLD"
                  }
                  detail={
                    workflow?.latestRelease?.summary ??
                    selectedOperating?.releaseSummary ??
                    "No release has been evaluated for the active assignment."
                  }
                  meta={
                    workflow?.latestRelease
                      ? `Policy ${workflow.latestRelease.policyVersion} · ${formatShortDateTime(workflow.latestRelease.evaluatedAt)}`
                      : selectedOperating
                        ? "Canonical load, pre-trip, seal, and settlement fields"
                        : "Use the release page to request an authoritative evaluation."
                  }
                />
              </div>

              {demoMode && selectedOperating ? (
                <div className="mt-5 rounded-lg border border-amber-800/45 bg-amber-950/20 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-300">Exceptions, proof, and settlement</p>
                  <div className="mt-3 grid gap-3 text-sm text-slate-200 sm:grid-cols-2">
                    <p>Owner: <strong>{selectedOperating.exceptionOwner}</strong></p>
                    <p>Next action: <strong>{selectedOperating.nextAction}</strong></p>
                    <p>Proof: <strong>{selectedOperating.proofLabel}</strong></p>
                    <p>
                      Settlement:{" "}
                      <strong>
                        {selectedOperating.settlementHold
                          ? selectedOperating.settlementHoldReason || "Hold active"
                          : "No settlement hold"}
                      </strong>
                    </p>
                    <p>Release: <strong>{selectedOperating.releaseDisposition}</strong></p>
                    <p>Consequence: <strong>{selectedOperating.releaseConsequence}</strong></p>
                  </div>
                  {selectedOperating.blockers.length > 0 ? (
                    <ul className="mt-3 space-y-2 text-sm text-amber-50/90">
                      {selectedOperating.blockers.map((blocker) => (
                        <li key={blocker.id}>
                          <p>- {blocker.label}</p>
                          <p className="text-[11px] text-amber-100/70">
                            Owner {blocker.owner} · Next {blocker.nextAction}
                          </p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-slate-400">No unexplained attention item on this load.</p>
                  )}
                </div>
              ) : null}

              {demoMode ? (
                <div className="mt-5 rounded-lg border border-cyan-800/50 bg-cyan-950/20 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-cyan-300">Canonical relationship spine</p>
                  <div className="mt-3 grid gap-3 text-sm text-slate-200 sm:grid-cols-2 lg:grid-cols-3">
                    <p>Driver: <strong>{selectedOperating?.driverId ?? selectedRelationship?.driverId ?? "Not available"}</strong></p>
                    <p>Truck: <strong>{selectedOperating?.assetId ?? selectedRelationship?.assetId ?? "Not available"}</strong></p>
                    <p>Trailer: <strong>{selectedOperating?.trailerId ?? selectedRelationship?.trailerId ?? "Not available"}</strong></p>
                    <p>Safety events: <strong>{selectedRelationship?.safetyEventIds.length ?? 0}</strong></p>
                    <p>Evidence records: <strong>{selectedRelationship?.evidenceReferences.length ?? selectedRelationship?.evidenceRecordIds.length ?? 0}</strong></p>
                    <p>Documents: <strong>{selectedRelationship?.documentReferences.length ?? 0}</strong></p>
                    <p>Work orders: <strong>{selectedRelationship?.workOrderIds.length ?? 0}</strong></p>
                    <p>RFID events: <strong>{selectedRelationship?.rfidEventIds.length ?? 0}</strong></p>
                    <p>Claims: <strong>{selectedRelationship?.claimIds.length ?? 0}</strong></p>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedOperating?.driverId ? (
                      <Link
                        href={`/drivers/${selectedOperating.driverId}/safety`}
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
                    <Link
                      href={`/dispatch?view=settlement&loadId=${selectedLoad.id}`}
                      className="rounded border border-teal-700/50 px-3 py-1.5 text-xs font-semibold text-teal-100 hover:bg-teal-900/30"
                    >
                      Settlement readiness
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
                <button
                  type="button"
                  onClick={() => setTimelineLoadId(selectedLoad.id)}
                  className="inline-flex min-h-11 items-center justify-center rounded-md border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 hover:bg-slate-900"
                >
                  View Timeline
                </button>
              </div>
            </>
          ) : (
            <p className="mt-5 text-sm text-slate-400">No loads are currently available for this fleet.</p>
          )}
        </div>

        <div id="dispatch-board" className="rounded-xl border border-slate-800 bg-slate-900/45 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-300">Dispatch board</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Operating load rows</h2>
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
              ? "Rows use the same canonical load, driver, equipment, and exception fields as the Load File."
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
                const operating = demoMode ? getCanonicalDispatchLoadState(bofData, load.id) : null;
                const isAssigned = assignment?.status === "ACTIVE" || Boolean(operating?.assigned);
                const active = load.id === selectedLoad?.id;

                return (
                  <article
                    key={load.id}
                    className={`rounded-xl border p-4 transition ${
                      active ? "border-teal-500/65 bg-teal-950/20" : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                    }`}
                    onClick={() => onSelectLoad(load.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelectLoad(load.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectLoad(load.id);
                          }}
                          className="text-left text-lg font-black text-white hover:text-teal-100"
                        >
                          {load.id}
                        </button>
                        <p className="mt-1 text-sm text-slate-300">{load.customerName}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {load.origin} to {load.destination}
                        </p>
                        {operating?.driverName ? (
                          <p className="mt-2 text-xs text-slate-400">
                            {operating.driverName} · {operating.assetId ?? "No truck"} · {operating.trailerId ?? "No trailer"}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${loadStatusChipClass(load.status)}`}>
                          {formatEnumLabel(load.status)}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${
                            isAssigned
                              ? "border-cyan-700/50 bg-cyan-950/30 text-cyan-100"
                              : "border-slate-700 bg-slate-900/70 text-slate-200"
                          }`}
                        >
                          {isAssigned ? "Assigned" : "Unassigned"}
                        </span>
                        {operating?.needsAttention ? (
                          <span className="rounded-full border border-amber-700/50 bg-amber-950/30 px-3 py-1 text-xs font-bold text-amber-100">
                            Attention
                          </span>
                        ) : null}
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
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenLoad(load.id);
                        }}
                        className="rounded border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-900"
                      >
                        Open load file
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onOpenAssign(load.id);
                        }}
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
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setTimelineLoadId(load.id);
                        }}
                        className="rounded border border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-900"
                      >
                        View Timeline
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </div>
      </section>

      {selectedLoad ? (
        <section className="space-y-5">
          <RouteIntelligenceV4 loadId={selectedLoad.id} />
          <DispatchAssetCards loadId={selectedLoad.id} />
          <RfidProofChainV4 loadId={selectedLoad.id} showAllEvents={false} maxEvents={5} />
          <CommandWorkspaceLinks loadId={selectedLoad.id} />
        </section>
      ) : null}

      {workflowLoading && selectedLoad ? (
        <div className="rounded-xl border border-slate-800 bg-slate-900/45 p-4 text-sm text-slate-400">
          Loading workflow state for {selectedLoad.id}...
        </div>
      ) : null}

      <DispatchOperatingTimeline
        loadId={timelineLoadId ?? ""}
        open={Boolean(timelineLoadId)}
        onClose={() => setTimelineLoadId(null)}
      />
    </div>
  );
}
