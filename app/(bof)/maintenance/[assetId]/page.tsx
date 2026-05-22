/**
 * BOF Route Owner:
 * URL: /maintenance/:assetId
 * Type: DEMO
 * Primary component: Unknown
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { notFound } from "next/navigation";
import { allMaintenanceAssetIds } from "@/lib/maintenance-data";
import { MaintenanceAssetDetailClient } from "@/components/maintenance/MaintenanceAssetDetailClient";

type Props = { params: Promise<{ assetId: string }> };

export async function generateStaticParams() {
  return allMaintenanceAssetIds().map((assetId) => ({ assetId }));
}

export async function generateMetadata({ params }: Props) {
  const { assetId } = await params;
  return { title: `Maintenance · ${assetId} | BOF` };
}

export default async function MaintenanceAssetPage({ params }: Props) {
  const { assetId } = await params;
  if (!allMaintenanceAssetIds().includes(assetId)) notFound();
  return <MaintenanceAssetDetailClient assetId={assetId} />;
}
