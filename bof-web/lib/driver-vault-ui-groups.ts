import type { DriverDqfDocumentRow } from "@/lib/driver-dqf-readiness";

/**
 * Presentation groups for `/drivers/[id]/vault` — aligns DQF rows with BOF vault architecture
 * (mapping labels mirror `public/generated/driver-vault-mapping.json` categories).
 */
export type DriverVaultUiGroup =
  | "core_compliance"
  | "employment_qualification"
  | "safety_training"
  | "emergency_contacts"
  | "financial_admin";

export const DRIVER_VAULT_UI_GROUP_ORDER: DriverVaultUiGroup[] = [
  "core_compliance",
  "employment_qualification",
  "safety_training",
  "emergency_contacts",
  "financial_admin",
];

export const DRIVER_VAULT_UI_GROUP_LABEL: Record<DriverVaultUiGroup, string> = {
  core_compliance: "Core Compliance",
  employment_qualification: "Employment / Qualification",
  safety_training: "Safety / Training",
  emergency_contacts: "Emergency Contacts",
  financial_admin: "Financial / Admin",
};

export const DRIVER_VAULT_UI_GROUP_DESCRIPTION: Record<DriverVaultUiGroup, string> = {
  core_compliance:
    "Regulatory credentials and clearinghouse posture — CDL, medical certificate, MVR, FMCSA, and related core items.",
  employment_qualification:
    "Hiring and qualification file — applications, I-9, road test, prior employer inquiry, annual review, and profile artifacts.",
  safety_training:
    "Safety programs and incident trail — acknowledgments, incident reports, and controlled testing documentation.",
  emergency_contacts:
    "Reach-back contacts for dispatch and HR — primary sheets and extended emergency documentation.",
  financial_admin:
    "Payroll and back-office — W-9, banking instructions, credential registers, and generated administrative summaries.",
};

const BY_CANONICAL: Record<string, DriverVaultUiGroup> = {
  cdl: "core_compliance",
  medical_card: "core_compliance",
  mvr: "core_compliance",
  fmcsa_compliance: "core_compliance",
  insurance_card: "core_compliance",
  signed_medical_exam: "core_compliance",
  dqf_compliance_summary: "core_compliance",
  bof_medical_summary: "core_compliance",

  i9: "employment_qualification",
  driver_application: "employment_qualification",
  driver_profile_html: "employment_qualification",
  qualification_file_status: "employment_qualification",
  road_test_certificate: "employment_qualification",
  prior_employer_inquiry: "employment_qualification",
  annual_review_qual_file: "employment_qualification",

  safety_acknowledgment: "safety_training",
  incident_report: "safety_training",
  drug_test_result: "safety_training",

  emergency_contact: "emergency_contacts",
  emergency_contact_sheet: "emergency_contacts",

  w9: "financial_admin",
  bank_information: "financial_admin",
  credential_register: "financial_admin",
  hr_administrative_record: "financial_admin",
};

export function getDriverVaultUiGroup(
  row: Pick<DriverDqfDocumentRow, "canonicalType" | "label">
): DriverVaultUiGroup {
  const mapped = BY_CANONICAL[row.canonicalType];
  if (mapped) return mapped;

  const L = row.label.toLowerCase();
  if (/emergency|secondary contact/i.test(L)) return "emergency_contacts";
  if (/safety|incident|accident|drug/i.test(L)) return "safety_training";
  if (/employment|application|road test|prior employer|qualification|i-9|\bi9\b/i.test(L)) {
    return "employment_qualification";
  }
  if (/w-9|w9|bank|administrative|register|payroll|billing/i.test(L)) return "financial_admin";
  if (/cdl|medical|mvr|fmcsa|clearinghouse|insurance card/i.test(L)) return "core_compliance";

  return "financial_admin";
}

export function groupDqfRowsByVaultUi(
  rows: DriverDqfDocumentRow[]
): Record<DriverVaultUiGroup, DriverDqfDocumentRow[]> {
  const out: Record<DriverVaultUiGroup, DriverDqfDocumentRow[]> = {
    core_compliance: [],
    employment_qualification: [],
    safety_training: [],
    emergency_contacts: [],
    financial_admin: [],
  };
  for (const row of rows) {
    out[getDriverVaultUiGroup(row)].push(row);
  }
  const cmp = (a: DriverDqfDocumentRow, b: DriverDqfDocumentRow) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" });
  for (const g of DRIVER_VAULT_UI_GROUP_ORDER) {
    out[g].sort(cmp);
  }
  return out;
}
