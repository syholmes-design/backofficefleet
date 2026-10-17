import { COLUMN_ALIASES, FMCSA_DATASETS, type FmcsaDatasetKey } from "@/lib/services/fmcsa/openData/datasets";
import type { SodaClient } from "@/lib/services/fmcsa/openData/sodaClient";

/**
 * Validates the live schema of each FMCSA dataset before its data is trusted.
 *
 * Column names in datasets.ts come from secondary sources. A probe reads the
 * dataset's real field list (X-SODA2-Fields header) and resolves every field
 * BOF relies on to exactly one live column. If a required field cannot be
 * resolved, or the dataset's data is older than its freshness limit or of
 * unknown age, the dataset is NOT trusted and monitoring cannot report CLEAR.
 */
export type LogicalField = keyof typeof COLUMN_ALIASES;

type FieldSpec = { required: LogicalField[]; optional: LogicalField[] };

export const DATASET_FIELD_SPECS: Record<"COMPANY_CENSUS" | "MOTUS_CARRIER" | "OUT_OF_SERVICE_ORDERS", FieldSpec> = {
  COMPANY_CENSUS: {
    required: ["usdot", "legalName", "usdotStatus", "mcs150Date"],
    optional: ["dbaName", "powerUnits", "drivers"],
  },
  MOTUS_CARRIER: {
    required: ["usdot", "commonAuthority", "bipdRequired", "bipdOnFile"],
    optional: ["contractAuthority", "brokerAuthority", "legalName"],
  },
  OUT_OF_SERVICE_ORDERS: {
    required: ["usdot", "oosDate"],
    optional: ["oosReason", "oosStatus"],
  },
};

export type ValidatedDatasetKey = keyof typeof DATASET_FIELD_SPECS;
export const VALIDATED_DATASETS = Object.keys(DATASET_FIELD_SPECS) as ValidatedDatasetKey[];

/** Daily datasets older than this are stale. */
export const DATASET_MAX_AGE_HOURS = 72;

export type DatasetSchemaReport = {
  key: ValidatedDatasetKey;
  datasetId: string;
  name: string;
  probeOk: boolean;
  errorCode: string | null;
  /** HEADER = authoritative field list; ROW_KEYS = sample row only (null fields omitted). */
  fieldsSource: "HEADER" | "ROW_KEYS" | "NONE";
  liveFields: string[];
  resolved: Partial<Record<LogicalField, string>>;
  missingRequired: LogicalField[];
  missingOptional: LogicalField[];
  lastModified: string | null;
  ageHours: number | null;
  fresh: boolean;
  /** Trusted = probe ok, every required field resolved, data fresh. */
  trusted: boolean;
  issues: string[];
};

export type OpenDataSchemaValidation = {
  validatedAt: string;
  trusted: boolean;
  datasets: Record<ValidatedDatasetKey, DatasetSchemaReport>;
};

export function resolveFields(spec: FieldSpec, liveFields: string[]) {
  const lower = new Map(liveFields.map((field) => [field.toLowerCase(), field]));
  const resolved: Partial<Record<LogicalField, string>> = {};
  const resolveOne = (logical: LogicalField) => {
    for (const alias of COLUMN_ALIASES[logical]) {
      const hit = lower.get(alias.toLowerCase());
      if (hit) return hit;
    }
    return null;
  };
  const missingRequired: LogicalField[] = [];
  const missingOptional: LogicalField[] = [];
  for (const logical of spec.required) {
    const column = resolveOne(logical);
    if (column) resolved[logical] = column;
    else missingRequired.push(logical);
  }
  for (const logical of spec.optional) {
    const column = resolveOne(logical);
    if (column) resolved[logical] = column;
    else missingOptional.push(logical);
  }
  return { resolved, missingRequired, missingOptional };
}

export async function probeDatasetSchema(client: SodaClient, key: ValidatedDatasetKey, now: Date = new Date()): Promise<DatasetSchemaReport> {
  const dataset = FMCSA_DATASETS[key as FmcsaDatasetKey];
  const spec = DATASET_FIELD_SPECS[key];
  const base = { key, datasetId: dataset.id, name: dataset.name };
  const result = await client.query(dataset.id, { limit: 1 });
  if (!result.ok) {
    return {
      ...base,
      probeOk: false,
      errorCode: result.errorCode,
      fieldsSource: "NONE",
      liveFields: [],
      resolved: {},
      missingRequired: [...spec.required],
      missingOptional: [...spec.optional],
      lastModified: null,
      ageHours: null,
      fresh: false,
      trusted: false,
      issues: [`Probe failed: ${result.errorCode}`],
    };
  }
  const fieldsSource = result.fields ? "HEADER" : result.rows.length ? "ROW_KEYS" : "NONE";
  const liveFields = result.fields ?? Object.keys(result.rows[0] ?? {});
  const { resolved, missingRequired, missingOptional } = resolveFields(spec, liveFields);
  const ageHours = result.lastModified ? Math.max(0, (now.getTime() - result.lastModified.getTime()) / 3_600_000) : null;
  const fresh = ageHours !== null && ageHours <= DATASET_MAX_AGE_HOURS;

  const issues: string[] = [];
  if (fieldsSource !== "HEADER") issues.push("Live field list header not returned; schema inferred from a sample row");
  if (missingRequired.length) issues.push(`Required fields not found in live schema: ${missingRequired.join(", ")}`);
  if (ageHours === null) issues.push("Dataset freshness unknown (no last-modified header)");
  else if (!fresh) issues.push(`Dataset data is ${Math.round(ageHours)} hours old (limit ${DATASET_MAX_AGE_HOURS})`);

  return {
    ...base,
    probeOk: true,
    errorCode: null,
    fieldsSource,
    liveFields: [...liveFields].sort(),
    resolved,
    missingRequired,
    missingOptional,
    lastModified: result.lastModified?.toISOString() ?? null,
    ageHours: ageHours === null ? null : Math.round(ageHours * 10) / 10,
    fresh,
    trusted: missingRequired.length === 0 && fresh,
    issues,
  };
}

export async function validateOpenDataSchemas(client: SodaClient, now: Date = new Date()): Promise<OpenDataSchemaValidation> {
  const reports = await Promise.all(VALIDATED_DATASETS.map((key) => probeDatasetSchema(client, key, now)));
  const datasets = Object.fromEntries(reports.map((report) => [report.key, report])) as Record<ValidatedDatasetKey, DatasetSchemaReport>;
  return { validatedAt: now.toISOString(), trusted: reports.every((report) => report.trusted), datasets };
}
