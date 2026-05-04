import fs from "node:fs";
import path from "node:path";
import data from "../lib/demo-data.json" with { type: "json" };

const root = process.cwd();
const templateDir = path.join(root, "scripts", "templates", "driver-docs");

const templates = {
  employment: fs.readFileSync(path.join(templateDir, "employment-verification.template.html"), "utf8"),
  priorEmployer: fs.readFileSync(path.join(templateDir, "prior-employer-verification.template.html"), "utf8"),
  incident: fs.readFileSync(path.join(templateDir, "incident-report.template.html"), "utf8"),
  safety: fs.readFileSync(path.join(templateDir, "safety-policy-acknowledgment.template.html"), "utf8"),
};

const SAFETY_OFFICERS = [
  "Michael Brown",
  "Karen Brooks",
  "David Romero",
  "Alicia Grant",
];
const CARRIER_REPS = [
  "James Wilson",
  "Samantha Hughes",
  "Ryan Cooper",
  "Olivia Turner",
];

function render(template, values) {
  let out = template;
  for (const [k, v] of Object.entries(values)) out = out.replaceAll(`{{${k}}}`, String(v ?? ""));
  return out;
}

function stateFromAddress(address) {
  const m = String(address ?? "").match(/,\s*([A-Z]{2})\s+\d{5}(?:-\d{4})?\s*$/);
  return m?.[1] ?? "OH";
}

const drivers = [...(data.drivers ?? [])].sort((a, b) => String(a.id).localeCompare(String(b.id)));
const documents = data.documents ?? [];
const fallbackUsage = [];

for (let i = 0; i < drivers.length; i += 1) {
  const driver = drivers[i];
  const cdl = documents.find((d) => d.driverId === driver.id && d.type === "CDL");
  const state = stateFromAddress(driver.address);
  const cdlNumber = cdl?.cdlNumber || driver.referenceCdlNumber || `DLN-${String(i + 1).padStart(5, "0")}`;
  const licenseClass = cdl?.licenseClass || "Class A";
  const safetyOfficer = SAFETY_OFFICERS[i % SAFETY_OFFICERS.length];
  const carrierRep = CARRIER_REPS[i % CARRIER_REPS.length];
  const issueDate = `2026-05-${String((i % 9) + 10).padStart(2, "0")}`;

  if (!cdl?.cdlNumber && !driver.referenceCdlNumber) fallbackUsage.push(`${driver.id}: cdlNumber`);
  if (!cdl?.licenseClass) fallbackUsage.push(`${driver.id}: licenseClass`);

  const common = {
    driverId: driver.id,
    driverName: driver.name,
    driverAddress: driver.address,
    driverPhone: driver.phone || "555-0100",
    driverEmail: driver.email || `${driver.id.toLowerCase()}@boftransport.demo`,
    cdlNumber,
    licenseState: state,
    licenseClass,
    issueDate,
    driverSignature: driver.name,
    safetyOfficerSignature: safetyOfficer,
    carrierRepSignature: carrierRep,
  };

  const employmentHtml = render(templates.employment, {
    ...common,
    verificationId: `EMPV-${driver.id}-2026`,
    verifierName: safetyOfficer,
    verifierTitle: "Safety Compliance Officer",
    verifierSignature: safetyOfficer,
    priorDatesCheck: "X",
    safetyCheck: "X",
    drugAlcoholCheck: "X",
  });

  const priorEmployerHtml = render(templates.priorEmployer, {
    ...common,
    priorCarrier: "Northline Freight LLC",
    employmentPeriod: "2022-01 to 2024-09",
    reasonForLeaving: "Career advancement",
    accidentHistory: "No reportable incidents in previous 36 months",
    drugAlcoholHistory: "No violations reported",
    rehireEligible: "Yes",
  });

  const incidentHtml = render(templates.incident, {
    ...common,
    incidentId: `INC-${driver.id}-2026`,
    incidentDate: issueDate,
    incidentLocation: String(driver.address).split(",").slice(-2).join(",").trim() || "Cleveland, OH",
    incidentStatus: "Reviewed / Closed",
    incidentNarrative:
      "No disqualifying safety events identified. Driver incident register reviewed and acknowledged as part of periodic qualification maintenance.",
  });

  const safetyHtml = render(templates.safety, {
    ...common,
    policyVersion: "BOF-SAF-2026.2",
    checkHours: "X",
    checkInspection: "X",
    checkCargo: "X",
    checkIncident: "X",
  });

  const driverDir = path.join(root, "public", "generated", "drivers", driver.id);
  fs.mkdirSync(driverDir, { recursive: true });
  fs.writeFileSync(path.join(driverDir, "employment_verification.html"), employmentHtml, "utf8");
  fs.writeFileSync(path.join(driverDir, "prior_employer_inquiry.html"), priorEmployerHtml, "utf8");
  fs.writeFileSync(path.join(driverDir, "incident-report.html"), incidentHtml, "utf8");
  fs.writeFileSync(path.join(driverDir, "safety-acknowledgment.html"), safetyHtml, "utf8");
}

console.log(
  JSON.stringify(
    {
      generatedDrivers: drivers.length,
      filesPerDriver: 4,
      generatedFiles: [
        "employment_verification.html",
        "prior_employer_inquiry.html",
        "incident-report.html",
        "safety-acknowledgment.html",
      ],
      fallbackUsage,
      source: "canonical demo-data.json (drivers + documents)",
    },
    null,
    2
  )
);
