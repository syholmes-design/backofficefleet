/**
 * Expanded medical / MCSA structure sourced from `public/data/driver_templates_expanded.xlsx`
 * (merged into `demo-data.json` as `driverMedicalExpanded`).
 */
export type DriverMedicalExpanded = {
  /** 5875 / exam line items */
  vision5875: string;
  hearing5875: string;
  bloodPressure5875: string;
  /** Application (driver intake) */
  appSubmissionDate: string;
  appStatus: string;
  /** Safety acknowledgment */
  safetyAckDate: string;
  safetyAckStatus: string;
  /** Incidents */
  incidentReportCount: string;
  lastIncidentDate: string;
  /** Qualification file */
  qualFileStatus: string;
  /** Internal BOF medical summary workflow */
  bofMedicalSummaryStatus: string;
  /** Primary medical card (shown first) */
  medicalIssueDate: string;
  medicalExpirationDate: string;
  medicalExaminerName: string;
  /** MCSA-5876 examiner / driver detail (secondary view) */
  mcsaExaminerLicense: string;
  mcsaRegistryNumber: string;
  mcsaExaminerTelephone: string;
  driverLicenseState: string;
  driverLicenseNumber: string;
  driverSignatureDate: string;
};

export const EMPTY_DRIVER_MEDICAL_EXPANDED: DriverMedicalExpanded = {
  vision5875: "",
  hearing5875: "",
  bloodPressure5875: "",
  appSubmissionDate: "",
  appStatus: "",
  safetyAckDate: "",
  safetyAckStatus: "",
  incidentReportCount: "",
  lastIncidentDate: "",
  qualFileStatus: "",
  bofMedicalSummaryStatus: "",
  medicalIssueDate: "",
  medicalExpirationDate: "",
  medicalExaminerName: "",
  mcsaExaminerLicense: "",
  mcsaRegistryNumber: "",
  mcsaExaminerTelephone: "",
  driverLicenseState: "",
  driverLicenseNumber: "",
  driverSignatureDate: "",
};
