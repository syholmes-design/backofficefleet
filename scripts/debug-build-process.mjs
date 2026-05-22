import { resolveMainSourceXlsxPath } from "./lib/main-source-path.mjs";
import XLSX from "xlsx";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

// Copy the buildDrivers function to test it
function findCol(headers, patterns) {
  const entries = headers.map((h, i) => [String(h ?? "").trim().toLowerCase(), i]);
  for (const p of patterns) {
    const np = String(p ?? "").trim().toLowerCase();
    for (const [h, i] of entries) {
      if (h === np || h.includes(np) || np.includes(h)) {
        return i;
      }
    }
  }
  return -1;
}

function buildDrivers(rows) {
  if (!rows.length) return [];
  const header = rows[0].map((h) => String(h ?? "").trim());
  console.log("Available columns in header:", header.slice(0, 10)); // Show first 10 columns
  
  const iName = findCol(header, ["name", "driver name", "full name", "driver"]);
  const iAddr = findCol(header, ["address"]);
  const iPhone = findCol(header, ["phone", "mobile", "telephone", "tel"]);
  const iEmail = findCol(header, ["email", "e-mail"]);
  const iEmergencyName = findCol(header, ["emergency contact name", "emergencycontactname"]);
  const iEmergencyRelation = findCol(header, ["emergency contact relation", "emergencycontactrelation"]);
  const iEmergencyPhone = findCol(header, ["emergency contact phone", "emergencycontactphone"]);
  
  console.log("Column indices:");
  console.log(`  Name: ${iName}`);
  console.log(`  Emergency Name: ${iEmergencyName}`);
  console.log(`  Emergency Relation: ${iEmergencyRelation}`);
  console.log(`  Emergency Phone: ${iEmergencyPhone}`);
  
  if (iName < 0) {
    throw new Error('Could not find name column');
  }
  
  const dataRows = rows
    .slice(1)
    .filter((r) => r && r.some((c) => String(c ?? "").trim() !== ""))
    .filter((row) => String(row[iName] ?? "").trim() !== "");
  
  console.log(`Found ${dataRows.length} data rows`);
  
  // Show first row data
  if (dataRows.length > 0) {
    console.log("\nFirst driver row data:");
    console.log(`  Name: ${dataRows[0][iName]}`);
    console.log(`  Emergency Name: ${iEmergencyName >= 0 ? dataRows[0][iEmergencyName] : '(not found)'}`);
    console.log(`  Emergency Relation: ${iEmergencyRelation >= 0 ? dataRows[0][iEmergencyRelation] : '(not found)'}`);
    console.log(`  Emergency Phone: ${iEmergencyPhone >= 0 ? dataRows[0][iEmergencyPhone] : '(not found)'}`);
  }
  
  return dataRows.slice(0, 3).map((row, idx) => {
    const name = String(row[iName] ?? "").trim();
    const address = iAddr >= 0 ? String(row[iAddr] ?? "").trim() : "";
    const phone = iPhone >= 0 ? String(row[iPhone] ?? "").trim() : "";
    let email = iEmail >= 0 ? String(row[iEmail] ?? "").trim() : "";
    if (!email) email = `${name.toLowerCase().replace(/\s+/g, '.')}@boftransport.com`;
    
    // Add emergency contact data
    const emergencyContactName = iEmergencyName >= 0 ? String(row[iEmergencyName] ?? "").trim() : "";
    const emergencyContactRelationship = iEmergencyRelation >= 0 ? String(row[iEmergencyRelation] ?? "").trim() : "";
    const emergencyContactPhone = iEmergencyPhone >= 0 ? String(row[iEmergencyPhone] ?? "").trim() : "";
    
    return {
      id: `DRV-${String(idx + 1).padStart(3, "0")}`,
      name,
      address,
      phone,
      email,
      emergencyContactName,
      emergencyContactRelationship,
      emergencyContactPhone,
    };
  });
}

try {
  const XLSX_PATH = resolveMainSourceXlsxPath(ROOT);
  console.log(`Reading from: ${XLSX_PATH}`);
  
  const workbook = XLSX.readFile(XLSX_PATH);
  
  // Test reading from Driver Data sheet
  const driverSheetName = workbook.SheetNames.includes("Driver Data") ? "Driver Data" : "Drivers_Clean";
  console.log(`\nUsing sheet: ${driverSheetName}`);
  
  const driverRows = XLSX.utils.sheet_to_json(workbook.Sheets[driverSheetName], { header: 1, defval: "" });
  console.log(`Found ${driverRows.length} rows in ${driverSheetName} sheet`);
  
  const drivers = buildDrivers(driverRows);
  
  console.log("\nBuilt drivers:");
  drivers.forEach(driver => {
    console.log(`  ${driver.id}: ${driver.name}`);
    console.log(`    Emergency: ${driver.emergencyContactName} (${driver.emergencyContactRelationship}) - ${driver.emergencyContactPhone}`);
  });
  
} catch (error) {
  console.error("Error:", error.message);
  console.error(error.stack);
}
