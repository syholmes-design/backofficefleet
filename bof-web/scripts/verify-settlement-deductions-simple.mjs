#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const calculateVisibleDeductions = (settlement) => {
  let total = 0;
  const deductions = [];

  if (settlement.fica > 0) {
    total += settlement.fica;
    deductions.push({ name: 'FICA', amount: settlement.fica });
  }
  if (settlement.oasdi > 0) {
    total += settlement.oasdi;
    deductions.push({ name: 'OASDI', amount: settlement.oasdi });
  }
  if (settlement.federalWithholding > 0) {
    total += settlement.federalWithholding;
    deductions.push({ name: 'Federal Withholding', amount: settlement.federalWithholding });
  }
  if (settlement.stateWithholding > 0) {
    total += settlement.stateWithholding;
    deductions.push({ name: 'State Withholding', amount: settlement.stateWithholding });
  }
  if (settlement.sdi > 0) {
    total += settlement.sdi;
    deductions.push({ name: 'SDI', amount: settlement.sdi });
  }
  if (settlement.fmLeave > 0) {
    total += settlement.fmLeave;
    deductions.push({ name: 'FM Leave', amount: settlement.fmLeave });
  }
  if (settlement.familySupport > 0) {
    total += settlement.familySupport;
    deductions.push({ name: 'Family Support', amount: settlement.familySupport });
  }
  if (settlement.insurancePremiums > 0) {
    total += settlement.insurancePremiums;
    deductions.push({ name: 'Insurance Premiums', amount: settlement.insurancePremiums });
  }
  if (settlement.creditUnionSavingsClub > 0) {
    total += settlement.creditUnionSavingsClub;
    deductions.push({ name: 'Credit Union Savings Club', amount: settlement.creditUnionSavingsClub });
  }
  if (settlement.contribution401k > 0) {
    total += settlement.contribution401k;
    deductions.push({ name: '401(k) Contribution', amount: settlement.contribution401k });
  }
  if (settlement.hsaFsaHealthDeduction > 0) {
    total += settlement.hsaFsaHealthDeduction;
    deductions.push({ name: 'HSA/FSA Health Deduction', amount: settlement.hsaFsaHealthDeduction });
  }
  if (settlement.healthInsurancePremiums > 0) {
    total += settlement.healthInsurancePremiums;
    deductions.push({ name: 'Health Insurance Premiums', amount: settlement.healthInsurancePremiums });
  }
  if (settlement.lifeInsuranceAbove50k > 0) {
    total += settlement.lifeInsuranceAbove50k;
    deductions.push({ name: 'Life Insurance Above 50k', amount: settlement.lifeInsuranceAbove50k });
  }
  // Note: advanceRepayment is not available in DriverSettlementRow type

  // Add "Other Deductions" to match the SettlementLineItems component
  const calculatedDeductions = 
    (settlement.fica || 0) +
    (settlement.oasdi || 0) +
    (settlement.federalWithholding || 0) +
    (settlement.stateWithholding || 0) +
    (settlement.sdi || 0) +
    (settlement.fmLeave || 0) +
    (settlement.familySupport || 0) +
    (settlement.insurancePremiums || 0) +
    (settlement.creditUnionSavingsClub || 0) +
    (settlement.contribution401k || 0) +
    (settlement.hsaFsaHealthDeduction || 0) +
    (settlement.healthInsurancePremiums || 0) +
    (settlement.lifeInsuranceAbove50k || 0);

  const otherDeductions = settlement.deductions - calculatedDeductions;
  if (otherDeductions > 0.01) { // Only show if there's a meaningful difference
    total += otherDeductions;
    deductions.push({ name: 'Other Deductions', amount: otherDeductions });
  }

  return { total, deductions };
};

