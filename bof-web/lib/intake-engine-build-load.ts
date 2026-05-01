import { MOCK_DOC_URLS } from "@/lib/dispatch-dashboard-seed";
import type { ExtractedFields, ProposedTrip } from "@/lib/intake-engine-types";
import type { Load } from "@/types/dispatch";
import { getTemplateFieldValues } from "@/lib/intake-to-template-mapping";

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
  opts: { dispatch_notes?: string; total_pay_override?: number; intake_id?: string } = {}
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

  // Build intake context for template mapping (simplified to avoid type issues)
  const intakeContext = opts.intake_id 
    ? { intakeId: opts.intake_id, extractedFields: extracted, mappingReport: { totalFields: 0, mappedFields: 0, unmappedFields: [], mappingErrors: [], downstreamDocuments: [] } }
    : null;

  // Get enhanced field values from intake mapping
  const rateConFields = intakeContext ? getTemplateFieldValues("rate-confirmation", intakeContext) : {};
  const bolFields = intakeContext ? getTemplateFieldValues("bill-of-lading", intakeContext) : {};
  const driverFields = intakeContext ? getTemplateFieldValues("driver-instructions", intakeContext) : {};
  const dispatchFields = intakeContext ? getTemplateFieldValues("dispatch-packet", intakeContext) : {};

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

    total_pay,
    settlement_hold: false,
    proof_status: "Incomplete",
    seal_status: "Missing",
    exception_flag: false,
    insurance_claim_needed: false,

    rate_con_url: MOCK_DOC_URLS.rate_con,
    bol_url: MOCK_DOC_URLS.bol,
    invoice_url: MOCK_DOC_URLS.invoice,
    equipment_photo_url: undefined,
    cargo_photo_url: undefined,
    seal_photo_url: undefined,

    lumper_receipt_required: false,
    rfid_tag_id: `RFID-${load_id}`,
    
    // Store intake mapping data in dispatch_notes for downstream use
    dispatch_notes: [
      opts.dispatch_notes ??
      `Created from BOF Intake Engine · tender ${extracted.load_number ?? "n/a"}`,
      "",
      "Intake Field Mappings:",
      `Rate Con: ${Object.keys(rateConFields).join(", ")}`,
      `BOL: ${Object.keys(bolFields).join(", ")}`,
      `Driver: ${Object.keys(driverFields).join(", ")}`,
      `Dispatch: ${Object.keys(dispatchFields).join(", ")}`,
    ].join("\n"),
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
      load_number: `${extracted.load_number ?? "BATCH"}-${trip.row_number}`,
    },
    { dispatch_notes: batchNote, intake_id: `BATCH-${trip.trip_id}` }
  );
  return {
    ...base,
    origin: trip.pickup,
    destination: trip.delivery,
  };
}
