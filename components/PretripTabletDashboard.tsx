"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PRETRIP_ITEM_CATALOG,
  PRETRIP_SECTION_LABELS,
  applyPreTripConditionAction,
  createPreTripCondition,
  fetchLoadWorkflowSnapshot,
  fetchPreTripConditionBaseline,
  formatDateTime,
  formatEnumLabel,
  formatShortDateTime,
  getErrorMessage,
  getJsonStringArray,
  requestJson,
  statusTone,
  uploadPreTripConditionEvidence,
  type ConditionBaselineCondition,
  type DispatchLoadRecord,
  type DispatchLoadWorkflowSnapshot,
  type DispatchPreTripRecord,
  type PreTripConditionBaseline,
} from "@/lib/dispatch-workflow-ui";

type Props = {
  loadId: string;
  fleetId: string | null;
};

const ITEM_STATUSES = ["PENDING", "PASS", "WARNING", "FAIL", "NOT_APPLICABLE"] as const;
type ConditionAction = "NO_CHANGE" | "CHANGED" | "REPAIRED_REMOVED" | "UNSURE";

const NEW_CONDITION_CATEGORY_OPTIONS = [
  { label: "STRUCTURAL", value: "STRUCTURAL" },
  { label: "SAFETY", value: "SAFETY_EQUIPMENT" },
  { label: "MECHANICAL", value: "ENGINE_POWERTRAIN" },
  { label: "ELECTRICAL", value: "LIGHTING" },
  { label: "CARGO", value: "CARGO_SECUREMENT" },
  { label: "SECUREMENT", value: "CARGO_SECUREMENT" },
  { label: "DOCUMENTATION", value: "OTHER" },
  { label: "OTHER", value: "OTHER" },
] as const;

const LOCATION_OPTIONS = ["Cab exterior", "Trailer side", "Tires", "Lights", "Coupling area", "Cargo bay", "Other"] as const;
const CHANGE_REASON_OPTIONS = [
  "Worsened",
  "New crack/dent",
  "Leak observed",
  "Loose or damaged securement",
  "Different than last photo",
] as const;

