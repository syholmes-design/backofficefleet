/**
 * Safety & Compliance module — workbook-aligned fields for future DB wire-up.
 * Use `import type { Driver } from "@/types/safety"` in safety UI only
 * (dispatch uses `@/types/dispatch`).
 */

export type ComplianceStatus = "VALID" | "EXPIRING_SOON" | "EXPIRED";

export type SafetySeverity = "Low" | "Medium" | "High" | "Critical";

export type EventStatus = "Open" | "In Review" | "Reviewed" | "Closed";

export interface Driver {
  driver_id: string;
  name: string;
  status: "Active" | "Inactive";
  home_terminal: string;
  compliance_status: ComplianceStatus;
  cdl_expiration_date?: string | null;
  med_card_expiration_date?: string | null;
  mvr_expiration_date?: string | null;
  qual_file_status: "Complete" | "Incomplete";
  safety_ack_status: "Signed" | "Pending";
}

export interface SafetyEvent {
  event_id: string;
  driver_id: string;
  driver_name: string;
  event_type: string;
  severity: SafetySeverity;
  event_date: string;
  status: EventStatus;
  notes?: string;
  /** Dispatch / safety desk notes (demo). */
  internal_notes?: string;
  linked_load_id?: string;
  evidence_image_url: string | null;
  insurance_claim_needed: boolean;
  estimated_claim_exposure: number;
}

export type SafetyNavId =
  | "dashboard"
  | "driver_profile"
  | "expirations"
  | "risk_claims";
