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
