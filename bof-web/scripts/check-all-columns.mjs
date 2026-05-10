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
    
    const columns = Object.keys(driverData[0]);
    
    // Look for any secondary emergency contact related columns
    const secondaryColumns = columns.filter(col => 
      col.toLowerCase().includes('secondary') ||
      col.toLowerCase().includes('2nd') ||
      col.toLowerCase().includes('alt') ||
      col.toLowerCase().includes('alternate') ||
      (col.toLowerCase().includes('emergency') && col.toLowerCase().includes('2'))
    );
    
    if (secondaryColumns.length > 0) {
      console.log("Secondary emergency contact columns found:");
      secondaryColumns.forEach(col => {
        console.log(`  - ${col}`);
      });
      
      // Show sample data
      const uniqueDrivers = new Map();
      driverData.forEach(row => {
        const driverId = row['Driver ID'];
        if (driverId && !uniqueDrivers.has(driverId)) {
          uniqueDrivers.set(driverId, row);
        }
      });
      
      console.log("\nSecondary emergency contact data for first 3 drivers:");
      let count = 0;
      for (const [driverId, row] of uniqueDrivers) {
        if (count >= 3) break;
        console.log(`\nDriver ${driverId}:`);
        secondaryColumns.forEach(col => {
          console.log(`  ${col}: ${row[col] || '(empty)'}`);
        });
        count++;
      }
    } else {
      console.log("No secondary emergency contact columns found in Driver Data sheet");
      
      // Check if there might be emergency contact data in other columns
      const emergencyRelatedColumns = columns.filter(col => 
        col.toLowerCase().includes('emergency') || 
        col.toLowerCase().includes('contact')
      );
      
      console.log("\nAll emergency/contact related columns:");
      emergencyRelatedColumns.forEach(col => {
        console.log(`  - ${col}`);
      });
      
      // Look for any columns that might contain secondary contact info
      console.log("\nLooking for any columns that might contain secondary contact info...");
      columns.forEach((col, idx) => {
        if (idx < 50) { // Show first 50 columns
          console.log(`  ${idx + 1}. ${col}`);
        }
      });
    }
  }
  
} catch (error) {
  console.error("Error reading Excel file:", error.message);
}
