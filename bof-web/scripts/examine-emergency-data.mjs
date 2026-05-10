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
    
    // Find rows that contain driver data (rows with Driver ID in __EMPTY column)
    const driverRows = masterData.filter(row => 
      row["__EMPTY"] && String(row["__EMPTY"]).startsWith("DRV-")
    );
    
    console.log(`Found ${driverRows.length} driver rows in Master Driver Data sheet`);
    
    // Show emergency contact data for first few drivers
    console.log("\nEmergency contact data from Master Driver Data:");
    driverRows.slice(0, 5).forEach((row, idx) => {
      const driverId = String(row["__EMPTY"]);
      const driverName = String(row["__EMPTY_3"]);
      
      console.log(`\nDriver ${idx + 1} (${driverId} - ${driverName}):`);
      
      // Primary emergency contact
      const primaryName = String(row["__EMPTY_23"] || "").trim();
      const primaryRelation = String(row["__EMPTY_24"] || "").trim();
      const primaryPhone = String(row["__EMPTY_25"] || "").trim();
      const primaryEmail = String(row["__EMPTY_26"] || "").trim();
      
      console.log(`  Primary Emergency Contact:`);
      console.log(`    Name: ${primaryName || '(empty)'}`);
      console.log(`    Relationship: ${primaryRelation || '(empty)'}`);
      console.log(`    Phone: ${primaryPhone || '(empty)'}`);
      console.log(`    Email: ${primaryEmail || '(empty)'}`);
      
      // Secondary emergency contact
      const secondaryName = String(row["__EMPTY_31"] || "").trim();
      const secondaryRelation = String(row["__EMPTY_32"] || "").trim();
      const secondaryPhone = String(row["__EMPTY_33"] || "").trim();
      const secondaryEmail = String(row["__EMPTY_34"] || "").trim();
      
      console.log(`  Secondary Emergency Contact:`);
      console.log(`    Name: ${secondaryName || '(empty)'}`);
      console.log(`    Relationship: ${secondaryRelation || '(empty)'}`);
      console.log(`    Phone: ${secondaryPhone || '(empty)'}`);
      console.log(`    Email: ${secondaryEmail || '(empty)'}`);
    });
  }
  
} catch (error) {
  console.error("Error reading Excel file:", error.message);
}
