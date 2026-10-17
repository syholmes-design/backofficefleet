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

/** Alias lists for the fields BOF reads. First present wins. */
export const COLUMN_ALIASES = {
  usdot: ["dot_number", "usdot_number", "usdot"],
  legalName: ["legal_name", "name_legal"],
  dbaName: ["dba_name", "name_dba"],
  usdotStatus: ["status_code", "usdot_status", "dot_status"],
  powerUnits: ["power_units", "nbr_power_unit", "tot_pwr"],
  drivers: ["total_drivers", "driver_total", "tot_drs"],
  mcs150Date: ["mcs150_date", "mcs_150_date"],
  commonAuthority: ["common_stat", "common_authority_status", "common_status"],
  contractAuthority: ["contract_stat", "contract_authority_status", "contract_status"],
  brokerAuthority: ["broker_stat", "broker_authority_status", "broker_status"],
  bipdRequired: ["bipd_req", "bipd_required", "bipd_required_amount"],
  bipdOnFile: ["bipd_file", "bipd_on_file", "bipd_insurance_on_file"],
  oosDate: ["oos_date", "out_of_service_date"],
  oosReason: ["oos_reason", "out_of_service_reason"],
  oosStatus: ["status", "oos_status"],
} as const;
