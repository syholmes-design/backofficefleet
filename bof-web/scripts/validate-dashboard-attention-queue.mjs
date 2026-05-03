/**
 * Ensures dashboard / command center reconcile stale MVR compliance incidents with canonical documents.
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DEMO_PATH = path.join(ROOT, "lib", "demo-data.json");
const EXEC_PATH = path.join(ROOT, "lib", "executive-layer.ts");
const DASH_PATH = path.join(ROOT, "lib", "dashboard-insights.ts");
const REVIEW_PATH = path.join(ROOT, "lib", "driver-review-explanation.ts");

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
  const execSrc = fs.readFileSync(EXEC_PATH, "utf8");
  const dashSrc = fs.readFileSync(DASH_PATH, "utf8");
  const reviewSrc = fs.readFileSync(REVIEW_PATH, "utf8");

  if (!execSrc.includes("complianceIncidentSuppressedByCanonicalMvr")) {
    issues.push("executive-layer.ts must suppress stale MVR incidents via complianceIncidentSuppressedByCanonicalMvr");
  }
  if (!execSrc.includes("refineMvrComplianceIncidentPresentation")) {
    issues.push("executive-layer.ts must refine retained MVR incidents with refineMvrComplianceIncidentPresentation");
  }
  if (!dashSrc.includes("countEffectiveOpenComplianceIncidents")) {
    issues.push("dashboard-insights.ts should count effective open compliance incidents after MVR reconciliation");
  }
  if (!reviewSrc.includes("complianceIncidentSuppressedByCanonicalMvr(data, inc)")) {
    issues.push("driver-review-explanation.ts must skip suppressed MVR compliance rows in the driver drawer");
  }

  const demo = JSON.parse(fs.readFileSync(DEMO_PATH, "utf8"));

  const mismatches = [];
  for (const inc of demo.complianceIncidents ?? []) {
    const st = String(inc.status ?? "").toUpperCase();
    if (st === "CLOSED" || st === "RESOLVED") continue;
    const title = String(inc.type ?? "").toLowerCase();
    if (!title.includes("mvr")) continue;
    if (!/\b(review|required|expired|missing|due|stale|qualification)\b/i.test(String(inc.type ?? "")))
      continue;

    const driverId = inc.driverId;
    const rows = (demo.documents ?? []).filter(
      (d) => d.driverId === driverId && d.type === "MVR"
    );
    const primary = rows.find((r) => r.docTier === "primary") ?? rows[0];
    const exp = primary?.expirationDate?.trim();
    const derived = deriveCredentialStatusFromExpiration(exp);

    if (derived === "VALID") {
      mismatches.push({
        incidentId: inc.incidentId,
        driverId,
        type: inc.type,
        detail:
          "OPEN incident implies MVR problem but structured MVR expirationDate derives VALID — must be suppressed in Command Center / review drawer",
      });
    }
  }

  if (mismatches.length && !execSrc.includes("complianceIncidentSuppressedByCanonicalMvr")) {
    issues.push(
      `Seed has ${mismatches.length} stale MVR incident(s) vs canonical VALID — suppression wiring missing`
    );
  }

  if (issues.length) {
    console.error(`validate-dashboard-attention-queue: ${issues.length} issue(s)`);
    for (const i of issues) console.error(`  - ${i}`);
    if (mismatches.length) {
      console.error("  Canonical-vs-incident mismatches (expect runtime suppression):");
      console.error(JSON.stringify(mismatches, null, 2));
    }
    process.exitCode = 1;
    return;
  }

  if (mismatches.length) {
    console.log(
      `validate-dashboard-attention-queue: OK (${mismatches.length} stale MVR OPEN incident(s) in seed are suppressed at runtime)`
    );
  } else {
    console.log("validate-dashboard-attention-queue: OK (attention queue wiring present)");
  }
}

main();
