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
import {
  buildTripDocumentPacket,
  filingReadinessLabel,
  groupTripPacketRows,
  tripPacketUiLabel,
} from "@/lib/load-trip-packet";
import type { TripPacketRow } from "@/lib/load-trip-packet";
import { evaluateLoadPacketReadiness } from "@/lib/load-packet-readiness";
import {
  EvidencePhotoViewer,
  isLoadEvidenceImageUrl,
} from "@/components/evidence/EvidencePhotoViewer";
import { ProofGapReviewLinks } from "@/components/review/ReviewDeepLinks";

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

function firstManifestBackedDocUrl(
  load: Load,
  trip: ReturnType<typeof buildTripDocumentPacket> | null
): string | null {
  const direct = firstBundleUrl(load);
  if (direct) return direct;
  if (!trip) return null;
  const order = ["rate_confirmation", "bol", "pod", "invoice", "work_order"] as const;
  for (const key of order) {
    const row = trip.rows.find((r) => r.key === key);
    const u = row?.url?.trim();
    if (u && row?.status === "ready") return u;
  }
  return null;
}

function tripRowPresentation(line: TripPacketRow): {
  key: string;
  label: string;
  status: "Ready" | "Missing" | "Incomplete" | "Claim Required" | "Not applicable";
  href?: string;
  detail?: string;
  source: string;
} {
  const ready = line.status === "ready" && Boolean(line.url?.trim());
  const status: "Ready" | "Missing" | "Incomplete" | "Claim Required" | "Not applicable" =
    line.key === "claim_packet" && Boolean(line.requiredForClaimRelease) && !ready
      ? "Claim Required"
      : ready
        ? "Ready"
        : line.status === "missing"
          ? "Missing"
          : line.status === "pending"
            ? "Incomplete"
            : line.status === "not_applicable"
              ? "Not applicable"
              : "Incomplete";
  const srcRaw = line.source;
  const source =
    srcRaw === "missing"
      ? "Missing"
      : srcRaw === "ai_generated"
        ? "AI demo evidence"
        : srcRaw === "svg_demo" || srcRaw === "generated"
          ? "Demo SVG evidence"
          : srcRaw === "rfid"
            ? "RFID"
            : srcRaw
              ? "Evidence"
              : "Missing";
  return {
    key: line.key,
    label: line.label,
    status,
    href: ready ? line.url : undefined,
    detail: line.note,
    source,
  };
}

