/**
 * Generates bof-web/public/data/driver_templates_expanded.xlsx for demo / build-data merge.
 * Run: node scripts/seed-driver-templates-expanded-xlsx.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "public", "data", "driver_templates_expanded.xlsx");

const HEADERS = [
  "Driver_ID",
  "CDL_Number",
  "Medical_Issue_Date",
  "Medical_Expiration_Date",
  "Examiner_Name",
  "5875_Vision_Result",
  "5875_Hearing_Result",
  "5875_Blood_Pressure",
  "MCSA_Examiner_License",
  "MCSA_Registry_Number",
  "MCSA_Examiner_Telephone",
  "Driver_License_State",
  "Driver_License_Number",
  "Driver_Signature_Date",
  "App_Submission_Date",
  "App_Status",
  "Safety_Ack_Date",
  "Safety_Ack_Status",
  "Incident_Report_Count",
  "Last_Incident_Date",
  "Qual_File_Status",
  "BOF_Medical_Summary_Status",
];

function rowForDriver(id, idx) {
  const n = idx + 1;
  return [
    id,
    id === "DRV-001" ? "OH1668243" : `DLN-${String(n).padStart(5, "0")}`,
    "2024-01-15",
    "2026-04-22",
    id === "DRV-001" ? "Dr. Jordan Ellis, MD" : `Demo Examiner ${n}`,
    "Pass",
    "Pass",
    "128/82",
    "ME-441300",
    "4321",
    "440-555-0100",
    "OH",
    id === "DRV-001" ? "OH441134921" : `DL-${String(n).padStart(4, "0")}`,
    "2024-01-15",
    "2024-02-01",
    "Complete",
    "2024-02-10",
    "Acknowledged",
    String(n % 3),
    n % 3 === 0 ? "2025-11-01" : "",
    "Current",
    n % 2 === 0 ? "Reviewed" : "Pending review",
  ];
}

function main() {
  const drivers = Array.from({ length: 12 }, (_, i) =>
    `DRV-${String(i + 1).padStart(3, "0")}`
  );
  const aoa = [HEADERS, ...drivers.map((id, i) => rowForDriver(id, i))];
  const sheet = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Driver_Templates_Expanded");
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  XLSX.writeFile(wb, OUT);
  console.log("Wrote", OUT);
}

main();
