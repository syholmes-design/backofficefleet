/**
 * Adds Origin, Destination, and POD Status to Dispatch_Clean if missing (Excel remains source of truth).
 * Run once after updating the workbook template.
 */
import XLSX from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const xlsxPath = path.join(__dirname, "..", "data", "main-source.xlsx");

const ROUTES = [
  ["Cleveland, OH", "Chicago, IL", "pending"],
  ["Akron, OH", "Detroit, MI", "verified"],
  ["Columbus, OH", "Indianapolis, IN", "pending"],
  ["Cincinnati, OH", "Louisville, KY", "pending"],
  ["Toledo, OH", "Pittsburgh, PA", "verified"],
  ["Dayton, OH", "Lexington, KY", "pending"],
  ["Canton, OH", "Cincinnati, OH", "pending"],
  ["Youngstown, OH", "Columbus, OH", "verified"],
  ["Sandusky, OH", "Toledo, OH", "pending"],
  ["Mansfield, OH", "Akron, OH", "pending"],
  ["Springfield, OH", "Cleveland, OH", "verified"],
  ["Cleveland, OH", "Buffalo, NY", "pending"],
];

const wb = XLSX.readFile(xlsxPath, { cellDates: true, type: "file" });
const sheet = wb.Sheets["Dispatch_Clean"];
if (!sheet) {
  console.error("Missing Dispatch_Clean sheet");
  process.exit(1);
}

const aoa = XLSX.utils.sheet_to_json(sheet, {
  header: 1,
  raw: true,
  defval: "",
});
const header = (aoa[0] ?? []).map((h) => String(h ?? "").trim());
if (
  header.includes("Origin") &&
  header.includes("Destination") &&
  header.includes("POD Status")
) {
  console.log("Dispatch_Clean already has Origin, Destination, POD Status");
  process.exit(0);
}

const n = aoa.length - 1;
if (ROUTES.length < n) {
  throw new Error(
    `patch-dispatch-clean-columns: need ${n} route rows, have ${ROUTES.length}`
  );
}

aoa[0].push("Origin", "Destination", "POD Status");
for (let i = 1; i < aoa.length; i++) {
  const r = ROUTES[i - 1];
  if (!r) throw new Error(`Missing route for data row ${i}`);
  aoa[i].push(r[0], r[1], r[2]);
}

wb.Sheets["Dispatch_Clean"] = XLSX.utils.aoa_to_sheet(aoa);
XLSX.writeFile(wb, xlsxPath);
console.log("Patched Dispatch_Clean with Origin, Destination, POD Status");
