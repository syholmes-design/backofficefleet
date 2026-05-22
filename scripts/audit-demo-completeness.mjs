#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const REPORT_PATH = path.join(ROOT, ".codex", "reports", "demo-completion-report.md");
const SCAN_ROOTS = ["app", "components", "lib"].map((rel) => path.join(ROOT, rel));
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".md"]);
const PLACEHOLDER_PATTERNS = [
  { pattern: /\bcoming soon\b/i, label: "Coming soon copy" },
  { pattern: /\bplaceholder\b/i, label: "Placeholder copy" },
  { pattern: /\bTODO\b/i, label: "TODO marker" },
  { pattern: /href\s*=\s*["']#["']/i, label: "Hash href" },
  { pattern: /javascript\s*:/i, label: "javascript: URL" },
  { pattern: />\s*Click here\s*</i, label: "Generic click text" }
];
const DOMAIN_TERMS = [
  "driver",
  "load",
  "dispatch",
  "document",
  "settlement",
  "safety",
  "maintenance",
  "proof",
  "BOL",
  "POD"
];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next"].includes(entry.name)) continue;
      walk(full, out);
    } else if (EXTENSIONS.has(path.extname(entry.name))) {
      out.push(full);
    }
  }
  return out;
}

function rel(file) {
  return path.relative(ROOT, file).replaceAll(path.sep, "/");
}

function lineOf(text, index) {
  return text.slice(0, index).split(/\r?\n/).length;
}

function issuePriority(label) {
  if (label.includes("href") || label.includes("URL")) return "high";
  if (label.includes("TODO") || label.includes("Coming soon")) return "medium";
  return "low";
}

function lineTextAt(text, index) {
  const start = text.lastIndexOf("\n", index - 1) + 1;
  const end = text.indexOf("\n", index);
  return text.slice(start, end === -1 ? text.length : end);
}

function isImplementationPlaceholder(text, index) {
  const line = lineTextAt(text, index);
  const lineStart = text.lastIndexOf("\n", index - 1) + 1;
  const column = index - lineStart;
  const before = line.slice(0, column);
  const after = line.slice(column);
  const normalizedLine = line.trim();

  return [
    /placeholder\s*=\s*$/i.test(before),
    /^placeholder\s*=/i.test(after),
    /\bplaceholder\s*[-:]/i.test(normalizedLine),
    /(?:[A-Za-z0-9_-]+placeholder|placeholder[A-Za-z0-9_-]+)/i.test(normalizedLine),
    /["'`]placeholder["'`]/i.test(normalizedLine),
    /\bplaceholder\s*\??\s*:/i.test(normalizedLine),
    /\.\s*placeholder\b/i.test(normalizedLine),
    /\b(?:if|else if|while|return)\s*\([^)]*\bplaceholder\b/i.test(normalizedLine),
    /\b[A-Za-z0-9_]*Placeholder[A-Za-z0-9_]*\b/.test(normalizedLine),
    /\bplaceholder\}/i.test(normalizedLine)
  ].some(Boolean);
}

const issues = [];
const files = SCAN_ROOTS.flatMap((root) => walk(root));

for (const file of files) {
  let text = "";
  try {
    text = fs.readFileSync(file, "utf8");
  } catch (error) {
    issues.push({
      file: rel(file),
      line: 1,
      label: "Unreadable file",
      priority: "high",
      detail: error.message
    });
    continue;
  }
  for (const { pattern, label } of PLACEHOLDER_PATTERNS) {
    for (const match of text.matchAll(new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`))) {
      const index = match.index ?? 0;
      if (label === "Placeholder copy" && isImplementationPlaceholder(text, index)) {
        continue;
      }
      issues.push({
        file: rel(file),
        line: lineOf(text, index),
        label,
        priority: issuePriority(label),
        detail: match[0].slice(0, 120)
      });
    }
  }
}

const demoDataPath = path.join(ROOT, "lib", "demo-data.json");
let demoDataSummary = "Could not read lib/demo-data.json.";
try {
  const data = JSON.parse(fs.readFileSync(demoDataPath, "utf8"));
  demoDataSummary = [
    `Drivers: ${Array.isArray(data.drivers) ? data.drivers.length : 0}`,
    `Loads: ${Array.isArray(data.loads) ? data.loads.length : 0}`,
    `Documents: ${Array.isArray(data.documents) ? data.documents.length : 0}`,
    `Settlements: ${Array.isArray(data.settlements) ? data.settlements.length : 0}`
  ].join(", ");
} catch (error) {
  issues.push({
    file: "lib/demo-data.json",
    line: 1,
    label: "Demo data unreadable",
    priority: "high",
    detail: error.message
  });
}

const domainHits = new Map(DOMAIN_TERMS.map((term) => [term, 0]));
for (const file of files) {
  const text = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  for (const term of DOMAIN_TERMS) {
    const matches = text.match(new RegExp(`\\b${term}\\b`, "gi"));
    if (matches) domainHits.set(term, (domainHits.get(term) ?? 0) + matches.length);
  }
}

const plain = issues.length
  ? `The static demo scan found ${issues.length} possible unfinished surfaces. Review high-priority link/action findings first, then placeholder copy.`
  : "The static demo scan did not find obvious placeholder copy or inert link patterns.";

const report = [
  "# Demo Completion Report",
  "",
  "## Plain-English Summary",
  plain,
  "",
  "## Demo Data Snapshot",
  demoDataSummary,
  "",
  "## Highest Priority Fixes",
  ...(issues.length
    ? issues
        .sort((a, b) => ["high", "medium", "low"].indexOf(a.priority) - ["high", "medium", "low"].indexOf(b.priority))
        .slice(0, 50)
        .map((issue) => `- ${issue.priority.toUpperCase()}: ${issue.label} in ${issue.file}:${issue.line} (${issue.detail})`)
    : ["- None found by static scan."]),
  "",
  "## Technical Appendix",
  `Files scanned: ${files.length}`,
  `Domain term hits: ${JSON.stringify(Object.fromEntries(domainHits), null, 2)}`,
  ""
].join("\n");

fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
fs.writeFileSync(REPORT_PATH, report);

console.log(report);
if (issues.some((issue) => issue.priority === "high")) {
  process.exitCode = 1;
}
