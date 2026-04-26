/**
 * Driver-Level Duplicate Reconciliation Service
 * 
 * Identifies canonical files, duplicates, and stale variants for each driver
 * and maps them to proper BOF Vault categories.
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { DqfDocumentType } from "./dqf-types";

export interface DriverFile {
  fileName: string;
  filePath: string;
  fileFormat: 'html' | 'png' | 'jpg' | 'pdf' | 'docx';
  fileSize: number;
  lastModified: Date;
  documentType: DqfDocumentType | 'Unknown';
  bofVaultCategory: string;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  isCanonical: boolean;
  isDuplicate: boolean;
  isStale: boolean;
  duplicateReason?: string;
  canonicalReason?: string;
}

export interface DriverReconciliationResult {
  driverId: string;
  filesFound: DriverFile[];
  canonicalFiles: Map<string, DriverFile>; // documentType -> canonical file
  duplicateFiles: DriverFile[];
  staleFiles: DriverFile[];
  missingDocumentTypes: string[];
  vaultMapping: Map<string, string>; // documentType -> vaultCategory
  needsRegeneration: string[];
  errors: string[];
}

export interface DuplicateReconciliationSummary {
  totalDrivers: number;
  totalFilesFound: number;
  totalCanonicalFiles: number;
  totalDuplicateFiles: number;
  totalStaleFiles: number;
  totalMissingDocuments: number;
  driverResults: DriverReconciliationResult[];
  errors: string[];
}

export class DriverDuplicateReconciliationService {
  private baseDir: string;
  
  // BOF Vault category mappings
  private readonly VAULT_CATEGORIES: Record<string, string> = {
    "CDL": "CDL",
    "Medical Certification": "Medical Certification",
    "Medical Card": "Medical Certification",
    "MVR": "MVR",
    "Driver Application": "Driver Profile / Application",
    "Employment Verification": "Employment / I-9",
    "I-9": "Employment / I-9",
    "W-9": "W-9",
    "Road Test Certificate": "FMCSA / Compliance",
    "Drug Test Result": "FMCSA / Compliance",
    "Alcohol Test Result": "FMCSA / Compliance",
    "Prior Employer Inquiry": "Other / Supporting Docs",
    "Emergency Contact": "Emergency Contact",
    "Secondary Contact": "Secondary Contact",
    "FMCSA Clearinghouse": "FMCSA / Compliance",
    "Safety Performance History": "FMCSA / Compliance",
    "Annual Review": "FMCSA / Compliance",
    "Training Records": "FMCSA / Compliance",
    "Vehicle Inspection Reports": "Other / Supporting Docs",
    "Incident Reports": "Other / Supporting Docs",
    "TWIC Card": "Other / Supporting Docs",
    "HAZMAT Endorsement": "Other / Supporting Docs",
    "Tanker Endorsement": "Other / Supporting Docs",
    "Passport": "Other / Supporting Docs",
    "Defensive Driving Certificate": "Other / Supporting Docs",
    "Physical Examination Form": "Medical Certification",
    "Direct Deposit Form": "Bank Information",
    "Bank Information": "Bank Information",
    "Payroll Setup": "Bank Information",
    "Uniform Agreement": "Other / Supporting Docs",
    "Equipment Assignment": "Other / Supporting Docs",
    "Other / Supporting Docs": "Other / Supporting Docs"
  };

  constructor() {
    this.baseDir = process.cwd();
  }

  /**
   * Get file format from filename
   */
  private getFileFormat(fileName: string): DriverFile['fileFormat'] {
    const ext = path.extname(fileName).toLowerCase();
    switch (ext) {
      case '.html': return 'html';
      case '.png': return 'png';
      case '.jpg': 
      case '.jpeg': return 'jpg';
      case '.pdf': return 'pdf';
      case '.docx': 
      case '.doc': return 'docx';
      default: return 'html'; // Default to HTML for unknown types
    }
  }

  /**
   * Determine document type from filename
   */
  private determineDocumentType(fileName: string): DqfDocumentType | 'Unknown' {
    const lowerFileName = fileName.toLowerCase();
    
    // Priority mappings for document type detection
    const typeMappings: Record<string, DqfDocumentType> = {
      'cdl': 'CDL',
      'medical': 'Medical Certification',
      'medcard': 'Medical Card',
      'mvr': 'MVR',
      'motor_vehicle': 'MVR',
      'application': 'Driver Application',
      'driver-application': 'Driver Application',
      'employment': 'Employment Verification',
      'i9': 'I-9',
      'i-9': 'I-9',
      'w9': 'W-9',
      'w-9': 'W-9',
      'road': 'Road Test Certificate',
      'road-test': 'Road Test Certificate',
      'test': 'Road Test Certificate',
      'drug': 'Drug Test Result',
      'drug-test': 'Drug Test Result',
      'alcohol': 'Alcohol Test Result',
      'inquiry': 'Prior Employer Inquiry',
      'employer': 'Prior Employer Inquiry',
      'emergency': 'Emergency Contact',
      'emergency-contact': 'Emergency Contact',
      'secondary': 'Secondary Contact',
      'fmcsa': 'FMCSA Clearinghouse',
      'mcsa': 'FMCSA Clearinghouse',
      'clearinghouse': 'FMCSA Clearinghouse',
      'safety': 'Safety Performance History',
      'annual': 'Annual Review',
      'training': 'Training Records',
      'vehicle': 'Vehicle Inspection Reports',
      'incident': 'Incident Reports',
      'twic': 'TWIC Card',
      'hazmat': 'HAZMAT Endorsement',
      'tanker': 'Tanker Endorsement',
      'passport': 'Passport',
      'defensive': 'Defensive Driving Certificate',
      'physical': 'Physical Examination Form',
      'deposit': 'Direct Deposit Form',
      'bank': 'Bank Information',
      'bank-info': 'Bank Information',
      'bank-card': 'Bank Information',
      'payroll': 'Payroll Setup',
      'uniform': 'Uniform Agreement',
      'equipment': 'Equipment Assignment'
    };
    
    // Check for exact matches first
    for (const [key, value] of Object.entries(typeMappings)) {
      if (lowerFileName.includes(key)) {
        return value;
      }
    }
    
    return 'Unknown';
  }

  /**
   * Assess file quality based on format and content indicators
   */
  private assessFileQuality(fileName: string, fileSize: number, fileFormat: DriverFile['fileFormat']): DriverFile['quality'] {
    const lowerFileName = fileName.toLowerCase();
    
    // Check for quality indicators in filename
    const qualityIndicators = {
      excellent: ['final', 'official', 'signed', 'complete'],
      good: ['current', 'updated', 'latest', 'v2'],
      fair: ['draft', 'temp', 'partial', 'incomplete'],
      poor: ['old', 'backup', 'copy', 'duplicate']
    };
    
    for (const [quality, indicators] of Object.entries(qualityIndicators)) {
      for (const indicator of indicators) {
        if (lowerFileName.includes(indicator)) {
          return quality as DriverFile['quality'];
        }
      }
    }
    
    // Default quality based on format and size
    if (fileFormat === 'html' && fileSize > 5000) return 'excellent';
    if (fileFormat === 'html' && fileSize > 2000) return 'good';
    if (fileFormat === 'png' && fileSize > 50000) return 'excellent';
    if (fileFormat === 'png' && fileSize > 20000) return 'good';
    
    return 'fair';
  }

  /**
   * Inventory all files for a driver
   */
  private async inventoryDriverFiles(driverId: string): Promise<DriverFile[]> {
    const files: DriverFile[] = [];
    
    // Check both documents and generated directories
    const directories = [
      path.join(this.baseDir, 'public', 'documents', 'drivers', driverId),
      path.join(this.baseDir, 'public', 'generated', 'drivers', driverId)
    ];
    
    for (const dir of directories) {
      try {
        if (await fs.access(dir).then(() => true).catch(() => false)) {
          const fileNames = await fs.readdir(dir);
          
          for (const fileName of fileNames) {
            const filePath = path.join(dir, fileName);
            const stats = await fs.stat(filePath);
            
            const fileFormat = this.getFileFormat(fileName);
            const documentType = this.determineDocumentType(fileName);
            const bofVaultCategory = this.VAULT_CATEGORIES[documentType] || 'Other / Supporting Docs';
            const quality = this.assessFileQuality(fileName, stats.size, fileFormat);
            
            files.push({
              fileName,
              filePath: path.relative(path.join(this.baseDir, 'public'), filePath),
              fileFormat,
              fileSize: stats.size,
              lastModified: stats.mtime,
              documentType,
              bofVaultCategory,
              quality,
              isCanonical: false,
              isDuplicate: false,
              isStale: false
            });
          }
        }
      } catch (error) {
        // Directory doesn't exist or access error, continue
      }
    }
    
    return files;
  }

  /**
   * Identify duplicates and choose canonical files
   */
  private reconcileDuplicates(files: DriverFile[]): {
    canonicalFiles: Map<string, DriverFile>;
    duplicateFiles: DriverFile[];
    staleFiles: DriverFile[];
  } {
    const canonicalFiles = new Map<string, DriverFile>();
    const duplicateFiles: DriverFile[] = [];
    const staleFiles: DriverFile[] = [];
    
    // Group files by document type
    const filesByType = new Map<string, DriverFile[]>();
    
    for (const file of files) {
      const type = file.documentType;
      if (!filesByType.has(type)) {
        filesByType.set(type, []);
      }
      filesByType.get(type)!.push(file);
    }
    
    // For each document type, choose canonical file
    for (const [documentType, typeFiles] of filesByType) {
      if (typeFiles.length === 1) {
        // Only one file, it's canonical
        const file = typeFiles[0];
        file.isCanonical = true;
        file.canonicalReason = 'Only file of this type';
        canonicalFiles.set(documentType, file);
      } else {
        // Multiple files, need to choose canonical
        const sorted = typeFiles.sort((a, b) => {
          // Priority order: quality > format > size > last modified
          const qualityOrder = { excellent: 4, good: 3, fair: 2, poor: 1 };
          const qualityDiff = qualityOrder[b.quality] - qualityOrder[a.quality];
          if (qualityDiff !== 0) return qualityDiff;
          
          // Prefer HTML over images for documents
          if (a.fileFormat === 'html' && b.fileFormat !== 'html') return -1;
          if (b.fileFormat === 'html' && a.fileFormat !== 'html') return 1;
          
          // Prefer larger files (likely more complete)
          if (b.fileSize !== a.fileSize) return b.fileSize - a.fileSize;
          
          // Prefer more recently modified
          return b.lastModified.getTime() - a.lastModified.getTime();
        });
        
        // First file is canonical
        const canonical = sorted[0];
        canonical.isCanonical = true;
        canonical.canonicalReason = `Best quality (${canonical.quality}), format (${canonical.fileFormat}), and size`;
        canonicalFiles.set(documentType, canonical);
        
        // Others are duplicates
        for (let i = 1; i < sorted.length; i++) {
          const duplicate = sorted[i];
          duplicate.isDuplicate = true;
          duplicate.duplicateReason = `Duplicate of ${canonical.fileName} - lower priority: ${duplicate.quality} quality, ${duplicate.fileFormat} format`;
          
          // Mark as stale if very old or poor quality
          if (duplicate.quality === 'poor' || 
              (Date.now() - duplicate.lastModified.getTime()) > 365 * 24 * 60 * 60 * 1000) {
            duplicate.isStale = true;
            staleFiles.push(duplicate);
          } else {
            duplicateFiles.push(duplicate);
          }
        }
      }
    }
    
    return { canonicalFiles, duplicateFiles, staleFiles };
  }

  /**
   * Identify missing document types for a driver
   */
  private identifyMissingDocumentTypes(canonicalFiles: Map<string, DriverFile>): string[] {
    const requiredTypes = [
      'CDL',
      'Medical Certification', 
      'MVR',
      'Driver Application',
      'I-9',
      'W-9',
      'Emergency Contact',
      'Bank Information'
    ];
    
    const missing = requiredTypes.filter(type => !canonicalFiles.has(type));
    
    // Also check for important optional types
    const importantOptional = [
      'FMCSA Clearinghouse',
      'Road Test Certificate',
      'Drug Test Result'
    ];
    
    const missingOptional = importantOptional.filter(type => !canonicalFiles.has(type));
    
    return [...missing, ...missingOptional];
  }

  /**
   * Reconcile files for a single driver
   */
  async reconcileDriverFiles(driverId: string): Promise<DriverReconciliationResult> {
    const result: DriverReconciliationResult = {
      driverId,
      filesFound: [],
      canonicalFiles: new Map(),
      duplicateFiles: [],
      staleFiles: [],
      missingDocumentTypes: [],
      vaultMapping: new Map(),
      needsRegeneration: [],
      errors: []
    };
    
    try {
      // Inventory all files
      result.filesFound = await this.inventoryDriverFiles(driverId);
      
      // Reconcile duplicates
      const { canonicalFiles, duplicateFiles, staleFiles } = this.reconcileDuplicates(result.filesFound);
      result.canonicalFiles = canonicalFiles;
      result.duplicateFiles = duplicateFiles;
      result.staleFiles = staleFiles;
      
      // Identify missing document types
      result.missingDocumentTypes = this.identifyMissingDocumentTypes(canonicalFiles);
      
      // Create vault mapping
      for (const [documentType, file] of canonicalFiles) {
        result.vaultMapping.set(documentType, file.bofVaultCategory);
      }
      
      // Determine which missing documents need regeneration
      result.needsRegeneration = result.missingDocumentTypes;
      
    } catch (error) {
      result.errors.push(`Failed to reconcile driver ${driverId}: ${error}`);
    }
    
    return result;
  }

  /**
   * Reconcile files for all drivers
   */
  async reconcileAllDrivers(): Promise<DuplicateReconciliationSummary> {
    const summary: DuplicateReconciliationSummary = {
      totalDrivers: 0,
      totalFilesFound: 0,
      totalCanonicalFiles: 0,
      totalDuplicateFiles: 0,
      totalStaleFiles: 0,
      totalMissingDocuments: 0,
      driverResults: [],
      errors: []
    };
    
    console.log('🔍 Starting driver-level duplicate reconciliation...');
    
    // Process all 12 drivers
    for (let i = 1; i <= 12; i++) {
      const driverId = `DRV-${i.toString().padStart(3, '0')}`;
      console.log(`\n📋 Reconciling ${driverId}...`);
      
      const result = await this.reconcileDriverFiles(driverId);
      summary.driverResults.push(result);
      
      // Update summary stats
      summary.totalFilesFound += result.filesFound.length;
      summary.totalCanonicalFiles += result.canonicalFiles.size;
      summary.totalDuplicateFiles += result.duplicateFiles.length;
      summary.totalStaleFiles += result.staleFiles.length;
      summary.totalMissingDocuments += result.missingDocumentTypes.length;
      summary.totalDrivers++;
      
      // Log driver results
      console.log(`  Files found: ${result.filesFound.length}`);
      console.log(`  Canonical files: ${result.canonicalFiles.size}`);
      console.log(`  Duplicate files: ${result.duplicateFiles.length}`);
      console.log(`  Stale files: ${result.staleFiles.length}`);
      console.log(`  Missing documents: ${result.missingDocumentTypes.length}`);
      
      if (result.errors.length > 0) {
        console.log(`  Errors: ${result.errors.length}`);
        summary.errors.push(...result.errors);
      }
    }
    
    return summary;
  }

  /**
   * Generate detailed reconciliation report
   */
  generateReconciliationReport(summary: DuplicateReconciliationSummary): string {
    let report = `
🔍 Driver-Level Duplicate Reconciliation Report
===============================================
Generated: ${new Date().toLocaleDateString()}

SUMMARY STATISTICS
------------------
Total Drivers Processed: ${summary.totalDrivers}
Total Files Found: ${summary.totalFilesFound}
Total Canonical Files: ${summary.totalCanonicalFiles}
Total Duplicate Files: ${summary.totalDuplicateFiles}
Total Stale Files: ${summary.totalStaleFiles}
Total Missing Documents: ${summary.totalMissingDocuments}

`;

    // Detailed driver-by-driver report
    for (const result of summary.driverResults) {
      report += `
DRIVER: ${result.driverId}
${'='.repeat(50)}

FILES FOUND (${result.filesFound.length})
`;
      
      for (const file of result.filesFound) {
        const status = file.isCanonical ? '🟢 CANONICAL' : 
                      file.isStale ? '🟡 STALE' : 
                      file.isDuplicate ? '🔴 DUPLICATE' : '⚪ UNKNOWN';
        
        report += `  ${status} ${file.fileName}
    Path: ${file.filePath}
    Type: ${file.documentType}
    Format: ${file.fileFormat} (${file.fileSize} bytes)
    Category: ${file.bofVaultCategory}
    Quality: ${file.quality}
    Modified: ${file.lastModified.toLocaleDateString()}
`;
        
        if (file.canonicalReason) {
          report += `    Canonical Reason: ${file.canonicalReason}\n`;
        }
        if (file.duplicateReason) {
          report += `    Duplicate Reason: ${file.duplicateReason}\n`;
        }
        report += `\n`;
      }
      
      if (result.canonicalFiles.size > 0) {
        report += `CANONICAL FILES BY DOCUMENT TYPE
`;
        for (const [documentType, file] of result.canonicalFiles) {
          report += `  ${documentType}: ${file.fileName} → ${file.bofVaultCategory}\n`;
        }
        report += `\n`;
      }
      
      if (result.duplicateFiles.length > 0) {
        report += `DUPLICATE FILES (${result.duplicateFiles.length})
`;
        for (const file of result.duplicateFiles) {
          report += `  ${file.fileName} (${file.duplicateReason})\n`;
        }
        report += `\n`;
      }
      
      if (result.staleFiles.length > 0) {
        report += `STALE FILES (${result.staleFiles.length})
`;
        for (const file of result.staleFiles) {
          report += `  ${file.fileName} (${file.duplicateReason})\n`;
        }
        report += `\n`;
      }
      
      if (result.missingDocumentTypes.length > 0) {
        report += `MISSING DOCUMENT TYPES (${result.missingDocumentTypes.length})
`;
        for (const missingType of result.missingDocumentTypes) {
          report += `  ${missingType} → ${this.VAULT_CATEGORIES[missingType] || 'Other / Supporting Docs'}\n`;
        }
        report += `\n`;
      }
      
      if (result.needsRegeneration.length > 0) {
        report += `NEEDS REGENERATION (${result.needsRegeneration.length})
`;
        for (const regenType of result.needsRegeneration) {
          report += `  ${regenType}\n`;
        }
        report += `\n`;
      }
      
      if (result.errors.length > 0) {
        report += `ERRORS
`;
        for (const error of result.errors) {
          report += `  ${error}\n`;
        }
        report += `\n`;
      }
    }
    
    // Summary of actions needed
    report += `
ACTIONS RECOMMENDED
===================

${summary.totalDuplicateFiles > 0 ? `
DUPLICATE FILES TO REVIEW:
${summary.driverResults.flatMap(r => r.duplicateFiles).map(f => `  ${f.fileName} (Driver: ${f.filePath.split('/')[2]})`).join('\n')}
` : ''}

${summary.totalStaleFiles > 0 ? `
STALE FILES TO ARCHIVE:
${summary.driverResults.flatMap(r => r.staleFiles).map(f => `  ${f.fileName} (Driver: ${f.filePath.split('/')[2]})`).join('\n')}
` : ''}

${summary.totalMissingDocuments > 0 ? `
MISSING DOCUMENTS TO GENERATE:
${summary.driverResults.filter(r => r.missingDocumentTypes.length > 0).map(r => 
  `  ${r.driverId}: ${r.missingDocumentTypes.join(', ')}`
).join('\n')}
` : ''}

BOF Vault Category Mapping Complete
====================================
All canonical files have been mapped to appropriate BOF Vault categories.
The system is ready to surface canonical files and ignore duplicates.

Driver-Level Duplicate Reconciliation Complete
============================================
`;
    
    return report;
  }

  /**
   * Generate mapping for BOF Vault to use canonical files
   */
  generateVaultMapping(summary: DuplicateReconciliationSummary): Record<string, Record<string, string>> {
    const mapping: Record<string, Record<string, string>> = {};
    
    for (const result of summary.driverResults) {
      mapping[result.driverId] = {};
      
      for (const [documentType, file] of result.canonicalFiles) {
        mapping[result.driverId][documentType] = file.filePath;
      }
    }
    
    return mapping;
  }
}
