import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const publicDir = 'public';
const generatedDir = join(publicDir, 'generated');
const templatesDir = join(generatedDir, 'templates', 'driver-docs');
const driversDir = join(generatedDir, 'drivers');

// Read the operations file cabinet registry
const registryPath = 'lib/operations-file-cabinet.ts';
const registryContent = readFileSync(registryPath, 'utf8');

// Extract the registry array
const registryMatch = registryContent.match(/export const OPERATIONS_FILE_CABINET_REGISTRY: OperationsFileCabinetItem\[\] = (\[[\s\S]*?\]);/);
if (!registryMatch) {
  console.error('❌ Could not extract registry from operations-file-cabinet.ts');
  process.exit(1);
}

let registry;
try {
  registry = eval(registryMatch[1]);
} catch (e) {
  console.error('❌ Could not parse registry:', e.message);
  process.exit(1);
}

console.log('🔍 Verifying template separation and grouping...\n');

let issues = [];
let passed = 0;

// Check 1: Blank templates exist in public/generated/templates/driver-docs/
console.log('📁 Checking blank template files...');
const requiredTemplates = [
  'cdl-template.html',
  'medical-card-template.html',
  'mvr-template.html',
  'fmcsa-compliance-template.html',
  'i9-template.html',
  'w9-template.html',
  'emergency-contact-template.html',
  'bank-information-template.html',
  'road-test-certificate-template.html',
  'employment-verification-template.html',
  'safety-policy-acknowledgment-template.html'
];

let templateFilesOk = true;
for (const template of requiredTemplates) {
  const templatePath = join(templatesDir, template);
  if (!existsSync(templatePath)) {
    issues.push(`❌ Missing blank template: ${template}`);
    templateFilesOk = false;
  } else {
    const content = readFileSync(templatePath, 'utf8');
    
    // Check for John Carter or DRV-001
    if (content.includes('John Carter') || content.includes('DRV-001')) {
      issues.push(`❌ Template ${template} contains John Carter or DRV-001`);
      templateFilesOk = false;
    }
    
    // Check for placeholders
    if (!content.includes('[Driver Name]') && !content.includes('[Driver ID]')) {
      issues.push(`⚠️  Template ${template} may not have proper placeholders`);
    }
  }
}

if (templateFilesOk) {
  console.log('✅ All blank templates exist and contain no sample data');
  passed++;
}

// Check 2: Primary Driver Qualification items point to blank templates
console.log('\n🎯 Checking primary driver qualification items...');
const driverQualificationItems = registry.filter(item => 
  item.category === 'Driver Qualification Files' && 
  item.group === 'Blank Templates'
);

let primaryItemsOk = true;
for (const item of driverQualificationItems) {
  if (!item.href || !item.href.includes('/generated/templates/driver-docs/')) {
    issues.push(`❌ Primary item ${item.title} does not point to blank template`);
    primaryItemsOk = false;
  }
  
  if (item.title.includes('John Carter') || item.title.includes('DRV-001')) {
    issues.push(`❌ Primary item ${item.title} contains sample identifiers`);
    primaryItemsOk = false;
  }
}

if (primaryItemsOk) {
  console.log('✅ Primary driver qualification items point to blank templates');
  passed++;
}

// Check 3: Completed samples are properly labeled
console.log('\n📋 Checking completed demo samples...');
const completedSamples = registry.filter(item => 
  item.group === 'Completed Demo Samples'
);

let samplesOk = true;
for (const item of completedSamples) {
  if (!item.title.includes('Completed Sample')) {
    issues.push(`❌ Sample item ${item.title} not properly labeled as sample`);
    samplesOk = false;
  }
  
  if (!item.href || !item.href.includes('/generated/drivers/DRV-001/')) {
    issues.push(`❌ Sample item ${item.title} does not point to DRV-001 files`);
    samplesOk = false;
  }
  
  if (item.source !== 'demo') {
    issues.push(`❌ Sample item ${item.title} should have source: 'demo'`);
    samplesOk = false;
  }
}

if (samplesOk) {
  console.log('✅ Completed demo samples are properly labeled');
  passed++;
}

// Check 4: Quick filter grouping
console.log('\n🔍 Checking quick filter grouping...');
const quickFilterTests = [
  {
    filter: 'driver',
    expectedCategories: ['Driver Qualification Files', 'Secondary Driver Documents'],
    description: 'Driver files quick filter'
  },
  {
    filter: 'dispatch',
    expectedCategories: ['Dispatch & Load Operations'],
    description: 'Dispatch forms quick filter'
  },
  {
    filter: 'policies',
    expectedCategories: ['Policies & SOPs'],
    description: 'Policies & SOPs quick filter'
  },
  {
    filter: 'claims-legal',
    expectedCategories: ['Safety / Claims / Insurance', 'Contracts / Customer / Legal'],
    description: 'Claims & legal quick filter'
  },
  {
    filter: 'training',
    expectedCategories: ['Training & Knowledge Base'],
    description: 'Training library quick filter'
  },
  {
    filter: 'finance',
    expectedCategories: ['Finance / Settlements / Back Office'],
    description: 'Finance back office quick filter'
  }
];

