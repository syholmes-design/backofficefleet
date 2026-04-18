/**
 * Resolves the BOF “main” Excel workbook used by build scripts.
 *
 * Order (no machine-specific paths — repo-relative only):
 * 1. `BOF_MAIN_SOURCE_XLSX` — absolute path, or path relative to the bof-web root (`ROOT`).
 * 2. `public/data/main-source_enhanced_bof_aligned.xlsx` when present (default source of truth).
 * 3. `data/main-source.xlsx` (legacy fallback).
 */
import fs from "fs";
import path from "path";

const ENHANCED_SEGMENTS = ["public", "data", "main-source_enhanced_bof_aligned.xlsx"];
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
  const enhanced = path.join(root, ...ENHANCED_SEGMENTS);
  if (fs.existsSync(enhanced)) return enhanced;
  return path.join(root, ...LEGACY_SEGMENTS);
}
