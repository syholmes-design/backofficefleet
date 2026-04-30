"use client";

import { Fragment, useMemo, useState } from "react";
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
} from "@/lib/documentation-readiness";
import { useDispatchDashboardStore } from "@/lib/stores/dispatch-dashboard-store";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { getLoadDocumentPacket } from "@/lib/load-proof";

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
  const { data } = useBofDemoData();
  const report = useMemo(() => computeDocumentationReadiness(load), [load]);
  const packet = useMemo(
    () => getLoadDocumentPacket(data, load.load_id),
    [data, load.load_id]
  );
  const packetMap = useMemo(
    () => new Map((packet?.documents ?? []).map((d) => [d.label, d])),
    [packet]
  );
  const drawerRows = useMemo(() => {
    const pick = (label: string, fallbackStatus: string, fallbackDetail?: string) => {
      const item = packetMap.get(label);
      if (!item) {
        return {
          key: label,
          label,
          status: "Missing",
          href: undefined as string | undefined,
          detail: fallbackDetail || "Generated document not found",
          ready: false,
        };
      }
      const ready = item.status === "ready" && Boolean(item.url);
      return {
        key: label,
        label,
        status:
          label === "Claim packet" && item.requiredForClaimRelease && !ready
            ? "Claim Required"
            : item.status === "ready"
              ? "Ready"
              : item.status === "missing"
                ? "Missing"
                : item.status === "pending"
                  ? "Pending"
                  : item.status === "not_applicable"
                    ? "Not applicable"
                    : "Blocked",
        href: ready ? item.url : undefined,
        detail:
          item.note ||
          (!ready && item.status === "ready"
            ? "Generated document not found"
            : fallbackDetail),
        ready,
      };
    };
    return [
      { section: "Core Documents", ...pick("Rate Confirmation", "Missing") },
      { section: "Core Documents", ...pick("BOL", "Missing") },
      { section: "Core Documents", ...pick("POD", "Missing") },
      { section: "Core Documents", ...pick("Invoice", "Missing") },
      { section: "Proof & Evidence", ...pick("Cargo photo", "Missing") },
      { section: "Proof & Evidence", ...pick("Seal photo", "Missing") },
      { section: "Proof & Evidence", ...pick("Equipment photo", "Missing") },
      { section: "Proof & Evidence", ...pick("Pickup photo", "Missing") },
      { section: "Proof & Evidence", ...pick("Seal pickup photo", "Missing") },
      { section: "Proof & Evidence", ...pick("Seal delivery photo", "Missing") },
      { section: "Proof & Evidence", ...pick("Lumper receipt", "Not applicable") },
      { section: "Proof & Evidence", ...pick("RFID / geo proof", "Pending") },
      { section: "Proof & Evidence", ...pick("Seal verification sheet", "Missing") },
      { section: "Exceptions / Claims", ...pick("Claim packet", "Claim Required") },
      { section: "Exceptions / Claims", ...pick("Damage / claim photo", "Not applicable") },
      { section: "Exceptions / Claims", ...pick("Safety violation photo", "Not applicable") },
    ];
  }, [packetMap]);

  const groupedRows = useMemo(() => {
    const groups = ["Core Documents", "Proof & Evidence", "Exceptions / Claims"] as const;
    return groups.map((section) => ({
      section,
      rows: drawerRows.filter((r) => r.section === section),
    }));
  }, [drawerRows]);
  const setSettlementHold = useDispatchDashboardStore(
    (s) => s.setSettlementHold
  );
  const setLoadDocumentUrls = useDispatchDashboardStore(
    (s) => s.setLoadDocumentUrls
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<"shipper" | "billing" | "claim" | null>(null);

  async function postGenerate<T extends Record<string, unknown>>(
    path: string,
    payload: Record<string, unknown>
  ): Promise<T> {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as T & { ok?: boolean; error?: string };
    if (!res.ok || data.ok === false) {
      throw new Error(data.error || `Generation failed (${res.status})`);
    }
    return data as T;
  }

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
          {(load.source_intake_id ||
            load.intake_signed_bol_required ||
            load.intake_signed_pod_required ||
            load.intake_delivery_photos_required ||
            load.intake_seal_verification_required) && (
            <div className="mt-3 max-w-2xl rounded border border-amber-800/40 bg-amber-950/20 px-3 py-2 text-xs text-amber-100/90">
              <p className="font-semibold text-amber-200/95">Intake Engine stamp</p>
              <p className="mt-1 text-[11px] text-amber-100/75">
                Source intake{" "}
                <span className="font-mono text-amber-100">{load.source_intake_id ?? "—"}</span>
                {" · "}
                proof flags:{" "}
                {[
                  load.intake_signed_bol_required ? "signed BOL" : null,
                  load.intake_signed_pod_required ? "signed POD" : null,
                  load.intake_delivery_photos_required ? "delivery photos" : null,
                  load.intake_seal_verification_required ? "seal check" : null,
                ]
                  .filter(Boolean)
                  .join(", ") || "packet logged"}
              </p>
            </div>
          )}
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
              <th className="border-b border-slate-800 px-3 py-2 font-medium">
                Link
              </th>
            </tr>
          </thead>
          <tbody className="text-slate-200">
            {groupedRows.map((group) => (
              <Fragment key={group.section}>
                <tr className="border-b border-slate-800 bg-slate-950/65">
                  <td colSpan={3} className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    {group.section}
                  </td>
                </tr>
                {group.rows.map((line) => (
                  <ReadinessRow
                    key={line.key}
                    line={{
                      key: line.key,
                      label: line.label,
                      status:
                        line.status === "Ready"
                          ? "Ready"
                          : line.status === "Missing"
                            ? "Missing"
                            : line.status === "Pending"
                              ? "Incomplete"
                              : line.status === "Not applicable"
                                ? "Not applicable"
                                : "Claim Required",
                      detail: line.detail,
                    }}
                    href={line.href}
                    viewLabel={line.label.toLowerCase().includes("photo") ? "View photo" : "Open"}
                  />
                ))}
              </Fragment>
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
          disabled={busy !== null}
          onClick={() => {
            setBusy("shipper");
            void (async () => {
              try {
                const basePayload = {
                  loadId: load.load_id,
                };
                const bol = await postGenerate<{
                  generatedUrl: string;
                  publicUrl?: string;
                }>("/api/generate/bol", {
                  ...basePayload,
                  bol_date: load.pickup_datetime,
                  shipper_name: load.origin,
                  consignee_name: load.destination,
                });
                const pod = await postGenerate<{
                  generatedUrl: string;
                  publicUrl?: string;
                }>("/api/generate/pod", {
                  ...basePayload,
                  delivery_date: load.delivery_datetime,
                  delivery_location: load.destination,
                });
                setLoadDocumentUrls(load.load_id, {
                  bol_url: bol.publicUrl || bol.generatedUrl,
                  pod_url: pod.publicUrl || pod.generatedUrl,
                });
                setNotice(
                  "Generated BOL + POD packet docs and linked them to this load."
                );
              } catch (err) {
                setNotice(
                  `Could not generate shipper packet docs: ${
                    err instanceof Error ? err.message : "Unknown error"
                  }`
                );
              } finally {
                setBusy(null);
              }
            })();
          }}
          className="inline-flex items-center gap-1.5 rounded border border-teal-600 bg-teal-900/30 px-3 py-1.5 text-xs font-medium text-teal-50 hover:bg-teal-900/50 disabled:opacity-50"
        >
          <FileOutput className="h-3.5 w-3.5" aria-hidden />
          {busy === "shipper" ? "Generating shipper packet..." : "Generate shipper packet"}
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
          disabled={busy !== null}
          onClick={() => {
            setBusy("billing");
            void (async () => {
              try {
                const invoice = await postGenerate<{
                  generatedUrl: string;
                  publicUrl?: string;
                }>("/api/generate/invoice", {
                  loadId: load.load_id,
                  rate: load.total_pay,
                  total: load.total_pay,
                });
                const nextUrl = invoice.publicUrl || invoice.generatedUrl;
                setLoadDocumentUrls(load.load_id, { invoice_url: nextUrl });
                window.open(nextUrl, "_blank", "noopener,noreferrer");
                setNotice("Generated invoice document and linked it to this load.");
              } catch (err) {
                setNotice(
                  `Could not generate invoice: ${
                    err instanceof Error ? err.message : "Unknown error"
                  }`
                );
              } finally {
                setBusy(null);
              }
            })();
          }}
          className="inline-flex items-center gap-1.5 rounded border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-800 disabled:opacity-50"
        >
          <Scale className="h-3.5 w-3.5" aria-hidden />
          {busy === "billing" ? "Generating invoice..." : "Prepare billing packet"}
        </button>
        {showClaimZone && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => {
              setBusy("claim");
              void (async () => {
                try {
                  const claim = await postGenerate<{
                    generatedUrl: string;
                    publicUrl?: string;
                    metadata?: {
                      relatedDocuments?: Array<{
                        type?: string;
                        generatedUrl?: string;
                        publicUrl?: string;
                      }>;
                    };
                  }>("/api/generate/claims", {
                    loadId: load.load_id,
                    description: load.exception_reason || "Dispatch claim review",
                  });
                  const related = claim.metadata?.relatedDocuments ?? [];
                  const evidence = related.find((r) =>
                    String(r.type || "").toLowerCase().includes("evidence")
                  );
                  const damage = related.find((r) =>
                    String(r.type || "").toLowerCase().includes("damage")
                  );
                  const claimUrl = claim.publicUrl || claim.generatedUrl;
                  setLoadDocumentUrls(load.load_id, {
                    claim_form_url: claimUrl,
                    supporting_attachment_url:
                      evidence?.publicUrl || evidence?.generatedUrl || load.supporting_attachment_url,
                    damage_photo_url:
                      damage?.publicUrl || damage?.generatedUrl || load.damage_photo_url,
                  });
                  window.open(claimUrl, "_blank", "noopener,noreferrer");
                  setNotice("Generated claims packet artifacts and linked them to this load.");
                } catch (err) {
                  const msg =
                    err instanceof Error ? err.message : "Unknown error";
                  setNotice(
                    /unknown incidentid|missing or unknown incidentid/i.test(msg)
                      ? "Could not generate claim packet: no claim incident is linked to this load/driver in current demo data."
                      : `Could not generate claim packet: ${msg}`
                  );
                } finally {
                  setBusy(null);
                }
              })();
            }}
            className="inline-flex items-center gap-1.5 rounded border border-rose-800/60 bg-rose-950/35 px-3 py-1.5 text-xs font-medium text-rose-100 hover:bg-rose-950/55 disabled:opacity-50"
          >
            <Package className="h-3.5 w-3.5" aria-hidden />
            {busy === "claim" ? "Generating claim packet..." : "Prepare claim packet"}
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

function ReadinessRow({
  line,
  href,
  viewLabel,
}: {
  line: {
    key: string;
    label: string;
    status: "Ready" | "Missing" | "Incomplete" | "Claim Required" | "Not applicable";
    detail?: string;
  };
  href?: string;
  viewLabel?: string;
}) {
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
      <td className="px-3 py-2 align-top">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-teal-300 hover:text-teal-200"
          >
            {viewLabel || "Open"}
          </a>
        ) : (
          <span className="text-xs text-slate-500">Missing / Needs review</span>
        )}
      </td>
    </tr>
  );
}
