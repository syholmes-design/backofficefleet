"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SambaIntelligencePanel } from "@/components/operations/SambaIntelligencePanel";
import { ApiError, getErrorMessage, requestJson } from "@/lib/dispatch-workflow-ui";

type PublicAuthorization = {
  id: string;
  loadId: string;
  assignmentId: string;
  driverId: string;
  tractorEquipmentId: string;
  trailerEquipmentId: string | null;
  status: string;
  reason: string | null;
  expiresAt: string;
  releasedAt: string | null;
  stoppedAt: string | null;
  pickupWindowStart: string | null;
  pickupWindowEnd: string | null;
  physicalIdentityClass: string;
  physicalEquipmentClass: string;
};

type AttemptRow = { id: string; result: string; reason: string; createdAt: string };

function applyErrorPayload(
  error: unknown,
  setAuthorization: (value: PublicAuthorization) => void,
  setAttempts: (update: (current: AttemptRow[]) => AttemptRow[]) => void,
) {
  if (!(error instanceof ApiError) || !error.body || typeof error.body !== "object") {
    return;
  }
  const body = error.body as {
    authorization?: PublicAuthorization;
    attempt?: AttemptRow;
  };
  if (body.authorization) {
    setAuthorization(body.authorization);
  }
  if (body.attempt) {
    const attempt = body.attempt;
    setAttempts((current) => [...current, attempt]);
  }
}

type IssueResponse = {
  authorization: PublicAuthorization;
  expected: {
    loadId: string;
    driverId: string;
    tractorEquipmentId: string;
    trailerEquipmentId: string | null;
  };
  credential: { token: string; warning: string };
  physicalVerificationNote: string;
};

