/**
 * Dispatch module domain types — aligned with BOF workbook-style fields
 * (load / driver / equipment) for a clean future wire-up to real data.
 */

export type ComplianceStatus = "VALID" | "EXPIRING_SOON" | "EXPIRED";

export type LoadStatus =
  | "Planned"
  | "Assigned"
  | "Dispatched"
  | "In Transit"
  | "Delivered"
  | "Exception";

export type ProofStatus = "Complete" | "Incomplete" | "Missing";

export type SealStatus = "Match" | "Mismatch" | "Missing";

export interface Driver {
  driver_id: string;
  name: string;
  status: "Active" | "Inactive";
  compliance_status: ComplianceStatus;
  phone?: string;
  email?: string;
  home_terminal?: string;
  cdl_number?: string;
  cdl_expiration_date?: string;
  med_card_expiration_date?: string;
  mvr_expiration_date?: string;
}

export interface Tractor {
  tractor_id: string;
  unit_number: string;
  status: "Available" | "Unavailable" | "In Service";
}

export interface Trailer {
  trailer_id: string;
  unit_number: string;
  status: "Available" | "Unavailable" | "In Service";
}

export interface Load {
  load_id: string;
  customer_name: string;
  origin: string;
  destination: string;
  pickup_datetime: string;
  delivery_datetime: string;
  status: LoadStatus;

  driver_id: string | null;
  tractor_id: string | null;
  trailer_id: string | null;

  dispatcher_name: string;
  dispatch_notes?: string;

  total_pay: number;
  settlement_hold: boolean;
  settlement_hold_reason?: string;

  proof_status: ProofStatus;
  seal_status: SealStatus;
  exception_flag: boolean;
  exception_reason?: string;
  insurance_claim_needed: boolean;

  pickup_seal_number?: string;
  delivery_seal_number?: string;

  rate_con_url?: string;
  bol_url?: string;
  pod_url?: string;
  invoice_url?: string;
  pickup_photo_url?: string;
  delivery_photo_url?: string;
  equipment_photo_url?: string;
  cargo_photo_url?: string;
  seal_photo_url?: string;
  lumper_photo_url?: string;

  /** When true, lumper / detention receipt is part of minimum shipper packet (BOF rule). */
  lumper_receipt_required?: boolean;

  /** Intake Engine source (demo) — dispatch row created or stamped from intake. */
  source_intake_id?: string;
  intake_signed_bol_required?: boolean;
  intake_signed_pod_required?: boolean;
  intake_delivery_photos_required?: boolean;
  intake_seal_verification_required?: boolean;

  /** Carrier / insurer claim intake (demo artifact URL). */
  claim_form_url?: string;
  damage_photo_url?: string;
  supporting_attachment_url?: string;

  rfid_tag_id?: string;
}

export type DispatchNavId =
  | "board"
  | "load-detail"
  | "assign"
  | "exceptions"
  | "settlement";
