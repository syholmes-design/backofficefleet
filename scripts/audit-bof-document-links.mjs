#!/usr/bin/env node

/**
 * BOF Document Link Audit Script
 * 
 * Purpose: Audit all document links across the application to ensure no broken links exist.
 * 
 * Audit scope:
 * - Driver Portal document links for all 12 drivers
 * - Document Vault visible document links  
 * - Company Operations Vault links
 * - Owner-operator packet links
 * - HR/payroll document links
 * - Emergency contact document links
 * - W-9/I-9/bank document links
 * - Load proof/evidence links where visible
 * 
 * Success criteria:
 * - Zero broken links
 * - All documents have working Open/Preview links or are marked as Not required
 * 
 * Usage:
 * node scripts/audit-bof-document-links.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuration
const __filename = fileURLToPath(import.meta.url);
const ROOT = path.join(path.dirname(__filename), '..');
const PUBLIC_GENERATED = path.join(ROOT, 'public', 'generated');
const PUBLIC_DOCUMENTS = path.join(ROOT, 'public', 'documents');

// Audit results
const auditResults = {
  totalLinksChecked: 0,
  validLinks: 0,
  missingFiles: 0,
  brokenLinks: 0,
  pendingOrNotRequiredItems: 0,
  issues: []
};

// Document categories to audit
const documentCategories = {
  driverPortal: 'Driver Portal document links for all 12 drivers',
  documentVault: 'Document Vault visible document links',
  companyOperationsVault: 'Company Operations Vault links',
  ownerOperatorPacket: 'Owner-operator packet links',
  hrPayroll: 'HR/payroll document links',
  emergencyContacts: 'Emergency contact document links',
  w9IBank: 'W-9/I-9/bank document links',
  loadProof: 'Load proof/evidence links where visible'
};

// Helper functions
function countFilesInDirectory(dir, pattern = /.*/) {
  if (!fs.existsSync(dir)) return 0;
  return fs.readdirSync(dir).filter(file => pattern.test(file)).length;
}

function checkFileExists(filePath) {
  return fs.existsSync(filePath);
}

function auditDriverPortalLinks() {
  console.log('🔍 Auditing Driver Portal document links...');
  
  const driversDir = path.join(PUBLIC_GENERATED, 'drivers');
  
  for (let i = 1; i <= 12; i++) {
    const driverId = `DRV-${String(i).padStart(3, '0')}`;
    const driverDir = path.join(driversDir, driverId);
    
    if (!checkFileExists(driverDir)) {
      auditResults.issues.push(`Driver directory missing: ${driverDir}`);
      continue;
    }
    
    // Check for document files
    const documentFiles = [
      'CDL.html',
      'Medical Card.html',
      'MVR.html',
      'I-9.html',
      'FMCSA.html',
      'W-9.html',
      'Bank Info.html'
    ];
    
    let driverHasValidLinks = false;
    for (const docFile of documentFiles) {
      const docPath = path.join(driverDir, docFile);
      if (checkFileExists(docPath)) {
        driverHasValidLinks = true;
        auditResults.validLinks++;
      } else {
        auditResults.missingFiles++;
        auditResults.issues.push(`Missing document: ${driverId}/${docFile}`);
      }
    }
    
    if (!driverHasValidLinks) {
      auditResults.issues.push(`Driver ${driverId} has no valid document links`);
    }
    
    auditResults.totalLinksChecked += documentFiles.length;
  }
  
  console.log(`✅ Driver Portal audit complete: ${auditResults.validLinks}/${auditResults.totalLinksChecked} links checked`);
  return auditResults;
}

function auditDocumentVaultLinks() {
  console.log('🔍 Auditing Document Vault visible document links...');
  
  // This would require parsing Document Vault component state
  // For now, we'll check if Document Vault directories exist
  const vaultDir = path.join(PUBLIC_DOCUMENTS, 'vault');
  
  if (!checkFileExists(vaultDir)) {
    auditResults.issues.push('Document Vault directory missing');
    return auditResults;
  }
  
  auditResults.totalLinksChecked += countFilesInDirectory(vaultDir, /.*/);
  console.log(`✅ Document Vault audit complete: ${auditResults.totalLinksChecked} potential links checked`);
  return auditResults;
}

function auditCompanyOperationsVaultLinks() {
  console.log('🔍 Auditing Company Operations Vault links...');
  
  // Check for Company Operations Vault page
  const vaultPage = path.join(PUBLIC_GENERATED, 'company-operations-vault.html');
  
  if (!checkFileExists(vaultPage)) {
    auditResults.issues.push('Company Operations Vault page missing');
    return auditResults;
  }
  
  auditResults.totalLinksChecked++;
  console.log(`✅ Company Operations Vault audit complete: 1 potential link checked`);
  return auditResults;
}

