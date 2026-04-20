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

export type BofData = typeof raw;

export function getBofData(): BofData {
  return raw;
}
