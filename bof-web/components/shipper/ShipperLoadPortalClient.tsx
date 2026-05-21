"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useBofDemoData } from "@/lib/bof-demo-data-context";
import { buildPretripTabletModel, type PretripTabletModel } from "@/lib/pretrip-tablet";
import { useDispatchDashboardStore } from "@/lib/stores/dispatch-dashboard-store";
import { resolveDispatchLoadForUi } from "@/lib/dispatch-load-resolver";
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
import { reconcileCredentialIncident } from "@/lib/compliance/credential-incident-reconciliation";
import { getGeneratedCrossLinksForLoad } from "@/lib/generated-documents";
import type { Load } from "@/types/dispatch";
import { BofAdvantageCard, BofAdvantageStrip } from "@/components/bof-advantage/BofAdvantageCard";
import { DieselRouteInsightWidget } from "@/components/fuel/DieselRouteInsightWidget";

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
    return `${a.toLocaleString(undefined, o)} -> ${b.toLocaleString(undefined, o)}`;
  } catch {
    return "-";
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
      detail: pretrip.blockReasons.slice(0, 6).join(" | ") || "Pre-trip gate blocked",
    };
  }
  if (dispatchLoad.exception_flag && dispatchLoad.seal_status === "Mismatch") {
    return {
      level: "Blocked" as const,
      detail:
        dispatchLoad.exception_reason ??
        "Active exception with seal mismatch - dispatch blocked until resolved",
    };
  }
  const doc = computeDocumentationReadiness(dispatchLoad);
  if (dispatchLoad.insurance_claim_needed && !doc.claimPacketReady) {
    return {
      level: "At Risk" as const,
      detail: "Insurance / claim path - packet attachments incomplete",
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

function StoryStep({
  label,
  title,
  body,
  href,
}: {
  label: string;
  title: string;
  body: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="shipper-portal-story-label">{label}</span>
      <strong>{title}</strong>
      <span>{body}</span>
    </>
  );

  if (!href) {
    return <div className="shipper-portal-story-step">{content}</div>;
  }

  return (
    <a className="shipper-portal-story-step" href={href} target="_blank" rel="noreferrer">
      {content}
    </a>
  );
}

function EvidenceTile({
  label,
  detail,
  url,
  tone = "neutral",
}: {
  label: string;
  detail: string;
  url?: string;
  tone?: "ok" | "warning" | "danger" | "neutral";
}) {
  const className = `shipper-portal-evidence-tile shipper-portal-evidence-tile-${tone}`;
  const content = (
    <>
      {url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" />
        </>
      ) : (
        <div className="shipper-portal-evidence-empty">No proof file</div>
      )}
      <div className="shipper-portal-evidence-meta">
        <strong>{label}</strong>
        <span>{detail}</span>
        {url ? <em>Open proof</em> : <em>Needs upload</em>}
      </div>
    </>
  );

  if (!url) {
    return <div className={`${className} is-disabled`}>{content}</div>;
  }

  return (
    <a className={className} href={url} target="_blank" rel="noreferrer">
      {content}
    </a>
  );
}

function LumperPaymentWorkflow({
  loadId,
  amount,
  qrProofHref,
  emptyTrailerHref,
}: {
  loadId: string;
  amount: number;
  qrProofHref: string;
  emptyTrailerHref: string;
}) {
  const pendingId = `${loadId}-lumper-pending`;
  const authorizedId = `${loadId}-lumper-authorized`;
  const paidId = `${loadId}-lumper-paid`;
  const releasedId = `${loadId}-lumper-released`;

  return (
    <div className="shipper-portal-card shipper-portal-wide" aria-labelledby="sp-lumper-action-title">
      <div className="shipper-lumper-demo-state" aria-hidden>
        <input id={pendingId} name={`${loadId}-lumper-demo`} type="radio" defaultChecked />
        <input id={authorizedId} name={`${loadId}-lumper-demo`} type="radio" />
        <input id={paidId} name={`${loadId}-lumper-demo`} type="radio" />
        <input id={releasedId} name={`${loadId}-lumper-demo`} type="radio" />
      </div>
      <h2 id="sp-lumper-action-title">Lumper closeout control</h2>
      <p className="lead">
        Simulated control action for load {loadId}: BOF confirms the lumper at the dock,
        records payment, then releases the settlement hold without asking the driver
        to handle receipt paperwork.
      </p>

      <div className="shipper-portal-doc-lines" style={{ marginBottom: "1rem" }}>
        <div className="shipper-portal-doc-line">
          <span className="shipper-portal-doc-line-label">Dock QR authorization</span>
          <span className="shipper-portal-doc-line-value">
            <span className="shipper-portal-chip shipper-portal-chip-warn lumper-status-pending">Pending</span>
            <span className="shipper-portal-chip shipper-portal-chip-ok lumper-status-authorized">Authorized</span>
          </span>
        </div>
        <div className="shipper-portal-doc-line">
          <span className="shipper-portal-doc-line-label">Empty-trailer proof</span>
          <span className="shipper-portal-doc-line-value">
            <a href={emptyTrailerHref} target="_blank" rel="noreferrer">
              Open proof
            </a>
          </span>
        </div>
        <div className="shipper-portal-doc-line">
          <span className="shipper-portal-doc-line-label">Zelle payment</span>
          <span className="shipper-portal-doc-line-value">
            <span className="shipper-portal-chip shipper-portal-chip-warn lumper-status-unpaid">
              ${amount.toLocaleString()} pending
            </span>
            <span className="shipper-portal-chip shipper-portal-chip-ok lumper-status-paid">
              ${amount.toLocaleString()} sent
            </span>
          </span>
        </div>
        <div className="shipper-portal-doc-line">
          <span className="shipper-portal-doc-line-label">Settlement hold</span>
          <span className="shipper-portal-doc-line-value">
            <span className="shipper-portal-chip shipper-portal-chip-warn lumper-status-held">Held for closeout</span>
            <span className="shipper-portal-chip shipper-portal-chip-ok lumper-status-released">Released</span>
          </span>
        </div>
      </div>

      <div className="shipper-portal-actions">
        <a href={qrProofHref} target="_blank" rel="noreferrer">
          View QR dock proof
        </a>
        <label htmlFor={authorizedId} className="shipper-portal-button">
          Authorize lumper
        </label>
        <label htmlFor={paidId} className="shipper-portal-button">
          Confirm Zelle paid
        </label>
        <label htmlFor={releasedId} className="shipper-portal-button">
          Release settlement hold
        </label>
        <label htmlFor={pendingId} className="shipper-portal-button-secondary">
          Reset demo
        </label>
      </div>
    </div>
  );
}

export function ShipperLoadPortalClient({ loadId }: { loadId: string }) {
  const { data } = useBofDemoData();
  const storeLoads = useDispatchDashboardStore((s) => s.loads);

  const bofLoad = useMemo(
    () => data.loads.find((l) => l.id === loadId) ?? null,
    [data.loads, loadId]
  );

  const dispatchLoad = useMemo(() => {
    return resolveDispatchLoadForUi({ loadId, data, storeLoads });
  }, [storeLoads, data, loadId]);

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
      (c) =>
        c.driverId === bofLoad.driverId &&
        c.status === "OPEN" &&
        reconcileCredentialIncident(data, c).display
    );
  }, [data, bofLoad]);

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
    `Pickup seal photo: ${pickupProof?.status ?? "-"}`,
    `Delivery seal photo: ${deliveryProof?.status ?? "-"}`,
    `Recorded seal state: ${bofLoad.sealStatus}`,
  ].join(" | ");

  const complianceSummary =
    openCompliance.length === 0
      ? "No open compliance incidents on file for this driver."
      : `${openCompliance.length} open item(s): ${openCompliance.map((c) => c.type).join("; ")}`;

  const pretripChecklist = docByType(engineDocs, "Pre-Trip Checklist");
  const cargoRecordDoc = docByType(engineDocs, "Cargo Photo Record");
  const engineBol = docByType(engineDocs, "BOL");
  const enginePod = docByType(engineDocs, "POD");
  const engineInvoice = docByType(engineDocs, "Invoice");
  const engineRate = docByType(engineDocs, "Rate Confirmation");
  const engineLumper = docByType(engineDocs, "Lumper Receipt");

  const hrefPretripTablet = `/pretrip/${loadId}`;
  const hrefBol = firstHref(dispatchLoad.bol_url, engineBol?.fileUrl);
  const hrefPod = firstHref(dispatchLoad.pod_url, enginePod?.fileUrl);
  const hrefInvoice = firstHref(dispatchLoad.invoice_url, engineInvoice?.fileUrl);
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

  const pickupSeal = bofLoad.pickupSeal?.trim() || dispatchLoad.pickup_seal_number || "not recorded";
  const deliverySeal = bofLoad.deliverySeal?.trim() || dispatchLoad.delivery_seal_number || "not recorded";
  const sealMismatchActive = dispatchLoad.seal_status === "Mismatch" || bofLoad.sealStatus === "Mismatch";
  const lumperAutomationActive =
    !sealMismatchActive &&
    /lumper|qr|zelle|dock|accessorial/i.test(
      `${bofLoad.settlementHoldReason ?? ""} ${dispatchLoad.settlement_hold_reason ?? ""}`
    );
  const hrefPickupSealPhoto = firstHref(
    pickupProof?.fileUrl,
    pickupProof?.previewUrl,
    `/evidence/loads/${loadId}/seal-pickup-photo.png`
  );
  const hrefDeliverySealPhoto = firstHref(
    deliveryProof?.fileUrl,
    deliveryProof?.previewUrl,
    dispatchLoad.seal_photo_url,
    `/evidence/loads/${loadId}/seal-delivery-photo.png`
  );
  const hrefCargoPickup = firstHref(
    dispatchLoad.pickup_photo_url,
    `/evidence/loads/${loadId}/cargo-pickup.jpg`
  );
  const hrefCargoDelivery = firstHref(
    dispatchLoad.delivery_photo_url,
    `/evidence/loads/${loadId}/cargo-delivery.jpg`
  );
  const hrefRfidDock = `/evidence/loads/${loadId}/rfid-dock-proof.png`;
  const hrefEmptyTrailerProof = `/evidence/loads/${loadId}/empty-trailer-proof.png`;
  const portalHeadline = sealMismatchActive
    ? "Exception response"
    : lumperAutomationActive
      ? "Lumper QR closeout"
    : bofLoad.settlementHold
      ? "Settlement packet review"
      : "Shipper load packet";
  const issueNarrative = sealMismatchActive
    ? `BOF captured pickup seal ${pickupSeal} before departure and later detected delivery seal ${deliverySeal}. That variance does not mean the pre-trip gate failed; it means the gate created the baseline that let BOF catch a downstream seal change, re-seal, or recording error before the load closed.`
    : lumperAutomationActive
      ? "BOF keeps the driver out of the paper chase. The lumper scans the QR code on the trailer, confirms presence at the dock, empty-trailer proof is captured, and BOF holds settlement only until the Zelle payment record and dock proof are tied back to this load."
    : bofLoad.settlementHold
      ? `BOF is holding this post-trip packet because ${bofLoad.settlementHoldReason || "settlement support needs review"}. The load can stay operationally clean while settlement waits for the specific receipt, proof item, or dispatcher approval required to release payment.`
    : "BOF is showing the same trip packet, proof photos, and closeout documents across shipper, dispatch, claims, and settlement review.";
  const resolutionPlan = [
    "Compare pickup seal photo, delivery seal photo, BOL, POD, and RFID dock proof.",
    "Confirm whether the facility or receiver opened and re-sealed the trailer after pickup.",
    "Hold clean closeout until dispatch or claims marks the seal chain reconciled.",
  ];
  const storySteps = sealMismatchActive
    ? [
        {
          label: "1. Pickup baseline",
          title: `Pickup seal ${pickupSeal}`,
          body: "Driver and dispatch captured the starting seal and cargo condition before the trip moved.",
          href: hrefPickupSealPhoto,
        },
        {
          label: "2. Custody trail",
          title: "RFID and dock proof monitored",
          body: "BOF keeps the dock scan, document packet, and route context attached to the same load.",
          href: hrefRfidDock,
        },
        {
          label: "3. Delivery variance",
          title: `Delivery seal ${deliverySeal}`,
          body: "The delivery seal does not match the pickup baseline, so BOF escalates instead of closing silently.",
          href: hrefDeliverySealPhoto,
        },
        {
          label: "4. Closeout control",
          title: "Exception packet staged",
          body: "Dispatch, claims, settlement, and the customer all review the same packet before release.",
          href: hrefClaimExceptionPacket,
        },
      ]
    : lumperAutomationActive
      ? [
          {
            label: "1. Lumper arrives",
            title: "QR check-in at trailer",
            body: "The lumper scans the QR code on the trailer to authorize presence and attach the dock event to this load.",
            href: hrefRfidDock,
          },
          {
            label: "2. Empty proof",
            title: "Trailer empty confirmed",
            body: "Dock proof or trailer camera evidence confirms the cargo bay is empty after unload.",
            href: hrefEmptyTrailerProof,
          },
          {
            label: "3. BOF payment",
            title: "Zelle payment record staged",
            body: "BOF records the lumper payment workflow without requiring the driver to collect a paper receipt.",
            href: "/settlements",
          },
          {
            label: "4. Settlement closeout",
            title: "Accessorial clears",
            body: "Settlement releases when QR authorization, empty proof, and payment confirmation are matched.",
            href: "/settlements",
          },
        ]
      : [
        {
          label: "1. Trip delivered",
          title: "Operational proof on file",
          body: "BOL, POD, cargo photos, and seal records stay attached to this load record.",
          href: hrefPod ?? hrefBol,
        },
        {
          label: "2. Settlement check",
          title: bofLoad.settlementHold ? "Receipt hold detected" : "Packet clear",
          body: bofLoad.settlementHold
            ? bofLoad.settlementHoldReason || "A settlement support item needs review before release."
            : "No active settlement blocker is attached to this load.",
          href: "/settlements",
        },
        {
          label: "3. Document workspace",
          title: "Packet docs available",
          body: "The same load documents are available to dispatch, customer review, and settlement.",
          href: "/documents",
        },
        {
          label: "4. Manager view",
          title: "Load file remains linked",
          body: "Fleet managers can jump from the customer-facing packet back to the internal load record.",
          href: `/loads/${loadId}`,
        },
      ];

  return (
    <div className="bof-page shipper-portal">
      <nav className="bof-breadcrumb" aria-label="Breadcrumb">
        <Link href="/loads">Loads</Link>
        <span aria-hidden> / </span>
        <span>{portalHeadline} - {bofLoad.number}</span>
      </nav>

      <header className="bof-load-header">
        <div>
          <h1 className="bof-title bof-title-tight">
            {portalHeadline} - Load {bofLoad.number}{" "}
            <code className="bof-code">{bofLoad.id}</code>
          </h1>
          <p className="bof-muted bof-small">
            {bofLoad.origin} to {bofLoad.destination}. BOF ties the shipper view to
            dispatch, proof, claims, and settlement actions so the exception has one source of truth.
          </p>
        </div>
        <div className="bof-load-header-badges">
          {pretripChip(preStatus)}
          {eligChip(elig.level)}
        </div>
      </header>

      <section className="shipper-portal-card shipper-portal-story" aria-labelledby="sp-story-title">
        <h2 id="sp-story-title">What happened on this load</h2>
        <p className="lead">{issueNarrative}</p>
        <div className="shipper-portal-story-grid">
          {storySteps.map((step) => (
            <StoryStep key={step.label} {...step} />
          ))}
        </div>
        <div className="shipper-portal-actions">
          {sealMismatchActive ? (
            <>
              <ActionLink label="Review pickup seal" href={hrefPickupSealPhoto} newTab />
              <ActionLink label="Review delivery seal" href={hrefDeliverySealPhoto} newTab />
              <ActionLink label="Open exception packet" href={hrefClaimExceptionPacket} newTab />
            </>
          ) : (
            <>
              {lumperAutomationActive ? (
                <>
                  <ActionLink label="Review QR dock proof" href={hrefRfidDock} newTab />
                  <ActionLink label="Open empty-trailer proof" href={hrefEmptyTrailerProof} newTab />
                  <ActionLink label="Open settlement closeout" href="/settlements" />
                </>
              ) : (
                <>
                  <ActionLink label="Open settlement review" href="/settlements" />
                  <ActionLink label="Open packet documents" href="/documents" />
                  <ActionLink label="Review POD" href={hrefPod} newTab />
                </>
              )}
            </>
          )}
          <ActionLink label="Open BOF load record" href={`/loads/${loadId}`} />
        </div>
      </section>

      <DieselRouteInsightWidget loadId={loadId} variant="shipper" />

      <BofAdvantageStrip>
        <BofAdvantageCard
          eyebrow="Admin Time Reduced"
          title="Centralized proof packet vs. manual gathering"
          subtitle="Indexed engine outputs + dispatch URLs on one load record"
          value={`${engineDocs.length} BOF document links on file for this shipment`}
          delta={
            docReport.missingRequired.length
              ? `${docReport.missingRequired.length} required packet line(s) still open in ops tools`
              : "Required packet lines satisfied on this readiness snapshot"
          }
          explanation="Customer, dispatch, settlement, and claims teams use the same load record instead of rebuilding the packet from emails."
          tone={docReport.missingRequired.length ? "neutral" : "positive"}
        />
        <BofAdvantageCard
          eyebrow="Claims Exposure Reduced"
          title="Billing & dispute readiness"
          subtitle={`Packet headline: ${packetLabel}`}
          value={`${missingProofDedup.length} open proof / required gap label(s) in combined view`}
          delta="Single shipper-facing surface reduces back-and-forth vs. scattered email threads"
          explanation="The exception view merges document readiness, proof photos, seal chain, and closeout action into one review surface."
          tone={missingProofDedup.length >= 3 ? "caution" : "positive"}
        />
      </BofAdvantageStrip>

      <div className="shipper-portal-grid">
        <section className="shipper-portal-card" aria-labelledby="sp-pretrip-title">
          <h2 id="sp-pretrip-title">Pre-trip &amp; proof</h2>
          <p className="lead">
            {sealMismatchActive
              ? "The pre-trip gate captured the starting proof baseline. The current risk is the downstream variance against that baseline, not a missing pre-trip process."
              : "The pre-trip gate and delivery proof stay visible while settlement resolves the specific packet item holding release."}
          </p>
          <dl className="shipper-portal-dl">
            <dt>Pre-trip status</dt>
            <dd>{pretripChip(preStatus)}</dd>
            <dt>Dispatch eligibility</dt>
            <dd>{eligChip(elig.level)}</dd>
            <dt>Current risk detail</dt>
            <dd>{elig.level === "Cleared" ? "-" : elig.detail}</dd>
            <dt>Pre-trip proof baseline</dt>
            <dd>
              Pickup seal {pickupSeal}; cargo and pickup proof on file for comparison.
            </dd>
            <dt>BOF action</dt>
            <dd className="bof-small" style={{ color: "var(--bof-muted)" }}>
              Hold clean closeout, reconcile the seal chain, and stage the claim / exception packet.
            </dd>
            <dt>Target window</dt>
            <dd>{formatApptWindow(dispatchLoad.pickup_datetime, dispatchLoad.delivery_datetime)}</dd>
          </dl>
        </section>

        <section className="shipper-portal-card" aria-labelledby="sp-seal-title">
          <h2 id="sp-seal-title">Seal &amp; compliance snapshot</h2>
          <p className="lead">
            {sealMismatchActive
              ? "A clean pre-trip can still produce a later seal variance if a facility opens and re-seals the trailer, a receiver records a replacement seal, or a manual entry is wrong. BOF is designed to catch that variance before closeout."
              : "Seal chain, driver compliance, and appointment details remain attached to the packet even when the active issue is settlement support rather than cargo custody."}
          </p>
          <dl className="shipper-portal-dl">
            <dt>Seal required</dt>
            <dd>{sealRequired ? "Yes" : "Not indicated on load record"}</dd>
            <dt>Pickup seal #</dt>
            <dd>{pickupSeal}</dd>
            <dt>Delivery seal #</dt>
            <dd>{deliverySeal}</dd>
            <dt>Seal verification</dt>
            <dd>{sealVerifySummary}</dd>
            <dt>Why this matters</dt>
            <dd>
              {sealMismatchActive
                ? "Settlement and billing stay held until the seal chain is reconciled."
                : "Settlement can be held for one missing support item without turning the whole load into a claims event."}
            </dd>
            <dt>Driver compliance</dt>
            <dd>{complianceSummary}</dd>
            <dt>Appointment window</dt>
            <dd>{formatApptWindow(dispatchLoad.pickup_datetime, dispatchLoad.delivery_datetime)}</dd>
          </dl>
        </section>

        <section className="shipper-portal-card shipper-portal-wide" aria-labelledby="sp-photo-title">
          <h2 id="sp-photo-title">Proof stack tied to the exception</h2>
          <p className="lead">
            Each tile opens the evidence BOF uses to reconcile the seal variance, cargo condition,
            and dock custody trail for this load.
          </p>
          <dl className="shipper-portal-dl">
            <dt>Pickup cargo condition</dt>
            <dd>{photoBadge(Boolean(hrefCargoPickup))}</dd>
            <dt>Delivery cargo condition</dt>
            <dd>{photoBadge(Boolean(hrefCargoDelivery))}</dd>
            <dt>Cargo proof line</dt>
            <dd>
              {proofLineBadge(cargoProof)}
            </dd>
            <dt>Seal proof line</dt>
            <dd>
              <span className="shipper-portal-chip shipper-portal-chip-muted">
                Pickup {pickupProof?.status ?? "-"} | Delivery {deliveryProof?.status ?? "-"}
              </span>
            </dd>
          </dl>
          <div className="shipper-portal-evidence-grid" aria-label="Clickable exception evidence">
            <EvidenceTile
              label={`Pickup seal ${pickupSeal}`}
              detail="Pre-trip baseline captured before departure"
              url={hrefPickupSealPhoto}
              tone="ok"
            />
            <EvidenceTile
              label={`Delivery seal ${deliverySeal}`}
              detail="Delivery seal differs from pickup baseline"
              url={hrefDeliverySealPhoto}
              tone={sealMismatchActive ? "danger" : "ok"}
            />
            <EvidenceTile
              label="Pickup cargo condition"
              detail="Before-departure cargo and trailer condition"
              url={hrefCargoPickup}
              tone="ok"
            />
            <EvidenceTile
              label="Delivery cargo condition"
              detail="Cargo condition available for customer and claims review"
              url={hrefCargoDelivery}
              tone="warning"
            />
            <EvidenceTile
              label="RFID / dock custody"
              detail="Dock proof attached to the same load record"
              url={hrefRfidDock}
            />
          </div>
        </section>

        {lumperAutomationActive && (
          <section
            id="lumper-workflow"
            className="shipper-portal-card shipper-portal-wide"
            aria-labelledby="sp-lumper-title"
          >
            <h2 id="sp-lumper-title">BOF lumper QR payment workflow</h2>
            <p className="lead">
              This is not a driver receipt chase. The trailer QR code authorizes the lumper,
              BOF captures dock and empty-trailer proof, then settlement closes once the Zelle
              payment record is matched to the load.
            </p>
            <div className="shipper-portal-evidence-grid" aria-label="Lumper QR closeout evidence">
              <EvidenceTile
                label="QR dock authorization"
                detail="Lumper presence is tied to the trailer and dock event"
                url={hrefRfidDock}
                tone="warning"
              />
              <EvidenceTile
                label="Empty trailer proof"
                detail="Unload condition confirms cargo bay is clear"
                url={hrefEmptyTrailerProof}
                tone="ok"
              />
              <EvidenceTile
                label="Delivery dock photo"
                detail="Facility unload context attached to the same closeout"
                url={firstHref(`/evidence/loads/${loadId}/delivery-dock.jpg`, hrefCargoDelivery)}
                tone="ok"
              />
            </div>
            <div className="shipper-portal-actions" style={{ marginTop: "1rem" }}>
              <ActionLink label="Open settlement closeout" href="/settlements" />
              <ActionLink label="Open BOF load record" href={`/loads/${loadId}`} />
              <ActionLink label="Open empty-trailer proof" href={hrefEmptyTrailerProof} newTab />
            </div>
          </section>
        )}

        {lumperAutomationActive && (
          <LumperPaymentWorkflow
            loadId={loadId}
            amount={bofLoad.lumperAmount || 315}
            qrProofHref={hrefRfidDock}
            emptyTrailerHref={hrefEmptyTrailerProof}
          />
        )}

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
              This shipment is flagged for dispatch, customer, settlement, and claims review because
              the seal chain changed after the pickup baseline was captured.
            </p>
            <dl className="shipper-portal-dl">
              <dt>Exception on file</dt>
              <dd>{bofLoad.dispatchExceptionFlag ? "Yes" : "No"}</dd>
              <dt>Claim review needed</dt>
              <dd>{dispatchLoad.insurance_claim_needed ? "Yes" : "No"}</dd>
              <dt>Exception reason</dt>
              <dd>{dispatchLoad.exception_reason ?? "-"}</dd>
              <dt>Resolution plan</dt>
              <dd>{resolutionPlan.join(" ")}</dd>
              {claimCtx && (
                <>
                  <dt>Claim workspace (summary)</dt>
                  <dd className="bof-small" style={{ color: "#e2e8f0" }}>
                    Issues: {claimCtx.issueTypes.join("; ") || "-"}
                  </dd>
                </>
              )}
            </dl>
            <div className="shipper-portal-actions">
              <ActionLink
                label="Open exception packet"
                href={dispatchLoad.claim_form_url}
                newTab
              />
              <ActionLink
                label="Review pickup seal"
                href={hrefPickupSealPhoto}
                newTab
              />
              <ActionLink
                label="Review delivery seal"
                href={hrefDeliverySealPhoto}
                newTab
              />
              <ActionLink label="Review BOL / POD" href={hrefPod ?? hrefBol} newTab />
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
            Supporting materials used by dispatch, claims, shipper review, and settlements to move
            the exception from detection to resolution.
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
            <ActionLink label="Invoice" href={hrefInvoice} newTab />
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
