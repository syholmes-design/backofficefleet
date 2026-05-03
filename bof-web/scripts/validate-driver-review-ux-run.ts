/**
 * Runtime checks: Needs Review rows must have issues + explicit labels;
 * medical/MVR table copy must match canonical credential status.
 */
import raw from "../lib/demo-data.json";
import type { BofData } from "../lib/load-bof-data";
import { getDriverCredentialStatus } from "../lib/driver-credential-status";
import { getDriverReviewExplanation } from "../lib/driver-review-explanation";
import { getDriverTableRowModel } from "../lib/drivers/driver-table-row-model";

const data = raw as unknown as BofData;

const WATCH_IDS = ["DRV-002", "DRV-004", "DRV-005", "DRV-008", "DRV-009", "DRV-012"];

function main() {
  const issues: string[] = [];

  for (const driver of data.drivers ?? []) {
    const driverId = driver.id;
    const row = getDriverTableRowModel(data, driverId);
    const expl = getDriverReviewExplanation(data, driverId);
    const cred = getDriverCredentialStatus(data, driverId);
    const openExpl = expl.issues.filter((i) => !i.resolved);
    const openRow = row.issues.filter((i) => !i.resolved);

    const explIds = openExpl.map((i) => i.id).sort().join("|");
    const rowIds = openRow.map((i) => i.id).sort().join("|");
    if (explIds !== rowIds) {
      issues.push(`${driverId}: table model open issue ids differ from getDriverReviewExplanation`);
    }

    if (row.status === "needs_review") {
      if (openRow.length === 0) {
        issues.push(`${driverId}: status needs_review but zero open issues`);
      }
      if (!String(row.primaryReviewReason ?? "").trim()) {
        issues.push(`${driverId}: needs_review missing primaryReviewReason`);
      }
    }

    const comp = row.complianceLabel.trim();
    const docs = row.documentsLabel.trim();
    if (/^needs review\.?$/i.test(comp)) {
      issues.push(`${driverId}: compliance column is vague "Needs review"`);
    }
    if (/^needs review\.?$/i.test(docs)) {
      issues.push(`${driverId}: documents column is vague "Needs review"`);
    }

    const medicalExpiredLine = /Medical Card expired on (\d{4}-\d{2}-\d{2})/i.exec(row.complianceLabel);
    if (medicalExpiredLine) {
      const d = medicalExpiredLine[1];
      if (cred.medicalCard.status !== "expired" || String(cred.medicalCard.expirationDate ?? "").trim() !== d) {
        issues.push(
          `${driverId}: compliance shows Medical Card expired on ${d} but canonical medical is status=${cred.medicalCard.status} date=${cred.medicalCard.expirationDate ?? ""}`,
        );
      }
    }

    const mvrReviewRequiredCopy =
      /\bMVR review required\b/i.test(row.complianceLabel) || /\bMVR review required\b/i.test(row.documentsLabel);
    if (mvrReviewRequiredCopy) {
      const hasInvestigation = openRow.some((i) =>
        /\binvestigation\b|\bopen findings\b|\bverification\b/i.test(`${i.title} ${i.detail}`),
      );
      if (cred.mvr.status === "valid" && !hasInvestigation) {
        issues.push(
          `${driverId}: "MVR review required" in table but canonical MVR is valid with no investigation-style open issue`,
        );
      }
    }

    const staleMedical =
      /Medical Card expired on 2026-04-22/i.test(row.complianceLabel) ||
      /Medical Card expired on 2026-04-22/i.test(row.documentsLabel) ||
      openRow.some((i) => /Medical Card expired on 2026-04-22/i.test(`${i.title} ${i.detail}`));
    if (staleMedical) {
      const ok =
        cred.medicalCard.status === "expired" && String(cred.medicalCard.expirationDate ?? "").trim() === "2026-04-22";
      if (!ok) {
        issues.push(
          `${driverId}: stale 2026-04-22 medical copy while canonical medical is status=${cred.medicalCard.status} date=${cred.medicalCard.expirationDate ?? ""}`,
        );
      }
    }
  }

  if (issues.length) {
    console.error(`validate-driver-review-ux: ${issues.length} issue(s)`);
    for (const i of issues) console.error(i);
    process.exitCode = 1;
    return;
  }

  console.log("validate-driver-review-ux: OK");
  console.log("\nPhase 7 — six drivers (row model):\n");
  for (const id of WATCH_IDS) {
    const row = getDriverTableRowModel(data, id);
    const cred = getDriverCredentialStatus(data, id);
    const staleMedicalCopy = /Medical Card expired on 2026-04-22/i.test(row.complianceLabel);
    console.log(
      JSON.stringify(
        {
          driverId: id,
          status: row.status,
          dispatchEligibilityLabel: row.dispatchEligibilityLabel,
          complianceLabel: row.complianceLabel,
          documentsLabel: row.documentsLabel,
          primaryReviewReason: row.primaryReviewReason,
          recommendedFix: row.recommendedFix,
          canonicalMedical: { status: cred.medicalCard.status, expirationDate: cred.medicalCard.expirationDate },
          staleMedical20260422InCompliance: staleMedicalCopy,
          medicalSuppressionNote:
            staleMedicalCopy && cred.medicalCard.status !== "expired"
              ? "BUG: stale medical copy vs canonical"
              : cred.medicalCard.status === "valid"
                ? "canonical medical valid — stale medical incident suppressed in issue list"
                : "canonical medical not solely valid — review issue list / labels",
        },
        null,
        2,
      ),
    );
  }
}

main();
