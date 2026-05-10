import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

try {
  console.log(`VERIFICATION OF EMAIL ADDRESSES FOR ALL 12 DRIVERS:`);
  
  // Expected email data
  const expectedEmails = {
    "DRV-001": { primary: "sarah.carter@gmail.com", secondary: "mcarter@aol.com" },
    "DRV-002": { primary: "clopez@yahoo.com", secondary: "rosa.hernandez@gmail.com" },
    "DRV-003": { primary: "minji.kim@hotmail.com", secondary: "dkim@yahoo.com" },
    "DRV-004": { primary: "raj.patel@aol.com", secondary: "anita.sharma@hotmail.com" },
    "DRV-005": { primary: "ytanaka@gmail.com", secondary: "htanaka@aol.com" },
    "DRV-006": { primary: "linda.chen@yahoo.com", secondary: "wei.chen@gmail.com" },
    "DRV-007": { primary: "mgomez@hotmail.com", secondary: "itorres@yahoo.com" },
    "DRV-008": { primary: "jessica.smith@gmail.com", secondary: "brian.smith@hotmail.com" },
    "DRV-009": { primary: "mbrown@aol.com", secondary: "ldavis@gmail.com" },
    "DRV-010": { primary: "angela.wilson@yahoo.com", secondary: "terrance.wilson@aol.com" },
    "DRV-011": { primary: "vsharma@gmail.com", secondary: "mnair@hotmail.com" },
    "DRV-012": { primary: "karen.johnson@hotmail.com", secondary: "david.johnson@yahoo.com" }
  };
  
  let correctCount = 0;
  let totalChecked = 0;
  
  for (let i = 1; i <= 12; i++) {
    const driverId = `DRV-${String(i).padStart(3, '0')}`;
    const filePath = path.join(ROOT, "public", "generated", "drivers", driverId, "emergency-contact.html");
    
    try {
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, "utf8");
        
        // Extract email info
        const primaryEmailMatch = content.match(/<td>Primary Email<\/td><td>([^<]+)<\/td>/);
        const secondaryEmailMatch = content.match(/<td>Secondary Email<\/td><td>([^<]+)<\/td>/);
        
        const primaryEmail = primaryEmailMatch ? primaryEmailMatch[1].trim() : "NOT FOUND";
        const secondaryEmail = secondaryEmailMatch ? secondaryEmailMatch[1].trim() : "NOT FOUND";
        
        const expected = expectedEmails[driverId];
        const primaryCorrect = primaryEmail === expected.primary;
        const secondaryCorrect = secondaryEmail === expected.secondary;
        const hasNeedsReview = primaryEmail === "Needs review" || secondaryEmail === "Needs review";
        
        console.log(`\n${driverId}:`);
        console.log(`  Expected Primary: ${expected.primary}`);
        console.log(`  Actual Primary: ${primaryEmail} ${primaryCorrect ? '✅' : '❌'}`);
        console.log(`  Expected Secondary: ${expected.secondary}`);
        console.log(`  Actual Secondary: ${secondaryEmail} ${secondaryCorrect ? '✅' : '❌'}`);
        
        if (hasNeedsReview) {
          console.log(`  ⚠️  Contains "Needs review"`);
        }
        
        if (primaryCorrect && secondaryCorrect && !hasNeedsReview) {
          correctCount++;
        }
        
        totalChecked++;
        
      } else {
        console.log(`\n${driverId}: ❌ File not found`);
      }
    } catch (error) {
      console.log(`\n${driverId}: ❌ Error reading file: ${error.message}`);
    }
  }
  
  console.log(`\nSUMMARY:`);
  console.log(`- Correct emails: ${correctCount}/${totalChecked}`);
  console.log(`- Total drivers checked: ${totalChecked}/12`);
  
  if (correctCount === 12) {
    console.log(`\n✅ SUCCESS: All 12 drivers have correct email addresses with no "Needs review"`);
  } else {
    console.log(`\n❌ ISSUE: Some drivers have incorrect email addresses or "Needs review"`);
  }
  
} catch (error) {
  console.error("Error:", error.message);
}
