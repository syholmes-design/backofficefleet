import fs from "node:fs";
import path from "node:path";
import demoData from "../lib/demo-data.json" with { type: "json" };

const root = process.cwd();
const GENERATED_ON = "2026-05-04";

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
  ensureDir(path.dirname(relPath));
  fs.writeFileSync(path.join(root, relPath), html, "utf8");
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

const targetClaimLoads = ["L003", "L004", "L009"];
for (const loadId of targetClaimLoads) {
  const load = loadById(loadId);
  if (!load) continue;
  const settlement = settlementByDriver(load.driverId);
  const claimsDir = `public/generated/claims/${loadId}`;
  const vars = {
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

  for (const [templateName, fileName] of [
    ["accident-report", "accident-report.html"],
    ["incident-report", "incident-report.html"],
    ["driver-statement", "driver-statement.html"],
    ["photo-evidence-log", "photo-evidence-log.html"],
  ]) {
    writeHtml(`${claimsDir}/${fileName}`, render(readTemplate(templateName), vars));
  }
}

for (const loadId of ["L003", "L008"]) {
  const load = loadById(loadId);
  if (!load) continue;
  const settlement = settlementByDriver(load.driverId);
  writeHtml(
    `public/generated/settlements/${loadId}/lumper-reimbursement-support.html`,
    render(readTemplate("lumper-reimbursement-support"), {
      title: `BOF ${loadId} Lumper Reimbursement Support`,
      loadId,
      loadNumber: load.number,
      driverId: load.driverId,
      settlementId: settlement?.settlementId ?? "N/A",
      pendingReason: settlement?.pendingReason ?? "N/A",
      lumperEvidencePath: evidencePath(loadId, "lumper-receipt.png"),
      generatedOn: GENERATED_ON,
    })
  );
}

for (const loadId of ["L003", "L004", "L008", "L009"]) {
  const load = loadById(loadId);
  if (!load) continue;
  const settlement = settlementByDriver(load.driverId);
  writeHtml(
    `public/generated/settlements/${loadId}/settlement-summary.html`,
    render(readTemplate("settlement-summary"), {
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
    })
  );
}

{
  const loadId = "L011";
  const load = loadById(loadId);
  if (load) {
    writeHtml(
      `public/generated/factoring/${loadId}/factoring-submission-cover.html`,
      render(readTemplate("factoring-submission-cover"), {
        title: `BOF ${loadId} Factoring Submission Cover`,
        loadId,
        loadNumber: load.number,
        driverId: load.driverId,
        invoicePath: `/generated/factoring/${loadId}/invoice.html`,
        factoringNoticePath: `/generated/factoring/${loadId}/factoring-notification.html`,
        generatedOn: GENERATED_ON,
      })
    );
  }
}

console.log("Refreshed P1 operating realism documents.");
