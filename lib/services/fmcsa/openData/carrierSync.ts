import { parseAuthorityStatus, readNumber, readText, toIsoDate, type FmcsaAuthorityStatus, type FmcsaCarrierProfile } from "@/lib/services/fmcsa/carrierProfile";
import { COLUMN_ALIASES, FMCSA_DATASETS, type FmcsaDataset } from "@/lib/services/fmcsa/openData/datasets";
import type { LogicalField, OpenDataSchemaValidation, ValidatedDatasetKey } from "@/lib/services/fmcsa/openData/schemaValidation";
import { chunk, usdotInClause, type SodaClient, type SodaRow } from "@/lib/services/fmcsa/openData/sodaClient";

/**
 * Builds FmcsaCarrierProfile snapshots for a set of USDOT numbers from
 * FMCSA open data: Company Census (identity, status, size, MCS-150), Motus
 * Carrier (authority and insurance) and Out-of-Service Orders.
 *
 * With a schema validation, only the validated live column of each field is
 * read. Without one, alias lists are used and the result must be treated as
 * unverified. Read-only and public: no carrier authorization is needed.
 */
const BATCH_SIZE = 100;

export type OpenDataSyncError = { dataset: string; errorCode: string; errorMessage: string };

/** Per-carrier coverage: what each dataset said about this USDOT number. */
export type OpenDataCoverage = {
  census: "FOUND" | "NOT_FOUND" | "ERROR";
  motus: "FOUND" | "NOT_FOUND" | "ERROR";
  /** QUERIED means the OOS query succeeded, so "no order found" is meaningful. */
  outOfServiceOrders: "QUERIED" | "ERROR";
};

/**
 * How the Motus per-authority rows were interpreted for one carrier. Any value
 * BOF does not recognize makes the authority/insurance evidence incomplete
 * (never CLEAR) and is reported so it can be checked against FMCSA's
 * data dictionary.
 */
export type MotusAuthorityEvidence = {
  rows: number;
  authorities: Array<{ docket: string | null; type: string | null; status: string | null }>;
  unrecognizedTypes: string[];
  unrecognizedStatuses: string[];
  insuranceIssue: string | null;
  issues: string[];
};

export type OpenDataSyncResult = {
  profiles: FmcsaCarrierProfile[];
  coverage: Record<string, OpenDataCoverage>;
  motusEvidence: Record<string, MotusAuthorityEvidence>;
  missing: string[];
  errors: OpenDataSyncError[];
  /** Columns seen per dataset, so unverified column names can be checked. */
  observedColumns: Record<string, string[]>;
};

type ColumnResolver = (dataset: ValidatedDatasetKey, field: LogicalField) => string[];

function resolverFor(schema?: OpenDataSchemaValidation): ColumnResolver {
  return (dataset, field) => {
    const resolved = schema?.datasets[dataset]?.resolved[field];
    if (schema) return resolved ? [resolved] : [];
    return [...COLUMN_ALIASES[field]];
  };
}

function normalizeUsdotValue(text: string | null): string | null {
  const digits = text?.replace(/\D/g, "") ?? "";
  return digits ? String(Number(digits)) : null;
}

