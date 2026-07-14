const fs = require("fs");
const path = require("path");

const websiteRoot = path.resolve(__dirname, "..");
const dataPath = path.join(websiteRoot, "assets", "data", "bof-public-operations.json");
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const errors = [];
const warnings = [];

const statuses = new Set(data.metadata.statusVocabulary);
const gates = new Set(data.metadata.gatingVocabulary);
const tmsOnlyDriverIds = new Set(["DRV-7042", "DRV-6198", "DRV-8317"]);

function unique(list, key, label) {
  const seen = new Set();
  for (const item of list || []) {
    if (!item[key]) errors.push(`${label} missing ${key}`);
    if (seen.has(item[key])) errors.push(`Duplicate ${label} ${item[key]}`);
    seen.add(item[key]);
  }
  return seen;
}

function existsRoute(route) {
  if (!route || !route.startsWith("/")) return false;
  const noHash = route.split("#")[0];
  const routePath = noHash.endsWith("/") ? `${noHash}index.html` : noHash;
  return fs.existsSync(path.join(websiteRoot, routePath.replace(/^\/+/, "")));
}

function existsAsset(assetPath) {
  if (!assetPath || !assetPath.startsWith("/")) return false;
  const full = path.join(websiteRoot, assetPath.replace(/^\/+/, ""));
  if (!fs.existsSync(full)) return false;
  const stat = fs.statSync(full);
  return stat.isFile() && stat.size > 0;
}

function validIso(value, label) {
  if (value === null || value === undefined || value === "") return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
    errors.push(`${label} is not an ISO date: ${value}`);
  }
}

function isTmsLoadId(value) {
  return /^TMS-/i.test(String(value || ""));
}

const driverIds = unique(data.drivers, "id", "driver");
const loadIds = unique(data.loads, "id", "load");
const unitIds = unique(data.units, "id", "unit");
const exceptionIds = unique(data.exceptions, "id", "exception");

for (const driver of data.drivers) {
  if (!statuses.has(driver.readinessStatus)) errors.push(`${driver.id} invalid readinessStatus ${driver.readinessStatus}`);
  if (!gates.has(driver.gating)) errors.push(`${driver.id} invalid gating ${driver.gating}`);
  if (!existsRoute(driver.profileRoute)) errors.push(`${driver.id} missing profile route ${driver.profileRoute}`);
  if (!existsAsset(driver.portrait)) errors.push(`${driver.id} missing portrait ${driver.portrait}`);
  if (!existsAsset(driver.licenseImage)) errors.push(`${driver.id} missing license image ${driver.licenseImage}`);
  if (driver.activeLoadId && !loadIds.has(driver.activeLoadId)) errors.push(`${driver.id} references unknown load ${driver.activeLoadId}`);
  if (driver.activeLoadId && isTmsLoadId(driver.activeLoadId)) errors.push(`${driver.id} references TMS-prefixed canonical load ${driver.activeLoadId}`);
  if (driver.activeExceptionId && !exceptionIds.has(driver.activeExceptionId)) errors.push(`${driver.id} references unknown exception ${driver.activeExceptionId}`);
  if (driver.unitId && !unitIds.has(driver.unitId)) errors.push(`${driver.id} references unknown unit ${driver.unitId}`);
}

for (const [driverId, mapping] of Object.entries((data.assetMappings && data.assetMappings.drivers) || {})) {
  if (!driverIds.has(driverId)) errors.push(`assetMappings.drivers contains unknown driver ${driverId}`);
  if (!mapping.portrait) errors.push(`${driverId} missing mapped portrait`);
  if (mapping.portrait && !existsAsset(mapping.portrait)) errors.push(`${driverId} missing mapped portrait asset ${mapping.portrait}`);
  const driver = (data.drivers || []).find(item => item.id === driverId);
  if (driver && mapping.portrait && driver.portrait !== mapping.portrait) {
    errors.push(`${driverId} portrait mismatch between driver record and asset mapping`);
  }
}

for (const assignment of data.assignments) {
  if (!driverIds.has(assignment.driverId)) errors.push(`${assignment.id} unknown driver ${assignment.driverId}`);
  if (!loadIds.has(assignment.loadId)) errors.push(`${assignment.id} unknown load ${assignment.loadId}`);
  if (isTmsLoadId(assignment.loadId)) errors.push(`${assignment.id} references TMS-prefixed canonical load ${assignment.loadId}`);
  if (!unitIds.has(assignment.unitId)) errors.push(`${assignment.id} unknown unit ${assignment.unitId}`);
  if (!statuses.has(assignment.status)) errors.push(`${assignment.id} invalid status ${assignment.status}`);
  if (!gates.has(assignment.gating)) errors.push(`${assignment.id} invalid gating ${assignment.gating}`);
}

