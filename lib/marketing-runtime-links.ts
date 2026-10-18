export const BOF_RUNTIME_BASE_URL = "";

/**
 * Destinations used by public marketing pages. Anonymous visitors must land on a
 * working public demonstration, never on a LIVE surface that
 * only shows an empty "requires LIVE fleet session" state (/dispatch,
 * /command-center), a 404 (/pretrip has no index route) or a page of
 * realistic driver records (/documents/vault).
 */
export const BOF_RUNTIME_LINKS = {
  dashboard: `${BOF_RUNTIME_BASE_URL}/dashboard`,
  dispatch: `${BOF_RUNTIME_BASE_URL}/demo/dispatch`,
  pretrip: `${BOF_RUNTIME_BASE_URL}/demo/loads`,
  vault: `${BOF_RUNTIME_BASE_URL}/documents`,
  commandCenter: `${BOF_RUNTIME_BASE_URL}/demo/command-center`,
  portalsDriver: `${BOF_RUNTIME_BASE_URL}/portals/driver`,
} as const;
