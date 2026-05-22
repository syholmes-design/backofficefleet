import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

try {
  console.log(`VERIFICATION OF EMERGENCY CONTACT DOCUMENTS FOR 12 CANONICAL DRIVERS:`);
  
  // Expected data from Master Driver Data
  const expectedData = {
    "DRV-001": { primary: "Sarah Carter (Spouse) - 206-482-0199", secondary: "Mark Carter (Brother) - 216-347-8321" },
    "DRV-002": { primary: "Carlos Lopez (Spouse) - 312-739-4718", secondary: "Rosa Hernandez (Mother) - 312-482-2364" },
    "DRV-003": { primary: "Min-Ji Kim (Spouse) - 404-347-8293", secondary: "Daniel Kim (Brother) - 770-618-4917" },
    "DRV-004": { primary: "Raj Patel (Spouse) - 216-618-3847", secondary: "Anita Sharma (Sister) - 216-739-6102" },
    "DRV-005": { primary: "Yuki Tanaka (Spouse) - 614-823-9012", secondary: "Hiroshi Tanaka (Father) - 614-276-3485" },
    "DRV-006": { primary: "Linda Chen (Spouse) - 214-491-6734", secondary: "Wei Chen (Brother) - 214-384-8923" },
    "DRV-007": { primary: "Miguel Gomez (Father) - 216-276-1482", secondary: "Isabel Torres (Mother) - 216-917-7536" },
    "DRV-008": { primary: "Jessica Smith (Spouse) - 419-384-2938", secondary: "Brian Smith (Brother) - 419-653-6147" },
    "DRV-009": { primary: "Michael Brown (Spouse) - 614-917-7261", secondary: "Laura Davis (Sister) - 614-491-1893" },
    "DRV-010": { primary: "Angela Wilson (Spouse) - 312-653-8145", secondary: "Terrance Wilson (Brother) - 773-823-4628" },
    "DRV-011": { primary: "Vikram Sharma (Spouse) - 404-741-3619", secondary: "Meera Nair (Sister) - 678-294-2740" },
    "DRV-012": { primary: "Karen Johnson (Spouse) - 312-294-5478", secondary: "David Johnson (Brother) - 312-741-9317" }
  };
  
  let correctCount = 0;
  let totalChecked = 0;
  
  for (let i = 1; i <= 12; i++) {
    const driverId = `DRV-${String(i).padStart(3, '0')}`;
    const filePath = path.join(ROOT, "public", "generated", "drivers", driverId, "emergency-contact.html");
    
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");
        
        // Extract primary and secondary contact info
        const primaryMatch = content.match(/<td>Primary Contact<\/td><td>([^<]+)</);
        const secondaryMatch = content.match(/<td>Secondary Contact<\/td><td>([^<]+)</);
        
        const primaryContact = primaryMatch ? primaryMatch[1].trim() : "NOT FOUND";
        const secondaryContact = secondaryMatch ? secondaryMatch[1].trim() : "NOT FOUND";
        
        const expected = expectedData[driverId];
        const primaryCorrect = primaryContact === expected.primary;
        const secondaryCorrect = secondaryContact === expected.secondary;
        
        console.log(`\n${driverId}:`);
        console.log(`  Expected Primary: ${expected.primary}`);
        console.log(`  Actual Primary: ${primaryContact} ${primaryCorrect ? '✅' : '❌'}`);
        console.log(`  Expected Secondary: ${expected.secondary}`);
        console.log(`  Actual Secondary: ${secondaryContact} ${secondaryCorrect ? '✅' : '❌'}`);
        
        if (primaryCorrect && secondaryCorrect) {
          correctCount++;
        }
        
        totalChecked++;
        
        // Check for "Needs review" in contact fields
        const hasNeedsReview = content.includes("Needs review");
        if (hasNeedsReview) {
          console.log(`  ⚠️  Contains "Needs review" (acceptable for email fields with no source data)`);
        }
        
      } else {
        console.log(`\n${driverId}: ❌ File not found: ${filePath}`);
      }
    } catch (error) {
      console.log(`\n${driverId}: ❌ Error reading file: ${error.message}`);
    }
  }
  
  console.log(`\nSUMMARY:`);
  console.log(`- Correct emergency contacts: ${correctCount}/${totalChecked}`);
  console.log(`- Total drivers checked: ${totalChecked}/12`);
  
  if (correctCount === 12) {
    console.log(`\n✅ SUCCESS: All 12 drivers have correct Master Data emergency contacts`);
  } else {
    console.log(`\n❌ ISSUE: Some drivers have incorrect emergency contacts`);
  }
  
} catch (error) {
  console.error("Error:", error.message);
}
