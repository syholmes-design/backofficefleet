import { BofTemplatePacksWorkspaceClient } from "@/components/documents/BofTemplatePacksWorkspaceClient";
import type { BofTemplatePackId } from "@/lib/bof-template-system";

type Props = {
  searchParams: Promise<{ packId?: string; entityId?: string }>;
};

export default async function BofTemplatePacksPage({ searchParams }: Props) {
  const params = await searchParams;
  const packId = params.packId as BofTemplatePackId | undefined;
  return <BofTemplatePacksWorkspaceClient initialPackId={packId} initialEntityId={params.entityId} />;
}
