/**
 * BOF Route Owner:
 * URL: /shipper-portal/:loadId
 * Type: DEMO
 * Primary component: Unknown
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { notFound } from "next/navigation";
import { getBofData } from "@/lib/load-bof-data";
import { ShipperLoadPortalClient } from "@/components/shipper/ShipperLoadPortalClient";

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
    title: load ? `Shipper portal · Load ${load.number} | BOF` : "Shipper portal | BOF",
  };
}

export default async function ShipperPortalLoadPage({ params }: Props) {
  const { loadId } = await params;
  const data = getBofData();
  if (!data.loads.some((l) => l.id === loadId)) notFound();
  return <ShipperLoadPortalClient loadId={loadId} />;
}
