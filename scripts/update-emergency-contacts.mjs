import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DEMO_DATA_PATH = path.join(ROOT, "lib", "demo-data.json");

try {
  const demoData = JSON.parse(fs.readFileSync(DEMO_DATA_PATH, "utf8"));
  
  // Emergency contact data provided by user
  const emergencyContactData = {
    "DRV-001": {
      primaryEmergencyName: "Sarah Carter",
      primaryEmergencyRelationship: "Spouse",
      primaryEmergencyPhone: "206-555-0100",
      primaryEmergencyEmail: "sarah.carter@example.com",
      primaryEmergencyAddress: "220 Demo Street, Cleveland, OH 44113",
      secondaryEmergencyName: "Mark Carter",
      secondaryEmergencyRelationship: "Brother",
      secondaryEmergencyPhone: "216-555-0101",
      secondaryEmergencyEmail: "mcarter@example.com",
      secondaryEmergencyAddress: "680 Demo Street, Cleveland, OH 44113"
    },
    "DRV-002": {
      primaryEmergencyName: "Carlos Lopez",
      primaryEmergencyRelationship: "Spouse",
      primaryEmergencyPhone: "312-555-0107",
      primaryEmergencyEmail: "clopez@example.com",
      primaryEmergencyAddress: "770 Demo Street, Chicago, IL 60611",
      secondaryEmergencyName: "Rosa Hernandez",
      secondaryEmergencyRelationship: "Mother",
      secondaryEmergencyPhone: "312-555-0104",
      secondaryEmergencyEmail: "rosa.hernandez@example.com",
      secondaryEmergencyAddress: "380 Demo Street, Chicago, IL 60608"
    },
    "DRV-003": {
      primaryEmergencyName: "Min-Ji Kim",
      primaryEmergencyRelationship: "Spouse",
      primaryEmergencyPhone: "404-555-0101",
      primaryEmergencyEmail: "minji.kim@example.com",
      primaryEmergencyAddress: "960 Demo Street, Atlanta, GA 30308",
      secondaryEmergencyName: "Daniel Kim",
      secondaryEmergencyRelationship: "Brother",
      secondaryEmergencyPhone: "770-555-0100",
      secondaryEmergencyEmail: "dkim@example.com",
      secondaryEmergencyAddress: "500 Demo Street, Atlanta, GA 30329"
    },
    "DRV-004": {
      primaryEmergencyName: "Raj Patel",
      primaryEmergencyRelationship: "Spouse",
      primaryEmergencyPhone: "216-555-0106",
      primaryEmergencyEmail: "raj.patel@example.com",
      primaryEmergencyAddress: "520 Demo Street, Cleveland, OH 44114",
      secondaryEmergencyName: "Anita Sharma",
      secondaryEmergencyRelationship: "Sister",
      secondaryEmergencyPhone: "216-555-0107",
      secondaryEmergencyEmail: "anita.sharma@example.com",
      secondaryEmergencyAddress: "260 Demo Street, Cleveland, OH 44114"
    },
    "DRV-005": {
      primaryEmergencyName: "Yuki Tanaka",
      primaryEmergencyRelationship: "Spouse",
      primaryEmergencyPhone: "614-555-0108",
      primaryEmergencyEmail: "ytanaka@example.com",
      primaryEmergencyAddress: "150 Demo Street, Columbus, OH 43215",
      secondaryEmergencyName: "Hiroshi Tanaka",
      secondaryEmergencyRelationship: "Father",
      secondaryEmergencyPhone: "614-555-0102",
      secondaryEmergencyEmail: "htanaka@example.com",
      secondaryEmergencyAddress: "750 Demo Street, Columbus, OH 43215"
    },
    "DRV-006": {
      primaryEmergencyName: "Linda Chen",
      primaryEmergencyRelationship: "Spouse",
      primaryEmergencyPhone: "214-555-0102",
      primaryEmergencyEmail: "linda.chen@example.com",
      primaryEmergencyAddress: "810 Demo Street, Dallas, TX 75202",
      secondaryEmergencyName: "Wei Chen",
      secondaryEmergencyRelationship: "Brother",
      secondaryEmergencyPhone: "214-555-0100",
      secondaryEmergencyEmail: "wei.chen@example.com",
      secondaryEmergencyAddress: "570 Demo Street, Dallas, TX 75226"
    },
    "DRV-007": {
      primaryEmergencyName: "Miguel Gomez",
      primaryEmergencyRelationship: "Father",
      primaryEmergencyPhone: "216-555-0100",
      primaryEmergencyEmail: "mgomez@example.com",
      primaryEmergencyAddress: "590 Demo Street, Cleveland, OH 44109",
      secondaryEmergencyName: "Isabel Torres",
      secondaryEmergencyRelationship: "Mother",
      secondaryEmergencyPhone: "216-555-0108",
      secondaryEmergencyEmail: "itorres@example.com",
      secondaryEmergencyAddress: "720 Demo Street, Cleveland, OH 44113"
    },
    "DRV-008": {
      primaryEmergencyName: "Jessica Smith",
      primaryEmergencyRelationship: "Spouse",
      primaryEmergencyPhone: "419-555-0101",
      primaryEmergencyEmail: "jessica.smith@example.com",
      primaryEmergencyAddress: "530 Demo Street, Toledo, OH 43604",
      secondaryEmergencyName: "Brian Smith",
      secondaryEmergencyRelationship: "Brother",
      secondaryEmergencyPhone: "419-555-0103",
      secondaryEmergencyEmail: "brian.smith@example.com",
      secondaryEmergencyAddress: "820 Demo Street, Toledo, OH 43604"
    },
    "DRV-009": {
      primaryEmergencyName: "Michael Brown",
      primaryEmergencyRelationship: "Spouse",
      primaryEmergencyPhone: "614-555-0112",
      primaryEmergencyEmail: "mbrown@example.com",
      primaryEmergencyAddress: "630 Demo Street, Columbus, OH 43215",
      secondaryEmergencyName: "Laura Davis",
      secondaryEmergencyRelationship: "Sister",
      secondaryEmergencyPhone: "614-555-0103",
      secondaryEmergencyEmail: "ldavis@example.com",
      secondaryEmergencyAddress: "360 Demo Street, Columbus, OH 43215"
    },
    "DRV-010": {
      primaryEmergencyName: "Angela Wilson",
      primaryEmergencyRelationship: "Spouse",
      primaryEmergencyPhone: "312-555-0105",
      primaryEmergencyEmail: "angela.wilson@example.com",
      primaryEmergencyAddress: "130 Demo Street, Chicago, IL 60603",
      secondaryEmergencyName: "Terrance Wilson",
      secondaryEmergencyRelationship: "Brother",
      secondaryEmergencyPhone: "773-555-0104",
      secondaryEmergencyEmail: "terrance.wilson@example.com",
      secondaryEmergencyAddress: "970 Demo Street, Chicago, IL 60619"
    },
    "DRV-011": {
      primaryEmergencyName: "Vikram Sharma",
      primaryEmergencyRelationship: "Spouse",
      primaryEmergencyPhone: "404-555-0108",
      primaryEmergencyEmail: "vsharma@example.com",
      primaryEmergencyAddress: "900 Demo Street, Atlanta, GA 30308",
      secondaryEmergencyName: "Meera Nair",
      secondaryEmergencyRelationship: "Sister",
      secondaryEmergencyPhone: "678-555-0100",
      secondaryEmergencyEmail: "mnair@example.com",
      secondaryEmergencyAddress: "230 Demo Street, Atlanta, GA 30306"
    },
    "DRV-012": {
      primaryEmergencyName: "Karen Johnson",
      primaryEmergencyRelationship: "Spouse",
      primaryEmergencyPhone: "312-555-0102",
      primaryEmergencyEmail: "karen.johnson@example.com",
      primaryEmergencyAddress: "920 Demo Street, Chicago, IL 60605",
      secondaryEmergencyName: "David Johnson",
      secondaryEmergencyRelationship: "Brother",
      secondaryEmergencyPhone: "312-555-0108",
      secondaryEmergencyEmail: "david.johnson@example.com",
      secondaryEmergencyAddress: "710 Demo Street, Chicago, IL 60605"
    }
  };
  
  // Update emergency contact data for all drivers
  demoData.drivers.forEach(driver => {
    const contactData = emergencyContactData[driver.id];
    if (contactData) {
      Object.assign(driver, contactData);
    }
  });
  
  // Write back to file
  fs.writeFileSync(DEMO_DATA_PATH, JSON.stringify(demoData), "utf8");
  
  console.log(`✅ Updated emergency contact data for all 12 drivers`);
  console.log(`  - Added complete primary and secondary contact information`);
  console.log(`  - Added email addresses for all contacts`);
  console.log(`  - Added complete addresses for all contacts`);
  
} catch (error) {
  console.error("Error:", error.message);
}
