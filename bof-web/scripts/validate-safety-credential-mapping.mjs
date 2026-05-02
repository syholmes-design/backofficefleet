import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DEMO_PATH = path.join(ROOT, "lib", "demo-data.json");
const INDEX_PATH = path.join(ROOT, "lib", "generated", "driver-public-doc-index.json");
const SAFETY_SCORECARD_PATH = path.join(ROOT, "lib", "safety-scorecard.ts");
const SAFETY_STORE_PATH = path.join(ROOT, "lib", "stores", "safety-store.ts");
const SAFETY_PROFILE_PATH = path.join(ROOT, "components", "safety", "DriverSafetyProfileScreen.tsx");

function toDateOnly(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function deriveStatus(expirationDate) {
  const exp = toDateOnly(expirationDate);
  if (!exp) return "missing";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (exp < today) return "expired";
  const soon = new Date(today);
  soon.setDate(today.getDate() + 60);
  if (exp <= soon) return "expiring_soon";
  return "valid";
}

function fail(issues, driverId, type, issue, detail) {
  issues.push({ driverId, type, issue, detail });
}

function fileExistsForType(fileSet, driverId, type) {
  const prefixes = {
    CDL: [`/documents/drivers/${driverId}/cdlnew-`],
    "Medical Card": [`/documents/drivers/${driverId}/Medical Card-`],
    MVR: [`/documents/drivers/${driverId}/mvr-card-`],
    FMCSA: [`/documents/drivers/${driverId}/fmcsa-compliance.`],
  };
  return (prefixes[type] ?? []).some((prefix) => {
    for (const f of fileSet) {
      if (f.startsWith(prefix)) return true;
    }
    return false;
  });
}

function main() {
  const issues = [];
  const demo = JSON.parse(fs.readFileSync(DEMO_PATH, "utf8"));
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
  const fileSet = new Set(Array.isArray(index.files) ? index.files : []);

  const scorecardSource = fs.readFileSync(SAFETY_SCORECARD_PATH, "utf8");
  const scorecardIds = [...scorecardSource.matchAll(/driverId:\s*"([^"]+)"/g)].map((m) => m[1]);
  for (const id of scorecardIds) {
    if (!id) fail(issues, id, "row", "missing_driverId", "Safety scorecard row missing driverId");
  }

  const storeSource = fs.readFileSync(SAFETY_STORE_PATH, "utf8");
  const profileSource = fs.readFileSync(SAFETY_PROFILE_PATH, "utf8");

  if (!storeSource.includes("getDriverCredentialStatus(data, d.id)")) {
    fail(
      issues,
      "ALL",
      "store",
      "safety_store_not_using_canonical_helper",
      "hydrateFromBofData should map driver credential dates from canonical helper"
    );
  }

  if (!profileSource.includes("getDriverCredentialStatus(data, driver.driver_id)")) {
    fail(
      issues,
      "ALL",
      "profile",
      "safety_profile_not_using_canonical_helper",
      "Driver safety profile should resolve credentials from canonical helper"
    );
  }

  if (profileSource.includes("Date not on file")) {
    fail(
      issues,
      "ALL",
      "profile",
      "stale_not_on_file_wording_present",
      "Safety profile still renders stale Date not on file wording"
    );
  }

  for (const driver of demo.drivers ?? []) {
    const driverId = driver.id;
    const docs = (demo.documents ?? []).filter((d) => d.driverId === driverId);

    for (const type of ["CDL", "Medical Card", "MVR", "FMCSA"]) {
      const doc = docs.find((d) => d.type === type);
      const exp = doc?.expirationDate?.trim() || "";
      const status = deriveStatus(exp);
      const onFile = fileExistsForType(fileSet, driverId, type);

      if (onFile && !exp && status === "missing") {
        fail(
          issues,
          driverId,
          type,
          "missing_state_with_file_present",
          "Document file exists; state should be pending review, not missing/not on file"
        );
      }

      if (status === "valid" && String(doc?.status ?? "").toUpperCase().includes("EXPIRED")) {
        fail(
          issues,
          driverId,
          type,
          "stale_expired_status",
          `Row status=${doc?.status} but expirationDate=${exp} derives valid`
        );
      }
    }

    const cdl = docs.find((d) => d.type === "CDL")?.expirationDate ?? "";
    const med = docs.find((d) => d.type === "Medical Card")?.expirationDate ?? "";
    const cdlStatus = deriveStatus(cdl);
    const medStatus = deriveStatus(med);
    const blockedByCanonical = cdlStatus === "expired" || medStatus === "expired";
    const staleExpiredFlag =
      String(docs.find((d) => d.type === "CDL")?.status ?? "").toUpperCase().includes("EXPIRED") ||
      String(docs.find((d) => d.type === "Medical Card")?.status ?? "")
        .toUpperCase()
        .includes("EXPIRED");
    if (!blockedByCanonical && staleExpiredFlag) {
      fail(
        issues,
        driverId,
        "dispatch",
        "dispatch_alignment_failed",
        "Dispatch credential block reason is stale-expired while canonical credential status is not expired"
      );
    }
  }

  if (issues.length) {
    console.error(`validate-safety-credential-mapping: ${issues.length} issue(s)`);
    console.error(JSON.stringify(issues, null, 2));
    process.exitCode = 1;
    return;
  }
  console.log("validate-safety-credential-mapping: OK (safety credential mapping aligned)");
}

main();

