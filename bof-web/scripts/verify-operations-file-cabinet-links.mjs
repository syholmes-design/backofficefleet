#!/usr/bin/env node

/**
 * Verification script for Operations File Cabinet architecture
 * Validates 9-cabinet system, metadata fields, and document links
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Import the operations file cabinet registry
const OPERATIONS_FILE_CABINET_PATH = join(process.cwd(), 'lib', 'operations-file-cabinet.ts');
const PUBLIC_DIR = join(process.cwd(), 'public');

// Expected 9 master cabinets
const EXPECTED_CABINETS = [
  "Driver Qualification Files",
  "Secondary Driver Documents", 
  "Dispatch & Load Operations",
  "Contracts / Customer / Legal",
  "Safety / Claims / Insurance",
  "HR / Talent / Performance",
  "Policies & SOPs",
  "Finance / Settlements / Back Office",
  "Training & Knowledge Base"
];

// Expected grouped sections
const EXPECTED_SECTIONS = [
  "Blank Templates",
  "Completed Demo Samples",
  "Company Policies & SOPs",
  "BOF Dispatch Templates",
  "Claims Forms",
  "Legal / Contracts",
  "External Resources",
  "Needs Review / Coming Later"
];

function extractOperationsRegistry() {
  try {
    const content = readFileSync(OPERATIONS_FILE_CABINET_PATH, 'utf-8');
    
    // Extract the OPERATIONS_FILE_CABINET_REGISTRY array
    const registryMatch = content.match(/export const OPERATIONS_FILE_CABINET_REGISTRY.*?=\s*\[([\s\S]*?)\];/);
    if (!registryMatch) {
      throw new Error('Could not find OPERATIONS_FILE_CABINET_REGISTRY');
    }
    
    // Parse the registry (simplified parsing for verification)
    const registryText = registryMatch[1];
    const items = [];
    
    // Find all item objects
    const itemMatches = registryText.match(/\{\s*id:\s*"[^"]+"/g);
    if (itemMatches) {
      // For verification, we'll count the matches
      return { itemCount: itemMatches.length, registryText };
    }
    
    return { itemCount: 0, registryText };
  } catch (error) {
    console.error('Error reading operations file cabinet:', error);
    return { itemCount: 0, registryText: '' };
  }
}

function verifyCabinets(registryText) {
  console.log('\n🔍 Verifying 9 Master Cabinets...');
  
  const foundCabinets = new Set();
  const cabinetMatches = registryText.match(/cabinet:\s*"([^"]+)"/g);
  
  if (cabinetMatches) {
    cabinetMatches.forEach(match => {
      const cabinet = match.match(/"([^"]+)"/)[1];
      foundCabinets.add(cabinet);
    });
  }
  
  const missingCabinets = EXPECTED_CABINETS.filter(cabinet => !foundCabinets.has(cabinet));
  const extraCabinets = Array.from(foundCabinets).filter(cabinet => !EXPECTED_CABINETS.includes(cabinet));
  
  console.log(`✅ Found ${foundCabinets.size} cabinets`);
  
  if (missingCabinets.length > 0) {
    console.log(`❌ Missing cabinets: ${missingCabinets.join(', ')}`);
  }
  
  if (extraCabinets.length > 0) {
    console.log(`⚠️  Extra cabinets: ${extraCabinets.join(', ')}`);
  }
  
  return {
    valid: missingCabinets.length === 0 && extraCabinets.length === 0,
    foundCabinets: Array.from(foundCabinets),
    missingCabinets,
    extraCabinets
  };
}

function verifySections(registryText) {
  console.log('\n🔍 Verifying Grouped Sections...');
  
  const foundSections = new Set();
  const sectionMatches = registryText.match(/section:\s*"([^"]+)"/g);
  
  if (sectionMatches) {
    sectionMatches.forEach(match => {
      const section = match.match(/"([^"]+)"/)[1];
      foundSections.add(section);
    });
  }
  
  const missingSections = EXPECTED_SECTIONS.filter(section => !foundSections.has(section));
  const extraSections = Array.from(foundSections).filter(section => !EXPECTED_SECTIONS.includes(section));
  
  console.log(`✅ Found ${foundSections.size} sections`);
  
  if (missingSections.length > 0) {
    console.log(`❌ Missing sections: ${missingSections.join(', ')}`);
  }
  
  if (extraSections.length > 0) {
    console.log(`⚠️  Extra sections: ${extraSections.join(', ')}`);
  }
  
  return {
    valid: missingSections.length === 0,
    foundSections: Array.from(foundSections),
    missingSections,
    extraSections
  };
}

function verifyDocumentLinks(registryText) {
  console.log('\n🔍 Verifying Document Links...');
  
  const hrefMatches = registryText.match(/href:\s*"([^"]+)"/g);
  const links = [];
  const invalidLinks = [];
  
  if (hrefMatches) {
    hrefMatches.forEach(match => {
      const href = match.match(/"([^"]+)"/)[1];
      links.push(href);
      
      // Check for invalid patterns
      if (href.startsWith('public/')) {
        invalidLinks.push({ href, issue: 'Starts with public/' });
      }
      if (href.includes('C:') || href.includes('\\')) {
        invalidLinks.push({ href, issue: 'Contains filesystem path' });
      }
      if (href.startsWith('/drivers') || href.startsWith('/safety') || href.startsWith('/settlements') || href.startsWith('/dispatch') || href.startsWith('/loads')) {
        invalidLinks.push({ href, issue: 'Uses broad module route' });
      }
    });
  }
  
  console.log(`✅ Found ${links.length} document links`);
  
  if (invalidLinks.length > 0) {
    console.log(`❌ Invalid links:`);
    invalidLinks.forEach(({ href, issue }) => {
      console.log(`   ${href} - ${issue}`);
    });
  }
  
  return {
    valid: invalidLinks.length === 0,
    totalLinks: links.length,
    invalidLinks
  };
}

function verifyBlankTemplates(registryText) {
  console.log('\n🔍 Verifying Blank Templates...');
  
  // Find items with isBlankTemplate: true
  const blankTemplateMatches = registryText.match(/\{[^}]*isBlankTemplate:\s*true[^}]*\}/g);
  const issues = [];
  
  if (blankTemplateMatches) {
    blankTemplateMatches.forEach(item => {
      // Check if blank templates contain John Carter or DRV-001
      if (item.includes('john') || item.includes('carter') || item.includes('DRV-001')) {
        issues.push({ item: item.substring(0, 100) + '...', issue: 'Contains driver-specific data in blank template' });
      }
    });
  }
  
  console.log(`✅ Found ${blankTemplateMatches?.length || 0} blank templates`);
  
  if (issues.length > 0) {
    console.log(`❌ Blank template issues:`);
    issues.forEach(({ item, issue }) => {
      console.log(`   ${issue}`);
    });
  }
  
  return {
    valid: issues.length === 0,
    blankTemplateCount: blankTemplateMatches?.length || 0,
    issues
  };
}

function verifyHeroChips(registryText) {
  console.log('\n🔍 Verifying Hero Chips...');
  
  // Check that each hero chip category has items
  const heroChipCategories = [
    { name: 'driver', cabinets: ['Driver Qualification Files', 'Secondary Driver Documents'] },
    { name: 'dispatch', cabinets: ['Dispatch & Load Operations'] },
    { name: 'policies', cabinets: ['Policies & SOPs'] },
    { name: 'claims-legal', cabinets: ['Safety / Claims / Insurance', 'Contracts / Customer / Legal'] },
    { name: 'training', cabinets: ['Training & Knowledge Base'] },
    { name: 'finance', cabinets: ['Finance / Settlements / Back Office'] }
  ];
  
  const issues = [];
  
  heroChipCategories.forEach(category => {
    const cabinetRegex = new RegExp(`cabinet:\\s*"(${category.cabinets.join('|')})"`, 'g');
    const matches = registryText.match(cabinetRegex);
    
    if (!matches || matches.length === 0) {
      issues.push({ category: category.name, issue: 'No items found' });
    } else {
      console.log(`✅ ${category.name}: ${matches.length} items`);
    }
  });
  
  return {
    valid: issues.length === 0,
    issues
  };
}

function runVerification() {
  console.log('🚀 Operations File Cabinet Verification');
  console.log('=====================================');
  
  // Extract registry
  const { itemCount, registryText } = extractOperationsRegistry();
  console.log(`📊 Registry contains ${itemCount} items`);
  
  if (itemCount === 0) {
    console.log('❌ No items found in registry');
    return false;
  }
  
  // Run verifications
  const cabinetVerification = verifyCabinets(registryText);
  const sectionVerification = verifySections(registryText);
  const linkVerification = verifyDocumentLinks(registryText);
  const templateVerification = verifyBlankTemplates(registryText);
  const heroChipVerification = verifyHeroChips(registryText);
  
  // Summary
  console.log('\n📋 Verification Summary');
  console.log('=====================');
  console.log(`✅ Cabinets: ${cabinetVerification.valid ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Sections: ${sectionVerification.valid ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Links: ${linkVerification.valid ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Templates: ${templateVerification.valid ? 'PASS' : 'FAIL'}`);
  console.log(`✅ Hero Chips: ${heroChipVerification.valid ? 'PASS' : 'FAIL'}`);
  
  const allValid = cabinetVerification.valid && 
                  sectionVerification.valid && 
                  linkVerification.valid && 
                  templateVerification.valid && 
                  heroChipVerification.valid;
  
  console.log(`\n🎯 Overall: ${allValid ? 'PASS' : 'FAIL'}`);
  
  if (!allValid) {
    console.log('\n❌ Verification failed. Please address the issues above.');
    process.exit(1);
  } else {
    console.log('\n✅ All verifications passed!');
    process.exit(0);
  }
}

// Run verification
runVerification();