export function DocumentationReadinessPanel({ load }: Props) {
  const { data } = useBofDemoData();
  const report = useMemo(() => computeDocumentationReadiness(load), [load]);
  const trip = useMemo(() => buildTripDocumentPacket(data, load.load_id), [data, load.load_id]);
  const groupedRows = useMemo(
    () => groupTripPacketRows(trip, { hideNotApplicable: true }),
    [trip]
  );
  const packetReadiness = useMemo(
    () => evaluateLoadPacketReadiness(data, load.load_id),
    [data, load.load_id]
  );
  const claimPacketReadiness = useMemo(
    () => packetReadiness.find((p) => p.packetType === "claim"),
    [packetReadiness]
  );
  const delivered = load.status?.toLowerCase() === "delivered";
  const validation = trip?.validation;

  const setSettlementHold = useDispatchDashboardStore(
    (s) => s.setSettlementHold
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [referenceOpen, setReferenceOpen] = useState(false);

  const showClaimZone = load.exception_flag || load.insurance_claim_needed;

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <ClipboardCheck className="h-3.5 w-3.5 text-teal-500" />
            Trip Document Packet
          </h3>
          <p className="mt-1 max-w-2xl text-xs text-slate-500">
            Single manifest-backed packet per load — core docs, proof &amp; media,
            exceptions when applicable, and reference templates. No duplicate rows;
            Open only when a real file URL exists.
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
          {validation && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex rounded border border-slate-700 bg-slate-950/80 px-2 py-1 text-[11px] font-semibold text-slate-100">
                {tripPacketUiLabel(validation.status)}
              </span>
              <span className="inline-flex rounded border border-slate-700 bg-slate-950/80 px-2 py-1 text-[11px] text-slate-200">
                Ready {validation.readyCount}/{validation.requiredCount}
              </span>
              <span className="inline-flex rounded border border-slate-700 bg-slate-950/80 px-2 py-1 text-[11px] text-slate-200">
                Filing: {filingReadinessLabel(validation, delivered)}
              </span>
              {delivered && (
                <span className="inline-flex rounded border border-slate-700 bg-slate-950/80 px-2 py-1 text-[11px] text-slate-300">
                  Delivered checklist:{" "}
                  {validation.status === "complete" ? "Complete" : validation.recommendedAction}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Dispatch readiness (URL stamps)
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
              <th className="border-b border-slate-800 px-3 py-2 font-medium">
                Source
              </th>
            </tr>
          </thead>
          <tbody className="text-slate-200">
            {groupedRows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-sm text-slate-500">
                  No trip packet rows to display for this load.
                </td>
              </tr>
            )}
            {groupedRows.map((group) => (
              <Fragment key={group.group}>
                {group.group === "reference" && !referenceOpen ? (
                  <tr className="border-b border-slate-800 bg-slate-950/65">
                    <td colSpan={4} className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => setReferenceOpen(true)}
                        className="text-left text-[11px] font-semibold uppercase tracking-wide text-teal-300 hover:text-teal-200"
                      >
                        Reference Documents ({group.rows.length}) — show
                      </button>
                    </td>
                  </tr>
                ) : (
                  <>
                    <tr className="border-b border-slate-800 bg-slate-950/65">
                      <td colSpan={4} className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                        {group.label}
                        {group.group === "reference" && referenceOpen && (
                          <button
                            type="button"
                            onClick={() => setReferenceOpen(false)}
                            className="ml-3 text-[10px] font-normal normal-case text-teal-400 hover:text-teal-300"
                          >
                            Hide
                          </button>
                        )}
                      </td>
                    </tr>
                    {group.rows.map((row) => {
                      const line = tripRowPresentation(row);
                      return (
                        <ReadinessRow
                          key={line.key}
                          loadId={load.load_id}
                          driverId={load.driver_id}
                          line={{
                            key: line.key,
                            label: line.label,
                            status: line.status,
                            detail: line.detail,
                          }}
                          href={line.href}
                          source={line.source}
                          viewLabel={
                            row.group === "proof" || /photo/i.test(row.label)
                              ? "View photo"
                              : "Open"
                          }
                        />
                      );
                    })}
                  </>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {(validation?.missingRequiredLabels.length ?? 0) > 0 && (
        <div className="mt-3 rounded border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-300">
          <span className="font-semibold text-slate-400">Missing required (delivered): </span>
          {validation!.missingRequiredLabels.join(", ")}
        </div>
      )}
      {report.missingRequired.length > 0 && (
        <div className="mt-3 rounded border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-300">
          <span className="font-semibold text-slate-400">Dispatch intake gaps: </span>
          {report.missingRequired.join(", ")}
        </div>
      )}

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {packetReadiness.map((p) => (
          <div
            key={p.packetType}
            className="rounded border border-slate-800 bg-slate-950/50 p-2 text-[11px] text-slate-300"
          >
            <div className="font-semibold capitalize text-slate-200">{p.packetType} packet</div>
            <div className="mt-0.5 text-slate-400">{p.status.replace(/_/g, " ")}</div>
            {p.missingItems.length > 0 && (
              <p className="mt-1 text-amber-200/90">Missing: {p.missingItems.join(", ")}</p>
            )}
            {p.status !== "ready" && p.status !== "not_applicable" && (
              <p className="mt-1 text-slate-500">{p.recommendedAction}</p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-800 pt-4">
        {(() => {
          const shipper = packetReadiness.find((x) => x.packetType === "shipper");
          const billing = packetReadiness.find((x) => x.packetType === "billing");
          const insurance = packetReadiness.find((x) => x.packetType === "insurance");
          const claimPack = packetReadiness.find((x) => x.packetType === "claim");
          const openOrExplain = (label: string, pack: typeof shipper) => {
            if (!pack) return;
            if (pack.status === "not_applicable") {
              setNotice(`${label}: not applicable for this load.`);
              return;
            }
            if (pack.status !== "ready" || !pack.outputUrl) {
              setNotice(
                `${label} incomplete — ${pack.missingItems.length ? pack.missingItems.join(", ") : pack.recommendedAction}`
              );
              return;
            }
            window.open(pack.outputUrl, "_blank", "noopener,noreferrer");
          };
          return (
            <>
              <button
                type="button"
                disabled={shipper?.status !== "ready"}
                title={
                  shipper?.status === "ready"
                    ? "Open shipper packet index (manifest-backed links)"
                    : shipper?.missingItems.join(", ") || shipper?.recommendedAction
                }
                onClick={() => openOrExplain("Shipper packet", shipper)}
                className="inline-flex items-center gap-1.5 rounded border border-teal-600 bg-teal-900/30 px-3 py-1.5 text-xs font-medium text-teal-50 hover:bg-teal-900/50 disabled:opacity-50"
              >
                <FileOutput className="h-3.5 w-3.5" aria-hidden />
                {shipper?.status === "ready" ? "Open shipper packet" : "Shipper packet (incomplete)"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const u = firstManifestBackedDocUrl(load, trip);
                  if (u) window.open(u, "_blank", "noopener,noreferrer");
                  else
                    setNotice(
                      "No linked documents to open — complete core trip rows or apply manifest-backed URLs."
                    );
                }}
                className="inline-flex items-center gap-1.5 rounded border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-800"
              >
                <FolderOpen className="h-3.5 w-3.5" aria-hidden />
                Open documentation bundle
              </button>
              <button
                type="button"
                disabled={billing?.status !== "ready"}
                title={
                  billing?.status === "ready"
                    ? "Open billing packet index"
                    : billing?.missingItems.join(", ") || billing?.recommendedAction
                }
                onClick={() => openOrExplain("Billing packet", billing)}
                className="inline-flex items-center gap-1.5 rounded border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-800 disabled:opacity-50"
              >
                <Scale className="h-3.5 w-3.5" aria-hidden />
                {billing?.status === "ready" ? "Open billing packet" : "Billing packet (incomplete)"}
              </button>
              {showClaimZone && (
                <>
                  <button
                    type="button"
                    disabled={insurance?.status !== "ready"}
                    title={
                      insurance?.status === "ready"
                        ? "Open insurance packet index"
                        : insurance?.missingItems.join(", ") || insurance?.recommendedAction
                    }
                    onClick={() => openOrExplain("Insurance packet", insurance)}
                    className="inline-flex items-center gap-1.5 rounded border border-slate-600 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-800 disabled:opacity-50"
                  >
                    <FileOutput className="h-3.5 w-3.5" aria-hidden />
                    {insurance?.status === "ready"
                      ? "Open insurance packet"
                      : "Insurance packet (incomplete)"}
                  </button>
                  <button
                    type="button"
                    disabled={claimPack?.status !== "ready"}
                    title={
                      claimPack?.status === "ready"
                        ? "Open claim packet bundle index"
                        : claimPack?.missingItems.join(", ") || claimPack?.recommendedAction
                    }
                    onClick={() => openOrExplain("Claim packet", claimPack)}
                    className="inline-flex items-center gap-1.5 rounded border border-rose-800/60 bg-rose-950/35 px-3 py-1.5 text-xs font-medium text-rose-100 hover:bg-rose-950/55 disabled:opacity-50"
                  >
                    <Package className="h-3.5 w-3.5" aria-hidden />
                    {claimPack?.status === "ready"
                      ? "Open claim packet"
                      : "Claim packet (incomplete)"}
                  </button>
                </>
              )}
            </>
          );
        })()}
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
                    claimPacketReadiness?.status === "ready"
                      ? documentationLineBadgeClass("Ready")
                      : claimPacketReadiness?.status === "not_applicable"
                        ? documentationLineBadgeClass("Not applicable")
                        : documentationLineBadgeClass("Incomplete"),
                  ].join(" ")}
                >
                  {claimPacketReadiness?.status === "ready"
                    ? "Ready"
                    : claimPacketReadiness?.status === "not_applicable"
                      ? "Not applicable"
                      : "Incomplete"}
                </span>
              </dd>
            </div>
            {claimPacketReadiness &&
              claimPacketReadiness.status !== "ready" &&
              claimPacketReadiness.status !== "not_applicable" &&
              claimPacketReadiness.missingItems.length > 0 && (
                <div className="rounded border border-rose-900/30 bg-rose-950/20 p-2 text-[11px] text-rose-100/90">
                  <span className="font-semibold text-rose-200/95">Manifest gaps: </span>
                  {claimPacketReadiness.missingItems.join("; ")}
                </div>
              )}
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
  loadId,
  driverId,
  line,
  href,
  source,
  viewLabel,
}: {
  loadId: string;
  driverId?: string | null;
  line: {
    key: string;
    label: string;
    status: "Ready" | "Missing" | "Incomplete" | "Claim Required" | "Not applicable";
    detail?: string;
  };
  href?: string;
  source?: string;
  viewLabel?: string;
}) {
  const url = href?.trim();
  const imageReady = Boolean(url && isLoadEvidenceImageUrl(url));

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
        {imageReady && url ? (
          <EvidencePhotoViewer
            url={url}
            label={line.label}
            source={source || "Evidence"}
            loadId={loadId}
            description={line.detail}
          />
        ) : url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-teal-300 hover:text-teal-200"
          >
            {viewLabel || "Open"}
          </a>
        ) : (
          <>
            <span className="text-xs text-slate-500">Missing / Needs review</span>
            <ProofGapReviewLinks
              driverId={driverId}
              loadId={loadId}
              className="mt-1 flex flex-wrap gap-x-2 gap-y-1"
            />
          </>
        )}
      </td>
      <td className="px-3 py-2 align-top text-xs text-slate-400">{source || "Missing"}</td>
    </tr>
  );
}
