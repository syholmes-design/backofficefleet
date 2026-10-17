import { COLUMN_ALIASES, FMCSA_DATASETS, OFFICIAL_COLUMN_NAMES, type FmcsaDatasetKey } from "@/lib/services/fmcsa/openData/datasets";
import type { SodaClient, SodaColumn } from "@/lib/services/fmcsa/openData/sodaClient";

/**
 * Validates the live schema of each FMCSA dataset before its data is trusted.
 *
 * For every field BOF relies on, resolution prefers FMCSA's official column
 * metadata (/api/views/<id>.json): the column whose official display name
 * matches is used, with the API field name FMCSA assigned to it. Fields marked
 * `metadataRequired` are accepted ONLY that way. A name match in the API's
 * field list is not enough, because Motus changed the data model and API names
 * can differ from display names. Other fields may fall back to known API field
 * names when metadata is unavailable.
 *
 * A dataset is trusted only when every required field resolves, every resolved
 * column is actually served by the API, and the data is fresh. Otherwise
 * monitoring cannot report CLEAR.
 */
export type LogicalField = keyof typeof COLUMN_ALIASES;

type FieldSpec = { required: LogicalField[]; optional: LogicalField[]; metadataRequired: LogicalField[] };

export const DATASET_FIELD_SPECS: Record<"COMPANY_CENSUS" | "MOTUS_CARRIER" | "OUT_OF_SERVICE_ORDERS", FieldSpec> = {
  COMPANY_CENSUS: {
    required: ["usdot", "legalName", "usdotStatus", "mcs150Date"],
    optional: ["dbaName", "powerUnits", "drivers"],
    metadataRequired: [],
  },
  // One row per operating authority (Motus model).
  MOTUS_CARRIER: {
    required: ["usdot", "opAuthType", "opAuthStatus", "bipdRequired", "bipdOnFile"],
    optional: ["docketNumber", "legalName"],
    metadataRequired: ["opAuthType", "opAuthStatus", "bipdRequired", "bipdOnFile"],
  },
  OUT_OF_SERVICE_ORDERS: {
    required: ["usdot", "oosDate"],
    optional: ["oosReason", "oosStatus"],
    metadataRequired: [],
  },
};

export type ValidatedDatasetKey = keyof typeof DATASET_FIELD_SPECS;
export const VALIDATED_DATASETS = Object.keys(DATASET_FIELD_SPECS) as ValidatedDatasetKey[];

/** Daily datasets older than this are stale. */
export const DATASET_MAX_AGE_HOURS = 72;

export type FieldResolution = {
  column: string;
  /** OFFICIAL_METADATA: matched FMCSA's published column name. FIELD_NAME: matched a known API field name only. */
  verifiedBy: "OFFICIAL_METADATA" | "FIELD_NAME";
  officialName: string | null;
  description: string | null;
};

export type DatasetSchemaReport = {
  key: ValidatedDatasetKey;
  datasetId: string;
  name: string;
  probeOk: boolean;
  errorCode: string | null;
  /** HEADER = authoritative field list; ROW_KEYS = sample row only (null fields omitted). */
  fieldsSource: "HEADER" | "ROW_KEYS" | "NONE";
  metadataOk: boolean;
  liveFields: string[];
  /** FMCSA's published columns, kept so a failed mapping can be corrected from official data. */
  officialColumns: Array<Pick<SodaColumn, "fieldName" | "name" | "description">>;
  resolved: Partial<Record<LogicalField, string>>;
  fieldResolution: Partial<Record<LogicalField, FieldResolution>>;
  missingRequired: LogicalField[];
  missingOptional: LogicalField[];
  lastModified: string | null;
  ageHours: number | null;
  fresh: boolean;
  /** Trusted = probe ok, every required field resolved and served, data fresh. */
  trusted: boolean;
  issues: string[];
};

export type OpenDataSchemaValidation = {
  validatedAt: string;
  trusted: boolean;
  datasets: Record<ValidatedDatasetKey, DatasetSchemaReport>;
};

const normalizeName = (value: string) => value.trim().toUpperCase().replace(/[\s-]+/g, "_");

