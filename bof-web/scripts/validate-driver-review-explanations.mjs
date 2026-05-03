/**
 * Static + seed checks: driver review narrative stays aligned with canonical medical resolver.
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DEMO_PATH = path.join(ROOT, "lib", "demo-data.json");

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

function normalizeStatus(s) {
  return String(s ?? "MISSING")
    .toUpperCase()
    .trim()
    .replace(/\s+/g, "_");
}

function primaryMedical(data, driverId) {
  const docs = (data.documents ?? []).filter((d) => d.driverId === driverId && d.type === "Medical Card");
  return docs.find((d) => d.docTier === "primary") ?? docs[0];
}

function run() {
  const issues = [];

  const reviewPath = path.join(ROOT, "lib", "driver-review-explanation.ts");
  const review = fs.readFileSync(reviewPath, "utf8");
  if (!review.includes("getDriverMedicalCardStatus")) {
    issues.push("driver-review-explanation.ts must import getDriverMedicalCardStatus");
  }
  if (!review.includes("DISPATCH_BLOCKER_REASON_IDS.medical_card_expired")) {
    issues.push(
      "driver-review-explanation.ts must suppress stale medical_card_expired hard blockers using DISPATCH_BLOCKER_REASON_IDS",
    );
  }
  if (!review.includes("resolveComplianceColumnLabelFromCanonical")) {
    issues.push("driver-review-explanation.ts must derive compliance column labels from canonical medical status");
  }

  const ctxPath = path.join(ROOT, "lib", "bof-demo-data-context.tsx");
  const ctx = fs.readFileSync(ctxPath, "utf8");
  if (!ctx.includes("migrateLegacySharedMedicalExpiration")) {
    issues.push("bof-demo-data-context.tsx must run migrateLegacySharedMedicalExpiration on hydrate");
  }
  if (!ctx.includes("BOF_DEMO_DATA_STORAGE_KEY")) {
    issues.push("bof-demo-data-context.tsx must persist demo JSON under BOF_DEMO_DATA_STORAGE_KEY");
  }

  const data = JSON.parse(fs.readFileSync(DEMO_PATH, "utf8"));

  for (const driver of data.drivers ?? []) {
    const driverId = driver.id;
    const primary = primaryMedical(data, driverId);
    const exp = primary?.expirationDate?.trim();
    const derived = deriveCredentialStatusFromExpiration(exp);
    const rowNorm = normalizeStatus(primary?.status);
    if (exp && derived === "VALID" && rowNorm === "EXPIRED") {
      issues.push(
        `${driverId}: stale Medical Card documents[].status=EXPIRED while expirationDate implies VALID — roster may mis-label until row.status is fixed`,
      );
    }
    if (exp && derived === "EXPIRED" && rowNorm === "VALID") {
      issues.push(
        `${driverId}: stale Medical Card documents[].status=VALID while expirationDate implies EXPIRED`,
      );
    }
  }

  if (issues.length) {
    console.error(`validate-driver-review-explanations: ${issues.length} issue(s)`);
    for (const i of issues) console.error(i);
    process.exitCode = 1;
    return;
  }
  console.log("validate-driver-review-explanations: OK");
}

run();