async function fetchByUsdot(
  client: SodaClient,
  key: ValidatedDatasetKey,
  dataset: FmcsaDataset,
  usdots: string[],
  columns: ColumnResolver,
  errors: OpenDataSyncError[],
  observedColumns: Record<string, string[]>,
): Promise<{ rows: Map<string, SodaRow[]>; failed: boolean }> {
  const byUsdot = new Map<string, SodaRow[]>();
  const usdotColumns = columns(key, "usdot");
  let failed = usdotColumns.length === 0;
  if (failed) errors.push({ dataset: `${dataset.name} (${dataset.id})`, errorCode: "SCHEMA_UNRESOLVED", errorMessage: "No validated USDOT column" });

  for (const batch of failed ? [] : chunk(usdots, BATCH_SIZE)) {
    let lastError: OpenDataSyncError | null = null;
    let ok = false;
    // Column types are unverified: try text then number literals (HTTP 400 = rejected).
    const candidates = usdotColumns.flatMap((column) => [usdotInClause(column, batch, true), usdotInClause(column, batch, false)]);
    for (const where of candidates) {
      if (!where) break;
      const result = await client.query(dataset.id, { where, limit: 5000 });
      if (!result.ok) {
        lastError = { dataset: `${dataset.name} (${dataset.id})`, errorCode: result.errorCode, errorMessage: result.errorMessage };
        if (result.errorCode === "HTTP_400") continue;
        break;
      }
      ok = true;
      const seen = new Set(observedColumns[dataset.id] ?? result.fields ?? []);
      for (const row of result.rows) {
        Object.keys(row).forEach((column) => seen.add(column));
        const usdot = normalizeUsdotValue(readText(row, usdotColumns));
        if (!usdot) continue;
        byUsdot.set(usdot, [...(byUsdot.get(usdot) ?? []), row]);
      }
      observedColumns[dataset.id] = [...seen].sort();
      if (result.rows.length >= 5000) {
        errors.push({ dataset: `${dataset.name} (${dataset.id})`, errorCode: "TRUNCATED", errorMessage: "Row limit reached; results may be incomplete" });
        failed = true;
      }
      break;
    }
    if (!ok) {
      failed = true;
      if (lastError) errors.push(lastError);
    }
  }
  return { rows: byUsdot, failed };
}

/** Latest row by a date column; Motus "All With History" can hold several rows per carrier. */
function latest(rows: SodaRow[] | undefined, dateKeys: string[]): SodaRow | null {
  if (!rows?.length) return null;
  return [...rows].sort((a, b) => (toIsoDate(readText(b, dateKeys)) ?? "").localeCompare(toIsoDate(readText(a, dateKeys)) ?? ""))[0];
}

/** An OOS order is active unless the row says it was rescinded or closed. */
function activeOosDate(rows: SodaRow[] | undefined, columns: ColumnResolver): string | null {
  if (!rows?.length) return null;
  const statusColumns = columns("OUT_OF_SERVICE_ORDERS", "oosStatus");
  const dateColumns = columns("OUT_OF_SERVICE_ORDERS", "oosDate");
  const active = rows.filter((row) => {
    const status = readText(row, statusColumns)?.toUpperCase() ?? "";
    return !/RESCIND|INACTIVE|CLOSED|RELEASED|LIFTED/.test(status);
  });
  const dates = active.map((row) => toIsoDate(readText(row, dateColumns))).filter((value): value is string => Boolean(value));
  return dates.sort().at(-1) ?? null;
}

type AuthorityKind = "COMMON" | "CONTRACT" | "BROKER" | "FREIGHT_FORWARDER";

/** Only plainly worded authority types are accepted; codes or other values stay unrecognized. */
export function classifyAuthorityType(value: string | null): AuthorityKind | null {
  if (!value) return null;
  const upper = value.toUpperCase();
  if (/FREIGHT\s*FORWARD/.test(upper)) return "FREIGHT_FORWARDER";
  if (/\bBROKER/.test(upper)) return "BROKER";
  if (/\bCOMMON\b/.test(upper)) return "COMMON";
  if (/\bCONTRACT\b/.test(upper)) return "CONTRACT";
  return null;
}

/** Authority status; unrecognized values return null (unknown), never a guess. */
export function classifyAuthorityStatus(value: string | null): FmcsaAuthorityStatus | null {
  const parsed = parseAuthorityStatus(value);
  return parsed === null || parsed === "UNKNOWN" ? null : parsed;
}

const STATUS_RANK: Record<FmcsaAuthorityStatus, number> = { ACTIVE: 5, PENDING: 4, REVOKED: 3, INACTIVE: 2, NONE: 1, UNKNOWN: 0 };

/**
 * Derives authority and insurance from Motus per-authority rows. Fail-closed:
 * any unrecognized type or status, or insurance figures that do not appear to
 * be in the same units, leaves the affected values null (unknown).
 */
