#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Configuration
const MANIFEST_PATH = 'public/evidence/loads/load-evidence-manifest.json';
const EVIDENCE_BASE_PATH = 'public/evidence/loads';
const MIN_FILE_SIZE = 1024; // 1KB

// Evidence key mappings to stable target files
const EVIDENCE_MAPPINGS = {
  // Cargo photos
  'cargoPhoto': 'cargo-pickup.jpg',
  'cargoPickupPhoto': 'cargo-pickup.jpg',
  'pickupPhoto': 'cargo-pickup.jpg',
  
  // Delivery photos
  'cargoDeliveryPhoto': 'cargo-delivery.jpg',
  'deliveryCargoPhoto': 'cargo-delivery.jpg',
  'deliveryPhoto': 'cargo-delivery.jpg',
  
  // Trailer photos
  'emptyTrailerPhoto': 'trailer-empty.jpg',
  'trailerEmptyPhoto': 'trailer-empty.jpg',
  'emptyTrailerProof': 'trailer-empty.jpg',
  
  'loadedTrailerPhoto': 'trailer-loaded.jpg',
  'equipmentPhoto': 'trailer-loaded.jpg',
  'trailerLoadedPhoto': 'trailer-loaded.jpg',
  
  // Dock photos
  'deliveryDockPhoto': 'delivery-dock.jpg',
  'dockPhoto': 'delivery-dock.jpg',
  'rfidDockProof': 'delivery-dock.jpg',
  
  // Seal photos
  'sealPickupPhoto': 'seal-pickup.jpg',
  'sealDeliveryPhoto': 'seal-delivery.jpg',
  'sealPhoto': 'seal-delivery.jpg',
  
  // Damage photos (only if damage-photo.jpg exists and >1KB)
  'damagePhoto': 'damage-photo.jpg',
  'cargoDamagePhoto': 'damage-photo.jpg',
  'damagedPalletPhoto': 'damage-photo.jpg',
  
  // Receipt/claim photos (only if lumper-receipt-photo.jpg exists and >1KB)
  'lumperReceiptPhoto': 'lumper-receipt-photo.jpg',
  'claimEvidence': 'lumper-receipt-photo.jpg',
  'lumperReceipt': 'lumper-receipt-photo.jpg'
};

// Utility functions
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

function fileExistsAndIsLarge(filePath) {
  const size = getFileSize(filePath);
  return size > MIN_FILE_SIZE;
}

