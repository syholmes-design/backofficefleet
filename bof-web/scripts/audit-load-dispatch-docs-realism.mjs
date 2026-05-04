import fs from "node:fs";
import path from "node:path";
import demoData from "../lib/demo-data.json" with { type: "json" };

const ROOT = process.cwd();
const LOAD_IDS = Array.from({ length: 12 }, (_, i) => `L${String(i + 1).padStart(3, "0")}`);
const OUT_PATH = path.join(
  ROOT,
  "data",
  "audit-reports",
  "bof-load-dispatch-docs-realism-audit.md"
);

const loadManifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, "public", "generated", "loads", "load-doc-manifest.json"), "utf8")
);
const operatingManifest = JSON.parse(
  fs.readFileSync(path.join(ROOT, "public", "generated", "operating-doc-manifest.json"), "utf8")
);
const evidenceManifest = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "public", "evidence", "loads", "load-evidence-manifest.json"),
    "utf8"
  )
);

const CORE_TYPES = new Set([
  "rate confirmation",
  "bill of lading / bol",
  "proof of delivery / pod",
  "work order / dispatch sheet / load assignment",
  "invoice",
  "shipper packet / trip packet",
]);

const CONDITIONAL_TYPES = new Set([
  "lumper receipt",
  "lumper reimbursement support",
  "detention support",
  "seal verification / seal discrepancy report",
  "claim intake / insurance claim form",
  "claim packet",
  "damage photo packet",
  "insurance notification / notice to insurance carrier",
  "accident report",
  "incident report",
  "driver statement",
  "photo evidence log",
  "settlement summary",
  "settlement hold notice",
  "billing packet",
  "factoring notification",
  "factoring submission cover",
  "invoice assignment notice",
  "customer billing dispute letter",
]);

const DOC_KEY_TO_TYPE = {
  rateConfirmation: "Rate Confirmation",
  bol: "Bill of Lading / BOL",
  pod: "Proof of Delivery / POD",
  invoice: "Invoice",
  workOrder: "Work Order / Dispatch Sheet / Load Assignment",
  shipperPacket: "Shipper Packet / Trip Packet",
  masterAgreementReference: "Master Agreement Reference",
  sealVerification: "Seal Verification / Seal Discrepancy Report",
  rfidProof: "RFID / Dock Validation Record",
  claimIntake: "Claim Intake / Insurance Claim Form",
  insuranceNotification: "Insurance Notification / Notice to Insurance Carrier",
  factoringNotification: "Factoring Notification",
  settlementHoldNotice: "Settlement Hold Notice",
  damagePhotoPacket: "Damage Photo Packet",
  claimPacket: "Claim Packet",
  lumperReceipt: "Lumper Receipt",
  accidentReport: "Accident Report",
  incidentReport: "Incident Report",
  driverStatement: "Driver Statement",
  photoEvidenceLog: "Photo Evidence Log",
  settlementSummary: "Settlement Summary",
  lumperReimbursementSupport: "Lumper Reimbursement Support",
  factoringSubmissionCover: "Factoring Submission Cover",
  billingPacket: "Billing Packet",
  insurancePacket: "Insurance Notification / Notice to Insurance Carrier",
  claimPacketBundle: "Claim Packet",
};

const TRIP_PACKET_DOC_KEYS = new Set([
  "rateConfirmation",
  "workOrder",
  "bol",
  "pod",
  "invoice",
  "claimIntake",
  "claimPacket",
  "damagePhotoPacket",
  "insuranceNotification",
  "settlementHoldNotice",
  "factoringNotification",
  "masterAgreementReference",
]);

function normPath(p) {
  const out = String(p || "").trim();
  if (!out) return "";
  return out.startsWith("/") ? out : `/${out}`;
}

