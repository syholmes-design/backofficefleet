/** Shipper requirements intake — pre-dispatch capture (BOF operational model). */

export interface Shipper {
  shipper_id: string;
  shipper_name: string;
  primary_contact_name: string;
  primary_contact_email: string;
  primary_contact_phone: string;
}

export interface Facility {
  facility_id: string;
  shipper_id: string;
  facility_name: string;
  address: string;
  city: string;
  state: string;
  zip?: string;
  facility_rules: string;
  appointment_required: boolean;
}

export interface LoadRequirement {
  load_requirement_id: string;
  shipper_id: string;
  facility_id: string;
  load_id_input?: string;
  pickup_at?: string;
  delivery_at?: string;
  commodity: string;
  weight: number;
  pallet_count: number;
  piece_count: number;
  rate_linehaul?: number;
  assigned_driver_id?: string;
  truck_id?: string;
  trailer_id?: string;
  intake_status?:
    | "scheduled"
    | "dispatched"
    | "in_transit"
    | "delivered";
  bol_number?: string;
  invoice_number?: string;
  seal_number?: string;
  rfid_proof_required?: boolean;
  insurance_requirements_summary?: string;
  pod_bol_instructions?: string;
  backhaul_pay?: number;
  claim_damage_flag?: boolean;
  equipment_type: string;
  special_handling: string;
  destination_facility_name?: string;
  destination_address?: string;
  destination_city?: string;
  destination_state?: string;
  destination_zip?: string;
  route_memory_key?: string;
  temperature_required: boolean;
  temperature_min?: number;
  temperature_max?: number;
}

export interface ComplianceRequirement {
  requirement_id: string;
  load_requirement_id: string;
  seal_required: boolean;
  seal_number_required: boolean;
  pickup_photos_required: boolean;
  delivery_photos_required: boolean;
  cargo_photos_required: boolean;
  insuranceRequirementType: "Standard COI" | "Enhanced COI + waiver" | "Customer-specific";
  cargoCoverageLevel: "$100k" | "$250k" | "$500k" | "$1M+";
  certificateRequired: boolean;
  additionalInsuredRequired: boolean;
  facilityEndorsementRequired: boolean;
  bolRequirementType: "Standard shipper BOL" | "Customer BOL template" | "Dual-signature BOL";
  signedBolRequired: boolean;
  palletCountRequired: boolean;
  pieceCountRequired: boolean;
  sealNotationRequired: boolean;
  bolSpecialInstructions: string;
  podRequirementType:
    | "Standard POD"
    | "POD + photo evidence"
    | "Strict POD + GPS/receiver validation";
  signedPodRequired: boolean;
  receiverPrintedNameRequired: boolean;
  deliveryPhotoRequired: boolean;
  emptyTrailerPhotoRequired: boolean;
  sealVerificationRequired: boolean;
  gpsTimestampRequired: boolean;
  podSpecialInstructions: string;
  insurance_requirements: string;
  appointment_window_start: string;
  appointment_window_end: string;
  bol_instructions: string;
  pod_requirements: string;
  accessorial_rules: string;
  lumper_expected: boolean;
}

export type AutoCheckStatus = "Passed" | "Warning" | "Blocking";

export interface AutoCheckResult {
  check_id: string;
  load_requirement_id: string;
  check_type: string;
  status: AutoCheckStatus;
  message: string;
}

export interface LoadPacket {
  load_packet_id: string;
  load_requirement_id: string;
  packet_status: string;
  missing_items_count: number;
}

export type IntakeWizardState = {
  shipper: Shipper;
  facility: Facility;
  loadRequirement: LoadRequirement;
  compliance: ComplianceRequirement;
  loadPacket: LoadPacket | null;
  lastDraftSavedAt: string | null;
};

export type LoadIntakeSourceType = "manual" | "upload" | "email" | "api";

export type LoadIntakeRecord = {
  sourceType: LoadIntakeSourceType;
  sourceDocumentUrl?: string;
  extractionProvider?: string;
  extractionConfidence?: number;
  extractionWarnings?: string[];
  humanReviewRequired?: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  loadId?: string;
  customerName?: string;
  brokerName?: string;
  shipperName?: string;
  consigneeName?: string;
  pickupFacilityName?: string;
  pickupAddress1?: string;
  pickupCity?: string;
  pickupState?: string;
  pickupZip?: string;
  pickupAppointmentDate?: string;
  pickupAppointmentTime?: string;
  deliveryFacilityName?: string;
  deliveryAddress1?: string;
  deliveryCity?: string;
  deliveryState?: string;
  deliveryZip?: string;
  deliveryAppointmentDate?: string;
  deliveryAppointmentTime?: string;
  commodity?: string;
  weight?: number | string;
  equipmentType?: string;
  rate?: number | string;
  poNumber?: string;
  bolNumber?: string;
  invoiceNumber?: string;
  rateConfirmationNumber?: string;
  sealRequired?: boolean | string;
  sealNumber?: string;
  lumperInstructions?: string;
  detentionTerms?: string;
  insuranceRequired?: boolean | string;
  cargoInsuranceMinimum?: string;
  specialInstructions?: string;
  assignedDriverId?: string;
  assignedTruckId?: string;
  assignedTrailerId?: string;
};
