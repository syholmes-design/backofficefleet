/**
 * Static checks: canonical MVR resolver present and seed MVR rows align with expiration-derived truth.
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DEMO_PATH = path.join(ROOT, "lib", "demo-data.json");
const REGISTRY_PATH = path.join(ROOT, "lib", "driver-doc-registry.ts");
const CRED_STATUS_PATH = path.join(ROOT, "lib", "driver-credential-status.ts");

function toDateOnly(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function deriveCredentialStatusFromExpiration(expirationDate) {
  const exp = toDateOnly(expirationDate);
  if (!exp) return "MISSING";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (exp < today) return "EXPIRED";
  const sixtyDays = new Date(today);
  sixtyDays.setDate(today.getDate() + 60);
  if (exp <= sixtyDays) return "EXPIRING_SOON";
  return "VALID";
}

function main() {
  const issues = [];
  const registry = fs.readFileSync(REGISTRY_PATH, "utf8");
  const cred = fs.readFileSync(CRED_STATUS_PATH, "utf8");

  if (!registry.includes("export function getDriverMvrStatus")) {
    issues.push("driver-doc-registry.ts must export getDriverMvrStatus");
  }
  if (!registry.includes("getDriverMvrStatus(data, driverId)")) {
    issues.push("getCanonicalDriverDocuments should resolve MVR via getDriverMvrStatus");
  }
  if (!cred.includes("complianceIncidentSuppressedByCanonicalMvr")) {
    issues.push("driver-credential-status.ts must export complianceIncidentSuppressedByCanonicalMvr");
  }
  if (!cred.includes('slot: "mvr"')) {
    issues.push("driver-credential-status should tag MVR CredentialRecord with slot: \"mvr\"");
  }

  const demo = JSON.parse(fs.readFileSync(DEMO_PATH, "utf8"));
  for (const driver of demo.drivers ?? []) {
    const driverId = driver.id;
    const rows = (demo.documents ?? []).filter(
      (d) => d.driverId === driverId && d.type === "MVR"
    );
    const primary = rows.find((r) => r.docTier === "primary") ?? rows[0];
    const exp = primary?.expirationDate?.trim();
    const derived = deriveCredentialStatusFromExpiration(exp);
    const rowSt = String(primary?.status ?? "").toUpperCase();
    if (exp && derived === "VALID" && rowSt.includes("EXPIRED")) {
      issues.push(
        `${driverId}: MVR documents[].status implies EXPIRED but expirationDate=${exp} derives VALID — canonical resolver must ignore stale status`
      );
    }
  }

  const watchIds = ["DRV-004", "DRV-010"];
  for (const id of watchIds) {
    const rows = (demo.documents ?? []).filter((d) => d.driverId === id && d.type === "MVR");
    const primary = rows.find((r) => r.docTier === "primary") ?? rows[0];
    const exp = primary?.expirationDate?.trim();
    const derived = deriveCredentialStatusFromExpiration(exp);
    if (derived !== "VALID" && derived !== "EXPIRING_SOON") {
      issues.push(`${id}: expected demo MVR expiration to be current or soon; got derived=${derived} exp=${exp}`);
    }
  }

  if (issues.length) {
    console.error(`validate-driver-mvr-status: ${issues.length} issue(s)`);
    for (const i of issues) console.error(`  - ${i}`);
    process.exitCode = 1;
    return;
  }
  console.log("validate-driver-mvr-status: OK (canonical MVR resolver wired)");
}

main();
