import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEMO_DATA_PATH = path.join(ROOT, "lib", "demo-data.json");

try {
  const demoData = JSON.parse(fs.readFileSync(DEMO_DATA_PATH, "utf8"));
  
  console.log(`FINAL DEMO DATA ANALYSIS:`);
  console.log(`Total drivers: ${demoData.drivers.length}`);
  
  // Check first few drivers for Master Data fields
  console.log(`\nChecking first 3 drivers for Master Data fields:`);
  demoData.drivers.slice(0, 3).forEach((driver, idx) => {
    console.log(`\nDriver ${idx + 1} (${driver.id}):`);
    console.log(`  Name: ${driver.name}`);
    
    // Check Master Data fields
    const primaryName = driver.primaryEmergencyName;
    const secondaryName = driver.secondaryEmergencyName;
    
    console.log(`  Primary Emergency Name: ${primaryName || '(missing)'}`);
    console.log(`  Secondary Emergency Name: ${secondaryName || '(missing)'}`);
    
    if (primaryName || secondaryName) {
      console.log(`  ✅ HAS MASTER DATA`);
    } else {
      console.log(`  ❌ NO MASTER DATA`);
    }
  });
  
  // Count drivers with Master Data
  let driversWithMasterData = 0;
  demoData.drivers.forEach(driver => {
    if (driver.primaryEmergencyName || driver.secondaryEmergencyName) {
      driversWithMasterData++;
    }
  });
  
  console.log(`\nSUMMARY:`);
  console.log(`Drivers with Master Data: ${driversWithMasterData}/${demoData.drivers.length}`);
  
  if (driversWithMasterData === 0) {
    console.log(`\n❌ Master Data still not in final demo data file`);
    console.log(`   Need to investigate the build-demo-data.mjs write process`);
  } else {
    console.log(`\n✅ Master Data found in final demo data file`);
  }
  
} catch (error) {
  console.error("Error reading demo data:", error.message);
}
