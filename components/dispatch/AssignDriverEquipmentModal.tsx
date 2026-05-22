"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertOctagon, X } from "lucide-react";
import { useDispatchDashboardStore } from "@/lib/stores/dispatch-dashboard-store";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { getDriverDispatchEligibility } from "@/lib/driver-dispatch-eligibility";
import { getOrderedDocumentsForDriver } from "@/lib/driver-queries";
import type { BofData } from "@/lib/load-bof-data";
import type { Tractor, Trailer } from "@/types/dispatch";
import {
  DriverHubReviewLink,
  DriverVaultReviewLink,
  ProofGapReviewLinks,
} from "@/components/review/ReviewDeepLinks";

type Props = {
  open: boolean;
  loadId: string | null;
  onClose: () => void;
};

function driverDocumentAssignmentSummary(data: BofData, driverId: string) {
  const docs = getOrderedDocumentsForDriver(data, driverId);
  const verified = docs.filter((d) => d.status.toUpperCase() === "VALID").length;
  let latestTs = 0;
  for (const d of docs) {
    for (const raw of [d.issueDate, d.cdlIssueDate]) {
      if (typeof raw !== "string" || !raw.trim()) continue;
      const t = Date.parse(raw);
      if (!Number.isNaN(t) && t >= latestTs) latestTs = t;
    }
  }
  const lastReviewed =
    latestTs > 0
      ? new Date(latestTs).toLocaleDateString(undefined, { dateStyle: "medium" })
      : null;
  return { verifiedCount: verified, coreDocTotal: docs.length, lastReviewed };
}

function mergeSelectable<T extends { status: string }>(
  available: T[],
  currentId: string | null,
  list: T[],
  idKey: keyof T
): T[] {
  const cur =
    currentId != null
      ? (list.find((x) => x[idKey] === currentId) ?? null)
      : null;
  const ids = new Set(available.map((x) => String(x[idKey])));
  if (cur && !ids.has(String(cur[idKey]))) {
    return [cur, ...available];
  }
  return available;
}