export function PickupAuthorizationClient({ initialLoadId = "" }: { initialLoadId?: string }) {
  const [loadId, setLoadId] = useState(initialLoadId);
  const [token, setToken] = useState("");
  const [oneTimeToken, setOneTimeToken] = useState<string | null>(null);
  const [authorization, setAuthorization] = useState<PublicAuthorization | null>(null);
  const [attempts, setAttempts] = useState<Array<{ id: string; result: string; reason: string; createdAt: string }>>([]);
  const [presentedDriverId, setPresentedDriverId] = useState("");
  const [presentedTractorEquipmentId, setPresentedTractorEquipmentId] = useState("");
  const [presentedTrailerEquipmentId, setPresentedTrailerEquipmentId] = useState("");
  const [presentedLoadId, setPresentedLoadId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const expected = useMemo(() => authorization, [authorization]);

  const loadExisting = useCallback(async (id: string) => {
    const result = await requestJson<{
      authorization: PublicAuthorization;
      attempts: Array<{ id: string; result: string; reason: string; createdAt: string }>;
    }>(`/api/dispatch/pickup-authorization/${id}`);
    setAuthorization(result.authorization);
    setAttempts(result.attempts);
    setPresentedDriverId(result.authorization.driverId);
    setPresentedTractorEquipmentId(result.authorization.tractorEquipmentId);
    setPresentedTrailerEquipmentId(result.authorization.trailerEquipmentId ?? "");
    setPresentedLoadId(result.authorization.loadId);
  }, []);

  useEffect(() => {
    if (!initialLoadId) return;
    void (async () => {
      try {
        const listed = await requestJson<{ authorizations: PublicAuthorization[] }>(
          `/api/dispatch/pickup-authorization?loadId=${encodeURIComponent(initialLoadId)}`,
        );
        if (listed.authorizations[0]) {
          await loadExisting(listed.authorizations[0].id);
        }
      } catch (nextError) {
        setError(getErrorMessage(nextError));
      }
    })();
  }, [initialLoadId, loadExisting]);

  async function issue() {
    setBusy(true);
    setError(null);
    try {
      const issued = await requestJson<IssueResponse>("/api/dispatch/pickup-authorization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loadId }),
      });
      setAuthorization(issued.authorization);
      setOneTimeToken(issued.credential.token);
      setToken(issued.credential.token);
      setPresentedDriverId(issued.expected.driverId);
      setPresentedTractorEquipmentId(issued.expected.tractorEquipmentId);
      setPresentedTrailerEquipmentId(issued.expected.trailerEquipmentId ?? "");
      setPresentedLoadId(issued.expected.loadId);
      setAttempts([]);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setBusy(false);
    }
  }

  async function verify(includeIdentities: boolean) {
    if (!authorization) return;
    setBusy(true);
    setError(null);
    try {
      const result = await requestJson<{
        authorization: PublicAuthorization;
        attempt: { id: string; result: string; reason: string; createdAt: string };
      }>(`/api/dispatch/pickup-authorization/${authorization.id}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          includeIdentities
            ? {
                token,
                presentedAuthorizationId: authorization.id,
                presentedLoadId,
                presentedDriverId,
                presentedTractorEquipmentId,
                presentedTrailerEquipmentId: presentedTrailerEquipmentId || null,
              }
            : { token },
        ),
      });
      setAuthorization(result.authorization);
      setAttempts((current) => [...current, result.attempt]);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
      applyErrorPayload(nextError, setAuthorization, setAttempts);
    } finally {
      setBusy(false);
    }
  }

  async function cancel() {
    if (!authorization) return;
    setBusy(true);
    setError(null);
    try {
      const result = await requestJson<{ authorization: PublicAuthorization }>(
        `/api/dispatch/pickup-authorization/${authorization.id}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: "Cancelled from pickup desk" }),
        },
      );
      setAuthorization(result.authorization);
    } catch (nextError) {
      setError(getErrorMessage(nextError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8">
      <header className="rounded-xl border border-slate-800 bg-slate-950/80 p-6">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Secure Pickup · Phase 1</p>
        <h1 className="mt-2 text-3xl font-black text-white">Load pickup authorization</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          Issues a dock credential bound to the active DispatchAssignment. Matching presented records can RELEASE the
          pickup. A mismatch STOP the pickup. This does not prove the physical person or equipment at the dock.
        </p>
        <p className="mt-2 text-sm text-slate-400">
          Trip release remains a separate gate.{" "}
          <Link className="text-teal-200 underline" href="/command-center">
            Command Center
          </Link>
          {" · "}
          <Link className="text-teal-200 underline" href="/dispatch/pickup/dock">
            Phase 2 shipper dock
          </Link>
        </p>
      </header>

      <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
        <label className="text-xs uppercase tracking-wide text-slate-500" htmlFor="pickup-load-id">
          Load ID
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            id="pickup-load-id"
            className="min-w-[16rem] flex-1 rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            value={loadId}
            onChange={(event) => setLoadId(event.target.value)}
          />
          <button
            type="button"
            disabled={busy || !loadId.trim()}
            onClick={() => void issue()}
            className="rounded border border-emerald-500/50 px-3 py-2 text-sm text-emerald-100"
          >
            Issue authorization
          </button>
        </div>
      </section>

      {oneTimeToken ? (
        <section className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-5 text-amber-100">
          <p className="text-xs font-semibold uppercase tracking-wide">One-time credential</p>
          <p className="mt-2 break-all font-mono text-sm">{oneTimeToken}</p>
          <p className="mt-2 text-xs">Shown once. This is not a database ID.</p>
        </section>
      ) : null}

      {authorization ? (
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 text-slate-200">
          <p className="text-sm">
            Status: <span className="font-bold text-white">{authorization.status}</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Physical identity: {authorization.physicalIdentityClass} · Equipment: {authorization.physicalEquipmentClass}
          </p>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            <div>Expected driver: {expected?.driverId}</div>
            <div>Expected tractor: {expected?.tractorEquipmentId}</div>
            <div>Expected trailer: {expected?.trailerEquipmentId || "none"}</div>
            <div>Expected load: {expected?.loadId}</div>
            <div>Expires: {new Date(authorization.expiresAt).toISOString()}</div>
            <div>Reason: {authorization.reason || "—"}</div>
          </dl>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <input
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              placeholder="Presented credential"
              value={token}
              onChange={(event) => setToken(event.target.value)}
            />
            <input
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              placeholder="Presented driver ID"
              value={presentedDriverId}
              onChange={(event) => setPresentedDriverId(event.target.value)}
            />
            <input
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              placeholder="Presented tractor ID"
              value={presentedTractorEquipmentId}
              onChange={(event) => setPresentedTractorEquipmentId(event.target.value)}
            />
            <input
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              placeholder="Presented trailer ID"
              value={presentedTrailerEquipmentId}
              onChange={(event) => setPresentedTrailerEquipmentId(event.target.value)}
            />
            <input
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              placeholder="Presented load ID"
              value={presentedLoadId}
              onChange={(event) => setPresentedLoadId(event.target.value)}
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => void verify(false)} className="rounded border border-slate-500 px-3 py-2 text-sm">
              Accept credential
            </button>
            <button type="button" disabled={busy} onClick={() => void verify(true)} className="rounded border border-emerald-500/50 px-3 py-2 text-sm text-emerald-100">
              Reconcile and RELEASE/STOP
            </button>
            <button type="button" disabled={busy} onClick={() => void cancel()} className="rounded border border-rose-500/50 px-3 py-2 text-sm text-rose-100">
              Cancel
            </button>
          </div>
        </section>
      ) : null}

      {attempts.length > 0 ? (
        <section className="rounded-xl border border-slate-800 bg-slate-900/40 p-5">
          <h2 className="text-sm font-bold text-white">Verification attempts</h2>
          <ul className="mt-2 space-y-1 text-sm text-slate-300">
            {attempts.map((attempt) => (
              <li key={attempt.id}>
                {attempt.result} — {attempt.reason}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {error ? <p className="rounded-lg border border-amber-500/40 bg-amber-950/40 p-3 text-sm text-amber-100">{error}</p> : null}

      <SambaIntelligencePanel />
    </div>
  );
}
