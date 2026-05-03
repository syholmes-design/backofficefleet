import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const PUBLIC_ROOT = path.join(ROOT, "public");
const DRIVER_DOCS_ROOT = path.join(PUBLIC_ROOT, "documents", "drivers");
const GENERATED_ROOT = path.join(PUBLIC_ROOT, "generated", "drivers");
const REFERENCE_EC_ROOT = path.join(PUBLIC_ROOT, "reference", "emergency-contacts");
const DOWNLOADS_ROOT = path.join(process.env.USERPROFILE || "", "Downloads");
const INDEX_OUT = path.join(ROOT, "lib", "generated", "driver-public-doc-index.json");
const MANIFEST_LIB = path.join(ROOT, "lib", "generated", "driver-doc-manifest.json");
const MANIFEST_PUBLIC = path.join(ROOT, "public", "generated", "drivers", "driver-doc-manifest.json");
const CANONICAL_BANK_PATH = path.join(ROOT, "lib", "driver-canonical-bank-cards.json");
const CANONICAL_BANK = JSON.parse(fs.readFileSync(CANONICAL_BANK_PATH, "utf8"));

const EXT_PRIORITY = [".pdf", ".png", ".jpg", ".jpeg", ".html"];

const DOC_SPECS = [
  { type: "Emergency Contact", base: (n) => `ec-card-drv-${n}` },
  { type: "CDL", base: (n) => `cdlnew-${n}` },
  { type: "Insurance Card", base: (n) => `icard-drv-${n}` },
  { type: "Medical Card", base: (n) => `Medical Card-${n}` },
  {
    type: "Bank Information",
    base: (n, driverId) => {
      const fn = CANONICAL_BANK[driverId];
      if (fn) return fn.replace(/\.html$/i, "");
      return `bank-card-drv-${n}`;
    },
  },
  { type: "MVR", base: (n) => `mvr-card-drv-${n}` },
  /** Canonical I-9: /documents/drivers/{id}/i9-drv-xxx.pdf (driverId-keyed; never generated HTML when PDF exists). */
  { type: "I-9", base: (_n, driverId) => `i9-${driverId.toLowerCase()}` },
  /** Canonical W-9: /documents/drivers/{id}/w9-{idLower}.pdf — keyed by driverId only. */
  { type: "W-9", base: (_n, driverId) => `w9-${driverId.toLowerCase()}` },
  { type: "FMCSA Compliance", base: () => "fmcsa-compliance" },
  /** Canonical FMCSA DQF Compliance Summary PDF — driverId-keyed basename (dqf-compliance-summary-drv-009). */
  {
    type: "FMCSA DQF Compliance Summary",
    base: (_n, driverId) => `dqf-compliance-summary-${driverId.toLowerCase()}`,
  },
];

function exists(p) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function toPublicUrl(absPath) {
  const rel = path.relative(PUBLIC_ROOT, absPath).replace(/\\/g, "/");
  return `/${rel}`;
}

function pickExisting(files) {
  for (const f of files) {
    if (exists(f)) return f;
  }
  return null;
}

function firstByExt(baseAbs) {
  for (const ext of EXT_PRIORITY) {
    const p = `${baseAbs}${ext}`;
    if (exists(p)) return p;
  }
  return null;
}

function copyWithOriginalExt(srcAbs, targetBaseAbs) {
  if (!srcAbs) return null;
  const ext = path.extname(srcAbs);
  const out = `${targetBaseAbs}${ext}`;
  fs.copyFileSync(srcAbs, out);
  return out;
}

function w9DownloadCandidates(driverId) {
  if (!exists(DOWNLOADS_ROOT)) return [];
  const prefix = `W9_${driverId}_`.toLowerCase();
  return fs
    .readdirSync(DOWNLOADS_ROOT)
    .filter(
      (f) =>
        f.toLowerCase().startsWith(prefix) &&
        f.toLowerCase().endsWith(".pdf") &&
        !f.includes("(1)")
    )
    .map((f) => path.join(DOWNLOADS_ROOT, f));
}

