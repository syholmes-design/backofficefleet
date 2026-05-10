import { resolveMainSourceXlsxPath } from "./lib/main-source-path.mjs";
import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

try {
  const XLSX_PATH = resolveMainSourceXlsxPath(ROOT);
  console.log(`Reading from: ${XLSX_PATH}`);
  
  const workbook = XLSX.readFile(XLSX_PATH);
  
  // Read Driver Data sheet
  const driverRows = XLSX.utils.sheet_to_json(workbook.Sheets["Driver Data"], { header: 1, defval: "" });
  
  if (driverRows.length > 0) {
    const header = driverRows[0];
    console.log("\nAll columns in Driver Data sheet:");
    header.forEach((col, idx) => {
      if (col && String(col).trim() !== '') {
        console.log(`  ${idx}: ${col}`);
      }
    });
    
    // Find emergency contact related columns
    const emergencyColumns = [];
    header.forEach((col, idx) => {
      if (col && (String(col).toLowerCase().includes('emergency') || String(col).toLowerCase().includes('contact'))) {
        emergencyColumns.push({ index: idx, name: col });
      }
    });
    
    if (emergencyColumns.length > 0) {
      console.log("\nEmergency/contact related columns:");
      emergencyColumns.forEach(col => {
        console.log(`  ${col.index}: ${col.name}`);
      });
    }
  }
  
} catch (error) {
  console.error("Error:", error.message);
}
