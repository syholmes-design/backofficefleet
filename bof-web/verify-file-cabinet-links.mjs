import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Read the operations file cabinet registry
const registryPath = join(process.cwd(), 'lib', 'operations-file-cabinet.ts');
const registryContent = readFileSync(registryPath, 'utf8');

// Extract the registry array
const registryMatch = registryContent.match(/export const OPERATIONS_FILE_CABINET_REGISTRY: OperationsFileCabinetItem\[\] = (\[[\s\S]*\]);/);
if (!registryMatch) {
  console.error('Could not find registry in file');
  process.exit(1);
}

// Parse the registry (simple approach)
const items = [];
const itemMatches = registryContent.matchAll(/{\s*id:\s*"([^"]+)"[\s\S]*?title:\s*"([^"]+)"[\s\S]*?cabinet:\s*"([^"]+)"[\s\S]*?section:\s*"([^"]+)"[\s\S]*?status:\s*"([^"]+)"[\s\S]*?href:\s*"?([^"]*)"?\s*,?[\s\S]*?sourceAuthenticity:\s*"?([^"]*)"?\s*,?[\s\S]*?}/g);

for (const match of itemMatches) {
  items.push({
    id: match[1],
    title: match[2],
    cabinet: match[3],
    section: match[4],
    status: match[5],
    href: match[6] || null,
    sourceAuthenticity: match[7] || null
  });
}

console.log('🔍 Operations File Cabinet Structure Verification Report\n');

