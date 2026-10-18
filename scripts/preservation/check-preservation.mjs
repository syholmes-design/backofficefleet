// Content preservation check (docs/governance/CONTENT-PRESERVATION-POLICY.md).
//
//   node scripts/preservation/check-preservation.mjs                 check against the manifest
//   node scripts/preservation/check-preservation.mjs --base URL      also check rendered public pages on a running server
//   node scripts/preservation/check-preservation.mjs --update [--base URL]
//                                                                    rewrite the manifest (owner-approved changes only)
//
// Fails when a recovered page loses words or headings, a recovered asset or public route disappears,
// a rendered page loses headings or more than 10% of its words, or superseded wording reappears.
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const MANIFEST = path.join(ROOT, "docs/governance/preservation-manifest.json");
const CONTENT = path.join(ROOT, "content/recovered-site/business-operations");
const args = process.argv.slice(2);
const UPDATE = args.includes("--update");
const BASE = args.includes("--base") ? args[args.indexOf("--base") + 1] : null;

// Public routes whose rendered words and headings are tracked when --base is given.
const RENDERED_ROUTES = [
  "/", "/assessment", "/assessment/for-hire-carriers", "/assessment/private-fleets", "/assessment/government-fleets",
  "/assessment/bof-vault", "/contact", "/fleet-savings", "/how-bof-works", "/what-we-do", "/aggregators", "/company",
  "/for-hire-carriers", "/private-fleets", "/government", "/bof-vault", "/bof-vault/intake", "/documents",
  "/demo/dispatch", "/demo/loads", "/demo/drivers", "/demo/settlements", "/demo/command-center",
  "/customer-portal/load-intake", "/team-briefing", "/founding-fleet", "/qa", "/blog",
];

// Superseded public wording (docs/governance/superseded-decisions.md).
const SUPERSEDED = [/book an? (working session|workflow review|demo)\b/i, /request a working session/i, /\bworking session\b/i];
const SCAN_DIRS = ["app", "components", "lib"];
const SCAN_ALLOW = [/superseded/i];

const textOf = (html) =>
  html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ").replace(/\s+/g, " ").trim();
