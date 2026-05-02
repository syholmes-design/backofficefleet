/**
 * One-off / CI helper: print getDriverDispatchEligibility for every driver in demo-data.
 * Run: npx tsx scripts/report-dispatch-eligibility.ts
 */
import { getBofData } from "../lib/load-bof-data";
import { getDriverDispatchEligibility } from "../lib/driver-dispatch-eligibility";

const data = getBofData();
const drivers = [...(data.drivers ?? [])].sort((a, b) => a.id.localeCompare(b.id));

console.log("Dispatch eligibility (demo seed + safety-scorecard rules)\n");

for (const d of drivers) {
  const e = getDriverDispatchEligibility(data, d.id);
  console.log(`${d.id}\t${d.name}\t${e.status}\t${e.label}`);
  if (e.hardBlockers.length) {
    for (const h of e.hardBlockers) console.log(`  hard:\t${h}`);
  }
  if (e.softWarnings.length) {
    for (const s of e.softWarnings) console.log(`  soft:\t${s}`);
  }
  console.log("");
}

const byStatus = { ready: 0, needs_review: 0, blocked: 0 } as Record<string, number>;
for (const d of drivers) {
  const s = getDriverDispatchEligibility(data, d.id).status;
  byStatus[s] = (byStatus[s] ?? 0) + 1;
}
console.log("Summary:", JSON.stringify(byStatus));
