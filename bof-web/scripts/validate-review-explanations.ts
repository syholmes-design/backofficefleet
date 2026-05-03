/**
 * Validates driver + load review explanations against canonical demo data (no browser).
 * Run: npx tsx scripts/validate-review-explanations.ts
 */
import * as fs from "fs";
import * as path from "path";
import { getBofData } from "../lib/load-bof-data";
import { getDriverDispatchEligibility } from "../lib/driver-dispatch-eligibility";
import { getDriverReviewExplanation } from "../lib/driver-review-explanation";
import { getLoadRiskExplanation } from "../lib/load-risk-explanation";
import { getLoadReviewExplanation } from "../lib/load-review-explanation";

const ROOT = process.cwd();
const SAFE_HREF_PREFIXES = [
  "/drivers/",
  "/loads/",
  "/dispatch",
  "/settlements",
  "/safety",
  "/money-at-risk",
  "/command-center",
  "/documents",
  "/rf-actions",
  "#",
];

function hrefLooksSafe(href: string): boolean {
  const h = href.trim();
  if (h.startsWith("mailto:") || h.startsWith("tel:")) return false;
  return SAFE_HREF_PREFIXES.some((p) => h.startsWith(p));
}

function main() {
  const issues: string[] = [];
  const data = getBofData();

  const riskSrc = fs.readFileSync(path.join(ROOT, "lib", "load-risk-explanation.ts"), "utf8");
  if (riskSrc.includes("driver?.name")) {
    issues.push("load-risk-explanation.ts must not join driver display names into risk detail strings");
  }

  for (const driver of data.drivers) {
    const eligibility = getDriverDispatchEligibility(data, driver.id);
    const expl = getDriverReviewExplanation(data, driver.id);
    if (expl.entityType !== "driver" || expl.entityId !== driver.id || expl.entityLabel !== driver.id) {
      issues.push(`${driver.id}: driver review explanation entity fields must echo driverId`);
    }
    if (eligibility.status === "needs_review" || eligibility.status === "blocked") {
      const open = expl.issues.filter((i) => !i.resolved);
      if (open.length === 0) {
        issues.push(`${driver.id}: dispatch status ${eligibility.status} but zero open review issues`);
      }
    }
    for (const issue of expl.issues) {
      if (!issue.whyItMatters?.trim() || !issue.recommendedFix?.trim()) {
        issues.push(`${driver.id}: issue ${issue.id} missing whyItMatters or recommendedFix`);
      }
      if (issue.actionHref && !hrefLooksSafe(issue.actionHref)) {
        issues.push(`${driver.id}: issue ${issue.id} actionHref may be off-demo-route: ${issue.actionHref}`);
      }
    }
    if (
      (eligibility.status === "needs_review" || eligibility.status === "blocked") &&
      !expl.recommendedNextStepText.trim()
    ) {
      issues.push(`${driver.id}: recommendedNextStepText empty while dispatch not ready`);
    }
  }

  for (const load of data.loads) {
    const risk = getLoadRiskExplanation(data, load.id);
    const review = getLoadReviewExplanation(data, load.id);
    if (review.entityType !== "load" || review.entityId !== load.id) {
      issues.push(`${load.id}: load review explanation entity fields must echo load id`);
    }
    if (risk.riskStatus !== "clean" && review.issues.length === 0) {
      issues.push(`${load.id}: riskStatus ${risk.riskStatus} but zero mapped review issues`);
    }
    for (const issue of review.issues) {
      if (!issue.whyItMatters?.trim() || !issue.recommendedFix?.trim()) {
        issues.push(`${load.id}: issue ${issue.id} missing whyItMatters or recommendedFix`);
      }
      if (issue.actionHref && !hrefLooksSafe(issue.actionHref)) {
        issues.push(`${load.id}: issue ${issue.id} actionHref may be off-demo-route: ${issue.actionHref}`);
      }
    }
    for (const r of risk.reasons) {
      if (!r.whyItMatters?.trim()) {
        issues.push(`${load.id}: raw risk reason ${r.id} missing whyItMatters`);
      }
    }
  }

  const uiScanFiles = [
    "components/drivers/DriverDetailPageClient.tsx",
    "components/drivers/DriversRosterTable.tsx",
    "components/drivers/DriverVaultDqfPageClient.tsx",
    "components/drivers/DriverReviewDrawer.tsx",
    "components/drivers/DriverDocumentPacketSection.tsx",
    "components/dispatch/DispatchBoardScreen.tsx",
    "components/dispatch/LoadDetailContent.tsx",
    "components/dispatch/DocumentationReadinessPanel.tsx",
    "components/dispatch/LoadDocumentsLibraryEnhanced.tsx",
    "components/dispatch/AssignDriverEquipmentModal.tsx",
    "components/LoadsDispatchTable.tsx",
    "components/dashboard/DashboardPageClient.tsx",
    "components/safety/ExpirationsScreen.tsx",
    "components/safety/SafetyCommandEventList.tsx",
    "components/review/ReviewDetailsDrawer.tsx",
    "components/review/LoadReviewDrawer.tsx",
    "components/loads/LoadDetailReviewIsland.tsx",
    "components/LoadProofPanel.tsx",
    "components/settlements-payroll/SettlementDetailDrawer.tsx",
    "components/load-intake/LoadIntakeStep4PacketReview.tsx",
    "components/intake-engine/IntakeEngineInboxClient.tsx",
    "components/intake-engine/DynamicIntakeDispatchPanel.tsx",
    "app/(bof)/drivers/[id]/hr/page.tsx",
  ];
  const needsReviewLabel = /Needs Review|needs review|NEEDS REVIEW|Missing \/ Needs review|Missing \/ Needs Review/i;
  const hasActionCue =
    /View review details|What needs review|driver-review|load-review|LoadReviewDrawer|DriverReviewDrawer|setReviewDrawer|openReviewDrawer|openVaultReview|openFullVaultReview|ReviewDetailsDrawer|ProofGapReviewLinks|DriverHubReviewLink|DriverVaultReviewLink|LoadReviewDeepLink|href=\{`\/intake\/|href=\"\/intake\//;
  for (const rel of uiScanFiles) {
    const p = path.join(ROOT, ...rel.split("/"));
    if (!fs.existsSync(p)) continue;
    const src = fs.readFileSync(p, "utf8");
    if (!needsReviewLabel.test(src)) continue;
    if (!hasActionCue.test(src)) {
      issues.push(`UI scan: ${rel} mentions Needs Review without review action cues`);
    }
  }

  if (issues.length) {
    console.error("validate-review-explanations failed:\n" + issues.join("\n"));
    process.exit(1);
  }
  console.log("validate-review-explanations: OK");
}

main();