export function PretripTabletDashboard({ loadId, fleetId }: Props) {
  const [loads, setLoads] = useState<DispatchLoadRecord[]>([]);
  const [load, setLoad] = useState<DispatchLoadRecord | null>(null);
  const [workflow, setWorkflow] = useState<DispatchLoadWorkflowSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [conditionBaseline, setConditionBaseline] = useState<PreTripConditionBaseline | null>(null);
  const [conditionActionLoadingId, setConditionActionLoadingId] = useState<string | null>(null);
  const [conditionNotes, setConditionNotes] = useState<Record<string, string>>({});
  const [conditionChangeReasons, setConditionChangeReasons] = useState<Record<string, string>>({});
  const [conditionFiles, setConditionFiles] = useState<Record<string, File | null>>({});
  const [conditionResults, setConditionResults] = useState<Record<string, ConditionAction>>({});
  const [activeConditionIndex, setActiveConditionIndex] = useState(0);
  const [activeChecklistIndex, setActiveChecklistIndex] = useState(0);
  const [newConditionEquipmentId, setNewConditionEquipmentId] = useState<string>("");
  const [newConditionLocation, setNewConditionLocation] = useState<string>(LOCATION_OPTIONS[0]);
  const [newConditionTitle, setNewConditionTitle] = useState("");
  const [newConditionCategory, setNewConditionCategory] = useState("OTHER");
  const [newConditionSeverity, setNewConditionSeverity] = useState("MINOR");
  const [newConditionImpact, setNewConditionImpact] = useState("COSMETIC_ONLY");
  const [newConditionNotes, setNewConditionNotes] = useState("");
  const [newConditionFile, setNewConditionFile] = useState<File | null>(null);
  const [createdConditionCount, setCreatedConditionCount] = useState(0);
  const [capturedEvidenceCount, setCapturedEvidenceCount] = useState(0);
  const [refreshRetryNonce, setRefreshRetryNonce] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const [renderedAt, setRenderedAt] = useState<string>("");
  const lastRefreshedLoadIdRef = useRef<string | null>(null);
  const initialRefreshInFlightRef = useRef<string | null>(null);
  const initialRefreshRetryRef = useRef<Record<string, number>>({});
  const refreshRequestSequenceRef = useRef(0);
  const currentLoadIdRef = useRef<string | null>(null);

  function asRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return {};
  }

  function getResultConditionThreadId(value: unknown) {
    const record = asRecord(value);
    if (typeof record.id === "string") return record.id;
    const thread = asRecord(record.thread);
    if (typeof thread.id === "string") return thread.id;
    return null;
  }

  function getResultConditionEventId(value: unknown) {
    const record = asRecord(value);
    const event = asRecord(record.event);
    if (typeof event.id === "string") return event.id;
    return null;
  }

  useEffect(() => {
    if (!fleetId) return;
    let cancelled = false;
    async function run() {
      try {
        const nextLoads = await requestJson<DispatchLoadRecord[]>(`/api/dispatch/fleet/${fleetId}/loads`);
        if (!cancelled) setLoads(nextLoads);
      } catch (nextError) {
        if (!cancelled) setError(getErrorMessage(nextError));
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [fleetId]);

  const refreshWorkflow = useCallback(async (targetLoadId: string) => {
    const requestSequence = refreshRequestSequenceRef.current + 1;
    refreshRequestSequenceRef.current = requestSequence;
    setLoading(true);
    try {
      const [nextLoad, nextWorkflow] = await Promise.all([
        requestJson<DispatchLoadRecord>(`/api/dispatch/load/${targetLoadId}`),
        fetchLoadWorkflowSnapshot(targetLoadId),
      ]);
      if (refreshRequestSequenceRef.current !== requestSequence) {
        return false;
      }
      setLoad(nextLoad);
      setWorkflow(nextWorkflow);
      currentLoadIdRef.current = nextLoad.id;
      if (nextWorkflow.assignment) {
        try {
          const nextBaseline = await fetchPreTripConditionBaseline(nextWorkflow.assignment.id);
          if (refreshRequestSequenceRef.current !== requestSequence) {
            return false;
          }
          setConditionBaseline(nextBaseline);
          setNewConditionEquipmentId((previous) => previous || nextWorkflow.assignment!.tractorEquipmentId);
        } catch (baselineError) {
          if (refreshRequestSequenceRef.current !== requestSequence) {
            return false;
          }
          setConditionBaseline(null);
          setActionError(getErrorMessage(baselineError));
        }
      } else {
        setConditionBaseline(null);
      }
      setError(null);
      return true;
    } catch (nextError) {
      if (refreshRequestSequenceRef.current !== requestSequence) {
        return false;
      }
      if (currentLoadIdRef.current !== targetLoadId) {
        setLoad(null);
        setWorkflow(null);
        setConditionBaseline(null);
      }
      setError(getErrorMessage(nextError));
      return false;
    } finally {
      if (refreshRequestSequenceRef.current === requestSequence) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (lastRefreshedLoadIdRef.current === loadId || initialRefreshInFlightRef.current === loadId) {
      return;
    }
    initialRefreshInFlightRef.current = loadId;
    void refreshWorkflow(loadId)
      .then((succeeded) => {
        if (succeeded) {
          lastRefreshedLoadIdRef.current = loadId;
          initialRefreshRetryRef.current[loadId] = 0;
          return;
        }
        const retries = initialRefreshRetryRef.current[loadId] ?? 0;
        if (retries < 2) {
          initialRefreshRetryRef.current[loadId] = retries + 1;
          window.setTimeout(() => {
            if (lastRefreshedLoadIdRef.current !== loadId) {
              setRefreshRetryNonce((previous) => previous + 1);
            }
          }, 300);
        }
      })
      .finally(() => {
        if (initialRefreshInFlightRef.current === loadId) {
          initialRefreshInFlightRef.current = null;
        }
      });
  }, [loadId, refreshWorkflow, refreshRetryNonce]);

  useEffect(() => {
    setIsHydrated(true);
    setRenderedAt(new Date().toLocaleString());
  }, []);

  useEffect(() => {
    lastRefreshedLoadIdRef.current = null;
    initialRefreshInFlightRef.current = null;
    initialRefreshRetryRef.current = {};
  }, [loadId, fleetId]);

  const itemStates = useMemo(() => {
    const existingItems = new Map((workflow?.preTrip?.items ?? []).map((item) => [item.itemCode, item]));
    return PRETRIP_ITEM_CATALOG.map((definition) => ({
      ...definition,
      item: existingItems.get(definition.itemCode) ?? null,
      defect: workflow?.preTrip?.defects.find((defect) => defect.itemCode === definition.itemCode) ?? null,
    }));
  }, [workflow?.preTrip]);

  const sections = useMemo(() => {
    return Object.entries(
      itemStates.reduce<Record<string, typeof itemStates>>((accumulator, itemState) => {
        const bucket = accumulator[itemState.sectionCode] ?? [];
        bucket.push(itemState);
        accumulator[itemState.sectionCode] = bucket;
        return accumulator;
      }, {}),
    );
  }, [itemStates]);

  const readinessReasons = getJsonStringArray(workflow?.readiness?.reasonCodes);

  const conditionRows = useMemo(() => {
    if (!conditionBaseline) {
      return [] as Array<ConditionBaselineCondition & { equipmentKind: "TRACTOR" | "TRAILER"; equipmentId: string; unitNumber: string }>;
    }
    return conditionBaseline.equipments.flatMap((equipment) =>
      equipment.conditions.map((condition) => ({
        ...condition,
        equipmentKind: equipment.kind,
        equipmentId: equipment.equipmentId,
        unitNumber: equipment.unitNumber,
      })),
    );
  }, [conditionBaseline]);

  useEffect(() => {
    if (activeConditionIndex > Math.max(conditionRows.length - 1, 0)) {
      setActiveConditionIndex(0);
    }
  }, [activeConditionIndex, conditionRows.length]);

  useEffect(() => {
    if (activeChecklistIndex > Math.max(itemStates.length - 1, 0)) {
      setActiveChecklistIndex(0);
    }
  }, [activeChecklistIndex, itemStates.length]);

  const burdenStats = useMemo(() => {
    const totalItemsShown = PRETRIP_ITEM_CATALOG.length;
    const itemsRequiringAction = itemStates.filter((entry) => {
      const status = entry.item?.status ?? "PENDING";
      return status !== "PASS" && status !== "NOT_APPLICABLE";
    }).length;
    const historyAutoPopulated = conditionRows.length;
    const evidenceRequired = conditionRows.filter((condition) =>
      ["AWAITING_VERIFICATION", "CHANGED", "REOPENED"].includes(condition.lifecycleState) ||
      condition.evidenceCompleteness === "INSUFFICIENT" ||
      condition.evidenceCompleteness === "PARTIAL",
    ).length;
    return { totalItemsShown, itemsRequiringAction, historyAutoPopulated, evidenceRequired };
  }, [conditionRows, itemStates]);

  const progress = useMemo(() => {
    const completed = itemStates.filter((entry) => (entry.item?.status ?? "PENDING") !== "PENDING").length;
    const total = itemStates.length;
    return { completed, total, remaining: Math.max(total - completed, 0) };
  }, [itemStates]);

  const activeCondition = conditionRows[activeConditionIndex] ?? null;
  const activeChecklistItem = itemStates[activeChecklistIndex] ?? null;
  const saving = actionLoading || Boolean(conditionActionLoadingId);

  const conditionActionSummary = useMemo(() => {
    const values = Object.values(conditionResults);
    const noChange = values.filter((value) => value === "NO_CHANGE").length;
    const changed = values.filter((value) => value === "CHANGED").length;
    const repaired = values.filter((value) => value === "REPAIRED_REMOVED").length;
    const unsure = values.filter((value) => value === "UNSURE").length;
    return { noChange, changed, repaired, unsure };
  }, [conditionResults]);

  async function handleStartPreTrip() {
    if (!workflow?.assignment) return;
    setActionLoading(true);
    setActionError(null);
    setActionMessage(null);
    try {
      await requestJson<DispatchPreTripRecord>(`/api/dispatch/pretrip/${workflow.assignment.id}/start`, { method: "POST" });
      await refreshWorkflow(loadId);
      setActionMessage("Pre-trip started.");
    } catch (nextError) {
      setActionError(getErrorMessage(nextError));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleItemUpdate(itemCode: string, status: (typeof ITEM_STATUSES)[number]) {
    if (!workflow?.preTrip?.id) return;
    setActionLoading(true);
    setActionError(null);
    setActionMessage(null);
    try {
      await requestJson<DispatchPreTripRecord>(`/api/dispatch/pretrip/${workflow.preTrip.id}/item`, {
        method: "PATCH",
        body: JSON.stringify({ itemCode, status }),
      });
      await refreshWorkflow(loadId);
      setActionMessage(`${formatEnumLabel(itemCode)} updated to ${formatEnumLabel(status)}.`);
    } catch (nextError) {
      setActionError(getErrorMessage(nextError));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleConditionAction(conditionThreadId: string, action: ConditionAction) {
    if (!workflow?.assignment) return;

    const file = conditionFiles[conditionThreadId];
    if ((action === "CHANGED" || action === "REPAIRED_REMOVED") && !file) {
      setActionError("A current photo is required for Changed or Repaired/Removed.");
      return;
    }

    setConditionActionLoadingId(conditionThreadId);
    setActionError(null);
    setActionMessage(null);

    try {
      const note = [conditionChangeReasons[conditionThreadId], conditionNotes[conditionThreadId]]
        .filter((value) => typeof value === "string" && value.trim().length > 0)
        .join(" - ");

      const result = await applyPreTripConditionAction({
        assignmentId: workflow.assignment.id,
        conditionThreadId,
        action,
        notes: note || undefined,
        preTripHeaderId: workflow.preTrip?.id ?? undefined,
        preTripItemCode: "maint-report",
      });

      if (file && (action === "CHANGED" || action === "REPAIRED_REMOVED")) {
        await uploadPreTripConditionEvidence({
          assignmentId: workflow.assignment.id,
          conditionThreadId,
          conditionEventId: getResultConditionEventId(result) ?? undefined,
          equipmentId: conditionRows.find((row) => row.conditionThreadId === conditionThreadId)?.equipmentId,
          preTripHeaderId: workflow.preTrip?.id ?? undefined,
          notes: note || undefined,
          file,
          evidenceKind: "PHOTO",
          observationSource: "DRIVER",
        });
        setCapturedEvidenceCount((previous) => previous + 1);
      }

      setConditionResults((previous) => ({ ...previous, [conditionThreadId]: action }));
      setConditionFiles((previous) => ({ ...previous, [conditionThreadId]: null }));
      await refreshWorkflow(loadId);

      if (action === "NO_CHANGE") {
        setActionMessage("Confirmed. No change reported.");
      } else if (action === "REPAIRED_REMOVED") {
        setActionMessage("Repair/removed reported. BOF will verify using current evidence.");
      } else if (action === "CHANGED") {
        setActionMessage("Changed condition recorded with targeted evidence.");
      } else {
        setActionMessage("This item needs review.");
      }
    } catch (nextError) {
      setActionError(getErrorMessage(nextError));
    } finally {
      setConditionActionLoadingId(null);
    }
  }

  async function handleCreateCondition() {
    if (!workflow?.assignment || !newConditionTitle.trim() || !newConditionEquipmentId.trim()) return;
    if (!newConditionFile) {
      setActionError("A photo is required when reporting a new condition.");
      return;
    }

    setActionLoading(true);
    setActionError(null);
    setActionMessage(null);

    try {
      const composedTitle = `${newConditionLocation}: ${newConditionTitle.trim()}`;
      const created = await createPreTripCondition({
        assignmentId: workflow.assignment.id,
        equipmentId: newConditionEquipmentId,
        title: composedTitle,
        category: newConditionCategory,
        severity: newConditionSeverity,
        impact: newConditionImpact,
        notes: newConditionNotes.trim() || undefined,
        preTripHeaderId: workflow.preTrip?.id ?? undefined,
      });

      const createdThreadId = getResultConditionThreadId(created);
      const createdEventId = getResultConditionEventId(created);
      if (createdThreadId) {
        await uploadPreTripConditionEvidence({
          assignmentId: workflow.assignment.id,
          conditionThreadId: createdThreadId,
          conditionEventId: createdEventId ?? undefined,
          equipmentId: newConditionEquipmentId,
          preTripHeaderId: workflow.preTrip?.id ?? undefined,
          notes: newConditionNotes.trim() || undefined,
          file: newConditionFile,
          evidenceKind: "PHOTO",
          observationSource: "DRIVER",
        });
        setCapturedEvidenceCount((previous) => previous + 1);
      }

      setCreatedConditionCount((previous) => previous + 1);
      setNewConditionTitle("");
      setNewConditionNotes("");
      setNewConditionFile(null);
      await refreshWorkflow(loadId);
      setActionMessage("New condition reported and evidence captured.");
    } catch (nextError) {
      setActionError(getErrorMessage(nextError));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleComplete() {
    if (!workflow?.preTrip?.id) return;
    setActionLoading(true);
    setActionError(null);
    setActionMessage(null);
    try {
      await requestJson<DispatchPreTripRecord>(`/api/dispatch/pretrip/${workflow.preTrip.id}/complete`, { method: "POST" });
      await refreshWorkflow(loadId);
      setActionMessage("Pre-trip submitted.");
    } catch (nextError) {
      setActionError(getErrorMessage(nextError));
    } finally {
      setActionLoading(false);
    }
  }

  const friendlyError = error ?? actionError;

  return (
    <div className="bof-tablet-shell">
      {!fleetId ? (
        <div className="rounded-xl border border-amber-700/40 bg-amber-950/20 p-5 text-sm text-amber-50">
          No accessible fleet context is available for this session.
        </div>
      ) : null}

      <section className="mb-4 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-teal-300">Pre-trip load selector</p>
            <h2 className="mt-1 text-lg font-black text-white">Choose active load</h2>
          </div>
          <Link
            href="/dispatch"
            className="inline-flex min-h-11 items-center rounded-md border border-teal-500/60 bg-teal-500/10 px-4 py-3 text-sm font-bold text-teal-100 hover:bg-teal-500/20"
          >
            Back to dispatch board
          </Link>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {loads.map((option) => {
            const active = option.id === loadId;
            return (
              <Link
                key={option.id}
                href={`/pretrip/${option.id}`}
                className={[
                  "rounded-lg border p-3 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300",
                  active ? "border-teal-300 bg-teal-500/10" : "border-slate-800 bg-slate-900/60 hover:border-teal-300 hover:bg-teal-500/10",
                ].join(" ")}
                aria-current={active ? "page" : undefined}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-black text-teal-200">{option.id}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${statusTone(option.status, "release")}`}>
                    {formatEnumLabel(option.status)}
                  </span>
                </div>
                <p className="mt-2 text-sm font-bold text-white">{option.customerName}</p>
                <p className="mt-1 truncate text-xs text-slate-400">{option.origin} to {option.destination}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mb-4 rounded-xl border border-cyan-700/40 bg-cyan-950/15 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-cyan-200">Pre-trip start</p>
        <h1 className="mt-1 text-xl font-black text-white">Mobile pre-trip</h1>
        <p className="mt-2 text-sm text-cyan-100">BOF has loaded your previous equipment conditions.</p>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-200">
            Driver: <strong>{workflow?.assignment?.driver ? `${workflow.assignment.driver.firstName} ${workflow.assignment.driver.lastName}` : workflow?.assignment?.driverId ?? "—"}</strong>
          </div>
          <div className="rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-200">
            Fleet context: <strong>{workflow?.assignment?.fleetId ?? fleetId ?? "—"}</strong>
          </div>
          <div className="rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-200">
            Truck: <strong>{workflow?.assignment?.tractorEquipment?.unitNumber ?? workflow?.assignment?.tractorEquipmentId ?? "—"}</strong>
          </div>
          <div className="rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-200">
            Trailer: <strong>{workflow?.assignment?.trailerEquipment?.unitNumber ?? workflow?.assignment?.trailerEquipmentId ?? "None"}</strong>
          </div>
          <div className="rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-200">
            Load: <strong>{load?.id ?? loadId}</strong>
          </div>
          <div className="rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-200">
            Date/time: <strong>{renderedAt || "—"}</strong>
          </div>
          <div className="rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-slate-200 sm:col-span-2">
            Pre-trip status: <strong>{!isHydrated ? "Loading assignment" : workflow?.preTrip ? formatEnumLabel(workflow.preTrip.status) : workflow?.assignment ? "Not started" : "Loading assignment"}</strong>
          </div>
        </div>
        <div className="mt-3 text-xs text-slate-300">
          Sync status: {saving ? "Saving..." : friendlyError ? "Not saved - resolve errors below" : "All changes saved"}
        </div>
      </section>

      {friendlyError ? (
        <p className="mb-4 rounded-lg border border-rose-700/50 bg-rose-950/30 px-3 py-2 text-sm text-rose-100">{friendlyError}</p>
      ) : null}
      {actionMessage ? (
        <p className="mb-4 rounded-lg border border-emerald-700/50 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-100">{actionMessage}</p>
      ) : null}
      {loading ? <p className="mb-4 text-sm text-slate-300">Loading authoritative workflow state...</p> : null}

      {isHydrated && workflow && !friendlyError && workflow.assignment === null ? (
        <section className="mb-4 rounded-xl border border-amber-700/40 bg-amber-950/20 p-4 text-sm text-amber-100">
          No active assignment is available for this load. Driver pre-trip cannot continue until assignment is available.
        </section>
      ) : null}

      {!workflow?.preTrip && workflow?.assignment ? (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => void handleStartPreTrip()}
            disabled={actionLoading}
            className="min-h-11 w-full rounded-lg border border-teal-500/70 bg-teal-900/30 px-4 py-3 text-base font-bold text-teal-100 disabled:opacity-40"
          >
            Start pre-trip
          </button>
        </div>
      ) : null}

      <section className="mb-4 rounded-xl border border-slate-800 bg-slate-900/55 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-white">Inspection progress</h2>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-bold text-slate-200">
            {progress.completed} of {progress.total} complete
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-400">{progress.remaining} remaining</p>
      </section>

      <section className="mb-4 rounded-xl border border-slate-800 bg-slate-900/55 p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Known condition</p>
            <h2 className="text-lg font-bold text-white">Has this condition changed?</h2>
          </div>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-bold text-slate-200">
            {conditionRows.length === 0 ? "0 of 0" : `${activeConditionIndex + 1} of ${conditionRows.length}`}
          </span>
        </div>

        {activeCondition ? (
          <article className="mt-3 rounded-lg border border-slate-800 bg-slate-950/65 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {activeCondition.equipmentKind} {activeCondition.unitNumber}
            </p>
            <h3 className="mt-1 text-lg font-black text-white">{activeCondition.title}</h3>
            <p className="mt-2 text-sm text-slate-300">
              First reported: {formatDateTime(activeCondition.firstIdentifiedAt)} | Last confirmed: {formatDateTime(activeCondition.lastConfirmedAt)} | Status: {formatEnumLabel(activeCondition.lifecycleState)}
            </p>
            <p className="mt-2 text-sm text-slate-100">Has this condition changed?</p>
            <p className="mt-1 text-xs text-slate-400">{activeCondition.evidencePrompt}</p>
            {activeCondition.latestEvidence ? (
              <p className="mt-1 text-xs text-slate-400">
                Previous evidence: {activeCondition.latestEvidence.originalFileName} ({formatDateTime(activeCondition.latestEvidence.capturedAt)})
              </p>
            ) : null}

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={conditionActionLoadingId === activeCondition.conditionThreadId}
                onClick={() => void handleConditionAction(activeCondition.conditionThreadId, "NO_CHANGE")}
                className="min-h-11 rounded-lg border border-emerald-700/60 bg-emerald-950/35 px-3 py-3 text-sm font-black text-emerald-100 disabled:opacity-40"
              >
                NO CHANGE
              </button>
              <button
                type="button"
                disabled={conditionActionLoadingId === activeCondition.conditionThreadId}
                onClick={() => void handleConditionAction(activeCondition.conditionThreadId, "REPAIRED_REMOVED")}
                className="min-h-11 rounded-lg border border-cyan-700/60 bg-cyan-950/35 px-3 py-3 text-sm font-black text-cyan-100 disabled:opacity-40"
              >
                REPAIRED / REMOVED
              </button>
              <button
                type="button"
                disabled={conditionActionLoadingId === activeCondition.conditionThreadId}
                onClick={() => void handleConditionAction(activeCondition.conditionThreadId, "CHANGED")}
                className="min-h-11 rounded-lg border border-amber-700/60 bg-amber-950/35 px-3 py-3 text-sm font-black text-amber-100 disabled:opacity-40"
              >
                CHANGED
              </button>
              <button
                type="button"
                disabled={conditionActionLoadingId === activeCondition.conditionThreadId}
                onClick={() => void handleConditionAction(activeCondition.conditionThreadId, "UNSURE")}
                className="min-h-11 rounded-lg border border-rose-700/60 bg-rose-950/35 px-3 py-3 text-sm font-black text-rose-100 disabled:opacity-40"
              >
                UNSURE
              </button>
            </div>

            <div className="mt-3 grid gap-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                What changed? (optional quick pick)
                <select
                  value={conditionChangeReasons[activeCondition.conditionThreadId] ?? ""}
                  onChange={(event) =>
                    setConditionChangeReasons((previous) => ({
                      ...previous,
                      [activeCondition.conditionThreadId]: event.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                >
                  <option value="">Select if changed</option>
                  {CHANGE_REASON_OPTIONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Driver note (optional)
                <textarea
                  value={conditionNotes[activeCondition.conditionThreadId] ?? ""}
                  onChange={(event) =>
                    setConditionNotes((previous) => ({
                      ...previous,
                      [activeCondition.conditionThreadId]: event.target.value,
                    }))
                  }
                  rows={2}
                  className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  placeholder="Add only what is necessary"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                TAKE PHOTO (required for Changed or Repaired/Removed)
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,application/pdf"
                  capture="environment"
                  onChange={(event) =>
                    setConditionFiles((previous) => ({
                      ...previous,
                      [activeCondition.conditionThreadId]: event.target.files?.[0] ?? null,
                    }))
                  }
                  className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-200"
                />
              </label>
              <ul className="list-disc pl-5 text-xs text-slate-400">
                <li>Move closer</li>
                <li>Capture the whole area</li>
                <li>Ensure the condition is visible</li>
                <li>Avoid glare and keep the image steady</li>
              </ul>
            </div>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setActiveConditionIndex((previous) => Math.max(previous - 1, 0))}
                disabled={activeConditionIndex === 0}
                className="min-h-11 rounded-md border border-slate-700 px-3 py-3 text-xs font-bold text-slate-200 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => setActiveConditionIndex((previous) => Math.min(previous + 1, conditionRows.length - 1))}
                disabled={activeConditionIndex >= conditionRows.length - 1}
                className="min-h-11 rounded-md border border-slate-700 px-3 py-3 text-xs font-bold text-slate-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </article>
        ) : (
          <p className="mt-3 text-sm text-slate-300">No open historical conditions are tied to current assignment equipment.</p>
        )}
      </section>

      <section className="mb-4 rounded-xl border border-slate-800 bg-slate-900/55 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Report new condition</p>
        <h2 className="mt-1 text-lg font-bold text-white">REPORT NEW CONDITION</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Equipment
            <select
              value={newConditionEquipmentId}
              onChange={(event) => setNewConditionEquipmentId(event.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100"
            >
              {workflow?.assignment ? (
                <>
                  <option value={workflow.assignment.tractorEquipmentId}>
                    Tractor {workflow.assignment.tractorEquipment?.unitNumber ?? workflow.assignment.tractorEquipmentId}
                  </option>
                  {workflow.assignment.trailerEquipmentId ? (
                    <option value={workflow.assignment.trailerEquipmentId}>
                      Trailer {workflow.assignment.trailerEquipment?.unitNumber ?? workflow.assignment.trailerEquipmentId}
                    </option>
                  ) : null}
                </>
              ) : (
                <option value="">No active assignment</option>
              )}
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Location
            <select
              value={newConditionLocation}
              onChange={(event) => setNewConditionLocation(event.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100"
            >
              {LOCATION_OPTIONS.map((location) => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 md:col-span-2">
            Brief description
            <input
              value={newConditionTitle}
              onChange={(event) => setNewConditionTitle(event.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100"
              placeholder="Describe what you found"
            />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Category
            <select
              value={newConditionCategory}
              onChange={(event) => setNewConditionCategory(event.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100"
            >
              {NEW_CONDITION_CATEGORY_OPTIONS.map((option) => (
                <option key={`${option.label}-${option.value}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Severity
            <select
              value={newConditionSeverity}
              onChange={(event) => setNewConditionSeverity(event.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100"
            >
              {["MINOR", "MODERATE", "MAJOR", "CRITICAL"].map((value) => (
                <option key={value} value={value}>{formatEnumLabel(value)}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Impact
            <select
              value={newConditionImpact}
              onChange={(event) => setNewConditionImpact(event.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100"
            >
              {["COSMETIC_ONLY", "MONITOR", "REQUIRES_REPAIR", "SAFETY_CRITICAL", "OUT_OF_SERVICE_RISK"].map((value) => (
                <option key={value} value={value}>{formatEnumLabel(value)}</option>
              ))}
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            TAKE PHOTO
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,application/pdf"
              capture="environment"
              onChange={(event) => setNewConditionFile(event.target.files?.[0] ?? null)}
              className="mt-1 block w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-100"
            />
          </label>
        </div>
        <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Notes (optional)
          <textarea
            value={newConditionNotes}
            onChange={(event) => setNewConditionNotes(event.target.value)}
            rows={2}
            className="mt-1 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            placeholder="Only include what helps review"
          />
        </label>
        <button
          type="button"
          onClick={() => void handleCreateCondition()}
          disabled={actionLoading || !workflow?.assignment}
          className="mt-3 min-h-11 w-full rounded-lg border border-teal-600 bg-teal-900/30 px-4 py-3 text-sm font-bold text-teal-100 disabled:opacity-40"
        >
          REPORT NEW CONDITION
        </button>
      </section>

      <section className="mb-4 rounded-xl border border-slate-800 bg-slate-900/55 p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-white">Current inspection item</h2>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-bold text-slate-200">
            {activeChecklistItem ? `${activeChecklistIndex + 1} of ${itemStates.length}` : "No items"}
          </span>
        </div>
        {activeChecklistItem ? (
          <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/65 p-4">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {PRETRIP_SECTION_LABELS[activeChecklistItem.sectionCode] ?? formatEnumLabel(activeChecklistItem.sectionCode)}
            </p>
            <h3 className="mt-1 text-lg font-bold text-white">{activeChecklistItem.label}</h3>
            <p className="mt-1 text-sm text-slate-300">
              Status: {formatEnumLabel(activeChecklistItem.item?.status ?? "PENDING")}
              {activeChecklistItem.isCritical ? " | Critical item" : ""}
            </p>
            {activeChecklistItem.itemCode === "fuel-check" ? (
              <p className="mt-2 text-xs text-slate-400">
                Fuel telemetry integration is not active here; complete visual fuel confirmation through this required item.
              </p>
            ) : null}
            {["pretrip-cargo", "seal-verify", "trailer-condition"].includes(activeChecklistItem.itemCode) ? (
              <p className="mt-2 text-xs text-slate-400">
                Cargo/trailer checks remain tied to the authoritative current assignment and load.
              </p>
            ) : null}
            <p className="mt-2 text-xs text-slate-400">
              {activeChecklistItem.item?.notes ?? activeChecklistItem.defect?.description ?? "No inspection note recorded yet."}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ITEM_STATUSES.map((status) => {
                const currentStatus = activeChecklistItem.item?.status ?? "PENDING";
                return (
                  <button
                    key={status}
                    type="button"
                    disabled={actionLoading}
                    onClick={() => void handleItemUpdate(activeChecklistItem.itemCode, status)}
                    className={[
                      "min-h-11 rounded-md border px-3 py-3 text-xs font-black",
                      currentStatus === status
                        ? "border-teal-500 bg-teal-950/40 text-teal-50"
                        : "border-slate-700 bg-slate-950 text-slate-300",
                    ].join(" ")}
                  >
                    {formatEnumLabel(status)}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setActiveChecklistIndex((previous) => Math.max(previous - 1, 0))}
                disabled={activeChecklistIndex === 0}
                className="min-h-11 rounded-md border border-slate-700 px-3 py-3 text-xs font-bold text-slate-200 disabled:opacity-40"
              >
                Previous item
              </button>
              <button
                type="button"
                onClick={() => setActiveChecklistIndex((previous) => Math.min(previous + 1, itemStates.length - 1))}
                disabled={activeChecklistIndex >= itemStates.length - 1}
                className="min-h-11 rounded-md border border-slate-700 px-3 py-3 text-xs font-bold text-slate-200 disabled:opacity-40"
              >
                Next item
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-300">No checklist items are available.</p>
        )}
      </section>

      <details className="mb-4 rounded-xl border border-slate-800 bg-slate-900/55 p-4">
        <summary className="block min-h-11 cursor-pointer rounded-md border border-slate-700 px-3 py-3 text-sm font-bold text-slate-100">
          Show full required Step 11 inspection list
        </summary>
        <div className="mt-3 space-y-3">
          {sections.map(([sectionCode, items]) => (
            <div key={sectionCode} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
              <h3 className="text-sm font-bold text-white">{PRETRIP_SECTION_LABELS[sectionCode] ?? formatEnumLabel(sectionCode)}</h3>
              <ul className="mt-2 space-y-2">
                {items.map((entry) => (
                  <li key={entry.itemCode} className="text-xs text-slate-300">
                    <span className="font-semibold text-slate-100">{entry.label}</span> - {formatEnumLabel(entry.item?.status ?? "PENDING")}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </details>

      <section className="mb-4 rounded-xl border border-amber-700/40 bg-amber-950/20 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-amber-200">Attention required</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-100">
          <li>New conditions reported: {createdConditionCount}</li>
          <li>Changed conditions: {conditionActionSummary.changed}</li>
          <li>Repaired/removed pending verification: {conditionActionSummary.repaired}</li>
          <li>Items needing review (UNSURE): {conditionActionSummary.unsure}</li>
          <li>Evidence still required from known history: {burdenStats.evidenceRequired}</li>
          <li>Recorded defects: {workflow?.preTrip?.defects.length ?? 0}</li>
        </ul>
      </section>

      <section className="mb-4 rounded-xl border border-slate-800 bg-slate-900/55 p-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Future hooks</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <button type="button" disabled className="min-h-11 rounded-md border border-slate-700 px-3 py-3 text-sm font-bold text-slate-300 opacity-70">
            Need help? (coming soon)
          </button>
          <button type="button" disabled className="min-h-11 rounded-md border border-slate-700 px-3 py-3 text-sm font-bold text-slate-300 opacity-70">
            Contact dispatch (coming soon)
          </button>
        </div>
      </section>

      <div className="mb-4 flex flex-wrap gap-2">
        {workflow?.preTrip ? (
          <button
            type="button"
            onClick={() => void handleComplete()}
            disabled={actionLoading || workflow.preTrip.status === "COMPLETED"}
            className="min-h-11 rounded-md border border-teal-600 bg-teal-900/20 px-4 py-3 text-sm font-bold text-teal-100 hover:bg-teal-900/40 disabled:opacity-40"
          >
            Submit pre-trip
          </button>
        ) : null}
        {workflow?.assignment ? (
          <Link
            href={`/trip-release/${loadId}`}
            className="inline-flex min-h-11 items-center rounded-md border border-slate-700 px-4 py-3 text-sm font-bold text-slate-200 hover:bg-slate-900"
          >
            Open release workflow
          </Link>
        ) : null}
      </div>

      {workflow?.preTrip?.status === "COMPLETED" ? (
        <section className="rounded-xl border border-emerald-700/50 bg-emerald-950/25 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-200">PRE-TRIP SUBMITTED</p>
          <h2 className="mt-1 text-lg font-black text-emerald-50">Driver portion complete</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-emerald-100">
            <li>Confirmed no change: {conditionActionSummary.noChange}</li>
            <li>New conditions: {createdConditionCount}</li>
            <li>Changed conditions: {conditionActionSummary.changed}</li>
            <li>Evidence captured this session: {capturedEvidenceCount}</li>
            <li>Items requiring review: {conditionActionSummary.unsure + (workflow.preTrip.defects.length > 0 ? 1 : 0)}</li>
          </ul>
          <p className="mt-2 text-xs text-emerald-200">
            Dispatch handoff continues through the existing authoritative release workflow.
          </p>
        </section>
      ) : null}

      <section className="mt-4 rounded-xl border border-slate-800 bg-slate-900/55 p-4 text-xs text-slate-400">
        <p>
          Readiness status: {workflow?.readiness?.summary ?? workflow?.readinessError ?? "Unavailable"}.
          {workflow?.readiness ? ` Evaluated ${formatShortDateTime(workflow.readiness.evaluatedAt)}.` : ""}
        </p>
        {readinessReasons.length > 0 ? <p className="mt-1">Reason codes: {readinessReasons.join(", ")}</p> : null}
      </section>
    </div>
  );
}