export function deriveMotusAuthority(rows: SodaRow[], columns: ColumnResolver) {
  const typeCols = columns("MOTUS_CARRIER", "opAuthType");
  const statusCols = columns("MOTUS_CARRIER", "opAuthStatus");
  const docketCols = columns("MOTUS_CARRIER", "docketNumber");
  const evidence: MotusAuthorityEvidence = { rows: rows.length, authorities: [], unrecognizedTypes: [], unrecognizedStatuses: [], insuranceIssue: null, issues: [] };
  const parsed = rows.map((row) => {
    const typeRaw = readText(row, typeCols);
    const statusRaw = readText(row, statusCols);
    const kind = classifyAuthorityType(typeRaw);
    const status = classifyAuthorityStatus(statusRaw);
    evidence.authorities.push({ docket: readText(row, docketCols), type: typeRaw, status: statusRaw });
    if (!kind) evidence.unrecognizedTypes.push(typeRaw ?? "(empty)");
    if (!status) evidence.unrecognizedStatuses.push(statusRaw ?? "(empty)");
    return { row, kind, status };
  });
  evidence.unrecognizedTypes = [...new Set(evidence.unrecognizedTypes)];
  evidence.unrecognizedStatuses = [...new Set(evidence.unrecognizedStatuses)];
  if (evidence.unrecognizedTypes.length) evidence.issues.push(`Unrecognized OP_AUTH_TYPE value(s): ${evidence.unrecognizedTypes.join(", ")}`);
  if (evidence.unrecognizedStatuses.length) evidence.issues.push(`Unrecognized OP_AUTH_STATUS value(s): ${evidence.unrecognizedStatuses.join(", ")}`);
  const interpretable = evidence.issues.length === 0 && rows.length > 0;

  const statusFor = (kind: AuthorityKind): FmcsaAuthorityStatus | null => {
    if (!interpretable) return null;
    const matches = parsed.filter((p) => p.kind === kind).map((p) => p.status as FmcsaAuthorityStatus);
    if (!matches.length) return "NONE";
    return matches.sort((a, b) => STATUS_RANK[b] - STATUS_RANK[a])[0];
  };

  // Insurance from rows of active authorities; both figures come from the same rows.
  let required: number | null = null;
  let onFile: number | null = null;
  if (interpretable) {
    const active = parsed.filter((p) => p.status === "ACTIVE");
    const requiredValues = active.map((p) => readNumber(p.row, columns("MOTUS_CARRIER", "bipdRequired"))).filter((v): v is number => v !== null);
    const onFileValues = active.map((p) => readNumber(p.row, columns("MOTUS_CARRIER", "bipdOnFile"))).filter((v): v is number => v !== null);
    if (!active.length) evidence.insuranceIssue = "No active authority rows; insurance requirement not determined";
    else if (!requiredValues.length || !onFileValues.length) evidence.insuranceIssue = "MIN_COV_AMOUNT or BIPD_FILE missing or non-numeric on active authority rows";
    else {
      required = Math.max(...requiredValues);
      onFile = Math.max(...onFileValues);
      // A ~1000x gap means the two columns are not in the same units; do not compare.
      if (required > 0 && onFile > 0 && Math.max(required / onFile, onFile / required) >= 500) {
        evidence.insuranceIssue = `MIN_COV_AMOUNT (${required}) and BIPD_FILE (${onFile}) appear to use different units`;
        required = null;
        onFile = null;
      }
    }
    if (evidence.insuranceIssue) evidence.issues.push(evidence.insuranceIssue);
  }

  return {
    evidence,
    commonAuthority: statusFor("COMMON"),
    contractAuthority: statusFor("CONTRACT"),
    brokerAuthority: statusFor("BROKER"),
    bipdRequired: required,
    bipdOnFile: onFile,
  };
}

