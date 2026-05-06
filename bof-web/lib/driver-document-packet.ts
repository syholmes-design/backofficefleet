import type { BofData } from "@/lib/load-bof-data";
import type { DocumentRow } from "@/lib/driver-queries";
import {
  canonicalCredentialBadgeLabel,
  getDriverCredentialStatus,
  type CredentialRecord,
} from "@/lib/driver-credential-status";
import {
  getOrderedDocumentsForDriver,
  getPrimaryStackExtraDocuments,
  getSecondaryStackDocumentsOrdered,
} from "@/lib/driver-queries";
import { listEngineDocumentsForDriver } from "@/lib/document-engine";

export type DriverDocumentGroupKey = "core_dqf" | "hr_workflow" | "generated_summaries" | "payroll_deduction_support";

export type DriverDocumentSourceKind =
  | "public_file"
  | "generated_summary"
  | "template_output"
  | "status_only"
  | "missing";

export type DriverPacketDocument = {
  canonicalType: string;
  label: string;
  group: DriverDocumentGroupKey;
  status: string;
  expirationDate?: string;
  fileUrl?: string;
  previewUrl?: string;
  sourceKind: DriverDocumentSourceKind;
  sourceLabel: string;
  notes?: string;
  needsMapping?: boolean;
};

export type DriverDocumentPacket = {
  driverId: string;
  documents: DriverPacketDocument[];
  duplicates: Array<{ canonicalType: string; labels: string[] }>;
};

const CORE_ROWS: Array<{ canonicalType: string; label: string; sourceType: string }> = [
  { canonicalType: "cdl", label: "CDL", sourceType: "CDL" },
  { canonicalType: "medical_card", label: "Medical Card", sourceType: "Medical Card" },
  { canonicalType: "mvr", label: "MVR", sourceType: "MVR" },
  { canonicalType: "fmcsa_compliance", label: "FMCSA Compliance", sourceType: "FMCSA" },
  { canonicalType: "i9", label: "I-9", sourceType: "I-9" },
  { canonicalType: "w9", label: "W-9", sourceType: "W-9" },
  { canonicalType: "bank_information", label: "Bank Information", sourceType: "Bank Info" },
  { canonicalType: "emergency_contact", label: "Emergency Contact", sourceType: "Emergency Contact" },
  { canonicalType: "insurance_card", label: "Insurance Card", sourceType: "Insurance Card" },
];

const WORKFLOW_TYPES: Array<{ canonicalType: string; label: string; sourceType: string }> = [
  {
    canonicalType: "driver_application",
    label: "Driver Application",
    sourceType: "Driver Application",
  },
  {
    canonicalType: "safety_acknowledgment",
    label: "Safety Acknowledgment",
    sourceType: "Safety Acknowledgment",
  },
  {
    canonicalType: "signed_medical_exam",
    label: "Signed Medical Exam / MCSA-5876",
    sourceType: "MCSA-5876 (signed PDF)",
  },
  {
    canonicalType: "driver_profile_html",
    label: "Driver Profile HTML",
    sourceType: "Driver profile (HTML)",
  },
  {
    canonicalType: "qualification_file_status",
    label: "Qualification File Status",
    sourceType: "Qualification File",
  },
  {
    canonicalType: "incident_report",
    label: "Incident / Accident Report",
    sourceType: "Incident / Accident Report",
  },
  {
    canonicalType: "employee_handbook_acknowledgment",
    label: "Employee Handbook Acknowledgment",
    sourceType: "Employee Handbook Acknowledgment",
  },
  {
    canonicalType: "benefits_enrollment",
    label: "Benefits Enrollment",
    sourceType: "Benefits Enrollment",
  },
  {
    canonicalType: "life_insurance_beneficiary_election",
    label: "Life Insurance Beneficiary Election",
    sourceType: "Life Insurance Beneficiary Election",
  },
  {
    canonicalType: "flexible_spending_account_election",
    label: "Flexible Spending Account Election",
    sourceType: "Flexible Spending Account Election",
  },
];

