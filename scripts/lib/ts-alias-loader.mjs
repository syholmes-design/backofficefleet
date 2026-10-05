/**
 * Node ESM resolve hook for running repo TypeScript scripts under Node's
 * native type stripping (no tsx, no new packages, no npx).
 *
 *   node --import ./scripts/lib/ts-alias-loader.mjs scripts/<script>.ts
 *
 * - "@/x" -> <repo>/x
 * - extensionless relative / aliased specifiers that resolve inside the repo
 *   try ".ts", ".tsx", "/index.ts" (file: URLs within the repo only).
 * - .ts files inside the repo are tagged "module-typescript" so Node does not
 *   emit MODULE_TYPELESS_PACKAGE_JSON reparse warnings.
 *
 * Hooks are registered from a data: URL so this stays a single file.
 */
import { register } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const repoRootUrl = pathToFileURL(repoRoot + path.sep).href;

const hooksSource = `
import { statSync } from "node:fs";
import { fileURLToPath } from "node:url";

let repoRootUrl = "";
export async function initialize(data) { repoRootUrl = data.repoRootUrl; }

const EXTS = [".ts", ".tsx", "/index.ts"];
function isFile(url) {
  try { return statSync(fileURLToPath(url)).isFile(); } catch { return false; }
}
function hasKnownExt(p) { return /\\.(?:[cm]?[jt]sx?|json|node)$/.test(p); }
function inRepo(url) {
  return typeof url === "string" && url.startsWith(repoRootUrl) && !url.includes("/node_modules/");
}

function tag(result) {
  if (inRepo(result.url) && /\\.ts$/.test(new URL(result.url).pathname)) {
    return { ...result, format: "module-typescript" };
  }
  return result;
}

export async function resolve(specifier, context, nextResolve) {
  let candidate = null;
  if (specifier.startsWith("@/")) {
    candidate = new URL(specifier.slice(2), repoRootUrl).href;
  } else if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    inRepo(context.parentURL)
  ) {
    candidate = new URL(specifier, context.parentURL).href;
  }
  if (candidate && inRepo(candidate) && !isFile(candidate) && !hasKnownExt(candidate)) {
    for (const ext of EXTS) {
      const u = candidate + ext;
      if (isFile(u)) return tag(await nextResolve(u, context));
    }
  }
  return tag(await nextResolve(candidate ?? specifier, context));
}
`;

register("data:text/javascript," + encodeURIComponent(hooksSource), {
  parentURL: import.meta.url,
  data: { repoRootUrl },
});
