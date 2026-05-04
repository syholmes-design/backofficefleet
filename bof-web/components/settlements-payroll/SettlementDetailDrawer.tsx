"use client";

import Link from "next/link";
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
import { BofTemplateUsageSurface } from "@/components/documents/BofTemplateUsageSurface";
import { BofWorkflowFormShortcuts } from "@/components/documents/BofWorkflowFormShortcuts";
import { buildRfidReadinessSummaryForSurface } from "@/lib/template-usage-readiness";
import { resolveBillingPacketRfidGate } from "@/lib/bof-rfid-readiness";
import { getMockBackhaulOpportunities } from "@/lib/backhaul-opportunity-engine";
import {
  getLoadDocumentPacket,
  getLoadProofItems,
  proofStatusDisplay,
} from "@/lib/load-proof";
import { getGeneratedLoadDocUrl } from "@/lib/load-doc-manifest";
import {
  getOperatingDocumentPath,
  getOperatingDocumentTitle,
  getOperatingDocumentsForFactoring,
  getOperatingDocumentsForLoad,
} from "@/lib/operating-documents";

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

function proofTypeStatus(data: Parameters<typeof getLoadProofItems>[0], loadId: string, needle: string) {
  const items = getLoadProofItems(data, loadId);
  const hit = items.find((i) => i.type.toLowerCase().includes(needle.toLowerCase()));
  return hit ? proofStatusDisplay(hit.status) : "—";
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
  const markSettlementReviewedDemo = useSettlementsPayrollStore(
    (s) => s.markSettlementReviewedDemo
  );
  const [docBusy, setDocBusy] = useState<"summary" | "hold" | "insurance" | null>(null);
  const [docNotice, setDocNotice] = useState<string | null>(null);
  const [showAdvancedPacket, setShowAdvancedPacket] = useState(false);

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

  const backhaulForSettlement = useMemo(() => {
    if (!settlement) return null;
    return (
      getMockBackhaulOpportunities(data).find(
        (o) => o.driverId === settlement.driver_id
      ) ?? null
    );
  }, [data, settlement]);

  /** Earnings lines first, then other line load_ids — matches payroll anchor expectations. */
  const linkedLoadIdsForTemplateUsage = useMemo(() => {
    if (!settlementId) return [] as string[];
    const mine = lines.filter((l) => l.settlement_id === settlementId);
    const earnings = mine
      .filter((l) => l.type === "Earnings" && l.load_id)
      .map((l) => l.load_id as string);
    const rest = mine
      .filter((l) => l.type !== "Earnings" && l.load_id)
      .map((l) => l.load_id as string);
    return [...new Set([...earnings, ...rest])];
  }, [settlementId, lines]);

  const uniqueLoadIds = useMemo(
    () => [...new Set(myLines.map((l) => l.load_id).filter(Boolean) as string[])],
    [myLines]
  );

  const billingRfidGate = useMemo(() => {
    if (!settlementId) {
      return { level: "advisory" as const, label: "RFID advisory", reason: "" };
    }
    const summary = buildRfidReadinessSummaryForSurface(
      data,
      "settlement_billing",
      settlementId,
      linkedLoadIdsForTemplateUsage
    );
    return resolveBillingPacketRfidGate(summary);
  }, [data, settlementId, linkedLoadIdsForTemplateUsage]);

  if (!open || !settlement) return null;

  const netCheck =
    Math.abs(
      settlement.net_pay -
        (settlement.total_gross_pay - settlement.total_deductions)
    ) < 0.02;

  const lineCount = myLines.length;
  const readyDisabled =
    settlement.settlement_hold ||
    lineCount === 0 ||
    settlement.status === "Exported" ||
    billingRfidGate.level === "hard_block";
  const docs = generatedDocs[settlement.settlement_id];
  const operatingDocsByLoad = useMemo(() => {
    return uniqueLoadIds.map((loadId) => {
      const settlementDocs = getOperatingDocumentsForLoad(loadId).filter(
        (doc) => doc.category === "settlements"
      );
      const factoringDocs = getOperatingDocumentsForFactoring(loadId);
      const holdNoticePath = getGeneratedLoadDocUrl(loadId, "settlementHoldNotice");
      const merged = [...settlementDocs, ...factoringDocs];
      const seen = new Set<string>();
      const unique = merged.filter((doc) => {
        const path = getOperatingDocumentPath(doc);
        if (seen.has(path)) return false;
        seen.add(path);
        return true;
      });
      return { loadId, docs: unique, holdNoticePath };
    });
  }, [uniqueLoadIds]);

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

          {backhaulForSettlement && (
            <section className="rounded-lg border border-slate-800 bg-slate-900/35 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Backhaul economics split (demo feed)
              </p>
              <dl className="mt-2 grid grid-cols-2 gap-2 text-xs">
                <dt className="text-slate-500">Linked opportunity</dt>
                <dd className="font-mono text-teal-300">{backhaulForSettlement.opportunityId}</dd>
                <dt className="text-slate-500">Linked load</dt>
                <dd className="font-mono text-teal-300">{backhaulForSettlement.linkedLoadId}</dd>
                <dt className="text-slate-500">Driver Backhaul Pay (payroll)</dt>
                <dd className="font-mono text-emerald-300">{formatPayrollCurrency(backhaulForSettlement.driverBackhaulPay)}</dd>
                <dt className="text-slate-500">BOF Backhaul Bonus (internal)</dt>
                <dd className="font-mono text-amber-200">{formatPayrollCurrency(backhaulForSettlement.bofBackhaulBonus)}</dd>
                <dt className="text-slate-500">Net Fleet Recovery</dt>
                <dd className="font-mono text-slate-100">{formatPayrollCurrency(backhaulForSettlement.netFleetRecovery)}</dd>
                <dt className="text-slate-500">Deadhead miles avoided</dt>
                <dd className="font-mono text-slate-100">{backhaulForSettlement.estimatedMiles} mi</dd>
              </dl>
            </section>
          )}
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

          {(settlement.settlement_hold ||
            settlement.status === "Draft" ||
            proofReview.recommendHold) && (
            <section
              id="stl-settlement-review"
              className="rounded-lg border border-teal-800/45 bg-teal-950/25 p-4 text-sm"
            >
              <h3 className="text-base font-semibold text-teal-50">Settlement review</h3>
              <p className="mt-1 text-slate-300">
                <span className="font-medium text-white">{settlement.driver_name}</span>{" "}
                <span className="font-mono text-slate-400">{settlement.driver_id}</span>
              </p>
              <p className="mt-2 font-mono text-xs text-slate-400">
                {settlement.period_start} → {settlement.period_end}
              </p>
              <p className="mt-2 text-lg font-semibold text-teal-200">
                Net {formatPayrollCurrency(settlement.net_pay)}
              </p>
              {settlement.settlement_hold_reason ? (
                <p className="mt-2 text-amber-100/95">
                  <span className="font-semibold text-amber-200">Hold / review reason:</span>{" "}
                  {settlement.settlement_hold_reason}
                </p>
              ) : null}
              {proofReview.messages.length > 0 ? (
                <div className="mt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Proof / documents needed
                  </p>
                  <ul className="mt-1 list-inside list-disc text-slate-200">
                    {proofReview.messages.map((m) => (
                      <li key={m}>{m}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <p className="mt-3 text-xs text-slate-400">
                Recommended: clear proof gaps on linked loads, then mark ready for export or clear
                the settlement hold from payroll controls below.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/drivers/${settlement.driver_id}/settlements`}
                  className="rounded border border-teal-700 bg-teal-950/40 px-3 py-2 text-sm font-medium text-teal-50 hover:bg-teal-900/45"
                >
                  Open settlement page
                </Link>
                <Link
                  href={`/drivers/${settlement.driver_id}`}
                  className="rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
                >
                  Open driver
                </Link>
                {uniqueLoadIds[0] ? (
                  <>
                    <Link
                      href={`/dispatch?loadId=${encodeURIComponent(uniqueLoadIds[0])}&driverId=${encodeURIComponent(settlement.driver_id)}`}
                      className="rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
                    >
                      Open dispatch load
                    </Link>
                    <Link
                      href={`/loads/${encodeURIComponent(uniqueLoadIds[0])}`}
                      className="rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
                    >
                      Open load proof packet
                    </Link>
                  </>
                ) : null}
                <Link
                  href={`/drivers/${settlement.driver_id}/vault`}
                  className="rounded border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-slate-100 hover:bg-slate-800"
                >
                  Open documentation bundle
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    markSettlementReviewedDemo(settlement.settlement_id);
                  }}
                  className="rounded border border-slate-500 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900"
                >
                  Mark reviewed (demo)
                </button>
              </div>
            </section>
          )}

          <section>
            <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-200">Source load packet</h3>
              <button
                type="button"
                className="text-xs font-medium text-teal-400 hover:text-teal-300"
                onClick={() => setShowAdvancedPacket((v) => !v)}
              >
                {showAdvancedPacket ? "Hide" : "Show"} trip packet checklist
              </button>
            </div>
            <p className="mb-3 text-sm text-slate-400">
              Readiness summary per load. Use dispatch and load proof for the authoritative document
              library — this panel stays compact on purpose.
            </p>
            <div className="space-y-3">
              {uniqueLoadIds.map((lid) => {
                const snap = loads.find((x) => x.load_id === lid);
                if (!snap) return null;
                const bofLoad = data.loads.find((l) => l.id === lid);
                const packet = getLoadDocumentPacket(data, lid);
                const signal = proofSignalLabel(
                  snap.proof_status,
                  snap.settlement_hold,
                  snap.exception_flag
                );
                const podLabel = bofLoad?.podStatus
                  ? String(bofLoad.podStatus)
                  : proofTypeStatus(data, lid, "pod");
                const claimLabel =
                  snap.insurance_claim_needed || snap.exception_flag ? "Review" : "None";
                return (
                  <div
                    key={lid}
                    className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-base text-teal-300">{lid}</span>
                      <span
                        className={[
                          "rounded px-2 py-0.5 text-xs font-medium",
                          proofChipClass(snap.proof_status),
                        ].join(" ")}
                      >
                        Proof {snap.proof_status}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-400">{snap.customer_name}</p>
                    <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                      <div className="flex justify-between gap-2 border-b border-slate-800/80 py-1">
                        <dt className="text-slate-500">POD</dt>
                        <dd className="font-medium text-slate-100">{podLabel}</dd>
                      </div>
                      <div className="flex justify-between gap-2 border-b border-slate-800/80 py-1">
                        <dt className="text-slate-500">BOL stack</dt>
                        <dd className="font-medium text-slate-100">{proofTypeStatus(data, lid, "bol")}</dd>
                      </div>
                      <div className="flex justify-between gap-2 border-b border-slate-800/80 py-1">
                        <dt className="text-slate-500">Invoice</dt>
                        <dd className="font-medium text-slate-100">{proofTypeStatus(data, lid, "invoice")}</dd>
                      </div>
                      <div className="flex justify-between gap-2 border-b border-slate-800/80 py-1">
                        <dt className="text-slate-500">Lumper / accessorial</dt>
                        <dd className="font-medium text-slate-100">{proofTypeStatus(data, lid, "lumper")}</dd>
                      </div>
                      <div className="flex justify-between gap-2 border-b border-slate-800/80 py-1">
                        <dt className="text-slate-500">Seal / proof</dt>
                        <dd className="font-medium text-slate-100">{bofLoad?.sealStatus ?? "—"}</dd>
                      </div>
                      <div className="flex justify-between gap-2 border-b border-slate-800/80 py-1">
                        <dt className="text-slate-500">Claim / exception</dt>
                        <dd className="font-medium text-slate-100">{claimLabel}</dd>
                      </div>
                    </dl>
                    {packet?.holdReason ? (
                      <p className="mt-2 text-xs text-amber-100/90">{packet.holdReason}</p>
                    ) : null}
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
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link
                        href={`/dispatch?loadId=${encodeURIComponent(lid)}&driverId=${encodeURIComponent(settlement.driver_id)}`}
                        className="text-sm font-medium text-teal-400 hover:text-teal-300"
                      >
                        View dispatch load →
                      </Link>
                      <Link
                        href={`/loads/${encodeURIComponent(lid)}`}
                        className="text-sm font-medium text-teal-400 hover:text-teal-300"
                      >
                        Open load proof packet →
                      </Link>
                      <Link
                        href={`/drivers/${settlement.driver_id}/vault`}
                        className="text-sm font-medium text-teal-400 hover:text-teal-300"
                      >
                        Open documentation bundle →
                      </Link>
                    </div>
                    {showAdvancedPacket && packet && (
                      <p className="mt-3 text-xs text-slate-500">
                        Trip packet: {packet.tripValidation ? `${packet.tripValidation.readyCount}/${packet.tripValidation.requiredCount} required items ready` : "No trip validation snapshot"}.
                        Full checklist lives on the load record.
                      </p>
                    )}
                  </div>
                );
              })}
              {uniqueLoadIds.length === 0 && (
                <p className="text-sm text-slate-500">
                  No load-linked lines — proof readiness is N/A for this settlement.
                </p>
              )}
            </div>
          </section>

          {operatingDocsByLoad.some((row) => row.docs.length > 0 || row.holdNoticePath) && (
            <section className="rounded-lg border border-slate-800 bg-slate-900/35 p-3">
              <h3 className="text-sm font-semibold text-slate-200">Operating documents</h3>
              <p className="mt-1 text-xs text-slate-400">
                Manifest-backed settlement and factoring documents for linked loads.
              </p>
              <div className="mt-3 space-y-2">
                {operatingDocsByLoad.map((row) => {
                  if (!row.docs.length && !row.holdNoticePath) return null;
                  return (
                    <div key={row.loadId} className="rounded border border-slate-800 bg-slate-950/50 p-2">
                      <p className="text-xs font-semibold text-slate-300">{row.loadId}</p>
                      <div className="mt-1 flex flex-wrap gap-3">
                        {row.docs.map((doc) => (
                          <a
                            key={doc.id}
                            href={getOperatingDocumentPath(doc)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bof-link-secondary"
                          >
                            {getOperatingDocumentTitle(doc)}
                          </a>
                        ))}
                        {row.holdNoticePath ? (
                          <a
                            href={row.holdNoticePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bof-link-secondary"
                          >
                            Settlement Hold Notice
                          </a>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <BofWorkflowFormShortcuts
            context="settlement"
            entityId={settlement.settlement_id}
            settlementId={settlement.settlement_id}
            title="Settlement & billing — open forms here"
          />
          <BofTemplateUsageSurface
            context="settlement_billing"
            entityId={settlement.settlement_id}
            linkedLoadIds={linkedLoadIdsForTemplateUsage}
            title="BOF Template Usage — Billing / Settlement"
            subtitle="Billing packet, settlement hold, and linked proof templates for this settlement."
          />
        </div>

        <footer className="shrink-0 space-y-2 border-t border-slate-800 bg-slate-950/95 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Actions
          </p>
          {billingRfidGate.level === "hard_block" && (
            <p className="text-xs text-amber-200/90">
              Export held: {billingRfidGate.reason}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={readyDisabled}
              title={
                billingRfidGate.level === "hard_block"
                  ? `${billingRfidGate.label}: ${billingRfidGate.reason}`
                  : undefined
              }
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
