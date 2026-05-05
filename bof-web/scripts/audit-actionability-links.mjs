import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const targets = [
  "components/dashboard",
  "components/command-center",
  "components/drivers",
  "components/dispatch",
  "components/loads",
  "components/documents",
  "components/settlements-payroll",
  "components/safety",
];

const bannedUiTerms = [
  /\bP0\b/g,
  /\bP1\b/g,
  /\bP2\b/g,
  /\bView review\b/g,
  /\bMark reviewed for demo\b/g,
  /\bcanonical\b/g,
];

const genericLabelTerms = [/\bOpen\b/g, /\bView\b/g, /\bResolve\b/g];

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fp, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(fp);
  }
  return out;
}

const files = targets.flatMap((t) => walk(path.join(root, t)));
const findings = [];

for (const file of files) {
  const rel = path.relative(root, file);
  const text = fs.readFileSync(file, "utf8");
  for (const rx of bannedUiTerms) {
    const matches = [...text.matchAll(rx)];
    if (matches.length) findings.push({ file: rel, kind: "banned", pattern: rx.source, count: matches.length });
  }
  for (const rx of genericLabelTerms) {
    const matches = [...text.matchAll(rx)];
    if (matches.length) findings.push({ file: rel, kind: "generic-label", pattern: rx.source, count: matches.length });
  }
}

console.log("Actionability link audit");
console.log(`Scanned files: ${files.length}`);
if (!findings.length) {
  console.log("No banned/generic patterns found.");
  process.exit(0);
}

for (const row of findings) {
  console.log(`- ${row.kind}: ${row.file} :: /${row.pattern}/ x${row.count}`);
}

const hardFailures = findings.filter((f) => f.kind === "banned");
if (hardFailures.length) {
  process.exit(1);
}

