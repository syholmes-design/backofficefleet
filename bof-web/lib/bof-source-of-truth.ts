import type { BofData } from "@/lib/load-bof-data";
import { emergencyContactDrivers } from "@/lib/emergency-contacts/drivers";

const CORE_DOC_TYPES = ["CDL", "Medical Card", "MVR", "I-9", "FMCSA", "W-9", "Bank Info"] as const;
const FALLBACK_EXPIRED_DATE = "2027-04-24";

type DocType = (typeof CORE_DOC_TYPES)[number];
type DriverRecord = BofData["drivers"][number] & Record<string, unknown>;
type DocumentRecord = BofData["documents"][number] & Record<string, unknown>;
type TemplateDateMap = Partial<Record<DocType, string>>;

type WorkbookSnapshot = {
  sourceDriverRows: Map<string, Record<string, unknown>>;
  sourceDocumentExpirations: Map<string, TemplateDateMap>;
  templateDriverRows: Map<string, Record<string, unknown>>;
  templateDocumentExpirations: Map<string, TemplateDateMap>;
  templateMaskedSsn: Map<string, string>;
};

let workbookSnapshotCache: WorkbookSnapshot | null | undefined;

function toDateOnly(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function excelSerialToIso(serial: number): string | undefined {
  if (!Number.isFinite(serial)) return undefined;
  const millis = Math.round((serial - 25569) * 86400 * 1000);
  const d = new Date(millis);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

function toIsoDate(value: unknown): string | undefined {
  if (typeof value === "number") return excelSerialToIso(value);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const maybeNum = Number(trimmed);
  if (Number.isFinite(maybeNum) && /\d/.test(trimmed)) {
    const fromSerial = excelSerialToIso(maybeNum);
    if (fromSerial) return fromSerial;
  }
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
}

function normalizeDriverId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const match = raw.trim().toUpperCase().match(/^DRV-(\d{1,3})$/);
  if (!match) return null;
  return `DRV-${match[1].padStart(3, "0")}`;
}

function normalizeDocType(raw: unknown): DocType | null {
  if (typeof raw !== "string") return null;
  const key = raw.trim().toUpperCase();
  if (key.includes("MED")) return "Medical Card";
  if (key === "CDL" || key.includes("CDL")) return "CDL";
  if (key.includes("MVR")) return "MVR";
  if (key === "I9" || key === "I-9" || key.includes("I-9")) return "I-9";
  if (key.includes("FMCSA")) return "FMCSA";
  if (key === "W9" || key === "W-9" || key.includes("W-9")) return "W-9";
  if (key.includes("BANK")) return "Bank Info";
  return null;
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

function emptyTemplateDates(): TemplateDateMap {
  return {
    CDL: undefined,
    "Medical Card": undefined,
    MVR: undefined,
    "I-9": undefined,
    FMCSA: undefined,
    "W-9": undefined,
    "Bank Info": undefined,
  };
}

function recordDocDate(map: Map<string, TemplateDateMap>, driverId: string, doc: DocType, date: unknown) {
  const iso = toIsoDate(date);
  if (!iso) return;
  const row = map.get(driverId) ?? emptyTemplateDates();
  const cur = row[doc];
  row[doc] = cur ? (toDateOnly(iso)! > toDateOnly(cur)! ? iso : cur) : iso;
  map.set(driverId, row);
}

function loadWorkbookSnapshot(): WorkbookSnapshot | null {
  if (workbookSnapshotCache !== undefined) return workbookSnapshotCache;
  if (typeof window !== "undefined") {
    workbookSnapshotCache = null;
    return workbookSnapshotCache;
  }

  try {
    const req: (id: string) => unknown = eval("require");
    const fs = req("fs") as typeof import("fs");
    const path = req("path") as typeof import("path");
    const XLSX = req("xlsx") as typeof import("xlsx");

    const root = process.cwd();
    const dataDir = path.join(root, "data", "source-workbooks");

    const enhancedPath = path.join(dataDir, "main-source_enhanced_bof_aligned.xlsx");
    const templateUntruncatedPath = path.join(dataDir, "driver_templates_expanded_untruncated.xlsx");
    const templateFallbackPath = path.join(dataDir, "driver_templates_expanded.xlsx");

    if (!fs.existsSync(enhancedPath)) {
      workbookSnapshotCache = null;
      return workbookSnapshotCache;
    }

    const pickTemplate = fs.existsSync(templateUntruncatedPath)
      ? templateUntruncatedPath
      : fs.existsSync(templateFallbackPath)
        ? templateFallbackPath
        : null;

    const sourceDriverRows = new Map<string, Record<string, unknown>>();
    const sourceDocumentExpirations = new Map<string, TemplateDateMap>();
    const templateDriverRows = new Map<string, Record<string, unknown>>();
    const templateDocumentExpirations = new Map<string, TemplateDateMap>();
    const templateMaskedSsn = new Map<string, string>();

    const enhancedWb = XLSX.readFile(enhancedPath, { cellDates: false });
    const sourceDrivers = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      enhancedWb.Sheets["Drivers_Clean"] ?? enhancedWb.Sheets[enhancedWb.SheetNames[0]],
      { defval: "" }
    );
    for (const row of sourceDrivers) {
      const driverId = normalizeDriverId(row["Driver ID"]);
      if (!driverId) continue;
      sourceDriverRows.set(driverId, row);
      recordDocDate(sourceDocumentExpirations, driverId, "CDL", row["CDL Expiration Date"]);
      recordDocDate(sourceDocumentExpirations, driverId, "Medical Card", row["Medical Card Expiration"]);
      recordDocDate(sourceDocumentExpirations, driverId, "MVR", row["MVR Expiration"]);
    }

    const sourceDocs = XLSX.utils.sheet_to_json<Record<string, unknown>>(
      enhancedWb.Sheets["Documents_Clean"] ?? enhancedWb.Sheets["Documents"],
      { defval: "" }
    );
    for (const row of sourceDocs) {
      const driverId = normalizeDriverId(row["Driver ID"]);
      if (!driverId) continue;
      const docType = normalizeDocType(row["Standard Doc Type"] ?? row["Document Type"]);
      if (!docType) continue;
      recordDocDate(sourceDocumentExpirations, driverId, docType, row["Expiration Date"]);
    }

    if (pickTemplate) {
      const templateWb = XLSX.readFile(pickTemplate, { cellDates: false });
      const templateRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        templateWb.Sheets["Sheet1"] ?? templateWb.Sheets[templateWb.SheetNames[0]],
        { defval: "" }
      );
      for (const row of templateRows) {
        const driverId = normalizeDriverId(row["Driver ID"]);
        if (!driverId) continue;
        if (!templateDriverRows.has(driverId)) templateDriverRows.set(driverId, row);

        const ssn = String(row["SSN (Masked)"] ?? row["TIN"] ?? "").trim();
        if (/^\*{3}-\*{2}-\d{4}$/.test(ssn)) templateMaskedSsn.set(driverId, ssn);

        recordDocDate(templateDocumentExpirations, driverId, "CDL", row["CDL Expiration"]);
        recordDocDate(templateDocumentExpirations, driverId, "Medical Card", row["Med Card Expiration"]);
        recordDocDate(templateDocumentExpirations, driverId, "MVR", row["MVR Expiration"]);
        recordDocDate(templateDocumentExpirations, driverId, "I-9", row["I9 Completion Date"]);
        recordDocDate(templateDocumentExpirations, driverId, "FMCSA", row["Next Review Date"]);
        recordDocDate(templateDocumentExpirations, driverId, "W-9", row["W9 Submission Date"]);
        recordDocDate(templateDocumentExpirations, driverId, "Bank Info", row["Bank Info Submission Date"]);
      }
    }

    workbookSnapshotCache = {
      sourceDriverRows,
      sourceDocumentExpirations,
      templateDriverRows,
      templateDocumentExpirations,
      templateMaskedSsn,
    };
    return workbookSnapshotCache;
  } catch {
    workbookSnapshotCache = null;
    return workbookSnapshotCache;
  }
}

