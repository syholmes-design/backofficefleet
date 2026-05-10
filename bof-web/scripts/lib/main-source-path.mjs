/**
 * Resolves the BOF "main" Excel workbook used by build scripts.
 *
 * Order (no machine-specific paths — repo-relative only):
 * 1. `BOF_MAIN_SOURCE_XLSX` — absolute path, or path relative to the bof-web root (`ROOT`).
 * 2. `public/data/main-source-v2_enhanced_bof_aligned.xlsx` when present (default source of truth).
 * 3. `public/data/main-source_enhanced_bof_aligned.xlsx` (previous version fallback).
 * 4. `data/main-source.xlsx` (legacy fallback).
 */
import fs from "fs";
import path from "path";

const ENHANCED_V2_SEGMENTS = ["public", "data", "main-source-v2_enhanced_bof_aligned.xlsx"];
const ENHANCED_V1_SEGMENTS = ["public", "data", "main-source_enhanced_bof_aligned.xlsx"];
const LEGACY_SEGMENTS = ["data", "main-source.xlsx"];

export function resolveMainSourceXlsxPath(root) {
  const env = String(process.env.BOF_MAIN_SOURCE_XLSX ?? "").trim();
  if (env) {
    const candidate = path.isAbsolute(env) ? env : path.join(root, env);
    if (fs.existsSync(candidate)) return candidate;
    console.warn(
      `[main-source] BOF_MAIN_SOURCE_XLSX set but file not found (${candidate}); using defaults.`
    );
  }
  const enhancedV2 = path.join(root, ...ENHANCED_V2_SEGMENTS);
  if (fs.existsSync(enhancedV2)) return enhancedV2;
  const enhancedV1 = path.join(root, ...ENHANCED_V1_SEGMENTS);
  if (fs.existsSync(enhancedV1)) return enhancedV1;
  return path.join(root, ...LEGACY_SEGMENTS);
}
