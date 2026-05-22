import { resolveMainSourceXlsxPath } from "./lib/main-source-path.mjs";
import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

try {
  const XLSX_PATH = resolveMainSourceXlsxPath(ROOT);
  const workbook = XLSX.readFile(XLSX_PATH);
  
  // Read Master Driver Data sheet
  const masterSheet = workbook.Sheets["Master Driver Data"];
  if (masterSheet) {
    const masterData = XLSX.utils.sheet_to_json(masterSheet, { defval: "" });
    
    // Find rows that contain emergency contact data (rows with Driver ID in __EMPTY column)
    const contactRows = masterData.filter(row => 
      row["__EMPTY"] && String(row["__EMPTY"]).startsWith("DRV-")
    );
    
    console.log(`CHECKING SECONDARY EMAIL DATA IN MASTER DRIVER DATA:`);
    console.log(`Found ${contactRows.length} emergency contact rows`);
    
    // Check first few drivers for secondary email data
    const testDrivers = ["DRV-001", "DRV-002", "DRV-009", "DRV-012"];
    
    for (const driverId of testDrivers) {
      const row = contactRows.find(r => String(r["__EMPTY"]) === driverId);
      if (row) {
        const secondaryEmail = String(row["__EMPTY_34"] || "").trim();
        const primaryEmail = String(row["__EMPTY_26"] || "").trim();
        
        console.log(`\n${driverId}:`);
        console.log(`  Primary Email (__EMPTY_26): "${primaryEmail}"`);
        console.log(`  Secondary Email (__EMPTY_34): "${secondaryEmail}"`);
        console.log(`  Has Secondary Email: ${secondaryEmail !== ''}`);
      } else {
        console.log(`\n${driverId}: NOT FOUND`);
      }
    }
    
    // Check all drivers for secondary email data
    let driversWithSecondaryEmail = 0;
    let driversWithPrimaryEmail = 0;
    
    for (const row of contactRows) {
      const driverId = String(row["__EMPTY"]);
      const primaryEmail = String(row["__EMPTY_26"] || "").trim();
      const secondaryEmail = String(row["__EMPTY_34"] || "").trim();
      
      if (primaryEmail !== '') driversWithPrimaryEmail++;
      if (secondaryEmail !== '') driversWithSecondaryEmail++;
    }
    
    console.log(`\nSUMMARY:`);
    console.log(`  Drivers with primary email: ${driversWithPrimaryEmail}/${contactRows.length}`);
    console.log(`  Drivers with secondary email: ${driversWithSecondaryEmail}/${contactRows.length}`);
    
  } else {
    console.log("Master Driver Data sheet not found");
  }
  
} catch (error) {
  console.error("Error:", error.message);
}