const PAYROLL_TYPES: Array<{ canonicalType: string; label: string; sourceType: string }> = [
  {
    canonicalType: "garnishment_withholding_summary",
    label: "Garnishment Withholding Summary",
    sourceType: "Garnishment Withholding Summary",
  },
];

const SUMMARY_TYPES: Array<{ canonicalType: string; label: string; sourceType: string }> = [
  {
    canonicalType: "emergency_contact_sheet",
    label: "Emergency Contact Sheet",
    sourceType: "Emergency Contact Sheet",
  },
  {
    canonicalType: "credential_register",
    label: "Credential Register",
    sourceType: "Credential Register",
  },
  {
    canonicalType: "hr_administrative_record",
    label: "HR Administrative Record",
    sourceType: "__needs_mapping__",
  },
  {
    canonicalType: "dqf_compliance_summary",
    label: "FMCSA DQF Compliance Summary",
    sourceType: "FMCSA DQF Compliance Summary",
  },
  {
    canonicalType: "bof_medical_summary",
    label: "BOF Medical Summary",
    sourceType: "BOF Medical Summary",
  },
];

function inferSourceKind(doc: Pick<DriverPacketDocument, "fileUrl">): DriverDocumentSourceKind {
  const url = doc.fileUrl?.trim();
  if (!url) return "missing";
  if (url.startsWith("/documents/drivers/")) return "public_file";
  if (url.startsWith("/generated/drivers/")) return "generated_summary";
  if (url.startsWith("/generated/")) return "template_output";
  return "status_only";
}

function sourceLabelFromKind(kind: DriverDocumentSourceKind): string {
  switch (kind) {
    case "public_file":
      return "Public file";
    case "generated_summary":
      return "Generated summary";
    case "template_output":
      return "Template output";
    case "status_only":
      return "Status only";
    default:
      return "Missing";
  }
}

function docByType(docs: DocumentRow[], type: string): DocumentRow | undefined {
  return docs.find((d) => d.type === type);
}

function toPacketDoc(
  row: { canonicalType: string; label: string; sourceType: string },
  doc: DocumentRow | undefined,
  group: DriverDocumentGroupKey
): DriverPacketDocument {
  if (!doc) {
    return {
      canonicalType: row.canonicalType,
      label: row.label,
      group,
      status: "MISSING",
      sourceKind: "missing",
      sourceLabel: "Missing",
      needsMapping: row.sourceType === "__needs_mapping__",
    };
  }
  const fileUrl = doc.fileUrl?.trim() || undefined;
  const previewUrl = doc.previewUrl?.trim() || fileUrl;
  const sourceKind = inferSourceKind({ fileUrl });
  return {
    canonicalType: row.canonicalType,
    label: row.label,
    group,
    status: doc.status || "MISSING",
    expirationDate: doc.expirationDate || undefined,
    fileUrl,
    previewUrl,
    sourceKind,
    sourceLabel: sourceLabelFromKind(sourceKind),
    needsMapping: row.sourceType === "__needs_mapping__",
  };
}

/** Core DQF rows only — generated summaries keep template/engine dates out of credential slots. */
function mergeCredentialResolverIntoCorePacket(
  data: BofData,
  driverId: string,
  packet: DriverDocumentPacket
): DriverDocumentPacket {
  const cred = getDriverCredentialStatus(data, driverId);
  const sliceByCanonical: Record<string, CredentialRecord> = {
    cdl: cred.cdl,
    medical_card: cred.medicalCard,
    mvr: cred.mvr,
    fmcsa_compliance: cred.fmcsa,
    w9: cred.w9,
    bank_information: cred.bankInformation,
    emergency_contact: cred.emergencyContact,
    insurance_card: cred.insuranceCard,
  };

  const documents = packet.documents.map((doc) => {
    if (doc.group !== "core_dqf") return doc;
    const slice = sliceByCanonical[doc.canonicalType];
    if (!slice) return doc;

    const primaryDate =
      doc.canonicalType === "fmcsa_compliance"
        ? slice.reviewDate?.trim() || slice.expirationDate?.trim()
        : slice.expirationDate?.trim() || slice.reviewDate?.trim();

    const nextStatus = canonicalCredentialBadgeLabel(slice);
    const fileUrl = slice.fileUrl?.trim() || doc.fileUrl;
    const previewUrl = fileUrl || doc.previewUrl;
    const sourceKind = inferSourceKind({ fileUrl });

    return {
      ...doc,
      status: nextStatus,
      expirationDate: primaryDate || doc.expirationDate,
      fileUrl,
      previewUrl,
      sourceKind,
      sourceLabel: sourceLabelFromKind(sourceKind),
    };
  });

  return { ...packet, documents };
}

