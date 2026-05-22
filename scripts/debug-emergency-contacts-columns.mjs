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
    
    // Find the row that contains the emergency contact data
    const emergencyContactRow = masterData.find(row => 
      row['BackOfficeFleet — Master Driver & Emergency Contact Packet']?.includes('Emergency Contact')
    );
    
    if (emergencyContactRow) {
      console.log("Emergency contact header row found");
      
      // Look for columns that contain emergency contact data
      const allColumns = Object.keys(emergencyContactRow);
      const emergencyColumns = allColumns.filter(col => 
        col !== 'BackOfficeFleet — Master Driver & Emergency Contact Packet' &&
        String(emergencyContactRow[col]).trim() !== ''
      );
      
      console.log("\nColumns with emergency contact data:");
      emergencyColumns.forEach((col, idx) => {
        console.log(`  ${idx + 1}. ${col}: ${emergencyContactRow[col]}`);
      });
    }
    
    // Show all columns for first driver to find emergency contact fields
    const driverRows = masterData.filter(row => 
      row["__EMPTY"] && String(row["__EMPTY"]).startsWith("DRV-")
    );
    
    if (driverRows.length > 0) {
      console.log("\nAll columns for first driver (DRV-001):");
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
