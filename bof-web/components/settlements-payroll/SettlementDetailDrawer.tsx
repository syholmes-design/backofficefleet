"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { settlementHasProofOrExceptionIssues } from "@/lib/settlements-payroll-bootstrap";
import { useSettlementsPayrollStore } from "@/lib/stores/settlements-payroll-store";
import {
  formatPayrollCurrency,
  proofChipClass,
  settlementStatusChipClass,
} from "./settlements-payroll-ui";

type Props = {
  settlementId: string | null;
  open: boolean;
  onClose: () => void;
};

function proofSignalLabel(
  proofStatus: string,
  settlementHold: boolean,
  exceptionFlag: boolean
) {
  const status = proofStatus.toUpperCase();
  if (settlementHold || status === "MISSING" || status === "FAILED") return "Blocking action";
  if (exceptionFlag || status === "PENDING") return "At risk";
  if (status === "VERIFIED" || status === "PASS") return "Resolved / clean";
  return "At risk";
}

function settlementDocLabel(kind: "summary" | "hold" | "insurance"): string {
  if (kind === "summary") return "settlement summary";
  if (kind === "hold") return "hold letter";
  return "insurance notice";
}

export function SettlementDetailDrawer({ settlementId, open, onClose }: Props) {
  const { data } = useBofDemoData();
  const settlements = useSettlementsPayrollStore((s) => s.settlements);
  const lines = useSettlementsPayrollStore((s) => s.lines);
  const loads = useSettlementsPayrollStore((s) => s.loads);
  const markReadyForExport = useSettlementsPayrollStore((s) => s.markReadyForExport);
  const placeHold = useSettlementsPayrollStore((s) => s.placeHold);
  const clearHold = useSettlementsPayrollStore((s) => s.clearHold);
  const addLine = useSettlementsPayrollStore((s) => s.addLine);
  const generatedDocs = useSettlementsPayrollStore(
    (s) => s.generatedDocsBySettlementId
  );
  const setGeneratedDocument = useSettlementsPayrollStore(
    (s) => s.setGeneratedDocument
  );
  const [docBusy, setDocBusy] = useState<"summary" | "hold" | "insurance" | null>(null);
  const [docNotice, setDocNotice] = useState<string | null>(null);

  const settlement = useMemo(
    () => settlements.find((x) => x.settlement_id === settlementId) ?? null,
    [settlements, settlementId]
  );

  const myLines = useMemo(
    () =>
      settlement
        ? lines.filter((l) => l.settlement_id === settlement.settlement_id)
        : [],
    [lines, settlement]
  );

  const proofReview = useMemo(() => {
    if (!settlement) return { recommendHold: false, messages: [] as string[] };
    return settlementHasProofOrExceptionIssues(
      data,
      settlement.settlement_id,
      lines,
      loads
    );
  }, [data, settlement, lines, loads]);

  if (!open || !settlement) return null;

  const netCheck =
    Math.abs(
      settlement.net_pay -
        (settlement.total_gross_pay - settlement.total_deductions)
    ) < 0.02;

  const lineCount = myLines.length;
  const readyDisabled =
    settlement.settlement_hold || lineCount === 0 || settlement.status === "Exported";
  const docs = generatedDocs[settlement.settlement_id];

  async function generateSettlementDoc(
    target: NonNullable<typeof settlement>,
    kind: "summary" | "hold" | "insurance"
  ) {
    setDocBusy(kind);
    setDocNotice(null);
    try {
      const res = await fetch("/api/generate/settlement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settlementId: target.settlement_id,
          kind,
          driver_name: target.driver_name,
          gross: target.total_gross_pay,
          deductions: target.total_deductions,
          net: target.net_pay,
          settlement_status: target.status,
          settlement_hold_info: target.settlement_hold_reason,
        }),
      });
      const data = (await res.json()) as
        | { ok: true; generatedUrl: string; publicUrl?: string }
        | { ok: false; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error((data as { error?: string }).error || "Settlement generation failed");
      }
      const url = data.publicUrl || data.generatedUrl;
      setGeneratedDocument(target.settlement_id, kind, url);
      setDocNotice(`Generated ${settlementDocLabel(kind)}.`);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      setDocNotice(
        `Could not generate settlement doc: ${
          err instanceof Error ? err.message : "Unknown error"
        }`
      );
    } finally {
      setDocBusy(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex justify-end bg-black/55 backdrop-blur-[1px]"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        className="flex h-full w-full max-w-2xl flex-col border-l border-slate-800 bg-slate-950 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="stl-drawer-title"
      >
        <header className="flex items-start justify-between gap-3 border-b border-slate-800 px-4 py-3">
          <div>
            <p
              id="stl-drawer-title"
              className="text-[10px] font-semibold uppercase tracking-wide text-slate-500"
            >
              Settlement detail
            </p>
            <h2 className="text-base font-semibold text-white">
              {settlement.driver_name}
            </h2>
            <p className="mt-0.5 font-mono text-xs text-slate-500">
              {settlement.settlement_id} · {settlement.driver_id}
            </p>
            <p className="mt-1 font-mono text-xs text-slate-400">
              {settlement.period_start} → {settlement.period_end}
            </p>
            <div className="mt-2">
              <span
                className={[
                  "inline-flex rounded px-2 py-0.5 text-xs font-semibold",
                  settlementStatusChipClass(settlement.status),
                ].join(" ")}
              >
                {settlement.status}
              </span>
              {settlement.export_reference && (
                <span className="ml-2 font-mono text-[11px] text-slate-500">
                  {settlement.export_reference}
                </span>
              )}
            </div>
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

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 text-sm">
          <section className="grid gap-3 rounded-lg border border-slate-800 bg-slate-900/40 p-3 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase text-slate-500">
                Total gross
              </p>
              <p className="font-mono text-lg text-white">
                {formatPayrollCurrency(settlement.total_gross_pay)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-slate-500">
                Total deductions
              </p>
              <p className="font-mono text-lg text-white">
                {formatPayrollCurrency(settlement.total_deductions)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-slate-500">
                Net pay
              </p>
              <p className="font-mono text-lg font-semibold text-teal-200">
                {formatPayrollCurrency(settlement.net_pay)}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-slate-500">
                Hold
              </p>
              <p className="text-slate-100">
                {settlement.settlement_hold ? (
                  <span className="text-red-300">On hold</span>
                ) : (
                  <span className="text-emerald-300">None</span>
                )}
              </p>
              {settlement.settlement_hold_reason && (
                <p className="mt-1 text-xs text-amber-100/90">
                  {settlement.settlement_hold_reason}
                </p>
              )}
            </div>
          </section>
          <section className="rounded-lg border border-slate-800 bg-slate-900/30 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              Readiness story
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="bof-status-pill bof-status-pill-danger">
                Blocking: proof missing / hold / failed checks
              </span>
              <span className="bof-status-pill bof-status-pill-info">
                At risk: pending proof or active exception
              </span>
              <span className="bof-status-pill bof-status-pill-ok">
                Resolved: verified proof and no hold
              </span>
            </div>
          </section>

          {!netCheck && (
            <div className="rounded border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-100">
              Internal check: net pay does not match gross − deductions from lines —
              recalc required.
            </div>
          )}

          {proofReview.recommendHold && !settlement.settlement_hold && (
            <div className="rounded border border-amber-800/50 bg-amber-950/25 px-3 py-2 text-xs text-amber-100">
              <p className="font-semibold">Recommended: place settlement hold</p>
              <p className="mt-1 text-amber-200/90">
                Proof gaps or exceptions detected on linked loads. Holds are the
                blocking control; warnings alone do not block export until a hold is
                applied.
              </p>
              <ul className="mt-2 list-inside list-disc text-amber-100/90">
                {proofReview.messages.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Settlement lines
            </h3>
            <div className="overflow-x-auto rounded border border-slate-800">
              <table className="w-full min-w-[640px] border-collapse text-left text-xs">
                <thead className="bg-slate-900/90 text-[10px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="border-b border-slate-800 px-2 py-2">Type</th>
                    <th className="border-b border-slate-800 px-2 py-2">Description</th>
                    <th className="border-b border-slate-800 px-2 py-2 text-right">
                      Amount
                    </th>
                    <th className="border-b border-slate-800 px-2 py-2">Load</th>
                    <th className="border-b border-slate-800 px-2 py-2">Proof</th>
                    <th className="border-b border-slate-800 px-2 py-2">Exc.</th>
                  </tr>
                </thead>
                <tbody>
                  {myLines.map((l) => (
                    <tr key={l.line_id} className="border-b border-slate-800/80">
                      <td className="px-2 py-1.5 text-slate-300">{l.type}</td>
                      <td className="px-2 py-1.5 text-slate-200">{l.description}</td>
                      <td className="px-2 py-1.5 text-right font-mono text-slate-100">
                        {formatPayrollCurrency(l.amount)}
                      </td>
                      <td className="px-2 py-1.5 font-mono text-teal-300">
                        {l.load_id ?? "—"}
                      </td>
                      <td className="px-2 py-1.5">
                        {l.proof_status ? (
                          <span
                            className={[
                              "inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium",
                              proofChipClass(l.proof_status),
                            ].join(" ")}
                          >
                            {l.proof_status}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        {l.exception_flag ? (
                          <span className="text-red-400">Y</span>
                        ) : (
                          "·"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Load proof / readiness
            </h3>
            <div className="space-y-2">
              {Array.from(
                new Set(
                  myLines.map((l) => l.load_id).filter(Boolean) as string[]
                )
              ).flatMap((lid) => {
                const snap = loads.find((x) => x.load_id === lid);
                if (!snap) return [];
                const signal = proofSignalLabel(
                  snap.proof_status,
                  snap.settlement_hold,
                  snap.exception_flag
                );
                return [
                  <div
                    key={lid}
                    className="rounded border border-slate-800 bg-slate-900/50 px-3 py-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-teal-300">{lid}</span>
                      <span
                        className={[
                          "rounded px-2 py-0.5 text-[10px] font-medium",
                          proofChipClass(snap.proof_status),
                        ].join(" ")}
                      >
                        Proof {snap.proof_status}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-400">{snap.customer_name}</p>
                    <dl className="mt-2 grid grid-cols-2 gap-1 text-[11px]">
                      <dt className="text-slate-500">Load status</dt>
                      <dd>{snap.status}</dd>
                      <dt className="text-slate-500">Proof hold (load)</dt>
                      <dd>{snap.settlement_hold ? "Yes" : "No"}</dd>
                      <dt className="text-slate-500">Exception</dt>
                      <dd>{snap.exception_flag ? "Yes" : "No"}</dd>
                      <dt className="text-slate-500">Claim</dt>
                      <dd>{snap.insurance_claim_needed ? "Yes" : "No"}</dd>
                    </dl>
                    <p className="mt-2">
                      <span
                        className={
                          signal === "Blocking action"
                            ? "bof-status-pill bof-status-pill-danger"
                            : signal === "Resolved / clean"
                              ? "bof-status-pill bof-status-pill-ok"
                              : "bof-status-pill bof-status-pill-info"
                        }
                      >
                        {signal}
                      </span>
                    </p>
                    {snap.settlement_hold_reason && (
                      <p className="mt-2 text-amber-200/90">{snap.settlement_hold_reason}</p>
                    )}
                  </div>,
                ];
              })}
              {myLines.every((l) => !l.load_id) && (
                <p className="text-xs text-slate-500">
                  No load-linked lines — proof readiness is N/A for this settlement.
                </p>
              )}
            </div>
          </section>
        </div>

        <footer className="shrink-0 space-y-2 border-t border-slate-800 bg-slate-950/95 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Actions
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={readyDisabled}
              onClick={() => {
                const err = markReadyForExport(settlement.settlement_id);
                if (err) window.alert(err);
              }}
              className="rounded border border-teal-600 bg-teal-900/35 px-3 py-1.5 text-xs font-medium text-teal-50 hover:bg-teal-900/55 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Mark as ready for export
            </button>
            <button
              type="button"
              onClick={() => {
                const r = window.prompt("Hold reason:", "Proof / exception review");
                if (r !== null) placeHold(settlement.settlement_id, r || undefined);
              }}
              className="rounded border border-amber-800 bg-amber-950/35 px-3 py-1.5 text-xs font-medium text-amber-100 hover:bg-amber-900/45"
            >
              Place settlement hold
            </button>
            <button
              type="button"
              disabled={!settlement.settlement_hold}
              onClick={() => clearHold(settlement.settlement_id)}
              className="rounded border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-700 disabled:opacity-40"
            >
              Clear settlement hold
            </button>
            <button
              type="button"
              onClick={() => addLine(settlement.settlement_id)}
              className="rounded border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-900"
            >
              Add line
            </button>
            <button
              type="button"
              disabled={docBusy !== null}
              onClick={() => void generateSettlementDoc(settlement, "summary")}
              className="rounded border border-blue-700 bg-blue-950/35 px-3 py-1.5 text-xs font-medium text-blue-100 hover:bg-blue-900/45 disabled:opacity-50"
            >
              {docBusy === "summary" ? "Generating..." : "Generate settlement summary"}
            </button>
            <button
              type="button"
              disabled={docBusy !== null}
              onClick={() => void generateSettlementDoc(settlement, "hold")}
              className="rounded border border-blue-700 bg-blue-950/35 px-3 py-1.5 text-xs font-medium text-blue-100 hover:bg-blue-900/45 disabled:opacity-50"
            >
              {docBusy === "hold" ? "Generating..." : "Generate hold letter"}
            </button>
            <button
              type="button"
              disabled={docBusy !== null}
              onClick={() => void generateSettlementDoc(settlement, "insurance")}
              className="rounded border border-blue-700 bg-blue-950/35 px-3 py-1.5 text-xs font-medium text-blue-100 hover:bg-blue-900/45 disabled:opacity-50"
            >
              {docBusy === "insurance" ? "Generating..." : "Generate insurance notice"}
            </button>
          </div>
          {(docNotice || docs) && (
            <div className="mt-2 rounded border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-300">
              {docNotice && <p>{docNotice}</p>}
              <div className="mt-1 flex flex-wrap gap-3">
                {docs?.summaryUrl && (
                  <a
                    href={docs.summaryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bof-link-secondary"
                  >
                    Open summary
                  </a>
                )}
                {docs?.holdUrl && (
                  <a
                    href={docs.holdUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bof-link-secondary"
                  >
                    Open hold letter
                  </a>
                )}
                {docs?.insuranceUrl && (
                  <a
                    href={docs.insuranceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bof-link-secondary"
                  >
                    Open insurance notice
                  </a>
                )}
              </div>
            </div>
          )}
        </footer>
      </aside>
    </div>
  );
}
