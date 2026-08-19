export const DRIVER_VAULT_DOCUMENT_TYPES = [
  { value: "DRIVER_LICENSE", label: "Driver License / CDL" },
  { value: "MEDICAL", label: "Medical Card" },
  { value: "DRUG_TEST", label: "Drug Test" },
  { value: "WORK_HISTORY", label: "Work History" },
  { value: "ACCIDENT_HISTORY", label: "Accident History" },
  { value: "VIOLATION_HISTORY", label: "Violation History" },
  { value: "IDENTITY_SUPPORTING", label: "Identity Supporting" },
  { value: "OTHER", label: "Other" },
] as const;

export type DriverVaultDocumentType = (typeof DRIVER_VAULT_DOCUMENT_TYPES)[number]["value"];

export function driverVaultDocumentTypeLabel(value: string) {
  return DRIVER_VAULT_DOCUMENT_TYPES.find((item) => item.value === value)?.label ?? value;
}
