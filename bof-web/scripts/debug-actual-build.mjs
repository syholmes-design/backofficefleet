// This is a modified version of the actual build script to debug the issue
import { resolveMainSourceXlsxPath } from "./lib/main-source-path.mjs";
import { patchDriversForJohnCarter, augmentDriversWithFleetDemoFields } from "./lib/john-carter-stack.mjs";
import XLSX from "xlsx";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.join(ROOT, "lib", "demo-data.json");

// Copy all the functions from build-demo-data.mjs
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
  const iEmergencyPhone = findCol(header, ["emergency contact phone", "emergencycontactphone", "emergency phone"]);
  
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
  
  if (iName < 0) {
    throw new Error('Could not find name column');
  }
  
  const dataRows = rows
    .slice(1)
    .filter((r) => r && r.some((c) => String(c ?? "").trim() !== ""))
    .filter((row) => String(row[iName] ?? "").trim() !== "");
  
  // Get unique drivers by Driver ID column if available, otherwise by name
  const uniqueDrivers = new Map();
  dataRows.forEach(row => {
    const driverId = row[0]; // Driver ID column
    const name = row[iName];
    if (driverId && name && !uniqueDrivers.has(driverId)) {
      uniqueDrivers.set(driverId, row);
    }
  });
  
  const drivers = Array.from(uniqueDrivers.entries()).map(([driverId, row], idx) => {
    const name = String(row[iName] ?? "").trim();
    const address = iAddr >= 0 ? String(row[iAddr] ?? "").trim() : "";
    const phone = iPhone >= 0 ? String(row[iPhone] ?? "").trim() : "";
    let email = iEmail >= 0 ? String(row[iEmail] ?? "").trim() : "";
    if (!email) email = `${name.toLowerCase().replace(/\s+/g, '.')}@boftransport.demo`;
    
    // Add emergency contact data
    const emergencyContactName = iEmergencyName >= 0 ? String(row[iEmergencyName] ?? "").trim() : "";
    const emergencyContactRelationship = iEmergencyRelation >= 0 ? String(row[iEmergencyRelation] ?? "").trim() : "";
    const emergencyContactPhone = iEmergencyPhone >= 0 ? String(row[iEmergencyPhone] ?? "").trim() : "";
    
    return {
      id: driverId,
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

function buildEmergencyContacts(workbook) {
  const emergencyContacts = new Map();
  
  // Read emergency contacts from Master Driver Data sheet
  const masterSheet = workbook.Sheets["Master Driver Data"];
  if (masterSheet) {
    const masterData = XLSX.utils.sheet_to_json(masterSheet, { defval: "" });
    
    // Find rows that contain emergency contact data (rows with Driver ID in __EMPTY column)
    const contactRows = masterData.filter(row => 
      row["__EMPTY"] && String(row["__EMPTY"]).startsWith("DRV-")
    );
    
    for (const row of contactRows) {
      const driverId = String(row["__EMPTY"]);
      
      // Primary emergency contact (columns 23-26)
      const primaryName = String(row["__EMPTY_23"] || "").trim();
      const primaryRelationship = String(row["__EMPTY_24"] || "").trim();
      const primaryPhone = String(row["__EMPTY_25"] || "").trim();
      const primaryEmail = String(row["__EMPTY_26"] || "").trim();
      const primaryAddress = [
        String(row["__EMPTY_27"] || "").trim(),
        String(row["__EMPTY_28"] || "").trim(),
        String(row["__EMPTY_29"] || "").trim(),
        String(row["__EMPTY_30"] || "").trim()
      ].filter(part => part).join(", ");
      
      // Secondary emergency contact (columns 31-34)
      const secondaryName = String(row["__EMPTY_31"] || "").trim();
      const secondaryRelationship = String(row["__EMPTY_32"] || "").trim();
      const secondaryPhone = String(row["__EMPTY_33"] || "").trim();
      const secondaryEmail = String(row["__EMPTY_34"] || "").trim();
      const secondaryAddress = [
        String(row["__EMPTY_35"] || "").trim(),
        String(row["__EMPTY_36"] || "").trim(),
        String(row["__EMPTY_37"] || "").trim(),
        String(row["__EMPTY_38"] || "").trim()
      ].filter(part => part).join(", ");
      
      emergencyContacts.set(driverId, {
        primaryEmergencyName: primaryName,
        primaryEmergencyRelationship: primaryRelationship,
        primaryEmergencyPhone: primaryPhone,
        primaryEmergencyEmail: primaryEmail,
        primaryEmergencyAddress: primaryAddress,
        secondaryEmergencyName: secondaryName,
        secondaryEmergencyRelationship: secondaryRelationship,
        secondaryEmergencyPhone: secondaryPhone,
        secondaryEmergencyEmail: secondaryEmail,
        secondaryEmergencyAddress: secondaryAddress,
      });
    }
  }
  
  return emergencyContacts;
}

try {
  console.log(`DEBUG ACTUAL BUILD: Starting build process`);
  
  const XLSX_PATH = resolveMainSourceXlsxPath(ROOT);
  const workbook = XLSX.readFile(XLSX_PATH);
  
  const hasDriversSheet = workbook.SheetNames.includes("Driver Data") || workbook.SheetNames.includes("Drivers_Clean");
  const hasDocumentsSheet = workbook.SheetNames.includes("Documents") || workbook.SheetNames.includes("Documents_Clean");
  
  let drivers;
  let documents;
  let complianceIncidents;
  let expectedBase = 0;
  
  // Build emergency contacts data from Master Driver Data sheet
  const emergencyContacts = buildEmergencyContacts(workbook);
  console.log(`DEBUG: Built emergency contacts for ${emergencyContacts.size} drivers`);
  
  if (hasDriversSheet && hasDocumentsSheet) {
    // Use Driver Data sheet if available (v2 format), otherwise fall back to Drivers_Clean
    const driverSheetName = workbook.SheetNames.includes("Driver Data") ? "Driver Data" : "Drivers_Clean";
    const driverRows = XLSX.utils.sheet_to_json(workbook.Sheets[driverSheetName], { header: 1, defval: "" });
    drivers = buildDrivers(driverRows);
    console.log(`DEBUG: Built ${drivers.length} drivers from ${driverSheetName}`);
    
    // Merge emergency contacts data into drivers
    for (const driver of drivers) {
      const contactData = emergencyContacts.get(driver.id);
      if (contactData) {
        Object.assign(driver, contactData);
      }
    }
    console.log(`DEBUG: Merged emergency contacts into drivers`);
    
    // Check first driver after merge
    const firstDriver = drivers[0];
    console.log(`DEBUG: First driver after merge:`);
    console.log(`  ${firstDriver.id}: ${firstDriver.name}`);
    console.log(`  Primary: ${firstDriver.primaryEmergencyName} (${firstDriver.primaryEmergencyRelationship}) - ${firstDriver.primaryEmergencyPhone}`);
    console.log(`  Secondary: ${firstDriver.secondaryEmergencyName} (${firstDriver.secondaryEmergencyRelationship}) - ${firstDriver.secondaryEmergencyPhone}`);
    
    drivers = patchDriversForJohnCarter(drivers);
    console.log(`DEBUG: Applied patchDriversForJohnCarter`);
    
    // Check first driver after patch
    const patchedDriver = drivers[0];
    console.log(`DEBUG: First driver after patch:`);
    console.log(`  ${patchedDriver.id}: ${patchedDriver.name}`);
    console.log(`  Primary: ${patchedDriver.primaryEmergencyName} (${patchedDriver.primaryEmergencyRelationship}) - ${patchedDriver.primaryEmergencyPhone}`);
    console.log(`  Secondary: ${patchedDriver.secondaryEmergencyName} (${patchedDriver.secondaryEmergencyRelationship}) - ${patchedDriver.secondaryEmergencyPhone}`);
    
    // Simple documents array for test
    documents = [];
    complianceIncidents = [];
    expectedBase = drivers.length * 7; // Simplified
  }
  
  // Apply augmentDriversWithFleetDemoFields
  if (drivers && drivers.length > 0) {
    drivers = augmentDriversWithFleetDemoFields(drivers, {});
    console.log(`DEBUG: Applied augmentDriversWithFleetDemoFields`);
  } else {
    console.log(`DEBUG: Skipped augmentDriversWithFleetDemoFields - no drivers`);
  }
  
  // Check first driver after augment
  const augmentedDriver = drivers[0];
  console.log(`DEBUG: First driver after augment:`);
  console.log(`  ${augmentedDriver.id}: ${augmentedDriver.name}`);
  console.log(`  Primary: ${augmentedDriver.primaryEmergencyName} (${augmentedDriver.primaryEmergencyRelationship}) - ${augmentedDriver.primaryEmergencyPhone}`);
  console.log(`  Secondary: ${augmentedDriver.secondaryEmergencyName} (${augmentedDriver.secondaryEmergencyRelationship}) - ${augmentedDriver.secondaryEmergencyPhone}`);
  
  // Create the output object exactly like the real build script
  const out = {
    drivers,
    documents,
    complianceIncidents,
    loads: [],
  };
  
  console.log(`DEBUG: About to write to ${OUT_PATH}`);
  console.log(`DEBUG: Drivers object has ${drivers.length} drivers`);
  console.log(`DEBUG: First driver in out object:`);
  console.log(`  ${out.drivers[0].id}: ${out.drivers[0].name}`);
  console.log(`  Primary: ${out.drivers[0].primaryEmergencyName} (${out.drivers[0].primaryEmergencyRelationship}) - ${out.drivers[0].primaryEmergencyPhone}`);
  console.log(`  Secondary: ${out.drivers[0].secondaryEmergencyName} (${out.drivers[0].secondaryEmergencyRelationship}) - ${out.drivers[0].secondaryEmergencyPhone}`);
  
  // Write the file
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2), "utf8");
  console.log(`DEBUG: Wrote to ${OUT_PATH}`);
  
  // Read it back to verify
  const writtenData = JSON.parse(fs.readFileSync(OUT_PATH, "utf8"));
  const writtenDriver = writtenData.drivers[0];
  
  console.log(`DEBUG: Verification - first driver from written file:`);
  console.log(`  ${writtenDriver.id}: ${writtenDriver.name}`);
  console.log(`  Primary: ${writtenDriver.primaryEmergencyName} (${writtenDriver.primaryEmergencyRelationship}) - ${writtenDriver.primaryEmergencyPhone}`);
  console.log(`  Secondary: ${writtenDriver.secondaryEmergencyName} (${writtenDriver.secondaryEmergencyRelationship}) - ${writtenDriver.secondaryEmergencyPhone}`);
  
  const hasPrimaryData = writtenDriver.primaryEmergencyName && writtenDriver.primaryEmergencyName.trim() !== '';
  const hasSecondaryData = writtenDriver.secondaryEmergencyName && writtenDriver.secondaryEmergencyName.trim() !== '';
  
  if (hasPrimaryData && hasSecondaryData) {
    console.log(`\n✅ DEBUG SUCCESS: Master Data written and preserved correctly`);
  } else {
    console.log(`\n❌ DEBUG FAILURE: Master Data lost during write process`);
  }
  
} catch (error) {
  console.error("Error:", error.message);
  console.error(error.stack);
}
