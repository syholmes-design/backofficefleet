export const BOF_RUNTIME_BASE_URL = "https://bof-product-runtime.vercel.app";

export const BOF_RUNTIME_LINKS = {
  dashboard: `${BOF_RUNTIME_BASE_URL}/dashboard`,
  dispatch: `${BOF_RUNTIME_BASE_URL}/dispatch`,
  pretrip: `${BOF_RUNTIME_BASE_URL}/pretrip`,
  vault: `${BOF_RUNTIME_BASE_URL}/documents/vault`,
  commandCenter: `${BOF_RUNTIME_BASE_URL}/command-center`,
  portalsDriver: `${BOF_RUNTIME_BASE_URL}/portals/driver`,
} as const;
