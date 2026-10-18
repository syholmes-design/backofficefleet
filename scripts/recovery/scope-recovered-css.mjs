// Scopes each historical stylesheet to recovered page content so it cannot
// affect the current site's header, footer or other pages.
//
//   :root / html  -> .bof-legacy
//   body          -> .bof-legacy-body (the element carrying the page's original body classes)
//   main          -> .bof-legacy-main (recovered <main> is rendered as a div inside the site's <main>)
//   everything    -> prefixed with ".bof-legacy "
//
// url(...) references are rewritten to /recovered-assets/<generation>/... and the
// referenced files are copied out of Git history.
//
// Run from the repo root: node scripts/recovery/scope-recovered-css.mjs
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import postcss from "postcss";

const ROOT = process.cwd();
const GENERATIONS = {
  "static-20260729": { commit: "66929e67", root: "Website", sheets: ["/assets/css/styles.css"] },
  "static-20260701": { commit: "46b2c464", root: "Website", sheets: ["/assets/css/styles.css"] },
  "fork-20260819": { commit: "e901e6cb", root: "recovered/fork-restored-20260819", sheets: ["/assets/css/styles.css", "/assets/css/cinematic-site.css"] },
  "static-20260710": { commit: "7333dacf", root: "Website", sheets: ["/assets/css/styles.css"] },
  "static-20260720": { commit: "db03d3be", root: "Website", sheets: ["/assets/css/styles.css"] },
};

function gitShow(commit, file) {
  try {
    return execFileSync("git", ["show", `${commit}:${file}`], { cwd: ROOT, maxBuffer: 64 * 1024 * 1024 });
  } catch {
    return null;
  }
}

function scopeSelector(selector) {
  let s = selector.trim();
  if (!s) return s;
  // :root and html map to the outer wrapper.
  s = s.replace(/^(:root|html)(?=$|[\s.:#[>+~,])/i, ".bof-legacy");
  // body maps to the inner wrapper that carries the original body classes.
  s = s.replace(/(^|[\s>+~])body(?=$|[\s.:#[>+~])/gi, "$1.bof-legacy-body");
  // Recovered <main> is rendered as div.bof-legacy-main (the site layout already provides <main>).
  s = s.replace(/(^|[\s>+~])main(?=$|[\s.:#[>+~])/gi, "$1.bof-legacy-main");
  if (s.startsWith(".bof-legacy") && !s.startsWith(".bof-legacy-body") && !s.startsWith(".bof-legacy-main")) return s;
  return `.bof-legacy ${s}`;
}

function insideKeyframes(node) {
  for (let p = node.parent; p; p = p.parent) {
    if (p.type === "atrule" && /keyframes$/i.test(p.name)) return true;
  }
  return false;
}

// Class names used by the recovered pages of each generation: a stylesheet asset is copied
// only if its rule could match recovered content (other site areas' heroes are not needed).
const CONTENT_DIR = path.join(ROOT, "content", "recovered-site", "business-operations");
const usedClasses = {};
for (const file of readdirSync(CONTENT_DIR)) {
  if (!file.endsWith(".json") || file === "manifest.json") continue;
  const page = JSON.parse(readFileSync(path.join(CONTENT_DIR, file), "utf8"));
  const set = (usedClasses[page.generation] ??= new Set());
  for (const m of page.html.matchAll(/class="([^"]*)"/g)) m[1].split(/\s+/).forEach((c) => c && set.add(c));
  `${page.bodyClass} ${page.mainClass}`.split(/\s+/).forEach((c) => c && set.add(c));
  // Widget scripts (e.g. the interactive demo) build their markup at runtime: count their class names too.
  for (const script of page.widgetScripts) {
    let js = "";
    try {
      js = readFileSync(path.join(ROOT, "public", script), "utf8");
    } catch {
      continue;
    }
    for (const m of js.matchAll(/class=\\?["']([^"'\\]*)/g)) m[1].split(/\s+/).forEach((c) => c && set.add(c));
    for (const m of js.matchAll(/classList\.(?:add|toggle)\(["']([^"']+)["']/g)) set.add(m[1]);
  }
}

function ruleCanMatch(rule, gen) {
  const set = usedClasses[gen] ?? new Set();
  return rule.selectors.some((sel) => {
    const classes = [...sel.matchAll(/\.([A-Za-z0-9_-]+)/g)].map((m) => m[1]).filter((c) => !c.startsWith("bof-legacy"));
    return classes.every((c) => set.has(c));
  });
}

const report = [];
for (const [gen, cfg] of Object.entries(GENERATIONS)) {
  const parts = [];
  const assets = new Set();
  for (const sheet of cfg.sheets) {
    const css = gitShow(cfg.commit, `${cfg.root}${sheet}`);
    if (!css) throw new Error(`missing ${cfg.commit}:${cfg.root}${sheet}`);
    const rootNode = postcss.parse(css.toString("utf8"));
    // View transitions are document-global and cannot be scoped; recovered pages do not need them.
    rootNode.walkAtRules("view-transition", (at) => at.remove());
    rootNode.walkRules((rule) => {
      if (insideKeyframes(rule)) return;
      if (rule.selectors.every((sel) => sel.includes("::view-transition"))) {
        rule.remove();
        return;
      }
      rule.selectors = rule.selectors.map(scopeSelector);
    });
    rootNode.walkDecls((decl) => {
      if (!decl.value.includes("url(")) return;
      const rule = decl.parent;
      const copy = rule?.type !== "rule" || ruleCanMatch(rule, gen);
      decl.value = decl.value.replace(/url\((['"]?)([^'")]+)\1\)/g, (match, quote, url) => {
        if (/^(data:|https?:|#)/i.test(url)) return match;
        const clean = url.split("?")[0].split("#")[0];
        const abs = clean.startsWith("/") ? clean : path.posix.normalize(path.posix.join(path.posix.dirname(sheet), clean));
        if (copy) assets.add(abs);
        return `url(${quote}/recovered-assets/${gen}${abs}${quote})`;
      });
    });
    parts.push(`/* Source: ${cfg.commit}:${cfg.root}${sheet} (scoped to .bof-legacy) */\n${rootNode.toString()}`);
  }
  const outDir = path.join(ROOT, "public", "recovered-assets", gen);
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "scoped.css"), parts.join("\n"));
  let copied = 0;
  const missing = [];
  for (const asset of assets) {
    const data = gitShow(cfg.commit, `${cfg.root}${asset}`);
    if (!data) {
      missing.push(asset);
      continue;
    }
    const dest = path.join(outDir, asset.replace(/^\//, ""));
    mkdirSync(path.dirname(dest), { recursive: true });
    writeFileSync(dest, data);
    copied += 1;
  }
  report.push(`${gen}: ${cfg.sheets.length} stylesheet(s), ${assets.size} url() assets, ${copied} copied, missing: ${missing.join(", ") || "none"}`);
}
console.log(report.join("\n"));