export function buildDriverDocumentPacket(data: BofData, driverId: string): DriverDocumentPacket {
  const primaryCore = getOrderedDocumentsForDriver(data, driverId);
  const primaryExtra = getPrimaryStackExtraDocuments(data, driverId);
  const secondary = getSecondaryStackDocumentsOrdered(data, driverId);
  const engine = listEngineDocumentsForDriver(data, driverId);

  const docs: DriverPacketDocument[] = [];

  for (const row of CORE_ROWS) {
    const fromCore = docByType(primaryCore, row.sourceType);
    const fromPrimaryExtra = docByType(primaryExtra, row.sourceType);
    const fromSecondary = docByType(secondary, row.sourceType);
    docs.push(toPacketDoc(row, fromCore ?? fromPrimaryExtra ?? fromSecondary, "core_dqf"));
  }

  for (const row of WORKFLOW_TYPES) {
    docs.push(toPacketDoc(row, docByType(secondary, row.sourceType), "hr_workflow"));
  }

  for (const row of PAYROLL_TYPES) {
    docs.push(toPacketDoc(row, docByType(secondary, row.sourceType), "payroll_deduction_support"));
  }

  for (const row of SUMMARY_TYPES) {
    if (row.sourceType === "__needs_mapping__") {
      docs.push(toPacketDoc(row, undefined, "generated_summaries"));
      continue;
    }
    const engineDoc = engine.find((d) => d.type === row.sourceType);
    const secondaryRow = docByType(secondary, row.sourceType);
    const fromEngine: DocumentRow | undefined = engineDoc
      ? {
          driverId,
          type: engineDoc.type,
          status: engineDoc.status || "MISSING",
          fileUrl: engineDoc.fileUrl,
          previewUrl: engineDoc.previewUrl,
          expirationDate: undefined,
        }
      : secondaryRow;
    docs.push(toPacketDoc(row, fromEngine, "generated_summaries"));
  }

  const deduped = new Map<string, DriverPacketDocument>();
  const duplicateTracker = new Map<string, string[]>();

  for (const doc of docs) {
    const existing = deduped.get(doc.canonicalType);
    if (!existing) {
      deduped.set(doc.canonicalType, doc);
      duplicateTracker.set(doc.canonicalType, [doc.label]);
      continue;
    }
    duplicateTracker.get(doc.canonicalType)?.push(doc.label);
    // Prefer real file-backed rows over missing/status-only.
    const existingScore =
      existing.fileUrl && existing.sourceKind !== "status_only" ? 2 : existing.fileUrl ? 1 : 0;
    const nextScore = doc.fileUrl && doc.sourceKind !== "status_only" ? 2 : doc.fileUrl ? 1 : 0;
    if (nextScore > existingScore) {
      deduped.set(doc.canonicalType, doc);
    }
  }

  const duplicates = [...duplicateTracker.entries()]
    .filter(([, labels]) => labels.length > 1)
    .map(([canonicalType, labels]) => ({ canonicalType, labels }));

  const ordered = [
    ...CORE_ROWS.map((r) => r.canonicalType),
    ...WORKFLOW_TYPES.map((r) => r.canonicalType),
    ...PAYROLL_TYPES.map((r) => r.canonicalType),
    ...SUMMARY_TYPES.map((r) => r.canonicalType),
  ];
  const orderedDocs = ordered
    .map((key) => deduped.get(key))
    .filter((d): d is DriverPacketDocument => Boolean(d));

  return mergeCredentialResolverIntoCorePacket(data, driverId, {
    driverId,
    documents: orderedDocs,
    duplicates,
  });
}

