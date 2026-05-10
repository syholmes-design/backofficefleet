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
    
    // Find the correct emergency contact phone column
    let emergencyPhoneIndex = -1;
    for (let i = 0; i < header.length; i++) {
      if (header[i] === "Emergency Contact Phone") {
        emergencyPhoneIndex = i;
        break;
      }
    }
    
    console.log(`Emergency Contact Phone column index: ${emergencyPhoneIndex}`);
    
    // Show sample data from the correct column
    const uniqueDrivers = new Map();
    driverRows.slice(1).forEach(row => {
      const driverId = row[0]; // Driver ID column
      const name = row[1]; // Full Name column
      if (driverId && name && !uniqueDrivers.has(driverId)) {
        uniqueDrivers.set(driverId, { name, emergencyPhone: row[emergencyPhoneIndex] });
      }
    });
    
    console.log("\nEmergency contact phone data from correct column:");
    let count = 0;
    for (const [driverId, data] of uniqueDrivers) {
      if (count >= 3) break;
      console.log(`  ${driverId} (${data.name}): Emergency Phone = ${data.emergencyPhone || '(empty)'}`);
      count++;
    }
  }
  
} catch (error) {
  console.error("Error:", error.message);
}