function emergencyByDriverId(driverId: string) {
  return emergencyContactDrivers.find((d) => d.id === driverId) ?? null;
}

function withReconciledDriverProfile(base: DriverRecord, workbook: WorkbookSnapshot | null): DriverRecord {
  const next = { ...base };
  const ec = emergencyByDriverId(base.id);
  const sourceDriver = workbook?.sourceDriverRows.get(base.id);
  const templateDriver = workbook?.templateDriverRows.get(base.id);

  if (sourceDriver) {
    next.name = String(sourceDriver["Full Name"] || next.name || "");
    next.phone = String(sourceDriver["Phone Number"] || next.phone || "");
    next.address = String(sourceDriver["Address"] || next.address || "");
  }

  if (base.id === "DRV-012" && templateDriver) {
    next.name = String(templateDriver["Full Name"] || next.name || "");
    next.phone = String(templateDriver["Phone"] || next.phone || "");
    next.address = String(templateDriver["Full Address"] || next.address || "");
    next.email = String(templateDriver["Email"] || next.email || "");
    next.licenseClass = String(templateDriver["License Class"] || next.licenseClass || "");
    next.licenseState = String(templateDriver["State"] || next.licenseState || "");
    next.referenceCdlNumber = String(templateDriver["Document Number"] || next.referenceCdlNumber || "");
    const dob = toIsoDate(templateDriver["DOB"]);
    if (dob) next.dateOfBirth = dob;
  }

  const maskedSsn = workbook?.templateMaskedSsn.get(base.id);
  if (maskedSsn) next.ssnMasked = maskedSsn;

  if (ec) {
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
  }

  return next;
}