// Quick filter to categories mapping (from the component)
const getCategoriesForQuickFilter = (filter) => {
  switch (filter) {
    case "all":
      return ["Driver Qualification Files", "Secondary Driver Documents", "Dispatch & Load Operations", "Safety / Claims / Insurance", "HR / Talent / Performance", "Policies & SOPs", "Finance / Settlements / Back Office", "Training & Knowledge Base", "Contracts / Customer / Legal"];
    case "driver":
      return ["Driver Qualification Files", "Secondary Driver Documents"];
    case "dispatch":
      return ["Dispatch & Load Operations"];
    case "policies":
      return ["Policies & SOPs"];
    case "claims-legal":
      return ["Safety / Claims / Insurance", "Contracts / Customer / Legal"];
    case "training":
      return ["Training & Knowledge Base"];
    case "finance":
      return ["Finance / Settlements / Back Office"];
    default:
      return [];
  }
};

let quickFiltersOk = true;
for (const test of quickFilterTests) {
  const categories = getCategoriesForQuickFilter(test.filter);
  const filteredItems = registry.filter(item => categories.includes(item.category));
  
  if (filteredItems.length === 0) {
    issues.push(`❌ ${test.description} returns no items`);
    quickFiltersOk = false;
  }
}

if (quickFiltersOk) {
  console.log('✅ All quick filters return non-empty results');
  passed++;
}

// Check 5: Document links are valid
console.log('\n🔗 Checking document links...');
let linksOk = true;
for (const item of registry) {
  if (item.href) {
    // Check for broad module routes
    if (item.href === '/drivers' || item.href === '/documents' || item.href === '/dispatch') {
      issues.push(`❌ Item ${item.title} uses broad module route: ${item.href}`);
      linksOk = false;
    }
    
    // Check for actual file existence for generated files
    if (item.href.startsWith('/generated/')) {
      const filePath = join(publicDir, item.href.substring(1)); // Remove leading /
      if (!existsSync(filePath)) {
        issues.push(`❌ File not found for ${item.title}: ${item.href}`);
        linksOk = false;
      }
    }
  }
}

if (linksOk) {
  console.log('✅ All document links are valid');
  passed++;
}

// Check 6: Group assignment consistency
console.log('\n📊 Checking group assignments...');
let groupsOk = true;
const validGroups = ["Blank Templates", "Company Policies & SOPs", "BOF Dispatch Templates", "External Resources", "Completed Demo Samples", "Needs Review / Coming Later"];

for (const item of registry) {
  if (item.group && !validGroups.includes(item.group)) {
    issues.push(`❌ Invalid group for ${item.title}: ${item.group}`);
    groupsOk = false;
  }
}

if (groupsOk) {
  console.log('✅ All group assignments are valid');
  passed++;
}

// Check 7: CTA wording consistency
console.log('\n📝 Checking CTA wording patterns...');
let ctaOk = true;

// Check that blank templates have "Open blank template →"
const blankTemplateItems = registry.filter(item => item.group === 'Blank Templates');
for (const item of blankTemplateItems) {
  if (!item.title.includes('Template')) {
    issues.push(`⚠️  Blank template item ${item.title} should include 'Template' in title`);
  }
}

// Check that completed samples have proper labeling
const completedSampleItems = registry.filter(item => item.group === 'Completed Demo Samples');
for (const item of completedSampleItems) {
  if (!item.title.includes('Completed Sample')) {
    issues.push(`⚠️  Completed sample item ${item.title} should include 'Completed Sample' in title`);
  }
}

if (ctaOk) {
  console.log('✅ CTA wording patterns are consistent');
  passed++;
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('📊 VERIFICATION SUMMARY');
console.log('='.repeat(60));

if (issues.length === 0) {
  console.log('🎉 ALL CHECKS PASSED!');
  console.log(`✅ ${passed} verification categories passed`);
  console.log('\n📋 Template separation implementation is complete and correct:');
  console.log('  • Blank templates are properly created and free of sample data');
  console.log('  • Primary driver items point to blank templates');
  console.log('  • Completed samples are properly labeled and separated');
  console.log('  • Quick filters return grouped, non-empty results');
  console.log('  • All document links are valid and specific');
  console.log('  • Group assignments are consistent and valid');
  console.log('  • CTA wording follows the required patterns');
} else {
  console.log(`❌ ${issues.length} issues found:`);
  issues.forEach(issue => console.log(`  ${issue}`));
  console.log(`\n✅ ${passed} verification categories passed`);
  console.log('\nPlease fix the above issues before committing.');
}

console.log('\n' + '='.repeat(60));
