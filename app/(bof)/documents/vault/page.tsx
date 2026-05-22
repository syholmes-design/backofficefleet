/**
 * BOF Route Owner:
 * URL: /documents/vault
 * Type: DRIVER_DOCS
 * Primary component: DriverVaultIndexPage
 * Route map: docs/BOF_ROUTE_MAP.md
 * Edit this file only for route-level layout/wiring.
 */
import Link from "next/link";
import { getBofData } from "@/lib/load-bof-data";
import { getDriverDocumentPacket } from "@/lib/driver-doc-registry";

export const metadata = {
  title: "Driver Document Vault | BOF",
  description:
    "Driver qualification, HR, and payroll document vaults for active fleet drivers.",
};

const CORE_KEYS = ["cdl", "medicalCard", "mvr", "w9", "i9", "emergencyContact"] as const;

function readyCount(driverId: string) {
  const packet = getDriverDocumentPacket(driverId);
  return CORE_KEYS.filter((key) => Boolean(packet[key])).length;
}

export default function DriverVaultIndexPage() {
  const data = getBofData();
  const drivers = [...data.drivers].sort((a, b) => a.id.localeCompare(b.id));

  return (
    <div className="bof-page">
      <header className="bof-oper-hero">
        <p className="bof-kicker">Driver Document Vault</p>
        <h1 className="bof-title">Driver qualification files by driver</h1>
        <p className="bof-lead">
          Open each driver&apos;s vault to review CDL, medical certification, MVR, I-9,
          W-9, emergency contact, bank, insurance, and DQF summary documents from the
          same canonical packet used by the driver portal and dispatch readiness checks.
        </p>
      </header>

      <section className="bof-oper-panel bof-oper-panel-tight" aria-label="Driver vaults">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {drivers.map((driver) => {
            const count = readyCount(driver.id);
            return (
              <Link
                key={driver.id}
                href={`/drivers/${driver.id}/vault`}
                className="rounded-lg border border-slate-700/70 bg-slate-900/70 p-4 transition hover:border-teal-400/70 hover:bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-slate-100">{driver.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{driver.id}</p>
                  </div>
                  <span className="rounded-full bg-teal-500/15 px-3 py-1 text-sm font-semibold text-teal-200">
                    {count}/{CORE_KEYS.length} core
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-300">
                  Open DQF vault, source documents, and driver-specific credential records.
                </p>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
