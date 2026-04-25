import type { DriverVaultCategory } from "@/lib/driver-vault-workspace";
import { DRIVER_VAULT_CATEGORIES } from "@/lib/driver-vault-workspace";
import type { BofTemplateDefinition } from "@/lib/bof-template-system";

export type BofVaultOwner = "vault" | "dispatch" | "billing" | "claims" | "load";
export type BofVaultOwnershipCategory =
  | "driver_core"
  | "dispatch_reference"
  | "workflow_reference";

export type BofVaultOwnershipMeta = {
  vaultPrimaryOwner: BofVaultOwner;
  vaultCategory: BofVaultOwnershipCategory;
  vaultSortOrder: number;
  vaultVisible: boolean;
  vaultSecondaryVisible: boolean;
  ownershipLabel: string;
};

const DRIVER_VAULT_ORDER: Record<DriverVaultCategory, number> = DRIVER_VAULT_CATEGORIES.reduce(
  (acc, key, idx) => {
    acc[key] = idx + 1;
    return acc;
  },
  {} as Record<DriverVaultCategory, number>
);

function ownershipLabel(owner: BofVaultOwner, category: BofVaultOwnershipCategory): string {
  if (owner === "vault" && category === "driver_core") return "Vault-owned · driver core";
  if (owner === "dispatch") return "Dispatch reference · visible here";
  if (owner === "billing") return "Billing reference · visible here";
  if (owner === "claims") return "Claims reference · visible here";
  return "Workflow reference · load-owned";
}

export function mapDriverVaultCategoryToOwnership(
  category: DriverVaultCategory
): BofVaultOwnershipMeta {
  return {
    vaultPrimaryOwner: "vault",
    vaultCategory: "driver_core",
    vaultSortOrder: DRIVER_VAULT_ORDER[category] ?? 999,
    vaultVisible: true,
    vaultSecondaryVisible: false,
    ownershipLabel: ownershipLabel("vault", "driver_core"),
  };
}

export function inferDriverVaultCategoryFromDocumentType(
  docType: string
): DriverVaultCategory {
  const t = docType.toLowerCase();
  if (t.includes("cdl")) return "CDL";
  if (t.includes("medical")) return "Medical Certification";
  if (t.includes("mvr")) return "MVR";
  if (t.includes("i-9") || t.includes("i9") || t.includes("employment")) return "Employment / I-9";
  if (t.includes("fmcsa") || t.includes("compliance")) return "FMCSA / Compliance";
  if (t.includes("w-9") || t.includes("w9")) return "W-9";
  if (t.includes("bank")) return "Bank Information";
  if (t.includes("emergency")) return "Emergency Contact";
  if (t.includes("secondary")) return "Secondary Contact";
  if (t.includes("profile")) return "Driver Profile";
  return "Other / Supporting Docs";
}

export function mapTemplateToVaultOwnership(
  template: Pick<
    BofTemplateDefinition,
    | "vaultPrimaryOwner"
    | "vaultCategory"
    | "vaultSortOrder"
    | "vaultVisible"
    | "vaultSecondaryVisible"
    | "primaryModule"
  >
): BofVaultOwnershipMeta {
  const owner: BofVaultOwner = template.vaultPrimaryOwner ?? (template.primaryModule === "vault" ? "vault" : "load");
  const category: BofVaultOwnershipCategory =
    template.vaultCategory ?? (owner === "vault" ? "driver_core" : owner === "dispatch" ? "dispatch_reference" : "workflow_reference");
  return {
    vaultPrimaryOwner: owner,
    vaultCategory: category,
    vaultSortOrder: template.vaultSortOrder ?? (owner === "vault" ? 80 : owner === "dispatch" ? 220 : 320),
    vaultVisible: template.vaultVisible ?? owner === "vault",
    vaultSecondaryVisible: template.vaultSecondaryVisible ?? owner !== "vault",
    ownershipLabel: ownershipLabel(owner, category),
  };
}
