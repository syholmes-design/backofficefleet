#!/usr/bin/env node

/**
 * Verify that v2 Excel deductions are now correctly in demo data
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";
import { resolveMainSourceXlsxPath } from "./lib/main-source-path.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function verifyV2DeductionFix() {
  const excelPath = resolveMainSourceXlsxPath(ROOT);
  const demoDataPath = path.join(ROOT, "lib", "demo-data.json");
  
  console.log(`\n✅ V2 DEDUCTION FIX VERIFICATION`);
  console.log(`Excel file: ${excelPath}`);
  console.log(`Demo data: ${demoDataPath}`);
  
  if (!fs.existsSync(excelPath) || !fs.existsSync(demoDataPath)) {
    console.log(`❌ Missing files`);
    return;
  }
  
  try {
    // Read Excel data
    const workbook = XLSX.readFile(excelPath, { cellDates: true, type: "file" });
    const payrollSheet = workbook.Sheets["Payroll"];
    const excelData = XLSX.utils.sheet_to_json(payrollSheet, { raw: true, defval: null });
    
    // Create Excel data map with normalized driver IDs
    const excelMap = new Map();
    excelData.forEach(row => {
      const rawDriverId = row["Driver"];
      // Normalize DVR-001 to DRV-001
      const normalizedId = rawDriverId.replace("DVR-", "DRV-");
      excelMap.set(normalizedId, {
        totalDeductions: row["Total Deductions"] || 0,
        grossPay: row["Gross Pay"] || 0,
        netPay: row["Net Pay"] || 0,
        fica: row["FICA"] || 0,
        oasdi: row["OASDI"] || 0,
        federalWithholding: row["Federal Withholding"] || 0,
        stateWithholding: row["State Withholding"] || 0,
        contribution401k: row["401(k) Contribution"] || 0,
        familySupport: row["Family Support"] || 0,
        sdi: row["SDI"] || 0,
        fmLeave: row["FM Leave"] || 0,
        insurancePremiums: row["Insurance Premiums"] || 0,
        hsaFsaHealthDeduction: row["HSA/FSA Health Deduction"] || 0
      });
    });
    
    // Read demo data
    const demoData = JSON.parse(fs.readFileSync(demoDataPath, "utf8"));
    const demoSettlements = demoData.settlements || [];
    
    // Create demo data map
    const demoMap = new Map();
    demoSettlements.forEach(settlement => {
      demoMap.set(settlement.driverId, {
        totalDeductions: settlement.totalDeductions || settlement.deductions || 0,
        grossPay: settlement.grossPay || 0,
        netPay: settlement.netPay || 0,
        fica: settlement.fica || 0,
        oasdi: settlement.oasdi || 0,
        federalWithholding: settlement.federalWithholding || 0,
        stateWithholding: settlement.stateWithholding || 0,
        contribution401k: settlement.contribution401k || 0,
        familySupport: settlement.familySupport || 0,
        sdi: settlement.sdi || 0,
        fmLeave: settlement.fmLeave || 0,
        insurancePremiums: settlement.insurancePremiums || 0,
        hsaFsaHealthDeduction: settlement.hsaFsaHealthDeduction || 0
      });
    });
    
    console.log(`\n📊 DEDUCTION VERIFICATION RESULTS:`);
    console.log(`┌─────────────┬─────────────────┬─────────────────┬──────────┬─────────────────┐`);
    console.log(`│ Driver ID   │ Excel Total     │ Demo Total      │ Match?   │ Status          │`);
    console.log(`├─────────────┼─────────────────┼─────────────────┼──────────┼─────────────────┤`);
    
    let matches = 0;
    let mismatches = 0;
    
    // Check each driver
    demoSettlements.forEach(settlement => {
      const driverId = settlement.driverId;
      const excelRow = excelMap.get(driverId);
      const demoRow = demoMap.get(driverId);
      
      if (!excelRow) {
        console.log(`│ ${driverId.padEnd(11)} │ NOT FOUND        │ $${demoRow.totalDeductions.toFixed(2).padEnd(15)} │ NO       │ Missing in Excel │`);
        mismatches++;
        return;
      }
      
      const excelTotal = excelRow.totalDeductions;
      const demoTotal = demoRow.totalDeductions;
      const match = Math.abs(excelTotal - demoTotal) < 0.01;
      
      if (match) {
        console.log(`│ ${driverId.padEnd(11)} │ $${excelTotal.toFixed(2).padEnd(15)} │ $${demoTotal.toFixed(2).padEnd(15)} │ YES      │ ✅ MATCH        │`);
        matches++;
      } else {
        console.log(`│ ${driverId.padEnd(11)} │ $${excelTotal.toFixed(2).padEnd(15)} │ $${demoTotal.toFixed(2).padEnd(15)} │ NO       │ ❌ MISMATCH     │`);
        mismatches++;
      }
    });
    
    console.log(`└─────────────┴─────────────────┴─────────────────┴──────────┴─────────────────┘`);
    
    console.log(`\n📈 SUMMARY:`);
    console.log(`Total drivers: ${demoSettlements.length}`);
    console.log(`Matches: ${matches}`);
    console.log(`Mismatches: ${mismatches}`);
    console.log(`Match rate: ${((matches / demoSettlements.length) * 100).toFixed(1)}%`);
    
    if (matches === demoSettlements.length) {
      console.log(`\n✅ SUCCESS! All v2 Excel deductions are now correctly mapped in demo data.`);
    } else {
      console.log(`\n❌ Still have ${mismatches} mismatches to fix.`);
    }
    
    // Show component breakdown for first driver
    const firstDriver = demoSettlements[0];
    const firstExcel = excelMap.get(firstDriver.driverId);
    
    if (firstExcel && firstDriver) {
      console.log(`\n🔍 COMPONENT BREAKDOWN FOR ${firstDriver.driverId}:`);
      console.log(`Component          │ Excel     │ Demo      │ Match?`);
      console.log(`-------------------│-----------│-----------│-------`);
      
      const components = [
        ['FICA', 'fica'],
        ['OASDI', 'oasdi'],
        ['Federal WH', 'federalWithholding'],
        ['State WH', 'stateWithholding'],
        ['401(k)', 'contribution401k'],
        ['Family Support', 'familySupport'],
        ['SDI', 'sdi'],
        ['FM Leave', 'fmLeave'],
        ['Insurance', 'insurancePremiums'],
        ['HSA/FSA', 'hsaFsaHealthDeduction']
      ];
      
      components.forEach(([name, field]) => {
        const excelValue = firstExcel[field] || 0;
        const demoValue = firstDriver[field] || 0;
        const match = Math.abs(excelValue - demoValue) < 0.01;
        console.log(`${name.padEnd(17)} │ $${excelValue.toFixed(2).padEnd(7)} │ $${demoValue.toFixed(2).padEnd(7)} │ ${match ? 'YES' : 'NO'}`);
      });
    }
    
  } catch (error) {
    console.log(`❌ Error during verification: ${error.message}`);
  }
}

verifyV2DeductionFix();
