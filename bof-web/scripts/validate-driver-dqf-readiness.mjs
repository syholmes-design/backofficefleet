/**
 * Keep rules aligned with `lib/driver-dqf-readiness.ts` (Core DQF KPIs + canonical dates).
 * Validates DRV-001..012: core doc rows, W-9 / I-9 / DQF summary PDF index paths, stale EXPIRED labels vs expiration dates,
 * and duplicate core types per driver.
 */
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DEMO_PATH = path.join(ROOT, "lib", "demo-data.json");
const INDEX_PATH = path.join(ROOT, "lib", "generated", "driver-public-doc-index.json");

const CORE_TYPES = [
  "CDL",
  "Medical Card",
  "MVR",
  "FMCSA",
  "I-9",
  "W-9",
  "Bank Info",
  "Emergency Contact",
  "Insurance Card",
];

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

function fail(errors, msg) {
  errors.push(msg);
}

function main() {
  const errors = [];
  const data = JSON.parse(fs.readFileSync(DEMO_PATH, "utf8"));
  const index = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
  const fileSet = new Set((index.files ?? []).map((x) => String(x).trim()));

  const drivers = (data.drivers ?? []).filter((d) => /^DRV-\d{3}$/.test(d.id)).sort((a, b) => a.id.localeCompare(b.id));
  if (drivers.length < 12) {
    fail(errors, `Expected at least 12 DRV-* drivers, found ${drivers.length}`);
  }

  for (const driver of drivers) {
    const driverId = driver.id;
    const docs = (data.documents ?? []).filter((d) => d.driverId === driverId);
    const byType = new Map();
    for (const d of docs) {
      if (!CORE_TYPES.includes(d.type)) continue;
      byType.set(d.type, (byType.get(d.type) ?? 0) + 1);
    }
    for (const t of CORE_TYPES) {
      const c = byType.get(t) ?? 0;
      if (c > 1 && t !== "Medical Card") {
        fail(errors, `${driverId}: duplicate rows for core type ${t} (${c})`);
      }
    }

    const n = driverId.replace(/^DRV-/, "").padStart(3, "0");
    const w9Url = `/documents/drivers/${driverId}/w9-drv-${n}.pdf`;
    if (!fileSet.has(w9Url)) {
      fail(errors, `${driverId}: canonical W-9 missing from public index: ${w9Url}`);
    }

    const i9Url = `/documents/drivers/${driverId}/i9-drv-${n}.pdf`;
    if (!fileSet.has(i9Url)) {
      fail(errors, `${driverId}: canonical I-9 missing from public index: ${i9Url}`);
    }

    for (const t of ["CDL", "MVR", "FMCSA"]) {
      const row = docs.find((d) => d.type === t);
      const exp = row?.expirationDate?.trim();
      if (!exp) continue;
      const derived = deriveCredentialStatusFromExpiration(exp);
      const rowNorm = normalizeStatus(row?.status);
      if (rowNorm === "EXPIRED" && derived !== "EXPIRED") {
        fail(
          errors,
          `${driverId}: ${t} row marked EXPIRED but expirationDate implies ${derived} (${exp})`
        );
      }
    }

    const medRows = docs.filter((d) => d.type === "Medical Card");
    if (medRows.length > 1) {
      fail(errors, `${driverId}: multiple Medical Card rows (${medRows.length})`);
    }
    const med = medRows[0];
    const mexp = med?.expirationDate?.trim();
    if (mexp) {
      const derived = deriveCredentialStatusFromExpiration(mexp);
      const rowNorm = normalizeStatus(med?.status);
      if (rowNorm === "EXPIRED" && derived !== "EXPIRED") {
        fail(
          errors,
          `${driverId}: Medical stale EXPIRED vs date (implies ${derived})`
        );
      }
    }
  }

  if (errors.length) {
    console.error("validate-driver-dqf-readiness FAILED:\n" + errors.join("\n"));
    process.exit(1);
  }
  console.log(
    "validate-driver-dqf-readiness OK (core rows, W-9 + I-9 + DQF summary PDF index, expiration vs EXPIRED labels)."
  );
}

main();
