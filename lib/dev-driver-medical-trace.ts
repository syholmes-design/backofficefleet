import type { BofData } from "@/lib/load-bof-data";
import { getDriverDispatchEligibility } from "@/lib/driver-dispatch-eligibility";
import { getDriverMedicalCardStatus } from "@/lib/driver-doc-registry";

/** Development-only: trace canonical medical vs dispatch for DRV-001 … DRV-012. */
export function devTraceDriverMedicalStatuses(data: BofData): void {
  if (process.env.NODE_ENV === "production") return;

  const rows: Record<string, string | number>[] = [];
  for (const driver of data.drivers) {
    const m = /^DRV-(\d+)$/.exec(driver.id);
    if (!m) continue;
    const n = Number.parseInt(m[1], 10);
    if (n < 1 || n > 12) continue;

    const med = getDriverMedicalCardStatus(data, driver.id);
    const elig = getDriverDispatchEligibility(data, driver.id);
    rows.push({
      driverId: driver.id,
      driverName: driver.name,
      medicalStatus: med.status,
      medicalExpiration: med.expirationDate ?? "—",
      source: med.source,
      fileUrl: med.fileUrl ? "yes" : "—",
      medicalHardBlockers: elig.hardBlockers.filter((h) => /medical/i.test(h)).join("; ") || "—",
      medicalSoftWarnings: elig.softWarnings.filter((w) => /medical/i.test(w)).join("; ") || "—",
    });
  }
  console.table(rows);
}
