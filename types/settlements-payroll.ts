/**
 * Settlements (Payroll) module — UI/workflow types aligned to BOF workbook fields.
 * `Load` here is a payroll-readiness snapshot subset (not `@/types/dispatch` Load).
 */

export type SettlementStatus = "Draft" | "Ready for Export" | "Exported";

export interface Settlement {
  settlement_id: string;
  driver_id: string;
  driver_name: string;
  period_start: string;
  period_end: string;
  total_gross_pay: number;
  total_deductions: number;
  net_pay: number;
  status: SettlementStatus;
  export_reference?: string | null;
  settlement_hold: boolean;
  settlement_hold_reason?: string | null;
}

export interface SettlementLine {
  line_id: string;
  settlement_id: string;
  type: "Earnings" | "Deduction";
  description: string;
  amount: number;
  load_id?: string | null;
  proof_status?: "Complete" | "Incomplete" | "Missing" | null;
  exception_flag?: boolean;
}

export interface Load {
  load_id: string;
  customer_name: string;
  status: string;
  proof_status: "Complete" | "Incomplete" | "Missing";
  settlement_hold: boolean;
  settlement_hold_reason?: string | null;
  exception_flag: boolean;
  insurance_claim_needed: boolean;
}

export type SettlementsPayrollNavId = "dashboard" | "export";
