import generatedLoadManifest from "@/lib/generated/load-doc-manifest.json";
import type { GeneratedLoadDocEntry } from "@/lib/load-doc-manifest";
import type { LoadIntakeDocumentType } from "@/lib/load-intake/types";
import { getLoadEvidenceUrl } from "@/lib/load-documents";

const generatedManifest = (generatedLoadManifest ?? {}) as Record<string, GeneratedLoadDocEntry>;

const TEMPLATE_PATHS: Partial<Record<LoadIntakeDocumentType, string>> = {
  rate_confirmation: "scripts/templates/load-docs/rate-confirmation.template.html",
  invoice: "scripts/templates/load-docs/invoice.template.html",
  bill_of_lading: "scripts/templates/load-docs/bol.template.html",
  trip_schedule: "scripts/templates/load-docs/work-order.template.html",
  master_agreement: "scripts/templates/load-docs/master-agreement-reference.template.html",
  seal_cargo_photo_sheet: "scripts/templates/load-docs/seal-verification.template.html",
  pod: "scripts/templates/load-docs/pod.template.html",
  lumper_receipt: "scripts/templates/load-docs/lumper-receipt.template.html",
  rfid_proof: "scripts/templates/load-docs/rfid-proof.template.html",
  claim_packet: "scripts/templates/load-docs/claim-packet.template.html",
};

function loadDocOutputPath(loadId: string, fileName: string) {
  return `/generated/loads/${loadId}/${fileName}`;
}

export function getTemplatePath(documentType: LoadIntakeDocumentType): string | undefined {
  return TEMPLATE_PATHS[documentType];
}

export function getExpectedOutputPath(
  documentType: LoadIntakeDocumentType,
  loadId?: string
): string | undefined {
  if (!loadId) return undefined;
  if (documentType === "rate_confirmation") return loadDocOutputPath(loadId, "rate-confirmation.html");
  if (documentType === "invoice") return loadDocOutputPath(loadId, "invoice.html");
  if (documentType === "bill_of_lading") return loadDocOutputPath(loadId, "bol.html");
  if (documentType === "trip_schedule") return loadDocOutputPath(loadId, "work-order.html");
  if (documentType === "master_agreement") return loadDocOutputPath(loadId, "master-agreement-reference.html");
  if (documentType === "seal_cargo_photo_sheet") return loadDocOutputPath(loadId, "seal-verification.html");
  if (documentType === "pod") return loadDocOutputPath(loadId, "pod.html");
  if (documentType === "lumper_receipt") return loadDocOutputPath(loadId, "lumper-receipt.html");
  if (documentType === "rfid_proof") return loadDocOutputPath(loadId, "rfid-proof.html");
  if (documentType === "claim_packet") return loadDocOutputPath(loadId, "claim-packet.html");
  return undefined;
}

export function getResolvedOutputPath(
  documentType: LoadIntakeDocumentType,
  loadId?: string
): string | undefined {
  if (!loadId) return undefined;
  const row = generatedManifest[loadId] ?? {};
  if (documentType === "rate_confirmation") return row.rateConfirmation;
  if (documentType === "invoice") return row.invoice;
  if (documentType === "bill_of_lading") return row.bol;
  if (documentType === "trip_schedule") return row.workOrder;
  if (documentType === "master_agreement") return row.masterAgreementReference;
  if (documentType === "seal_cargo_photo_sheet") {
    return getLoadEvidenceUrl(loadId, "cargoPhoto") ?? row.sealVerification;
  }
  if (documentType === "pod") return row.pod;
  if (documentType === "lumper_receipt") {
    return getLoadEvidenceUrl(loadId, "lumperReceipt") ?? row.lumperReceipt;
  }
  if (documentType === "rfid_proof") {
    return getLoadEvidenceUrl(loadId, "rfidDockProof") ?? row.rfidProof;
  }
  if (documentType === "claim_packet") return row.claimPacket;
  return undefined;
}
