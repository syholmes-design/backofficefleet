import type { BofData } from "@/lib/load-bof-data";
import { bankInfoByDriverId } from "@/lib/bank-info/bankInfoData";
import { emergencyContactDrivers } from "@/lib/emergency-contacts/drivers";

export const DRIVER_VAULT_CATEGORIES = [
  "Driver Profile",
  "CDL",
  "Medical Certification",
  "MVR",
  "Employment / I-9",
  "FMCSA / Compliance",
  "W-9",
  "Bank Information",
  "Emergency Contact",
  "Secondary Contact",
  "Other / Supporting Docs",
] as const;

export type DriverVaultCategory = (typeof DRIVER_VAULT_CATEGORIES)[number];

export type DriverVaultDocStatus =
  | "valid"
  | "expiring_soon"
  | "expired"
  | "missing"
  | "review_pending";

export type DriverVaultReviewState =
  | "not_started"
  | "in_review"
  | "reviewed"
  | "needs_update";

export type DriverVaultSharedProfile = {
  full_name: string;
  driver_id: string;
  address_line_1: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  date_of_birth: string;
  license_number: string;
  masked_ssn: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  secondary_contact_name: string;
  secondary_contact_phone: string;
  bank_name: string;
  bank_account_last4: string;
  routing_last4: string;
};

export type DriverVaultSourceUpload = {
  source_id: string;
  file_name: string;
  source_type: "upload" | "seed";
  source_url: string | null;
  uploaded_at: string;
};

export type DriverVaultArtifact = {
  artifactUrl: string;
  artifactType: "html";
  artifactFileName: string;
  artifactGeneratedAt: string;
  sourceDriverId: string;
  sourceCategory: DriverVaultCategory;
};

export type DriverVaultCategoryWorkspace = {
  category: DriverVaultCategory;
  sourceUploads: DriverVaultSourceUpload[];
  templateFields: Record<string, string>;
  generatedPreview: {
    title: string;
    subtitle: string;
    sections: Array<{ label: string; value: string }>;
  };
  documentStatus: DriverVaultDocStatus;
  extractedFieldConfidence: "high" | "medium" | "low";
  lastUpdated: string;
  reviewState: DriverVaultReviewState;
  finalArtifact: DriverVaultArtifact | null;
};

export type DriverVaultDriverWorkspace = {
  driverId: string;
  driverName: string;
  sharedProfileFields: DriverVaultSharedProfile;
  categories: Record<DriverVaultCategory, DriverVaultCategoryWorkspace>;
};

function nowIso() {
  return new Date().toISOString();
}

function maskedFromDriverId(driverId: string) {
  const digits = driverId.replace(/\D/g, "").slice(-4).padStart(4, "0");
  return `***-**-${digits}`;
}

function parseAddress(raw: string): { line1: string; city: string; state: string; zip: string } {
  const parts = raw.split(",").map((p) => p.trim());
  if (parts.length < 3) {
    return { line1: raw || "", city: "", state: "", zip: "" };
  }
  const [line1, city, stateZip] = parts;
  const [state, zip] = (stateZip ?? "").split(/\s+/);
  return {
    line1: line1 ?? "",
    city: city ?? "",
    state: state ?? "",
    zip: zip ?? "",
  };
}

function docStatusFromSource(
  uploads: DriverVaultSourceUpload[],
  category: DriverVaultCategory
): DriverVaultDocStatus {
  if (uploads.length === 0) return "missing";
  if (category === "Medical Certification" || category === "MVR") return "expiring_soon";
  if (category === "Other / Supporting Docs") return "review_pending";
  return "valid";
}

function confidenceFromStatus(status: DriverVaultDocStatus): "high" | "medium" | "low" {
  if (status === "valid") return "high";
  if (status === "expiring_soon" || status === "review_pending") return "medium";
  return "low";
}

function reviewStateFromStatus(status: DriverVaultDocStatus): DriverVaultReviewState {
  if (status === "valid") return "reviewed";
  if (status === "missing" || status === "expired") return "needs_update";
  return "in_review";
}

function sectionsFromTemplate(templateFields: Record<string, string>) {
  return Object.entries(templateFields).map(([label, value]) => ({
    label: label.replace(/_/g, " "),
    value: value || "—",
  }));
}