export function resolveFields(spec: FieldSpec, liveFields: string[], officialColumns: SodaColumn[] | null) {
  const served = new Set(liveFields.map((field) => field.toLowerCase()));
  const resolved: Partial<Record<LogicalField, string>> = {};
  const fieldResolution: Partial<Record<LogicalField, FieldResolution>> = {};
  const issues: string[] = [];

  const resolveOne = (logical: LogicalField): FieldResolution | null => {
    const officialNames = OFFICIAL_COLUMN_NAMES[logical] ?? [];
    if (officialColumns) {
      const match = officialColumns.find((column) => officialNames.includes(normalizeName(column.name)));
      if (match) {
        // The API must actually serve the column the metadata names.
        if (served.size > 0 && !served.has(match.fieldName.toLowerCase())) {
          issues.push(`${logical}: official column ${match.name} (${match.fieldName}) is not served by the API`);
          return null;
        }
        return { column: match.fieldName, verifiedBy: "OFFICIAL_METADATA", officialName: match.name, description: match.description };
      }
    }
    if (spec.metadataRequired.includes(logical)) return null;
    const lower = new Map(liveFields.map((field) => [field.toLowerCase(), field]));
    for (const alias of COLUMN_ALIASES[logical]) {
      const hit = lower.get(alias.toLowerCase());
      if (hit) return { column: hit, verifiedBy: "FIELD_NAME", officialName: null, description: null };
    }
    return null;
  };

  const missingRequired: LogicalField[] = [];
  const missingOptional: LogicalField[] = [];
  for (const [list, missing] of [
    [spec.required, missingRequired],
    [spec.optional, missingOptional],
  ] as const) {
    for (const logical of list) {
      const resolution = resolveOne(logical);
      if (resolution) {
        resolved[logical] = resolution.column;
        fieldResolution[logical] = resolution;
      } else {
        missing.push(logical);
      }
    }
  }
  for (const logical of missingRequired) {
    if (spec.metadataRequired.includes(logical)) {
      const names = (OFFICIAL_COLUMN_NAMES[logical] ?? []).join(" / ");
      issues.push(
        officialColumns
          ? `${logical}: no official column named ${names} in FMCSA metadata`
          : `${logical}: requires confirmation from FMCSA column metadata (${names}), which was unavailable`,
      );
    }
  }
  return { resolved, fieldResolution, missingRequired, missingOptional, issues };
}

export async function probeDatasetSchema(client: SodaClient, key: ValidatedDatasetKey, now: Date = new Date()): Promise<DatasetSchemaReport> {
  const dataset = FMCSA_DATASETS[key as FmcsaDatasetKey];
  const spec = DATASET_FIELD_SPECS[key];
  const base = { key, datasetId: dataset.id, name: dataset.name };
  const [result, metadata] = await Promise.all([client.query(dataset.id, { limit: 1 }), client.metadata(dataset.id)]);
  const officialColumns = metadata.ok ? metadata.columns : null;
  const officialSummary = (officialColumns ?? []).map(({ fieldName, name, description }) => ({ fieldName, name, description }));

  if (!result.ok) {
    return {
      ...base,
      probeOk: false,
      errorCode: result.errorCode,
      fieldsSource: "NONE",
      metadataOk: metadata.ok,
      liveFields: [],
      officialColumns: officialSummary,
      resolved: {},
      fieldResolution: {},
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
  const { resolved, fieldResolution, missingRequired, missingOptional, issues: fieldIssues } = resolveFields(spec, liveFields, officialColumns);
  const lastModified = result.lastModified ?? (metadata.ok ? metadata.rowsUpdatedAt : null);
  const ageHours = lastModified ? Math.max(0, (now.getTime() - lastModified.getTime()) / 3_600_000) : null;
  const fresh = ageHours !== null && ageHours <= DATASET_MAX_AGE_HOURS;

  const issues: string[] = [];
  if (fieldsSource !== "HEADER") issues.push("Live field list header not returned; schema inferred from a sample row");
  if (!metadata.ok) issues.push(`Official column metadata unavailable (${metadata.errorCode})`);
  if (missingRequired.length) issues.push(`Required fields not found in live schema: ${missingRequired.join(", ")}`);
  issues.push(...fieldIssues);
  if (ageHours === null) issues.push("Dataset freshness unknown (no last-modified header or metadata)");
  else if (!fresh) issues.push(`Dataset data is ${Math.round(ageHours)} hours old (limit ${DATASET_MAX_AGE_HOURS})`);

  return {
    ...base,
    probeOk: true,
    errorCode: null,
    fieldsSource,
    metadataOk: metadata.ok,
    liveFields: [...liveFields].sort(),
    officialColumns: officialSummary,
    resolved,
    fieldResolution,
    missingRequired,
    missingOptional,
    lastModified: lastModified?.toISOString() ?? null,
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