/** Newest first — pattern I9-DRV-001_*.pdf (case-insensitive). Duplicate downloads → pick latest mtime. */
function i9DownloadCandidates(driverId) {
  if (!exists(DOWNLOADS_ROOT)) return [];
  const idLower = driverId.toLowerCase();
  const wantPrefix = `i9-${idLower}_`;
  const matches = [];
  for (const f of fs.readdirSync(DOWNLOADS_ROOT)) {
    const lower = f.toLowerCase();
    if (!lower.endsWith(".pdf")) continue;
    if (!lower.startsWith(wantPrefix)) continue;
    const abs = path.join(DOWNLOADS_ROOT, f);
    try {
      matches.push({ abs, mtime: fs.statSync(abs).mtimeMs });
    } catch {
      /* skip */
    }
  }
  matches.sort((a, b) => b.mtime - a.mtime);
  return matches.map((m) => m.abs);
}

/** Pattern DQF_DRV-009_*.pdf anywhere under Downloads — newest first for duplicates. */
function dqfDownloadCandidates(driverId) {
  if (!exists(DOWNLOADS_ROOT)) return [];
  const wantPrefix = `DQF_${driverId}_`.toLowerCase();
  const matches = [];
  function walk(dir) {
    let ents;
    try {
      ents = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of ents) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(full);
      else if (ent.isFile()) {
        const lower = ent.name.toLowerCase();
        if (!lower.endsWith(".pdf")) continue;
        if (!lower.startsWith(wantPrefix)) continue;
        try {
          matches.push({ abs: full, mtime: fs.statSync(full).mtimeMs });
        } catch {
          /* skip */
        }
      }
    }
  }
  walk(DOWNLOADS_ROOT);
  matches.sort((a, b) => b.mtime - a.mtime);
  return matches.map((m) => m.abs);
}

function buildCandidates(driverId, suffix3) {
  const dir = path.join(DRIVER_DOCS_ROOT, driverId);
  const gen = path.join(GENERATED_ROOT, driverId);
  const ecFromReference =
    exists(REFERENCE_EC_ROOT) &&
    fs
      .readdirSync(REFERENCE_EC_ROOT)
      .find((f) => f.toLowerCase().startsWith(`ec-card-${driverId.toLowerCase()}-`));

  return {
    "Emergency Contact": [
      ...EXT_PRIORITY.map((ext) =>
        path.join(DOWNLOADS_ROOT, `ec-card-drv-${suffix3}${ext}`)
      ),
      ecFromReference ? path.join(REFERENCE_EC_ROOT, ecFromReference) : null,
      path.join(gen, "emergency-contact.html"),
      path.join(gen, "emergency_contact.html"),
    ].filter(Boolean),
    CDL: [
      ...EXT_PRIORITY.map((ext) => path.join(DOWNLOADS_ROOT, `cdlnew-${suffix3}${ext}`)),
      path.join(dir, "cdl.png"),
      path.join(gen, "cdl.html"),
    ],
    "Insurance Card": [
      ...EXT_PRIORITY.map((ext) =>
        path.join(DOWNLOADS_ROOT, `icard-drv-${suffix3}${ext}`)
      ),
      path.join(dir, "insurance-card.png"),
      path.join(gen, "insurance-card.html"),
    ],
    "Medical Card": [
      ...EXT_PRIORITY.map((ext) =>
        path.join(DOWNLOADS_ROOT, `Medical Card-${suffix3}${ext}`)
      ),
      path.join(dir, "john-carter-mcsa-5876-signed.pdf"),
      path.join(gen, "medical-card.html"),
      path.join(gen, "medical_card.html"),
      path.join(gen, "medical_certification.html"),
    ],
    "Bank Information": [
      path.join(dir, `bank-card-drv-${suffix3}.html`),
      ...EXT_PRIORITY.map((ext) =>
        path.join(DOWNLOADS_ROOT, `bank-card-drv-${suffix3}${ext}`)
      ),
      path.join(gen, "bank-info.html"),
      path.join(gen, "bank-information.html"),
      path.join(gen, "bank_information.html"),
    ],
    MVR: [
      ...EXT_PRIORITY.map((ext) =>
        path.join(DOWNLOADS_ROOT, `mvr-card-drv-${suffix3}${ext}`)
      ),
      path.join(dir, "mvr-card.html"),
      path.join(gen, "mvr.html"),
    ],
    "I-9": [...i9DownloadCandidates(driverId)],
    "W-9": [
      path.join(dir, `w9-${driverId.toLowerCase()}.pdf`),
      ...w9DownloadCandidates(driverId),
      path.join(gen, "w9.html"),
      path.join(gen, "w-9.html"),
    ],
    "FMCSA Compliance": [
      path.join(gen, "fmcsa-compliance.html"),
      path.join(gen, "fmcsa.html"),
      path.join(gen, "fmcsa_clearinghouse.html"),
      path.join(gen, "mcsa-5876-signed.html"),
      path.join(gen, "mcsa-5875.html"),
    ],
    "FMCSA DQF Compliance Summary": [
      path.join(dir, `dqf-compliance-summary-drv-${suffix3}.pdf`),
      ...dqfDownloadCandidates(driverId),
    ],
  };
}

