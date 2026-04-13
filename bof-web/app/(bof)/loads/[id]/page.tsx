import Link from "next/link";
import { notFound } from "next/navigation";
import { getBofData } from "@/lib/load-bof-data";
import { DriverCell } from "@/components/DriverCell";
import { getLoadProofItems, proofBlockingCount } from "@/lib/load-proof";
import { buildClaimPacketContext } from "@/lib/claim-packet";
import { buildLoadRouteMapModel } from "@/lib/load-route-map";
import { LoadProofPanel } from "@/components/LoadProofPanel";
import { ClaimPacketPanel } from "@/components/ClaimPacketPanel";
import { LoadRfidSection } from "@/components/LoadRfidSection";
import { LoadRouteMapClient } from "@/components/LoadRouteMapClient";
import { formatUsdFull } from "@/lib/format-money";
import { getGeneratedCrossLinksForLoad } from "@/lib/generated-documents";
import {
  GENERATED_PUBLIC_PREFIX,
  listAutomationProofLinksForLoad,
  listEngineDocumentsForLoad,
} from "@/lib/document-engine";
import { DocumentEnginePanel } from "@/components/DocumentEnginePanel";

type Props = { params: Promise<{ id: string }> };

export async function generateStaticParams() {
  const data = getBofData();
  return data.loads.map((l) => ({ id: l.id }));
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const data = getBofData();
  const load = data.loads.find((l) => l.id === id);
  return {
    title: load ? `Load ${load.number} | BOF` : "Load | BOF",
  };
}

export default async function LoadDetailPage({ params }: Props) {
  const { id } = await params;
  const data = getBofData();
  const load = data.loads.find((l) => l.id === id);
  if (!load) notFound();

  const driver = data.drivers.find((d) => d.id === load.driverId);
  const proofItems = getLoadProofItems(data, load.id);
  const blockCount = proofBlockingCount(proofItems);
  const claimCtx = buildClaimPacketContext(data, load.id);
  const routeMapModel = buildLoadRouteMapModel(data, load.id);
  const engineLoadDocs = listEngineDocumentsForLoad(data, load.id);
  const automationProofLinks = listAutomationProofLinksForLoad(data, load.id);
  const genCross = getGeneratedCrossLinksForLoad(data, load.id);
  const genCrossLinks = [
    { label: "Pre-trip tablet", href: `/pretrip/${load.id}` },
    { label: "Document vault", href: "/documents" },
    { label: "RF actions", href: "/rf-actions" },
    { label: "Money at risk", href: "/money-at-risk" },
    { label: "Command Center", href: "/command-center" },
    ...genCross.settlements.map((sid) => ({
      label: `Generated settlement ${sid}`,
      href: `${GENERATED_PUBLIC_PREFIX}/settlements/${sid}/settlement-summary.svg`,
    })),
    ...genCross.mar.map((mid) => ({
      label: `Generated exception ${mid}`,
      href: `${GENERATED_PUBLIC_PREFIX}/exceptions/${mid}/settlement-hold-explanation.svg`,
    })),
    ...genCross.incidents.map((iid) => ({
      label: `Generated claim / compliance ${iid}`,
      href: `${GENERATED_PUBLIC_PREFIX}/claims/${iid}/claim-packet-cover.svg`,
    })),
  ];

  return (
    <div className="bof-page">
      <nav className="bof-breadcrumb" aria-label="Breadcrumb">
        <Link href="/loads">Loads / dispatch</Link>
        <span aria-hidden> / </span>
        <span>
          Load {load.number} ({load.id})
        </span>
      </nav>

      <header className="bof-load-header">
        <div>
          <h1 className="bof-title bof-title-tight">
            Load {load.number}{" "}
            <code className="bof-code">{load.id}</code>
          </h1>
          <p className="bof-muted bof-small">
            {load.origin} → {load.destination} · Asset{" "}
            <code className="bof-code">{load.assetId}</code>
          </p>
        </div>
        <div className="bof-load-header-badges">
          <Link
            href={`/pretrip/${load.id}`}
            className="bof-load-pretrip-link bof-link-secondary bof-small"
          >
            Pre-trip tablet
          </Link>
          <span className="bof-badge bof-badge-neutral">{load.status}</span>
          <span className="bof-badge bof-badge-neutral">POD: {load.podStatus}</span>
          <span className="bof-badge bof-badge-neutral">Seals: {load.sealStatus}</span>
          {blockCount > 0 && (
            <span className="bof-badge bof-badge-warn">
              {blockCount} proof blockers
            </span>
          )}
        </div>
      </header>

      {routeMapModel && <LoadRouteMapClient model={routeMapModel} />}

      <section className="bof-driver-info-grid" aria-label="Load summary">
        <div className="bof-info-block">
          <h2 className="bof-h3">Revenue</h2>
          <p className="bof-load-money">
            {formatUsdFull(load.revenue)}{" "}
            <span className="bof-muted">linehaul</span>
          </p>
          <p className="bof-muted bof-small">
            Backhaul pay {formatUsdFull(load.backhaulPay)}
          </p>
        </div>
        <div className="bof-info-block">
          <h2 className="bof-h3">Driver</h2>
          {driver ? (
            <>
              <DriverCell driverId={load.driverId} name={driver.name} size={40} />
              <div>
                <code className="bof-code">{load.driverId}</code>
              </div>
            </>
          ) : (
            <code className="bof-code">{load.driverId}</code>
          )}
        </div>
        <div className="bof-info-block">
          <h2 className="bof-h3">Seals</h2>
          <dl className="bof-dl">
            <dt>Pickup</dt>
            <dd>{load.pickupSeal || "—"}</dd>
            <dt>Delivery</dt>
            <dd>{load.deliverySeal || "—"}</dd>
          </dl>
        </div>
        {load.dispatchOpsNotes && (
          <div className="bof-info-block bof-info-block-wide">
            <h2 className="bof-h3">Dispatch notes</h2>
            <p className="bof-small">{load.dispatchOpsNotes}</p>
          </div>
        )}
      </section>

      <LoadProofPanel
        loadId={load.id}
        loadNumber={load.number}
        items={proofItems}
        automationProofLinks={automationProofLinks}
      />

      <DocumentEnginePanel
        title="Document automation engine — load packet"
        lead="Each row is generated from BOF source data (SVG). Hover for preview; click for detail modal. URLs use /generated/… (rewritten to the document API)."
        documents={engineLoadDocs}
        crossLinks={genCrossLinks}
      />

      {claimCtx && <ClaimPacketPanel ctx={claimCtx} />}

      <LoadRfidSection data={data} loadId={load.id} />
    </div>
  );
}
