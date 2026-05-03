/**
 * Static + seed checks for dispatch hard gates and demo blocker overrides wiring.
 * Does not execute the full TypeScript eligibility graph (see report-dispatch-eligibility.ts).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function read(p) {
  return fs.readFileSync(p, "utf8");
}

function run() {
  const issues = [];

  const eligPath = path.join(ROOT, "lib", "driver-dispatch-eligibility.ts");
  const elig = read(eligPath);
  if (elig.includes("2026-04-22")) {
    issues.push(`${eligPath} must not hardcode shared medical expiration date 2026-04-22`);
  }
  if (!elig.includes("hardBlockerDetails")) {
    issues.push("driver-dispatch-eligibility.ts should expose hardBlockerDetails");
  }
  if (!elig.includes("collectDispatchHardBlockers")) {
    issues.push("driver-dispatch-eligibility.ts should export collectDispatchHardBlockers");
  }
  if (!elig.includes("driverDispatchBlockerOverrides")) {
    issues.push("driver-dispatch-eligibility.ts should read data.driverDispatchBlockerOverrides");
  }

  const ctxPath = path.join(ROOT, "lib", "bof-demo-data-context.tsx");
  const ctx = read(ctxPath);
  if (!ctx.includes("resolveDriverDispatchBlocker")) {
    issues.push("bof-demo-data-context.tsx should define resolveDriverDispatchBlocker");
  }
  if (!ctx.includes("driverDispatchBlockerOverrides")) {
    issues.push("bof-demo-data-context.tsx should persist driverDispatchBlockerOverrides on BofData");
  }

  const execLayerPath = path.join(ROOT, "lib", "executive-layer.ts");
  const execLayer = read(execLayerPath);
  if (!execLayer.includes('doc.type === "Medical Card"')) {
    issues.push("executive-layer.ts should skip raw Medical Card rows when tallying document gaps");
  }
  if (!execLayer.includes("getDriverMedicalCardStatus")) {
    issues.push("executive-layer.ts should use getDriverMedicalCardStatus for driver readiness medical state");
  }

  const demoPath = path.join(ROOT, "lib", "demo-data.json");
  const data = JSON.parse(read(demoPath));

  const medByDriver = new Map();
  for (const doc of data.documents ?? []) {
    if (doc.type !== "Medical Card") continue;
    medByDriver.set(doc.driverId, doc);
  }
  const exps = [...medByDriver.values()].map((d) => d.expirationDate?.trim()).filter(Boolean);
  const uniqueExp = new Set(exps);
  if (uniqueExp.size < 2) {
    issues.push("Expected at least 2 distinct Medical Card expirationDate values across drivers");
  }

  function toDateOnly(value) {
    if (!value) return null;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  function derive(exp) {
    const e = toDateOnly(exp);
    if (!e) return "MISSING";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (e < today) return "EXPIRED";
    const sixty = new Date(today);
    sixty.setDate(today.getDate() + 60);
    if (e <= sixty) return "EXPIRING_SOON";
    return "VALID";
  }

  let expiredMedical = 0;
  let validMedical = 0;
  for (const d of data.drivers ?? []) {
    const row = medByDriver.get(d.id);
    const st = derive(row?.expirationDate);
    if (st === "EXPIRED") expiredMedical += 1;
    if (st === "VALID") validMedical += 1;
  }
  if (expiredMedical === (data.drivers ?? []).length) {
    issues.push("All drivers would be medically expired — check demo-data Medical Card rows");
  }
  if (validMedical < 4) {
    issues.push(`Expected several drivers with valid medical (found ${validMedical})`);
  }

  if (issues.length) {
    for (const i of issues) console.error(i);
    process.exitCode = 1;
    return;
  }

  console.log("validate-driver-blockers: OK");
}

run();
