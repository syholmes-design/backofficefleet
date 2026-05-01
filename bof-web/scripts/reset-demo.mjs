/**
 * BOF Demo Reset — single command for a clean, presentation-ready demo.
 *
 * Order:
 * 1. Snapshot JSON keys not produced by build-demo-data (load proof, settlements, MAR).
 * 2. Patch workbook dispatch columns → rebuild demo-data from main workbook → merge snapshot.
 * 3. Rebuild loads[] from Dispatch_Clean.
 * 4. Clear public/generated/drivers and public/generated/loads, recreate empty dirs.
 * 5. Regenerate driver credential HTML + fileUrl/previewUrl in demo-data.json.
 * 6. Optional: generate-load-evidence.mjs then generate-load-docs.mjs if present.
 *
 * Note: patch-drivers / patch-documents are covered by build-demo-data (Drivers_Clean, Documents_Clean).
 *
 * Run: node scripts/reset-demo.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEMO_PATH = path.join(ROOT, "lib", "demo-data.json");
const XLSX_PATH = path.join(ROOT, "data", "main-source.xlsx");
const GEN_DRIVERS = path.join(ROOT, "public", "generated", "drivers");
const GEN_LOADS = path.join(ROOT, "public", "generated", "loads");

/** Top-level keys build-demo-data.mjs does not emit — keep across Excel rebuild. */
const PRESERVE_KEYS = [
  "loadProofBundles",
  "settlements",
  "moneyAtRiskSummary",
  "moneyAtRisk",
];

const DOC_TYPES = [
  "CDL",
  "Medical Card",
  "MVR",
  "I-9",
  "FMCSA",
  "W-9",
  "Bank Info",
];

function readDemo() {
  if (!fs.existsSync(DEMO_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(DEMO_PATH, "utf8"));
  } catch {
    return null;
  }
}

function snapshotPreserve(demo) {
  if (!demo || typeof demo !== "object") return {};
  const snap = {};
  for (const k of PRESERVE_KEYS) {
    if (Object.prototype.hasOwnProperty.call(demo, k)) snap[k] = demo[k];
  }
  return snap;
}

function mergePreserve(demo, snap) {
  return { ...demo, ...snap };
}

function writeDemo(demo) {
  fs.mkdirSync(path.dirname(DEMO_PATH), { recursive: true });
  fs.writeFileSync(DEMO_PATH, JSON.stringify(demo, null, 2) + "\n", "utf8");
}

function runNodeScript(relPath, label) {
  const scriptPath = path.join(ROOT, relPath);
  if (!fs.existsSync(scriptPath)) {
    console.error(`[reset-demo] Missing script: ${relPath}`);
    process.exit(1);
  }
  console.log(`[reset-demo] ${label}…`);
  const r = spawnSync(process.execPath, [scriptPath], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
  if (r.status !== 0) {
    console.error(`[reset-demo] Failed: ${label} (exit ${r.status})`);
    process.exit(r.status ?? 1);
  }
}

function clearGeneratedSubdir(absDir, label) {
  if (fs.existsSync(absDir)) {
    fs.rmSync(absDir, { recursive: true, force: true });
    console.log(`[reset-demo] Cleared ${label}`);
  }
  fs.mkdirSync(absDir, { recursive: true });
}

function tryRunOptional(relPath, label) {
  const scriptPath = path.join(ROOT, relPath);
  if (!fs.existsSync(scriptPath)) {
    console.log(`[reset-demo] Skip (not found): ${label}`);
    return;
  }
  runNodeScript(relPath, label);
}

function validate() {
  const demo = readDemo();
  if (!demo) throw new Error("demo-data.json missing after reset");

  const drivers = demo.drivers ?? [];
  const loads = demo.loads ?? [];
  const documents = demo.documents ?? [];

  const driverDocs = documents.filter((d) => d.driverId && DOC_TYPES.includes(d.type));
  const expected = drivers.length * DOC_TYPES.length;

  if (driverDocs.length !== expected) {
    throw new Error(
      `Driver document count ${driverDocs.length} !== expected ${expected} (${drivers.length} drivers × ${DOC_TYPES.length} types)`
    );
  }

  for (const d of driverDocs) {
    const u = (d.fileUrl || d.previewUrl || "").trim();
    if (!u || !u.includes(`/generated/drivers/${d.driverId}/`)) {
      throw new Error(
        `Missing generated file URL for ${d.driverId} / ${d.type}`
      );
    }
    const rel = u.replace(/^\//, "");
    const abs = path.join(ROOT, "public", rel);
    if (!fs.existsSync(abs)) {
      throw new Error(`Generated file missing on disk: ${rel}`);
    }
  }

  const loadIds = new Set(loads.map((l) => l.id));
  if (loadIds.size !== loads.length) {
    throw new Error("Duplicate load ids in loads[]");
  }

  const bundles = demo.loadProofBundles;
  if (bundles && typeof bundles === "object") {
    for (const loadId of Object.keys(bundles)) {
      if (!loadIds.has(loadId)) {
        console.warn(
          `[reset-demo] Warning: loadProofBundles has "${loadId}" not in loads[]`
        );
      }
    }
  }

  for (const l of loads) {
    if (!drivers.some((d) => d.id === l.driverId)) {
      throw new Error(`Load ${l.id}: unknown driverId ${l.driverId}`);
    }
  }

  return {
    totalDrivers: drivers.length,
    totalDocs: driverDocs.length,
    totalLoads: loads.length,
  };
}

function main() {
  if (!fs.existsSync(XLSX_PATH)) {
    console.error(`[reset-demo] Missing workbook: ${XLSX_PATH}`);
    process.exit(1);
  }

  const prev = readDemo();
  const snap = snapshotPreserve(prev);
  console.log(
    `[reset-demo] Preserving keys: ${Object.keys(snap).length ? Object.keys(snap).join(", ") : "(none)"}`
  );

  console.log(
    "[reset-demo] patch-drivers / patch-documents → via build:data (Drivers_Clean, Documents_Clean)"
  );

  runNodeScript("scripts/patch-dispatch-clean-columns.mjs", "patch-dispatch (workbook)");
  runNodeScript("scripts/build-demo-data.mjs", "build:data (main workbook → demo-data.json)");

  let demo = readDemo();
  if (!demo) {
    console.error("[reset-demo] demo-data.json missing after build:data");
    process.exit(1);
  }
  demo = mergePreserve(demo, snap);
  writeDemo(demo);
  console.log("[reset-demo] Merged preserved load/settlement/MAR blocks into demo-data.json");

  runNodeScript("scripts/build-dispatch-loads.mjs", "build:loads (Dispatch_Clean → loads[])");

  clearGeneratedSubdir(GEN_DRIVERS, "public/generated/drivers");
  clearGeneratedSubdir(GEN_LOADS, "public/generated/loads");

  runNodeScript("scripts/generate-driver-docs.mjs", "generate:driver-docs (84 HTML + URLs)");

  tryRunOptional("scripts/generate-load-evidence.mjs", "generate-load-evidence");
  tryRunOptional("scripts/generate-load-docs.mjs", "generate-load-docs");

  const stats = validate();

  console.log("");
  console.log("✅ Demo reset complete");
  console.log(`   · total drivers: ${stats.totalDrivers}`);
  console.log(`   · total docs (driver credentials): ${stats.totalDocs}`);
  console.log(`   · total loads: ${stats.totalLoads}`);
}

main();
