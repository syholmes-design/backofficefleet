import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const DATA_PATH = path.join(ROOT, "lib", "demo-data.json");
const DRIVER_DOCS_ROOT = path.join(ROOT, "public", "documents", "drivers");
const GENERATED_ROOT = path.join(ROOT, "public", "generated", "drivers");
const CANONICAL_BANK_PATH = path.join(ROOT, "lib", "driver-canonical-bank-cards.json");

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

const WORKFLOW_TYPES = [
  "Driver Application",
  "Safety Acknowledgment",
  "MCSA-5876 (signed PDF)",
  "Driver profile (HTML)",
  "Qualification File",
  "Incident / Accident Report",
  "BOF Medical Summary",
];

const GENERATED_SUMMARIES = ["Emergency Contact Sheet", "Credential Register", "HR Administrative Record"];

function existsPublic(url) {
  if (!url) return false;
  if (url.startsWith("/generated/") && /\.svg(\?|$)/i.test(url)) {
    // BOF generated SVGs are virtualized by /api/bof-generated rewrites.
    return true;
  }
  if (url.startsWith("/documents/")) {
    return fs.existsSync(path.join(ROOT, "public", url.replace(/^\/+/, "")));
  }
  if (url.startsWith("/generated/")) {
    return fs.existsSync(path.join(ROOT, "public", url.replace(/^\/+/, "")));
  }
  return false;
}

function toDateOnly(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function deriveStatus(expirationDate) {
  const exp = toDateOnly(expirationDate);
  if (!exp) return "MISSING";
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (exp < today) return "EXPIRED";
  const sixty = new Date(today);
  sixty.setDate(sixty.getDate() + 60);
  if (exp <= sixty) return "EXPIRING_SOON";
  return "VALID";
}

function main() {
  const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const canonicalBank = JSON.parse(fs.readFileSync(CANONICAL_BANK_PATH, "utf8"));
  const errors = [];

  for (const driver of data.drivers ?? []) {
    const driverId = driver.id;
    const docs = (data.documents ?? []).filter((d) => d.driverId === driverId);
    const byType = new Map(docs.map((d) => [d.type, d]));

    // 1) canonical packet rows exist (core in documents)
    for (const t of CORE_TYPES) {
      const row = byType.get(t);
      if (!row) {
        errors.push(`${driverId}: missing core row ${t}`);
      }
    }

    // 2) no duplicate canonical main types in documents
    const seen = new Set();
    for (const t of CORE_TYPES) {
      if (seen.has(t)) errors.push(`${driverId}: duplicate core canonical type ${t}`);
      seen.add(t);
    }

    // 3) all open URLs point to existing files under public
    for (const row of docs) {
      const url = row.fileUrl || row.previewUrl;
      if (url && !existsPublic(url)) {
        errors.push(`${driverId}: URL missing on disk ${row.type} -> ${url}`);
      }
    }

    // 4) generated summaries reference documented generator outputs
    const expectedGenerated = [
      `/generated/drivers/${driverId}/emergency-contact-sheet.svg`,
      `/generated/drivers/${driverId}/credential-register.svg`,
    ];
    for (const u of expectedGenerated) {
      if (!existsPublic(u)) {
        errors.push(`${driverId}: generated summary missing ${u}`);
      }
    }

    // 5) workflow docs should be present or explicitly missing in documents map
    for (const t of WORKFLOW_TYPES) {
      const row = byType.get(t);
      if (!row) {
        errors.push(`${driverId}: workflow doc missing row ${t}`);
      }
    }

    // 6) no status-only row marked valid without any URL
    for (const row of docs) {
      const status = String(row.status ?? "").toUpperCase();
      if (status === "VALID" && !(row.fileUrl || row.previewUrl)) {
        errors.push(`${driverId}: VALID row without URL ${row.type}`);
      }
    }

    // 7) bank info uses canonical bank-card html path (if mapping exists)
    const expectedBankFile = canonicalBank[driverId];
    if (expectedBankFile) {
      const expectedBankUrl = `/documents/drivers/${driverId}/${expectedBankFile}`;
      if (!existsPublic(expectedBankUrl)) {
        errors.push(`${driverId}: canonical bank file missing ${expectedBankUrl}`);
      }
    }

    // 8) DRV-001–012: W-9 must resolve to canonical public PDF (driverId only; no legacy w9.html)
    const idMatch = /^DRV-(\d{3})$/i.exec(driverId);
    if (idMatch) {
      const n = parseInt(idMatch[1], 10);
      if (n >= 1 && n <= 12) {
        const expectedW9 = `/documents/drivers/${driverId}/w9-${driverId.toLowerCase()}.pdf`;
        const w9Row = byType.get("W-9");
        if (!w9Row) {
          errors.push(`${driverId}: W-9 core row missing`);
        } else {
          const fu = String(w9Row.fileUrl ?? "").trim();
          const pu = String(w9Row.previewUrl ?? "").trim();
          if (fu !== expectedW9) {
            errors.push(`${driverId}: W-9 fileUrl must be ${expectedW9}, got ${fu || "(empty)"}`);
          }
          if (pu && pu !== expectedW9) {
            errors.push(`${driverId}: W-9 previewUrl must match canonical ${expectedW9}, got ${pu}`);
          }
          if (/\/generated\/.*w9\.html/i.test(fu) || /\/generated\/.*w9\.html/i.test(pu)) {
            errors.push(`${driverId}: W-9 must not point at generated w9.html when canonical PDF is required`);
          }
        }
        if (!existsPublic(expectedW9)) {
          errors.push(`${driverId}: canonical W-9 PDF missing on disk ${expectedW9}`);
        }
      }
    }

    // 9) medical card status aligns with expiration
    const med = byType.get("Medical Card");
    if (med) {
      const expectedStatus = deriveStatus(med.expirationDate);
      const actualStatus = String(med.status ?? "").toUpperCase().replace(/\s+/g, "_");
      if (actualStatus !== expectedStatus) {
        errors.push(
          `${driverId}: medical status mismatch status=${med.status} exp=${med.expirationDate} expected=${expectedStatus}`
        );
      }
    }

    // check generated medical html exists
    const medHtml = path.join(GENERATED_ROOT, driverId, "medical-card.html");
    if (!fs.existsSync(medHtml)) {
      errors.push(`${driverId}: missing generated medical-card.html`);
    }
  }

  // requested group declaration check
  if (GENERATED_SUMMARIES.length < 3 || !fs.existsSync(DRIVER_DOCS_ROOT)) {
    errors.push("packet validation prerequisites missing");
  }

  if (errors.length > 0) {
    console.error(`validate-driver-document-packets: ${errors.length} issue(s)`);
    for (const err of errors) console.error(`- ${err}`);
    process.exitCode = 1;
    return;
  }

  console.log("validate-driver-document-packets: OK");
}

main();

