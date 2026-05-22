/**
 * BOF Route Owner:
 * URL: /loads/:id/readiness-summary
 * Type: DISPATCH
 * Primary component: Unknown
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { LoadReadinessSummaryArtifactPageClient } from "@/components/loads/LoadReadinessSummaryArtifactPageClient";

type Props = { params: Promise<{ id: string }> };

export default async function LoadReadinessSummaryPage({ params }: Props) {
  const { id } = await params;
  return <LoadReadinessSummaryArtifactPageClient loadId={id} />;
}
