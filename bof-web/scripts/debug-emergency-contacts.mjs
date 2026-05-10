import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const XLSX_PATH = path.join(ROOT, "public", "data", "main-source-v2_enhanced_bof_aligned.xlsx");

try {
  const workbook = XLSX.readFile(XLSX_PATH);
  
  // Read Driver Data sheet
  const driverDataSheet = workbook.Sheets["Driver Data"];
  if (driverDataSheet) {
    const driverData = XLSX.utils.sheet_to_json(driverDataSheet, { defval: "" });
    console.log(`Found ${driverData.length} drivers in Driver Data sheet`);
    
    // Show first few drivers with their IDs
    console.log("\nFirst 5 drivers from Driver Data sheet:");
    driverData.slice(0, 5).forEach((row, idx) => {
      console.log(`  ${idx + 1}. Driver ID: ${row['Driver ID']}, Name: ${row['Full Name']}`);
    });
  }
  
  // Read Master Driver Data sheet for emergency contacts
  const masterSheet = workbook.Sheets["Master Driver Data"];
  if (masterSheet) {
    const masterData = XLSX.utils.sheet_to_json(masterSheet, { defval: "" });
    
    // Find rows that contain emergency contact data
    const contactRows = masterData.filter(row => 
      row["__EMPTY"] && String(row["__EMPTY"]).startsWith("DRV-")
    );
    
    console.log(`\nFound ${contactRows.length} emergency contact rows in Master Driver Data`);
    
    // Show first few emergency contact entries
    console.log("\nFirst 3 emergency contact entries:");
    contactRows.slice(0, 3).forEach((row, idx) => {
      const driverId = String(row["__EMPTY"]);
      console.log(`  ${idx + 1}. Driver ID: ${driverId}`);
      console.log(`     Primary: ${row["__EMPTY_23"]} (${row["__EMPTY_24"]}) - ${row["__EMPTY_25"]}`);
      console.log(`     Secondary: ${row["__EMPTY_31"]} (${row["__EMPTY_32"]}) - ${row["__EMPTY_33"]}`);
    });
  }
  
} catch (error) {
  console.error("Error reading Excel file:", error.message);
}