for (const load of data.loads) {
  if (isTmsLoadId(load.id) && load.sourceDataset !== "canonical_migrated") {
    errors.push(`${load.id} is TMS-prefixed but is present as canonical without sourceDataset canonical_migrated`);
  }
  if (!driverIds.has(load.driverId)) errors.push(`${load.id} unknown driver ${load.driverId}`);
  if (!unitIds.has(load.unitId)) errors.push(`${load.id} unknown unit ${load.unitId}`);
  for (const field of ["dispatchStatus", "safetyStatus", "proofStatus", "settlementStatus"]) {
    if (!statuses.has(load[field])) errors.push(`${load.id} invalid ${field} ${load[field]}`);
  }
  if (!gates.has(load.gating)) errors.push(`${load.id} invalid gating ${load.gating}`);
  for (const exceptionId of load.exceptionIds || []) {
    if (!exceptionIds.has(exceptionId)) errors.push(`${load.id} unknown exception ${exceptionId}`);
  }
}

for (const doc of data.qualificationDocuments) {
  if (!driverIds.has(doc.driverId)) errors.push(`${doc.id} unknown driver ${doc.driverId}`);
  if (!statuses.has(doc.status)) errors.push(`${doc.id} invalid status ${doc.status}`);
  if (!existsRoute(doc.publicPreviewRoute)) errors.push(`${doc.id} missing preview route ${doc.publicPreviewRoute}`);
  if (!existsAsset(doc.assetPath)) errors.push(`${doc.id} missing asset ${doc.assetPath}`);
  if (doc.exceptionId && !exceptionIds.has(doc.exceptionId)) errors.push(`${doc.id} unknown exception ${doc.exceptionId}`);
  validIso(doc.effectiveDate, `${doc.id}.effectiveDate`);
  validIso(doc.expirationDate, `${doc.id}.expirationDate`);
  validIso(doc.verifiedDate, `${doc.id}.verifiedDate`);
}

for (const doc of data.supportingDocuments || []) {
  if (!statuses.has(doc.status)) errors.push(`${doc.id} invalid status ${doc.status}`);
}

for (const record of data.proofRecords) {
  if (!loadIds.has(record.loadId)) errors.push(`${record.id} unknown load ${record.loadId}`);
  if (isTmsLoadId(record.loadId)) errors.push(`${record.id} references TMS-prefixed canonical load ${record.loadId}`);
  if (!statuses.has(record.status)) errors.push(`${record.id} invalid status ${record.status}`);
  if (!existsRoute(record.publicPreviewRoute)) errors.push(`${record.id} missing preview route ${record.publicPreviewRoute}`);
  for (const assetPath of record.assetPaths || []) {
    if (!existsAsset(assetPath)) errors.push(`${record.id} missing proof asset ${assetPath}`);
  }
}

for (const record of data.settlementRecords) {
  if (!loadIds.has(record.loadId)) errors.push(`${record.id} unknown load ${record.loadId}`);
  if (isTmsLoadId(record.loadId)) errors.push(`${record.id} references TMS-prefixed canonical load ${record.loadId}`);
  if (!driverIds.has(record.driverId)) errors.push(`${record.id} unknown driver ${record.driverId}`);
  if (!statuses.has(record.status)) errors.push(`${record.id} invalid status ${record.status}`);
  if (!statuses.has(record.billingStatus)) errors.push(`${record.id} invalid billingStatus ${record.billingStatus}`);
}

for (const exception of data.exceptions) {
  if (!driverIds.has(exception.relatedDriverId)) errors.push(`${exception.id} unknown driver ${exception.relatedDriverId}`);
  if (!loadIds.has(exception.relatedLoadId)) errors.push(`${exception.id} unknown load ${exception.relatedLoadId}`);
  if (!statuses.has(exception.currentStatus)) errors.push(`${exception.id} invalid currentStatus ${exception.currentStatus}`);
  if (!statuses.has(exception.severity)) errors.push(`${exception.id} invalid severity ${exception.severity}`);
  validIso(exception.deadline, `${exception.id}.deadline`);
}

const unsafeLocalPath = JSON.stringify(data).match(/[A-Z]:\\|file:\/\//i);
if (unsafeLocalPath) errors.push("Unsafe local path reference found in canonical JSON");

for (const tmsOnlyDriverId of tmsOnlyDriverIds) {
  if (JSON.stringify(data).includes(tmsOnlyDriverId)) {
    errors.push(`TMS-only driver ID appears in canonical dataset: ${tmsOnlyDriverId}`);
  }
}

const report = {
  dataPath,
  driverCount: data.drivers.length,
  loadCount: data.loads.length,
  exceptionCount: data.exceptions.length,
  warnings,
  errors
};

console.log(JSON.stringify(report, null, 2));
process.exit(errors.length ? 1 : 0);
