import type { LoadIntakeRecord, LoadIntakeSourceType } from "@/lib/load-requirements-intake-types";
import type { IntakeWizardState } from "@/lib/load-requirements-intake-types";

export type WizardExtractionMeta = {
  providerName?: string;
  confidence?: number;
  warnings?: string[];
} | null;

export function splitDateTime(value?: string): { date?: string; time?: string } {
  const v = String(value || "").trim();
  if (!v) return {};
  if (v.includes("T")) {
    const [date, time] = v.split("T");
    return { date, time: (time || "").slice(0, 5) };
  }
  return { date: v.slice(0, 10) };
}

/** Maps wizard state + pipeline source into fields for `normalizeLoadIntake`. */
export function buildWizardIntakeRecord(
  state: IntakeWizardState,
  sourceType: LoadIntakeSourceType,
  extraction?: WizardExtractionMeta
): Partial<LoadIntakeRecord> {
  const pickup = splitDateTime(state.loadRequirement.pickup_at || state.compliance.appointment_window_start);
  const delivery = splitDateTime(state.loadRequirement.delivery_at || state.compliance.appointment_window_end);
  return {
    sourceType,
    extractionProvider: extraction?.providerName,
    extractionConfidence: extraction?.confidence,
    extractionWarnings: extraction?.warnings,
    humanReviewRequired: sourceType === "upload",
    customerName: state.shipper.shipper_name,
    shipperName: state.shipper.shipper_name,
    pickupFacilityName: state.facility.facility_name,
    pickupAddress1: state.facility.address,
    pickupCity: state.facility.city,
    pickupState: state.facility.state,
    pickupZip: state.facility.zip,
    pickupAppointmentDate: pickup.date,
    pickupAppointmentTime: pickup.time,
    deliveryFacilityName: state.loadRequirement.destination_facility_name,
    deliveryAddress1: state.loadRequirement.destination_address,
    deliveryCity: state.loadRequirement.destination_city,
    deliveryState: state.loadRequirement.destination_state,
    deliveryZip: state.loadRequirement.destination_zip,
    deliveryAppointmentDate: delivery.date,
    deliveryAppointmentTime: delivery.time,
    commodity: state.loadRequirement.commodity,
    weight: state.loadRequirement.weight,
    equipmentType: state.loadRequirement.equipment_type,
    rate: state.loadRequirement.rate_linehaul,
    bolNumber: state.loadRequirement.bol_number,
    sealRequired: state.compliance.seal_required,
    sealNumber: state.loadRequirement.seal_number,
    lumperInstructions: state.compliance.lumper_expected ? "Lumper expected" : "",
    detentionTerms: state.compliance.accessorial_rules,
    insuranceRequired: state.compliance.certificateRequired,
    cargoInsuranceMinimum: state.compliance.cargoCoverageLevel,
    specialInstructions: state.loadRequirement.special_handling,
    assignedDriverId: state.loadRequirement.assigned_driver_id,
    assignedTruckId: state.loadRequirement.truck_id,
    assignedTrailerId: state.loadRequirement.trailer_id,
    loadId: state.loadRequirement.load_id_input,
    invoiceNumber: state.loadRequirement.invoice_number,
    poNumber: undefined,
    rateConfirmationNumber: undefined,
  };
}
