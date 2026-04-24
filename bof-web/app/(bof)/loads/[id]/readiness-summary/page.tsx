import { LoadReadinessSummaryArtifactPageClient } from "@/components/loads/LoadReadinessSummaryArtifactPageClient";

type Props = { params: Promise<{ id: string }> };

export default async function LoadReadinessSummaryPage({ params }: Props) {
  const { id } = await params;
  return <LoadReadinessSummaryArtifactPageClient loadId={id} />;
}
