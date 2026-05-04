import fs from "node:fs";
import path from "node:path";
import demoData from "../lib/demo-data.json" with { type: "json" };

const GENERATED_ON = "2026-05-04";
const root = process.cwd();

const claimLoads = ["L003", "L004", "L008", "L009"];
const factoringLoad = "L011";
const vendor = { vendorId: "VEND-001", vendorName: "TriState Fleet Services LLC" };

function ensureDir(relPath) {
  fs.mkdirSync(path.join(root, relPath), { recursive: true });
}

function readTemplate(name) {
  return fs.readFileSync(
    path.join(root, "scripts", "templates", "operating-docs", `${name}.template.html`),
    "utf8"
  );
}

function render(template, vars) {
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`{{${key}}}`, String(value ?? ""));
  }
  return out;
}

function writeHtml(relPath, html) {
  const full = path.join(root, relPath);
  ensureDir(path.dirname(relPath));
  fs.writeFileSync(full, html, "utf8");
}

function copyIfExists(fromRel, toRel) {
  const from = path.join(root, fromRel);
  const to = path.join(root, toRel);
  if (!fs.existsSync(from)) return false;
  ensureDir(path.dirname(toRel));
  fs.copyFileSync(from, to);
  return true;
}

function loadById(loadId) {
  return demoData.loads.find((l) => l.id === loadId);
}

function settlementByDriver(driverId) {
  return demoData.settlements.find((s) => s.driverId === driverId);
}

function evidencePath(loadId, fileName) {
  const direct = `/evidence/loads/${loadId}/${fileName}`;
  const full = path.join(root, "public", "evidence", "loads", loadId, fileName);
  return fs.existsSync(full) ? direct : "not_available";
}

const manifest = {
  generatedOn: GENERATED_ON,
  p1Scope: "demo-critical-only",
  docs: [],
};

for (const loadId of claimLoads) {
  const load = loadById(loadId);
  if (!load) continue;
  const settlement = settlementByDriver(load.driverId);
  const claimsDir = `public/generated/claims/${loadId}`;
  ensureDir(claimsDir);

  const promoted = [
    "insurance-notification.html",
    "claim-intake.html",
    "claim-packet.html",
    "damage-photo-packet.html",
    "seal-verification.html",
  ];
  for (const file of promoted) {
    const from = `public/generated/loads/${loadId}/${file}`;
    const to = `${claimsDir}/${file}`;
    if (copyIfExists(from, to)) {
      manifest.docs.push({
        id: `${loadId}:${file}`,
        kind: "promoted_from_loads",
        category: "claims",
        loadId,
        path: `/${to.replace(/^public\//, "")}`,
      });
    }
  }

  const commonVars = {
    title: `BOF ${loadId} Operating Report`,
    loadId,
    loadNumber: load.number,
    driverId: load.driverId,
    settlementId: settlement?.settlementId ?? "N/A",
    revenue: load.revenue,
    origin: load.origin,
    destination: load.destination,
    sealStatus: load.sealStatus,
    podStatus: load.podStatus,
    pendingReason: settlement?.pendingReason ?? "N/A",
    incidentContext: `Dispatch exception=${String(load.dispatchExceptionFlag)}; seal=${load.sealStatus}; pod=${load.podStatus}`,
    generatedOn: GENERATED_ON,
    pickupPhoto: evidencePath(loadId, "pickup-photo.png"),
    deliveryPhoto: evidencePath(loadId, "delivery-photo.png"),
    sealDeliveryPhoto: evidencePath(loadId, "seal-delivery-photo.png"),
    claimPhoto:
      evidencePath(loadId, "cargo-damage-photo.png") !== "not_available"
        ? evidencePath(loadId, "cargo-damage-photo.png")
        : evidencePath(loadId, "claim-evidence.png"),
  };

  const claimGenerated = [
    ["accident-report", "accident-report.html"],
    ["incident-report", "incident-report.html"],
    ["driver-statement", "driver-statement.html"],
    ["photo-evidence-log", "photo-evidence-log.html"],
  ];
  for (const [templateName, fileName] of claimGenerated) {
    const html = render(readTemplate(templateName), {
      ...commonVars,
      title: `BOF ${loadId} ${fileName.replace(".html", "").replaceAll("-", " ")}`,
    });
    const rel = `${claimsDir}/${fileName}`;
    writeHtml(rel, html);
    manifest.docs.push({
      id: `${loadId}:${fileName}`,
      kind: "generated",
      category: "claims",
      loadId,
      path: `/${rel.replace(/^public\//, "")}`,
    });
  }
}

