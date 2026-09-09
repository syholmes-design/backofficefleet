"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getErrorMessage, requestJson } from "@/lib/dispatch-workflow-ui";

export type LiveOperatingSpine = {
  authority: "LIVE";
  loads: Array<{
    id: string;
    fleetId: string;
    customerName: string;
    origin: string;
    destination: string;
    commodityClass?: string | null;
    status: string;
    referenceNumber: string | null;
    sourceRecordId?: string | null;
    updatedAt: string;
  }>;
  equipment: Array<{
    id: string;
    fleetId: string;
    equipmentType: string;
    unitNumber: string;
    status: string;
    updatedAt: string;
  }>;
  heldSettlements: Array<{
    id: string;
    loadId: string;
    status: string;
    holdReason: string | null;
    updatedAt: string;
  }>;
};

export function useLiveOperatingSpine() {
  const [spine, setSpine] = useState<LiveOperatingSpine | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await requestJson<LiveOperatingSpine>("/api/dispatch/operating-spine");
      setSpine(next);
      setError(null);
    } catch (nextError) {
      setSpine(null);
      setError(getErrorMessage(nextError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { spine, error, loading, refresh };
}

export function LiveOperatingSpinePanel({
  title = "LIVE operational spine",
}: {
  title?: string;
}) {
  const { spine, error, loading, refresh } = useLiveOperatingSpine();

  return (
    <section className="rounded-lg border border-emerald-400/30 bg-slate-950/80 p-4 text-sm text-emerald-50">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-300">{title}</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">
            Prisma equipment, loads, and settlement holds. DEMO T-102 / L001 remain DEMO_ONLY and are not relabeled LIVE.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded border border-emerald-500/40 px-2 py-1 text-xs text-emerald-100 hover:bg-emerald-950/60"
        >
          Refresh LIVE
        </button>
      </div>
      {loading ? <p className="mt-3 text-xs text-slate-400">Loading LIVE records…</p> : null}
      {error ? <p className="mt-3 text-xs text-amber-200">{error}</p> : null}
      {spine ? (
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold text-slate-400">LIVE equipment ({spine.equipment.length})</p>
            <ul className="mt-1 space-y-1 text-xs">
              {spine.equipment.slice(0, 8).map((unit) => (
                <li key={unit.id}>
                  <Link className="underline decoration-emerald-500/50" href={`/dispatch`}>
                    {unit.unitNumber}
                  </Link>{" "}
                  · {unit.status}
                </li>
              ))}
              {spine.equipment.length === 0 ? <li>No LIVE equipment in this operator scope.</li> : null}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">LIVE loads ({spine.loads.length})</p>
            <ul className="mt-1 space-y-1 text-xs">
              {spine.loads.slice(0, 8).map((load) => (
                <li key={load.id}>
                  <Link className="underline decoration-emerald-500/50" href={`/trip-release/${load.id}`}>
                    {load.referenceNumber || load.sourceRecordId || load.id.slice(0, 8)}
                  </Link>{" "}
                  · {load.status}
                </li>
              ))}
              {spine.loads.length === 0 ? <li>No LIVE loads in this operator scope.</li> : null}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">LIVE settlement holds ({spine.heldSettlements.length})</p>
            <ul className="mt-1 space-y-1 text-xs">
              {spine.heldSettlements.slice(0, 8).map((hold) => (
                <li key={hold.id}>
                  <Link className="underline decoration-emerald-500/50" href={`/trip-release/${hold.loadId}`}>
                    {hold.loadId.slice(0, 8)}
                  </Link>{" "}
                  · {hold.holdReason || hold.status}
                </li>
              ))}
              {spine.heldSettlements.length === 0 ? <li>No LIVE settlement holds.</li> : null}
            </ul>
          </div>
        </div>
      ) : null}
    </section>
  );
}
