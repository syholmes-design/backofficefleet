import fs from "node:fs";
import path from "node:path";
import demoData from "../lib/demo-data.json" with { type: "json" };

const root = process.cwd();
const templatePath = path.join(root, "scripts", "templates", "driver-docs", "road-test-certificate.template.html");
const template = fs.readFileSync(templatePath, "utf8");

const EXAMINERS = [
  { name: "Michael Brown", title: "Safety Manager", license: "EXM-8801", signature: "Michael Brown" },
  { name: "Alicia Grant", title: "Lead Road Examiner", license: "EXM-8802", signature: "Alicia Grant" },
  { name: "David Romero", title: "Safety Supervisor", license: "EXM-8803", signature: "David Romero" },
  { name: "Karen Brooks", title: "Road Test Examiner", license: "EXM-8804", signature: "Karen Brooks" },
];

const CARRIER_REPS = [
  { name: "James Wilson", title: "Fleet Manager", signature: "James Wilson" },
  { name: "Olivia Turner", title: "Operations Director", signature: "Olivia Turner" },
  { name: "Ryan Cooper", title: "Safety Director", signature: "Ryan Cooper" },
  { name: "Samantha Hughes", title: "Compliance Manager", signature: "Samantha Hughes" },
];

function render(tpl, values) {
  let out = tpl;
  for (const [k, v] of Object.entries(values)) out = out.replaceAll(`{{${k}}}`, String(v ?? ""));
  return out;
}

function driverStateFromAddress(address) {
  const m = String(address ?? "").match(/,\s*([A-Z]{2})\s+\d{5}(?:-\d{4})?\s*$/);
  return m?.[1] ?? "TX";
}

function slugUpperName(name) {
  const parts = String(name ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "DRIVER, UNKNOWN";
  const last = parts[parts.length - 1] ?? "";
  const first = parts[0] ?? "";
  return `${last.toUpperCase()}, ${first.toUpperCase()}`;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

const drivers = [...(demoData.drivers ?? [])].sort((a, b) => String(a.id).localeCompare(String(b.id)));
const docs = demoData.documents ?? [];
const fallbackUsage = [];

for (let i = 0; i < drivers.length; i += 1) {
  const driver = drivers[i];
  const cdlDoc = docs.find((d) => d.driverId === driver.id && String(d.type).toLowerCase() === "cdl");
  const examiner = EXAMINERS[i % EXAMINERS.length];
  const carrier = CARRIER_REPS[i % CARRIER_REPS.length];

  const idx = i + 1;
  const testDay = String(20 + i).padStart(2, "0");
  const roadTestDate = `05/${testDay}/2025`;
  const certNo = `RT-2025-${String(idx).padStart(4, "0")}`;
  const vaultId = `BVAULT-RT-${driver.id}`;
  const state = cdlDoc?.sourceLicenseNumber
    ? String(cdlDoc.sourceLicenseNumber).replace(/[^A-Z]/gi, "").slice(0, 2).toUpperCase()
    : driverStateFromAddress(driver.address);
  const cdlNumber = cdlDoc?.cdlNumber || driver.referenceCdlNumber || `DLN-${String(idx).padStart(5, "0")}`;
  const licenseClass = cdlDoc?.licenseClass || "Class A";
  const endorsements = cdlDoc?.cdlEndorsements || "T, N";

  if (!cdlDoc?.cdlNumber && !driver.referenceCdlNumber) fallbackUsage.push(`${driver.id}: licenseNumber`);
  if (!cdlDoc?.licenseClass) fallbackUsage.push(`${driver.id}: licenseClass`);
  if (!cdlDoc?.cdlEndorsements) fallbackUsage.push(`${driver.id}: endorsements`);

  const beginOdometer = 245600 + idx * 9;
  const endOdometer = beginOdometer + 3;

  const html = render(template, {
    certificateNumber: certNo,
    roadTestDate,
    driverName: driver.name,
    driverNameUpper: slugUpperName(driver.name),
    driverId: driver.id,
    dateOfBirth: `0${(idx % 9) + 1}/14/198${idx % 10}`,
    licenseNumber: cdlNumber,
    licenseState: state || "TX",
    driverAddress: driver.address || "Address on file",
    truckCheck: "",
    tractorCheck: "",
    truckTractorCheck: "✓",
    busCheck: "",
    otherCheck: "",
    vehicleMake: "Freightliner",
    vehicleModel: idx % 2 === 0 ? "Cascadia 126" : "M2 106",
    vehicleYear: String(2021 + (idx % 4)),
    plateNumber: `RT${String(2300 + idx)}`,
    plateState: state || "TX",
    trailersUsed: "Van Trailer - 53 ft",
    gcwr: "80,000 lbs",
    manualCheck: idx % 3 === 0 ? "" : "✓",
    automaticCheck: idx % 3 === 0 ? "✓" : "",
    endorsements,
    preTripCheck: "✓",
    basicControlCheck: "✓",
    onRoadCheck: "✓",
    roadTestLocation: String(driver.address).split(",").slice(-2).join(",").trim() || "Dallas, TX",
    beginOdometer: String(beginOdometer),
    endOdometer: String(endOdometer),
    totalMiles: "3",
    examinerName: examiner.name,
    examinerTitle: examiner.title,
    examinerLicense: examiner.license,
    examinerSignature: examiner.signature,
    carrierName: "BOF Transportation, LLC",
    carrierDot: "123467",
    carrierMc: "765432",
    carrierRepName: carrier.name,
    carrierRepTitle: carrier.title,
    carrierSignature: carrier.signature,
    driverSignature: driver.name,
    licenseClass,
    vaultId,
  });

  const outDir = path.join(root, "public", "generated", "drivers", driver.id);
  ensureDir(outDir);
  fs.writeFileSync(path.join(outDir, "road-test-certificate.html"), html, "utf8");
}

console.log(
  JSON.stringify(
    {
      generatedCount: drivers.length,
      generatedFileName: "road-test-certificate.html",
      fallbackUsage,
      sourceReference: "/source-assets/road-test/Roadtestcert2.png",
    },
    null,
    2
  )
);
