/**
 * FMCSA open datasets on data.transportation.gov used for carrier monitoring.
 *
 * Dataset ids were confirmed from official data.transportation.gov URLs on
 * 2026-10-17. Column names were NOT confirmed against columns.json (the
 * build environment cannot reach the site), so every field is read through
 * an alias list. Run `scripts/fmcsa-activation-check.ts <USDOT>` once network
 * access exists; it prints the columns each dataset actually returns.
 *
 * Licensing & Insurance moved to Motus on 2026-05-14. The legacy L&I datasets
 * (ActPendInsur qh9u-swkp, Revocation sa6p-acbp, ...) stopped updating then
 * and must not be used for current authority or insurance.
 */
export type FmcsaDatasetKey = "COMPANY_CENSUS" | "MOTUS_CARRIER" | "MOTUS_CARRIER_DAILY_CHANGES" | "OUT_OF_SERVICE_ORDERS";

export type FmcsaDataset = {
  key: FmcsaDatasetKey;
  id: string;
  name: string;
  refresh: string;
  /** Candidate USDOT column names, tried in order. */
  usdotColumns: string[];
};

export const FMCSA_DATASETS: Record<FmcsaDatasetKey, FmcsaDataset> = {
  COMPANY_CENSUS: {
    key: "COMPANY_CENSUS",
    id: "az4n-8mr2",
    name: "Company Census File",
    refresh: "daily",
    usdotColumns: ["dot_number", "usdot_number"],
  },
  MOTUS_CARRIER: {
    key: "MOTUS_CARRIER",
    id: "inys-ebih",
    name: "Motus Carrier - All With History",
    refresh: "daily",
    usdotColumns: ["usdot_number", "dot_number"],
  },
  MOTUS_CARRIER_DAILY_CHANGES: {
    key: "MOTUS_CARRIER_DAILY_CHANGES",
    id: "nakq-58th",
    name: "Motus Carrier (daily changes)",
    refresh: "daily",
    usdotColumns: ["usdot_number", "dot_number"],
  },
  OUT_OF_SERVICE_ORDERS: {
    key: "OUT_OF_SERVICE_ORDERS",
    id: "p2mt-9ige",
    name: "Out of Service Orders",
    refresh: "daily",
    usdotColumns: ["dot_number", "usdot_number", "usdot"],
  },
};

/**
 * API field-name candidates for each field BOF reads (first present wins).
 * Used only where official column metadata is unavailable and the field does
 * not require metadata confirmation (see DATASET_FIELD_SPECS).
 */
export const COLUMN_ALIASES = {
  usdot: ["dot_number", "usdot_number", "usdot"],
  legalName: ["legal_name", "name_legal"],
  dbaName: ["dba_name", "name_dba"],
  usdotStatus: ["status_code", "usdot_status", "dot_status"],
  powerUnits: ["power_units", "nbr_power_unit", "tot_pwr"],
  drivers: ["total_drivers", "driver_total", "tot_drs"],
  mcs150Date: ["mcs150_date", "mcs_150_date"],
  docketNumber: ["docket_number"],
  opAuthType: ["op_auth_type"],
  opAuthStatus: ["op_auth_status"],
  bipdRequired: ["min_cov_amount"],
  bipdOnFile: ["bipd_file"],
  oosDate: ["oos_date", "out_of_service_date"],
  oosReason: ["oos_reason", "out_of_service_reason"],
  oosStatus: ["status", "oos_status"],
} as const;

/**
 * Official column display names (the "Column Name" FMCSA publishes in each
 * dataset's metadata at /api/views/<id>.json). Matching on these, then using
 * the API field name FMCSA assigns, avoids guessing field names: Socrata API
 * names can differ from display names (one Motus dataset exposes OP_AUTH_TYPE
 * as "mod_col_1").
 *
 * Motus restructured authority data (2026-05-14): one row per operating
 * authority with OP_AUTH_TYPE and OP_AUTH_STATUS, replacing the legacy
 * per-type columns (COMMON_STAT, CONTRACT_STAT, BROKER_STAT). Insurance is
 * MIN_COV_AMOUNT (minimum BI&PD coverage required) and BIPD_FILE (BI&PD
 * coverage on file). Names from the dataset pages on data.transportation.gov;
 * confirmed at runtime against live metadata before use.
 */
export const OFFICIAL_COLUMN_NAMES: Partial<Record<keyof typeof COLUMN_ALIASES, string[]>> = {
  usdot: ["DOT_NUMBER", "USDOT_NUMBER"],
  legalName: ["LEGAL_NAME"],
  dbaName: ["DBA_NAME"],
  usdotStatus: ["STATUS_CODE"],
  powerUnits: ["POWER_UNITS"],
  drivers: ["TOTAL_DRIVERS"],
  mcs150Date: ["MCS150_DATE"],
  docketNumber: ["DOCKET_NUMBER"],
  opAuthType: ["OP_AUTH_TYPE"],
  opAuthStatus: ["OP_AUTH_STATUS"],
  bipdRequired: ["MIN_COV_AMOUNT"],
  bipdOnFile: ["BIPD_FILE"],
  oosDate: ["OOS_DATE"],
  oosReason: ["OOS_REASON"],
  oosStatus: ["STATUS"],
};
