#!/usr/bin/env node

/**
 * Audit script for load POD evidence and signatures
 * Validates evidence images, manifest paths, and POD signature integrity
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Configuration
const LOAD_IDS = ['L001', 'L002', 'L003', 'L004', 'L005', 'L006', 'L007', 'L008', 'L009', 'L010', 'L011', 'L012'];
const REQUIRED_EVIDENCE_IMAGES = [
  'cargo-pickup.jpg',
  'cargo-delivery.jpg', 
  'trailer-empty.jpg',
  'trailer-loaded.jpg',
  'delivery-dock.jpg',
  'seal-pickup.jpg',
  'seal-delivery.jpg',
  'damage-photo.jpg',
  'lumper-receipt-photo.jpg'
];

class LoadPodEvidenceAuditor {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.successes = [];
    this.evidenceManifestPath = path.join(projectRoot, 'public/evidence/loads/load-evidence-manifest.json');
    this.podTemplatePath = path.join(projectRoot, 'scripts/templates/load-docs/pod.template.html');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  checkEvidenceDirectories() {
    this.log('Checking evidence directories for all 12 loads...');
    
    for (const loadId of LOAD_IDS) {
      const evidenceDir = path.join(projectRoot, `public/evidence/loads/${loadId}`);
      
      if (!fs.existsSync(evidenceDir)) {
        this.errors.push(`Missing evidence directory: ${evidenceDir}`);
        this.log(`Missing evidence directory for ${loadId}`, 'error');
        continue;
      }
      
      this.successes.push(`Evidence directory exists: ${loadId}`);
      this.log(`Evidence directory exists for ${loadId}`, 'success');
    }
  }

  checkEvidenceImages() {
    this.log('Checking evidence images for all 12 loads...');
    
    for (const loadId of LOAD_IDS) {
      const evidenceDir = path.join(projectRoot, `public/evidence/loads/${loadId}`);
      
      if (!fs.existsSync(evidenceDir)) {
        continue; // Skip if directory doesn't exist
      }
      
      const existingFiles = fs.readdirSync(evidenceDir);
      const missingFiles = [];
      
      for (const requiredFile of REQUIRED_EVIDENCE_IMAGES) {
        const filePath = path.join(evidenceDir, requiredFile);
        if (!fs.existsSync(filePath)) {
          missingFiles.push(requiredFile);
        }
      }
      
      if (missingFiles.length > 0) {
        this.errors.push(`Missing evidence files for ${loadId}: ${missingFiles.join(', ')}`);
        this.log(`Missing ${missingFiles.length} evidence files for ${loadId}`, 'error');
      } else {
        this.successes.push(`All required evidence files exist for ${loadId}`);
        this.log(`All required evidence files exist for ${loadId}`, 'success');
      }
    }
  }

  checkEvidenceManifest() {
    this.log('Checking evidence manifest...');
    
    if (!fs.existsSync(this.evidenceManifestPath)) {
      this.errors.push('Evidence manifest file does not exist');
      this.log('Evidence manifest file does not exist', 'error');
      return;
    }
    
    try {
      const manifest = JSON.parse(fs.readFileSync(this.evidenceManifestPath, 'utf8'));
      
      // Check if all loads are present in manifest
      for (const loadId of LOAD_IDS) {
        if (!manifest[loadId]) {
          this.errors.push(`Missing manifest entry for ${loadId}`);
          this.log(`Missing manifest entry for ${loadId}`, 'error');
          continue;
        }
        
        // Check if evidence entries use JPG files
        const loadManifest = manifest[loadId];
        const nonJpgEntries = [];
        
        for (const [key, entry] of Object.entries(loadManifest)) {
          if (entry.url && !entry.url.endsWith('.jpg')) {
            nonJpgEntries.push(`${key}: ${entry.url}`);
          }
        }
        
        if (nonJpgEntries.length > 0) {
          this.warnings.push(`Non-JPG evidence entries for ${loadId}: ${nonJpgEntries.join(', ')}`);
          this.log(`${nonJpgEntries.length} non-JPG evidence entries for ${loadId}`, 'warning');
        } else {
          this.successes.push(`All evidence entries use JPG files for ${loadId}`);
          this.log(`All evidence entries use JPG files for ${loadId}`, 'success');
        }
      }
      
      this.successes.push('Evidence manifest is valid JSON');
      this.log('Evidence manifest is valid JSON', 'success');
      
    } catch (error) {
      this.errors.push(`Failed to parse evidence manifest: ${error.message}`);
      this.log(`Failed to parse evidence manifest: ${error.message}`, 'error');
    }
  }

  checkPodTemplate() {
    this.log('Checking POD template for duplicate signatures...');
    
    if (!fs.existsSync(this.podTemplatePath)) {
      this.errors.push('POD template file does not exist');
      this.log('POD template file does not exist', 'error');
      return;
    }
    
    try {
      const templateContent = fs.readFileSync(this.podTemplatePath, 'utf8');
      
      // Check for duplicate signature elements
      const signatureScriptMatches = templateContent.match(/signature-script/g) || [];
      const signatureSvgMatches = templateContent.match(/SignatureSvgHtml/g) || [];
      
      if (signatureScriptMatches.length > 0) {
        this.errors.push(`Found ${signatureScriptMatches.length} duplicate signature-script elements in POD template`);
        this.log(`Found ${signatureScriptMatches.length} duplicate signature-script elements`, 'error');
      } else {
        this.successes.push('No duplicate signature-script elements found in POD template');
        this.log('No duplicate signature-script elements found', 'success');
      }
      
      if (signatureSvgMatches.length < 3) {
        this.warnings.push(`Expected 3 signature SVG elements, found ${signatureSvgMatches.length}`);
        this.log(`Expected 3 signature SVG elements, found ${signatureSvgMatches.length}`, 'warning');
      } else {
        this.successes.push(`Found ${signatureSvgMatches.length} signature SVG elements in POD template`);
        this.log(`Found ${signatureSvgMatches.length} signature SVG elements`, 'success');
      }
      
    } catch (error) {
      this.errors.push(`Failed to read POD template: ${error.message}`);
      this.log(`Failed to read POD template: ${error.message}`, 'error');
    }
  }

  checkGeneratedPodDocuments() {
    this.log('Checking generated POD documents...');
    
    for (const loadId of LOAD_IDS) {
      const podPath = path.join(projectRoot, `public/generated/loads/${loadId}/pod.html`);
      
      if (!fs.existsSync(podPath)) {
        this.errors.push(`Missing POD document: ${podPath}`);
        this.log(`Missing POD document for ${loadId}`, 'error');
        continue;
      }
      
      try {
        const podContent = fs.readFileSync(podPath, 'utf8');
        
        // Check for duplicate signatures in generated POD
        const signatureScriptMatches = podContent.match(/class="signature-script"/g) || [];
        const signatureImgMatches = podContent.match(/class="signature-img"/g) || [];
        
        if (signatureScriptMatches.length > 0) {
          this.errors.push(`Found ${signatureScriptMatches.length} duplicate signature-script elements in ${loadId} POD`);
          this.log(`Found ${signatureScriptMatches.length} duplicate signature-script elements in ${loadId} POD`, 'error');
        } else {
          this.successes.push(`No duplicate signature-script elements in ${loadId} POD`);
          this.log(`No duplicate signature-script elements in ${loadId} POD`, 'success');
        }
        
        if (signatureImgMatches.length < 3) {
          this.warnings.push(`Expected 3 signature images in ${loadId} POD, found ${signatureImgMatches.length}`);
          this.log(`Expected 3 signature images in ${loadId} POD, found ${signatureImgMatches.length}`, 'warning');
        } else {
          this.successes.push(`Found ${signatureImgMatches.length} signature images in ${loadId} POD`);
          this.log(`Found ${signatureImgMatches.length} signature images in ${loadId} POD`, 'success');
        }
        
      } catch (error) {
        this.errors.push(`Failed to read POD document for ${loadId}: ${error.message}`);
        this.log(`Failed to read POD document for ${loadId}: ${error.message}`, 'error');
      }
    }
  }

  checkLoadDocManifest() {
    this.log('Checking load document manifest...');
    
    const loadDocManifestPath = path.join(projectRoot, 'public/generated/loads/load-doc-manifest.json');
    
    if (!fs.existsSync(loadDocManifestPath)) {
      this.errors.push('Load document manifest does not exist');
      this.log('Load document manifest does not exist', 'error');
      return;
    }
    
    try {
      const manifest = JSON.parse(fs.readFileSync(loadDocManifestPath, 'utf8'));
      
      // Check if all loads have POD entries
      for (const loadId of LOAD_IDS) {
        if (!manifest[loadId] || !manifest[loadId].pod) {
          this.errors.push(`Missing POD entry for ${loadId} in load document manifest`);
          this.log(`Missing POD entry for ${loadId} in load document manifest`, 'error');
        } else {
          this.successes.push(`POD entry exists for ${loadId} in load document manifest`);
          this.log(`POD entry exists for ${loadId} in load document manifest`, 'success');
        }
      }
      
    } catch (error) {
      this.errors.push(`Failed to parse load document manifest: ${error.message}`);
      this.log(`Failed to parse load document manifest: ${error.message}`, 'error');
    }
  }

  runAudit() {
    this.log('Starting POD evidence audit for all 12 loads...');
    this.log('='.repeat(60));
    
    this.checkEvidenceDirectories();
    this.checkEvidenceImages();
    this.checkEvidenceManifest();
    this.checkPodTemplate();
    this.checkGeneratedPodDocuments();
    this.checkLoadDocManifest();
    
    this.log('='.repeat(60));
    this.log('Audit completed');
    this.log(`✅ Successes: ${this.successes.length}`);
    this.log(`⚠️ Warnings: ${this.warnings.length}`);
    this.log(`❌ Errors: ${this.errors.length}`);
    
    if (this.errors.length > 0) {
      this.log('\nERRORS:', 'error');
      this.errors.forEach(error => this.log(`  - ${error}`, 'error'));
    }
    
    if (this.warnings.length > 0) {
      this.log('\nWARNINGS:', 'warning');
      this.warnings.forEach(warning => this.log(`  - ${warning}`, 'warning'));
    }
    
    if (this.errors.length === 0) {
      this.log('\n🎉 All critical checks passed!');
    } else {
      this.log('\n💥 Some checks failed. Please review the errors above.');
    }
    
    return {
      success: this.errors.length === 0,
      summary: {
        successes: this.successes.length,
        warnings: this.warnings.length,
        errors: this.errors.length
      },
      details: {
        successes: this.successes,
        warnings: this.warnings,
        errors: this.errors
      }
    };
  }
}

// Run audit if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1].endsWith('audit-load-pod-evidence.mjs')) {
  const auditor = new LoadPodEvidenceAuditor();
  auditor.runAudit();
}

export default LoadPodEvidenceAuditor;
