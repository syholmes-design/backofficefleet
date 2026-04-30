import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const PUBLIC_ROOT = path.join(ROOT, "public");
const DRIVER_DOCS_ROOT = path.join(PUBLIC_ROOT, "documents", "drivers");
const GENERATED_ROOT = path.join(PUBLIC_ROOT, "generated", "drivers");
const REFERENCE_EC_ROOT = path.join(PUBLIC_ROOT, "reference", "emergency-contacts");
const DOWNLOADS_ROOT = path.join(process.env.USERPROFILE || "", "Downloads");
const INDEX_OUT = path.join(ROOT, "lib", "generated", "driver-public-doc-index.json");

const EXT_PRIORITY = [".pdf", ".png", ".jpg", ".jpeg", ".html"];

const DOC_SPECS = [
  { type: "Emergency Contact", base: (n) => `ec-card-drv-${n}` },
  { type: "CDL", base: (n) => `cdlnew-${n}` },
  { type: "Insurance Card", base: (n) => `icard-drv-${n}` },
  { type: "Medical Card", base: (n) => `Medical Card-${n}` },
  { type: "Bank Information", base: (n) => `bank-card-drv-${n}` },
  { type: "MVR", base: (n) => `mvr-card-drv-${n}` },
  { type: "I-9", base: () => "i9" },
  { type: "W-9", base: () => "w9" },
  { type: "FMCSA Compliance", base: () => "fmcsa-compliance" },
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
    "I-9": [path.join(gen, "i9.html"), path.join(gen, "i-9.html")],
    "W-9": [path.join(gen, "w9.html"), path.join(gen, "w-9.html")],
    "FMCSA Compliance": [
      path.join(gen, "fmcsa-compliance.html"),
      path.join(gen, "fmcsa.html"),
      path.join(gen, "fmcsa_clearinghouse.html"),
      path.join(gen, "mcsa-5876-signed.html"),
      path.join(gen, "mcsa-5875.html"),
    ],
  };
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
      const baseAbs = path.join(dir, spec.base(suffix3));
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
  }

  ensureDir(path.dirname(INDEX_OUT));
  fs.writeFileSync(INDEX_OUT, JSON.stringify(index, null, 2));
  console.log(`Synced HR docs and wrote ${path.relative(ROOT, INDEX_OUT)}`);
}

run();

