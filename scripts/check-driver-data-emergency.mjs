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
    
    console.log(`Found ${driverData.length} rows in Driver Data sheet`);
    
    // Check for emergency contact columns
    const columns = Object.keys(driverData[0]);
    const emergencyColumns = columns.filter(col => 
      col.toLowerCase().includes('emergency') || 
      col.toLowerCase().includes('contact')
    );
    
    if (emergencyColumns.length > 0) {
      console.log("\nEmergency contact columns found in Driver Data sheet:");
      emergencyColumns.forEach(col => {
        console.log(`  - ${col}`);
      });
      
      // Show sample data for first few unique drivers
      const uniqueDrivers = new Map();
      driverData.forEach(row => {
        const driverId = row['Driver ID'];
        if (driverId && !uniqueDrivers.has(driverId)) {
          uniqueDrivers.set(driverId, row);
        }
      });
      
      console.log("\nEmergency contact data for first 3 unique drivers:");
      let count = 0;
      for (const [driverId, row] of uniqueDrivers) {
        if (count >= 3) break;
        console.log(`\nDriver ${driverId} (${row['Full Name']}):`);
        emergencyColumns.forEach(col => {
          console.log(`  ${col}: ${row[col] || '(empty)'}`);
        });
        count++;
      }
    } else {
      console.log("\nNo emergency contact columns found in Driver Data sheet");
      
      // Show all columns to help identify where emergency contacts might be
      console.log("\nAll columns in Driver Data sheet:");
      columns.forEach((col, idx) => {
        console.log(`  ${idx + 1}. ${col}`);
      });
    }
  }
  
} catch (error) {
  console.error("Error reading Excel file:", error.message);
}
