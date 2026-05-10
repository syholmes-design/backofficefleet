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
  console.log("Available sheets:", workbook.SheetNames);
  
  // Read Driver Data sheet
  const driverDataSheet = workbook.Sheets["Driver Data"];
  if (driverDataSheet) {
    const driverData = XLSX.utils.sheet_to_json(driverDataSheet, { defval: "" });
    
    // Find unique drivers
    const uniqueDrivers = new Map();
    driverData.forEach(row => {
      const driverId = row['Driver ID'];
      if (driverId && !uniqueDrivers.has(driverId)) {
        uniqueDrivers.set(driverId, row);
      }
    });
    
    console.log(`\nFound ${uniqueDrivers.size} unique drivers`);
    
    // Show emergency contact data for first few drivers
    console.log("\nEmergency contact data from v2 Excel:");
    let count = 0;
    for (const [driverId, row] of uniqueDrivers) {
      if (count >= 3) break;
      console.log(`\nDriver ${driverId} (${row['Full Name']}):`);
      console.log(`  Emergency Contact Name: ${row['Emergency Contact Name'] || '(empty)'}`);
      console.log(`  Emergency Contact Relation: ${row['Emergency Contact Relation'] || '(empty)'}`);
      console.log(`  Emergency Contact Phone: ${row['Emergency Contact Phone'] || '(empty)'}`);
      count++;
    }
  }
  
} catch (error) {
  console.error("Error:", error.message);
}
