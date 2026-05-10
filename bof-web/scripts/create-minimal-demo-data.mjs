import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEMO_DATA_PATH = path.join(ROOT, "lib", "demo-data.json");

try {
  // Read the current demo data
  const currentData = JSON.parse(fs.readFileSync(DEMO_DATA_PATH, "utf8"));
  
  // Create minimal demo data with only the first 12 drivers and limited documents
  const minimalData = {
    drivers: currentData.drivers.slice(0, 12),
    documents: currentData.documents.slice(0, 100), // Limit to 100 documents
    complianceIncidents: [
      {
        id: "COMP-001",
        incidentId: "COMP-001",
        driverId: "DRV-001",
        type: "Safety",
        status: "OPEN",
        severity: "LOW",
        date: "2026-01-15",
        description: "Minor safety incident",
        reportedDate: "2026-01-15",
        resolvedDate: null,
        loadId: "L001"
      },
      {
        id: "COMP-002",
        incidentId: "COMP-002", 
        driverId: "DRV-002",
        type: "Safety",
        status: "CLOSED",
        severity: "MEDIUM",
        date: "2026-01-10",
        description: "Resolved safety issue",
        reportedDate: "2026-01-10",
        resolvedDate: "2026-01-12",
        loadId: "L002"
      }
    ],
    loads: currentData.loads.slice(0, 10),
    driverMedicalExpanded: currentData.driverMedicalExpanded,
    settlements: currentData.settlements,
    moneyAtRisk: [
      {
        id: "MAR-001",
        driverId: "DRV-001",
        amount: 1500,
        status: "OPEN",
        date: "2026-01-15",
        description: "Fuel discrepancy",
        rootCause: "Fuel card usage error",
        loadId: "L001",
        reportedDate: "2026-01-15",
        resolvedDate: null,
        category: "Fuel",
        owner: "Fuel Vendor"
      },
      {
        id: "MAR-002",
        driverId: "DRV-002",
        amount: 750,
        status: "CLOSED",
        date: "2026-01-10",
        description: "Minor damage",
        rootCause: "Backing into barrier",
        loadId: "L002",
        reportedDate: "2026-01-10",
        resolvedDate: "2026-01-12",
        category: "Damage",
        owner: "Repair Shop"
      }
    ],
    loadProofBundles: {
      "L001": {
        loadId: "L001",
        documents: ["doc1", "doc2"],
        uploadedAt: "2026-01-15T10:00:00Z"
      },
      "L002": {
        loadId: "L002", 
        documents: ["doc3", "doc4"],
        uploadedAt: "2026-01-10T15:30:00Z"
      }
    }
  };
  
  // Write the minimal demo data
  fs.writeFileSync(DEMO_DATA_PATH, JSON.stringify(minimalData), "utf8");
  
  console.log(`✅ Created minimal demo data:`);
  console.log(`  - Drivers: ${minimalData.drivers.length}`);
  console.log(`  - Documents: ${minimalData.documents.length}`);
  console.log(`  - Compliance Incidents: ${minimalData.complianceIncidents.length}`);
  console.log(`  - Loads: ${minimalData.loads.length}`);
  
  // Verify Master Data is preserved
  const firstDriver = minimalData.drivers[0];
  const hasPrimaryData = firstDriver.primaryEmergencyName && firstDriver.primaryEmergencyName.trim() !== '';
  const hasSecondaryData = firstDriver.secondaryEmergencyName && firstDriver.secondaryEmergencyName.trim() !== '';
  
  if (hasPrimaryData && hasSecondaryData) {
    console.log(`✅ Master Data preserved in minimal demo data`);
    console.log(`  First driver: ${firstDriver.primaryEmergencyName} (${firstDriver.primaryEmergencyRelationship})`);
    console.log(`  Secondary: ${firstDriver.secondaryEmergencyName} (${firstDriver.secondaryEmergencyRelationship})`);
  } else {
    console.log(`❌ Master Data lost in minimal demo data`);
  }
  
} catch (error) {
  console.error("Error creating minimal demo data:", error.message);
}
