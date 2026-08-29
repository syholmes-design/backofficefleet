import type { Metadata } from "next";
import { MarketingVaultLevelTwo } from "@/components/marketing/MarketingVaultLevelTwo";
import { recordsDocumentation } from "@/lib/bof-vault-level-two";

export const metadata: Metadata = {
  title: "Records & Documentation | BOF Vault | BackOfficeFleet",
  description: recordsDocumentation.description,
};

export default function RecordsDocumentationPage() {
  return <MarketingVaultLevelTwo config={recordsDocumentation} />;
}
