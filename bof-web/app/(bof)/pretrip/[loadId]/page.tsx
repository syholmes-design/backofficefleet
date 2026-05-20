/**
 * BOF Route Owner:
 * URL: /pretrip/:loadId
 * Type: DEMO
 * Primary component: Unknown
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBofData } from "@/lib/load-bof-data";
import { buildPretripTabletModel } from "@/lib/pretrip-tablet";
import { buildLoadArtifactPacket } from "@/lib/load-artifact-registry";
import { PretripTabletDashboard } from "@/components/PretripTabletDashboard";

type Props = { params: Promise<{ loadId: string }> };

export async function generateStaticParams() {
  const data = getBofData();
  return data.loads.map((l) => ({ loadId: l.id }));
}

export async function generateMetadata({ params }: Props) {
  const { loadId } = await params;
  const data = getBofData();
  const load = data.loads.find((l) => l.id === loadId);
  return {
    title: load ? `Pre-trip - Load ${load.number} | BOF` : "Pre-trip | BOF",
  };
}

export default async function PretripTabletPage({ params }: Props) {
  const { loadId } = await params;
  const data = getBofData();
  const model = buildPretripTabletModel(data, loadId);
  if (!model) notFound();

  const pending = model.loadStatus === "Pending";
  const startDisabled =
    !pending || model.overall === "BLOCKED" || model.blockReasons.length > 0;

  const artifactPacket = buildLoadArtifactPacket(data, loadId);
  const loadOptions = data.loads.map((load) => {
    const driver = data.drivers.find((d) => d.id === load.driverId);
    return {
      loadId: load.id,
      loadNumber: load.number,
      status: load.status,
      driverName: driver?.name ?? load.driverId,
      routeLabel: `${load.origin} to ${load.destination}`,
    };
  });

  return (
    <div className="bof-page bof-tablet-page">
      <nav className="bof-breadcrumb bof-tablet-breadcrumb" aria-label="Breadcrumb">
        <Link href="/loads">Loads</Link>
        <span aria-hidden> / </span>
        <Link href={`/loads/${model.loadId}`}>Load {model.loadNumber}</Link>
        <span aria-hidden> / </span>
        <span>Pre-trip tablet</span>
      </nav>

      <PretripTabletDashboard
        model={model}
        loadId={loadId}
        artifactPacket={artifactPacket}
        loadOptions={loadOptions}
        startDisabled={startDisabled}
      />
    </div>
  );
}
