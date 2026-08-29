import type { Metadata } from "next";
import { MarketingVaultLevelTwo } from "@/components/marketing/MarketingVaultLevelTwo";
import { exceptionsDisputes } from "@/lib/bof-vault-level-two";

export const metadata: Metadata = {
  title: "Exceptions & Disputes | BOF Vault | BackOfficeFleet",
  description: exceptionsDisputes.description,
};

export default function ExceptionsDisputesPage() {
  return <MarketingVaultLevelTwo config={exceptionsDisputes} />;
}
