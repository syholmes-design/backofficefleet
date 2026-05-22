/**
 * BOF Route Owner:
 * URL: /trip-release/:loadId
 * Type: DEMO
 * Primary component: Unknown
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { notFound } from "next/navigation";
import { getBofData } from "@/lib/load-bof-data";
import { DriverTripReleaseClient } from "@/components/trip-release/DriverTripReleaseClient";

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
    title: load ? `Trip release · Load ${load.number} | BOF` : "Trip release | BOF",
  };
}

export default async function TripReleasePage({ params }: Props) {
  const { loadId } = await params;
  const data = getBofData();
  if (!data.loads.some((l) => l.id === loadId)) notFound();
  return <DriverTripReleaseClient loadId={loadId} />;
}
