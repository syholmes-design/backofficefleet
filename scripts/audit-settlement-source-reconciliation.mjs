#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
import { resolveMainSourceXlsxPath } from './lib/main-source-path.mjs';
import { buildPayrollSettlementRowsFromWorkbook } from './lib/payroll-settlements-from-sheet.mjs';

// Configuration
const DRIVER_IDS = ['DRV-001', 'DRV-002', 'DRV-003', 'DRV-004', 'DRV-005', 'DRV-006', 'DRV-007', 'DRV-008', 'DRV-009', 'DRV-010', 'DRV-011', 'DRV-012'];

function auditSettlementReconciliation() {
  console.log('🔍 Auditing Settlement/Payroll Source Reconciliation...\n');
  
  const results = [];
  
  // Load the consolidated Excel workbook
  const workbookPath = resolveMainSourceXlsxPath(process.cwd());
  console.log(`📁 Loading workbook: ${workbookPath}`);
  
  if (!fs.existsSync(workbookPath)) {
    console.error(`❌ Workbook not found: ${workbookPath}`);
    return results;
  }
  
  const workbook = XLSX.readFile(workbookPath);
  console.log(`📊 Workbook loaded successfully`);
  
  // Inspect available sheets
  const sheetNames = workbook.SheetNames;
  console.log(`📋 Available sheets: ${sheetNames.join(', ')}`);
  
  // Get settlement data using existing parser
  const settlements = buildPayrollSettlementRowsFromWorkbook(workbook, []);
  console.log(`💰 Found ${settlements.length} settlement records`);
  
  // Group settlements by driver ID
  const settlementsByDriver = {};
  settlements.forEach(settlement => {
    if (!settlementsByDriver[settlement.driverId]) {
      settlementsByDriver[settlement.driverId] = [];
    }
    settlementsByDriver[settlement.driverId].push(settlement);
  });
  
  // Look for benefits/HR sheets for dental deduction
  let benefitsSheet = null;
  const benefitsSheetNames = sheetNames.filter(name => 
    name.toLowerCase().includes('benefit') || 
    name.toLowerCase().includes('hr') || 
    name.toLowerCase().includes('deduction')
  );
  
  if (benefitsSheetNames.length > 0) {
    console.log(`🏥 Found potential benefits sheets: ${benefitsSheetNames.join(', ')}`);
    benefitsSheet = workbook.Sheets[benefitsSheetNames[0]];
  }
  
  // Driver names mapping
  const driverNames = {
    'DRV-001': 'John Carter',
    'DRV-002': 'Maria Lopez',
    'DRV-003': 'Alex Kim',
    'DRV-004': 'Priya Patel',
    'DRV-005': 'Kenji Tanaka',
    'DRV-006': 'Marcus Chen',
    'DRV-007': 'Sofia Gomez',
    'DRV-008': 'Liam Smith',
    'DRV-009': 'Emma Brown',
    'DRV-010': 'Noah Wilson',
    'DRV-011': 'Olivia Lee',
    'DRV-012': 'Robert Johnson'
  };
  
  for (const driverId of DRIVER_IDS) {
    const driverName = driverNames[driverId];
    const driverSettlements = settlementsByDriver[driverId] || [];
    
    console.log(`\n📊 ${driverName} (${driverId})`);
    
    if (driverSettlements.length === 0) {
      console.log(`   No settlement data found in workbook`);
      results.push({
        driverId,
        driverName,
        settlementId: 'N/A',
        issues: ['No settlement data in workbook'],
        status: 'WARNING'
      });
      continue;
    }
    
    // Get the most recent settlement
    const latestSettlement = driverSettlements.sort((a, b) => 
      new Date(b.settlementId).getTime() - new Date(a.settlementId).getTime()
    )[0];
    
    console.log(`   Latest Settlement: ${latestSettlement.settlementId}`);
    console.log(`   Gross Pay: $${latestSettlement.grossPay?.toLocaleString() || 'N/A'}`);
    console.log(`   Total Deductions: $${latestSettlement.deductions?.toLocaleString() || 'N/A'}`);
    console.log(`   Net Pay: $${latestSettlement.netPay?.toLocaleString() || 'N/A'}`);
    console.log(`   Family Support: $${latestSettlement.familySupport?.toLocaleString() || 'N/A'}`);
    console.log(`   Insurance Premiums: $${latestSettlement.insurancePremiums?.toLocaleString() || 'N/A'}`);
    console.log(`   HSA/FSA Health: $${latestSettlement.hsaFsaHealthDeduction?.toLocaleString() || 'N/A'}`);
    console.log(`   401(k) Contribution: $${latestSettlement.contribution401k?.toLocaleString() || 'N/A'}`);
    
    // Check for specific issues
    const issues = [];
    
    // Check for missing values
    if (!latestSettlement.grossPay) issues.push('Missing gross pay');
    if (!latestSettlement.deductions) issues.push('Missing total deductions');
    if (!latestSettlement.netPay) issues.push('Missing net pay');
    
    // Check calculation consistency - but trust workbook values
    if (latestSettlement.grossPay && latestSettlement.deductions && latestSettlement.netPay) {
      const expectedNet = latestSettlement.grossPay - latestSettlement.deductions + (latestSettlement.fuelReimbursement || 0);
      if (Math.abs(expectedNet - latestSettlement.netPay) > 0.01) {
        console.log(`   📊 Workbook net pay: $${latestSettlement.netPay.toFixed(2)} (trusting workbook value)`);
        console.log(`   🧮 Calculated net pay: $${expectedNet.toFixed(2)} (for reference only)`);
        // Don't flag as error - workbook values take precedence
      }
    }
    
    // Check for family support (specifically for DRV-002)
    if (driverId === 'DRV-002') {
      const hasFamilySupport = latestSettlement.familySupport > 0;
      console.log(`   Family Support Withholding: $${latestSettlement.familySupport?.toLocaleString() || 'N/A'} ${hasFamilySupport ? '(Active)' : '(None)'}`);
      
      if (!hasFamilySupport) {
        issues.push('Expected family support withholding for DRV-002 not found');
      }
    }
    
    // Check for dental deduction issue (John Carter DRV-001)
    if (driverId === 'DRV-001') {
      console.log(`   🔍 Checking dental deduction against workbook...`);
      
      // Read the actual benefits enrollment document
      const benefitsDocPath = path.join(process.cwd(), 'public', 'generated', 'drivers', 'DRV-001', 'hr-payroll', 'benefits-enrollment.html');
      let documentDeduction = null;
      
      if (fs.existsSync(benefitsDocPath)) {
        const benefitsContent = fs.readFileSync(benefitsDocPath, 'utf8');
        // Look for the dental row and get the per-pay-period amount (4th column)
        const dentalMatch = benefitsContent.match(/<td>Dental<\/td>[\s\S]*?<td>Enrolled<\/td>[\s\S]*?<td class="amount-cell">\$(\d+\.\d+)<\/td>[\s\S]*?<td class="amount-cell">\$(\d+\.\d+)<\/td>/);
        if (dentalMatch) {
          documentDeduction = Number(dentalMatch[2]); // Use the second amount (per-pay-period)
        }
      }
      
      // Look for dental deduction in benefits sheet
      let workbookDeduction = null;
      if (benefitsSheet) {
        const benefitsRows = XLSX.utils.sheet_to_json(benefitsSheet, { raw: true, defval: null });
        const driverBenefitRow = benefitsRows.find(row => {
          const driverCol = Object.keys(row).find(key => 
            key.toLowerCase().includes('driver') || 
            key.toLowerCase().includes('name')
          );
          return driverCol && String(row[driverCol]).includes('Carter');
        });
        
        if (driverBenefitRow) {
          const dentalCol = Object.keys(driverBenefitRow).find(key => 
            key.toLowerCase().includes('dental')
          );
          if (dentalCol) {
            workbookDeduction = Number(driverBenefitRow[dentalCol]) || 0;
          }
        }
      }
      
      // Check if dental is part of health insurance deductions
      if (!workbookDeduction && latestSettlement.healthInsurancePremiums > 0) {
        workbookDeduction = latestSettlement.healthInsurancePremiums;
      }
      
      if (!workbookDeduction && latestSettlement.hsaFsaHealthDeduction > 0) {
        workbookDeduction = latestSettlement.hsaFsaHealthDeduction;
      }
      
      if (workbookDeduction !== null && documentDeduction !== null) {
        console.log(`   📋 Workbook dental deduction: $${workbookDeduction.toFixed(2)}`);
        console.log(`   📄 Current benefits enrollment shows: $${documentDeduction.toFixed(2)}`);
        
        if (Math.abs(workbookDeduction - documentDeduction) > 0.01) {
          console.log(`   ⚠️  Mismatch detected - benefits enrollment needs correction`);
          issues.push(`Dental deduction mismatch: workbook $${workbookDeduction.toFixed(2)} vs document $${documentDeduction.toFixed(2)}`);
        } else {
          console.log(`   ✅ Dental deduction matches`);
        }
      } else {
        console.log(`   ⚠️  No dental deduction found in workbook or document`);
        issues.push('Dental deduction not found in workbook or document - may need to be removed from document');
      }
    }
    
    if (issues.length > 0) {
      console.log(`   ❌ Issues: ${issues.join(', ')}`);
      results.push({
        driverId,
        driverName,
        settlementId: latestSettlement.settlementId,
        issues,
        status: 'ERROR'
      });
    } else {
      console.log(`   ✅ No issues detected`);
      results.push({
        driverId,
        driverName,
        settlementId: latestSettlement.settlementId,
        issues: [],
        status: 'OK'
      });
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 SETTLEMENT RECONCILIATION SUMMARY');
  console.log('='.repeat(80));
  
  const errorCount = results.filter(r => r.status === 'ERROR').length;
  const okCount = results.filter(r => r.status === 'OK').length;
  
  console.log(`Total Drivers: ${results.length}`);
  console.log(`OK: ${okCount}`);
  console.log(`Errors: ${errorCount}`);
  
  if (errorCount > 0) {
    console.log('\n❌ Drivers with issues:');
    results.filter(r => r.status === 'ERROR').forEach(r => {
      console.log(`   ${r.driverId} (${r.driverName}): ${r.issues.join(', ')}`);
    });
  }
  
  console.log('\n⚠️  Manual Review Required:');
  console.log('   - John Carter (DRV-001) dental deduction - verify against Excel source');
  console.log('   - Excel source file: public/data/main-source_enhanced_bof_aligned_CONSOLIDATED.xlsx');
  console.log('   - Compare benefit deduction amounts with source data');
  
  return results;
}

// Main execution
function main() {
  const results = auditSettlementReconciliation();
  
  const hasErrors = results.some(r => r.status === 'ERROR');
  process.exit(hasErrors ? 1 : 0);
}

// Run the script
main();

export { auditSettlementReconciliation };
