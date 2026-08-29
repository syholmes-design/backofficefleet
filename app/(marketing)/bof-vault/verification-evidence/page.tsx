import type { Metadata } from "next";
import { MarketingVaultLevelTwo } from "@/components/marketing/MarketingVaultLevelTwo";
import { verificationEvidence } from "@/lib/bof-vault-level-two";

export const metadata: Metadata = {
  title: "Verification & Evidence | BOF Vault | BackOfficeFleet",
  description: verificationEvidence.description,
};

export default function VerificationEvidencePage() {
  return <MarketingVaultLevelTwo config={verificationEvidence} />;
}
