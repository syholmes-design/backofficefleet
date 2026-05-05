/**
 * BOF Route Owner:
 * URL: /documents/template-packs/artifact
 * Type: DRIVER_DOCS
 * Primary component: Unknown
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { BofTemplateArtifactPageClient } from "@/components/documents/BofTemplateArtifactPageClient";

type Props = {
  searchParams: Promise<{ artifactKey?: string }>;
};

export default async function BofTemplateArtifactPage({ searchParams }: Props) {
  const params = await searchParams;
  return <BofTemplateArtifactPageClient artifactKey={params.artifactKey ?? ""} />;
}
