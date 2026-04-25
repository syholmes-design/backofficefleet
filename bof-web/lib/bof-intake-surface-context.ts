import type { IntakeRecord } from "@/lib/intake-engine-types";
import type { IntakeWizardState } from "@/lib/load-requirements-intake-types";
import { intakeScopedSyntheticKey } from "@/lib/bof-intake-entity";
import type { BofIntakeSurfaceContextPayload } from "@/lib/template-usage-readiness";

function clean(v?: string | null): string | undefined {
  const x = (v ?? "").trim();
  return x.length ? x : undefined;
}

export function buildBofIntakeSurfaceContextFromWizard(
  intakeEntityId: string,
  state: IntakeWizardState
): BofIntakeSurfaceContextPayload {
  const customerLabel = clean(state.shipper.shipper_name);
  const facilityLabel = clean(state.facility.facility_name);
  const destinationLabel = clean(state.loadRequirement.destination_facility_name);
  const destinationSeed = clean(
    `${state.loadRequirement.destination_facility_name ?? ""} ${state.loadRequirement.destination_address ?? ""}`
  );
  const customerId =
    clean(state.shipper.shipper_id) ||
    (customerLabel
      ? intakeScopedSyntheticKey("customer", intakeEntityId, customerLabel)
      : undefined);
  const facilityId =
    clean(state.facility.facility_id) ||
    (facilityLabel
      ? intakeScopedSyntheticKey("facility", intakeEntityId, facilityLabel)
      : undefined);
  const destinationFacilityId =
    destinationLabel || destinationSeed
      ? intakeScopedSyntheticKey("destination", intakeEntityId, destinationSeed ?? destinationLabel)
      : undefined;

  return {
    intakeId: intakeEntityId,
    customerId,
    customerLabel,
    facilityId,
    facilityLabel,
    destinationFacilityId,
    destinationFacilityLabel: destinationLabel,
    routeMemoryKey: clean(state.loadRequirement.route_memory_key),
    appointmentRequired: state.facility.appointment_required,
    contractSelection: clean(
      `${state.compliance.insuranceRequirementType} · ${state.compliance.bolRequirementType}`
    ),
  };
}

export function buildBofIntakeSurfaceContextFromInbox(
  intakeEntityId: string,
  intake: IntakeRecord | null | undefined
): BofIntakeSurfaceContextPayload {
  if (!intake) return { intakeId: intakeEntityId };
  const customerLabel = clean(intake.extracted.customer_or_broker);
  const facilityLabel = clean(intake.extracted.pickup_facility);
  const destinationLabel = clean(intake.extracted.delivery_facility);
  return {
    intakeId: intakeEntityId,
    customerId: customerLabel
      ? intakeScopedSyntheticKey("customer", intakeEntityId, customerLabel)
      : undefined,
    customerLabel,
    facilityId: facilityLabel
      ? intakeScopedSyntheticKey("facility", intakeEntityId, facilityLabel)
      : undefined,
    facilityLabel,
    destinationFacilityId: destinationLabel
      ? intakeScopedSyntheticKey("destination", intakeEntityId, destinationLabel)
      : undefined,
    destinationFacilityLabel: destinationLabel,
    appointmentRequired: undefined,
    routeMemoryKey: undefined,
    contractSelection: clean(intake.pricing_summary),
  };
}
