/**
 * Static seed from `demo-data.json` (build-time import). Server metadata and static
 * generation use this. Interactive demo pages should read live rows via
 * `useBofDemoData()` after `BofDemoDataShell` hydrates from localStorage.
 */
import raw from "./demo-data.json";

export type BofData = typeof raw;

export function getBofData(): BofData {
  return raw;
}