for (const loadId of ["L003", "L008"]) {
  const load = loadById(loadId);
  if (!load) continue;
  const settlement = settlementByDriver(load.driverId);
  const rel = `public/generated/settlements/${loadId}/lumper-reimbursement-support.html`;
  const html = render(readTemplate("lumper-reimbursement-support"), {
    title: `BOF ${loadId} Lumper Reimbursement Support`,
    loadId,
    loadNumber: load.number,
    driverId: load.driverId,
    settlementId: settlement?.settlementId ?? "N/A",
    pendingReason: settlement?.pendingReason ?? "N/A",
    lumperEvidencePath: evidencePath(loadId, "lumper-receipt.png"),
    generatedOn: GENERATED_ON,
  });
  writeHtml(rel, html);
  manifest.docs.push({
    id: `${loadId}:lumper-reimbursement-support`,
    kind: "generated",
    category: "settlements",
    loadId,
    path: `/${rel.replace(/^public\//, "")}`,
  });
}

for (const loadId of ["L003", "L004", "L008", "L009"]) {
  const load = loadById(loadId);
  if (!load) continue;
  const settlement = settlementByDriver(load.driverId);
  const rel = `public/generated/settlements/${loadId}/settlement-summary.html`;
  const html = render(readTemplate("settlement-summary"), {
    title: `BOF ${loadId} Settlement Summary`,
    loadId,
    loadNumber: load.number,
    driverId: load.driverId,
    settlementId: settlement?.settlementId ?? "N/A",
    settlementStatus: settlement?.status ?? "N/A",
    pendingReason: settlement?.pendingReason ?? "N/A",
    revenue: load.revenue,
    origin: load.origin,
    destination: load.destination,
    generatedOn: GENERATED_ON,
  });
  writeHtml(rel, html);
  manifest.docs.push({
    id: `${loadId}:settlement-summary`,
    kind: "generated",
    category: "settlements",
    loadId,
    path: `/${rel.replace(/^public\//, "")}`,
  });
}

{
  const load = loadById(factoringLoad);
  if (load) {
    const factoringDir = `public/generated/factoring/${factoringLoad}`;
    ensureDir(factoringDir);
    const promoted = [
      "factoring-notification.html",
      "invoice.html",
    ];
    for (const file of promoted) {
      const from = `public/generated/loads/${factoringLoad}/${file}`;
      const to = `${factoringDir}/${file}`;
      if (copyIfExists(from, to)) {
        manifest.docs.push({
          id: `${factoringLoad}:${file}`,
          kind: "promoted_from_loads",
          category: "factoring",
          loadId: factoringLoad,
          path: `/${to.replace(/^public\//, "")}`,
        });
      }
    }
    const rel = `${factoringDir}/factoring-submission-cover.html`;
    const html = render(readTemplate("factoring-submission-cover"), {
      title: `BOF ${factoringLoad} Factoring Submission Cover`,
      loadId: factoringLoad,
      loadNumber: load.number,
      driverId: load.driverId,
      invoicePath: `/generated/factoring/${factoringLoad}/invoice.html`,
      factoringNoticePath: `/generated/factoring/${factoringLoad}/factoring-notification.html`,
      generatedOn: GENERATED_ON,
    });
    writeHtml(rel, html);
    manifest.docs.push({
      id: `${factoringLoad}:factoring-submission-cover`,
      kind: "generated",
      category: "factoring",
      loadId: factoringLoad,
      path: `/${rel.replace(/^public\//, "")}`,
    });
  }
}

{
  const rel = `public/generated/vendors/${vendor.vendorId}/vendor-w9-ach-authorization.html`;
  const html = render(readTemplate("vendor-w9-ach-authorization"), {
    title: `BOF ${vendor.vendorName} Vendor W-9 / ACH Authorization`,
    vendorId: vendor.vendorId,
    vendorName: vendor.vendorName,
    generatedOn: GENERATED_ON,
  });
  writeHtml(rel, html);
  manifest.docs.push({
    id: `${vendor.vendorId}:vendor-w9-ach-authorization`,
    kind: "generated",
    category: "vendors",
    vendorId: vendor.vendorId,
    path: `/${rel.replace(/^public\//, "")}`,
  });
}

{
  const manifestPathPublic = path.join(root, "public", "generated", "operating-doc-manifest.json");
  const manifestPathLib = path.join(root, "lib", "generated", "operating-doc-manifest.json");
  ensureDir("public/generated");
  ensureDir("lib/generated");
  fs.writeFileSync(manifestPathPublic, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  fs.writeFileSync(manifestPathLib, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

console.log(`Generated/promoted ${manifest.docs.length} P1 operating docs.`);