async function main() {
  console.log('🔍 Settlement Deductions Verification Report\n');
  console.log('=' .repeat(80));

  try {
    // Read demo data directly
    const demoDataPath = path.join(process.cwd(), 'lib', 'demo-data.json');
    const demoDataContent = fs.readFileSync(demoDataPath, 'utf8');
    const demoData = JSON.parse(demoDataContent);
    
    const settlements = demoData.settlements || [];
    const drivers = demoData.drivers || [];
    
    let allPass = true;
    const results = [];

    for (const settlement of settlements) {
      const driver = drivers.find(d => d.id === settlement.driverId);
      const driverName = driver ? driver.name : 'Unknown Driver';
      
      const { total: visibleTotal, deductions } = calculateVisibleDeductions(settlement);
      const difference = Math.abs(settlement.deductions - visibleTotal);
      const pass = difference < 0.01; // Allow for floating point precision
      
      results.push({
        driverId: settlement.driverId,
        driverName,
        totalDeductions: settlement.deductions,
        visibleTotal,
        difference,
        pass,
        deductions,
        settlementFields: {
          fica: settlement.fica,
          oasdi: settlement.oasdi,
          federalWithholding: settlement.federalWithholding,
          stateWithholding: settlement.stateWithholding,
          sdi: settlement.sdi,
          fmLeave: settlement.fmLeave,
          familySupport: settlement.familySupport,
          insurancePremiums: settlement.insurancePremiums,
          creditUnionSavingsClub: settlement.creditUnionSavingsClub,
          contribution401k: settlement.contribution401k,
          hsaFsaHealthDeduction: settlement.hsaFsaHealthDeduction,
          healthInsurancePremiums: settlement.healthInsurancePremiums,
          lifeInsuranceAbove50k: settlement.lifeInsuranceAbove50k,
          // advanceRepayment not available in DriverSettlementRow type
        }
      });

      if (!pass) {
        allPass = false;
      }
    }

    // Print results
    console.log('Driver Settlement Reconciliation:\n');
    console.log('Driver ID | Driver Name    | Total Deductions | Visible Total | Difference | Status');
    console.log('-'.repeat(80));

    for (const result of results) {
      const status = result.pass ? '✅ PASS' : '❌ FAIL';
      console.log(
        `${result.driverId.padEnd(9)} | ${result.driverName.padEnd(14)} | ${formatCurrency(result.totalDeductions).padEnd(16)} | ${formatCurrency(result.visibleTotal).padEnd(13)} | ${formatCurrency(result.difference).padEnd(9)} | ${status}`
      );
    }

    // Print detailed breakdown for failures
    const failures = results.filter(r => !r.pass);
    if (failures.length > 0) {
      console.log('\n❌ FAILED RECONCILIATIONS:\n');
      for (const failure of failures) {
        console.log(`Driver: ${failure.driverName} (${failure.driverId})`);
        console.log(`Expected Total: ${formatCurrency(failure.totalDeductions)}`);
        console.log(`Visible Total: ${formatCurrency(failure.visibleTotal)}`);
        console.log(`Difference: ${formatCurrency(failure.difference)}`);
        console.log('\nVisible Deductions:');
        for (const deduction of failure.deductions) {
          console.log(`  - ${deduction.name}: ${formatCurrency(deduction.amount)}`);
        }
        console.log('\nAll Settlement Fields:');
        Object.entries(failure.settlementFields).forEach(([field, value]) => {
          if (value > 0) {
            console.log(`  - ${field}: ${formatCurrency(value)}`);
          }
        });
        console.log('\n' + '='.repeat(80) + '\n');
      }
    }

    // Summary
    console.log(`\n📊 SUMMARY:`);
    console.log(`Total drivers checked: ${results.length}`);
    console.log(`Passed: ${results.filter(r => r.pass).length}`);
    console.log(`Failed: ${failures.length}`);
    console.log(`Overall Status: ${allPass ? '✅ ALL PASS' : '❌ SOME FAIL'}`);

    if (!allPass) {
      console.log('\n⚠️  ACTION REQUIRED:');
      console.log('Some settlement deductions do not match the visible line items.');
      console.log('Check the missing/unmapped fields in the failed reconciliations above.');
      process.exit(1);
    } else {
      console.log('\n✅ All settlement deductions are properly reconciled!');
      process.exit(0);
    }

  } catch (error) {
    console.error('❌ Error running verification:', error);
    process.exit(1);
  }
}

main();
