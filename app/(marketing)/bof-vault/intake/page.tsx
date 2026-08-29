import type { Metadata } from "next";
import { MarketingVaultLevelTwo } from "@/components/marketing/MarketingVaultLevelTwo";
import { vaultIntake } from "@/lib/bof-vault-level-two";

export const metadata: Metadata = {
  title: "Vault Intake | BOF Vault | BackOfficeFleet",
  description: vaultIntake.description,
};

export default function VaultIntakePage() {
  return <MarketingVaultLevelTwo config={vaultIntake} />;
}
