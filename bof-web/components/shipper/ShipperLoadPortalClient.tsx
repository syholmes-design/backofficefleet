"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { buildPretripTabletModel, type PretripTabletModel } from "@/lib/pretrip-tablet";
import { buildDispatchLoadsFromBofData } from "@/lib/dispatch-dashboard-seed";
import { getLoadProofItems, type LoadProofItem } from "@/lib/load-proof";
import {
  computeDocumentationReadiness,
  type OverallPacketStatus,
} from "@/lib/documentation-readiness";
import {
  listEngineDocumentsForLoad,
  type EngineDocument,
} from "@/lib/document-engine";
import {
  buildClaimPacketContext,
  isClaimPacketEligible,
} from "@/lib/claim-packet";
import { getGeneratedCrossLinksForLoad } from "@/lib/generated-documents";
import type { Load } from "@/types/dispatch";

function firstHref(...candidates: (string | undefined)[]): string | undefined {
  for (const c of candidates) {
    if (c && String(c).trim().length > 0) return c;
  }
  return undefined;
}

function docByType(docs: EngineDocument[], type: string): EngineDocument | undefined {
  return docs.find((d) => d.type === type);
}

function formatApptWindow(pickupIso: string, deliveryIso: string): string {
  try {
    const a = new Date(pickupIso);
    const b = new Date(deliveryIso);
    const o: Intl.DateTimeFormatOptions = {
      dateStyle: "medium",
      timeStyle: "short",
    };
    return `${a.toLocaleString(undefined, o)} → ${b.toLocaleString(undefined, o)}`;
  } catch {
    return "—";
  }
}

function portalPreTripStatus(model: PretripTabletModel): "Completed" | "In Progress" | "Blocked" {
  if (model.overall === "BLOCKED") return "Blocked";
  if (/delivered/i.test(model.loadStatus)) return "Completed";
  return "In Progress";
}

function dispatchEligibility(dispatchLoad: Load, pretrip: PretripTabletModel) {
  if (pretrip.overall === "BLOCKED") {
    return {
      level: "Blocked" as const,
      detail: pretrip.blockReasons.slice(0, 6).join(" · ") || "Pre-trip gate blocked",
    };
  }
  if (dispatchLoad.exception_flag && dispatchLoad.seal_status === "Mismatch") {
    return {
      level: "Blocked" as const,
      detail:
        dispatchLoad.exception_reason ??
        "Active exception with seal mismatch — dispatch blocked until resolved",
    };
  }
  const doc = computeDocumentationReadiness(dispatchLoad);
  if (dispatchLoad.insurance_claim_needed && !doc.claimPacketReady) {
    return {
      level: "At Risk" as const,
      detail: "Insurance / claim path — packet attachments incomplete",
    };
  }
  if (
    dispatchLoad.exception_flag ||
    dispatchLoad.seal_status === "Mismatch" ||
    dispatchLoad.proof_status !== "Complete"
  ) {
    return {
      level: "At Risk" as const,
      detail:
        dispatchLoad.exception_reason ??
        "Proof, seal, or exception flags require ops review before calling lane fully cleared",
    };
  }
  return { level: "Cleared" as const, detail: "No blocking flags on this snapshot" };
}

function proofByType(items: LoadProofItem[], t: string) {
  return items.find((p) => p.type === t) ?? null;
}

function photoBadge(hasAsset: boolean) {
  return hasAsset ? (
    <span className="shipper-portal-chip shipper-portal-chip-ok">Uploaded</span>
  ) : (
    <span className="shipper-portal-chip shipper-portal-chip-bad">Missing</span>
  );
}

function proofLineBadge(p: LoadProofItem | null) {
  if (!p) return <span className="shipper-portal-chip shipper-portal-chip-muted">No row</span>;
  if (p.status === "Complete") {
    return <span className="shipper-portal-chip shipper-portal-chip-ok">Complete</span>;
  }
  if (p.status === "Not required") {
    return <span className="shipper-portal-chip shipper-portal-chip-muted">N/A</span>;
  }
  if (p.status === "Pending") {
    return <span className="shipper-portal-chip shipper-portal-chip-warn">Pending</span>;
  }
  return <span className="shipper-portal-chip shipper-portal-chip-bad">Missing</span>;
}

function pretripChip(status: "Completed" | "In Progress" | "Blocked") {
  if (status === "Completed") {
    return <span className="shipper-portal-chip shipper-portal-chip-ok">Completed</span>;
  }
  if (status === "Blocked") {
    return <span className="shipper-portal-chip shipper-portal-chip-bad">Blocked</span>;
  }
  return <span className="shipper-portal-chip shipper-portal-chip-warn">In progress</span>;
}

