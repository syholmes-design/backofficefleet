/** BOF Intake Engine — demo intake model (email-to-intake, finalize in BOF). */

export type IntakeSourceType = "email" | "upload" | "internal";

export type IntakeKind =
  | "single_trip"
  | "multi_trip"
  | "load_document"
  | "driver_document"
  | "claim_document"
  | "billing_document";

export type IntakeStatus =
  | "new"
  | "needs_review"
  | "ready_for_approval"
  | "on_hold"
  | "awaiting_info"
  | "finalized"
  | "rejected";

export type DocClassification =
  | "rate_confirmation"
  | "bill_of_lading"
  | "proof_of_delivery"
  | "invoice"
  | "lumper_receipt"
  | "claim_support"
  | "cdl"
  | "medical_card"
  | "mvr"
  | "employment_i9"
  | "w9"
  | "bank_info"
  | "unknown_mixed";

export type MatchConfidence = "high" | "medium" | "low" | "none";

export type ExtractionConfidence = "high" | "medium" | "low";

export type IntakeAttachment = {
  attachment_id: string;
  file_name: string;
  doc_classification: DocClassification;
  attachment_status: "received" | "parsed" | "needs_review" | "rejected";
  preview_url?: string;
};

export type ExtractedFields = {
  customer_or_broker?: string;
  load_number?: string;
  pickup_facility?: string;
  pickup_address?: string;
  pickup_city?: string;
  pickup_state?: string;
  delivery_facility?: string;
  delivery_address?: string;
  delivery_city?: string;
  delivery_state?: string;
  pickup_date?: string;
  delivery_date?: string;
  rate_linehaul?: number;
  equipment?: string;
  doc_type_label?: string;
  notes?: string;
  /** Driver-facing doc subtype for display */
  credential_type?: string;
  expiration_detected?: string;
};

export type ProposedTrip = {
  trip_id: string;
  row_number: number;
  pickup: string;
  delivery: string;
  rate: number;
  missing_items: string[];
  trip_status: "pending" | "approved" | "held" | "finalized";
};

export type IntakeRecord = {
  intake_id: string;
  parent_intake_id?: string;
  source_type: IntakeSourceType;
  source_sender: string;
  subject_line: string;
  received_at: string;
  intake_kind: IntakeKind;
  status: IntakeStatus;
  match_confidence: MatchConfidence;
  needs_review: boolean;
  missing_items: string[];
  attachments: IntakeAttachment[];
  extracted: ExtractedFields;
  proposed_trips: ProposedTrip[];
  linked_driver_id: string | null;
  linked_load_id: string | null;
  review_notes: string;
  pricing_summary?: string;
  extraction_confidence: ExtractionConfidence;
  flagged_fields: string[];
  review_reason?: string;
  insurance_requirements: string;
  bol_requirements: string;
  pod_requirements: string;
  finalized_at: string | null;
  /** Load IDs appended to dispatch store after finalize (demo). */
  derived_load_ids: string[];
  /** Readiness language for driver-doc intakes */
  readiness_impact?: "clears_block" | "expiring_soon" | "missing_review" | "neutral";
};

export type IntakeFilterTab =
  | "all"
  | "new"
  | "needs_review"
  | "ready_for_approval"
  | "single_trip"
  | "multi_trip"
  | "driver_docs"
  | "claims";
