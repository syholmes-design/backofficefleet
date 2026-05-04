import type { BofData } from "@/lib/load-bof-data";
import { emergencyContactDrivers } from "@/lib/emergency-contacts/drivers";

const CORE_DOC_TYPES = [
  "CDL",
  "Medical Card",
  "MVR",
  "I-9",
  "FMCSA",
  "W-9",
  "Bank Info",
] as const;

const DOC_TYPE_ALIASES: Record<string, (typeof CORE_DOC_TYPES)[number]> = {
  CDL: "CDL",
  MEDICAL_CARD: "Medical Card",
  "MEDICAL CARD": "Medical Card",
  "Medical Card": "Medical Card",
  MVR: "MVR",
  I9: "I-9",
  "I-9": "I-9",
  FMCSA: "FMCSA",
  W9: "W-9",
  "W-9": "W-9",
  BANK_INFO: "Bank Info",
  "BANK INFORMATION": "Bank Info",
  "Bank Information": "Bank Info",
  "Bank Info": "Bank Info",
};

const FALLBACK_EXPIRED_DATE = "2027-04-24";

type DocType = (typeof CORE_DOC_TYPES)[number];
type DriverRecord = BofData["drivers"][number] & Record<string, unknown>;
type DocumentRecord = BofData["documents"][number] & Record<string, unknown>;
type TemplateDateMap = Partial<Record<DocType, string>>;

function toIsoDate(value: unknown): string | undefined {
  if (typeof value !== "string" || value.trim().length === 0) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
}

