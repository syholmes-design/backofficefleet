import {
  listAllBofTemplates,
  type BofRequiredEntityKey,
  type BofTemplateDefinition,
} from "@/lib/bof-template-system";
import { mapTemplateToVaultOwnership, type BofVaultOwnershipMeta } from "@/lib/bof-vault-ownership-adapter";
import { buildOwnerWorkflowHref, type BofOwnerWorkflowLink } from "@/lib/bof-owner-workflow-links";

export type BofVaultReferenceContext = {
  intakeId?: string | null;
  driverId?: string | null;
  loadId?: string | null;
  settlementId?: string | null;
  claimId?: string | null;
  customerId?: string | null;
  facilityId?: string | null;
};

export type BofVaultReferenceRow = {
  template: BofTemplateDefinition;
  ownership: BofVaultOwnershipMeta;
  appearsReason: string;
  missingKeys: BofRequiredEntityKey[];
  entityIdForLinks: string | null;
  ownerWorkflow: BofOwnerWorkflowLink;
};

function keyValue(key: BofRequiredEntityKey, c: BofVaultReferenceContext): string | null {
  if (key === "intakeId") return c.intakeId ?? null;
  if (key === "driverId") return c.driverId ?? null;
  if (key === "loadId") return c.loadId ?? null;
  if (key === "settlementId") return c.settlementId ?? null;
  if (key === "billingPacketId") return c.settlementId ?? null;
  if (key === "claimId") return c.claimId ?? null;
  if (key === "customerId") return c.customerId ?? null;
  if (key === "facilityId") return c.facilityId ?? null;
  return null;
}

function linkEntityId(template: BofTemplateDefinition, c: BofVaultReferenceContext): string | null {
  if (template.requiredEntityKeys.includes("claimId")) return c.claimId ?? null;
  if (template.requiredEntityKeys.includes("loadId")) return c.loadId ?? null;
  if (template.requiredEntityKeys.includes("driverId")) return c.driverId ?? null;
  if (template.requiredEntityKeys.includes("settlementId") || template.requiredEntityKeys.includes("billingPacketId")) {
    return c.settlementId ?? null;
  }
  if (template.requiredEntityKeys.includes("intakeId")) return c.intakeId ?? null;
  return c.claimId ?? c.loadId ?? c.driverId ?? c.settlementId ?? c.intakeId ?? null;
}

export function buildVaultReferenceRows(context: BofVaultReferenceContext): BofVaultReferenceRow[] {
  const templates = listAllBofTemplates().filter(
    (t) => t.vaultSecondaryVisible && (t.vaultPrimaryOwner ?? "load") !== "vault"
  );
  const rows = templates.map((template) => {
    const ownership = mapTemplateToVaultOwnership(template);
    const missingKeys = template.requiredEntityKeys.filter(
      (k) => keyValue(k, context) == null
    );
    const entityIdForLinks = linkEntityId(template, context);
    const appearsReason =
      ownership.vaultPrimaryOwner === "dispatch"
        ? "Dispatch reference · visible in Vault for driver readiness context."
        : ownership.vaultPrimaryOwner === "billing"
          ? "Billing reference · visible in Vault for document chain awareness."
          : ownership.vaultPrimaryOwner === "claims"
            ? "Claims reference · visible in Vault for incident support context."
            : "Workflow reference · visible in Vault by association.";
    return {
      template,
      ownership,
      appearsReason,
      missingKeys,
      entityIdForLinks,
      ownerWorkflow: buildOwnerWorkflowHref({
        owner: ownership.vaultPrimaryOwner,
        primarySurface: template.primarySurface,
        context: {
          loadId: context.loadId,
          settlementId: context.settlementId,
          claimId: context.claimId,
        },
      }),
    };
  });

  return rows.sort((a, b) => {
    const ownerRank = (x: BofVaultReferenceRow) =>
      x.ownership.vaultPrimaryOwner === "dispatch"
        ? 0
        : x.ownership.vaultPrimaryOwner === "billing"
          ? 1
          : 2;
    const ar = ownerRank(a);
    const br = ownerRank(b);
    if (ar !== br) return ar - br;
    const as = a.ownership.vaultSortOrder ?? 999;
    const bs = b.ownership.vaultSortOrder ?? 999;
    if (as !== bs) return as - bs;
    return a.template.templateName.localeCompare(b.template.templateName);
  });
}