// Verify cabinet architecture
const expectedCabinets = [
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

// Verify section grouping
const expectedSections = [
  "Blank Templates",
  "Completed Demo Samples",
  "Company Policies & SOPs",
  "BOF Dispatch Templates",
  "Claims Forms",
  "Legal / Contracts",
  "External Resources",
  "Needs Review / Coming Later"
];

// Check for blank templates (primary driver documents should point to blank templates)
const blankTemplateItems = items
  .filter(item => 
    item.section === "Blank Templates" &&
    item.href && 
    item.href.startsWith("/generated/templates/driver-docs/") &&
    item.id.includes("-template")
  )
  .map(item => item.id);

// Check for completed samples (John Carter/DRV-001 files only under Completed Demo Samples)
const completedSampleItems = items
  .filter(item => 
    item.section === "Completed Demo Samples" &&
    item.href && 
    item.href.startsWith("/generated/drivers/DRV-001/") &&
    (item.title.includes("John Carter") || item.title.includes("DRV-001"))
  )
  .map(item => item.id);

// Verify cabinet structure
console.log('�️ Cabinet Architecture Verification:\n');
let cabinetTestsPassed = 0;
let cabinetTestsTotal = 0;

// Check if all expected cabinets exist
const actualCabinets = [...new Set(items.map(item => item.cabinet).filter(Boolean))];
console.log(`Expected cabinets: ${expectedCabinets.length}`);
console.log(`Actual cabinets: ${actualCabinets.length}`);
cabinetTestsTotal++;

const missingCabinets = expectedCabinets.filter(cabinet => !actualCabinets.includes(cabinet));
if (missingCabinets.length === 0) {
  console.log('✅ All expected cabinets are present');
  cabinetTestsPassed++;
} else {
  console.log(`❌ Missing cabinets: ${missingCabinets.join(', ')}`);
}

// Verify section grouping
console.log('\n📁 Section Grouping Verification:\n');
const actualSections = [...new Set(items.map(item => item.section).filter(Boolean))];
console.log(`Expected sections: ${expectedSections.length}`);
console.log(`Actual sections: ${actualSections.length}`);
cabinetTestsTotal++;

const missingSections = expectedSections.filter(section => !actualSections.includes(section));
if (missingSections.length === 0) {
  console.log('✅ All expected sections are present');
  cabinetTestsPassed++;
} else {
  console.log(`❌ Missing sections: ${missingSections.join(', ')}`);
}

// Verify blank templates
console.log('\n📄 Blank Templates Verification:\n');
console.log(`Blank template items: ${blankTemplateItems.length}`);
cabinetTestsTotal++;

if (blankTemplateItems.length > 0) {
  console.log('✅ Blank templates found with proper structure');
  cabinetTestsPassed++;
  
  // Check that blank templates don't contain John Carter or DRV-001
  const invalidBlankTemplates = blankTemplateItems.filter(id => 
    items.find(item => item.id === id && (item.title.includes('John Carter') || item.title.includes('DRV-001')))
  );
  
  if (invalidBlankTemplates.length === 0) {
    console.log('✅ Blank templates do not contain John Carter or DRV-001');
    cabinetTestsPassed++;
  } else {
    console.log(`❌ Blank templates contain invalid references: ${invalidBlankTemplates.join(', ')}`);
  }
  cabinetTestsTotal++;
} else {
  console.log('❌ No blank templates found');
}

// Verify completed samples
console.log('\n📋 Completed Demo Samples Verification:\n');
console.log(`Completed sample items: ${completedSampleItems.length}`);
cabinetTestsTotal++;

if (completedSampleItems.length > 0) {
  console.log('✅ Completed demo samples found with proper structure');
  cabinetTestsPassed++;
  
  // Check that completed samples are only under Completed Demo Samples section
  const samplesInWrongSection = items.filter(item => 
    (item.title.includes('John Carter') || item.title.includes('DRV-001')) && 
    item.section !== 'Completed Demo Samples'
  );
  
  if (samplesInWrongSection.length === 0) {
    console.log('✅ John Carter/DRV-001 files only under Completed Demo Samples');
    cabinetTestsPassed++;
  } else {
    console.log(`❌ John Carter/DRV-001 files found in wrong sections: ${samplesInWrongSection.map(item => item.id).join(', ')}`);
  }
  cabinetTestsTotal++;
} else {
  console.log('❌ No completed demo samples found');
}

console.log(`\n📊 Structure Verification Summary:`);
console.log(`Total Tests: ${cabinetTestsTotal}`);
console.log(`Passed: ${cabinetTestsPassed}`);
console.log(`Failed: ${cabinetTestsTotal - cabinetTestsPassed}`);

// Check for broad module routes and basic structure issues
console.log(`\n🔍 Link Structure Verification:\n`);

let structureTestsPassed = 0;
let structureTestsTotal = 0;

for (const item of items) {
  structureTestsTotal++;
  let passed = true;
  let issues = [];

  // Check for broad module routes (forbidden)
  if (item.href && ['/drivers', '/safety', '/settlements', '/documents', '/loads', '/evidence'].includes(item.href)) {
    issues.push('Document card uses broad module route');
    passed = false;
  }

  // Check for local filesystem paths
  if (item.href && (item.href.includes('C:') || item.href.includes('public/') || item.href.includes('scripts/'))) {
    issues.push('Uses local filesystem path');
    passed = false;
  }

  // Check if href exists for available/template items
  if ((item.status === 'available' || item.status === 'template' || item.status === 'available_route') && !item.href) {
    issues.push('Missing href for available/template item');
    passed = false;
  }

  // Check if status allows href
  if ((item.status === 'coming_soon' || item.status === 'needs_review') && item.href) {
    issues.push('Should not have href for coming_soon/needs_review status');
    passed = false;
  }

  if (passed) {
    structureTestsPassed++;
  } else {
    console.log(`❌ ${item.title}: ${issues.join(', ')}`);
  }
}

console.log(`\n📊 Link Structure Summary:`);
console.log(`Total Items: ${structureTestsTotal}`);
console.log(`Passed: ${structureTestsPassed}`);
console.log(`Failed: ${structureTestsTotal - structureTestsPassed}`);

// Exit with error code if any failures
if (cabinetTestsPassed < cabinetTestsTotal || structureTestsPassed < structureTestsTotal) {
  console.log(`\n❌ Structure verification failed`);
  process.exit(1);
} else {
  console.log(`\n✅ Cabinet structure and template grouping verified successfully!`);
}
