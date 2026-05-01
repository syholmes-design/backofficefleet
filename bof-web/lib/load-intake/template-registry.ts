import {
  getExpectedOutputPath,
  getResolvedOutputPath,
  getTemplatePath,
} from "@/lib/load-intake/document-paths";
import { getTemplateFieldMap } from "@/lib/load-intake/template-field-map";
import type {
  IntakeFieldKey,
  LoadIntakeDocumentType,
  LoadIntakeTemplateRegistryItem,
  TemplateRegistryStatus,
  VaultCategory,
} from "@/lib/load-intake/types";

type RegistrySeed = {
  documentType: LoadIntakeDocumentType;
  displayName: string;
  vaultCategory: VaultCategory;
  canPreview: boolean;
  canDownload: boolean;
};

const SEEDS: RegistrySeed[] = [
  { documentType: "rate_confirmation", displayName: "Rate Confirmation", vaultCategory: "core_documents", canPreview: true, canDownload: true },
  { documentType: "invoice", displayName: "Invoice", vaultCategory: "core_documents", canPreview: true, canDownload: true },
  { documentType: "bill_of_lading", displayName: "Bill of Lading (BOL)", vaultCategory: "core_documents", canPreview: true, canDownload: true },
  { documentType: "trip_schedule", displayName: "Trip Schedule / Work Order", vaultCategory: "core_documents", canPreview: true, canDownload: true },
  { documentType: "master_agreement", displayName: "Master Agreement Reference", vaultCategory: "core_documents", canPreview: true, canDownload: true },
  { documentType: "seal_cargo_photo_sheet", displayName: "Seal / Cargo Photo Sheet", vaultCategory: "proof_media", canPreview: true, canDownload: true },
  { documentType: "pod", displayName: "Proof of Delivery (POD)", vaultCategory: "proof_media", canPreview: true, canDownload: true },
  { documentType: "lumper_receipt", displayName: "Lumper Receipt", vaultCategory: "proof_media", canPreview: true, canDownload: true },
  { documentType: "rfid_proof", displayName: "RFID Proof", vaultCategory: "proof_media", canPreview: true, canDownload: true },
  { documentType: "claim_packet", displayName: "Claim Packet", vaultCategory: "exceptions_claims", canPreview: true, canDownload: true },
];

function toFields(documentType: LoadIntakeDocumentType): {
  requiredFields: IntakeFieldKey[];
  optionalFields: IntakeFieldKey[];
} {
  const rules = getTemplateFieldMap(documentType);
  return {
    requiredFields: rules.filter((rule) => rule.required).map((rule) => rule.sourceField),
    optionalFields: rules.filter((rule) => !rule.required).map((rule) => rule.sourceField),
  };
}

function statusFor(
  documentType: LoadIntakeDocumentType,
  templatePath: string | undefined,
  outputPath: string | undefined,
  hasFieldMapping: boolean,
  loadId?: string
): TemplateRegistryStatus {
  if (!templatePath) return "missing";
  if (!hasFieldMapping) return "needsMapping";
  if (!loadId) return "available";
  if (outputPath) return "available";
  if (
    documentType === "rate_confirmation" ||
    documentType === "invoice" ||
    documentType === "bill_of_lading" ||
    documentType === "pod"
  ) {
    return "broken";
  }
  return "needsMapping";
}

export function buildLoadIntakeTemplateRegistry(params?: {
  loadId?: string;
  driverId?: string;
}): LoadIntakeTemplateRegistryItem[] {
  const loadId = params?.loadId;
  const driverId = params?.driverId;

  return SEEDS.map((seed) => {
    const templatePath = getTemplatePath(seed.documentType);
    const outputPath = getResolvedOutputPath(seed.documentType, loadId);
    const expectedOutputPath = getExpectedOutputPath(seed.documentType, loadId);
    const fieldMap = getTemplateFieldMap(seed.documentType);
    const fields = toFields(seed.documentType);
    const status = statusFor(
      seed.documentType,
      templatePath,
      outputPath,
      fieldMap.length > 0,
      loadId
    );

    return {
      documentType: seed.documentType,
      displayName: seed.displayName,
      templatePath,
      outputPath: outputPath ?? expectedOutputPath,
      requiredFields: fields.requiredFields,
      optionalFields: fields.optionalFields,
      relatedLoadId: loadId,
      relatedDriverId: driverId,
      vaultCategory: seed.vaultCategory,
      canPreview: seed.canPreview,
      canDownload: seed.canDownload,
      status,
      notes:
        status === "broken"
          ? "Expected generated output is missing for a core required document."
          : status === "needsMapping"
            ? "Template exists but generated output is not linked for this load yet."
            : undefined,
    };
  });
}
