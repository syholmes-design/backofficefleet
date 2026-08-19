/**
 * BOF Route Owner:
 * URL: /trip-release/:loadId
 * Type: DISPATCH
 * Primary component: DriverTripReleaseClient
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { DriverTripReleaseClient } from "@/components/trip-release/DriverTripReleaseClient";

type Props = { params: Promise<{ loadId: string }> };

export async function generateMetadata({ params }: Props) {
  const { loadId } = await params;
  return {
    title: `Trip release | ${loadId} | BOF`,
  };
}

export default async function TripReleasePage({ params }: Props) {
  const { loadId } = await params;
  return <DriverTripReleaseClient loadId={loadId} />;
}
