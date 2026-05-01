export type IntakeFieldKey =
  | "load_id_input"
  | "shipper_name"
  | "pickup_at"
  | "delivery_at"
  | "pickup_facility_name"
  | "pickup_address"
  | "pickup_city"
  | "pickup_state"
  | "pickup_zip"
  | "destination_facility_name"
  | "destination_address"
  | "destination_city"
  | "destination_state"
  | "destination_zip"
  | "commodity"
  | "weight"
  | "pallet_count"
  | "piece_count"
  | "equipment_type"
  | "rate_linehaul"
  | "backhaul_pay"
  | "assigned_driver_id"
  | "truck_id"
  | "trailer_id"
  | "bol_number"
  | "invoice_number"
  | "seal_number"
  | "rfid_proof_required"
  | "claim_damage_flag"
  | "special_handling"
  | "appointment_window_start"
  | "appointment_window_end"
  | "insurance_requirements"
  | "bol_instructions"
  | "pod_requirements"
  | "accessorial_rules"
  | "lumper_expected";

export type LoadIntakeDocumentType =
  | "rate_confirmation"
  | "invoice"
  | "bill_of_lading"
  | "trip_schedule"
  | "master_agreement"
  | "seal_cargo_photo_sheet"
  | "pod"
  | "lumper_receipt"
  | "rfid_proof"
  | "claim_packet";

export type TemplateRegistryStatus =
  | "available"
  | "missing"
  | "broken"
  | "needsMapping";

export type VaultCategory =
  | "core_documents"
  | "proof_media"
  | "exceptions_claims";

export type LoadIntakeTemplateRegistryItem = {
  documentType: LoadIntakeDocumentType;
  displayName: string;
  templatePath?: string;
  outputPath?: string;
  requiredFields: IntakeFieldKey[];
  optionalFields: IntakeFieldKey[];
  relatedLoadId?: string;
  relatedDriverId?: string;
  vaultCategory: VaultCategory;
  canPreview: boolean;
  canDownload: boolean;
  status: TemplateRegistryStatus;
  notes?: string;
};

export type TemplateFieldMapRule = {
  documentType: LoadIntakeDocumentType;
  targetField: string;
  sourceField: IntakeFieldKey;
  required: boolean;
  transform?: "identity" | "currency" | "dateTime" | "booleanYesNo" | "upper";
};
