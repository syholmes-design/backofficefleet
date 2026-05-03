/**
 * Static seed from `demo-data.json` (build-time import). Use for server-only surfaces:
 * `generateStaticParams`, API routes that mirror build output, and the initial seed passed
 * into `BofDemoDataProvider`.
 *
 * Interactive demo UI under `(bof)` should read live rows via `useBofDemoData()` after
 * `BofDemoDataShell` hydrates from localStorage (dashboard, command center, drivers,
 * documents, money at risk, loads, RF actions, settlement drawer proof review, etc.).
 */
import raw from "./demo-data.json";

/** Runtime-only demo dispatch blocker acknowledgements (persisted with demo data in localStorage). */
export type DriverDispatchBlockerOverrideRow = {
  resolvedReasonIds: string[];
  resolvedAt: string;
  resolvedBy: "demo-editor";
  note?: string;
};

export type BofData = typeof raw & {
  driverDispatchBlockerOverrides?: Record<string, DriverDispatchBlockerOverrideRow>;
};

export function getBofData(): BofData {
  return raw;
}
