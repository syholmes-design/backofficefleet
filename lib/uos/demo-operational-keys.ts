export const DEMO_SOURCE_REJECTED = "DEMO_SOURCE_REJECTED";

const DEMO_LOAD_KEY = /^L-?\d{1,3}$/i;
const DEMO_TRACTOR_KEY = /^T-\d{2,4}$/i;
const DEMO_TRAILER_KEY = /^TRL-\d+$/i;
const DEMO_DRIVER_KEY = /^DRV[-_]/i;

export function isDemoOperationalKey(value: string | null | undefined): boolean {
  const key = String(value ?? "").trim();
  if (!key) return false;
  return (
    DEMO_LOAD_KEY.test(key) ||
    DEMO_TRACTOR_KEY.test(key) ||
    DEMO_TRAILER_KEY.test(key) ||
    DEMO_DRIVER_KEY.test(key)
  );
}

export function rejectDemoOperationalKey(value: string, fieldName = "identifier"): void {
  if (!isDemoOperationalKey(value)) return;
  throw Object.assign(
    new Error(
      `${DEMO_SOURCE_REJECTED}: ${fieldName} is a DEMO operational key and cannot be used as LIVE authority`,
    ),
    { statusCode: 422, code: DEMO_SOURCE_REJECTED },
  );
}
