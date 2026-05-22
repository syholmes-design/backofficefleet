import type { BofPrimarySurface } from "@/lib/bof-template-system";
import type { BofVaultOwner } from "@/lib/bof-vault-ownership-adapter";

export type BofOwnerWorkflowLinkContext = {
  loadId?: string | null;
  settlementId?: string | null;
  claimId?: string | null;
};

export type BofOwnerWorkflowLink = {
  href: string;
  label: string;
};

export function buildOwnerWorkflowHref({
  owner,
  primarySurface,
  context,
}: {
  owner: BofVaultOwner;
  primarySurface: BofPrimarySurface;
  context: BofOwnerWorkflowLinkContext;
}): BofOwnerWorkflowLink {
  if (owner === "dispatch") {
    if (context.loadId && primarySurface === "dispatch_release") {
      return { href: `/trip-release/${encodeURIComponent(context.loadId)}`, label: "Open in Dispatch" };
    }
    if (context.loadId) {
      return { href: `/loads/${encodeURIComponent(context.loadId)}`, label: "Open Load Detail" };
    }
    return { href: "/dispatch", label: "Open in Dispatch" };
  }

  if (owner === "billing") {
    if (context.settlementId) {
      return {
        href: `/settlements#${encodeURIComponent(context.settlementId)}`,
        label: "Open in Billing",
      };
    }
    return { href: "/settlements", label: "Open in Billing" };
  }

  if (owner === "claims") {
    if (context.loadId) {
      return {
        href: `/loads/${encodeURIComponent(context.loadId)}#claim-packet`,
        label: "Open in Claims",
      };
    }
    return { href: "/money-at-risk", label: "Open in Claims" };
  }

  if (owner === "load") {
    if (context.loadId) return { href: `/loads/${encodeURIComponent(context.loadId)}`, label: "Open Load Detail" };
    return { href: "/loads", label: "Open Loads" };
  }

  return { href: "/documents/vault", label: "Open Vault Workspace" };
}
