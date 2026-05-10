import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEMO_DATA_PATH = path.join(ROOT, "lib", "demo-data.json");

try {
  const demoData = JSON.parse(fs.readFileSync(DEMO_DATA_PATH, "utf8"));
  
  console.log(`DEMO DATA ANALYSIS:`);
  console.log(`Total drivers: ${demoData.drivers.length}`);
  
  // Check first driver structure
  const firstDriver = demoData.drivers[0];
  console.log(`\nFirst driver (${firstDriver.id}):`);
  console.log(`  Name: ${firstDriver.name}`);
  
  // Check for Master Driver Data fields
  const masterDataFields = [
    'primaryEmergencyName',
    'primaryEmergencyRelationship', 
    'primaryEmergencyPhone',
    'primaryEmergencyEmail',
    'secondaryEmergencyName',
    'secondaryEmergencyRelationship',
    'secondaryEmergencyPhone',
    'secondaryEmergencyEmail'
  ];
  
  console.log(`\nMaster Driver Data fields in first driver:`);
  masterDataFields.forEach(field => {
    const value = firstDriver[field];
    console.log(`  ${field}: ${value || '(missing)'}`);
  });
  
  // Check old emergency contact fields
  console.log(`\nOld emergency contact fields in first driver:`);
  console.log(`  emergencyContactName: ${firstDriver.emergencyContactName || '(missing)'}`);
  console.log(`  emergencyContactRelationship: ${firstDriver.emergencyContactRelationship || '(missing)'}`);
  console.log(`  emergencyContactPhone: ${firstDriver.emergencyContactPhone || '(missing)'}`);
  
  // Check if any driver has Master Data fields
  console.log(`\nChecking all drivers for Master Data fields:`);
  let driversWithMasterData = 0;
  demoData.drivers.forEach(driver => {
    const hasMasterData = driver.primaryEmergencyName || driver.secondaryEmergencyName;
    if (hasMasterData) {
      driversWithMasterData++;
    }
  });
  
  console.log(`  Drivers with Master Data fields: ${driversWithMasterData}/${demoData.drivers.length}`);
  
  if (driversWithMasterData === 0) {
    console.log(`\n❌ ISSUE IDENTIFIED: Master Driver Data fields not in final demo data file`);
    console.log(`   The data is being lost between build process and final file write`);
  }
  
} catch (error) {
  console.error("Error reading demo data:", error.message);
}