function patchManifestDqfComplianceSummaries() {
  for (const manifestPath of [MANIFEST_LIB, MANIFEST_PUBLIC]) {
    if (!exists(manifestPath)) continue;
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    for (let i = 1; i <= 12; i += 1) {
      const suffix3 = String(i).padStart(3, "0");
      const id = `DRV-${suffix3}`;
      manifest[id] = {
        ...(manifest[id] ?? {}),
        dqfComplianceSummary: `/documents/drivers/${id}/dqf-compliance-summary-drv-${suffix3}.pdf`,
      };
    }
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }
}

function run() {
  ensureDir(DRIVER_DOCS_ROOT);
  const index = { generatedAt: new Date().toISOString(), files: [] };

  for (let i = 1; i <= 12; i += 1) {
    const suffix3 = String(i).padStart(3, "0");
    const driverId = `DRV-${suffix3}`;
    const dir = path.join(DRIVER_DOCS_ROOT, driverId);
    ensureDir(dir);
    const candidates = buildCandidates(driverId, suffix3);

    for (const spec of DOC_SPECS) {
      const baseFn = spec.base;
      const baseRel =
        spec.type === "Bank Information" ||
        spec.type === "W-9" ||
        spec.type === "I-9" ||
        spec.type === "FMCSA DQF Compliance Summary"
          ? baseFn(suffix3, driverId)
          : baseFn(suffix3);
      const baseAbs = path.join(dir, baseRel);
      const already = firstByExt(baseAbs);
      if (!already) {
        const src = pickExisting(candidates[spec.type] ?? []);
        copyWithOriginalExt(src, baseAbs);
      }
      const resolved = firstByExt(baseAbs);
      if (resolved) {
        index.files.push(toPublicUrl(resolved));
      }
    }

    const legacyBankAbs = firstByExt(path.join(dir, `bank-card-drv-${suffix3}`));
    if (legacyBankAbs) {
      const u = toPublicUrl(legacyBankAbs);
      if (!index.files.includes(u)) index.files.push(u);
    }
  }

  index.files = [...new Set(index.files)].sort();

  ensureDir(path.dirname(INDEX_OUT));
  fs.writeFileSync(INDEX_OUT, JSON.stringify(index, null, 2));
  patchManifestDqfComplianceSummaries();
  console.log(`Synced HR docs and wrote ${path.relative(ROOT, INDEX_OUT)}`);
}

run();

