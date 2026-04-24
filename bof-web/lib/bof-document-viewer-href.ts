import type { BofTemplatePackId } from "@/lib/bof-template-system";

/** Deep-link into the BOF operational document viewer (demo). */
export function buildBofDocumentViewerHref(args: {
  templateId: string;
  entityId: string;
  packId?: BofTemplatePackId;
  /** Optional return navigation (relative path). */
  returnTo?: string;
}): string {
  const q = new URLSearchParams();
  q.set("templateId", args.templateId);
  q.set("entityId", args.entityId);
  if (args.packId) q.set("packId", args.packId);
  if (args.returnTo) q.set("returnTo", args.returnTo);
  return `/documents/template-packs/view?${q.toString()}`;
}