function toDateOnly(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function normalizeDocType(raw: unknown): DocType | null {
  if (typeof raw !== "string") return null;
  const key = raw.trim();
  if (DOC_TYPE_ALIASES[key]) return DOC_TYPE_ALIASES[key];
  const upper = key.toUpperCase();
  return DOC_TYPE_ALIASES[upper] ?? null;
}

function isExpired(date: string | undefined, today: Date): boolean {
  const d = toDateOnly(date);
  if (!d) return false;
  return d < today;
}

function deriveStatus(
  expirationDate: string | undefined,
  hasRowOrFile: boolean,
  explicitReviewReason: boolean,
  warningWindowDays = 60
): string {
  if (!hasRowOrFile) return "MISSING";
  if (explicitReviewReason) return "PENDING REVIEW";
  if (!expirationDate) return "VALID";
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const exp = toDateOnly(expirationDate);
  if (!exp) return "VALID";
  if (exp < start) return "EXPIRED";
  const warn = new Date(start);
  warn.setDate(warn.getDate() + warningWindowDays);
  if (exp <= warn) return "EXPIRING_SOON";
  return "VALID";
}

function templateDatesForDriver(data: BofData, driverId: string): TemplateDateMap {
  const map: TemplateDateMap = {};
  const tpl = (data as BofData & { driverMedicalExpanded?: Record<string, Record<string, unknown>> })
    .driverMedicalExpanded?.[driverId];
  const medical = toIsoDate(tpl?.medicalExpirationDate);
  if (medical) map["Medical Card"] = medical;

  // Optional future workbook ingest seam:
  const workbook = (data as BofData & {
    driverTemplateDates?: Record<string, Partial<Record<string, string>>>;
  }).driverTemplateDates?.[driverId];
  if (workbook) {
    for (const [rawType, value] of Object.entries(workbook)) {
      const normalized = normalizeDocType(rawType);
      if (!normalized) continue;
      const iso = toIsoDate(value);
      if (iso) map[normalized] = iso;
    }
  }
  return map;
}

function chooseReconciledExpiration(
  sourceDate: string | undefined,
  templateDate: string | undefined,
  today: Date
): string | undefined {
  const sourceIso = toIsoDate(sourceDate);
  const templateIso = toIsoDate(templateDate);
  if (!sourceIso && !templateIso) return undefined;
  if (!sourceIso) return templateIso;
  if (!templateIso) return sourceIso;

  const sourceExpired = isExpired(sourceIso, today);
  const templateExpired = isExpired(templateIso, today);
  if (sourceExpired && templateExpired) return FALLBACK_EXPIRED_DATE;

  const source = toDateOnly(sourceIso);
  const template = toDateOnly(templateIso);
  if (!source || !template) return sourceIso ?? templateIso;
  return source >= template ? sourceIso : templateIso;
}

function emergencyByDriverId(driverId: string) {
  return emergencyContactDrivers.find((d) => d.id === driverId) ?? null;
}

function withReconciledDriverProfile(base: DriverRecord): DriverRecord {
  const ec = emergencyByDriverId(base.id);
  if (!ec) return base;
  const next = { ...base };

  // EC-card source of truth (primary + secondary) should control emergency contact fields.
  next.emergencyContactName = ec.primaryContact.name;
  next.emergencyContactRelationship = ec.primaryContact.relationship;
  next.emergencyContactPhone = ec.primaryContact.phone;
  next.emergencyContactEmail = ec.primaryContact.email;
  next.emergencyContactAddress = ec.primaryContact.address;
  next.secondaryContactName = ec.secondaryContact.name;
  next.secondaryContactRelationship = ec.secondaryContact.relationship;
  next.secondaryContactPhone = ec.secondaryContact.phone;
  next.secondaryContactEmail = ec.secondaryContact.email;
  next.secondaryContactAddress = ec.secondaryContact.address;

  // DRV-012 template-preferred profile values.
  if (base.id === "DRV-012") {
    next.name = ec.fullName || next.name;
    next.address = ec.fullAddress || next.address;
    next.phone = ec.phone || next.phone;
    next.email = ec.email || next.email;
    next.licenseClass = ec.licenseClass || next.licenseClass;
    next.licenseState = ec.licenseState || next.licenseState;
    next.referenceCdlNumber = ec.licenseNumber || next.referenceCdlNumber;
    next.dateOfBirth = ec.dob || next.dateOfBirth;
  }
  return next;
}

function reconcileCoreDocuments(data: BofData): BofData["documents"] {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const rows = (data.documents as DocumentRecord[]).map((row) => ({ ...row }));
  const byDriver = new Map<string, DocumentRecord[]>();
  for (const row of rows) {
    const list = byDriver.get(row.driverId) ?? [];
    list.push(row);
    byDriver.set(row.driverId, list);
  }

  const result: DocumentRecord[] = [];
  for (const driver of data.drivers) {
    const tplDates = templateDatesForDriver(data, driver.id);
    const current = byDriver.get(driver.id) ?? [];
    const byType = new Map<DocType, DocumentRecord>();

    for (const row of current) {
      const normalized = normalizeDocType(row.type);
      if (!normalized) {
        result.push(row);
        continue;
      }
      // Keep first row when duplicates exist; a deterministic single row prevents stale duplicate logic.
      if (!byType.has(normalized)) {
        byType.set(normalized, row);
      }
    }

    for (const docType of CORE_DOC_TYPES) {
      const existing = byType.get(docType);
      const chosenExpiration = chooseReconciledExpiration(
        existing?.expirationDate,
        tplDates[docType],
        startOfToday
      );
      const hasRowOrFile = Boolean(existing?.fileUrl || existing?.previewUrl || existing);
      const explicitReviewReason = Boolean(
        existing?.reviewReason || existing?.reviewNote || existing?.reviewComment
      );
      const nextStatus = deriveStatus(chosenExpiration, hasRowOrFile, explicitReviewReason);
      if (existing) {
        result.push({
          ...existing,
          type: docType,
          expirationDate: chosenExpiration ?? existing.expirationDate ?? "",
          status: nextStatus,
        });
      } else {
        result.push({
          driverId: driver.id,
          type: docType,
          status: "MISSING",
          expirationDate: chosenExpiration ?? "",
        } as DocumentRecord);
      }
    }
  }
  return result;
}

/** Canonical BOF source-of-truth reconciliation for dashboard, drivers, compliance, and dispatch modules. */
export function reconcileBofSourceOfTruth(seed: BofData): BofData {
  const next = structuredClone(seed) as BofData;
  next.drivers = (next.drivers as DriverRecord[]).map(withReconciledDriverProfile) as BofData["drivers"];
  next.documents = reconcileCoreDocuments(next) as BofData["documents"];
  return next;
}
