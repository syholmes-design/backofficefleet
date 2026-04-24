import { BofTemplateArtifactPageClient } from "@/components/documents/BofTemplateArtifactPageClient";

type Props = {
  searchParams: Promise<{ artifactKey?: string }>;
};

export default async function BofTemplateArtifactPage({ searchParams }: Props) {
  const params = await searchParams;
  return <BofTemplateArtifactPageClient artifactKey={params.artifactKey ?? ""} />;
}