export function mergeOpenDataRows(
  usdot: string,
  census: SodaRow | null,
  motusRows: SodaRow[],
  oosRows: SodaRow[] | undefined,
  retrievedAt: Date,
  columns: ColumnResolver = resolverFor(),
): { profile: FmcsaCarrierProfile | null; motus: MotusAuthorityEvidence } {
  const motus = deriveMotusAuthority(motusRows, columns);
  if (!census && !motusRows.length && !oosRows?.length) return { profile: null, motus: motus.evidence };
  const fromCensus = (field: LogicalField) => (census ? readText(census, columns("COMPANY_CENSUS", field)) : null);
  const fromMotus = (field: LogicalField) => (motusRows[0] ? readText(motusRows[0], columns("MOTUS_CARRIER", field)) : null);
  const censusNumber = (field: LogicalField) => (census ? readNumber(census, columns("COMPANY_CENSUS", field)) : null);
  const oosDate = activeOosDate(oosRows, columns);

  return {
    motus: motus.evidence,
    profile: {
      source: "OPEN_DATA",
      usdot,
      legalName: fromCensus("legalName") ?? fromMotus("legalName"),
      dbaName: fromCensus("dbaName"),
      usdotStatus: fromCensus("usdotStatus"),
      // Open data has no "allowed to operate" flag; derive it only from an
      // active OOS order. Absence of an order is not proof of permission.
      allowedToOperate: oosDate ? false : null,
      outOfServiceDate: oosDate,
      commonAuthority: motus.commonAuthority,
      contractAuthority: motus.contractAuthority,
      brokerAuthority: motus.brokerAuthority,
      // As published by FMCSA (MIN_COV_AMOUNT / BIPD_FILE); compared only with each other.
      bipdInsuranceOnFileUsd: motus.bipdOnFile,
      bipdInsuranceRequiredUsd: motus.bipdRequired,
      insuranceAmountUnit: "FMCSA_PUBLISHED",
      safetyRating: null,
      safetyRatingDate: null,
      powerUnits: censusNumber("powerUnits"),
      drivers: censusNumber("drivers"),
      mcs150Date: toIsoDate(fromCensus("mcs150Date")),
      mcs150Outdated: null,
      retrievedAt: retrievedAt.toISOString(),
    },
  };
}

export async function fetchOpenDataCarrierProfiles(
  client: SodaClient,
  usdotInput: string[],
  schema?: OpenDataSchemaValidation,
): Promise<OpenDataSyncResult> {
  const usdots = [...new Set(usdotInput.map((value) => normalizeUsdotValue(value)).filter((value): value is string => Boolean(value)))];
  const errors: OpenDataSyncError[] = [];
  const observedColumns: Record<string, string[]> = {};
  const coverage: Record<string, OpenDataCoverage> = {};
  const motusEvidence: Record<string, MotusAuthorityEvidence> = {};
  if (usdots.length === 0) return { profiles: [], coverage, motusEvidence, missing: [], errors, observedColumns };

  const columns = resolverFor(schema);
  const [census, motus, oos] = await Promise.all([
    fetchByUsdot(client, "COMPANY_CENSUS", FMCSA_DATASETS.COMPANY_CENSUS, usdots, columns, errors, observedColumns),
    fetchByUsdot(client, "MOTUS_CARRIER", FMCSA_DATASETS.MOTUS_CARRIER, usdots, columns, errors, observedColumns),
    fetchByUsdot(client, "OUT_OF_SERVICE_ORDERS", FMCSA_DATASETS.OUT_OF_SERVICE_ORDERS, usdots, columns, errors, observedColumns),
  ]);
  const retrievedAt = new Date();
  const profiles: FmcsaCarrierProfile[] = [];
  const missing: string[] = [];
  for (const usdot of usdots) {
    coverage[usdot] = {
      census: census.failed ? "ERROR" : census.rows.has(usdot) ? "FOUND" : "NOT_FOUND",
      motus: motus.failed ? "ERROR" : motus.rows.has(usdot) ? "FOUND" : "NOT_FOUND",
      outOfServiceOrders: oos.failed ? "ERROR" : "QUERIED",
    };
    const merged = mergeOpenDataRows(
      usdot,
      latest(census.rows.get(usdot), [...columns("COMPANY_CENSUS", "mcs150Date"), "add_date"]),
      motus.rows.get(usdot) ?? [],
      oos.rows.get(usdot),
      retrievedAt,
      columns,
    );
    if (motus.rows.has(usdot)) motusEvidence[usdot] = merged.motus;
    if (merged.profile) profiles.push(merged.profile);
    else missing.push(usdot);
  }
  return { profiles, coverage, motusEvidence, missing, errors, observedColumns };
}
