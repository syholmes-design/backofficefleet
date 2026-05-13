#!/usr/bin/env node

/**
 * SIMPLE FILE CABINET VERIFICATION
 * Checks that Featured documents are properly configured
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, ".");

function verifyFileCabinet() {
  console.log(`\n🗂️ FILE CABINET VERIFICATION`);
  
  // Key featured documents to check
  const keyDocuments = [
    { title: "Commercial Driver License (CDL)", href: "/generated/drivers/DRV-001/cdl.html" },
    { title: "Medical Card", href: "/generated/drivers/DRV-001/medical-card.html" },
    { title: "MVR", href: "/generated/drivers/DRV-001/mvr.html" },
    { title: "Employee Handbook", href: "/generated/company-operations-vault/01-employee-handbook-template.html" },
    { title: "Rate Confirmation", href: "/documents/template-packs/rate-confirmation.html" },
    { title: "Bill of Lading", href: "/documents/template-packs/bill-of-lading.html" },
    { title: "Proof of Delivery", href: "/documents/template-packs/proof-of-delivery.html" },
    { title: "Claim Intake Form", href: "/documents/template-packs/claim-intake-form.html" },
    { title: "Load Tender / Order Sheet", href: "/documents/template-packs/load-tender-order-sheet.html" }
  ];
  
  console.log(`\n📋 KEY DOCUMENT VERIFICATION:`);
  console.log(`| Title | Href | File Exists | Pass/Fail |`);
  console.log(`|---|---|---|---|`);
  
  let passCount = 0;
  let failCount = 0;
  
  for (const doc of keyDocuments) {
    const filePath = path.join(ROOT, 'public', doc.href);
    const fileExists = fs.existsSync(filePath);
    const isModuleRoute = ["/drivers", "/safety", "/settlements", "/dispatch", "/loads", "/documents"].includes(doc.href);
    const isForbiddenPath = doc.href.startsWith("/public/") || doc.href.includes("/scripts/") || doc.href.includes("/templates/") || doc.href.includes("/source-assets/");
    const hasAbsolutePath = doc.href.includes(":\\");
    
    let pass = fileExists && !isModuleRoute && !isForbiddenPath && !hasAbsolutePath;
    let status = pass ? "✅ PASS" : "❌ FAIL";
    let existsStatus = fileExists ? "✅" : "❌";
    
    console.log(`| ${doc.title} | ${doc.href} | ${existsStatus} | ${status} |`);
    
    if (pass) {
      passCount++;
    } else {
      failCount++;
      if (!fileExists) console.log(`    ⚠️ File does not exist: ${filePath}`);
      if (isModuleRoute) console.log(`    ⚠️ Links to module route`);
      if (isForbiddenPath) console.log(`    ⚠️ Links to forbidden path`);
      if (hasAbsolutePath) console.log(`    ⚠️ Uses absolute file path`);
    }
  }
  
  console.log(`\n📝 SUMMARY:`);
  console.log(`✅ Passed: ${passCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📊 Total: ${keyDocuments.length}`);
  
  // Check component file for proper implementation
  const componentPath = path.join(ROOT, 'components', 'documents', 'OperationsFileCabinetClient.tsx');
  if (fs.existsSync(componentPath)) {
    const componentContent = fs.readFileSync(componentPath, 'utf8');
    
    console.log(`\n🧩 COMPONENT VERIFICATION:`);
    
    const checks = {
      'Featured Documents section': componentContent.includes('Featured Documents & Templates'),
      'Category cards filter within page': componentContent.includes('setSelectedCategory(summary.category)'),
      'Document-first CTAs': componentContent.includes('Browse documents →') || componentContent.includes('Show files →'),
      'Source chips': componentContent.includes('getSourceChip(item)'),
      'Hero watermark': componentContent.includes('operations-file-cabinet-watermark.png'),
      'Bottom padding increased': componentContent.includes('paddingBottom: "8rem"')
    };
    
    console.log(`| Check | Status |`);
    console.log(`|---|---|---`);
    
    for (const [check, passed] of Object.entries(checks)) {
      const status = passed ? "✅ PASS" : "❌ FAIL";
      console.log(`| ${check} | ${status} |`);
    }
  }
  
  console.log(`\n💡 RECOMMENDATIONS:`);
  console.log(`- Ensure all key document files exist in the project`);
  console.log(`- Use /generated/ for driver documents and company policies`);
  console.log(`- Use /documents/template-packs/ for authentic templates`);
  console.log(`- Avoid linking to module routes (/drivers, /safety, etc.)`);
  console.log(`- Category cards should filter within the page, not navigate away`);
  console.log(`- Featured section should show real documents only`);
}

verifyFileCabinet();
