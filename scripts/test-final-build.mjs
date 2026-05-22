import { resolveMainSourceXlsxPath } from "./lib/main-source-path.mjs";
import { patchDriversForJohnCarter, augmentDriversWithFleetDemoFields } from "./lib/john-carter-stack.mjs";
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
  const iName = findCol(header, ["name", "driver name", "full name", "driver"]);
  const iAddr = findCol(header, ["address"]);
  const iPhone = findCol(header, ["phone", "mobile", "telephone", "tel"]);
  const iEmail = findCol(header, ["email", "e-mail"]);
  const iEmergencyName = findCol(header, ["emergency contact name", "emergencycontactname"]);
  const iEmergencyRelation = findCol(header, ["emergency contact relation", "emergencycontactrelation"]);
  const iEmergencyPhone = findCol(header, ["emergency contact phone", "emergencycontactphone"]);
  
  // If columns not found, try to find them by index (for v2 format)
  if (iEmergencyName < 0) {
    for (let i = 0; i < header.length; i++) {
      if (header[i] === "Emergency Contact Name") {
        iEmergencyName = i;
        break;
      }
    }
  }
  if (iEmergencyRelation < 0) {
    for (let i = 0; i < header.length; i++) {
      if (header[i] === "Emergency Contact Relation") {
        iEmergencyRelation = i;
        break;
      }
    }
  }
  if (iEmergencyPhone < 0) {
    for (let i = 0; i < header.length; i++) {
      if (header[i] === "Emergency Contact Phone") {
        iEmergencyPhone = i;
        break;
      }
    }
  }
  
  console.log(`Column indices: Name=${iName}, EmergencyName=${iEmergencyName}, EmergencyRelation=${iEmergencyRelation}, EmergencyPhone=${iEmergencyPhone}`);
  
  if (iName < 0) {
    throw new Error('Could not find name column');
  }
  
  const dataRows = rows
    .slice(1)
    .filter((r) => r && r.some((c) => String(c ?? "").trim() !== ""))
    .filter((row) => String(row[iName] ?? "").trim() !== "");
  
  // Get unique drivers
  const uniqueDrivers = new Map();
  dataRows.forEach(row => {
    const driverId = row[iName];
    if (driverId && !uniqueDrivers.has(driverId)) {
      uniqueDrivers.set(driverId, row);
    }
  });
  
  const drivers = Array.from(uniqueDrivers.entries()).map(([name, row], idx) => {
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
  
  return drivers;
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
  
  let drivers = buildDrivers(driverRows);
  console.log(`\nBuilt ${drivers.length} drivers`);
  
  // Show first few drivers with emergency data
  console.log("\nFirst 3 drivers with emergency data:");
  drivers.slice(0, 3).forEach(driver => {
    console.log(`  ${driver.id}: ${driver.name}`);
    console.log(`    Emergency: ${driver.emergencyContactName} (${driver.emergencyContactRelationship}) - ${driver.emergencyContactPhone}`);
  });
  
  // Apply patchDriversForJohnCarter
  console.log("\nApplying patchDriversForJohnCarter...");
  drivers = patchDriversForJohnCarter(drivers);
  
  console.log("\nAfter patchDriversForJohnCarter:");
  drivers.slice(0, 3).forEach(driver => {
    console.log(`  ${driver.id}: ${driver.name}`);
    console.log(`    Emergency: ${driver.emergencyContactName} (${driver.emergencyContactRelationship}) - ${driver.emergencyContactPhone}`);
  });
  
  // Apply augmentDriversWithFleetDemoFields
  console.log("\nApplying augmentDriversWithFleetDemoFields...");
  drivers = augmentDriversWithFleetDemoFields(drivers, {});
  
  console.log("\nAfter augmentDriversWithFleetDemoFields:");
  drivers.slice(0, 3).forEach(driver => {
    console.log(`  ${driver.id}: ${driver.name}`);
    console.log(`    Emergency: ${driver.emergencyContactName} (${driver.emergencyContactRelationship}) - ${driver.emergencyContactPhone}`);
    console.log(`    Has emergency data: ${driver.emergencyContactName && driver.emergencyContactName.trim() !== ''}`);
  });
  
} catch (error) {
  console.error("Error:", error.message);
  console.error(error.stack);
}
