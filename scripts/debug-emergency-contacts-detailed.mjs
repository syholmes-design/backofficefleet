import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const XLSX_PATH = path.join(ROOT, "public", "data", "main-source-v2_enhanced_bof_aligned.xlsx");

try {
  const workbook = XLSX.readFile(XLSX_PATH);
  
  // Read Master Driver Data sheet
  const masterSheet = workbook.Sheets["Master Driver Data"];
  if (masterSheet) {
    const masterData = XLSX.utils.sheet_to_json(masterSheet, { defval: "" });
    
    console.log(`Found ${masterData.length} rows in Master Driver Data sheet`);
    
    // Find the row that contains the emergency contact data
    const emergencyContactRow = masterData.find(row => 
      row['BackOfficeFleet — Master Driver & Emergency Contact Packet']?.includes('Emergency Contact')
    );
    
    if (emergencyContactRow) {
      console.log("\nFound emergency contact header row:");
      Object.entries(emergencyContactRow).forEach(([key, value]) => {
        if (value && String(value).trim() !== '') {
          console.log(`  ${key}: ${value}`);
        }
      });
    }
    
    // Show all rows with DRV- prefix to understand the structure
    const driverRows = masterData.filter(row => 
      row["__EMPTY"] && String(row["__EMPTY"]).startsWith("DRV-")
    );
    
    console.log(`\nFound ${driverRows.length} driver rows in Master Driver Data`);
    
    // Show detailed data for first driver
    if (driverRows.length > 0) {
      console.log("\nDetailed data for first driver row:");
      Object.entries(driverRows[0]).forEach(([key, value]) => {
        if (value && String(value).trim() !== '') {
          console.log(`  ${key}: ${value}`);
        }
      });
    }
  }
  
} catch (error) {
  console.error("Error reading Excel file:", error.message);
}
