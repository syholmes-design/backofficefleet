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
    
    console.log(`CHECKING ALL EMAIL COLUMNS FOR DRV-001:`);
    
    // Find DRV-001 row
    const drv001 = contactRows.find(row => String(row["__EMPTY"]) === "DRV-001");
    if (drv001) {
      console.log(`DRV-001 found with ${Object.keys(drv001).length} columns`);
      
      // Check all __EMPTY_ columns for email data
      const emailColumns = [];
      for (let i = 0; i <= 50; i++) {
        const columnName = `__EMPTY_${i}`;
        const value = String(drv001[columnName] || "").trim();
        if (value !== '') {
          emailColumns.push({ column: columnName, value });
        }
      }
      
      console.log(`\nNon-empty columns:`);
      emailColumns.forEach(col => {
        console.log(`  ${col.column}: "${col.value}"`);
      });
      
      // Specifically check columns 26 and 34 for email
      const primaryEmail = String(drv001["__EMPTY_26"] || "").trim();
      const secondaryEmail = String(drv001["__EMPTY_34"] || "").trim();
      
      console.log(`\nEmail columns:`);
      console.log(`  Primary Email (__EMPTY_26): "${primaryEmail}"`);
      console.log(`  Secondary Email (__EMPTY_34): "${secondaryEmail}"`);
      
    } else {
      console.log("DRV-001 not found");
    }
    
  } else {
    console.log("Master Driver Data sheet not found");
  }
  
} catch (error) {
  console.error("Error:", error.message);
}
