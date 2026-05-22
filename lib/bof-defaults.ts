/**
 * Demo / preview defaults. Override with NEXT_PUBLIC_DEFAULT_PREVIEW_DRIVER_ID for local or staging demos.
 * Not a substitute for auth — only drives which driver is highlighted first in marketing or static demos.
 */
export const DEFAULT_PREVIEW_DRIVER_ID =
  process.env.NEXT_PUBLIC_DEFAULT_PREVIEW_DRIVER_ID ?? "DRV-001";

/** First demo load in `lib/demo-data.json` — used when no load is in context (intake inbox, document hub). */
export const DEFAULT_WORKFLOW_LOAD_ID = "L001";
