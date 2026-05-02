import type { IntakeRecord } from "@/lib/intake-engine-types";
import type { IntakeWizardState } from "@/lib/load-requirements-intake-types";
import { createLoadIntakeWizardState } from "@/lib/load-intake/wizard-initial-state";

/** Load-trip intakes can round-trip into the canonical load intake wizard; driver/claim inboxes cannot. */
export function intakeRecordSupportsLoadWizard(record: IntakeRecord): boolean {
  return (
    record.intake_kind === "single_trip" ||
    record.intake_kind === "multi_trip" ||
    record.intake_kind === "load_document"
  );
}

function mergeIsoDateTime(dateStr: string | undefined, timeHHMM: string): string {
  const raw = String(dateStr || "").trim();
  if (!raw) return "";
  const day = raw.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return "";
  return `${day}T${timeHHMM.slice(0, 5)}`;
}

/**
 * Maps Intake Engine extraction + intake metadata into the load intake wizard shape.
 * Only copies fields that exist on the intake record — no synthetic lane data.
 */
export function mergeIntakeEngineRecordIntoWizardState(intake: IntakeRecord): IntakeWizardState {
  const s = createLoadIntakeWizardState();
  const e = intake.extracted;

  const shipId = `SHIP-${intake.intake_id}`;
  const facId = `FAC-${intake.intake_id}`;
  const lrId = `LR-${intake.intake_id}`;
  const reqId = `REQ-${intake.intake_id}`;

  s.shipper.shipper_id = shipId;
  s.facility.facility_id = facId;
  s.facility.shipper_id = shipId;
  s.loadRequirement.shipper_id = shipId;
  s.loadRequirement.facility_id = facId;
  s.loadRequirement.load_requirement_id = lrId;
  s.compliance.requirement_id = reqId;
  s.compliance.load_requirement_id = lrId;

  if (e.customer_or_broker?.trim()) {
    s.shipper.shipper_name = e.customer_or_broker.trim();
  }

  const sender = intake.source_sender?.trim();
  if (sender) {
    const emailMatch = sender.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/);
    if (emailMatch) {
      s.shipper.primary_contact_email = emailMatch[0];
      const namePart = sender.replace(emailMatch[0], "").replace(/[<>]/g, "").trim();
      if (namePart) s.shipper.primary_contact_name = namePart;
    } else {
      s.shipper.primary_contact_name = sender;
    }
  }

  if (e.pickup_facility?.trim()) s.facility.facility_name = e.pickup_facility.trim();
  if (e.pickup_address?.trim()) s.facility.address = e.pickup_address.trim();
  if (e.pickup_city?.trim()) s.facility.city = e.pickup_city.trim();
  if (e.pickup_state?.trim()) s.facility.state = e.pickup_state.trim().slice(0, 2).toUpperCase();

  if (e.delivery_facility?.trim()) {
    s.loadRequirement.destination_facility_name = e.delivery_facility.trim();
  }
  if (e.delivery_address?.trim()) s.loadRequirement.destination_address = e.delivery_address.trim();
  if (e.delivery_city?.trim()) s.loadRequirement.destination_city = e.delivery_city.trim();
  if (e.delivery_state?.trim()) {
    s.loadRequirement.destination_state = e.delivery_state.trim().slice(0, 2).toUpperCase();
  }

  const pickupIso = mergeIsoDateTime(e.pickup_date, "08:00");
  const deliveryIso = mergeIsoDateTime(e.delivery_date, "17:00");
  if (pickupIso) {
    s.loadRequirement.pickup_at = pickupIso;
    s.compliance.appointment_window_start = pickupIso;
  }
  if (deliveryIso) {
    s.loadRequirement.delivery_at = deliveryIso;
    s.compliance.appointment_window_end = deliveryIso;
  }

  if (typeof e.rate_linehaul === "number" && Number.isFinite(e.rate_linehaul) && e.rate_linehaul > 0) {
    s.loadRequirement.rate_linehaul = e.rate_linehaul;
  }
  if (e.equipment?.trim()) s.loadRequirement.equipment_type = e.equipment.trim();
  if (e.load_number?.trim()) s.loadRequirement.load_id_input = e.load_number.trim();
  if (e.notes?.trim()) s.loadRequirement.special_handling = e.notes.trim();

  if (intake.linked_driver_id?.startsWith("DRV-")) {
    s.loadRequirement.assigned_driver_id = intake.linked_driver_id;
  }

  if (intake.insurance_requirements?.trim()) {
    s.compliance.insurance_requirements = intake.insurance_requirements.trim();
  }
  if (intake.bol_requirements?.trim()) {
    s.compliance.bol_instructions = intake.bol_requirements.trim();
  }
  if (intake.pod_requirements?.trim()) {
    s.compliance.pod_requirements = intake.pod_requirements.trim();
  }

  return s;
}