function templateForCategory(
  category: DriverVaultCategory,
  shared: DriverVaultSharedProfile
): Record<string, string> {
  switch (category) {
    case "Driver Profile":
      return {
        full_name: shared.full_name,
        driver_id: shared.driver_id,
        phone: shared.phone,
        email: shared.email,
        address_line_1: shared.address_line_1,
        city_state_zip: `${shared.city}, ${shared.state} ${shared.zip}`.trim(),
      };
    case "CDL":
      return {
        driver_name: shared.full_name,
        driver_id: shared.driver_id,
        license_number: shared.license_number,
        issuing_state: shared.state,
      };
    case "Medical Certification":
      return {
        driver_name: shared.full_name,
        driver_id: shared.driver_id,
        medical_examiner: "BOF Medical Network",
        expiration_date: "2026-11-30",
      };
    case "MVR":
      return {
        driver_name: shared.full_name,
        license_number: shared.license_number,
        state_pull: shared.state,
        review_notes: "No major incidents reported in seeded period.",
      };
    case "Employment / I-9":
      return {
        employee_name: shared.full_name,
        employee_id: shared.driver_id,
        address: `${shared.address_line_1}, ${shared.city}, ${shared.state} ${shared.zip}`.trim(),
        attestation: "Work authorization documentation on file.",
      };
    case "FMCSA / Compliance":
      return {
        driver_name: shared.full_name,
        driver_id: shared.driver_id,
        compliance_profile: "FMCSA file active",
        next_review_window: "30 days",
      };
    case "W-9":
      return {
        legal_name: shared.full_name,
        tax_classification: "Individual / Sole Proprietor",
        masked_ssn: shared.masked_ssn,
        mailing_address: `${shared.address_line_1}, ${shared.city}, ${shared.state} ${shared.zip}`.trim(),
      };
    case "Bank Information":
      return {
        payee_name: shared.full_name,
        bank_name: shared.bank_name,
        account_last4: shared.bank_account_last4,
        routing_last4: shared.routing_last4,
      };
    case "Emergency Contact":
      return {
        driver_name: shared.full_name,
        emergency_contact_name: shared.emergency_contact_name,
        emergency_contact_phone: shared.emergency_contact_phone,
      };
    case "Secondary Contact":
      return {
        driver_name: shared.full_name,
        secondary_contact_name: shared.secondary_contact_name,
        secondary_contact_phone: shared.secondary_contact_phone,
      };
    default:
      return {
        driver_name: shared.full_name,
        driver_id: shared.driver_id,
        notes: "Supporting driver document packet linked for BOF review.",
      };
  }
}

function sourceTypeToCategory(type: string): DriverVaultCategory {
  const t = type.toLowerCase();
  if (t.includes("cdl")) return "CDL";
  if (t.includes("medical")) return "Medical Certification";
  if (t.includes("mvr")) return "MVR";
  if (t.includes("i-9") || t.includes("i9")) return "Employment / I-9";
  if (t.includes("fmcsa")) return "FMCSA / Compliance";
  if (t.includes("w-9") || t.includes("w9")) return "W-9";
  if (t.includes("bank")) return "Bank Information";
  if (t.includes("emergency")) return "Emergency Contact";
  return "Other / Supporting Docs";
}

export function buildDriverVaultWorkspaces(data: BofData): DriverVaultDriverWorkspace[] {
  const emergencyById = new Map(emergencyContactDrivers.map((d) => [d.id, d]));

  return data.drivers.map((d) => {
    const addr = parseAddress(d.address ?? "");
    const emergency = emergencyById.get(d.id);
    const bank = bankInfoByDriverId.get(d.id);
    const shared: DriverVaultSharedProfile = {
      full_name: d.name,
      driver_id: d.id,
      address_line_1: addr.line1,
      city: addr.city,
      state: addr.state,
      zip: addr.zip,
      phone: d.phone ?? "",
      email: d.email ?? "",
      date_of_birth: emergency?.dob ?? "—",
      license_number: emergency?.licenseNumber ?? "—",
      masked_ssn: maskedFromDriverId(d.id),
      emergency_contact_name: emergency?.primaryContact.name ?? "Not on file",
      emergency_contact_phone: emergency?.primaryContact.phone ?? "Not on file",
      secondary_contact_name: emergency?.secondaryContact.name ?? "Not on file",
      secondary_contact_phone: emergency?.secondaryContact.phone ?? "Not on file",
      bank_name: bank?.bankName ?? "Not on file",
      bank_account_last4: bank?.accountNumber?.slice(-4) ?? "----",
      routing_last4: bank?.routingNumber?.slice(-4) ?? "----",
    };

    const seedDocs = data.documents.filter((row) => row.driverId === d.id);
    const uploadsByCategory = new Map<DriverVaultCategory, DriverVaultSourceUpload[]>();
    for (const row of seedDocs) {
      const category = sourceTypeToCategory(row.type);
      const prev = uploadsByCategory.get(category) ?? [];
      prev.push({
        source_id: `${d.id}:${category}:${prev.length + 1}`,
        file_name: row.fileUrl?.split("/").pop() || row.previewUrl?.split("/").pop() || `${row.type}.pdf`,
        source_type: "seed",
        source_url: row.previewUrl || row.fileUrl || null,
        uploaded_at: nowIso(),
      });
      uploadsByCategory.set(category, prev);
    }

    const categories = {} as Record<DriverVaultCategory, DriverVaultCategoryWorkspace>;
    for (const category of DRIVER_VAULT_CATEGORIES) {
      const sourceUploads = uploadsByCategory.get(category) ?? [];
      const templateFields = templateForCategory(category, shared);
      const documentStatus = docStatusFromSource(sourceUploads, category);
      categories[category] = {
        category,
        sourceUploads,
        templateFields,
        generatedPreview: {
          title: `${category} · BOF Driver Vault`,
          subtitle: `${d.name} (${d.id})`,
          sections: sectionsFromTemplate(templateFields),
        },
        documentStatus,
        extractedFieldConfidence: confidenceFromStatus(documentStatus),
        lastUpdated: nowIso(),
        reviewState: reviewStateFromStatus(documentStatus),
        finalArtifact: null,
      };
    }

    return {
      driverId: d.id,
      driverName: d.name,
      sharedProfileFields: shared,
      categories,
    };
  });
}

