/**
 * BOF Route Owner:
 * URL: /documents/template-packs
 * Type: DRIVER_DOCS
 * Primary component: Unknown
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import { BofTemplatePacksWorkspaceClient } from "@/components/documents/BofTemplatePacksWorkspaceClient";
import type { BofTemplatePackId } from "@/lib/bof-template-system";

type Props = {
  searchParams: Promise<{ packId?: string; entityId?: string; templateId?: string }>;
};

export default async function BofTemplatePacksPage({ searchParams }: Props) {
  const params = await searchParams;
  const packId = params.packId as BofTemplatePackId | undefined;
  return (
    <BofTemplatePacksWorkspaceClient
      initialPackId={packId}
      initialEntityId={params.entityId}
      initialTemplateId={params.templateId}
    />
  );
}