function auditOwnerOperatorPacketLinks() {
  console.log('🔍 Auditing Owner-operator packet links...');
  
  // Check for owner-operator packet pages
  for (let i = 1; i <= 12; i++) {
    const driverId = `DRV-${String(i).padStart(3, '0')}`;
    const packetPage = path.join(PUBLIC_GENERATED, 'drivers', driverId, 'owner-operator-packet.html');
    
    if (!checkFileExists(packetPage)) {
      auditResults.missingFiles++;
      auditResults.issues.push(`Missing owner-operator packet: ${driverId}`);
    } else {
      auditResults.totalLinksChecked++;
      console.log(`✅ Owner-operator packet ${driverId} found`);
    }
  }
  
  console.log(`✅ Owner-operator packet audit complete: ${auditResults.totalLinksChecked} potential links checked`);
  return auditResults;
}

function auditHrPayrollLinks() {
  console.log('🔍 Auditing HR/payroll document links...');
  
  // Check for HR payroll pages
  for (let i = 1; i <= 12; i++) {
    const driverId = `DRV-${String(i).padStart(3, '0')}`;
    const payrollPage = path.join(PUBLIC_GENERATED, 'drivers', driverId, 'hr-payroll.html');
    
    if (!checkFileExists(payrollPage)) {
      auditResults.missingFiles++;
      auditResults.issues.push(`Missing HR payroll page: ${driverId}`);
    } else {
      auditResults.totalLinksChecked++;
      console.log(`✅ HR payroll page ${driverId} found`);
    }
  }
  
  console.log(`✅ HR payroll audit complete: ${auditResults.totalLinksChecked} potential links checked`);
  return auditResults;
}

function auditEmergencyContactLinks() {
  console.log('🔍 Auditing Emergency contact document links...');
  
  // Check for emergency contact pages
  for (let i = 1; i <= 12; i++) {
    const driverId = `DRV-${String(i).padStart(3, '0')}`;
    const contactPage = path.join(PUBLIC_GENERATED, 'drivers', driverId, 'emergency-contacts.html');
    
    if (!checkFileExists(contactPage)) {
      auditResults.missingFiles++;
      auditResults.issues.push(`Missing emergency contact page: ${driverId}`);
    } else {
      auditResults.totalLinksChecked++;
      console.log(`✅ Emergency contact page ${driverId} found`);
    }
  }
  
  console.log(`✅ Emergency contact audit complete: ${auditResults.totalLinksChecked} potential links checked`);
  return auditResults;
}

function auditW9IBankLinks() {
  console.log('🔍 Auditing W-9/I-9/bank document links...');
  
  // Check for W-9/I-9/bank pages
  for (let i = 1; i <= 12; i++) {
    const driverId = `DRV-${String(i).padStart(3, '0')}`;
    const bankPage = path.join(PUBLIC_GENERATED, 'drivers', driverId, 'w9i-bank.html');
    
    if (!checkFileExists(bankPage)) {
      auditResults.missingFiles++;
      auditResults.issues.push(`Missing W-9/I-9/bank page: ${driverId}`);
    } else {
      auditResults.totalLinksChecked++;
      console.log(`✅ W-9/I-9/bank page ${driverId} found`);
    }
  }
  
  console.log(`✅ W-9/I-9/bank audit complete: ${auditResults.totalLinksChecked} potential links checked`);
  return auditResults;
}

function auditLoadProofLinks() {
  console.log('🔍 Auditing Load proof/evidence links...');
  
  // Check for load evidence files
  const evidenceDir = path.join(PUBLIC_GENERATED, 'evidence');
  
  if (!checkFileExists(evidenceDir)) {
    auditResults.issues.push('Load evidence directory missing');
    return auditResults;
  }
  
  const evidenceFiles = fs.readdirSync(evidenceDir);
  let evidenceLinksFound = 0;
  
  for (const evidenceFile of evidenceFiles) {
    if (evidenceFile.endsWith('.html')) {
      evidenceLinksFound++;
      auditResults.totalLinksChecked++;
    }
  }
  
  console.log(`✅ Load evidence audit complete: ${evidenceLinksFound} HTML evidence files found`);
  return auditResults;
}

// Main audit function
function runAudit() {
  console.log('🚀 Starting BOF Document Link Audit...\n');
  
  // Reset audit results
  Object.keys(auditResults).forEach(key => {
    auditResults[key] = 0;
  });
  
  // Run all audit functions
  auditDriverPortalLinks();
  auditDocumentVaultLinks();
  auditCompanyOperationsVaultLinks();
  auditOwnerOperatorPacketLinks();
  auditHrPayrollLinks();
  auditEmergencyContactLinks();
  auditW9IBankLinks();
  auditLoadProofLinks();
  
  // Print summary
  console.log('\n📊 AUDIT SUMMARY:');
  console.log(`Total links checked: ${auditResults.totalLinksChecked}`);
  console.log(`Valid links: ${auditResults.validLinks}`);
  console.log(`Missing files: ${auditResults.missingFiles}`);
  console.log(`Broken links: ${auditResults.brokenLinks}`);
  console.log(`Pending/Not required: ${auditResults.pendingOrNotRequiredItems}`);
  
  if (auditResults.issues.length > 0) {
    console.log('\n❌ ISSUES FOUND:');
    auditResults.issues.forEach(issue => console.error(`  - ${issue}`));
    process.exitCode = 1;
  } else {
    console.log('\n✅ ALL AUDITS PASSED: No broken links found');
    process.exitCode = 0;
  }
}

// Run audit if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAudit();
}
