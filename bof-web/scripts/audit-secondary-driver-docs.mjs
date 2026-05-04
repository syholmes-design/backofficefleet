import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const mapPath = path.join(root, "public", "generated", "driver-vault-mapping.json");
const outPath = path.join(root, "data", "audit-reports", "bof-secondary-driver-docs-audit.md");

const mapping = JSON.parse(fs.readFileSync(mapPath, "utf8"));

const coreTitles = new Set([
  "CDL",
  "Medical Certification",
  "MVR",
  "I-9",
  "FMCSA Clearinghouse",
  "W-9",
  "Bank Information",
  "Emergency Contact",
]);

const p1SecondaryTitles = new Set([
  "Road Test Certificate",
  "Employment Verification",
  "Prior Employer Inquiry",
  "Incident Reports",
  "Safety Performance History",
]);

function slugForTitle(title) {
  return String(title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function classifyCoreSecondary(title) {
  return coreTitles.has(title) ? "core" : "secondary";
}

function replacementTemplateFor(title) {
  const t = String(title).toLowerCase();
  if (t.includes("road test")) return "road-test-certificate.template.html";
  if (t.includes("employment verification")) return "employment-verification.template.html";
  if (t.includes("prior employer")) return "prior-employer-verification.template.html";
  if (t.includes("incident")) return "incident-report.template.html";
  if (t.includes("safety")) return "safety-policy-acknowledgment.template.html";
  if (t.includes("driver application")) return "driver-application.template.html";
  return `${slugForTitle(title)}.template.html`;
}

function recommendedOutputPath(driverId, title) {
  const t = String(title).toLowerCase();
  if (t.includes("road test")) return `/generated/drivers/${driverId}/road-test-certificate.html`;
  if (t.includes("employment verification")) return `/generated/drivers/${driverId}/employment_verification.html`;
  if (t.includes("prior employer")) return `/generated/drivers/${driverId}/prior_employer_inquiry.html`;
  if (t.includes("incident")) return `/generated/drivers/${driverId}/incident-report.html`;
  if (t.includes("safety")) return `/generated/drivers/${driverId}/safety-acknowledgment.html`;
  return `/generated/drivers/${driverId}/${slugForTitle(title)}.html`;
}

function realismFor(title, exists, relPath, sample) {
  if (!exists) return { rating: "broken/missing", reason: "Linked file is missing on disk." };
  const lower = String(sample || "").toLowerCase();
  if (lower.includes("demo workflow shell") || lower.includes("status: template generated")) {
    return { rating: "unrealistic", reason: "Template shell placeholder language; not a realistic compliance form." };
  }
  if (lower.includes("not a legal filing")) {
    return { rating: "weak", reason: "Explicitly marked as demo shell with minimal legal form structure." };
  }
  if (String(relPath).toLowerCase().endsWith(".png")) {
    return { rating: "weak", reason: "Image artifact without form structure/metadata traceability." };
  }
  if (title === "Road Test Certificate" && lower.includes("certificate of road test")) {
    return { rating: "good", reason: "Realistic compliance-style certificate template with signatures and vault verification." };
  }
  if (coreTitles.has(title)) return { rating: "acceptable", reason: "Core credential doc linked and structurally consistent with current vault." };
  if (title === "Driver Application") return { rating: "acceptable", reason: "Detailed form layout already present; can be refined later." };
  return { rating: "acceptable", reason: "Linked and readable; not a P1 realism blocker." };
}

const rows = [];
const drivers = Object.keys(mapping).sort();
for (const driverId of drivers) {
  const docs = mapping[driverId];
  for (const [title, relWin] of Object.entries(docs)) {
    const rel = String(relWin).replace(/\\/g, "/");
    const full = path.join(root, "public", rel);
    const exists = fs.existsSync(full);
    const ext = path.extname(rel).replace(".", "").toLowerCase() || "unknown";
    let sample = "";
    if (exists && ext === "html") {
      sample = fs.readFileSync(full, "utf8").slice(0, 2200);
    }
    const realism = realismFor(title, exists, rel, sample);
    const coreOrSecondary = classifyCoreSecondary(title);
    let recommendation = "keep";
    if (coreOrSecondary === "secondary" && (realism.rating === "unrealistic" || realism.rating === "weak")) {
      recommendation = "replace";
    }
    if (title === "Unknown") recommendation = "remove_from_vault";
    const priority =
      recommendation === "replace" && p1SecondaryTitles.has(title)
        ? "P1"
        : recommendation === "replace"
          ? "P2"
          : recommendation === "remove_from_vault"
            ? "P2"
            : "P3";

    rows.push({
      driverId,
      title,
      path: `/${rel}`,
      format: ext,
      linkedInVault: "yes",
      coreOrSecondary,
      realism: realism.rating,
      reason: realism.reason,
      replacementTemplate: replacementTemplateFor(title),
      recommendedOutputPath: recommendedOutputPath(driverId, title),
      recommendation,
      priority,
    });
  }
}

const p1 = rows.filter((r) => r.priority === "P1");
const p2 = rows.filter((r) => r.priority === "P2");

function esc(v) {
  return String(v).replace(/\|/g, "\\|");
}

let md = "";
md += "# BOF Secondary Driver Documents Audit\n\n";
md += "This audit inventories linked Driver Vault documents for `DRV-001` through `DRV-012`, classifies core vs secondary scope, and flags unrealistic secondary docs for replacement.\n\n";
md += "## Core Documents Protected\n\n";
md += "- CDL\n- Medical Certification\n- MVR\n- I-9\n- FMCSA Clearinghouse\n- W-9\n- Bank Information\n- Emergency Contact\n\n";
md += "## P1 Replacements (Implemented in next step)\n\n";
for (const r of p1) {
  md += `- \`${r.title}\` across all drivers -> ${r.replacementTemplate} (${r.recommendedOutputPath.replace("/DRV-001/", "/DRV-###/")})\n`;
}
md += "\n## P2/P3 Follow-ups\n\n";
for (const r of p2.slice(0, 6)) {
  md += `- \`${r.driverId}\` \`${r.title}\` (${r.recommendation}) at \`${r.path}\`\n`;
}
md += "\n## Full Inventory\n\n";
md += "| driver ID | document title/type | file path | file format | linked in Driver Vault | core or secondary | realism rating | reason | replacement template type | recommended output path | replace/keep/remove | priority |\n";
md += "|---|---|---|---|---|---|---|---|---|---|---|---|\n";
for (const r of rows.sort((a, b) => `${a.driverId}:${a.title}`.localeCompare(`${b.driverId}:${b.title}`))) {
  md += `| ${esc(r.driverId)} | ${esc(r.title)} | ${esc(r.path)} | ${esc(r.format)} | ${esc(r.linkedInVault)} | ${esc(r.coreOrSecondary)} | ${esc(r.realism)} | ${esc(r.reason)} | ${esc(r.replacementTemplate)} | ${esc(r.recommendedOutputPath)} | ${esc(r.recommendation)} | ${esc(r.priority)} |\n`;
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, md, "utf8");
console.log(`Wrote audit report: ${outPath}`);
