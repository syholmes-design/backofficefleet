import { parseAuthorityStatus, readNumber, readText, toIsoDate, type FmcsaCarrierProfile } from "@/lib/services/fmcsa/carrierProfile";
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

export type OpenDataSyncResult = {
  profiles: FmcsaCarrierProfile[];
  coverage: Record<string, OpenDataCoverage>;
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

export function mergeOpenDataRows(
  usdot: string,
  census: SodaRow | null,
  motus: SodaRow | null,
  oosRows: SodaRow[] | undefined,
  retrievedAt: Date,
  columns: ColumnResolver = resolverFor(),
): FmcsaCarrierProfile | null {
  if (!census && !motus && !oosRows?.length) return null;
  const fromCensus = (field: LogicalField) => (census ? readText(census, columns("COMPANY_CENSUS", field)) : null);
  const fromMotus = (field: LogicalField) => (motus ? readText(motus, columns("MOTUS_CARRIER", field)) : null);
  const censusNumber = (field: LogicalField) => (census ? readNumber(census, columns("COMPANY_CENSUS", field)) : null);
  const motusNumber = (field: LogicalField) => (motus ? readNumber(motus, columns("MOTUS_CARRIER", field)) : null);
  const oosDate = activeOosDate(oosRows, columns);

  return {
    source: "OPEN_DATA",
    usdot,
    legalName: fromCensus("legalName") ?? fromMotus("legalName"),
    dbaName: fromCensus("dbaName"),
    usdotStatus: fromCensus("usdotStatus"),
    // Open data has no "allowed to operate" flag; derive it only from an
    // active OOS order. Absence of an order is not proof of permission.
    allowedToOperate: oosDate ? false : null,
    outOfServiceDate: oosDate,
    commonAuthority: parseAuthorityStatus(fromMotus("commonAuthority")),
    contractAuthority: parseAuthorityStatus(fromMotus("contractAuthority")),
    brokerAuthority: parseAuthorityStatus(fromMotus("brokerAuthority")),
    bipdInsuranceOnFileUsd: motusNumber("bipdOnFile"),
    bipdInsuranceRequiredUsd: motusNumber("bipdRequired"),
    safetyRating: null,
    safetyRatingDate: null,
    powerUnits: censusNumber("powerUnits"),
    drivers: censusNumber("drivers"),
    mcs150Date: toIsoDate(fromCensus("mcs150Date")),
    mcs150Outdated: null,
    retrievedAt: retrievedAt.toISOString(),
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
  if (usdots.length === 0) return { profiles: [], coverage, missing: [], errors, observedColumns };

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
    const profile = mergeOpenDataRows(
      usdot,
      latest(census.rows.get(usdot), [...columns("COMPANY_CENSUS", "mcs150Date"), "add_date"]),
      latest(motus.rows.get(usdot), ["last_update", "updated_date", "change_date", "effective_date"]),
      oos.rows.get(usdot),
      retrievedAt,
      columns,
    );
    if (profile) profiles.push(profile);
    else missing.push(usdot);
  }
  return { profiles, coverage, missing, errors, observedColumns };
}
