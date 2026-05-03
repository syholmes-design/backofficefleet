/**
 * Ensures dashboard / command center / driver review filter compliance incidents via credential reconciliation.
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DEMO_PATH = path.join(ROOT, "lib", "demo-data.json");
const EXEC_PATH = path.join(ROOT, "lib", "executive-layer.ts");
const DASH_PATH = path.join(ROOT, "lib", "dashboard-insights.ts");
const REVIEW_PATH = path.join(ROOT, "lib", "driver-review-explanation.ts");
const RECON_PATH = path.join(ROOT, "lib", "compliance", "credential-incident-reconciliation.ts");

function main() {
  const issues = [];
  const execSrc = fs.readFileSync(EXEC_PATH, "utf8");
  const dashSrc = fs.readFileSync(DASH_PATH, "utf8");
  const reviewSrc = fs.readFileSync(REVIEW_PATH, "utf8");
  const reconSrc = fs.readFileSync(RECON_PATH, "utf8");

  if (!execSrc.includes("reconcileCredentialIncident")) {
    issues.push("executive-layer.ts must reconcile compliance incidents via reconcileCredentialIncident");
  }
  if (!dashSrc.includes("reconcileCredentialIncident")) {
    issues.push("dashboard-insights.ts must filter/count incidents via reconcileCredentialIncident");
  }
  if (!reviewSrc.includes("reconcileCredentialIncident")) {
    issues.push("driver-review-explanation.ts must reconcile credential incidents for the driver drawer");
  }
  if (!reconSrc.includes("getDriverCredentialStatus")) {
    issues.push("credential-incident-reconciliation.ts must call getDriverCredentialStatus");
  }

  JSON.parse(fs.readFileSync(DEMO_PATH, "utf8"));

  if (issues.length) {
    console.error(`validate-dashboard-attention-queue: ${issues.length} issue(s)`);
    for (const i of issues) console.error(`  - ${i}`);
    process.exitCode = 1;
    return;
  }

  console.log("validate-dashboard-attention-queue: OK (credential reconciliation wired for attention surfaces)");
}

main();
