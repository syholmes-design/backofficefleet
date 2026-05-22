import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEMO_DATA_PATH = path.join(ROOT, "lib", "demo-data.json");

try {
  const demoData = JSON.parse(fs.readFileSync(DEMO_DATA_PATH, "utf8"));
  
  console.log(`VERIFICATION OF 12 CANONICAL DEMO DRIVERS:`);
  console.log(`Total drivers in demo data: ${demoData.drivers.length}`);
  
  // Check for DRV-001 through DRV-012
  const expectedDrivers = [];
  for (let i = 1; i <= 12; i++) {
    const driverId = `DRV-${String(i).padStart(3, '0')}`;
    const driver = demoData.drivers.find(d => d.id === driverId);
    
    if (driver) {
      const hasPrimary = driver.primaryEmergencyName && driver.primaryEmergencyName.trim() !== '';
      const hasSecondary = driver.secondaryEmergencyName && driver.secondaryEmergencyName.trim() !== '';
      
      expectedDrivers.push({
        id: driverId,
        name: driver.name,
        primaryEmergencyName: driver.primaryEmergencyName,
        primaryEmergencyRelationship: driver.primaryEmergencyRelationship,
        primaryEmergencyPhone: driver.primaryEmergencyPhone,
        secondaryEmergencyName: driver.secondaryEmergencyName,
        secondaryEmergencyRelationship: driver.secondaryEmergencyRelationship,
        secondaryEmergencyPhone: driver.secondaryEmergencyPhone,
        hasPrimary,
        hasSecondary
      });
      
      console.log(`✅ ${driverId}: ${driver.name}`);
      console.log(`   Primary: ${driver.primaryEmergencyName} (${driver.primaryEmergencyRelationship}) - ${driver.primaryEmergencyPhone}`);
      console.log(`   Secondary: ${driver.secondaryEmergencyName} (${driver.secondaryEmergencyRelationship}) - ${driver.secondaryEmergencyPhone}`);
    } else {
      console.log(`❌ ${driverId}: NOT FOUND`);
    }
  }
  
  // Summary
  const foundDrivers = expectedDrivers.filter(d => d.id);
  const driversWithPrimary = expectedDrivers.filter(d => d.hasPrimary);
  const driversWithSecondary = expectedDrivers.filter(d => d.hasSecondary);
  
  console.log(`\nSUMMARY:`);
  console.log(`- Found drivers: ${foundDrivers.length}/12`);
  console.log(`- With primary emergency contact: ${driversWithPrimary.length}/12`);
  console.log(`- With secondary emergency contact: ${driversWithSecondary.length}/12`);
  
  if (foundDrivers.length === 12 && driversWithPrimary.length === 12 && driversWithSecondary.length === 12) {
    console.log(`\n✅ SUCCESS: All 12 canonical drivers have Master Data emergency contacts`);
  } else {
    console.log(`\n❌ ISSUE: Not all drivers have complete Master Data`);
  }
  
} catch (error) {
  console.error("Error:", error.message);
}
