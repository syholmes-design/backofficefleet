#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

async function main() {
  console.log('🔍 Settlement Data Analysis Report\n');
  console.log('=' .repeat(80));

  try {
    // Read demo data directly
    const demoDataPath = path.join(process.cwd(), 'lib', 'demo-data.json');
    const demoDataContent = fs.readFileSync(demoDataPath, 'utf8');
    const demoData = JSON.parse(demoDataContent);
    
    const settlements = demoData.settlements || [];
    const drivers = demoData.drivers || [];
    
    console.log('Analyzing first 3 drivers in detail:\n');
    
    for (let i = 0; i < Math.min(3, settlements.length); i++) {
      const settlement = settlements[i];
      const driver = drivers.find(d => d.id === settlement.driverId);
      const driverName = driver ? driver.name : 'Unknown Driver';
      
      console.log(`Driver: ${driverName} (${settlement.driverId})`);
      console.log('-'.repeat(50));
      
      // Calculate sum of all individual deduction fields
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
        (settlement.lifeInsuranceAbove50k || 0) +
        (settlement.advanceRepayment || 0);
      
      console.log(`totalDeductions from data: ${formatCurrency(settlement.totalDeductions)}`);
      console.log(`Calculated sum of fields: ${formatCurrency(calculatedDeductions)}`);
      console.log(`Difference: ${formatCurrency(Math.abs(settlement.totalDeductions - calculatedDeductions))}`);
      
      console.log('\nIndividual deduction fields:');
      const fields = [
        { name: 'fica', value: settlement.fica },
        { name: 'oasdi', value: settlement.oasdi },
        { name: 'federalWithholding', value: settlement.federalWithholding },
        { name: 'stateWithholding', value: settlement.stateWithholding },
        { name: 'sdi', value: settlement.sdi },
        { name: 'fmLeave', value: settlement.fmLeave },
        { name: 'familySupport', value: settlement.familySupport },
        { name: 'insurancePremiums', value: settlement.insurancePremiums },
        { name: 'creditUnionSavingsClub', value: settlement.creditUnionSavingsClub },
        { name: 'contribution401k', value: settlement.contribution401k },
        { name: 'hsaFsaHealthDeduction', value: settlement.hsaFsaHealthDeduction },
        { name: 'healthInsurancePremiums', value: settlement.healthInsurancePremiums },
        { name: 'lifeInsuranceAbove50k', value: settlement.lifeInsuranceAbove50k },
        { name: 'advanceRepayment', value: settlement.advanceRepayment },
      ];
      
      fields.forEach(field => {
        if (field.value > 0) {
          console.log(`  ${field.name}: ${formatCurrency(field.value)}`);
        }
      });
      
      console.log('\nSettlement calculation check:');
      console.log(`grossPay: ${formatCurrency(settlement.grossPay)}`);
      console.log(`totalDeductions: ${formatCurrency(settlement.totalDeductions)}`);
      console.log(`netPay: ${formatCurrency(settlement.netPay)}`);
      console.log(`grossPay - totalDeductions = ${formatCurrency(settlement.grossPay - settlement.totalDeductions)}`);
      console.log(`Expected netPay: ${formatCurrency(settlement.netPay)}`);
      console.log(`Net Pay Match: ${Math.abs((settlement.grossPay - settlement.totalDeductions) - settlement.netPay) < 0.01 ? '✅' : '❌'}`);
      
      console.log('\n' + '='.repeat(80) + '\n');
    }

  } catch (error) {
    console.error('❌ Error running analysis:', error);
    process.exit(1);
  }
}

main();
