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
const itemMatches = registryContent.matchAll(/{\s*id:\s*"([^"]+)"[\s\S]*?title:\s*"([^"]+)"[\s\S]*?status:\s*"([^"]+)"[\s\S]*?href:\s*"?([^"]*)"?\s*,?[\s\S]*?source:\s*"?([^"]*)"?\s*,?[\s\S]*?}/g);

for (const match of itemMatches) {
  items.push({
    id: match[1],
    title: match[2],
    status: match[3],
    href: match[4] || null,
    source: match[5] || null
  });
}

console.log('🔍 Operations File Cabinet Link Verification Report\n');

// Featured items list - filter from actual registry to match client component
const featuredItems = items
  .filter(item => 
    item.status !== "coming_soon" && 
    item.status !== "needs_review" &&
    item.href && 
    item.href.startsWith("/generated/") &&
    [
      // Driver Qualification Files (real documents only)
      "driver-cdl", "driver-medical", "driver-mvr", "driver-clearinghouse", 
      "driver-i9", "driver-w9", "driver-emergency-contacts", "driver-bank-info",
      "driver-policy-acknowledgment", "driver-road-test", "driver-employment-verification",
      "driver-incident-history",
      
      // Company Policies & SOPs (real generated policies only)
      "hr-employee-handbook", "policy-code-of-conduct", "hr-onboarding-checklist",
      "driver-withholding", "policy-accounting-finance", "policy-factoring-receivables",
      "claims-escalation-sop", "policy-vendor-maintenance", "policy-safety-compliance",
      "policy-information-security", "policy-privacy-data", "policy-ai-governance",
      "policy-tax-audit-readiness", "policy-cash-flow-management",
      
      // Dispatch & Load Documents (real generated files only)
      "contract-master-agreement", "dispatch-work-order", "dispatch-rate-confirmation",
      "dispatch-bol", "dispatch-pod",
      "claims-cargo-intake", "claims-insurance-notice",
      
      // HR Documents (real files only)
      "hr-termination-checklist"
    ].includes(item.id)
  )
  .map(item => item.id);

let totalFeatured = 0;
let passedFeatured = 0;
let failedFeatured = 0;

console.log('📋 Featured File Cabinet Items Verification:\n');

for (const itemId of featuredItems) {
  const item = items.find(i => i.id === itemId);
  if (!item) {
    console.log(`❌ ${itemId}: Item not found in registry`);
    failedFeatured++;
    continue;
  }

  totalFeatured++;
  let passed = true;
  let issues = [];

  // Check if href exists
  if (!item.href) {
    issues.push('Missing href');
    passed = false;
  }

  // Check if href points to generated file
  if (item.href && !item.href.startsWith('/generated/') && !item.href.startsWith('https://')) {
    issues.push('Href does not point to generated file or external resource');
    passed = false;
  }

  // Check if href points to broad module route
  if (item.href && ['/drivers', '/safety', '/settlements', '/documents', '/loads', '/evidence'].includes(item.href)) {
    issues.push('Href points to broad module route');
    passed = false;
  }

  // Check if file actually exists for generated paths
  if (item.href && item.href.startsWith('/generated/')) {
    const filePath = join(process.cwd(), 'public', item.href);
    if (!existsSync(filePath)) {
      issues.push('Generated file does not exist');
      passed = false;
    }
  }

  // Check if status allows href
  if (item.status === 'coming_soon' || item.status === 'needs_review') {
    if (item.href) {
      issues.push('Should not have href for coming_soon/needs_review status');
      passed = false;
    }
  }

  // Check for local filesystem paths
  if (item.href && (item.href.includes('C:') || item.href.includes('public/') || item.href.includes('scripts/'))) {
    issues.push('Uses local filesystem path');
    passed = false;
  }

  if (passed) {
    console.log(`✅ ${item.title}: ${item.href}`);
    passedFeatured++;
  } else {
    console.log(`❌ ${item.title}: ${issues.join(', ')}`);
    failedFeatured++;
  }
}

console.log(`\n📊 Featured Items Summary:`);
console.log(`Total Featured: ${totalFeatured}`);
console.log(`Passed: ${passedFeatured}`);
console.log(`Failed: ${failedFeatured}`);

// Check all items for issues
console.log(`\n🔍 All Items Verification:\n`);

let totalItems = 0;
let passedAll = 0;
let failedAll = 0;

for (const item of items) {
  totalItems++;
  let passed = true;
  let issues = [];

  // Basic href validation
  if (item.status === 'available' || item.status === 'template' || item.status === 'available_route') {
    if (!item.href) {
      issues.push('Missing href for available/template item');
      passed = false;
    }
  }

  // Check for local filesystem paths
  if (item.href && (item.href.includes('C:') || item.href.includes('public/') || item.href.includes('scripts/'))) {
    issues.push('Uses local filesystem path');
    passed = false;
  }

  // Check for broad module routes on document cards (allow for external_resource)
  if (item.href && ['/drivers', '/safety', '/settlements', '/documents', '/loads', '/evidence'].includes(item.href)) {
    if (item.type !== 'app-route' && item.status !== 'external_resource') {
      issues.push('Document card uses broad module route');
      passed = false;
    }
  }

  if (passed) {
    passedAll++;
  } else {
    console.log(`❌ ${item.title}: ${issues.join(', ')}`);
    failedAll++;
  }
}

console.log(`\n📊 All Items Summary:`);
console.log(`Total Items: ${totalItems}`);
console.log(`Passed: ${passedAll}`);
console.log(`Failed: ${failedAll}`);

// Exit with error code if any failures
if (failedFeatured > 0 || failedAll > 0) {
  console.log(`\n❌ Verification failed with ${failedFeatured + failedAll} issues`);
  process.exit(1);
} else {
  console.log(`\n✅ All links verified successfully!`);
}