export function applySharedFieldAutofill(
  category: DriverVaultCategory,
  shared: DriverVaultSharedProfile,
  currentTemplateFields: Record<string, string>
) {
  const baseline = templateForCategory(category, shared);
  return {
    ...baseline,
    ...currentTemplateFields,
  };
}

const CATEGORY_TITLES: Record<DriverVaultCategory, string> = {
  "Driver Profile": "Driver Profile Summary",
  CDL: "Commercial Driver License Profile",
  "Medical Certification": "Medical Certification Record",
  MVR: "Motor Vehicle Record Summary",
  "Employment / I-9": "Employment Eligibility / I-9 Packet",
  "FMCSA / Compliance": "FMCSA Compliance Summary",
  "W-9": "W-9 Driver Tax Profile",
  "Bank Information": "Driver Bank Information Sheet",
  "Emergency Contact": "Emergency Contact Sheet",
  "Secondary Contact": "Secondary Contact Sheet",
  "Other / Supporting Docs": "Supporting Driver Document",
};

export function buildDriverVaultArtifactHtml(args: {
  driverId: string;
  driverName: string;
  category: DriverVaultCategory;
  sharedFields: DriverVaultSharedProfile;
  templateFields: Record<string, string>;
  generatedAt: string;
}) {
  const { driverId, driverName, category, sharedFields, templateFields, generatedAt } = args;
  const rows = Object.entries(templateFields)
    .map(
      ([k, v]) =>
        `<tr><th>${k.replace(/_/g, " ")}</th><td>${(v || "—").replace(/</g, "&lt;")}</td></tr>`
    )
    .join("");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${category} · ${driverName} · BOF Vault</title>
  <style>
    body { font-family: Inter, Segoe UI, Arial, sans-serif; margin: 0; padding: 24px; background: #0f1419; color: #dbe7f3; }
    .card { max-width: 980px; margin: 0 auto; border: 1px solid #223041; border-radius: 10px; background: #121a23; overflow: hidden; }
    .head { padding: 18px 20px; background: #101822; border-bottom: 1px solid #223041; }
    .eyebrow { color: #5eead4; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; font-weight: 700; }
    h1 { margin: 8px 0 4px; font-size: 24px; color: #f5fbff; }
    .sub { margin: 0; font-size: 13px; color: #93a8bd; }
    .meta { display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: 8px; padding: 14px 20px; border-bottom: 1px solid #223041; background: #0f1821; }
    .meta div { font-size: 12px; color: #8fa5bc; }
    .meta strong { display:block; color: #dce8f5; margin-top: 3px; font-size: 13px; }
    .body { padding: 16px 20px 20px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border-bottom: 1px solid #223041; text-align: left; padding: 10px 8px; vertical-align: top; }
    th { width: 34%; color: #8fa5bc; font-size: 12px; text-transform: capitalize; font-weight: 600; }
    td { color: #e3edf7; font-size: 13px; }
    .footer { padding: 12px 20px 16px; color: #7f96ad; font-size: 11px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="head">
      <div class="eyebrow">BOF Vault Final Artifact</div>
      <h1>${CATEGORY_TITLES[category]}</h1>
      <p class="sub">${driverName} (${driverId})</p>
    </div>
    <div class="meta">
      <div>Driver Name<strong>${driverName}</strong></div>
      <div>Driver ID<strong>${driverId}</strong></div>
      <div>Category<strong>${category}</strong></div>
      <div>Generated<strong>${new Date(generatedAt).toLocaleString()}</strong></div>
    </div>
    <div class="body">
      <table>
        <tr><th>full name</th><td>${sharedFields.full_name}</td></tr>
        <tr><th>phone</th><td>${sharedFields.phone}</td></tr>
        <tr><th>email</th><td>${sharedFields.email}</td></tr>
        <tr><th>address</th><td>${sharedFields.address_line_1}, ${sharedFields.city}, ${sharedFields.state} ${sharedFields.zip}</td></tr>
        <tr><th>masked ssn</th><td>${sharedFields.masked_ssn}</td></tr>
        ${rows}
      </table>
    </div>
    <div class="footer">
      BOF demo artifact: generated from Driver Vault shared + template fields (no external OCR/storage).
    </div>
  </div>
</body>
</html>`;
}
