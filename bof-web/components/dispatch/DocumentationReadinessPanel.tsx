"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ClipboardCheck,
  FileOutput,
  FolderOpen,
  Package,
  Scale,
} from "lucide-react";
import type { Load } from "@/types/dispatch";
import {
  computeDocumentationReadiness,
  documentationLineBadgeClass,
  overallPacketBadgeClass,
  type DocumentationReadinessLine,
} from "@/lib/documentation-readiness";
import { useDispatchDashboardStore } from "@/lib/stores/dispatch-dashboard-store";

type Props = {
  load: Load;
};

function firstBundleUrl(load: Load): string | null {
  return (
    load.rate_con_url ||
    load.bol_url ||
    load.pod_url ||
    load.invoice_url ||
    null
  );
}

export function DocumentationReadinessPanel({ load }: Props) {
  const report = useMemo(() => computeDocumentationReadiness(load), [load]);
  const setSettlementHold = useDispatchDashboardStore(
    (s) => s.setSettlementHold
  );
  const [notice, setNotice] = useState<string | null>(null);

  const showClaimZone = load.exception_flag || load.insurance_claim_needed;

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <ClipboardCheck className="h-3.5 w-3.5 text-teal-500" />
            Documentation readiness
          </h3>
          <p className="mt-1 max-w-2xl text-xs text-slate-500">
            Shipper packet checklist — rate con, BOL, POD, billing, seal &amp;
            cargo proof, lumper (when required), and exception / claim file
            status. BOF drives packet rules; linked files are demo artifacts only.
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Overall packet
          </p>
          <span
            className={[
              "mt-1 inline-flex rounded px-2 py-0.5 text-xs font-semibold",
              overallPacketBadgeClass(report.overall),
            ].join(" ")}
          >
            {report.overall}
          </span>
          <p className="mt-1 max-w-[220px] text-[11px] text-slate-400">
            {report.overallDetail}
          </p>
        </div>
      </div>

      {notice && (
        <div className="mb-3 rounded border border-teal-800/50 bg-teal-950/25 px-3 py-2 text-xs text-teal-100">
          {notice}
        </div>
      )}

      {report.suggestedSettlementHold && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded border border-amber-900/40 bg-amber-950/20 px-3 py-2 text-xs text-amber-100">
          <span>
            {load.settlement_hold
              ? "Settlement hold is on — documentation does not yet support release."
              : "BOF recommends a settlement hold until the packet is complete or the claim path is cleared."}
          </span>
          {!load.settlement_hold && (
            <button
              type="button"
              onClick={() =>
                setSettlementHold(
                  load.load_id,
                  true,
                  report.suggestedSettlementHoldReason
                )
              }
              className="shrink-0 rounded border border-amber-700 bg-amber-950/40 px-2 py-1 text-[11px] font-medium text-amber-50 hover:bg-amber-900/50"
            >
              Apply documentation hold
            </button>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded border border-slate-800">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-slate-950/80 text-[10px] uppercase tracking-wide text-slate-500">
            <tr>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">
                Item
              </th>
              <th className="border-b border-slate-800 px-3 py-2 font-medium">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="text-slate-200">
            {report.lines.map((line) => (
              <ReadinessRow key={line.key} line={line} />
            ))}
          </tbody>
        </table>
      </div>

      {report.missingRequired.length > 0 && (
        <div className="mt-3 rounded border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-300">
          <span className="font-semibold text-slate-400">Missing for packet: </span>
          {report.missingRequired.join(", ")}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-800 pt-4">
        <button
          type="button"
          onClick={() => {
            if (report.overall === "Ready") {
              setNotice(
                "Demo: BOF would compile a shipper packet index (PDF cover + TOC) from linked artifacts and e-sign queue."
              );
            } else {
              setNotice(
                `Demo: packet blocked (${report.overall}). Resolve: ${report.missingRequired.join(", ") || report.overallDetail}.`
              );
            }
          }}
          className="inline-flex items-center gap-1.5 rounded border border-teal-600 bg-teal-900/30 px-3 py-1.5 text-xs font-medium text-teal-50 hover:bg-teal-900/50"
        >
          <FileOutput className="h-3.5 w-3.5" aria-hidden />
          Generate shipper packet
        </button>
        <button
          type="button"
          onClick={() => {
            const u = firstBundleUrl(load);
            if (u) window.open(u, "_blank", "noopener,noreferrer");
            else setNotice("No linked documents to open.");
          }}
          className="inline-flex items-center gap-1.5 rounded border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-800"
        >
          <FolderOpen className="h-3.5 w-3.5" aria-hidden />
          Open documentation bundle
        </button>
        <button
          type="button"
          onClick={() => {
            if (load.invoice_url)
              window.open(load.invoice_url, "_blank", "noopener,noreferrer");
            else setNotice("Invoice not linked on this load.");
          }}
          className="inline-flex items-center gap-1.5 rounded border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-800"
        >
          <Scale className="h-3.5 w-3.5" aria-hidden />
          Prepare billing packet
        </button>
        {showClaimZone && (
          <button
            type="button"
            onClick={() => {
              const u =
                load.claim_form_url ||
                load.damage_photo_url ||
                load.supporting_attachment_url;
              if (u) window.open(u, "_blank", "noopener,noreferrer");
              setNotice(
                report.claimPacketReady
                  ? "Demo: claim packet artifacts linked — BOF would route to claims desk / insurer intake."
                  : "Demo: claim packet incomplete — attach carrier claim form, damage photos, and supporting correspondence."
              );
            }}
            className="inline-flex items-center gap-1.5 rounded border border-rose-800/60 bg-rose-950/35 px-3 py-1.5 text-xs font-medium text-rose-100 hover:bg-rose-950/55"
          >
            <Package className="h-3.5 w-3.5" aria-hidden />
            Prepare claim packet
          </button>
        )}
      </div>

      {showClaimZone && (
        <div className="mt-4 rounded border border-rose-900/35 bg-slate-950/50 p-3">
          <h4 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-rose-200/90">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            Exception / claim support
          </h4>
          <dl className="mt-2 space-y-2 text-xs text-slate-300">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Claim needed</dt>
              <dd className="font-medium text-slate-100">
                {load.insurance_claim_needed ? "Yes" : "No"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Claim packet</dt>
              <dd>
                <span
                  className={[
                    "inline-flex rounded px-2 py-0.5 text-[11px] font-medium",
                    report.claimPacketReady
                      ? documentationLineBadgeClass("Ready")
                      : documentationLineBadgeClass("Incomplete"),
                  ].join(" ")}
                >
                  {report.claimPacketReady ? "Ready" : "Incomplete"}
                </span>
              </dd>
            </div>
            {load.exception_reason && (
              <div className="rounded border border-slate-800 bg-slate-900/60 p-2 text-slate-200">
                <span className="font-semibold text-slate-500">Exception: </span>
                {load.exception_reason}
              </div>
            )}
            {report.missingRequired.length > 0 && (
              <div className="text-slate-400">
                <span className="font-semibold text-slate-500">Proof gaps: </span>
                {report.missingRequired.join(", ")}
              </div>
            )}
            <div className="text-[11px] text-slate-500">
              Supporting claim links live in the Documents library under
              &quot;Exception / claim support&quot;.
            </div>
          </dl>
        </div>
      )}
    </section>
  );
}

function ReadinessRow({ line }: { line: DocumentationReadinessLine }) {
  return (
    <tr className="border-b border-slate-800/80 last:border-b-0">
      <td className="px-3 py-2 align-top text-slate-200">{line.label}</td>
      <td className="px-3 py-2 align-top">
        <span
          className={[
            "inline-flex rounded px-2 py-0.5 text-[11px] font-semibold",
            documentationLineBadgeClass(line.status),
          ].join(" ")}
        >
          {line.status}
        </span>
        {line.detail && (
          <p className="mt-1 text-[11px] text-slate-500">{line.detail}</p>
        )}
      </td>
    </tr>
  );
}
