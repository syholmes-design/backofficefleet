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
      primaryEmergencyPhone: "206-482-0199",
      primaryEmergencyEmail: "sarah.carter@gmail.com",
      primaryEmergencyAddress: "1240 W 6th St, Cleveland, OH 44113",
      secondaryEmergencyName: "Mark Carter",
      secondaryEmergencyRelationship: "Brother",
      secondaryEmergencyPhone: "216-347-8321",
      secondaryEmergencyEmail: "mcarter@aol.com",
      secondaryEmergencyAddress: "3920 Lorain Ave, Cleveland, OH 44113"
    },
    "DRV-002": {
      primaryEmergencyName: "Carlos Lopez",
      primaryEmergencyRelationship: "Spouse",
      primaryEmergencyPhone: "312-739-4718",
      primaryEmergencyEmail: "clopez@yahoo.com",
      primaryEmergencyAddress: "450 N Michigan Ave, Chicago, IL 60611",
      secondaryEmergencyName: "Rosa Hernandez",
      secondaryEmergencyRelationship: "Mother",
      secondaryEmergencyPhone: "312-482-2364",
      secondaryEmergencyEmail: "rosa.hernandez@gmail.com",
      secondaryEmergencyAddress: "1835 S Blue Island Ave, Chicago, IL 60608"
    },
    "DRV-003": {
      primaryEmergencyName: "Min-Ji Kim",
      primaryEmergencyRelationship: "Spouse",
      primaryEmergencyPhone: "404-347-8293",
      primaryEmergencyEmail: "minji.kim@hotmail.com",
      primaryEmergencyAddress: "780 Peachtree St, Atlanta, GA 30308",
      secondaryEmergencyName: "Daniel Kim",
      secondaryEmergencyRelationship: "Brother",
      secondaryEmergencyPhone: "770-618-4917",
      secondaryEmergencyEmail: "dkim@yahoo.com",
      secondaryEmergencyAddress: "2145 Buford Hwy, Atlanta, GA 30329"
    },
    "DRV-004": {
      primaryEmergencyName: "Raj Patel",
      primaryEmergencyRelationship: "Spouse",
      primaryEmergencyPhone: "216-618-3847",
      primaryEmergencyEmail: "raj.patel@aol.com",
      primaryEmergencyAddress: "2200 Superior Ave, Cleveland, OH 44114",
      secondaryEmergencyName: "Anita Sharma",
      secondaryEmergencyRelationship: "Sister",
      secondaryEmergencyPhone: "216-739-6102",
      secondaryEmergencyEmail: "anita.sharma@hotmail.com",
      secondaryEmergencyAddress: "1480 E 9th St, Cleveland, OH 44114"
    },
    "DRV-005": {
      primaryEmergencyName: "Yuki Tanaka",
      primaryEmergencyRelationship: "Spouse",
      primaryEmergencyPhone: "614-823-9012",
      primaryEmergencyEmail: "ytanaka@gmail.com",
      primaryEmergencyAddress: "115 E Broad St, Columbus, OH 43215",
      secondaryEmergencyName: "Hiroshi Tanaka",
      secondaryEmergencyRelationship: "Father",
      secondaryEmergencyPhone: "614-276-3485",
      secondaryEmergencyEmail: "htanaka@aol.com",
      secondaryEmergencyAddress: "445 N High St, Columbus, OH 43215"
    },
    "DRV-006": {
      primaryEmergencyName: "Linda Chen",
      primaryEmergencyRelationship: "Spouse",
      primaryEmergencyPhone: "214-491-6734",
      primaryEmergencyEmail: "linda.chen@yahoo.com",
      primaryEmergencyAddress: "500 Pacific Ave, Dallas, TX 75202",
      secondaryEmergencyName: "Wei Chen",
      secondaryEmergencyRelationship: "Brother",
      secondaryEmergencyPhone: "214-384-8923",
      secondaryEmergencyEmail: "wei.chen@gmail.com",
      secondaryEmergencyAddress: "2727 Commerce St, Dallas, TX 75226"
    },
    "DRV-007": {
      primaryEmergencyName: "Miguel Gomez",
      primaryEmergencyRelationship: "Father",
      primaryEmergencyPhone: "216-276-1482",
      primaryEmergencyEmail: "mgomez@hotmail.com",
      primaryEmergencyAddress: "2847 Clark Ave, Cleveland, OH 44109",
      secondaryEmergencyName: "Isabel Torres",
      secondaryEmergencyRelationship: "Mother",
      secondaryEmergencyPhone: "216-917-7536",
      secondaryEmergencyEmail: "itorres@yahoo.com",
      secondaryEmergencyAddress: "4310 Lorain Ave, Cleveland, OH 44113"
    },
    "DRV-008": {
      primaryEmergencyName: "Jessica Smith",
      primaryEmergencyRelationship: "Spouse",
      primaryEmergencyPhone: "419-384-2938",
      primaryEmergencyEmail: "jessica.smith@gmail.com",
      primaryEmergencyAddress: "240 Madison Ave, Toledo, OH 43604",
      secondaryEmergencyName: "Brian Smith",
      secondaryEmergencyRelationship: "Brother",
      secondaryEmergencyPhone: "419-653-6147",
      secondaryEmergencyEmail: "brian.smith@hotmail.com",
      secondaryEmergencyAddress: "520 Jefferson Ave, Toledo, OH 43604"
    },
    "DRV-009": {
      primaryEmergencyName: "Michael Brown",
      primaryEmergencyRelationship: "Spouse",
      primaryEmergencyPhone: "614-917-7261",
      primaryEmergencyEmail: "mbrown@aol.com",
      primaryEmergencyAddress: "330 Civic Center Dr, Columbus, OH 43215",
      secondaryEmergencyName: "Laura Davis",
      secondaryEmergencyRelationship: "Sister",
      secondaryEmergencyPhone: "614-491-1893",
      secondaryEmergencyEmail: "ldavis@gmail.com",
      secondaryEmergencyAddress: "175 S 3rd St, Columbus, OH 43215"
    },
    "DRV-010": {
      primaryEmergencyName: "Angela Wilson",
      primaryEmergencyRelationship: "Spouse",
      primaryEmergencyPhone: "312-653-8145",
      primaryEmergencyEmail: "angela.wilson@yahoo.com",
      primaryEmergencyAddress: "110 W Adams St, Chicago, IL 60603",
      secondaryEmergencyName: "Terrance Wilson",
      secondaryEmergencyRelationship: "Brother",
      secondaryEmergencyPhone: "773-823-4628",
      secondaryEmergencyEmail: "terrance.wilson@aol.com",
      secondaryEmergencyAddress: "7830 S Cottage Grove Ave, Chicago, IL 60619"
    },
    "DRV-011": {
      primaryEmergencyName: "Vikram Sharma",
      primaryEmergencyRelationship: "Spouse",
      primaryEmergencyPhone: "404-741-3619",
      primaryEmergencyEmail: "vsharma@gmail.com",
      primaryEmergencyAddress: "600 Peachtree St, Atlanta, GA 30308",
      secondaryEmergencyName: "Meera Nair",
      secondaryEmergencyRelationship: "Sister",
      secondaryEmergencyPhone: "678-294-2740",
      secondaryEmergencyEmail: "mnair@hotmail.com",
      secondaryEmergencyAddress: "1255 Ponce De Leon Ave, Atlanta, GA 30306"
    },
    "DRV-012": {
      primaryEmergencyName: "Karen Johnson",
      primaryEmergencyRelationship: "Spouse",
      primaryEmergencyPhone: "312-294-5478",
      primaryEmergencyEmail: "karen.johnson@hotmail.com",
      primaryEmergencyAddress: "618 S Michigan Ave, Chicago, IL 60605",
      secondaryEmergencyName: "David Johnson",
      secondaryEmergencyRelationship: "Brother",
      secondaryEmergencyPhone: "312-741-9317",
      secondaryEmergencyEmail: "david.johnson@yahoo.com",
      secondaryEmergencyAddress: "425 S Wabash Ave, Chicago, IL 60605"
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
