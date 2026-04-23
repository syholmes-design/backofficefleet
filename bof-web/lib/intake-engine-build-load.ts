import { MOCK_DOC_URLS } from "@/lib/dispatch-dashboard-seed";
import type { ExtractedFields, ProposedTrip } from "@/lib/intake-engine-types";
import type { Load } from "@/types/dispatch";

function laneLabel(facility?: string, city?: string, state?: string): string {
  const c = [city, state].filter(Boolean).join(", ");
  if (facility && c) return `${facility} - ${c}`;
  if (facility) return facility;
  return c || "Origin TBD";
}

function isoFromDate(d?: string): string {
  if (!d) {
    const n = new Date();
    return n.toISOString().slice(0, 16);
  }
  const parsed = Date.parse(d);
  if (Number.isNaN(parsed)) {
    const n = new Date();
    return n.toISOString().slice(0, 16);
  }
  return new Date(parsed).toISOString().slice(0, 16);
}

function nextDelivery(pickupIso: string): string {
  const d = new Date(pickupIso);
  d.setDate(d.getDate() + 2);
  return d.toISOString().slice(0, 16);
}

let intakeSeq = 0;

export function nextIntakeDerivedLoadId(): string {
  intakeSeq += 1;
  return `IN-L-${Date.now().toString(36)}-${intakeSeq}`;
}

/** Build a dispatch-ready draft load from intake extraction (demo defaults). */
export function buildDraftLoadFromExtracted(
  extracted: ExtractedFields,
  opts: { dispatch_notes?: string; total_pay_override?: number } = {}
): Load {
  const load_id = nextIntakeDerivedLoadId();
  const origin = laneLabel(
    extracted.pickup_facility,
    extracted.pickup_city,
    extracted.pickup_state
  );
  const destination = laneLabel(
    extracted.delivery_facility,
    extracted.delivery_city,
    extracted.delivery_state
  );
  const pickup_datetime = isoFromDate(extracted.pickup_date);
  const delivery_datetime = extracted.delivery_date
    ? isoFromDate(extracted.delivery_date)
    : nextDelivery(pickup_datetime);
  const total_pay =
    opts.total_pay_override ?? extracted.rate_linehaul ?? 0;

  return {
    load_id,
    customer_name: extracted.customer_or_broker || "Unknown customer",
    origin,
    destination,
    pickup_datetime,
    delivery_datetime,
    status: "Planned",
    driver_id: null,
    tractor_id: null,
    trailer_id: null,
    dispatcher_name: "Intake Engine",
    dispatch_notes:
      opts.dispatch_notes ??
      `Created from BOF Intake Engine · tender ${extracted.load_number ?? "n/a"}`,

    total_pay,
    settlement_hold: false,
    proof_status: "Incomplete",
    seal_status: "Missing",
    exception_flag: false,
    insurance_claim_needed: false,

    rate_con_url: MOCK_DOC_URLS.rate_con,
    bol_url: MOCK_DOC_URLS.bol,
    invoice_url: MOCK_DOC_URLS.invoice,
    equipment_photo_url: MOCK_DOC_URLS.equipment_photo,
    cargo_photo_url: MOCK_DOC_URLS.cargo_photo,
    seal_photo_url: MOCK_DOC_URLS.seal_photo,

    lumper_receipt_required: false,
    rfid_tag_id: `RFID-${load_id}`,
  };
}

export function buildDraftLoadFromTrip(
  trip: ProposedTrip,
  extracted: ExtractedFields,
  batchNote: string
): Load {
  const base = buildDraftLoadFromExtracted(
    {
      ...extracted,
      rate_linehaul: trip.rate,
    },
    {
      dispatch_notes: `${batchNote} · trip row ${trip.row_number} (${trip.trip_id})`,
      total_pay_override: trip.rate,
    }
  );
  return {
    ...base,
    origin: trip.pickup,
    destination: trip.delivery,
  };
}
