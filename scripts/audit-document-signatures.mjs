#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Configuration
const PUBLIC_BASE = 'public';
const DRIVER_IDS = ['DRV-001', 'DRV-002', 'DRV-003', 'DRV-004', 'DRV-005', 'DRV-006', 'DRV-007', 'DRV-008', 'DRV-009', 'DRV-010', 'DRV-011', 'DRV-012'];

// Document types to check for signature issues
const SIGNATURE_DOCUMENTS = [
  'owner-operator-lease-agreement.html',
  'independent-contractor-agreement.html',
  'safety-and-compliance-acknowledgment.html',
  'employee-handbook-acknowledgment.html',
  'benefits-enrollment.html',
  'bank-info.html',
  'bank-information.html',
  'bank_information.html',
  'i-9.html',
  'w-9.html',
  'emergency-contact.html',
  'emergency_contact.html'
];

function auditDocumentSignatures() {
  console.log('🔍 Auditing Document Signatures...\n');
  
  const results = [];
  
  for (const driverId of DRIVER_IDS) {
    console.log(`\n📝 ${driverId} - Signature Analysis`);
    
    const driverResults = {
      driverId,
      documents: [],
      issues: []
    };
    
    // Check owner-operator documents
    const isOwnerOperator = ['DRV-006', 'DRV-010', 'DRV-012'].includes(driverId);
    
    if (isOwnerOperator) {
      const leasePath = path.join(PUBLIC_BASE, `generated/drivers/${driverId}/owner-operator/owner-operator-lease-agreement.html`);
      if (fs.existsSync(leasePath)) {
        const leaseContent = fs.readFileSync(leasePath, 'utf8');
        const signatureIssues = analyzeSignatures(leaseContent, 'Owner-Operator Lease Agreement');
        
        driverResults.documents.push({
          type: 'Owner-Operator Lease Agreement',
          path: leasePath,
          ...signatureIssues
        });
        
        driverResults.issues.push(...signatureIssues.issues);
      }
      
      // Check independent contractor agreement
      const icPath = path.join(PUBLIC_BASE, `generated/drivers/${driverId}/owner-operator/independent-contractor-agreement.html`);
      if (fs.existsSync(icPath)) {
        const icContent = fs.readFileSync(icPath, 'utf8');
        const signatureIssues = analyzeSignatures(icContent, 'Independent Contractor Agreement');
        
        driverResults.documents.push({
          type: 'Independent Contractor Agreement',
          path: icPath,
          ...signatureIssues
        });
        
        driverResults.issues.push(...signatureIssues.issues);
      }
    }
    
    // Check employee documents
    const handbookPath = path.join(PUBLIC_BASE, `generated/drivers/${driverId}/hr-payroll/employee-handbook-acknowledgment.html`);
    if (fs.existsSync(handbookPath)) {
      const handbookContent = fs.readFileSync(handbookPath, 'utf8');
      const signatureIssues = analyzeSignatures(handbookContent, 'Employee Handbook Acknowledgment');
      
      driverResults.documents.push({
        type: 'Employee Handbook Acknowledgment',
        path: handbookPath,
        ...signatureIssues
      });
      
      driverResults.issues.push(...signatureIssues.issues);
    }
    
    // Check benefits enrollment
    const benefitsPath = path.join(PUBLIC_BASE, `generated/drivers/${driverId}/hr-payroll/benefits-enrollment.html`);
    if (fs.existsSync(benefitsPath)) {
      const benefitsContent = fs.readFileSync(benefitsPath, 'utf8');
      const signatureIssues = analyzeSignatures(benefitsContent, 'Benefits Enrollment');
      
      driverResults.documents.push({
        type: 'Benefits Enrollment',
        path: benefitsPath,
        ...signatureIssues
      });
      
      driverResults.issues.push(...signatureIssues.issues);
    }
    
    // Check bank documents
    const bankPaths = [
      path.join(PUBLIC_BASE, `generated/drivers/${driverId}/bank-info.html`),
      path.join(PUBLIC_BASE, `generated/drivers/${driverId}/bank-information.html`),
      path.join(PUBLIC_BASE, `generated/drivers/${driverId}/bank_information.html`)
    ];
    
    for (const bankPath of bankPaths) {
      if (fs.existsSync(bankPath)) {
        const bankContent = fs.readFileSync(bankPath, 'utf8');
        const signatureIssues = analyzeSignatures(bankContent, 'Bank Information');
        
        driverResults.documents.push({
          type: 'Bank Information',
          path: bankPath,
          ...signatureIssues
        });
        
        driverResults.issues.push(...signatureIssues.issues);
        break; // Only check first found bank document
      }
    }
    
    // Display results for this driver
    if (driverResults.documents.length > 0) {
      driverResults.documents.forEach(doc => {
        console.log(`   ${doc.type}:`);
        console.log(`     Signature count: ${doc.signatureCount}`);
        console.log(`     Duplicate signatures: ${doc.duplicateSignatures}`);
        if (doc.issues.length > 0) {
          console.log(`     Issues: ${doc.issues.join(', ')}`);
        } else {
          console.log(`     ✅ No signature issues detected`);
        }
      });
    } else {
      console.log(`   No signature documents found`);
    }
    
    results.push(driverResults);
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 DOCUMENT SIGNATURE AUDIT SUMMARY');
  console.log('='.repeat(80));
  
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
  const driversWithIssues = results.filter(r => r.issues.length > 0).length;
  
  console.log(`Total Drivers: ${results.length}`);
  console.log(`Drivers with signature issues: ${driversWithIssues}`);
  console.log(`Total signature issues: ${totalIssues}`);
  
  if (totalIssues > 0) {
    console.log('\n❌ Signature Issues Found:');
    results.forEach(driver => {
      if (driver.issues.length > 0) {
        console.log(`   ${driver.driverId}: ${driver.issues.join(', ')}`);
      }
    });
    
    console.log('\n🔧 Recommended Actions:');
    console.log('   - Review documents with duplicate signatures');
    console.log('   - Ensure proper party signatures (driver vs company)');
    console.log('   - Verify signature placement and formatting');
    console.log('   - Remove any duplicate signature blocks');
  } else {
    console.log('\n✅ No signature issues detected');
  }
  
  return results;
}

function analyzeSignatures(content, documentType) {
  const issues = [];
  let signatureCount = 0;
  let duplicateSignatures = 0;
  
  // Count signature-related elements
  const signaturePatterns = [
    /signature/i,
    /signed by/i,
    /date:/i,
    /print name/i,
    /employee signature/i,
    /company signature/i,
    /driver signature/i,
    /owner-operator signature/i
  ];
  
  const foundSignatures = [];
  
  signaturePatterns.forEach(pattern => {
    const matches = content.match(pattern);
    if (matches) {
      foundSignatures.push(...matches);
    }
  });
  
  signatureCount = foundSignatures.length;
  
  // Check for potential duplicates
  const uniqueSignatures = [...new Set(foundSignatures)];
  duplicateSignatures = foundSignatures.length - uniqueSignatures.length;
  
  // Specific checks for different document types
  if (documentType === 'Owner-Operator Lease Agreement') {
    // Should have both company and owner-operator signatures
    const hasCompanySig = content.toLowerCase().includes('company') && content.toLowerCase().includes('signature');
    const hasOwnerOpSig = content.toLowerCase().includes('owner-operator') && content.toLowerCase().includes('signature');
    
    if (!hasCompanySig) issues.push('Missing company signature');
    if (!hasOwnerOpSig) issues.push('Missing owner-operator signature');
    if (duplicateSignatures > 0) issues.push('Duplicate signature blocks found');
  }
  
  if (documentType === 'Benefits Enrollment') {
    // Should have employee signature
    const hasEmployeeSig = content.toLowerCase().includes('employee') && content.toLowerCase().includes('signature');
    
    if (!hasEmployeeSig) issues.push('Missing employee signature');
    if (duplicateSignatures > 0) issues.push('Duplicate signature blocks found');
  }
  
  if (documentType === 'Bank Information') {
    // Should have employee/driver signature
    const hasDriverSig = content.toLowerCase().includes('driver') && content.toLowerCase().includes('signature');
    
    if (!hasDriverSig) issues.push('Missing driver signature');
    if (duplicateSignatures > 0) issues.push('Duplicate signature blocks found');
  }
  
  return {
    signatureCount,
    duplicateSignatures,
    issues
  };
}

// Main execution
function main() {
  const results = auditDocumentSignatures();
  
  const hasIssues = results.some(r => r.issues.length > 0);
  process.exit(hasIssues ? 1 : 0);
}

// Run the script
main();