const wordsOf = (html) => (textOf(html) ? textOf(html).split(" ").length : 0);
const headingsOf = (html) =>
  [...html.matchAll(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => textOf(m[2])).filter(Boolean);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function recoveredSnapshot() {
  const manifest = JSON.parse(readFileSync(path.join(CONTENT, "manifest.json"), "utf8"));
  const pages = {};
  for (const [route, entry] of Object.entries(manifest)) {
    const page = JSON.parse(readFileSync(path.join(CONTENT, `${entry.key}.json`), "utf8"));
    const assets = [...new Set([...page.html.matchAll(/(?:src|href|poster)="(\/recovered-assets\/[^"?#]+)/g)].map((m) => m[1]))].sort();
    pages[route] = { words: wordsOf(page.html), headings: headingsOf(page.html), assets, scripts: page.widgetScripts };
  }
  return pages;
}

function publicRoutes() {
  const routes = new Set();
  for (const base of ["app/(marketing)", "app/assessment", "app/customer-portal", "app/(bof)/demo"]) {
    const dir = path.join(ROOT, base);
    if (!existsSync(dir)) continue;
    for (const file of walk(dir)) {
      if (!file.endsWith("page.tsx")) continue;
      const rel = path.relative(path.join(ROOT, "app"), path.dirname(file)).split(path.sep).filter((s) => !s.startsWith("("));
      routes.add("/" + rel.join("/"));
    }
  }
  return [...routes].sort();
}

async function renderedSnapshot() {
  const out = {};
  for (const route of RENDERED_ROUTES) {
    const res = await fetch(BASE + route, { redirect: "manual" });
    const html = res.status === 200 ? await res.text() : "";
    const main = html.match(/<main[\s\S]*<\/main>/i)?.[0] ?? html;
    out[route] = { status: res.status, words: wordsOf(main), headings: headingsOf(main) };
  }
  return out;
}

function supersededHits() {
  const hits = [];
  for (const dir of SCAN_DIRS) {
    for (const file of walk(path.join(ROOT, dir))) {
      if (!/\.(tsx?|mdx?)$/.test(file) || /\.test\.tsx?$/.test(file)) continue;
      readFileSync(file, "utf8").split("\n").forEach((line, i) => {
        if (SUPERSEDED.some((re) => re.test(line)) && !SCAN_ALLOW.some((re) => re.test(line))) hits.push(`${path.relative(ROOT, file)}:${i + 1}`);
      });
    }
  }
  for (const file of readdirSync(CONTENT)) {
    if (file === "manifest.json") continue;
    const page = JSON.parse(readFileSync(path.join(CONTENT, file), "utf8"));
    const text = textOf(page.html) + " " + page.inlineScripts.join(" ");
    if (SUPERSEDED.some((re) => re.test(text))) hits.push(`content/recovered-site/business-operations/${file}`);
  }
  return hits;
}

const current = { recovered: recoveredSnapshot(), routes: publicRoutes() };
if (BASE) current.rendered = await renderedSnapshot();

if (UPDATE) {
  const previous = existsSync(MANIFEST) ? JSON.parse(readFileSync(MANIFEST, "utf8")) : {};
  const next = { note: "Approved-content baseline. Update only for owner-approved changes (docs/governance/CONTENT-PRESERVATION-POLICY.md).", updated: new Date().toISOString().slice(0, 10), ...current };
  if (!BASE && previous.rendered) next.rendered = previous.rendered;
  writeFileSync(MANIFEST, JSON.stringify(next, null, 1) + "\n");
  console.log(`manifest written: ${Object.keys(next.recovered).length} recovered pages, ${next.routes.length} public routes, ${Object.keys(next.rendered ?? {}).length} rendered pages`);
  process.exit(0);
}

const baseline = JSON.parse(readFileSync(MANIFEST, "utf8"));
const problems = [];
for (const [route, was] of Object.entries(baseline.recovered)) {
  const now = current.recovered[route];
  if (!now) { problems.push(`recovered page removed: ${route}`); continue; }
  if (now.words < was.words * 0.98) problems.push(`recovered page shrank: ${route} (${was.words} -> ${now.words} words)`);
  for (const h of was.headings) if (!now.headings.includes(h)) problems.push(`recovered heading lost: ${route}: "${h.slice(0, 80)}"`);
  for (const a of was.assets) if (!existsSync(path.join(ROOT, "public", a))) problems.push(`recovered asset missing: ${a} (${route})`);
  for (const s of was.scripts ?? []) if (!existsSync(path.join(ROOT, "public", s))) problems.push(`recovered script missing: ${s} (${route})`);
}
for (const route of baseline.routes) if (!current.routes.includes(route)) problems.push(`public route removed: ${route}`);
if (BASE && baseline.rendered) {
  for (const [route, was] of Object.entries(baseline.rendered)) {
    const now = current.rendered[route];
    if (now.status !== was.status) problems.push(`rendered status changed: ${route} (${was.status} -> ${now.status})`);
    if (now.words < was.words * 0.9) problems.push(`rendered page shrank: ${route} (${was.words} -> ${now.words} words)`);
    for (const h of was.headings) if (!now.headings.includes(h)) problems.push(`rendered heading lost: ${route}: "${h.slice(0, 80)}"`);
  }
}
for (const hit of supersededHits()) problems.push(`superseded wording (docs/governance/superseded-decisions.md): ${hit}`);

if (problems.length) {
  console.error(`Preservation check FAILED (${problems.length}):\n  ` + problems.join("\n  "));
  console.error("\nApproved content may not be reduced without owner authorization (docs/governance/CONTENT-PRESERVATION-POLICY.md).");
  process.exit(1);
}
console.log(`Preservation check passed: ${Object.keys(baseline.recovered).length} recovered pages, ${baseline.routes.length} public routes${BASE ? `, ${Object.keys(baseline.rendered ?? {}).length} rendered pages` : ""}, no superseded wording.`);
