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
  requestJson,
  statusTone,
  type DispatchLoadRecord,
  type DispatchLoadWorkflowSnapshot,
} from "@/lib/dispatch-workflow-ui";
import { LoadFileCopilotAdvocatePanel } from "@/components/copilot/LoadFileCopilotAdvocatePanel";
import { SambaIntelligencePanel } from "@/components/operations/SambaIntelligencePanel";
import { buildLiveLoadReview } from "@/lib/live-load-review";
import { LoadDeliveryScreen } from "@/components/dispatch/LoadDeliveryScreen";
import { useEpodEnabled } from "@/components/dispatch/EpodAvailability";
import { LoadPickupAuthorizationLinks } from "@/components/dispatch/LoadPickupAuthorizationLinks";
import { useDispatchDashboardStore } from "@/lib/stores/dispatch-dashboard-store";
import { existingSettlementWorkflowHref } from "@/lib/load-file-proof-settlement-display";
import { DocumentationReadinessPanel } from "./DocumentationReadinessPanel";
import { ExistingDocumentNavAnchor } from "@/components/ExistingDocumentNavAnchor";

function ProofRejectHoldForm({ loadId }: { loadId: string }) {
  const [proofs, setProofs] = useState<Array<{ id: string; status: string; proofType: string }>>([]);
  const [proofId, setProofId] = useState("");
  const [reason, setReason] = useState("Proof rejected by operator review");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const receivable = proofs.filter((proof) => proof.status === "RECEIVED");

  useEffect(() => {
    let cancelled = false;
    requestJson<{ proofs: Array<{ id: string; status: string; proofType: string }> }>(
      `/api/dispatch/load/${encodeURIComponent(loadId)}/proof/verify`,
    )
      .then((body) => {
        if (!cancelled) setProofs(body.proofs ?? []);
      })
      .catch((error: unknown) => {
        if (!cancelled) setMessage(getErrorMessage(error));
      });
    return () => {
      cancelled = true;
    };
  }, [loadId]);

  return (
    <form
      className="mt-4 space-y-2 rounded border border-amber-500/30 bg-amber-950/20 p-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setMessage(null);
        try {
          if (!proofId) {
            setMessage("Proof is required.");
            return;
          }
          const trimmed = reason.trim();
          if (!trimmed) {
            setMessage("A rejection reason is required.");
            return;
          }
          await requestJson(`/api/dispatch/load/${encodeURIComponent(loadId)}/proof/reject`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ proofId, reason: trimmed }),
          });
          setMessage("LIVE proof rejected and settlement held.");
        } catch (error) {
          setMessage(getErrorMessage(error));
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">LIVE proof → settlement hold</p>
      <p className="text-[11px] text-slate-400">
        Rejects the selected received proof and holds settlement. A verified proof stays verified.
      </p>
      {receivable.length === 0 ? (
        <p className="text-xs text-slate-400">No received proof is available to reject.</p>
      ) : (
        <select
          className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
          value={proofId}
          onChange={(event) => setProofId(event.target.value)}
        >
          <option value="">Select a received proof</option>
          {receivable.map((proof) => (
            <option key={proof.id} value={proof.id}>
              {proof.proofType} · {proof.status}
            </option>
          ))}
        </select>
      )}
      <textarea
        className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        rows={2}
      />
      <button
        type="submit"
        disabled={busy || receivable.length === 0}
        className="rounded border border-amber-400/50 px-3 py-1.5 text-xs text-amber-50 hover:bg-amber-900/40 disabled:opacity-50"
      >
        {busy ? "Saving…" : "Reject proof and hold settlement"}
      </button>
      {message ? <p className="text-xs text-slate-200">{message}</p> : null}
    </form>
  );
}

