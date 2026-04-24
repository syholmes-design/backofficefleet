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
