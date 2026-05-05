/**
 * BOF Route Owner:
 * URL: /documents/vault/final
 * Type: DRIVER_DOCS
 * Primary component: Unknown
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { DriverVaultFinalArtifactPageClient } from "@/components/documents/DriverVaultFinalArtifactPageClient";

export default async function DriverVaultFinalArtifactPage({
  searchParams,
}: {
  searchParams: Promise<{ driverId?: string; category?: string }>;
}) {
  const params = await searchParams;
  return (
    <DriverVaultFinalArtifactPageClient
      driverId={params.driverId ?? ""}
      category={params.category ?? ""}
    />
  );
}