function inferDocTypeFromSlug(slug) {
  const words = slug
    .replace(/\.html?$/i, "")
    .split("-")
    .filter(Boolean)
    .map((w) => w.toLowerCase());
  const joined = words.join(" ");
  if (joined.includes("rate confirmation")) return "Rate Confirmation";
  if (joined === "bol") return "Bill of Lading / BOL";
  if (joined.includes("pod")) return "Proof of Delivery / POD";
  if (joined.includes("work order")) return "Work Order / Dispatch Sheet / Load Assignment";
  if (joined === "invoice") return "Invoice";
  if (joined.includes("shipper packet") || joined.includes("trip packet"))
    return "Shipper Packet / Trip Packet";
  if (joined.includes("billing packet")) return "Billing Packet";
  if (joined.includes("claim intake")) return "Claim Intake / Insurance Claim Form";
  if (joined.includes("claim packet")) return "Claim Packet";
  if (joined.includes("damage photo packet")) return "Damage Photo Packet";
  if (joined.includes("insurance notification"))
    return "Insurance Notification / Notice to Insurance Carrier";
  if (joined.includes("seal verification")) return "Seal Verification / Seal Discrepancy Report";
  if (joined.includes("factoring notification")) return "Factoring Notification";
  if (joined.includes("factoring submission cover")) return "Factoring Submission Cover";
  if (joined.includes("settlement summary")) return "Settlement Summary";
  if (joined.includes("settlement hold notice")) return "Settlement Hold Notice";
  if (joined.includes("lumper reimbursement support")) return "Lumper Reimbursement Support";
  if (joined.includes("lumper receipt")) return "Lumper Receipt";
  if (joined.includes("accident report")) return "Accident Report";
  if (joined.includes("incident report")) return "Incident Report";
  if (joined.includes("driver statement")) return "Driver Statement";
  if (joined.includes("photo evidence log")) return "Photo Evidence Log";
  return slug
    .replace(/\.html?$/i, "")
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function toFormat(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html" || ext === ".htm") return "html";
  if (ext === ".png") return "png";
  if (ext === ".jpg" || ext === ".jpeg") return "jpg";
  if (ext === ".pdf") return "pdf";
  if (ext === ".svg") return "svg";
  return "mock";
}

function classifyCoreOrConditional(type) {
  const lower = type.toLowerCase();
  if (CORE_TYPES.has(lower)) return "core";
  if (CONDITIONAL_TYPES.has(lower)) return "conditional";
  return "conditional";
}

function getHtmlQuality(absPath, type, category) {
  if (!fs.existsSync(absPath)) {
    return {
      realism: "broken/missing",
      reason: "Linked path does not exist on disk.",
      action: "defer",
      priority: "P1 demo-critical",
    };
  }
  const format = toFormat(absPath);
  if (format !== "html") {
    if (type.toLowerCase().includes("photo") || type.toLowerCase().includes("evidence")) {
      return {
        realism: "acceptable",
        reason: "Evidence artifact is image-based and expected for photo proof.",
        action: "keep",
        priority: "P3 future library",
      };
    }
    return {
      realism: "weak",
      reason: "Document is not HTML form; appears as media artifact instead.",
      action: "replace_with_realistic_template",
      priority: "P2 credibility/polish",
    };
  }

  const body = fs.readFileSync(absPath, "utf8");
  const lower = body.toLowerCase();
  const hasTable = lower.includes("<table");
  const hasHeader = lower.includes("<h1");
  const lineCount = body.split("\n").length;
  const operatingWeak =
    category !== "loads" &&
    lineCount < 60 &&
    (lower.includes("generated on") || lower.includes("demo operating-document pack")) &&
    !hasTable;
  if (operatingWeak) {
    return {
      realism: "unrealistic",
      reason: "Operating doc is brief narrative HTML without compliance sections/tables.",
      action: "replace_with_realistic_template",
      priority: "P1 demo-critical",
    };
  }
  if (!hasHeader || lineCount < 40) {
    return {
      realism: "weak",
      reason: "Document structure is sparse and lacks complete paperwork sections.",
      action: "replace_with_realistic_template",
      priority: category === "loads" ? "P2 credibility/polish" : "P1 demo-critical",
    };
  }
  if (lower.includes("demo generated") || lower.includes("generated demo document")) {
    return {
      realism: "acceptable",
      reason: "Document is structured but includes obvious demo phrasing.",
      action: "keep",
      priority: "P2 credibility/polish",
    };
  }
  return {
    realism: "good",
    reason: "Document has realistic structure, sections, and print-oriented formatting.",
    action: "keep",
    priority: "P3 future library",
  };
}

function loadStoryRequires(type, loadId) {
  const load = demoData.loads.find((l) => l.id === loadId);
  if (!load) return false;
  const claimStory = Boolean(load.dispatchExceptionFlag || String(load.sealStatus).toLowerCase() === "mismatch");
  const holdStory = String(load.podStatus).toLowerCase() !== "verified";
  const low = type.toLowerCase();
  if (low.includes("claim") || low.includes("insurance") || low.includes("accident") || low.includes("incident") || low.includes("driver statement") || low.includes("photo evidence")) {
    return claimStory;
  }
  if (low.includes("settlement hold")) return holdStory;
  return true;
}

function collectDocs() {
  const records = [];
  const seen = new Set();
  const loadManifestPaths = new Set();
  const operatingPaths = new Set();
  const evidenceUrls = new Set();

  for (const loadId of LOAD_IDS) {
    const e = evidenceManifest[loadId] || {};
    for (const v of Object.values(e)) {
      if (v && typeof v === "object" && v.url) evidenceUrls.add(normPath(v.url));
    }
  }
  const operatingDocs = Array.isArray(operatingManifest.docs) ? operatingManifest.docs : [];
  for (const doc of operatingDocs) {
    operatingPaths.add(normPath(doc.path));
  }
  for (const loadId of LOAD_IDS) {
    const entry = loadManifest[loadId] || {};
    for (const [key, value] of Object.entries(entry)) {
      const p = normPath(value);
      if (!p || !p.startsWith("/generated/") || p.includes("/evidence/")) continue;
      loadManifestPaths.add(p);
      const uniq = `${loadId}|${p}`;
      if (seen.has(uniq)) continue;
      seen.add(uniq);
      records.push({
        loadId,
        key,
        title: DOC_KEY_TO_TYPE[key] || inferDocTypeFromSlug(path.basename(p)),
        path: p,
        category: "loads",
        loadDocManifest: true,
        operatingManifest: operatingPaths.has(p),
      });
    }
  }

  for (const doc of operatingDocs) {
    if (!doc.loadId || !LOAD_IDS.includes(doc.loadId)) continue;
    const p = normPath(doc.path);
    const uniq = `${doc.loadId}|${p}`;
    if (seen.has(uniq)) continue;
    seen.add(uniq);
    records.push({
      loadId: doc.loadId,
      key: path.basename(p, path.extname(p)),
      title: inferDocTypeFromSlug(path.basename(p)),
      path: p,
      category: doc.category || "operating",
      loadDocManifest: loadManifestPaths.has(p),
      operatingManifest: true,
    });
  }

  for (const category of ["claims", "settlements", "factoring"]) {
    for (const loadId of LOAD_IDS) {
      const dir = path.join(ROOT, "public", "generated", category, loadId);
      if (!fs.existsSync(dir)) continue;
      for (const file of fs.readdirSync(dir)) {
        const p = normPath(`/generated/${category}/${loadId}/${file}`);
        const uniq = `${loadId}|${p}`;
        if (seen.has(uniq)) continue;
        seen.add(uniq);
        records.push({
          loadId,
          key: path.basename(file, path.extname(file)),
          title: inferDocTypeFromSlug(file),
          path: p,
          category,
          loadDocManifest: loadManifestPaths.has(p),
          operatingManifest: operatingPaths.has(p),
        });
      }
    }
  }

  return { records, evidenceUrls };
}

function toBool(v) {
  return v ? "yes" : "no";
}

function buildReport() {
  const { records, evidenceUrls } = collectDocs();
  const rows = [];
  const weakRows = [];
  const missingRows = [];
  const duplicateMap = new Map();

  for (const rec of records.sort((a, b) => a.path.localeCompare(b.path))) {
    const abs = path.join(ROOT, "public", rec.path.replace(/^\//, "").replaceAll("/", path.sep));
    const exists = fs.existsSync(abs);
    const format = toFormat(abs);
    const quality = getHtmlQuality(abs, rec.title, rec.category);
    const typeLower = rec.title.toLowerCase();
    const tripLinked = rec.loadDocManifest && (TRIP_PACKET_DOC_KEYS.has(rec.key) || rec.path.includes("claim"));
    const loadProofLinked =
      rec.loadDocManifest &&
      [
        "rateConfirmation",
        "bol",
        "pod",
        "invoice",
        "claimIntake",
        "claimPacket",
        "damagePhotoPacket",
        "insuranceNotification",
      ].includes(rec.key);
    const claimsPanelLinked = rec.category === "claims";
    const settlementsLinked =
      rec.category === "settlements" ||
      rec.category === "factoring" ||
      rec.key === "settlementHoldNotice";

    const canonicalEvidenceLinked = evidenceUrls.has(normPath(rec.path));
    const coreConditional = classifyCoreOrConditional(rec.title);
    const needsStory = loadStoryRequires(rec.title, rec.loadId);

    const action = !needsStory && coreConditional === "conditional" ? "mark_not_required" : quality.action;
    const priority =
      !needsStory && coreConditional === "conditional"
        ? "P2 credibility/polish"
        : quality.priority;
    const reason =
      !needsStory && coreConditional === "conditional"
        ? "Conditional document present for load with no matching story trigger."
        : quality.reason;

    const out = {
      ...rec,
      format,
      exists,
      canonicalEvidenceLinked,
      tripLinked,
      loadProofLinked,
      dispatchLinked: rec.loadDocManifest || rec.operatingManifest,
      claimsPanelLinked,
      settlementsLinked,
      coreConditional,
      realism: quality.realism,
      reason,
      action,
      priority,
    };
    rows.push(out);

    const dupKey = `${rec.loadId}|${rec.title}`;
    if (!duplicateMap.has(dupKey)) duplicateMap.set(dupKey, []);
    duplicateMap.get(dupKey).push(rec.path);
    if (["weak", "unrealistic", "broken/missing"].includes(out.realism)) weakRows.push(out);
    if (!out.exists) missingRows.push(out);
  }

  const duplicates = [];
  for (const [key, paths] of duplicateMap.entries()) {
    if (paths.length > 1) duplicates.push({ key, paths });
  }

  const p1 = weakRows.filter((r) => r.priority === "P1 demo-critical");
  const p2 = weakRows.filter((r) => r.priority === "P2 credibility/polish");
  const p3 = weakRows.filter((r) => r.priority === "P3 future library");

  const bySurfaceCounts = {
    loadDocManifest: rows.filter((r) => r.loadDocManifest).length,
    operatingManifest: rows.filter((r) => r.operatingManifest).length,
    canonicalEvidence: rows.filter((r) => r.canonicalEvidenceLinked).length,
    loadTripPacket: rows.filter((r) => r.tripLinked).length,
    loadProof: rows.filter((r) => r.loadProofLinked).length,
    dispatch: rows.filter((r) => r.dispatchLinked).length,
    claims: rows.filter((r) => r.claimsPanelLinked).length,
    settlements: rows.filter((r) => r.settlementsLinked).length,
  };

  const md = [];
  md.push("# BOF Load/Dispatch Document Realism Audit");
  md.push("");
  md.push(`Generated: ${new Date().toISOString()}`);
  md.push("");
  md.push("## Executive Summary");
  md.push("");
  md.push(`- Audited ${rows.length} generated load/dispatch/claim/settlement/factoring documents across L001-L012.`);
  md.push(`- P1 demo-critical weak/unrealistic items: ${p1.length}.`);
  md.push(`- Missing or broken links: ${missingRows.length}.`);
  md.push(`- Duplicate/scattered document entries: ${duplicates.length}.`);
  md.push("- Core load documents are present and generally realistic; main realism gap is operating docs generated from minimal templates.");
  md.push("");
  md.push("## Core and Conditional Definitions");
  md.push("");
  md.push("- Core documents: Rate Confirmation, BOL, POD, Work Order/Dispatch Sheet/Load Assignment, Invoice, Shipper/Trip Packet.");
  md.push("- Conditional documents: Lumper, detention, seal discrepancy, claim/insurance stack, settlement/factoring/billing and related notices.");
  md.push("");
  md.push("## Currently Linked UI Surfaces");
  md.push("");
  md.push(`- load-doc-manifest: ${bySurfaceCounts.loadDocManifest}`);
  md.push(`- operating-doc-manifest: ${bySurfaceCounts.operatingManifest}`);
  md.push(`- canonical evidence manifest: ${bySurfaceCounts.canonicalEvidence}`);
  md.push(`- load trip packet: ${bySurfaceCounts.loadTripPacket}`);
  md.push(`- load proof: ${bySurfaceCounts.loadProof}`);
  md.push(`- dispatch document library: ${bySurfaceCounts.dispatch}`);
  md.push(`- claims panel: ${bySurfaceCounts.claims}`);
  md.push(`- settlements drawer: ${bySurfaceCounts.settlements}`);
  md.push("");
  md.push("## Full Document Inventory");
  md.push("");
  md.push("| Load ID | Title/Type | File Path | Format | Exists | load-doc-manifest | operating-doc-manifest | canonical evidence | load trip packet | load proof | dispatch library | claims panel | settlements drawer | Core/Conditional | Realism | Reason | Recommended Action | Priority |");
  md.push("|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|");
  for (const r of rows) {
    md.push(
      `| ${r.loadId} | ${r.title} | \`${r.path}\` | ${r.format} | ${toBool(r.exists)} | ${toBool(
        r.loadDocManifest
      )} | ${toBool(r.operatingManifest)} | ${toBool(r.canonicalEvidenceLinked)} | ${toBool(
        r.tripLinked
      )} | ${toBool(r.loadProofLinked)} | ${toBool(r.dispatchLinked)} | ${toBool(
        r.claimsPanelLinked
      )} | ${toBool(r.settlementsLinked)} | ${r.coreConditional} | ${r.realism} | ${r.reason} | ${r.action} | ${r.priority} |`
    );
  }
  md.push("");
  md.push("## Weak / Unrealistic Documents");
  md.push("");
  if (!weakRows.length) {
    md.push("- None.");
  } else {
    for (const r of weakRows) {
      md.push(`- ${r.loadId} \`${r.path}\` (${r.title}) → ${r.realism}; ${r.reason} | action: ${r.action} | ${r.priority}`);
    }
  }
  md.push("");
  md.push("## Missing / Broken Files");
  md.push("");
  if (!missingRows.length) {
    md.push("- None.");
  } else {
    for (const r of missingRows) md.push(`- ${r.loadId} \`${r.path}\` (${r.title})`);
  }
  md.push("");
  md.push("## Duplicates or Scattered Paths");
  md.push("");
  if (!duplicates.length) {
    md.push("- None detected.");
  } else {
    for (const dup of duplicates.slice(0, 100)) {
      md.push(`- ${dup.key}: ${dup.paths.map((p) => `\`${p}\``).join(", ")}`);
    }
  }
  md.push("");
  md.push("## Recommended Replacement Templates and Output Paths");
  md.push("");
  const templateRecs = p1.map((r) => {
    const slug = path.basename(r.path).replace(/\.html?$/i, "");
    const templateFolder = r.category === "loads" ? "scripts/templates/load-docs" : "scripts/templates/operating-docs";
    return `- ${r.loadId} ${r.title}: \`${templateFolder}/${slug}.template.html\` -> \`${r.path}\``;
  });
  if (templateRecs.length) md.push(...templateRecs);
  else md.push("- No P1 template replacements required.");
  md.push("");
  md.push("## Priority List");
  md.push("");
  md.push(`- P1 demo-critical (${p1.length}): ${p1.map((r) => `${r.loadId}:${path.basename(r.path)}`).join(", ") || "None"}`);
  md.push(`- P2 credibility/polish (${p2.length}): ${p2.map((r) => `${r.loadId}:${path.basename(r.path)}`).slice(0, 30).join(", ") || "None"}`);
  md.push(`- P3 future library (${p3.length}): ${p3.map((r) => `${r.loadId}:${path.basename(r.path)}`).slice(0, 30).join(", ") || "None"}`);
  md.push("");
  md.push("## Risks and Unknowns");
  md.push("");
  md.push("- Some linkage booleans are inferred by code-path consumption rather than explicit manifest flags per surface.");
  md.push("- Existing promoted copies across `/generated/loads` and `/generated/{claims|factoring}` can drift if one side is regenerated and the other is not.");
  md.push("- Conditional document presence for non-claim loads may be intentional demo breadth; replace/remove must preserve current UI expectations.");
  md.push("");

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, `${md.join("\n")}\n`, "utf8");
  console.log(`Audit written: ${path.relative(ROOT, OUT_PATH)} (${rows.length} rows)`);
}

buildReport();
