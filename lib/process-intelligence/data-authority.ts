export const DATA_AUTHORITY = {
  DEMO_DATA: "DEMO_DATA",
  AUTHORITATIVE_PERSISTED_DATA: "AUTHORITATIVE_PERSISTED_DATA",
} as const;

export type DataAuthorityValue = (typeof DATA_AUTHORITY)[keyof typeof DATA_AUTHORITY];
