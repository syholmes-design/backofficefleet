import type { LoadIntakeRecord } from "@/lib/load-requirements-intake-types";
import { isDemoOperationalKey } from "@/lib/uos/demo-operational-keys";

export type LiveIntakeCreateLoadBody = {
  fleetId: string;
  customerName: string;
  origin: string;
  destination: string;
  pickupWindowStart?: string;
  deliveryWindowStart?: string;
  referenceNumber?: string;
  secondaryReferenceNumber?: string;
  commodityClass?: string;
  status: "PLANNED";
};

function place(parts: Array<string | undefined>) {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(", ");
}

function appointment(date?: string, time?: string) {
  const day = date?.trim();
  if (!day) return undefined;
  const clock = time?.trim().slice(0, 5);
  return clock ? `${day}T${clock}` : day;
}

function rejectDemo(value: string | undefined, label: string) {
  if (value && isDemoOperationalKey(value)) {
    throw new Error(`${label} is a DEMO operational key and cannot be saved as a live load.`);
  }
}

/**
 * Maps a reviewed intake record onto the existing POST /api/dispatch/load body.
 * Status stays PLANNED. Rates are not copied into pay fields.
 */
export function mapIntakeRecordToCreateLoadPayload(
  record: LoadIntakeRecord,
  fleetId: string,
): LiveIntakeCreateLoadBody {
  const fleet = fleetId.trim();
  if (!fleet) throw new Error("fleetId is required");
  rejectDemo(fleet, "fleetId");

  const customerName = (record.customerName || record.shipperName || record.brokerName || "").trim();
  const origin = place([record.pickupFacilityName, record.pickupAddress1, record.pickupCity, record.pickupState, record.pickupZip]);
  const destination = place([
    record.deliveryFacilityName,
    record.deliveryAddress1,
    record.deliveryCity,
    record.deliveryState,
    record.deliveryZip,
  ]);
  if (!customerName || !origin || !destination) {
    throw new Error("A live load needs a customer, a pickup, and a delivery.");
  }

  const referenceNumber = (record.bolNumber || record.poNumber || record.rateConfirmationNumber || "").trim();
  const secondaryReferenceNumber = (record.invoiceNumber || "").trim();
  rejectDemo(record.loadId, "loadId");
  rejectDemo(referenceNumber, "referenceNumber");
  rejectDemo(secondaryReferenceNumber, "secondaryReferenceNumber");

  const body: LiveIntakeCreateLoadBody = {
    fleetId: fleet,
    customerName,
    origin,
    destination,
    status: "PLANNED",
  };
  const pickupWindowStart = appointment(record.pickupAppointmentDate, record.pickupAppointmentTime);
  const deliveryWindowStart = appointment(record.deliveryAppointmentDate, record.deliveryAppointmentTime);
  if (pickupWindowStart) body.pickupWindowStart = pickupWindowStart;
  if (deliveryWindowStart) body.deliveryWindowStart = deliveryWindowStart;
  if (referenceNumber) body.referenceNumber = referenceNumber;
  if (secondaryReferenceNumber) body.secondaryReferenceNumber = secondaryReferenceNumber;
  const commodity = record.commodity ? String(record.commodity).trim() : "";
  if (commodity) body.commodityClass = commodity;
  return body;
}
