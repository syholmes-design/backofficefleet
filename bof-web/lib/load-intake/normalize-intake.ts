import type { LoadIntakeRecord, LoadIntakeSourceType } from "@/lib/load-requirements-intake-types";

type NormalizeInput = {
  sourceType: LoadIntakeSourceType;
  fields: Partial<LoadIntakeRecord>;
  raw?: unknown;
};

type NormalizeResult = {
  normalized: LoadIntakeRecord;
  warnings: string[];
  missingRequiredFields: string[];
  status: "draft" | "needs_review" | "ready_to_save";
};

function normalizeStateCode(value?: string): string | undefined {
  const v = String(value || "").trim().toUpperCase();
  return v ? v.slice(0, 2) : undefined;
}

function normalizeZip(value?: string): string | undefined {
  const v = String(value || "").trim();
  const m = v.match(/\b\d{5}(?:-\d{4})?\b/);
  return m?.[0];
}

function normalizeMoney(value?: string | number): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (!value) return undefined;
  const n = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

function normalizeWeight(value?: string | number): number | undefined {
  return normalizeMoney(value);
}

function normalizeBool(value?: boolean | string): boolean | undefined {
  if (typeof value === "boolean") return value;
  const v = String(value || "").trim().toLowerCase();
  if (!v) return undefined;
  if (["yes", "true", "1", "required"].includes(v)) return true;
  if (["no", "false", "0", "not required"].includes(v)) return false;
  return undefined;
}

function normalizeDate(value?: string): string | undefined {
  const v = String(value || "").trim();
  if (!v) return undefined;
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

function normalizeTime(value?: string): string | undefined {
  const v = String(value || "").trim();
  if (!v) return undefined;
  const m = v.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  return m ? `${m[1].padStart(2, "0")}:${m[2]}` : undefined;
}

function mergeDateTime(date?: string, time?: string): string | undefined {
  if (!date && !time) return undefined;
  if (!date) return undefined;
  return `${date}T${(time || "00:00").slice(0, 5)}`;
}

export function normalizeLoadIntake(input: NormalizeInput): NormalizeResult {
  const fields = input.fields || {};
  const warnings: string[] = [];
  const normalized: LoadIntakeRecord = {
    ...fields,
    sourceType: input.sourceType,
    extractionWarnings: fields.extractionWarnings || [],
    extractionConfidence:
      typeof fields.extractionConfidence === "number" ? fields.extractionConfidence : undefined,
    pickupState: normalizeStateCode(fields.pickupState),
    deliveryState: normalizeStateCode(fields.deliveryState),
    pickupZip: normalizeZip(fields.pickupZip),
    deliveryZip: normalizeZip(fields.deliveryZip),
    rate: normalizeMoney(fields.rate),
    weight: normalizeWeight(fields.weight),
    sealRequired: normalizeBool(fields.sealRequired),
    insuranceRequired: normalizeBool(fields.insuranceRequired),
    pickupAppointmentDate: normalizeDate(fields.pickupAppointmentDate),
    deliveryAppointmentDate: normalizeDate(fields.deliveryAppointmentDate),
    pickupAppointmentTime: normalizeTime(fields.pickupAppointmentTime),
    deliveryAppointmentTime: normalizeTime(fields.deliveryAppointmentTime),
    humanReviewRequired:
      input.sourceType === "upload" || input.sourceType === "email"
        ? true
        : Boolean(fields.humanReviewRequired),
  };

  const required: Array<keyof LoadIntakeRecord> = [
    "customerName",
    "pickupFacilityName",
    "pickupAddress1",
    "deliveryFacilityName",
    "deliveryAddress1",
    "commodity",
    "weight",
    "equipmentType",
    "rate",
  ];
  const missingRequiredFields = required.filter((key) => {
    const value = normalized[key];
    if (typeof value === "number") return !Number.isFinite(value) || value <= 0;
    return !String(value ?? "").trim();
  }) as string[];

  const pickupIso = mergeDateTime(normalized.pickupAppointmentDate, normalized.pickupAppointmentTime);
  const deliveryIso = mergeDateTime(normalized.deliveryAppointmentDate, normalized.deliveryAppointmentTime);
  if (pickupIso && deliveryIso) {
    const p = new Date(pickupIso).getTime();
    const d = new Date(deliveryIso).getTime();
    if (Number.isFinite(p) && Number.isFinite(d) && p > d) {
      warnings.push("Pickup appointment is after delivery appointment.");
    }
  }
  if (!normalized.pickupState) warnings.push("Pickup state is missing or invalid.");
  if (!normalized.deliveryState) warnings.push("Delivery state is missing or invalid.");
  if (typeof normalized.rate !== "number" || normalized.rate <= 0) {
    warnings.push("Rate is missing or invalid.");
  }
  if (typeof normalized.weight !== "number" || normalized.weight <= 0) {
    warnings.push("Weight is missing or invalid.");
  }
  if (input.sourceType === "upload" && !normalized.extractionProvider) {
    warnings.push("Upload source is missing extraction provider metadata.");
  }

  const status =
    missingRequiredFields.length > 0
      ? "needs_review"
      : warnings.length > 0 || input.sourceType === "upload"
        ? "needs_review"
        : "ready_to_save";

  return {
    normalized,
    warnings,
    missingRequiredFields,
    status: status || "draft",
  };
}

