import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEMO_DATA_PATH = path.join(ROOT, "lib", "demo-data.json");

try {
  const demoData = JSON.parse(fs.readFileSync(DEMO_DATA_PATH, "utf8"));
  
  console.log(`FINAL DEMO DATA VERIFICATION:`);
  console.log(`Total drivers: ${demoData.drivers.length}`);
  
  // Check the first 12 drivers for Master Data fields
  console.log(`\nChecking first 12 drivers for Master Data fields:`);
  let driversWithMasterData = 0;
  
  demoData.drivers.slice(0, 12).forEach((driver, idx) => {
    const primaryName = driver.primaryEmergencyName;
    const secondaryName = driver.secondaryEmergencyName;
    
    console.log(`\nDriver ${idx + 1} (${driver.id}):`);
    console.log(`  Name: ${driver.name}`);
    console.log(`  Primary Emergency Name: ${primaryName || '(missing)'}`);
    console.log(`  Secondary Emergency Name: ${secondaryName || '(missing)'}`);
    
    if (primaryName || secondaryName) {
      driversWithMasterData++;
      console.log(`  ✅ HAS MASTER DATA`);
    } else {
      console.log(`  ❌ NO MASTER DATA`);
    }
  });
  
  console.log(`\nSUMMARY:`);
  console.log(`Drivers with Master Data: ${driversWithMasterData}/12`);
  
  if (driversWithMasterData === 12) {
    console.log(`\n✅ SUCCESS: All 12 drivers have Master Data in demo data file`);
  } else {
    console.log(`\n❌ ISSUE: Not all drivers have Master Data`);
  }
  
} catch (error) {
  console.error("Error reading demo data:", error.message);
}
