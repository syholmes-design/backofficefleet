import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { findInvalidPcdataInSvgFile } from "./lib/scan-svg-invalid-pcdata.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_PATH = path.join(ROOT, "lib", "demo-data.json");
const PUBLIC_MANIFEST_PATH = path.join(ROOT, "public", "evidence", "loads", "load-evidence-manifest.json");
const LIB_MANIFEST_PATH = path.join(ROOT, "lib", "generated", "load-evidence-manifest.json");
const REQUIRED_KEYS = [
  "cargoPhoto",
  "equipmentPhoto",
  "pickupPhoto",
  "deliveryPhoto",
  "sealPhoto",
  "sealPickupPhoto",
  "sealDeliveryPhoto",
  "emptyTrailerProof",
  "rfidDockProof",
];
const CONDITIONAL_KEYS = [
  "lumperReceipt",
  "damagePhoto",
  "cargoDamagePhoto",
  "damagedPalletPhoto",
  "sealMismatchPhoto",
  "tempCheckPhoto",
  "weightTicketPhoto",
  "detentionProofPhoto",
  "safetyViolationPhoto",
  "claimEvidence",
];
const SOURCE_VALUES = new Set(["real", "ai_generated", "svg_demo", "missing"]);
const SOURCE_SCAN_DIRS = ["components", "app"];

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function toFsPath(publicUrl) {
  return path.join(ROOT, "public", publicUrl.replace(/^\//, ""));
}

function hasLumperIssue(load, settlements) {
  const s = (settlements ?? []).find((row) => row.driverId === load.driverId);
  return /lumper/i.test(String(s?.pendingReason ?? ""));
}

function isConditionalApplicable(load, key, data) {
  const hasClaim = Boolean(
    load.dispatchExceptionFlag || String(load.sealStatus).toUpperCase() === "MISMATCH"
  );
  if (key === "lumperReceipt") return hasLumperIssue(load, data.settlements);
  if (key === "damagePhoto") return hasClaim;
  if (key === "cargoDamagePhoto") return hasClaim;
  if (key === "damagedPalletPhoto") return hasClaim;
  if (key === "sealMismatchPhoto") return String(load.sealStatus).toUpperCase() === "MISMATCH";
  if (key === "tempCheckPhoto") {
    return /reefer|temp|cold/i.test(`${load.commodity || ""} ${load.dispatchOpsNotes || ""}`);
  }
  if (key === "weightTicketPhoto") return Number(load.weight || 0) > 0;
  if (key === "detentionProofPhoto") return /detention|delay|hold/i.test(String(load.dispatchOpsNotes || ""));
  if (key === "safetyViolationPhoto") return /safety/i.test(String(load.dispatchOpsNotes || ""));
  if (key === "claimEvidence") return hasClaim;
  return false;
}

function scanForMockEvidenceReferences() {
  const hits = [];
  function walk(dir) {
    const fullDir = path.join(ROOT, dir);
    if (!fs.existsSync(fullDir)) return;
    for (const ent of fs.readdirSync(fullDir, { withFileTypes: true })) {
      if (ent.name === "node_modules" || ent.name === ".next") continue;
      const nextPath = path.join(fullDir, ent.name);
      if (ent.isDirectory()) {
        walk(path.join(dir, ent.name));
        continue;
      }
      if (!/\.(ts|tsx|js|jsx|json|mjs)$/i.test(ent.name)) continue;
      const body = fs.readFileSync(nextPath, "utf8");
      if (/\/mocks\/mock_/i.test(body)) {
        hits.push(path.relative(ROOT, nextPath).replaceAll("\\", "/"));
      }
    }
  }
  SOURCE_SCAN_DIRS.forEach((dir) => walk(dir));
  return hits;
}

function main() {
  const data = readJson(DATA_PATH);
  const publicManifest = readJson(PUBLIC_MANIFEST_PATH);
  const libManifest = readJson(LIB_MANIFEST_PATH);
  const errors = [];

  if (JSON.stringify(publicManifest) !== JSON.stringify(libManifest)) {
    errors.push("public and lib load-evidence manifests are out of sync");
  }

  for (const load of data.loads ?? []) {
    const loadDir = path.join(ROOT, "public", "evidence", "loads", load.id);
    if (!fs.existsSync(loadDir)) {
      errors.push(`${load.id}: missing evidence folder`);
    }
    const entry = publicManifest[load.id];
    if (!entry) {
      errors.push(`${load.id}: missing manifest entry`);
      continue;
    }

    for (const key of REQUIRED_KEYS) {
      const value = entry[key];
      if (!value || typeof value === "string") {
        errors.push(`${load.id}: required key ${key} missing metadata object`);
        continue;
      }
      if (!value.url) {
        errors.push(`${load.id}: required key ${key} missing URL`);
        continue;
      }
      if (!value.source || !SOURCE_VALUES.has(value.source)) {
        errors.push(`${load.id}: required key ${key} has invalid source`);
      }
      const fp = toFsPath(String(value.url));
      if (!fs.existsSync(fp)) {
        errors.push(`${load.id}: required key ${key} points to missing file ${value.url}`);
      }
    }

    for (const key of CONDITIONAL_KEYS) {
      const value = entry[key];
      const applicable = isConditionalApplicable(load, key, data);
      if (!value || typeof value === "string") {
        errors.push(`${load.id}: conditional key ${key} missing metadata object`);
        continue;
      }
      if (!value.source || !SOURCE_VALUES.has(value.source)) {
        errors.push(`${load.id}: conditional key ${key} has invalid source`);
      }
      if (applicable) {
        if (!value.url) {
          errors.push(`${load.id}: conditional key ${key} is applicable but missing URL`);
        } else {
          const fp = toFsPath(String(value.url));
          if (!fs.existsSync(fp)) {
            errors.push(`${load.id}: conditional key ${key} points to missing file ${value.url}`);
          }
        }
      } else {
        if (value.url) {
          const fp = toFsPath(String(value.url));
          if (!fs.existsSync(fp)) {
            errors.push(`${load.id}: non-applicable key ${key} has broken URL ${value.url}`);
          }
        }
      }
    }
  }

  const mockHits = scanForMockEvidenceReferences();
  if (mockHits.length > 0) {
    errors.push(`Found /mocks/mock_* evidence references: ${mockHits.join(", ")}`);
  }

  function scanManifestSvgPcdata(manifest, label) {
    for (const [loadId, entry] of Object.entries(manifest)) {
      if (!entry || typeof entry !== "object") continue;
      for (const [, value] of Object.entries(entry)) {
        if (!value || typeof value !== "object" || !value.url) continue;
        const url = String(value.url);
        if (!url.toLowerCase().endsWith(".svg")) continue;
        const fp = toFsPath(url);
        if (!fs.existsSync(fp)) continue;
        const bad = findInvalidPcdataInSvgFile(fp);
        if (!bad.ok) {
          errors.push(
            `${label} ${loadId}: SVG ${url} has invalid XML char U+${bad.code.toString(16).toUpperCase()} at line ${bad.line} col ${bad.column}`
          );
        }
      }
    }
  }
  scanManifestSvgPcdata(publicManifest, "public manifest");
  scanManifestSvgPcdata(libManifest, "lib manifest");

  if (errors.length > 0) {
    console.error("validate:load-evidence failed");
    for (const err of errors) console.error(` - ${err}`);
    process.exit(1);
  }

  console.log(`validate:load-evidence passed for ${(data.loads || []).length} loads.`);
}

main();