function eligChip(level: "Cleared" | "At Risk" | "Blocked") {
  if (level === "Cleared") {
    return <span className="shipper-portal-chip shipper-portal-chip-ok">Cleared</span>;
  }
  if (level === "Blocked") {
    return <span className="shipper-portal-chip shipper-portal-chip-bad">Blocked</span>;
  }
  return <span className="shipper-portal-chip shipper-portal-chip-warn">At risk</span>;
}

function packetHeadline(overall: OverallPacketStatus): string {
  if (overall === "Ready") return "Ready";
  if (overall === "Exception" || overall === "Claim Required") {
    return "Exception / claim review needed";
  }
  return "Incomplete";
}

function ActionLink({
  label,
  href,
  newTab,
}: {
  label: string;
  href?: string;
  newTab?: boolean;
}) {
  if (!href) {
    return (
      <span className="shipper-portal-action-disabled" role="text">
        {label} (not on file)
      </span>
    );
  }
  return (
    <a
      href={href}
      {...(newTab ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {label}
    </a>
  );
}

export function ShipperLoadPortalClient({ loadId }: { loadId: string }) {
  const { data } = useBofDemoData();

  const bofLoad = useMemo(
    () => data.loads.find((l) => l.id === loadId) ?? null,
    [data.loads, loadId]
  );

  const dispatchLoad = useMemo(() => {
    return buildDispatchLoadsFromBofData(data).find((l) => l.load_id === loadId) ?? null;
  }, [data, loadId]);

  const pretrip = useMemo(() => {
    if (!bofLoad) return null;
    return buildPretripTabletModel(data, loadId);
  }, [data, loadId, bofLoad]);

  const proofItems = useMemo(() => {
    if (!bofLoad) return [];
    return getLoadProofItems(data, loadId);
  }, [data, loadId, bofLoad]);

  const engineDocs = useMemo(() => {
    if (!bofLoad) return [];
    return listEngineDocumentsForLoad(data, loadId);
  }, [data, loadId, bofLoad]);

  const docReport = useMemo(() => {
    if (!dispatchLoad) return null;
    return computeDocumentationReadiness(dispatchLoad);
  }, [dispatchLoad]);

  const claimCtx = useMemo(() => {
    if (!bofLoad || !isClaimPacketEligible(data, loadId)) return null;
    return buildClaimPacketContext(data, loadId);
  }, [data, loadId, bofLoad]);

  const genCross = useMemo(() => {
    if (!bofLoad) return null;
    return getGeneratedCrossLinksForLoad(data, loadId);
  }, [data, loadId, bofLoad]);

  const openCompliance = useMemo(() => {
    if (!bofLoad) return [];
    return data.complianceIncidents.filter(
      (c) => c.driverId === bofLoad.driverId && c.status === "OPEN"
    );
  }, [data.complianceIncidents, bofLoad]);

  if (!bofLoad || !dispatchLoad || !pretrip || !docReport) {
    return (
      <div className="bof-page shipper-portal">
        <p className="bof-muted">Load <code className="bof-code">{loadId}</code> was not found in the current BOF dataset.</p>
        <Link href="/loads" className="bof-link-secondary">
          Back to loads
        </Link>
      </div>
    );
  }

  const preStatus = portalPreTripStatus(pretrip);
  const elig = dispatchEligibility(dispatchLoad, pretrip);
  const pickupProof = proofByType(proofItems, "Pickup Seal Photo");
  const deliveryProof = proofByType(proofItems, "Delivery Seal Photo");
  const cargoProof = proofByType(proofItems, "Pre-Trip Cargo Photo");
  const sealRequired =
    Boolean(bofLoad.pickupSeal?.trim()) || Boolean(bofLoad.deliverySeal?.trim());

  const sealVerifySummary = [
    `Pickup seal photo: ${pickupProof?.status ?? "—"}`,
    `Delivery seal photo: ${deliveryProof?.status ?? "—"}`,
    `Recorded seal state: ${bofLoad.sealStatus}`,
  ].join(" · ");

  const complianceSummary =
    openCompliance.length === 0
      ? "No open compliance incidents on file for this driver."
      : `${openCompliance.length} open item(s): ${openCompliance.map((c) => c.type).join("; ")}`;

  const pretripChecklist = docByType(engineDocs, "Pre-Trip Checklist");
  const cargoRecordDoc = docByType(engineDocs, "Cargo Photo Record");
  const engineBol = docByType(engineDocs, "BOL");
  const enginePod = docByType(engineDocs, "POD");
  const engineRate = docByType(engineDocs, "Rate Confirmation");
  const engineLumper = docByType(engineDocs, "Lumper Receipt");

  const hrefPretripTablet = `/pretrip/${loadId}`;
  const hrefBol = firstHref(dispatchLoad.bol_url, engineBol?.fileUrl);
  const hrefPod = firstHref(dispatchLoad.pod_url, enginePod?.fileUrl);
  const hrefRate = firstHref(dispatchLoad.rate_con_url, engineRate?.fileUrl);
  const hrefLumper = firstHref(dispatchLoad.lumper_photo_url, engineLumper?.fileUrl);
  const hrefPretripInspectionReport = firstHref(
    pretripChecklist?.fileUrl,
    cargoRecordDoc?.fileUrl,
    hrefPretripTablet
  );

  const showExceptionZone =
    Boolean(bofLoad.dispatchExceptionFlag) || Boolean(dispatchLoad.insurance_claim_needed);

  const hrefClaimExceptionPacket = showExceptionZone
    ? firstHref(
        dispatchLoad.claim_form_url,
        genCross?.incidents?.length
          ? `/generated/claims/${genCross.incidents[0]}/claim-packet-cover.svg`
          : undefined,
        genCross?.mar?.length
          ? `/generated/exceptions/${genCross.mar[0]}/settlement-hold-explanation.svg`
          : undefined
      )
    : undefined;

  const missingProofLabels = [
    ...docReport.missingRequired,
    ...proofItems
      .filter((p) => p.status === "Missing" && p.type !== "Signed BOL")
      .map((p) => p.type),
  ];
  const missingProofDedup = [...new Set(missingProofLabels)];

  const packetLabel = packetHeadline(docReport.overall);

  const pretripReportOpensNewTab = Boolean(
    hrefPretripInspectionReport &&
      !hrefPretripInspectionReport.startsWith("/pretrip")
  );

  return (
    <div className="bof-page shipper-portal">
      <nav className="bof-breadcrumb" aria-label="Breadcrumb">
        <Link href="/loads">Loads</Link>
        <span aria-hidden> / </span>
        <span>Shipper view · {bofLoad.number}</span>
      </nav>

      <header className="bof-load-header">
        <div>
          <h1 className="bof-title bof-title-tight">
            Shipper portal · Load {bofLoad.number}{" "}
            <code className="bof-code">{bofLoad.id}</code>
          </h1>
          <p className="bof-muted bof-small">
            {bofLoad.origin} → {bofLoad.destination} · Readiness, proof, and packet links (review-only;
            edits stay in BOF operations tools).
          </p>
        </div>
        <div className="bof-load-header-badges">
          {pretripChip(preStatus)}
          {eligChip(elig.level)}
        </div>
      </header>

      <div className="shipper-portal-grid">
        <section className="shipper-portal-card" aria-labelledby="sp-pretrip-title">
          <h2 id="sp-pretrip-title">Pre-trip &amp; proof</h2>
          <p className="lead">
            BOF pre-trip gate and dispatch eligibility for this shipment. Internal teams use the
            pre-trip tablet; this card mirrors status for shipper visibility.
          </p>
          <dl className="shipper-portal-dl">
            <dt>Pre-trip status</dt>
            <dd>{pretripChip(preStatus)}</dd>
            <dt>Dispatch eligibility</dt>
            <dd>{eligChip(elig.level)}</dd>
            <dt>Block / risk detail</dt>
            <dd>{elig.level === "Cleared" ? "—" : elig.detail}</dd>
            <dt>Pre-trip blockers (raw)</dt>
            <dd>
              {pretrip.blockReasons.length
                ? pretrip.blockReasons.slice(0, 8).join(" · ")
                : "None recorded on this evaluation"}
            </dd>
            <dt>Last updated</dt>
            <dd className="bof-small" style={{ color: "var(--bof-muted)" }}>
              Session snapshot — the demo dataset does not include a dedicated proof-review timestamp;
              values refresh when Source of Truth edits apply on this device.
            </dd>
            <dt>Target window</dt>
            <dd>{formatApptWindow(dispatchLoad.pickup_datetime, dispatchLoad.delivery_datetime)}</dd>
          </dl>
        </section>

        <section className="shipper-portal-card" aria-labelledby="sp-seal-title">
          <h2 id="sp-seal-title">Seal &amp; compliance snapshot</h2>
          <p className="lead">
            Seal chain of custody and driver compliance signals tied to this move.
          </p>
          <dl className="shipper-portal-dl">
            <dt>Seal required</dt>
            <dd>{sealRequired ? "Yes" : "Not indicated on load record"}</dd>
            <dt>Pickup seal #</dt>
            <dd>{bofLoad.pickupSeal?.trim() || "—"}</dd>
            <dt>Delivery seal #</dt>
            <dd>{bofLoad.deliverySeal?.trim() || "—"}</dd>
            <dt>Seal verification</dt>
            <dd>{sealVerifySummary}</dd>
            <dt>Driver compliance</dt>
            <dd>{complianceSummary}</dd>
            <dt>Appointment window</dt>
            <dd>{formatApptWindow(dispatchLoad.pickup_datetime, dispatchLoad.delivery_datetime)}</dd>
          </dl>
        </section>

        <section className="shipper-portal-card shipper-portal-wide" aria-labelledby="sp-photo-title">
          <h2 id="sp-photo-title">Cargo photo verification</h2>
          <p className="lead">
            Before / after loading, cargo, and seal imagery as surfaced on the dispatch packet.
            Thumbnails appear when a browser path exists on the record.
          </p>
          <dl className="shipper-portal-dl">
            <dt>Before loading photo</dt>
            <dd>{photoBadge(Boolean(dispatchLoad.pickup_photo_url))}</dd>
            <dt>After loading photo</dt>
            <dd>{photoBadge(Boolean(dispatchLoad.delivery_photo_url))}</dd>
            <dt>Cargo photo</dt>
            <dd>
              {photoBadge(Boolean(dispatchLoad.cargo_photo_url))} {proofLineBadge(cargoProof)}
            </dd>
            <dt>Seal photo</dt>
            <dd>
              {photoBadge(Boolean(dispatchLoad.seal_photo_url))}{" "}
              <span className="shipper-portal-chip shipper-portal-chip-muted">
                Pickup {pickupProof?.status ?? "—"} · Delivery {deliveryProof?.status ?? "—"}
              </span>
            </dd>
          </dl>
          <div className="shipper-portal-photo-grid" aria-label="Photo thumbnails">
            {[
              { label: "Before load", url: dispatchLoad.pickup_photo_url },
              { label: "After load", url: dispatchLoad.delivery_photo_url },
              { label: "Cargo", url: dispatchLoad.cargo_photo_url },
              { label: "Seal", url: dispatchLoad.seal_photo_url },
            ].map((row) =>
              row.url ? (
                <div key={row.label} className="shipper-portal-photo-tile">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={row.url} alt="" />
                  <div className="meta">{row.label}</div>
                </div>
              ) : (
                <div key={row.label} className="shipper-portal-photo-tile">
                  <div className="meta" style={{ padding: "1.5rem 0.5rem", textAlign: "center" }}>
                    {row.label}
                    <br />
                    <span className="shipper-portal-chip shipper-portal-chip-muted">No preview</span>
                  </div>
                </div>
              )
            )}
          </div>
        </section>

        <section className="shipper-portal-card shipper-portal-wide" aria-labelledby="sp-docs-title">
          <h2 id="sp-docs-title">Documentation readiness</h2>
          <p className="lead">{docReport.overallDetail}</p>
          <div style={{ marginBottom: "0.65rem" }}>
            <span className="shipper-portal-chip shipper-portal-chip-teal">Overall: {packetLabel}</span>
            {docReport.suggestedSettlementHold && (
              <span className="shipper-portal-chip shipper-portal-chip-warn" style={{ marginLeft: "0.35rem" }}>
                Settlement hold risk
              </span>
            )}
          </div>
          <div className="shipper-portal-doc-lines">
            {docReport.lines
              .filter((ln) =>
                ["rate_con", "bol", "pod", "invoice", "lumper"].includes(ln.key)
              )
              .map((ln) => (
                <div key={ln.key} className="shipper-portal-doc-line">
                  <span className="shipper-portal-doc-line-label">{ln.label}</span>
                  <span className="shipper-portal-doc-line-value">
                    <span
                      className={
                        ln.status === "Ready"
                          ? "shipper-portal-chip shipper-portal-chip-ok"
                          : ln.status === "Not applicable"
                            ? "shipper-portal-chip shipper-portal-chip-muted"
                            : ln.status === "Incomplete"
                              ? "shipper-portal-chip shipper-portal-chip-warn"
                              : "shipper-portal-chip shipper-portal-chip-bad"
                      }
                    >
                      {ln.status}
                    </span>
                    {ln.detail ? (
                      <span className="bof-small" style={{ color: "var(--bof-muted)", marginLeft: "0.35rem" }}>
                        {ln.detail}
                      </span>
                    ) : null}
                  </span>
                </div>
              ))}
          </div>
        </section>

        {showExceptionZone && (
          <section className="shipper-portal-card shipper-portal-wide" aria-labelledby="sp-ex-title">
            <h2 id="sp-ex-title">Exception &amp; claims visibility</h2>
            <p className="lead">
              This shipment is flagged for operational exception and/or insurer claim review in the
              BOF demo storyline.
            </p>
            <dl className="shipper-portal-dl">
              <dt>Exception on file</dt>
              <dd>{bofLoad.dispatchExceptionFlag ? "Yes" : "No"}</dd>
              <dt>Claim review needed</dt>
              <dd>{dispatchLoad.insurance_claim_needed ? "Yes" : "No"}</dd>
              <dt>Exception reason</dt>
              <dd>{dispatchLoad.exception_reason ?? "—"}</dd>
              <dt>Missing proof (packet + lines)</dt>
              <dd>{missingProofDedup.length ? missingProofDedup.join(", ") : "—"}</dd>
              {claimCtx && (
                <>
                  <dt>Claim workspace (summary)</dt>
                  <dd className="bof-small" style={{ color: "#e2e8f0" }}>
                    Issues: {claimCtx.issueTypes.join("; ") || "—"}
                  </dd>
                </>
              )}
            </dl>
            <div className="shipper-portal-actions">
              <ActionLink
                label="Carrier claim form (if on file)"
                href={dispatchLoad.claim_form_url}
                newTab
              />
              <ActionLink
                label="Damage / cargo stills"
                href={dispatchLoad.damage_photo_url}
                newTab
              />
              <ActionLink
                label="Supporting attachment"
                href={dispatchLoad.supporting_attachment_url}
                newTab
              />
              <ActionLink label="Money at risk (BOF)" href="/money-at-risk" />
              <ActionLink label="Document vault" href="/documents" />
            </div>
            {genCross && (genCross.mar.length > 0 || genCross.incidents.length > 0) && (
              <p className="bof-small bof-muted" style={{ marginTop: "0.75rem" }}>
                Generated exception / claim artifacts:{" "}
                {genCross.mar.map((mid) => (
                  <span key={mid} style={{ marginRight: "0.5rem" }}>
                    <a
                      href={`/generated/exceptions/${mid}/settlement-hold-explanation.svg`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      MAR {mid}
                    </a>
                  </span>
                ))}
                {genCross.incidents.map((iid) => (
                  <span key={iid} style={{ marginRight: "0.5rem" }}>
                    <a
                      href={`/generated/claims/${iid}/claim-packet-cover.svg`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Claim {iid}
                    </a>
                  </span>
                ))}
              </p>
            )}
          </section>
        )}

        <section className="shipper-portal-card shipper-portal-wide" aria-labelledby="sp-actions-title">
          <h2 id="sp-actions-title">Linked documents &amp; actions</h2>
          <p className="lead">
            Opens supporting materials in a new browser tab when the asset is a file; BOF routes
            stay in-app unless you middle-click.
          </p>
          <div className="shipper-portal-actions">
            <ActionLink
              label="Pre-trip inspection & cargo condition report"
              href={hrefPretripInspectionReport}
              newTab={pretripReportOpensNewTab}
            />
            <ActionLink label="Pre-trip tablet (BOF)" href={hrefPretripTablet} newTab />
            <ActionLink label="BOL" href={hrefBol} newTab />
            <ActionLink label="POD" href={hrefPod} newTab />
            <ActionLink label="Rate confirmation" href={hrefRate} newTab />
            <ActionLink label="Lumper proof" href={hrefLumper} newTab />
            {showExceptionZone ? (
              <ActionLink
                label="Claim / exception packet"
                href={hrefClaimExceptionPacket}
                newTab
              />
            ) : null}
          </div>
        </section>
      </div>

      <p className="bof-muted bof-small" style={{ marginTop: "1.25rem" }}>
        Internal load record:{" "}
        <Link href={`/loads/${loadId}`} className="bof-link-secondary">
          /loads/{loadId}
        </Link>
      </p>
    </div>
  );
}