export function AssignDriverEquipmentModal({ open, loadId, onClose }: Props) {
  const { data } = useBofDemoData();
  const loads = useDispatchDashboardStore((s) => s.loads);
  const drivers = useDispatchDashboardStore((s) => s.drivers);
  const tractorsAll = useDispatchDashboardStore((s) => s.tractors);
  const trailersAll = useDispatchDashboardStore((s) => s.trailers);
  const assignDriverEquipment = useDispatchDashboardStore(
    (s) => s.assignDriverEquipment
  );

  const load = useMemo(
    () => (loadId ? loads.find((l) => l.load_id === loadId) ?? null : null),
    [loads, loadId]
  );

  const [driverId, setDriverId] = useState("");
  const [tractorId, setTractorId] = useState("");
  const [trailerId, setTrailerId] = useState("");

  useEffect(() => {
    if (!load) return;
    setDriverId(load.driver_id ?? "");
    setTractorId(load.tractor_id ?? "");
    setTrailerId(load.trailer_id ?? "");
  }, [load]);

  const activeDrivers = drivers.filter((d) => d.status === "Active");

  const tractorsSelectable = useMemo(() => {
    const avail = tractorsAll.filter((t) => t.status === "Available");
    return mergeSelectable(avail, load?.tractor_id ?? null, tractorsAll, "tractor_id");
  }, [tractorsAll, load?.tractor_id]);

  const trailersSelectable = useMemo(() => {
    const avail = trailersAll.filter((t) => t.status === "Available");
    return mergeSelectable(avail, load?.trailer_id ?? null, trailersAll, "trailer_id");
  }, [trailersAll, load?.trailer_id]);

  const selectedDriver = drivers.find((d) => d.driver_id === driverId);
  const selectedEligibility = selectedDriver
    ? getDriverDispatchEligibility(data, selectedDriver.driver_id)
    : null;
  const dispatchBlocked = selectedEligibility?.status === "blocked";
  const canSave =
    Boolean(driverId) && Boolean(tractorId) && !dispatchBlocked;

  if (!open || !loadId) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-slate-800 bg-slate-950 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-modal-title"
      >
        <header className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div>
            <h2
              id="assign-modal-title"
              className="text-base font-semibold text-white"
            >
              Assign driver &amp; equipment
            </h2>
            {load && (
              <p className="text-xs text-slate-500">
                Load{" "}
                <span className="font-mono text-teal-400">{load.load_id}</span>
              </p>
            )}
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

        {!load ? (
          <p className="p-6 text-sm text-slate-400">Load not found.</p>
        ) : (
          <>
            {selectedDriver && dispatchBlocked && (
              <div className="mx-4 mt-4 flex gap-2 rounded border border-red-800 bg-red-950/50 p-3 text-sm text-red-100">
                <AlertOctagon className="h-5 w-5 shrink-0" aria-hidden />
                <div>
                  <p className="font-semibold">Assignment blocked</p>
                  <p className="mt-1 text-xs text-red-200/90">
                    Driver {selectedDriver.name} is blocked for dispatch:{" "}
                    <strong>{selectedEligibility?.hardBlockers[0] ?? "Resolve hard blocker"}</strong>.
                  </p>
                </div>
              </div>
            )}

            <div className="grid min-h-0 flex-1 gap-0 overflow-hidden md:grid-cols-3">
              <Panel title="Drivers (Active)">
                {activeDrivers.map((d) => {
                  const eligibility = getDriverDispatchEligibility(data, d.driver_id);
                  const invalid = eligibility.status === "blocked";
                  const sel = d.driver_id === driverId;
                  const docSum = driverDocumentAssignmentSummary(data, d.driver_id);
                  return (
                    <div
                      key={d.driver_id}
                      className={[
                        "rounded border px-2 py-2 text-left text-xs transition-colors",
                        invalid
                          ? "cursor-not-allowed border-slate-800 bg-slate-950/60 text-slate-600"
                          : sel
                            ? "border-teal-500 bg-teal-950/40 text-teal-50"
                            : "border-slate-800 bg-slate-900/60 text-slate-200 hover:border-slate-600",
                      ].join(" ")}
                    >
                      <button
                        type="button"
                        disabled={invalid}
                        onClick={() => setDriverId(d.driver_id)}
                        className="w-full text-left disabled:cursor-not-allowed"
                      >
                        <div className="font-medium">{d.name}</div>
                        <div className="font-mono text-[10px] text-slate-500">
                          {d.driver_id}
                        </div>
                        <div className="mt-1 text-[10px] uppercase text-slate-500">
                          Dispatch:{" "}
                          {eligibility.status === "ready"
                            ? "READY"
                            : eligibility.status === "needs_review"
                              ? "NEEDS REVIEW"
                              : "BLOCKED"}
                        </div>
                        {eligibility.status !== "ready" ? (
                          <div className="mt-1 text-[10px] text-slate-400">
                            {eligibility.status === "blocked"
                              ? eligibility.hardBlockers[0]
                              : eligibility.softWarnings[0]}
                          </div>
                        ) : null}
                        <div className="mt-1 text-[10px] uppercase text-slate-500">
                          Compliance: {d.compliance_status}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-500">
                          Core docs verified: {docSum.verifiedCount}/{docSum.coreDocTotal}
                          {docSum.lastReviewed ? (
                            <span className="text-slate-600">
                              {" "}
                              · Last doc activity {docSum.lastReviewed}
                            </span>
                          ) : null}
                        </div>
                      </button>
                      {!invalid && eligibility.status !== "ready" ? (
                        <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1 border-t border-slate-800/80 pt-2">
                          <DriverHubReviewLink
                            driverId={d.driver_id}
                            className="text-[10px] font-semibold text-teal-300 hover:text-teal-200"
                          />
                          <DriverVaultReviewLink
                            driverId={d.driver_id}
                            className="text-[10px] font-semibold text-slate-400 hover:text-slate-200"
                          />
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </Panel>
              <Panel title="Tractors">
                {tractorsSelectable.map((t: Tractor) => (
                  <button
                    key={t.tractor_id}
                    type="button"
                    onClick={() => setTractorId(t.tractor_id)}
                    className={[
                      "w-full rounded border px-2 py-2 text-left text-xs",
                      tractorId === t.tractor_id
                        ? "border-teal-500 bg-teal-950/40 text-teal-50"
                        : "border-slate-800 bg-slate-900/60 text-slate-200 hover:border-slate-600",
                    ].join(" ")}
                  >
                    <div className="font-medium">{t.unit_number}</div>
                    <div className="font-mono text-[10px] text-slate-500">
                      {t.tractor_id}
                    </div>
                    <div className="mt-0.5 text-[10px] uppercase text-slate-500">
                      {t.status}
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
                {trailersSelectable.map((tr: Trailer) => (
                  <button
                    key={tr.trailer_id}
                    type="button"
                    onClick={() => setTrailerId(tr.trailer_id)}
                    className={[
                      "w-full rounded border px-2 py-2 text-left text-xs",
                      trailerId === tr.trailer_id
                        ? "border-teal-500 bg-teal-950/40 text-teal-50"
                        : "border-slate-800 bg-slate-900/60 text-slate-200 hover:border-slate-600",
                    ].join(" ")}
                  >
                    <div className="font-medium">{tr.unit_number}</div>
                    <div className="font-mono text-[10px] text-slate-500">
                      {tr.trailer_id}
                    </div>
                    <div className="mt-0.5 text-[10px] uppercase text-slate-500">
                      {tr.status}
                    </div>
                  </button>
                ))}
              </Panel>
            </div>

            <footer className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-800 px-4 py-3">
              <div className="mr-auto max-w-md space-y-1">
                <p className="text-[11px] text-slate-500">
                  Driver and tractor are required. Trailer is optional.
                </p>
                <ProofGapReviewLinks
                  driverId={driverId || load.driver_id}
                  loadId={load.load_id}
                  className="flex flex-wrap gap-x-2 gap-y-1"
                />
              </div>
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
                onClick={() => {
                  const ok = assignDriverEquipment({
                    load_id: load.load_id,
                    driver_id: driverId,
                    tractor_id: tractorId,
                    trailer_id: trailerId || null,
                  });
                  if (!ok) {
                    window.alert(
                      "Assignment rejected — driver is blocked for dispatch or required equipment is missing."
                    );
                  }
                }}
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
