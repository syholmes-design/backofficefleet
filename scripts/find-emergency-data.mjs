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
    
    console.log(`Found ${masterData.length} total rows in Master Driver Data sheet`);
    
    // Look for rows that contain emergency contact data
    const emergencyRows = masterData.filter(row => {
      // Check if any of the emergency contact columns have data
      return (
        (row["__EMPTY_23"] && String(row["__EMPTY_23"]).trim() !== '') ||
        (row["__EMPTY_24"] && String(row["__EMPTY_24"]).trim() !== '') ||
        (row["__EMPTY_25"] && String(row["__EMPTY_25"]).trim() !== '') ||
        (row["__EMPTY_31"] && String(row["__EMPTY_31"]).trim() !== '') ||
        (row["__EMPTY_32"] && String(row["__EMPTY_32"]).trim() !== '') ||
        (row["__EMPTY_33"] && String(row["__EMPTY_33"]).trim() !== '')
      );
    });
    
    console.log(`Found ${emergencyRows.length} rows with emergency contact data`);
    
    if (emergencyRows.length > 0) {
      console.log("\nEmergency contact data found:");
      emergencyRows.forEach((row, idx) => {
        console.log(`\nRow ${idx + 1}:`);
        console.log(`  Driver ID: ${row["__EMPTY"] || '(empty)'}`);
        console.log(`  Driver Name: ${row["__EMPTY_3"] || '(empty)'}`);
        
        // Primary emergency contact
        const primaryName = String(row["__EMPTY_23"] || "").trim();
        const primaryRelation = String(row["__EMPTY_24"] || "").trim();
        const primaryPhone = String(row["__EMPTY_25"] || "").trim();
        const primaryEmail = String(row["__EMPTY_26"] || "").trim();
        
        if (primaryName || primaryRelation || primaryPhone || primaryEmail) {
          console.log(`  Primary Emergency Contact:`);
          console.log(`    Name: ${primaryName || '(empty)'}`);
          console.log(`    Relationship: ${primaryRelation || '(empty)'}`);
          console.log(`    Phone: ${primaryPhone || '(empty)'}`);
          console.log(`    Email: ${primaryEmail || '(empty)'}`);
        }
        
        // Secondary emergency contact
        const secondaryName = String(row["__EMPTY_31"] || "").trim();
        const secondaryRelation = String(row["__EMPTY_32"] || "").trim();
        const secondaryPhone = String(row["__EMPTY_33"] || "").trim();
        const secondaryEmail = String(row["__EMPTY_34"] || "").trim();
        
        if (secondaryName || secondaryRelation || secondaryPhone || secondaryEmail) {
          console.log(`  Secondary Emergency Contact:`);
          console.log(`    Name: ${secondaryName || '(empty)'}`);
          console.log(`    Relationship: ${secondaryRelation || '(empty)'}`);
          console.log(`    Phone: ${secondaryPhone || '(empty)'}`);
          console.log(`    Email: ${secondaryEmail || '(empty)'}`);
        }
      });
    } else {
      console.log("\nNo emergency contact data found in Master Driver Data sheet");
      
      // Let's check if there are any rows with different structure
      console.log("\nChecking all rows for any emergency contact patterns...");
      masterData.forEach((row, idx) => {
        const hasAnyData = Object.values(row).some(val => val && String(val).trim() !== '');
        if (hasAnyData) {
          console.log(`\nRow ${idx + 1} has data:`);
          Object.entries(row).forEach(([key, value]) => {
            if (value && String(value).trim() !== '') {
              console.log(`  ${key}: ${value}`);
            }
          });
        }
      });
    }
  }
  
} catch (error) {
  console.error("Error reading Excel file:", error.message);
}
