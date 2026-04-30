"use client";

import {
  AlertTriangle,
  FileStack,
  Link2,
  ShieldAlert,
  Truck,
} from "lucide-react";
import type { Load } from "@/types/dispatch";
import { useDispatchDashboardStore } from "@/lib/stores/dispatch-dashboard-store";
import {
  driverNameById,
  trailerLabel,
  tractorLabel,
} from "@/lib/dispatch-dashboard-seed";
import { formatMoney, proofChipClass, sealChipClass } from "./dispatch-ui";
import { LoadStatusTimeline } from "./LoadStatusTimeline";
import { LoadDocumentsLibraryEnhanced } from "./LoadDocumentsLibraryEnhanced";
import { DocumentationReadinessPanel } from "./DocumentationReadinessPanel";
import { BofWorkflowFormShortcuts } from "@/components/documents/BofWorkflowFormShortcuts";
import { DispatchRouteMapClient } from "./DispatchRouteMapClient";

type Props = {
  load: Load;
  onClose?: () => void;
};

export function LoadDetailContent({ load, onClose }: Props) {
  const drivers = useDispatchDashboardStore((s) => s.drivers);
  const tractors = useDispatchDashboardStore((s) => s.tractors);
  const trailers = useDispatchDashboardStore((s) => s.trailers);
  const openAssignModal = useDispatchDashboardStore((s) => s.openAssignModal);
  const setLoadStatus = useDispatchDashboardStore((s) => s.setLoadStatus);
  const flagException = useDispatchDashboardStore((s) => s.flagException);
  const setSettlementHold = useDispatchDashboardStore(
    (s) => s.setSettlementHold
  );
  const clearExceptionFlag = useDispatchDashboardStore(
    (s) => s.clearExceptionFlag
  );

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-800 px-5 py-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Load
          </p>
          <h2 className="text-lg font-semibold text-white">{load.load_id}</h2>
          <p className="text-sm text-slate-400">{load.customer_name}</p>
          {load.dispatch_notes && (
            <p className="mt-2 max-w-xl rounded border border-slate-800 bg-slate-950/50 px-2 py-1.5 text-xs text-slate-400">
              <span className="font-semibold text-slate-500">Ops notes: </span>
              {load.dispatch_notes}
            </p>
          )}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
          >
            Close
          </button>
        )}
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <LoadStatusTimeline status={load.status} />

        <DocumentationReadinessPanel load={load} />

        <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Route &amp; proof
          </h3>
          <DispatchRouteMapClient
            loads={[load]}
            selectedLoadId={load.load_id}
            mode="selected"
            compact
          />
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-400">
            <p>
              Progress: <span className="text-slate-200">{load.routeProgressPct ?? 0}%</span>
            </p>
            <p>
              Next stop: <span className="text-slate-200">{load.nextStopLabel ?? "—"}</span>
            </p>
            <p>
              ETA: <span className="text-slate-200">{load.eta ?? "—"}</span>
            </p>
            <p>
              Current:{" "}
              <span className="text-slate-200">
                {load.currentLocationLabel ?? "Demo tracking unavailable"}
              </span>
            </p>
          </div>
        </section>

        <BofWorkflowFormShortcuts
          context="load"
          entityId={load.load_id}
          variant="dispatch"
          title="This load in BOF — open intake, driver packet, claim forms"
        />

        <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Truck className="h-3.5 w-3.5 text-teal-500" />
            Assignment
          </h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-slate-500">Driver</dt>
            <dd className="font-medium text-slate-100">
              {driverNameById(drivers, load.driver_id)}
            </dd>
            <dt className="text-slate-500">Tractor</dt>
            <dd className="font-medium text-slate-100">
              {tractorLabel(tractors, load.tractor_id)}
            </dd>
            <dt className="text-slate-500">Trailer</dt>
            <dd className="font-medium text-slate-100">
              {trailerLabel(trailers, load.trailer_id)}
            </dd>
          </dl>
          <button
            type="button"
            onClick={() => openAssignModal(load.load_id)}
            className="mt-3 w-full rounded border border-teal-600 bg-teal-900/30 py-2 text-sm font-medium text-teal-100 hover:bg-teal-900/50"
          >
            Assign driver &amp; equipment
          </button>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <FileStack className="h-3.5 w-3.5 text-teal-500" />
            Documents library
          </h3>
          <p className="mb-3 text-xs text-slate-500">
            Linked artifacts use deploy-safe paths under{" "}
            <span className="font-mono text-slate-400">/mocks/</span>,{" "}
            <span className="font-mono text-slate-400">/actual_docs/</span>, or
            other <span className="font-mono text-slate-400">/public</span>{" "}
            folders — grouped for shipper packet, billing, and claim support.
          </p>
          <LoadDocumentsLibraryEnhanced load={load} />
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <ShieldAlert className="h-3.5 w-3.5 text-teal-500" />
            Seals &amp; exceptions
          </h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Pickup seal</dt>
              <dd className="font-mono text-xs text-slate-200">
                {load.pickup_seal_number ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Delivery seal</dt>
              <dd className="font-mono text-xs text-slate-200">
                {load.delivery_seal_number ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Seal status</dt>
              <dd>
                <span
                  className={[
                    "inline-flex rounded px-2 py-0.5 text-xs font-medium",
                    sealChipClass(load.seal_status),
                  ].join(" ")}
                >
                  {load.seal_status}
                </span>
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Exception flag</dt>
              <dd className="font-medium text-slate-100">
                {load.exception_flag ? "Yes" : "No"}
              </dd>
            </div>
            {load.exception_reason && (
              <div className="rounded border border-red-900/50 bg-red-950/30 p-2 text-xs text-red-100">
                {load.exception_reason}
              </div>
            )}
          </dl>
        </section>

        <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Link2 className="h-3.5 w-3.5 text-teal-500" />
            Settlement readiness
          </h3>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-slate-500">Proof status</dt>
            <dd>
              <span
                className={[
                  "inline-flex rounded px-2 py-0.5 text-xs font-medium",
                  proofChipClass(load.proof_status),
                ].join(" ")}
              >
                {load.proof_status}
              </span>
            </dd>
            <dt className="text-slate-500">Settlement hold</dt>
            <dd className="font-medium text-slate-100">
              {load.settlement_hold ? "Yes" : "No"}
            </dd>
            {load.settlement_hold_reason && (
              <div className="col-span-2 rounded border border-amber-900/40 bg-amber-950/20 p-2 text-xs text-amber-100">
                {load.settlement_hold_reason}
              </div>
            )}
            <dt className="text-slate-500">Total pay</dt>
            <dd className="font-medium text-teal-200">
              {formatMoney(load.total_pay)}
            </dd>
          </dl>
        </section>
      </div>

      <footer className="shrink-0 space-y-2 border-t border-slate-800 bg-slate-950/90 px-5 py-3">
        <p className="text-[10px] uppercase tracking-wide text-slate-500">
          Actions
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setLoadStatus(load.load_id, "Dispatched")}
            className="rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700"
          >
            Mark dispatched
          </button>
          <button
            type="button"
            onClick={() => setLoadStatus(load.load_id, "In Transit")}
            className="rounded border border-slate-600 bg-slate-800 px-2 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700"
          >
            Mark in transit
          </button>
          <button
            type="button"
            onClick={() => setLoadStatus(load.load_id, "Delivered")}
            className="rounded border border-emerald-800 bg-emerald-950/40 px-2 py-1.5 text-xs font-medium text-emerald-100 hover:bg-emerald-900/40"
          >
            Mark delivered
          </button>
          <button
            type="button"
            onClick={() => {
              const r = window.prompt("Exception reason (required):", "");
              if (r && r.trim()) flagException(load.load_id, r.trim());
            }}
            className="inline-flex items-center gap-1 rounded border border-red-800 bg-red-950/40 px-2 py-1.5 text-xs font-medium text-red-100 hover:bg-red-900/40"
          >
            <AlertTriangle className="h-3 w-3" />
            Flag exception
          </button>
          <button
            type="button"
            onClick={() => {
              if (load.settlement_hold) {
                setSettlementHold(load.load_id, false);
              } else {
                const r = window.prompt("Hold reason (optional):", "");
                setSettlementHold(load.load_id, true, r ?? undefined);
              }
            }}
            className="rounded border border-amber-800 bg-amber-950/30 px-2 py-1.5 text-xs font-medium text-amber-100 hover:bg-amber-900/30"
          >
            {load.settlement_hold
              ? "Clear settlement hold"
              : "Place settlement hold"}
          </button>
          {load.exception_flag && (
            <button
              type="button"
              onClick={() => clearExceptionFlag(load.load_id)}
              className="rounded border border-slate-600 px-2 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
            >
              Clear exception flag
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
