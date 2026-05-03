/**
 * Validates structured demo medical card data vs expiration-derived status,
 * driverMedicalExpanded alignment, and duplicate Medical Card rows.
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DEMO_PATH = path.join(ROOT, "lib", "demo-data.json");
const EXPIRATIONS_SCREEN_PATH = path.join(
  ROOT,
  "components",
  "safety",
  "ExpirationsScreen.tsx"
);
const SAFETY_RULES_PATH = path.join(ROOT, "lib", "safety-rules.ts");

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

function run() {
  const raw = fs.readFileSync(DEMO_PATH, "utf8");
  const data = JSON.parse(raw);
  const mismatches = [];

  const forbiddenSnippet = "2026-04-22";
  const expUi = fs.readFileSync(EXPIRATIONS_SCREEN_PATH, "utf8");
  const safetyRules = fs.readFileSync(SAFETY_RULES_PATH, "utf8");
  if (expUi.includes(forbiddenSnippet)) {
    mismatches.push({
      driverId: "(ui)",
      issue: "hardcoded_medical_expiration_in_expirations_screen",
      detail: "Safety Expirations UI must not embed a fixed medical expiration date string",
    });
  }
  if (safetyRules.includes(forbiddenSnippet)) {
    mismatches.push({
      driverId: "(rules)",
      issue: "hardcoded_medical_expiration_in_safety_rules",
      detail: "lib/safety-rules must not embed a shared medical fallback date",
    });
  }

  const medCounts = new Map();
  for (const doc of data.documents ?? []) {
    if (doc.type !== "Medical Card") continue;
    medCounts.set(doc.driverId, (medCounts.get(doc.driverId) ?? 0) + 1);
  }
  for (const [driverId, count] of medCounts) {
    if (count > 1) {
      mismatches.push({
        driverId,
        issue: "duplicate_medical_card_rows",
        detail: `${count} Medical Card rows (expected at most one canonical primary row)`,
      });
    }
  }

  const medicalExpirations = [];
  for (const driver of data.drivers ?? []) {
    const driverId = driver.id;
    const docs = (data.documents ?? []).filter(
      (d) => d.driverId === driverId && d.type === "Medical Card"
    );
    const primary = docs.find((d) => d.docTier === "primary") ?? docs[0];
    if (!primary?.driverId) {
      mismatches.push({ driverId, issue: "medical_row_missing_driverId" });
    }

    const exp = primary?.expirationDate?.trim();
    if (exp) medicalExpirations.push(exp);
    const derived = deriveCredentialStatusFromExpiration(exp);
    const rowNorm = normalizeStatus(primary?.status);

    if (exp && rowNorm !== normalizeStatus(derived)) {
      mismatches.push({
        driverId,
        issue: "stale_medical_status_field",
        detail: `documents[].status=${primary?.status} but expirationDate=${exp} implies ${derived}`,
      });
    }

    const expanded = data.driverMedicalExpanded?.[driverId];
    if (expanded?.medicalExpirationDate && exp && expanded.medicalExpirationDate !== exp) {
      mismatches.push({
        driverId,
        issue: "expanded_medicalExpirationDate_mismatch",
        detail: `driverMedicalExpanded=${expanded.medicalExpirationDate} vs documents=${exp}`,
      });
    }

    const htmlPath = path.join(
      ROOT,
      "public",
      "generated",
      "drivers",
      driverId,
      "medical-card.html"
    );
    if (fs.existsSync(htmlPath)) {
      const html = fs.readFileSync(htmlPath, "utf8");
      const m = html.match(
        /<tr><td>Medical Card Expiration<\/td><td>(\d{4}-\d{2}-\d{2})<\/td><\/tr>\s*<tr><td>Status<\/td><td>([A-Z_ ]+)<\/td><\/tr>/
      );
      if (!m) {
        mismatches.push({ driverId, issue: "medical_card_html_parse_failed" });
      } else {
        const [, htmlExp, htmlSt] = m;
        if (exp && htmlExp !== exp) {
          mismatches.push({
            driverId,
            issue: "medical_card_html_expiration_mismatch",
            detail: `html=${htmlExp} vs documents=${exp}`,
          });
        }
        const htmlDerived = deriveCredentialStatusFromExpiration(htmlExp);
        if (normalizeStatus(htmlSt) !== normalizeStatus(htmlDerived)) {
          mismatches.push({
            driverId,
            issue: "medical_card_html_status_mismatch",
            detail: `html status=${htmlSt} vs derived from html exp=${htmlDerived}`,
          });
        }
      }
    }

  }

  const uniqMed = new Set(medicalExpirations);
  if (uniqMed.size < 2 && (data.drivers ?? []).length >= 4) {
    mismatches.push({
      driverId: "(fleet)",
      issue: "medical_expiration_not_diverse",
      detail: "All Medical Card expirationDate values are identical — blocker UI cannot vary per driver",
    });
  }

  if (mismatches.length) {
    console.error(`validate-driver-medical-status: ${mismatches.length} issue(s)`);
    console.error(JSON.stringify(mismatches, null, 2));
    process.exitCode = 1;
    return;
  }

  console.log("validate-driver-medical-status: OK (demo medical card data aligned)");
}

run();
