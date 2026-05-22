#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Configuration
const TEMPLATE_PATH = 'scripts/templates/owner-operator-lease-template.html';
const OUTPUT_DIR = 'public/generated/drivers';

// Owner-operator driver data
const OWNER_OPERATORS = [
  {
    driverId: 'DRV-006',
    name: 'Marcus Chen',
    address: '500 Pacific Ave, Dallas, TX 75202',
    phone: '283-876-4322',
    email: 'marcus.chen@boftransport.com',
    equipment: {
      type: 'Class A Tractor',
      year: '2022',
      make: 'Freightliner',
      model: 'Cascadia',
      vin: '1FUJGBDV4NLA12345',
      licensePlate: 'TX-7B8C9D',
      engine: 'Detroit DD15',
      transmission: 'Eaton-Fuller 10-Speed',
      sleeper: 'Yes',
      dotNumber: 'DOT-1234567'
    },
    settlementMethod: 'Weekly Direct Deposit',
    weeklyLeasePayment: '750'
  },
  {
    driverId: 'DRV-010',
    name: 'Noah Wilson',
    address: '110 W Adams St, Chicago, IL 60603',
    phone: '582-987-2387',
    email: 'noah.wilson@boftransport.com',
    equipment: {
      type: 'Class A Tractor',
      year: '2021',
      make: 'Peterbilt',
      model: '389',
      vin: '1XP5DB9X1MD567890',
      licensePlate: 'IL-9A8B7C',
      engine: 'Cummins X15',
      transmission: 'Eaton-Fuller 13-Speed',
      sleeper: 'Yes',
      dotNumber: 'DOT-2345678'
    },
    settlementMethod: 'Weekly Direct Deposit',
    weeklyLeasePayment: '800'
  },
  {
    driverId: 'DRV-012',
    name: 'Robert Johnson',
    address: '88 S Main St, Akron, OH 44308',
    phone: '618-623-9317',
    email: 'robert.johnson@boftransport.com',
    equipment: {
      type: 'Class A Tractor',
      year: '2023',
      make: 'Kenworth',
      model: 'W900',
      vin: '1KSYW9EX5PE234567',
      licensePlate: 'OH-5D4E3F',
      engine: 'PACCAR MX-13',
      transmission: 'Eaton-Fuller 18-Speed',
      sleeper: 'Yes',
      dotNumber: 'DOT-3456789'
    },
    settlementMethod: 'Weekly Direct Deposit',
    weeklyLeasePayment: '850'
  }
];

// Utility functions
function formatDate(date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function generateLeaseAgreement(driverData) {
  // Read the template
  const templateContent = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  
  // Define replacement values
  const replacements = {
    '{{DRIVER_ID}}': driverData.driverId,
    '{{DRIVER_NAME}}': driverData.name,
    '{{DRIVER_ADDRESS}}': driverData.address,
    '{{DRIVER_PHONE}}': driverData.phone,
    '{{EFFECTIVE_DATE}}': formatDate('2025-10-15'),
    '{{SIGNATURE_DATE}}': formatDate('2025-10-15'),
    '{{EQUIPMENT_TYPE}}': driverData.equipment.type,
    '{{EQUIPMENT_YEAR}}': driverData.equipment.year,
    '{{EQUIPMENT_MAKE}}': driverData.equipment.make,
    '{{EQUIPMENT_MODEL}}': driverData.equipment.model,
    '{{EQUIPMENT_VIN}}': driverData.equipment.vin,
    '{{EQUIPMENT_LICENSE_PLATE}}': driverData.equipment.licensePlate,
    '{{EQUIPMENT_ENGINE}}': driverData.equipment.engine,
    '{{EQUIPMENT_TRANSMISSION}}': driverData.equipment.transmission,
    '{{EQUIPMENT_SLEEPER}}': driverData.equipment.sleeper,
    '{{EQUIPMENT_DOT_NUMBER}}': driverData.equipment.dotNumber,
    '{{PAYMENT_METHOD}}': driverData.settlementMethod,
    '{{WEEKLY_LEASE_PAYMENT}}': driverData.weeklyLeasePayment,
    '{{COMPANY_REP_NAME}}': 'John Smith',
    '{{COMPANY_REP_TITLE}}': 'Operations Manager'
  };
  
  // Replace all placeholders
  let content = templateContent;
  for (const [placeholder, value] of Object.entries(replacements)) {
    content = content.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
  }
  
  return content;
}

function ensureDirectoryExists(dirPath) {
  const fullPath = path.join(process.cwd(), dirPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
}

function main() {
  console.log('🔧 Generating Owner-Operator Lease Agreements...\n');
  
  // Read template
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error(`❌ Template not found: ${TEMPLATE_PATH}`);
    process.exit(1);
  }
  
  const results = {
    total: OWNER_OPERATORS.length,
    generated: 0,
    failed: []
  };
  
  for (const driver of OWNER_OPERATORS) {
    try {
      console.log(`📄 Generating lease for ${driver.name} (${driver.driverId})...`);
      
      // Generate lease content
      const leaseContent = generateLeaseAgreement(driver);
      
      // Ensure output directory exists
      const outputDir = path.join(OUTPUT_DIR, driver.driverId, 'owner-operator');
      ensureDirectoryExists(outputDir);
      
      // Write lease file
      const outputPath = path.join(outputDir, 'owner-operator-lease-agreement.html');
      fs.writeFileSync(outputPath, leaseContent, 'utf8');
      
      console.log(`✅ Generated: ${outputPath}`);
      results.generated++;
      
    } catch (error) {
      console.error(`❌ Failed to generate lease for ${driver.driverId}:`, error.message);
      results.failed.push(driver.driverId);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 LEASE GENERATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`📄 Total drivers: ${results.total}`);
  console.log(`✅ Successfully generated: ${results.generated}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  
  if (results.failed.length > 0) {
    console.log(`\n❌ Failed drivers: ${results.failed.join(', ')}`);
  }
  
  console.log('\n' + '='.repeat(60));
  
  if (results.failed.length > 0) {
    process.exit(1);
  }
  
  console.log('🎉 All owner-operator lease agreements generated successfully!');
}

// Run the script
main();

export { main, generateLeaseAgreement };
