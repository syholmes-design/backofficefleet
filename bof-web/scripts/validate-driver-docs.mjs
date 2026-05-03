import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DRIVER_DOCS_ROOT = path.join(ROOT, "public", "documents", "drivers");
const INDEX_PATH = path.join(ROOT, "lib", "generated", "driver-public-doc-index.json");
const CANONICAL_BANK_PATH = path.join(ROOT, "lib", "driver-canonical-bank-cards.json");
const EXT_PRIORITY = [".pdf", ".png", ".jpg", ".jpeg", ".html"];

const REQUIRED = [
  "ec-card-drv-{n}",
  "cdlnew-{n}",
  "icard-drv-{n}",
  "Medical Card-{n}",
  "mvr-card-drv-{n}",
];

function exists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function resolveBase(dir, base) {
  for (const ext of EXT_PRIORITY) {
    const p = path.join(dir, `${base}${ext}`);
    if (exists(p)) return p;
  }
  return null;
}

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exitCode = 1;
}

function run() {
  if (!exists(DRIVER_DOCS_ROOT)) {
    fail("Missing public/documents/drivers root");
    return;
  }

  if (!exists(CANONICAL_BANK_PATH)) {
    fail("Missing lib/driver-canonical-bank-cards.json");
  }
  const canonicalBank = exists(CANONICAL_BANK_PATH)
    ? JSON.parse(fs.readFileSync(CANONICAL_BANK_PATH, "utf8"))
    : {};

  for (let i = 1; i <= 12; i += 1) {
    const n = String(i).padStart(3, "0");
    const driverId = `DRV-${n}`;
    const dir = path.join(DRIVER_DOCS_ROOT, driverId);
    if (!exists(dir)) {
      fail(`Missing folder ${driverId}`);
      continue;
    }
    for (const tpl of REQUIRED) {
      const base = tpl.replace("{n}", n);
      if (!resolveBase(dir, base)) {
        fail(`Missing required doc for ${driverId}: ${base}`);
      }
    }
    const bankFile = canonicalBank[driverId];
    if (!bankFile) {
      fail(`Missing canonical bank-card mapping for ${driverId} in driver-canonical-bank-cards.json`);
    } else if (!exists(path.join(dir, bankFile))) {
      fail(`Missing canonical bank HTML for ${driverId}: ${bankFile}`);
    }
    const w9Base = `w9-drv-${n}`;
    if (!resolveBase(dir, w9Base)) {
      fail(`Missing canonical W-9 PDF for ${driverId}: ${w9Base}.pdf`);
    }
    const i9Base = `i9-drv-${n}`;
    if (!resolveBase(dir, i9Base)) {
      fail(`Missing canonical I-9 PDF for ${driverId}: ${i9Base}.pdf`);
    }
  }

  if (!exists(INDEX_PATH)) {
    fail("Missing lib/generated/driver-public-doc-index.json");
  } else {
    const index = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
    const files = Array.isArray(index.files) ? index.files : [];
    const fileSet = new Set(files);
    for (let i = 1; i <= 12; i += 1) {
      const n = String(i).padStart(3, "0");
      const driverId = `DRV-${n}`;
      const bankFile = canonicalBank[driverId];
      if (bankFile) {
        const expectedUrl = `/documents/drivers/${driverId}/${bankFile}`;
        if (!fileSet.has(expectedUrl)) {
          fail(`Index missing canonical Bank Information URL for ${driverId}: ${expectedUrl}`);
        }
      }
      const w9Url = `/documents/drivers/${driverId}/w9-drv-${n}.pdf`;
      if (!fileSet.has(w9Url)) {
        fail(`Index missing canonical W-9 URL for ${driverId}: ${w9Url}`);
      }
      const i9Url = `/documents/drivers/${driverId}/i9-drv-${n}.pdf`;
      if (!fileSet.has(i9Url)) {
        fail(`Index missing canonical I-9 URL for ${driverId}: ${i9Url}`);
      }
    }
    for (const file of files) {
      if (!file.startsWith("/documents/drivers/")) {
        fail(`Non-driver-doc path in index: ${file}`);
      }
      if (file.includes("/generated/drivers/")) {
        fail(`Generated path should not be in canonical index: ${file}`);
      }
      const m = file.match(/^\/documents\/drivers\/(DRV-\d{3})\//);
      if (!m) fail(`Invalid driver path format: ${file}`);
      if (m) {
        const idInPath = m[1];
        const expectedSuffix = idInPath.replace("DRV-", "");
        const suspicious =
          file.includes("ec-card-drv-") ||
          file.includes("cdlnew-") ||
          file.includes("icard-drv-") ||
          file.includes("Medical Card-") ||
          file.includes("bank-card-drv-") ||
          file.includes("bank-card-DRV-") ||
          file.includes("mvr-card-drv-") ||
          file.includes("i9-drv-");
        if (suspicious && !file.includes(expectedSuffix)) {
          fail(`Driver suffix mismatch in path: ${file}`);
        }
      }
    }
  }

  if (process.exitCode) {
    console.error("Driver docs validation failed.");
  } else {
    console.log("Driver docs validation passed.");
  }
}

run();

