/**
 * Merges Payroll_Clean from data/main-source.xlsx into demo-data.json settlements[].
 * Gross / total deductions / net may be null in Excel (formulas); we compute when missing.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const XLSX_PATH = path.join(ROOT, "data", "main-source.xlsx");
const DEMO_PATH = path.join(ROOT, "lib", "demo-data.json");

function num(v) {
  if (v == null || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function str(v) {
  if (v == null) return "";
  return String(v).trim();
}

function normStatus(raw) {
  const u = str(raw).toUpperCase();
  if (u === "PAID") return "Paid";
  if (u === "PENDING") return "Pending";
  if (!u) return "Pending";
  return raw;
}

function sumDeductions(r) {
  return (
    num(r["FICA"]) +
    num(r["OASDI"]) +
    num(r["Federal Withholding"]) +
    num(r["State Withholding"]) +
    num(r["SDI"]) +
    num(r["FM Leave"]) +
    num(r["Family Support"]) +
    num(r["Insurance Premiums"]) +
    num(r["Credit Union Savings Club"]) +
    num(r["401(k) Contribution"]) +
    num(r["HSA/FSA Health Deduction"]) +
    num(r["Health Insurance Premiums"]) +
    num(r["Life Insurance Above 50k"])
  );
}

function rowToSettlement(r, prevByDriver) {
  const driverId = str(r["Driver ID"]);
  const baseEarnings = num(r["Base Earnings"]);
  const backhaulPay = num(r["Backhaul Pay"]);
  const grossFromSheet = num(r["Gross Pay"]);
  const grossPay =
    grossFromSheet > 0
      ? Math.round(grossFromSheet * 100) / 100
      : Math.round((baseEarnings + backhaulPay) * 100) / 100;

  const dedParts = Math.round(sumDeductions(r) * 100) / 100;
  const totalFromSheet = num(r["Total Deductions"]);
  const deductions =
    Math.round((totalFromSheet > 0 ? totalFromSheet : dedParts) * 100) / 100;

  const fuelReimbursement = num(r["Fuel Reimb."]);
  const netFromSheet = num(r["Net Pay"]);
  const netPay =
    netFromSheet > 0
      ? Math.round(netFromSheet * 100) / 100
      : Math.round((grossPay - deductions + fuelReimbursement) * 100) / 100;

  const pendingExcel = str(r["Pending Reason"]);
  const prev = prevByDriver.get(driverId);
  const pendingReason =
    pendingExcel ||
    (prev && str(prev.pendingReason)) ||
    "";

  const rateRaw = r["401(k) Rate"];
  let rate401k = "";
  if (rateRaw != null && rateRaw !== "") {
    const n = Number(rateRaw);
    rate401k = Number.isFinite(n)
      ? `${Math.round(n * 10000) / 100}%`
      : str(rateRaw);
  }

  return {
    driverId,
    photoUrl: "",
    settlementId: str(r["Settlement ID"]),
    exportStatus: str(r["Export Status"]),
    settlementUrl: str(r["Settlement URL"]),
    baseEarnings,
    backhaulPay,
    grossPay,
    fica: num(r["FICA"]),
    oasdi: num(r["OASDI"]),
    federalWithholding: num(r["Federal Withholding"]),
    stateWithholding: num(r["State Withholding"]),
    sdi: num(r["SDI"]),
    fmLeave: num(r["FM Leave"]),
    familySupport: num(r["Family Support"]),
    insurancePremiums: num(r["Insurance Premiums"]),
    creditUnionSavingsClub: num(r["Credit Union Savings Club"]),
    contribution401k: num(r["401(k) Contribution"]),
    hsaFsaHealthDeduction: num(r["HSA/FSA Health Deduction"]),
    healthInsurancePremiums: num(r["Health Insurance Premiums"]),
    lifeInsuranceAbove50k: num(r["Life Insurance Above 50k"]),
    deductions,
    fuelReimbursement,
    netPay,
    status: normStatus(r["Status"]),
    pendingReason,
    rate401k,
  };
}

function main() {
  if (!fs.existsSync(XLSX_PATH)) {
    console.error("Missing", XLSX_PATH);
    process.exit(1);
  }
  const demo = JSON.parse(fs.readFileSync(DEMO_PATH, "utf8"));
  const prevList = Array.isArray(demo.settlements) ? demo.settlements : [];
  const prevByDriver = new Map(prevList.map((s) => [s.driverId, s]));

  const workbook = XLSX.readFile(XLSX_PATH, { cellDates: true });
  const sheet = workbook.Sheets["Payroll_Clean"];
  if (!sheet) {
    console.error("Missing Payroll_Clean sheet");
    process.exit(1);
  }
  const rows = XLSX.utils.sheet_to_json(sheet, { raw: true, defval: null });
  demo.settlements = rows.map((r) => rowToSettlement(r, prevByDriver));

  fs.writeFileSync(DEMO_PATH, JSON.stringify(demo, null, 2), "utf8");
  console.log("Updated settlements:", demo.settlements.length, "rows");
}

main();
