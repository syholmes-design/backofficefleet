/**
 * Test double for data.transportation.gov: serves /resource/<id>.json (rows +
 * X-SODA2-Fields / Last-Modified headers) and /api/views/<id>.json (official
 * column metadata). Used only by tests.
 */
import { FMCSA_DATASETS } from "@/lib/services/fmcsa/openData/datasets";

export type DoubleColumn = { fieldName: string; name: string; description?: string };

const col = (fieldName: string, name = fieldName.toUpperCase(), description?: string): DoubleColumn => ({ fieldName, name, description });

/** Motus layout after 2026-05-14: one row per operating authority (shape per FMCSA's dataset page). */
export const MOTUS_COLUMNS: DoubleColumn[] = [
  col("docket_number", "DOCKET_NUMBER"),
  col("dot_number", "DOT_NUMBER"),
  col("legal_name", "LEGAL_NAME"),
  col("op_auth_type", "OP_AUTH_TYPE", "Operating Authority Type"),
  col("op_auth_status", "OP_AUTH_STATUS", "Operating Authority Status"),
  col("min_cov_amount", "MIN_COV_AMOUNT", "Minimum BI&PD coverage required"),
  col("bipd_file", "BIPD_FILE", "BI&PD coverage on file"),
];

/** The pre-Motus layout BOF originally assumed; the live dataset no longer has these columns. */
export const LEGACY_MOTUS_ASSUMED_COLUMNS: DoubleColumn[] = [col("usdot_number"), col("common_stat"), col("bipd_req"), col("bipd_file")];

export const CENSUS_COLUMNS: DoubleColumn[] = ["dot_number", "legal_name", "dba_name", "status_code", "mcs150_date", "power_units", "total_drivers"].map((f) => col(f));
export const OOS_COLUMNS: DoubleColumn[] = ["dot_number", "oos_date", "oos_reason", "status"].map((f) => col(f));

export type DoubleOptions = {
  columns?: Partial<Record<string, DoubleColumn[]>>;
  /** Override X-SODA2-Fields per dataset (defaults to the columns' field names); null omits the header. */
  servedFields?: Partial<Record<string, string[] | null>>;
  rows?: Partial<Record<string, unknown[]>>;
  lastModified?: string | null;
  metadataStatus?: number;
  dataStatus?: Partial<Record<string, number>>;
};

export function fmcsaFetchDouble(options: DoubleOptions = {}): typeof fetch {
  const columns: Record<string, DoubleColumn[]> = {
    [FMCSA_DATASETS.COMPANY_CENSUS.id]: CENSUS_COLUMNS,
    [FMCSA_DATASETS.MOTUS_CARRIER.id]: MOTUS_COLUMNS,
    [FMCSA_DATASETS.OUT_OF_SERVICE_ORDERS.id]: OOS_COLUMNS,
    ...(options.columns as Record<string, DoubleColumn[]>),
  };
  return (async (input: string | URL | Request) => {
    const url = new URL(String(input));
    const meta = /\/api\/views\/([a-z0-9-]+)\.json$/.exec(url.pathname);
    if (meta) {
      if (options.metadataStatus && options.metadataStatus !== 200) return new Response("", { status: options.metadataStatus });
      const id = meta[1];
      return new Response(
        JSON.stringify({
          name: id,
          rowsUpdatedAt: Math.floor(Date.now() / 1000) - 3600,
          columns: [{ fieldName: ":id", name: "id" }, ...(columns[id] ?? [])],
        }),
        { status: 200 },
      );
    }
    const id = /\/resource\/([a-z0-9-]+)\.json$/.exec(url.pathname)?.[1] ?? "";
    const status = options.dataStatus?.[id];
    if (status) return new Response("", { status });
    const headers = new Headers();
    const served = options.servedFields && id in options.servedFields ? options.servedFields[id] : (columns[id] ?? []).map((c) => c.fieldName);
    if (served) headers.set("X-SODA2-Fields", JSON.stringify(served));
    const lastModified = options.lastModified === undefined ? new Date(Date.now() - 6 * 3_600_000).toUTCString() : options.lastModified;
    if (lastModified) headers.set("Last-Modified", lastModified);
    const probe = url.searchParams.get("$limit") === "1";
    return new Response(JSON.stringify(probe ? [] : options.rows?.[id] ?? []), { status: 200, headers });
  }) as typeof fetch;
}

/** Public FMCSA-style rows for a carrier with active common and broker authority (illustrative values). */
export function motusRows(usdot: string, overrides: Array<Record<string, unknown>> = []) {
  const base = [
    { docket_number: "MC135797", dot_number: usdot, legal_name: "Example Carrier Inc", op_auth_type: "COMMON", op_auth_status: "ACTIVE", min_cov_amount: "750", bipd_file: "5000" },
    { docket_number: "MC135797", dot_number: usdot, legal_name: "Example Carrier Inc", op_auth_type: "CONTRACT", op_auth_status: "INACTIVE", min_cov_amount: "750", bipd_file: "0" },
    { docket_number: "MC999999", dot_number: usdot, legal_name: "Example Carrier Inc", op_auth_type: "BROKER", op_auth_status: "ACTIVE", min_cov_amount: "0", bipd_file: "0" },
  ];
  return overrides.length ? overrides : base;
}