function workbookTemplateDatesForDriver(workbook: WorkbookSnapshot | null, data: BofData, driverId: string): TemplateDateMap {
  const out: TemplateDateMap = {};
  const fromSource = workbook?.sourceDocumentExpirations.get(driverId);
  if (fromSource) Object.assign(out, fromSource);

  const fromTemplate = workbook?.templateDocumentExpirations.get(driverId);
  if (fromTemplate) {
    for (const t of CORE_DOC_TYPES) {
      if (fromTemplate[t]) out[t] = fromTemplate[t];
    }
  }

  const medicalExpanded = (data as BofData & {
    driverMedicalExpanded?: Record<string, Record<string, unknown>>;
  }).driverMedicalExpanded?.[driverId];
  const medExpandedDate = toIsoDate(medicalExpanded?.medicalExpirationDate);
  if (medExpandedDate) {
    const cur = out["Medical Card"];
    out["Medical Card"] = cur && toDateOnly(cur)! > toDateOnly(medExpandedDate)! ? cur : medExpandedDate;
  }
  return out;
}

function reconcileCoreDocuments(data: BofData, workbook: WorkbookSnapshot | null): BofData["documents"] {
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
    const templateDates = workbookTemplateDatesForDriver(workbook, data, driver.id);
    const current = byDriver.get(driver.id) ?? [];
    const byType = new Map<DocType, DocumentRecord>();

    for (const row of current) {
      const normalized = normalizeDocType(row.type);
      if (!normalized) {
        result.push(row);
        continue;
      }
      if (!byType.has(normalized)) byType.set(normalized, row);
    }

    for (const docType of CORE_DOC_TYPES) {
      const existing = byType.get(docType);
      const chosenExpiration = chooseReconciledExpiration(existing?.expirationDate, templateDates[docType], startOfToday);
      const hasRowOrFile = Boolean(existing?.fileUrl || existing?.previewUrl || existing);
      const explicitReviewReason = Boolean(existing?.reviewReason || existing?.reviewNote || existing?.reviewComment);
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

function buildSettlementLoadLinks(data: BofData): Record<string, string> {
  const byDriver = new Map<string, string[]>();
  for (const load of data.loads) {
    const list = byDriver.get(load.driverId) ?? [];
    list.push(load.id);
    byDriver.set(load.driverId, list);
  }
  const out: Record<string, string> = {};
  for (const settlement of data.settlements) {
    const candidate = byDriver.get(settlement.driverId)?.[0];
    if (candidate) out[settlement.settlementId] = candidate;
  }
  return out;
}

/** Canonical BOF source-of-truth reconciliation for dashboard, drivers, compliance, dispatch, and settlements. */
export function reconcileBofSourceOfTruth(seed: BofData): BofData {
  const next = structuredClone(seed) as BofData;
  const workbook = loadWorkbookSnapshot();

  next.drivers = (next.drivers as DriverRecord[])
    .map((d) => withReconciledDriverProfile(d, workbook))
    .sort((a, b) => String(a.id).localeCompare(String(b.id))) as BofData["drivers"];

  next.documents = reconcileCoreDocuments(next, workbook) as BofData["documents"];
  next.settlementLoadLinks = buildSettlementLoadLinks(next);

  return next;
}
