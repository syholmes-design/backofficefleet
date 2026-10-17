/**
 * Minimal read-only client for FMCSA open data on data.transportation.gov
 * (Socrata SODA API). Public data: no carrier authorization is needed.
 *
 * The optional app token (FMCSA_SOCRATA_APP_TOKEN) raises rate limits. It is
 * sent only as the X-App-Token header and never included in URLs, results,
 * errors or logs.
 */
export const DOT_OPEN_DATA_BASE_URL = "https://data.transportation.gov/resource";

const DEFAULT_TIMEOUT_MS = 15_000;
const DATASET_ID = /^[a-z0-9]{4}-[a-z0-9]{4}$/;

export type SodaRow = Record<string, unknown>;

export type SodaQuery = {
  select?: string;
  where?: string;
  order?: string;
  limit?: number;
  offset?: number;
};

export type SodaResult =
  | { ok: true; rows: SodaRow[]; datasetId: string; retrievedAt: Date }
  | { ok: false; datasetId: string; errorCode: string; errorMessage: string };

export class SodaClient {
  constructor(
    private readonly appToken: string | null = null,
    private readonly fetchImpl: typeof fetch = fetch,
    private readonly timeoutMs = DEFAULT_TIMEOUT_MS,
  ) {}

  /** The request URL; it never carries the app token. */
  buildUrl(datasetId: string, query: SodaQuery): URL {
    if (!DATASET_ID.test(datasetId)) throw new Error(`Invalid Socrata dataset id: ${datasetId}`);
    const url = new URL(`${DOT_OPEN_DATA_BASE_URL}/${datasetId}.json`);
    if (query.select) url.searchParams.set("$select", query.select);
    if (query.where) url.searchParams.set("$where", query.where);
    if (query.order) url.searchParams.set("$order", query.order);
    if (query.limit !== undefined) url.searchParams.set("$limit", String(query.limit));
    if (query.offset !== undefined) url.searchParams.set("$offset", String(query.offset));
    return url;
  }

  async query(datasetId: string, query: SodaQuery): Promise<SodaResult> {
    let url: URL;
    try {
      url = this.buildUrl(datasetId, query);
    } catch (error) {
      return { ok: false, datasetId, errorCode: "INVALID_QUERY", errorMessage: (error as Error).message };
    }
    const headers: Record<string, string> = { Accept: "application/json" };
    if (this.appToken) headers["X-App-Token"] = this.appToken;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(url, { method: "GET", headers, signal: controller.signal, cache: "no-store" });
      if (response.status === 429) {
        return { ok: false, datasetId, errorCode: "RATE_LIMITED", errorMessage: "data.transportation.gov rate limit reached" };
      }
      if (response.status === 401 || response.status === 403) {
        return { ok: false, datasetId, errorCode: "AUTH_FAILED", errorMessage: "data.transportation.gov rejected the app token" };
      }
      if (!response.ok) {
        return { ok: false, datasetId, errorCode: `HTTP_${response.status}`, errorMessage: `data.transportation.gov returned HTTP ${response.status}` };
      }
      const payload: unknown = await response.json().catch(() => null);
      if (!Array.isArray(payload)) {
        return { ok: false, datasetId, errorCode: "MALFORMED_RESPONSE", errorMessage: "Expected a JSON array of rows" };
      }
      return { ok: true, rows: payload as SodaRow[], datasetId, retrievedAt: new Date() };
    } catch (error) {
      const aborted = error instanceof Error && error.name === "AbortError";
      return {
        ok: false,
        datasetId,
        errorCode: aborted ? "TIMEOUT" : "NETWORK_ERROR",
        errorMessage: aborted ? "data.transportation.gov request timed out" : "data.transportation.gov request failed",
      };
    } finally {
      clearTimeout(timer);
    }
  }
}

/**
 * SoQL `IN (...)` clause for USDOT numbers. Only digit strings are emitted,
 * so caller input cannot inject SoQL. Text columns need quoted literals and
 * number columns unquoted ones; column types are unverified, so callers try both.
 */
export function usdotInClause(column: string, usdots: string[], quoted = true): string | null {
  if (!/^[a-z_][a-z0-9_]*$/.test(column)) throw new Error(`Invalid column name: ${column}`);
  const clean = [...new Set(usdots.map((value) => value.replace(/\D/g, "")).filter((value) => value.length > 0 && value.length <= 10))];
  if (clean.length === 0) return null;
  return `${column} in (${clean.map((value) => (quoted ? `'${value}'` : value)).join(", ")})`;
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let index = 0; index < items.length; index += size) out.push(items.slice(index, index + size));
  return out;
}

export function createSodaClientFromEnv(): SodaClient {
  return new SodaClient(process.env.FMCSA_SOCRATA_APP_TOKEN?.trim() || null);
}
