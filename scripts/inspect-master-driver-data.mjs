import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const XLSX_PATH = path.join(ROOT, "public", "data", "main-source-v2_enhanced_bof_aligned.xlsx");

try {
  const workbook = XLSX.readFile(XLSX_PATH);
  
  // Inspect Master Driver Data sheet
  const masterSheet = workbook.Sheets["Master Driver Data"];
  if (masterSheet) {
    const masterData = XLSX.utils.sheet_to_json(masterSheet, { defval: "" });
    
    console.log(`Found ${masterData.length} rows in Master Driver Data sheet`);
    
    // Show all column names to identify emergency contact columns
    const allColumns = Object.keys(masterData[0]);
    console.log("\nAll columns in Master Driver Data sheet:");
    allColumns.forEach((col, idx) => {
      console.log(`  ${idx}: ${col}`);
    });
    
    // Look for emergency contact related columns
    const emergencyColumns = allColumns.filter(col => 
      col.toLowerCase().includes('emergency') || 
      col.toLowerCase().includes('contact') ||
      col.toLowerCase().includes('primary') ||
      col.toLowerCase().includes('secondary')
    );
    
    if (emergencyColumns.length > 0) {
      console.log("\nEmergency/contact related columns found:");
      emergencyColumns.forEach(col => {
        console.log(`  - ${col}`);
      });
    }
    
    // Look for driver ID and name columns
    const driverIdColumns = allColumns.filter(col => 
      col.toLowerCase().includes('driver id') ||
      col.toLowerCase().includes('driverid') ||
      col.toLowerCase().includes('id')
    );
    
    const nameColumns = allColumns.filter(col => 
      col.toLowerCase().includes('name') ||
      col.toLowerCase().includes('full name')
    );
    
    console.log("\nDriver ID columns:");
    driverIdColumns.forEach(col => {
      console.log(`  - ${col}`);
    });
    
    console.log("\nName columns:");
    nameColumns.forEach(col => {
      console.log(`  - ${col}`);
    });
    
    // Show sample data for first few rows to understand the structure
    console.log("\nSample data from first 3 rows:");
    masterData.slice(0, 3).forEach((row, idx) => {
      console.log(`\nRow ${idx + 1}:`);
      Object.entries(row).forEach(([key, value]) => {
        if (value && String(value).trim() !== '') {
          console.log(`  ${key}: ${value}`);
        }
      });
    });
    
  } else {
    console.log("Master Driver Data sheet not found");
  }
  
} catch (error) {
  console.error("Error reading Excel file:", error.message);
}
