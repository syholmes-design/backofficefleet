import type { Metadata } from "next";
import { MarketingVaultLevelTwo } from "@/components/marketing/MarketingVaultLevelTwo";
import { continuityHistory } from "@/lib/bof-vault-level-two";

export const metadata: Metadata = {
  title: "Continuity & History | BOF Vault | BackOfficeFleet",
  description: continuityHistory.description,
};

export default function ContinuityHistoryPage() {
  return <MarketingVaultLevelTwo config={continuityHistory} />;
}
