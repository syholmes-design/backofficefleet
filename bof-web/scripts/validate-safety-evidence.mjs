#!/usr/bin/env node
/**
 * Ensures demo safety violation stills under public/evidence/safety exist on disk
 * and that TypeScript + JSON manifests reference only those committed paths.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { findInvalidPcdataInSvgFile, walkSvgFiles } from "./lib/scan-svg-invalid-pcdata.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");

function die(msg) {
  console.error(`[validate-safety-evidence] ${msg}`);
  process.exit(1);
}

function assertFileFromPublicUrl(url) {
  const u = String(url ?? "").trim();
  if (!u.startsWith("/")) die(`URL must be absolute path: ${u}`);
  const disk = path.join(PUBLIC, u.replace(/^\//, ""));
  if (!fs.existsSync(disk)) die(`Missing file for URL ${u} (expected ${disk})`);
  const ext = path.extname(u).toLowerCase();
  if (ext === ".png") {
    const st = fs.statSync(disk);
    if (!st.isFile() || st.size < 256) die(`Safety evidence PNG too small or not a file: ${u}`);
    return;
  }
  if (ext !== ".svg") die(`Safety evidence must be committed .svg or .png under public/evidence/safety: ${u}`);
  const bad = findInvalidPcdataInSvgFile(disk);
  if (!bad.ok) {
    die(
      `Invalid XML control character U+${bad.code.toString(16).toUpperCase()} in ${path.relative(ROOT, disk)} line ${bad.line} column ${bad.column}`
    );
  }
}

const manifestPath = path.join(PUBLIC, "evidence", "safety", "safety-evidence-manifest.json");
if (!fs.existsSync(manifestPath)) die(`Missing ${path.relative(ROOT, manifestPath)}`);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
if (!Array.isArray(manifest.files)) die("safety-evidence-manifest.json must have a files array");
for (const u of manifest.files) {
  assertFileFromPublicUrl(u);
}

const safetyTs = path.join(ROOT, "lib", "safety-evidence.ts");
const src = fs.readFileSync(safetyTs, "utf8");
const urls = [...src.matchAll(/url:\s*"(\/evidence\/safety\/[^"]+)"/g)].map((m) => m[1]);
if (urls.length === 0) die(`No url: "/evidence/safety/..." entries found in ${path.relative(ROOT, safetyTs)}`);
for (const u of urls) {
  assertFileFromPublicUrl(u);
}

const evidenceRoot = path.join(PUBLIC, "evidence");
walkSvgFiles(evidenceRoot, (full) => {
  const bad = findInvalidPcdataInSvgFile(full);
  if (!bad.ok) {
    die(
      `Invalid XML control character U+${bad.code.toString(16).toUpperCase()} in ${path.relative(ROOT, full)} line ${bad.line} column ${bad.column}`
    );
  }
});

const docManifestPaths = [
  path.join(ROOT, "lib", "generated", "load-doc-manifest.json"),
  path.join(ROOT, "public", "generated", "loads", "load-doc-manifest.json"),
];
for (const mp of docManifestPaths) {
  if (!fs.existsSync(mp)) die(`Missing ${path.relative(ROOT, mp)}`);
  const j = JSON.parse(fs.readFileSync(mp, "utf8"));
  for (const [loadId, entry] of Object.entries(j)) {
    const u = entry && entry.safetyViolationPhoto;
    if (typeof u !== "string" || !u.trim()) continue;
    if (!u.startsWith("/evidence/safety/")) {
      die(`${path.relative(ROOT, mp)} ${loadId} safetyViolationPhoto must be under /evidence/safety/: ${u}`);
    }
    assertFileFromPublicUrl(u);
  }
}

console.log("[validate-safety-evidence] OK — all safety evidence URLs resolve to committed public files.");
