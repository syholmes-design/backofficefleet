import { parseAuthorityStatus, readNumber, readText, toIsoDate, type FmcsaCarrierProfile } from "@/lib/services/fmcsa/carrierProfile";
import { COLUMN_ALIASES, FMCSA_DATASETS, type FmcsaDataset } from "@/lib/services/fmcsa/openData/datasets";
import { chunk, usdotInClause, type SodaClient, type SodaRow } from "@/lib/services/fmcsa/openData/sodaClient";

/**
 * Builds FmcsaCarrierProfile snapshots for a set of USDOT numbers from
 * FMCSA open data: Company Census (identity, size, MCS-150), Motus Carrier
 * (authority and insurance) and Out-of-Service Orders.
 *
 * Read-only and public: no carrier authorization is needed. Results feed the
 * pure rules in carrierMonitoring.ts.
 */
const BATCH_SIZE = 100;

export type OpenDataSyncError = { dataset: string; errorCode: string; errorMessage: string };

export type OpenDataSyncResult = {
  profiles: FmcsaCarrierProfile[];
  missing: string[];
  errors: OpenDataSyncError[];
  /** Columns seen per dataset, so unverified column names can be checked. */
  observedColumns: Record<string, string[]>;
};

function usdotOf(row: SodaRow): string | null {
  const text = readText(row, [...COLUMN_ALIASES.usdot]);
  const digits = text?.replace(/\D/g, "") ?? "";
  return digits ? String(Number(digits)) : null;
}

async function fetchByUsdot(
  client: SodaClient,
  dataset: FmcsaDataset,
  usdots: string[],
  errors: OpenDataSyncError[],
  observedColumns: Record<string, string[]>,
): Promise<Map<string, SodaRow[]>> {
  const byUsdot = new Map<string, SodaRow[]>();
  for (const batch of chunk(usdots, BATCH_SIZE)) {
    let lastError: OpenDataSyncError | null = null;
    let ok = false;
    // Column names and types are unverified: try each candidate column, with
    // text then number literals, until the API accepts one (HTTP 400 = rejected).
    const candidates = dataset.usdotColumns.flatMap((column) => [usdotInClause(column, batch, true), usdotInClause(column, batch, false)]);
    for (const where of candidates) {
      if (!where) break;
      const result = await client.query(dataset.id, { where, limit: 5000 });
      if (!result.ok) {
        lastError = { dataset: `${dataset.name} (${dataset.id})`, errorCode: result.errorCode, errorMessage: result.errorMessage };
        if (result.errorCode === "HTTP_400") continue;
        break;
      }
      ok = true;
      for (const row of result.rows) {
        const columns = new Set(observedColumns[dataset.id] ?? []);
        Object.keys(row).forEach((key) => columns.add(key));
        observedColumns[dataset.id] = [...columns].sort();
        const usdot = usdotOf(row);
        if (!usdot) continue;
        byUsdot.set(usdot, [...(byUsdot.get(usdot) ?? []), row]);
      }
      break;
    }
    if (!ok && lastError) errors.push(lastError);
  }
  return byUsdot;
}

/** Latest row by a date column; Motus "All With History" can hold several rows per carrier. */
function latest(rows: SodaRow[] | undefined, dateKeys: string[]): SodaRow | null {
  if (!rows?.length) return null;
  return [...rows].sort((a, b) => (toIsoDate(readText(b, dateKeys)) ?? "").localeCompare(toIsoDate(readText(a, dateKeys)) ?? ""))[0];
}

/** An OOS order is active unless the row says it was rescinded or closed. */
function activeOosDate(rows: SodaRow[] | undefined): string | null {
  if (!rows?.length) return null;
  const active = rows.filter((row) => {
    const status = readText(row, [...COLUMN_ALIASES.oosStatus])?.toUpperCase() ?? "";
    return !/RESCIND|INACTIVE|CLOSED|RELEASED|LIFTED/.test(status);
  });
  const dates = active.map((row) => toIsoDate(readText(row, [...COLUMN_ALIASES.oosDate]))).filter((value): value is string => Boolean(value));
  return dates.sort().at(-1) ?? null;
}

