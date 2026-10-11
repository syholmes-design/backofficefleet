"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLiveOperatingSpine } from "@/components/operations/LiveOperatingSpinePanel";
import { getErrorMessage, requestJson } from "@/lib/dispatch-workflow-ui";
import { formatUsdFull } from "@/lib/format-money";

type LiveSettlementListItem = {
  id: string;
  loadId: string;
  driverId: string | null;
  driverName: string;
  settlementDate: string;
  grossAmount: string;
  deductions: string;
  reimbursements: string;
  advances: string;
  netAmount: string;
  status: string;
  holdReason: string | null;
};

const SUPPORTING_TEMPLATES = [
  {
    href: "/documents/accounting-templates/driver-settlement-statement.html",
    label: "Driver settlement statement template",
  },
  {
    href: "/documents/accounting-templates/fuel-card-reconciliation-worksheet.html",
    label: "Fuel card reconciliation worksheet",
  },
] as const;

export function SettlementsPayrollPageClient() {
  const searchParams = useSearchParams();
  const loadId = searchParams.get("loadId");
  const settlementId = searchParams.get("settlementId");
  const driverId = searchParams.get("driverId");
  const { spine, error, loading, refresh } = useLiveOperatingSpine();
  const [records, setRecords] = useState<LiveSettlementListItem[]>([]);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [recordsLoading, setRecordsLoading] = useState(true);

  const loadRecords = useCallback(async () => {
    setRecordsLoading(true);
    try {
      const payload = await requestJson<{ authority: "LIVE"; settlements: LiveSettlementListItem[] }>(
        "/api/dispatch/settlements",
      );
      setRecords(payload.settlements);
      setRecordsError(null);
    } catch (cause) {
      setRecords([]);
      setRecordsError(getErrorMessage(cause));
    } finally {
      setRecordsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);
  const holds = spine?.heldSettlements ?? [];
  const focusedHolds = holds.filter(
    (hold) => (settlementId != null && hold.id === settlementId) || (loadId != null && hold.loadId === loadId),
  );
  const hasFocus = Boolean(loadId || settlementId);
  const workbookQuery = new URLSearchParams();
  if (driverId) workbookQuery.set("driverId", driverId);
  if (loadId) workbookQuery.set("loadId", loadId);
  if (settlementId) workbookQuery.set("settlementId", settlementId);
  const workbookHref = workbookQuery.size > 0 ? `/demo/settlements?${workbookQuery.toString()}` : "/demo/settlements";

  return (
    <div className="bof-settlements-payroll-wrap min-h-0 px-4 pb-8">
      <header className="mt-6 rounded-xl border border-emerald-500/30 bg-slate-950/80 p-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-300">Settlements</p>
        <h1 className="mt-2 text-2xl font-black text-white">Settlements</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
          Live rows below are stored settlement records for loads your account can access. Gross, deductions,
          reimbursements, advances, and net are the stored amounts. This page does not calculate driver-week payroll.
          Period planning stays in the{" "}
          <Link className="text-amber-200 underline" href={workbookHref}>
            training payroll workbook
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={() => {
            void refresh();
            void loadRecords();
          }}
          className="mt-4 rounded border border-emerald-500/50 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-950"
        >
          Refresh
        </button>
      </header>
      {loading || recordsLoading ? <p className="mt-4 text-sm text-slate-400">Loading settlements…</p> : null}
      {error ? <p className="mt-4 text-sm text-amber-200">{error}</p> : null}
      {recordsError ? <p className="mt-4 text-sm text-amber-200">{recordsError}</p> : null}
      <section className="mt-4 overflow-x-auto rounded-xl border border-slate-800" aria-labelledby="live-settlement-records">
        <h2 id="live-settlement-records" className="px-3 py-3 text-sm font-bold uppercase tracking-wide text-slate-300">
          Live settlement records
        </h2>
        <table className="min-w-full text-left text-sm text-slate-100">
          <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Driver</th>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Gross</th>
              <th className="px-3 py-2">Deductions</th>
              <th className="px-3 py-2">Reimbursements</th>
              <th className="px-3 py-2">Advances</th>
              <th className="px-3 py-2">Net</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Load</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-slate-400" colSpan={9}>
                  No live settlement records in your fleet.
                </td>
              </tr>
            ) : (
              records.map((record) => {
                const focused =
                  (settlementId != null && record.id === settlementId) ||
                  (loadId != null && record.loadId === loadId) ||
                  (driverId != null && record.driverId === driverId);
                return (
                  <tr key={record.id} className={["border-t border-slate-800", focused ? "bg-emerald-950/40" : ""].join(" ")}>
                    <td className="px-3 py-2">{record.driverName}</td>
                    <td className="px-3 py-2">{record.settlementDate.slice(0, 10)}</td>
                    <td className="px-3 py-2">{formatUsdFull(Number(record.grossAmount))}</td>
                    <td className="px-3 py-2">{formatUsdFull(Number(record.deductions))}</td>
                    <td className="px-3 py-2">{formatUsdFull(Number(record.reimbursements))}</td>
                    <td className="px-3 py-2">{formatUsdFull(Number(record.advances))}</td>
                    <td className="px-3 py-2">{formatUsdFull(Number(record.netAmount))}</td>
                    <td className="px-3 py-2 font-semibold">{record.status}</td>
                    <td className="px-3 py-2">
                      <Link className="text-teal-200 underline" href={`/trip-release/${record.loadId}`}>
                        Open load
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </section>
      <section className="mt-4 rounded-xl border border-slate-800 p-4" aria-labelledby="settlement-templates">
        <h2 id="settlement-templates" className="text-sm font-bold uppercase tracking-wide text-slate-300">
          Supporting templates
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          These are blank templates in the operations library. They are not filled settlement statements or completed fuel-card reconciliations.
        </p>
        <div className="mt-3 flex flex-wrap gap-4">
          {SUPPORTING_TEMPLATES.map((template) => (
            <Link key={template.href} className="text-sm text-teal-200 underline" href={template.href}>
              {template.label}
            </Link>
          ))}
        </div>
      </section>
      <h2 className="mt-6 text-sm font-bold uppercase tracking-wide text-slate-300">Proof holds</h2>
      {hasFocus && !loading ? (
        <p className="mt-4 text-sm text-slate-300">
          {focusedHolds.length > 0
            ? `${focusedHolds.length} live hold${focusedHolds.length === 1 ? "" : "s"} match this load or settlement.`
            : "No live hold matches this load or settlement. Driver-week workbook rows are not live settlement records."}
          {driverId ? " Driver-week planning for this driver stays in the training workbook." : ""}
        </p>
      ) : null}
      <section className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
        <table className="min-w-full text-left text-sm text-slate-100">
          <thead className="bg-slate-900 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-3 py-2">Hold</th>
              <th className="px-3 py-2">Load</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Reason</th>
            </tr>
          </thead>
          <tbody>
            {holds.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-slate-400" colSpan={4}>
                  No settlement holds in your fleet.
                </td>
              </tr>
            ) : (
              holds.map((hold) => (
                <tr
                  key={hold.id}
                  className={[
                    "border-t border-slate-800",
                    focusedHolds.some((focused) => focused.id === hold.id) ? "bg-emerald-950/40" : "",
                  ].join(" ")}
                >
                  <td className="px-3 py-2 font-mono text-xs">{hold.id.slice(0, 8)}</td>
                  <td className="px-3 py-2">
                    <Link className="text-teal-200 underline" href={`/trip-release/${hold.loadId}`}>
                      Open load
                    </Link>
                  </td>
                  <td className="px-3 py-2 font-semibold">{hold.status}</td>
                  <td className="px-3 py-2 text-slate-300">{hold.holdReason || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
