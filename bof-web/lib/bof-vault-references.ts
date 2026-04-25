import {
  listAllBofTemplates,
  type BofRequiredEntityKey,
  type BofTemplateDefinition,
} from "@/lib/bof-template-system";
import { mapTemplateToVaultOwnership, type BofVaultOwnershipMeta } from "@/lib/bof-vault-ownership-adapter";

export type BofVaultReferenceContext = {
  intakeId?: string | null;
  driverId?: string | null;
  loadId?: string | null;
  settlementId?: string | null;
};

export type BofVaultReferenceRow = {
  template: BofTemplateDefinition;
  ownership: BofVaultOwnershipMeta;
  appearsReason: string;
  missingKeys: BofRequiredEntityKey[];
  entityIdForLinks: string | null;
  ownerWorkflowHref: string;
};

function ownerHref(owner: BofVaultOwnershipMeta["vaultPrimaryOwner"]): string {
  if (owner === "dispatch") return "/dispatch";
  if (owner === "billing") return "/settlements";
  if (owner === "claims") return "/money-at-risk";
  return "/loads";
}

function keyValue(key: BofRequiredEntityKey, c: BofVaultReferenceContext): string | null {
  if (key === "intakeId") return c.intakeId ?? null;
  if (key === "driverId") return c.driverId ?? null;
  if (key === "loadId") return c.loadId ?? null;
  if (key === "settlementId") return c.settlementId ?? null;
  if (key === "billingPacketId") return c.settlementId ?? null;
  if (key === "claimId") return c.loadId ?? null;
  return null;
}

function linkEntityId(template: BofTemplateDefinition, c: BofVaultReferenceContext): string | null {
  if (template.requiredEntityKeys.includes("loadId")) return c.loadId ?? null;
  if (template.requiredEntityKeys.includes("driverId")) return c.driverId ?? null;
  if (template.requiredEntityKeys.includes("settlementId") || template.requiredEntityKeys.includes("billingPacketId")) {
    return c.settlementId ?? null;
  }
  if (template.requiredEntityKeys.includes("intakeId")) return c.intakeId ?? null;
  return c.loadId ?? c.driverId ?? c.settlementId ?? c.intakeId ?? null;
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
      ownerWorkflowHref: ownerHref(ownership.vaultPrimaryOwner),
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
