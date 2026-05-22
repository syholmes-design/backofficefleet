import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const XLSX_PATH = path.join(ROOT, "public", "data", "main-source-v2_enhanced_bof_aligned.xlsx");

try {
  const workbook = XLSX.readFile(XLSX_PATH);
  
  // Check Driver Data sheet for primary emergency contacts
  const driverDataSheet = workbook.Sheets["Driver Data"];
  if (driverDataSheet) {
    const driverData = XLSX.utils.sheet_to_json(driverDataSheet, { defval: "" });
    console.log(`\nFound ${driverData.length} drivers in Driver Data sheet`);
    
    // Look for secondary emergency contact columns
    const columns = Object.keys(driverData[0]);
    const secondaryContactCols = columns.filter(col => 
      col.toLowerCase().includes('secondary') ||
      col.toLowerCase().includes('2nd') ||
      col.toLowerCase().includes('alt') ||
      col.toLowerCase().includes('alternate')
    );
    
    if (secondaryContactCols.length > 0) {
      console.log("\nSecondary emergency contact columns found:");
      secondaryContactCols.forEach(col => {
        console.log(`  - ${col}`);
      });
    } else {
      console.log("\nNo secondary emergency contact columns found in Driver Data sheet");
    }
    
    // Show primary emergency contact data for first few drivers
    console.log("\nPrimary emergency contact data (first 5 drivers):");
    driverData.slice(0, 5).forEach((row, idx) => {
      console.log(`\nDriver ${idx + 1} (${row['Driver ID']} - ${row['Full Name']}):`);
      console.log(`  Emergency Contact Name: ${row['Emergency Contact Name'] || '(empty)'}`);
      console.log(`  Emergency Contact Phone: ${row['Emergency Contact Phone'] || '(empty)'}`);
      console.log(`  Emergency Contact Relation: ${row['Emergency Contact Relation'] || '(empty)'}`);
    });
  }
  
  // Check if there's a separate emergency contacts CSV file mentioned
  const masterDriverSheet = workbook.Sheets["Master Driver Data"];
  if (masterDriverSheet) {
    const masterData = XLSX.utils.sheet_to_json(masterDriverSheet, { defval: "" });
    const infoRow = masterData.find(row => 
      row['BackOfficeFleet — Master Driver & Emergency Contact Packet']?.includes('driver_emergency_contacts_only.csv')
    );
    
    if (infoRow) {
      console.log("\nFound reference to emergency contacts CSV file:");
      console.log(infoRow['BackOfficeFleet — Master Driver & Emergency Contact Packet']);
      
      // Look for the actual emergency contact data in subsequent rows
      console.log("\nLooking for emergency contact data in Master Driver Data...");
      const contactRows = masterData.filter(row => 
        row['BackOfficeFleet — Master Driver & Emergency Contact Packet']?.includes('Emergency Contact')
      );
      
      if (contactRows.length > 0) {
        console.log(`Found ${contactRows.length} emergency contact entries:`);
        contactRows.slice(0, 5).forEach((row, idx) => {
          console.log(`\nEmergency Contact ${idx + 1}:`);
          Object.entries(row).forEach(([key, value]) => {
            if (value && String(value).trim() !== '' && key !== 'BackOfficeFleet — Master Driver & Emergency Contact Packet') {
              console.log(`  ${key}: ${value}`);
            }
          });
        });
      }
    }
  }
  
  // Check all sheets for any secondary emergency contact data
  console.log("\nChecking all sheets for secondary emergency contact data...");
  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    
    if (data.length > 0) {
      const columns = Object.keys(data[0]);
      const secondaryCols = columns.filter(col => 
        col.toLowerCase().includes('secondary') ||
        col.toLowerCase().includes('2nd') ||
        col.toLowerCase().includes('alt') ||
        (col.toLowerCase().includes('emergency') && col.toLowerCase().includes('2'))
      );
      
      if (secondaryCols.length > 0) {
        console.log(`\nFound secondary contact columns in sheet "${sheetName}":`);
        secondaryCols.forEach(col => {
          console.log(`  - ${col}`);
        });
        
        // Show sample data
        console.log("\nSample data:");
        data.slice(0, 3).forEach((row, idx) => {
          console.log(`\nRow ${idx + 1}:`);
          secondaryCols.forEach(col => {
            console.log(`  ${col}: ${row[col] || '(empty)'}`);
          });
        });
      }
    }
  });
  
} catch (error) {
  console.error("Error reading Excel file:", error.message);
}