function ProofVerifyForm({ loadId }: { loadId: string }) {
  const [proofs, setProofs] = useState<Array<{ id: string; status: string; proofType: string }>>([]);
  const [proofType, setProofType] = useState("POD");
  const [evidenceId, setEvidenceId] = useState("");
  const [proofId, setProofId] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    requestJson<{ proofs: Array<{ id: string; status: string; proofType: string }> }>(
      `/api/dispatch/load/${encodeURIComponent(loadId)}/proof/verify`,
    )
      .then((body) => {
        if (!cancelled) setProofs(body.proofs ?? []);
      })
      .catch((error: unknown) => {
        if (!cancelled) setMessage(getErrorMessage(error));
      });
    return () => {
      cancelled = true;
    };
  }, [loadId]);

  const verifiable = proofs.filter((proof) => proof.status !== "REJECTED");

  return (
    <div className="mt-4 space-y-3">
      <form
        className="space-y-2 rounded border border-slate-700 bg-slate-950/40 p-3"
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setMessage(null);
          try {
            const reference = evidenceId.trim();
            if (!reference) {
              setMessage("Evidence reference is required.");
              return;
            }
            const created = await requestJson<{
              proof: { id: string; status: string; proofType: string };
              duplicate: boolean;
            }>(`/api/dispatch/load/${encodeURIComponent(loadId)}/proof`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ proofType, evidenceId: reference }),
            });
            setProofs((current) =>
              current.some((proof) => proof.id === created.proof.id) ? current : [...current, created.proof],
            );
            setMessage(
              created.duplicate
                ? "That proof is already stored for this load."
                : "Proof received. It is not verified.",
            );
          } catch (error) {
            setMessage(getErrorMessage(error));
          } finally {
            setBusy(false);
          }
        }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-200">Submit delivery proof</p>
        <p className="text-[11px] text-slate-400">
          Records a received proof only when this load already has stored operational evidence. It does not upload a file, accept a web address, or mark the proof verified.
        </p>
        <input
          className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
          value={evidenceId}
          onChange={(event) => setEvidenceId(event.target.value)}
          placeholder="Operational evidence id"
          autoComplete="off"
        />
        <select
          className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
          value={proofType}
          onChange={(event) => setProofType(event.target.value)}
        >
          <option value="POD">POD</option>
          <option value="BOL">BOL</option>
          <option value="PHOTO">PHOTO</option>
          <option value="SIGNATURE">SIGNATURE</option>
          <option value="OTHER">OTHER</option>
        </select>
        <button
          type="submit"
          disabled={busy}
          className="rounded border border-slate-500 px-3 py-1.5 text-xs text-slate-100 hover:bg-slate-800 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Submit received proof"}
        </button>
      </form>
    <form
      className="mt-4 space-y-2 rounded border border-teal-500/30 bg-slate-950/40 p-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setMessage(null);
        try {
          if (!proofId) {
            setMessage("Proof is required.");
            return;
          }
          if (!confirm) {
            setMessage("Proof verification requires an explicit operator confirmation.");
            return;
          }
          await requestJson(`/api/dispatch/load/${encodeURIComponent(loadId)}/proof/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ proofId, confirm: true }),
          });
          setMessage("Stored proof verified. The settlement hold is unchanged.");
        } catch (error) {
          setMessage(getErrorMessage(error));
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-200">LIVE proof verification</p>
      <p className="text-[11px] text-slate-400">
        Verifies a stored proof and records POD verified. A settlement hold stays as stored.
      </p>
      {verifiable.length === 0 ? (
        <p className="text-xs text-slate-400">No stored proof is available to verify.</p>
      ) : (
        <select
          className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-100"
          value={proofId}
          onChange={(event) => setProofId(event.target.value)}
        >
          <option value="">Select a stored proof</option>
          {verifiable.map((proof) => (
            <option key={proof.id} value={proof.id}>
              {proof.proofType} · {proof.status}
            </option>
          ))}
        </select>
      )}
      <label className="flex items-center gap-2 text-xs text-slate-200">
        <input type="checkbox" checked={confirm} onChange={(event) => setConfirm(event.target.checked)} />
        I am verifying this stored proof.
      </label>
      <button
        type="submit"
        disabled={busy || verifiable.length === 0}
        className="rounded border border-teal-400/50 px-3 py-1.5 text-xs text-teal-50 hover:bg-teal-900/40 disabled:opacity-50"
      >
        {busy ? "Saving…" : "Verify stored proof"}
      </button>
      {message ? <p className="text-xs text-slate-200">{message}</p> : null}
    </form>
    </div>
  );
}

type Props = {
  load: DispatchLoadRecord;
  onClose?: () => void;
  onOpenAssignModal?: (loadId: string) => void;
  refreshKey?: number;
};

type DetailTab = "overview" | "assignment" | "delivery" | "proof" | "documents" | "exceptions" | "settlement";

const TABS: { id: DetailTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "assignment", label: "Assignment" },
  { id: "delivery", label: "Delivery" },
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
  const epodEnabled = useEpodEnabled();
  const visibleTabs = epodEnabled ? TABS : TABS.filter((item) => item.id !== "delivery");
  const [tab, setTab] = useState<DetailTab>("overview");
  const [workflow, setWorkflow] = useState<DispatchLoadWorkflowSnapshot | null>(null);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const boardLoad = useDispatchDashboardStore((s) =>
    s.loads.find((row) => row.load_id === load.id) ?? null
  );

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
  const liveReview = buildLiveLoadReview(load.id, workflow, workflowError);

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-800 px-5 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Load</p>
          <h2 className="text-lg font-semibold text-white">{load.id}</h2>
          <p className="text-sm text-slate-400">{load.customerName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/operational-chat?fleetId=${encodeURIComponent(load.fleetId)}&recordType=LOAD&recordId=${encodeURIComponent(load.id)}`}
            className="rounded border border-teal-600/70 px-2 py-1 text-xs font-semibold text-teal-100 hover:bg-teal-900/40"
          >
            Conversation
          </Link>
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

      <div className="shrink-0 border-b border-slate-800 px-5 py-3">
        <LoadFileCopilotAdvocatePanel loadId={load.id} variant={onClose ? "compact" : "full"} tone="command" />
      </div>

      <div className="shrink-0 border-b border-slate-800 px-5 pt-3">
        <nav className="flex gap-1 overflow-x-auto pb-2" aria-label="Load detail sections">
          {visibleTabs.map((item) => (
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

        {epodEnabled && tab === "delivery" ? <LoadDeliveryScreen loadId={load.id} /> : null}

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
            {epodEnabled ? (
              <>
                <ProofVerifyForm loadId={load.id} />
                <ProofRejectHoldForm loadId={load.id} />
              </>
            ) : (
              <p className="mt-4 text-sm text-slate-400">
                Electronic POD is disabled. Delivery evidence, proof submission, verification, and rejection are unavailable.
              </p>
            )}
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
            {boardLoad ? (
              <div className="mt-4">
                <DocumentationReadinessPanel load={boardLoad} />
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-400">
                No DEMO dispatch packet is mapped to {load.id}. Documentation hold was not invented.
              </p>
            )}
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
            <div className="mt-4 space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">Stored workflow review</h4>
              <p className="text-xs text-slate-500">
                Severity and next steps come from the stored readiness, release, and pre-trip records. This review does not resolve them.
              </p>
              {workflowLoading ? (
                <p className="text-sm text-slate-300">The stored workflow snapshot is still loading.</p>
              ) : liveReview.length === 0 ? (
                <p className="text-sm text-slate-300">No stored blocker is recorded on this snapshot.</p>
              ) : (
                liveReview.map((item) => (
                  <article key={item.id} className="rounded border border-slate-800 bg-slate-950/40 p-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-amber-200">
                      {item.severity} · {item.stage}
                    </p>
                    <p className="mt-2 text-sm text-white">{item.explanation}</p>
                    <p className="mt-1 text-xs text-slate-400">{item.recommendedAction}</p>
                    <p className="mt-1 text-xs text-slate-500">Recorded outcome: {item.recordedOutcome}</p>
                    <Link href={item.href} className="mt-2 inline-flex text-xs font-semibold text-teal-200 underline">
                      {item.hrefLabel}
                    </Link>
                  </article>
                ))
              )}
            </div>
          </section>
        ) : null}

        {tab === "settlement" ? (
          <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Link2 className="h-3.5 w-3.5 text-teal-500" />
              Settlement readiness
            </h3>
            <p className="text-sm text-slate-300">
              This opens the live settlement records and proof holds for this load. It does not open the training payroll workbook.
            </p>
            <ExistingDocumentNavAnchor
              href={existingSettlementWorkflowHref({
                driverId: boardLoad?.driver_id,
                loadId: load.id,
              })}
              className="mt-3 inline-flex rounded border border-teal-700 px-3 py-1.5 text-xs font-medium text-teal-100 hover:bg-teal-950/40"
            >
              Open live settlements
            </ExistingDocumentNavAnchor>
            <SambaIntelligencePanel loadId={load.id} />
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
          <LoadPickupAuthorizationLinks loadId={load.id} />
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
