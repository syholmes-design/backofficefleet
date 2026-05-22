import type { LoadIntakeDocumentType, TemplateFieldMapRule } from "@/lib/load-intake/types";

const RULES: TemplateFieldMapRule[] = [
  { documentType: "rate_confirmation", targetField: "loadId", sourceField: "load_id_input", required: true, transform: "upper" },
  { documentType: "rate_confirmation", targetField: "customer", sourceField: "shipper_name", required: true },
  { documentType: "rate_confirmation", targetField: "pickupAppointment", sourceField: "pickup_at", required: true, transform: "dateTime" },
  { documentType: "rate_confirmation", targetField: "deliveryAppointment", sourceField: "delivery_at", required: true, transform: "dateTime" },
  { documentType: "rate_confirmation", targetField: "linehaulRate", sourceField: "rate_linehaul", required: true, transform: "currency" },
  { documentType: "rate_confirmation", targetField: "equipmentType", sourceField: "equipment_type", required: true },
  { documentType: "rate_confirmation", targetField: "commodity", sourceField: "commodity", required: true },
  { documentType: "rate_confirmation", targetField: "specialHandling", sourceField: "special_handling", required: false },

  { documentType: "invoice", targetField: "invoiceNumber", sourceField: "invoice_number", required: false },
  { documentType: "invoice", targetField: "linehaulRate", sourceField: "rate_linehaul", required: true, transform: "currency" },
  { documentType: "invoice", targetField: "backhaulPay", sourceField: "backhaul_pay", required: false, transform: "currency" },
  { documentType: "invoice", targetField: "customer", sourceField: "shipper_name", required: true },
  { documentType: "invoice", targetField: "loadId", sourceField: "load_id_input", required: true, transform: "upper" },

  { documentType: "bill_of_lading", targetField: "bolNumber", sourceField: "bol_number", required: false },
  { documentType: "bill_of_lading", targetField: "pickupFacility", sourceField: "pickup_facility_name", required: true },
  { documentType: "bill_of_lading", targetField: "deliveryFacility", sourceField: "destination_facility_name", required: true },
  { documentType: "bill_of_lading", targetField: "commodity", sourceField: "commodity", required: true },
  { documentType: "bill_of_lading", targetField: "weight", sourceField: "weight", required: true },
  { documentType: "bill_of_lading", targetField: "pieces", sourceField: "piece_count", required: false },
  { documentType: "bill_of_lading", targetField: "pallets", sourceField: "pallet_count", required: false },
  { documentType: "bill_of_lading", targetField: "bolInstructions", sourceField: "bol_instructions", required: false },

  { documentType: "trip_schedule", targetField: "pickupAt", sourceField: "pickup_at", required: true, transform: "dateTime" },
  { documentType: "trip_schedule", targetField: "deliveryAt", sourceField: "delivery_at", required: true, transform: "dateTime" },
  { documentType: "trip_schedule", targetField: "appointmentStart", sourceField: "appointment_window_start", required: false, transform: "dateTime" },
  { documentType: "trip_schedule", targetField: "appointmentEnd", sourceField: "appointment_window_end", required: false, transform: "dateTime" },
  { documentType: "trip_schedule", targetField: "truckId", sourceField: "truck_id", required: false, transform: "upper" },
  { documentType: "trip_schedule", targetField: "trailerId", sourceField: "trailer_id", required: false, transform: "upper" },
  { documentType: "trip_schedule", targetField: "driverId", sourceField: "assigned_driver_id", required: false, transform: "upper" },

  { documentType: "master_agreement", targetField: "customer", sourceField: "shipper_name", required: true },
  { documentType: "master_agreement", targetField: "loadId", sourceField: "load_id_input", required: true, transform: "upper" },
  { documentType: "master_agreement", targetField: "specialHandling", sourceField: "special_handling", required: false },

  { documentType: "seal_cargo_photo_sheet", targetField: "sealNumber", sourceField: "seal_number", required: false },
  { documentType: "seal_cargo_photo_sheet", targetField: "pickupFacility", sourceField: "pickup_facility_name", required: true },
  { documentType: "seal_cargo_photo_sheet", targetField: "deliveryFacility", sourceField: "destination_facility_name", required: true },
  { documentType: "seal_cargo_photo_sheet", targetField: "claimFlag", sourceField: "claim_damage_flag", required: false, transform: "booleanYesNo" },

  { documentType: "pod", targetField: "podRequirements", sourceField: "pod_requirements", required: false },
  { documentType: "pod", targetField: "deliveryAt", sourceField: "delivery_at", required: true, transform: "dateTime" },
  { documentType: "pod", targetField: "deliveryFacility", sourceField: "destination_facility_name", required: true },

  { documentType: "lumper_receipt", targetField: "lumperExpected", sourceField: "lumper_expected", required: false, transform: "booleanYesNo" },
  { documentType: "lumper_receipt", targetField: "accessorialRules", sourceField: "accessorial_rules", required: false },

  { documentType: "rfid_proof", targetField: "rfidRequired", sourceField: "rfid_proof_required", required: false, transform: "booleanYesNo" },
  { documentType: "rfid_proof", targetField: "sealNumber", sourceField: "seal_number", required: false },

  { documentType: "claim_packet", targetField: "claimFlag", sourceField: "claim_damage_flag", required: true, transform: "booleanYesNo" },
  { documentType: "claim_packet", targetField: "insuranceRequirements", sourceField: "insurance_requirements", required: false },
  { documentType: "claim_packet", targetField: "podRequirements", sourceField: "pod_requirements", required: false },
  { documentType: "claim_packet", targetField: "bolInstructions", sourceField: "bol_instructions", required: false },
];

export function getTemplateFieldMap(documentType: LoadIntakeDocumentType): TemplateFieldMapRule[] {
  return RULES.filter((rule) => rule.documentType === documentType);
}

export function getMissingMappedDocumentTypes(): LoadIntakeDocumentType[] {
  const all: LoadIntakeDocumentType[] = [
    "rate_confirmation",
    "invoice",
    "bill_of_lading",
    "trip_schedule",
    "master_agreement",
    "seal_cargo_photo_sheet",
    "pod",
    "lumper_receipt",
    "rfid_proof",
    "claim_packet",
  ];
  return all.filter((documentType) => getTemplateFieldMap(documentType).length === 0);
}
