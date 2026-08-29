import type { Metadata } from "next";
import { MarketingVaultLevelTwo } from "@/components/marketing/MarketingVaultLevelTwo";
import { identityAccess } from "@/lib/bof-vault-level-two";

export const metadata: Metadata = {
  title: "Identity & Access | BOF Vault | BackOfficeFleet",
  description: identityAccess.description,
};

export default function IdentityAccessPage() {
  return <MarketingVaultLevelTwo config={identityAccess} />;
}
