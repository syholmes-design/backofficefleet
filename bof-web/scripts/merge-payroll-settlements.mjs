/**
 * Merges Payroll_Clean from data/main-source.xlsx into lib/demo-data.json settlements[].
 * Same row builder as build-demo-data (see scripts/lib/payroll-settlements-from-sheet.mjs).
 *
 * Run: npm run merge:settlements
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";
import { buildPayrollSettlementRowsFromWorkbook } from "./lib/payroll-settlements-from-sheet.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const XLSX_PATH = path.join(ROOT, "data", "main-source.xlsx");
const DEMO_PATH = path.join(ROOT, "lib", "demo-data.json");

function main() {
  if (!fs.existsSync(XLSX_PATH)) {
    console.error("Missing", XLSX_PATH);
    process.exit(1);
  }
  const demo = JSON.parse(fs.readFileSync(DEMO_PATH, "utf8"));
  const prevList = Array.isArray(demo.settlements) ? demo.settlements : [];

  const workbook = XLSX.readFile(XLSX_PATH, { cellDates: true });
  demo.settlements = buildPayrollSettlementRowsFromWorkbook(workbook, prevList);

  fs.writeFileSync(DEMO_PATH, JSON.stringify(demo, null, 2), "utf8");
  console.log("Updated settlements:", demo.settlements.length, "rows");
}

main();