export function mergeOpenDataRows(
  usdot: string,
  census: SodaRow | null,
  motus: SodaRow | null,
  oosRows: SodaRow[] | undefined,
  retrievedAt: Date,
): FmcsaCarrierProfile | null {
  if (!census && !motus && !oosRows?.length) return null;
  const pick = (keys: readonly string[]) => (census && readText(census, [...keys])) || (motus && readText(motus, [...keys])) || null;
  const motusNumber = (keys: readonly string[]) => (motus ? readNumber(motus, [...keys]) : null);
  const motusAuthority = (keys: readonly string[]) => (motus ? parseAuthorityStatus(readText(motus, [...keys])) : null);
  const oosDate = activeOosDate(oosRows);
  const usdotStatus = pick(COLUMN_ALIASES.usdotStatus);

  return {
    source: "OPEN_DATA",
    usdot,
    legalName: pick(COLUMN_ALIASES.legalName),
    dbaName: pick(COLUMN_ALIASES.dbaName),
    usdotStatus,
    // Open data has no "allowed to operate" flag; derive it only from an
    // active OOS order. Absence of an order is not proof of permission.
    allowedToOperate: oosDate ? false : null,
    outOfServiceDate: oosDate,
    commonAuthority: motusAuthority(COLUMN_ALIASES.commonAuthority),
    contractAuthority: motusAuthority(COLUMN_ALIASES.contractAuthority),
    brokerAuthority: motusAuthority(COLUMN_ALIASES.brokerAuthority),
    bipdInsuranceOnFileUsd: motusNumber(COLUMN_ALIASES.bipdOnFile),
    bipdInsuranceRequiredUsd: motusNumber(COLUMN_ALIASES.bipdRequired),
    safetyRating: null,
    safetyRatingDate: null,
    powerUnits: census ? readNumber(census, [...COLUMN_ALIASES.powerUnits]) : null,
    drivers: census ? readNumber(census, [...COLUMN_ALIASES.drivers]) : null,
    mcs150Date: census ? toIsoDate(readText(census, [...COLUMN_ALIASES.mcs150Date])) : null,
    mcs150Outdated: null,
    retrievedAt: retrievedAt.toISOString(),
  };
}

export async function fetchOpenDataCarrierProfiles(client: SodaClient, usdotInput: string[]): Promise<OpenDataSyncResult> {
  const usdots = [...new Set(usdotInput.map((value) => value.replace(/\D/g, "")).filter(Boolean).map((value) => String(Number(value))))];
  const errors: OpenDataSyncError[] = [];
  const observedColumns: Record<string, string[]> = {};
  if (usdots.length === 0) return { profiles: [], missing: [], errors, observedColumns };

  const [census, motus, oos] = await Promise.all([
    fetchByUsdot(client, FMCSA_DATASETS.COMPANY_CENSUS, usdots, errors, observedColumns),
    fetchByUsdot(client, FMCSA_DATASETS.MOTUS_CARRIER, usdots, errors, observedColumns),
    fetchByUsdot(client, FMCSA_DATASETS.OUT_OF_SERVICE_ORDERS, usdots, errors, observedColumns),
  ]);
  const retrievedAt = new Date();
  const profiles: FmcsaCarrierProfile[] = [];
  const missing: string[] = [];
  for (const usdot of usdots) {
    const profile = mergeOpenDataRows(
      usdot,
      latest(census.get(usdot), [...COLUMN_ALIASES.mcs150Date, "add_date"]),
      latest(motus.get(usdot), ["last_update", "updated_date", "change_date", "effective_date"]),
      oos.get(usdot),
      retrievedAt,
    );
    if (profile) profiles.push(profile);
    else missing.push(usdot);
  }
  return { profiles, missing, errors, observedColumns };
}
