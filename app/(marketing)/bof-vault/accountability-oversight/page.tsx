import type { Metadata } from "next";
import { MarketingVaultLevelTwo } from "@/components/marketing/MarketingVaultLevelTwo";
import { accountabilityOversight } from "@/lib/bof-vault-level-two";

export const metadata: Metadata = {
  title: "Accountability & Oversight | BOF Vault | BackOfficeFleet",
  description: accountabilityOversight.description,
};

export default function AccountabilityOversightPage() {
  return <MarketingVaultLevelTwo config={accountabilityOversight} />;
}
