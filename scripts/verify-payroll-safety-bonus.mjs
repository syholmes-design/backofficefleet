#!/usr/bin/env node

/**
 * Verification script to confirm Safety Bonus values are sourced from Payroll sheet
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function verifyPayrollSafetyBonus() {
  console.log(`\n🔍 PAYROLL SAFETY BONUS VERIFICATION`);
  console.log(`====================================`);

  // 1. Read v2 Excel Payroll data
  const excelPath = path.join(ROOT, "public", "data", "main-source-v2_enhanced_bof_aligned.xlsx");
  let payrollData = [];
  
  try {
    const workbook = XLSX.readFile(excelPath);
    if (workbook.Sheets["Payroll"]) {
      const payrollRows = XLSX.utils.sheet_to_json(workbook.Sheets["Payroll"], { raw: true, defval: null });
      payrollData = payrollRows;
      console.log(`\n1. V2 Excel Payroll Sheet Data:`);
      console.log(`   Sheet: Payroll`);
      console.log(`   Column: Safety Bonus`);
      console.log(`   Rows: ${payrollData.length}`);
    }
  } catch (error) {
    console.log(`   ❌ Error reading Excel: ${error.message}`);
    return;
  }

  // 2. Read demo-data.json settlements
  const demoDataPath = path.join(ROOT, "lib", "demo-data.json");
  let demoSettlements = [];
  
  try {
    const demoData = JSON.parse(fs.readFileSync(demoDataPath, 'utf8'));
    demoSettlements = demoData.settlements || [];
    console.log(`\n2. Demo Data Settlements:`);
    console.log(`   Field: settlements[].safetyBonus`);
    console.log(`   Rows: ${demoSettlements.length}`);
  } catch (error) {
    console.log(`   ❌ Error reading demo-data.json: ${error.message}`);
    return;
  }

  // 3. Generate verification table
  console.log(`\n3. Verification Table:`);
  console.log(`| Driver ID | Driver Name | Payroll Safety Bonus | Safety Page Bonus | Match |`);
  console.log(`|----------|-------------|----------------------|-------------------|-------|`);
  
  let totalPayrollBonus = 0;
  let totalSafetyPageBonus = 0;
  let matches = 0;
  let totalDrivers = 0;
  
  payrollData.forEach(payrollRow => {
    const driverId = normalizeDriverId(payrollRow.Driver);
    const driverName = payrollRow.Name;
    const payrollBonus = payrollRow["Safety Bonus"] || 0;
    totalPayrollBonus += payrollBonus;
    
    const demoSettlement = demoSettlements.find(s => s.driverId === driverId);
    const safetyPageBonus = demoSettlement ? (demoSettlement.safetyBonus || 0) : 0;
    totalSafetyPageBonus += safetyPageBonus;
    
    const match = payrollBonus === safetyPageBonus;
    if (match) matches++;
    totalDrivers++;
    
    console.log(`| ${driverId} | ${driverName} | $${payrollBonus} | $${safetyPageBonus} | ${match ? '✅' : '❌'} |`);
  });
  
  // 4. Summary
  console.log(`\n4. Summary:`);
  console.log(`   Total Payroll Safety Bonus: $${totalPayrollBonus}`);
  console.log(`   Total Safety Page Bonus: $${totalSafetyPageBonus}`);
  console.log(`   Totals Match: ${totalPayrollBonus === totalSafetyPageBonus ? '✅' : '❌'}`);
  console.log(`   Driver Matches: ${matches}/${totalDrivers}`);
  console.log(`   Missing Payroll Safety Bonus: ${payrollData.filter(row => !row["Safety Bonus"]).length}`);
  
  // 5. Check safety-scorecard.ts logic
  console.log(`\n5. Safety Scorecard Logic Check:`);
  try {
    const safetyScorecardPath = path.join(ROOT, 'lib', 'safety-scorecard.ts');
    const scorecardContent = fs.readFileSync(safetyScorecardPath, 'utf8');
    
    const usesPayrollData = scorecardContent.includes('data.settlements?.find');
    const usesTierLogic = scorecardContent.includes('performanceTier === "Elite"') && scorecardContent.includes('125');
    
    console.log(`   Uses Payroll settlements data: ${usesPayrollData ? '✅' : '❌'}`);
    console.log(`   Uses tier-based logic: ${usesTierLogic ? '❌' : '✅'}`);
    
  } catch (error) {
    console.log(`   ❌ Error checking safety-scorecard.ts: ${error.message}`);
  }

  // 6. Final verification
  console.log(`\n🎯 VERIFICATION RESULT:`);
  const allMatch = matches === totalDrivers && totalPayrollBonus === totalSafetyPageBonus;
  console.log(`   Safety Bonus correctly sourced from Payroll: ${allMatch ? '✅' : '❌'}`);
  
  if (!allMatch) {
    console.log(`\n❌ ISSUES FOUND:`);
    if (matches < totalDrivers) {
      console.log(`   - ${totalDrivers - matches} drivers have mismatched bonus values`);
    }
    if (totalPayrollBonus !== totalSafetyPageBonus) {
      console.log(`   - Total bonus amounts don't match ($${Math.abs(totalPayrollBonus - totalSafetyPageBonus)} difference)`);
    }
  } else {
    console.log(`\n✅ SUCCESS: All Safety Bonus values correctly sourced from Payroll sheet`);
  }
}

function normalizeDriverId(driverId) {
  const id = String(driverId || '').trim();
  // Convert DVR-001 to DRV-001 format
  return id.replace(/^DVR-/, 'DRV-');
}

verifyPayrollSafetyBonus();