function getLoadIdFromUrl(url) {
  const match = url.match(/\/evidence\/loads\/(L\d{3})\//);
  return match ? match[1] : null;
}

function getEvidenceTypeFromUrl(url) {
  const match = url.match(/\/([^\/]+)\.(jpg|png|svg)$/);
  return match ? match[1] : null;
}

function isSvgPlaceholder(url, source) {
  return url.endsWith('.svg') || source === 'svg_demo';
}

function isRealisticPng(url, loadId) {
  if (!url.endsWith('.png')) return false;
  
  // Check if it's a high-quality realistic PNG (large file size)
  const fullPath = path.join(process.cwd(), url.replace(/^\//, ''));
  return fileExistsAndIsLarge(fullPath);
}

// Main processing function
function processManifest() {
  console.log('🔧 Starting manifest cleanup...');
  
  // Load the manifest
  let manifest;
  try {
    const manifestContent = fs.readFileSync(MANIFEST_PATH, 'utf8');
    manifest = JSON.parse(manifestContent);
  } catch (error) {
    console.error('❌ Failed to load manifest:', error.message);
    process.exit(1);
  }
  
  const summary = {
    loadsProcessed: 0,
    entriesUpdated: 0,
    jpgPathsUsed: 0,
    pngPathsRetained: 0,
    svgPlaceholdersRemoved: 0,
    pendingOrNotRequired: 0,
    missingFiles: 0,
    duplicateKeysFixed: 0
  };
  
  // Process each load
  for (const [loadId, loadData] of Object.entries(manifest)) {
    if (!loadId.startsWith('L')) continue;
    
    summary.loadsProcessed++;
    console.log(`\n📦 Processing ${loadId}...`);
    
    // Process each evidence item in the load
    for (const [evidenceKey, evidenceData] of Object.entries(loadData)) {
      if (evidenceKey === 'pod') continue; // Skip POD entries
      
      const currentUrl = evidenceData.url;
      const currentSource = evidenceData.source || 'real';
      
      // Skip if already empty
      if (!currentUrl) {
        summary.pendingOrNotRequired++;
        continue;
      }
      
      const evidenceLoadId = getLoadIdFromUrl(currentUrl);
      if (!evidenceLoadId || evidenceLoadId !== loadId) {
        console.warn(`⚠️  Load ID mismatch for ${loadId}.${evidenceKey}: ${currentUrl}`);
        continue;
      }
      
      // Determine the target file based on mapping
      const targetFile = EVIDENCE_MAPPINGS[evidenceKey];
      if (!targetFile) {
        console.log(`ℹ️  No mapping for ${evidenceKey}, keeping current: ${currentUrl}`);
        continue;
      }
      
      const targetPath = `${EVIDENCE_BASE_PATH}/${loadId}/${targetFile}`;
      const targetFullPath = path.join(process.cwd(), targetPath);
      
      // Check if target file exists and is large enough
      if (fileExistsAndIsLarge(targetFullPath)) {
        // Update to use the target JPG
        if (currentUrl !== `/${targetPath}`) {
          evidenceData.url = `/${targetPath}`;
          evidenceData.basename = targetFile.replace(/\.(jpg|png|svg)$/, '');
          evidenceData.source = 'real';
          evidenceData.generatedAt = '2026-05-08T20:00:00.000Z';
          evidenceData.applicable = true;
          
          // Remove reason if it was marked as not required
          delete evidenceData.reason;
          
          summary.entriesUpdated++;
          summary.jpgPathsUsed++;
          console.log(`✅ Updated ${loadId}.${evidenceKey}: ${currentUrl} → /${targetPath}`);
        }
      } else {
        // Target file doesn't exist or is too small
        if (isSvgPlaceholder(currentUrl, currentSource)) {
          // Remove SVG placeholders
          evidenceData.url = '';
          evidenceData.source = 'missing';
          evidenceData.generatedAt = '2026-05-08T20:00:00.000Z';
          evidenceData.applicable = false;
          evidenceData.reason = 'Placeholder removed - no suitable replacement found';
          
          summary.svgPlaceholdersRemoved++;
          summary.pendingOrNotRequired++;
          console.log(`🗑️  Removed SVG placeholder ${loadId}.${evidenceKey}: ${currentUrl}`);
        } else if (isRealisticPng(currentUrl, loadId)) {
          // Keep realistic PNG files
          summary.pngPathsRetained++;
          console.log(`📸 Retained realistic PNG ${loadId}.${evidenceKey}: ${currentUrl}`);
        } else {
          // Mark as missing or not required
          evidenceData.url = '';
          evidenceData.source = 'missing';
          evidenceData.generatedAt = '2026-05-08T20:00:00.000Z';
          evidenceData.applicable = false;
          evidenceData.reason = 'No suitable evidence file available';
          
          summary.missingFiles++;
          summary.pendingOrNotRequired++;
          console.log(`❌ Marked missing ${loadId}.${evidenceKey}: ${currentUrl}`);
        }
      }
    }
  }
  
  // Save the updated manifest
  try {
    const updatedManifest = JSON.stringify(manifest, null, 2);
    fs.writeFileSync(MANIFEST_PATH, updatedManifest, 'utf8');
    console.log('\n💾 Manifest saved successfully');
  } catch (error) {
    console.error('❌ Failed to save manifest:', error.message);
    process.exit(1);
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 MANIFEST CLEANUP SUMMARY');
  console.log('='.repeat(60));
  console.log(`📦 Loads processed: ${summary.loadsProcessed}`);
  console.log(`🔄 Entries updated: ${summary.entriesUpdated}`);
  console.log(`📸 JPG paths used: ${summary.jpgPathsUsed}`);
  console.log(`🖼️  PNG paths retained: ${summary.pngPathsRetained}`);
  console.log(`🗑️  SVG placeholders removed: ${summary.svgPlaceholdersRemoved}`);
  console.log(`⏸️  Pending/not_required entries: ${summary.pendingOrNotRequired}`);
  console.log(`❌ Missing files: ${summary.missingFiles}`);
  console.log(`🔧 Duplicate keys fixed: ${summary.duplicateKeysFixed}`);
  console.log('='.repeat(60));
  
  return summary;
}

// Run the script
processManifest();

export { processManifest };
