import type { Metadata } from "next";
import { MarketingVaultLevelTwo } from "@/components/marketing/MarketingVaultLevelTwo";
import { administrativeActions } from "@/lib/bof-vault-level-two";

export const metadata: Metadata = {
  title: "Administrative Actions | BOF Vault | BackOfficeFleet",
  description: administrativeActions.description,
};

export default function AdministrativeActionsPage() {
  return <MarketingVaultLevelTwo config={administrativeActions} />;
}
