import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

try {
  console.log(`VERIFICATION OF EMAIL ADDRESSES FOR ALL 12 DRIVERS:`);
  
  // Expected email data
  const expectedEmails = {
    "DRV-001": { primary: "sarah.carter@example.com", secondary: "mcarter@example.com" },
    "DRV-002": { primary: "clopez@example.com", secondary: "rosa.hernandez@example.com" },
    "DRV-003": { primary: "minji.kim@example.com", secondary: "dkim@example.com" },
    "DRV-004": { primary: "raj.patel@example.com", secondary: "anita.sharma@example.com" },
    "DRV-005": { primary: "ytanaka@example.com", secondary: "htanaka@example.com" },
    "DRV-006": { primary: "linda.chen@example.com", secondary: "wei.chen@example.com" },
    "DRV-007": { primary: "mgomez@example.com", secondary: "itorres@example.com" },
    "DRV-008": { primary: "jessica.smith@example.com", secondary: "brian.smith@example.com" },
    "DRV-009": { primary: "mbrown@example.com", secondary: "ldavis@example.com" },
    "DRV-010": { primary: "angela.wilson@example.com", secondary: "terrance.wilson@example.com" },
    "DRV-011": { primary: "vsharma@example.com", secondary: "mnair@example.com" },
    "DRV-012": { primary: "karen.johnson@example.com", secondary: "david.johnson@example.com" }
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
