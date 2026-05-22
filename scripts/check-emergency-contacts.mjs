import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const XLSX_PATH = path.join(ROOT, "public", "data", "main-source-v2_enhanced_bof_aligned.xlsx");

try {
  const workbook = XLSX.readFile(XLSX_PATH);
  console.log("Available sheets:", workbook.SheetNames);
  
  // Check Driver Data sheet
  const driverDataSheet = workbook.Sheets["Driver Data"];
  if (driverDataSheet) {
    const driverData = XLSX.utils.sheet_to_json(driverDataSheet, { defval: "" });
    if (driverData.length > 0) {
      console.log("\nColumns in Driver Data sheet:");
      const columns = Object.keys(driverData[0]);
      columns.sort();
      columns.forEach(col => {
        console.log(`  - ${col}`);
      });
      
      // Look for emergency contact related columns
      const emergencyCols = columns.filter(col => 
        col.toLowerCase().includes('emergency') || 
        col.toLowerCase().includes('contact') ||
        col.toLowerCase().includes('primary') ||
        col.toLowerCase().includes('secondary')
      );
      
      if (emergencyCols.length > 0) {
        console.log("\nEmergency contact related columns found:");
        emergencyCols.forEach(col => {
          console.log(`  - ${col}`);
        });
        
        // Show sample data for emergency contact columns
        console.log("\nSample emergency contact data:");
        driverData.slice(0, 3).forEach((row, idx) => {
          console.log(`\nDriver ${idx + 1}:`);
          emergencyCols.forEach(col => {
            console.log(`  ${col}: ${row[col] || '(empty)'}`);
          });
        });
      } else {
        console.log("\nNo emergency contact columns found in Driver Data sheet");
      }
    }
  }
  
  // Check Master Driver Data sheet
  const masterDriverSheet = workbook.Sheets["Master Driver Data"];
  if (masterDriverSheet) {
    const masterDriverData = XLSX.utils.sheet_to_json(masterDriverSheet, { defval: "" });
    if (masterDriverData.length > 0) {
      console.log("\nColumns in Master Driver Data sheet:");
      const columns = Object.keys(masterDriverData[0]);
      columns.sort();
      columns.forEach(col => {
        console.log(`  - ${col}`);
      });
      
      // Look for emergency contact related columns
      const emergencyCols = columns.filter(col => 
        col.toLowerCase().includes('emergency') || 
        col.toLowerCase().includes('contact') ||
        col.toLowerCase().includes('primary') ||
        col.toLowerCase().includes('secondary')
      );
      
      if (emergencyCols.length > 0) {
        console.log("\nEmergency contact related columns found:");
        emergencyCols.forEach(col => {
          console.log(`  - ${col}`);
        });
        
        // Show sample data for emergency contact columns
        console.log("\nSample emergency contact data:");
        masterDriverData.slice(0, 3).forEach((row, idx) => {
          console.log(`\nDriver ${idx + 1}:`);
          emergencyCols.forEach(col => {
            console.log(`  ${col}: ${row[col] || '(empty)'}`);
          });
        });
      } else {
        console.log("\nNo emergency contact columns found in Master Driver Data sheet");
      }
    }
  }
  
  // Check other sheets that might contain emergency contact data
  const otherSheets = workbook.SheetNames.filter(name => 
    name.toLowerCase().includes('emergency') || 
    name.toLowerCase().includes('contact')
  );
  
  if (otherSheets.length > 0) {
    console.log("\nFound sheets with emergency/contact in name:");
    otherSheets.forEach(sheetName => {
      console.log(`\nColumns in ${sheetName} sheet:`);
      const sheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      if (data.length > 0) {
        const columns = Object.keys(data[0]);
        columns.sort();
        columns.forEach(col => {
          console.log(`  - ${col}`);
        });
        
        // Show more detailed sample data
        console.log("\nSample data (first 10 rows):");
        data.slice(0, 10).forEach((row, idx) => {
          console.log(`\nRow ${idx + 1}:`);
          Object.entries(row).forEach(([key, value]) => {
            if (value && String(value).trim() !== '') {
              console.log(`  ${key}: ${value}`);
            }
          });
        });
      }
    });
  }
  
} catch (error) {
  console.error("Error reading Excel file:", error.message);
}
