/**
 * Driver Document Inventory and BOF Vault Placement Mapping
 * 
 * This service inventories existing driver documents and maps them
 * to the correct BOF Vault categories for proper organization.
 */

import type { DqfDocumentType } from "./dqf-types";

export interface DriverDocumentInventory {
  driverId: string;
  existingFiles: ExistingDocumentFile[];
  missingDocuments: DqfDocumentType[];
  duplicatesFound: DuplicateFile[];
  placementMap: DocumentPlacementMap;
}

export interface ExistingDocumentFile {
  fileName: string;
  filePath: string;
  documentType: DqfDocumentType;
  bofVaultCategory: string;
  fileFormat: "image" | "html" | "pdf";
  fileSize: number;
  isCurrent: boolean;
  quality: "good" | "fair" | "poor";
  notes?: string;
}

export interface DuplicateFile {
  fileName: string;
  duplicates: string[];
  recommendedKeep: string;
  reason: string;
}

export interface DocumentPlacementMap {
  [bofVaultCategory: string]: {
    filesToPlace: ExistingDocumentFile[];
    targetPaths: string[];
    alreadyCorrectlyPlaced: boolean;
  };
}

export class DriverDocumentInventoryService {
  
  /**
   * Map existing files to BOF Vault categories
   */
  private mapFileToVaultCategory(fileName: string, filePath: string): {
    documentType: DqfDocumentType;
    bofVaultCategory: string;
    fileFormat: "image" | "html" | "pdf";
  } {
    const lowerFileName = fileName.toLowerCase();
    
    // CDL documents
    if (lowerFileName.includes("cdl")) {
      return {
        documentType: "CDL",
        bofVaultCategory: "CDL",
        fileFormat: lowerFileName.includes(".png") ? "image" : "pdf"
      };
    }
    
    // Medical documents
    if (lowerFileName.includes("medical") || lowerFileName.includes("medcard")) {
      return {
        documentType: "Medical Certification",
        bofVaultCategory: "Medical Certification",
        fileFormat: "html"
      };
    }
    
    // MVR documents
    if (lowerFileName.includes("mvr")) {
      return {
        documentType: "MVR",
        bofVaultCategory: "MVR",
        fileFormat: "html"
      };
    }
    
    // Driver Application
    if (lowerFileName.includes("application")) {
      return {
        documentType: "Driver Application",
        bofVaultCategory: "Driver Application",
        fileFormat: "html"
      };
    }
    
    // I-9 documents
    if (lowerFileName.includes("i9") || lowerFileName.includes("i-9")) {
      return {
        documentType: "I-9",
        bofVaultCategory: "Employment / I-9",
        fileFormat: "html"
      };
    }
    
    // W-9 documents
    if (lowerFileName.includes("w9") || lowerFileName.includes("w-9")) {
      return {
        documentType: "W-9",
        bofVaultCategory: "W-9",
        fileFormat: "html"
      };
    }
    
    // FMCSA documents
    if (lowerFileName.includes("fmcsa") || lowerFileName.includes("mcsa")) {
      return {
        documentType: "FMCSA Clearinghouse",
        bofVaultCategory: "FMCSA / Compliance",
        fileFormat: "html"
      };
    }
    
    // Emergency Contact
    if (lowerFileName.includes("emergency")) {
      return {
        documentType: "Emergency Contact",
        bofVaultCategory: "Emergency Contact",
        fileFormat: "html"
      };
    }
    
    // Insurance/Qualification documents
    if (lowerFileName.includes("insurance") || lowerFileName.includes("qualification")) {
      return {
        documentType: "Road Test Certificate",
        bofVaultCategory: "Other / Supporting Docs",
        fileFormat: "html"
      };
    }
    
    // Default to Other/Supporting
    return {
      documentType: "Other / Supporting Docs",
      bofVaultCategory: "Other / Supporting Docs",
      fileFormat: lowerFileName.includes(".png") ? "image" : "html"
    };
  }

  /**
   * Assess file quality based on size and format
   */
  private assessFileQuality(fileName: string, fileSize: number, fileFormat: string): "good" | "fair" | "poor" {
    // Image files should be reasonable size for CDL
    if (fileFormat === "image" && fileName.includes("cdl")) {
      if (fileSize < 500000) return "poor"; // < 500KB = poor quality
      if (fileSize < 1000000) return "fair"; // < 1MB = fair
      return "good"; // >= 1MB = good
    }
    
    // HTML files should have reasonable content
    if (fileFormat === "html") {
      if (fileSize < 10000) return "poor"; // < 10KB = poor
      if (fileSize < 20000) return "fair"; // < 20KB = fair
      return "good"; // >= 20KB = good
    }
    
    return "fair";
  }

  /**
   * Inventory documents for a single driver
   */
  inventoryDriverDocuments(driverId: string): DriverDocumentInventory {
    const existingFiles: ExistingDocumentFile[] = [];
    const duplicatesFound: DuplicateFile[] = [];
    const fileMap = new Map<string, string[]>();
    
    // Check documents/drivers/DRV-XXX directory
    const driverDocPath = `public/documents/drivers/${driverId}`;
    
    try {
      const fs = require('fs');
      const path = require('path');
      
      if (fs.existsSync(driverDocPath)) {
        const files = fs.readdirSync(driverDocPath);
        
        files.forEach((file: string) => {
          const filePath = path.join(driverDocPath, file);
          const stats = fs.statSync(filePath);
          
          const mapping = this.mapFileToVaultCategory(file, filePath);
          const quality = this.assessFileQuality(file, stats.size, mapping.fileFormat);
          
          const existingFile: ExistingDocumentFile = {
            fileName: file,
            filePath: `/documents/drivers/${driverId}/${file}`,
            documentType: mapping.documentType,
            bofVaultCategory: mapping.bofVaultCategory,
            fileFormat: mapping.fileFormat,
            fileSize: stats.size,
            isCurrent: quality !== "poor",
            quality,
          };
          
          existingFiles.push(existingFile);
          
          // Track potential duplicates
          const baseName = file.toLowerCase().replace(/\.[^/.]+$/, "");
          if (!fileMap.has(baseName)) {
            fileMap.set(baseName, []);
          }
          fileMap.get(baseName)!.push(filePath);
        });
      }
      
      // Check for duplicates
      fileMap.forEach((paths, baseName) => {
        if (paths.length > 1) {
          const recommendedKeep = paths.reduce((best, current) => {
            const bestStats = fs.statSync(best);
            const currentStats = fs.statSync(current);
            return currentStats.size > bestStats.size ? current : best;
          });
          
          duplicatesFound.push({
            fileName: baseName,
            duplicates: paths,
            recommendedKeep,
            reason: "Multiple versions found, keeping largest/most complete"
          });
        }
      });
      
    } catch (error) {
      console.warn(`Error inventorying driver ${driverId}:`, error);
    }
    
    // Determine missing documents
    const existingTypes = new Set(existingFiles.map(f => f.documentType));
    const requiredDocuments: DqfDocumentType[] = [
      "CDL",
      "Medical Certification",
      "MVR",
      "Driver Application",
      "I-9",
      "W-9",
      "Road Test Certificate",
      "Drug Test Result",
      "Prior Employer Inquiry",
      "Emergency Contact"
    ];
    
    const missingDocuments = requiredDocuments.filter(doc => !existingTypes.has(doc));
    
    // Build placement map
    const placementMap: DocumentPlacementMap = {};
    const categories = [...new Set(existingFiles.map(f => f.bofVaultCategory))];
    
    categories.forEach(category => {
      const categoryFiles = existingFiles.filter(f => f.bofVaultCategory === category);
      const targetPaths = categoryFiles.map(f => f.filePath);
      
      // Check if already correctly placed in generated/drivers/DRV-XXX
      const generatedPath = `public/generated/drivers/${driverId}`;
      let alreadyCorrectlyPlaced = false;
      
      try {
        if (require('fs').existsSync(generatedPath)) {
          const generatedFiles = require('fs').readdirSync(generatedPath);
          const expectedGeneratedFiles = categoryFiles.map(f => 
            f.fileName.replace(/\.[^/.]+$/, '.html')
          );
          alreadyCorrectlyPlaced = expectedGeneratedFiles.some(file => 
            generatedFiles.includes(file)
          );
        }
      } catch (error) {
        // Generated directory doesn't exist or isn't accessible
      }
      
      placementMap[category] = {
        filesToPlace: categoryFiles,
        targetPaths,
        alreadyCorrectlyPlaced
      };
    });
    
    return {
      driverId,
      existingFiles,
      missingDocuments,
      duplicatesFound,
      placementMap
    };
  }

  /**
   * Inventory all 12 drivers
   */
  inventoryAllDrivers(): DriverDocumentInventory[] {
    const driverIds = [
      "DRV-001", "DRV-002", "DRV-003", "DRV-004", "DRV-005",
      "DRV-006", "DRV-007", "DRV-008", "DRV-009", "DRV-010",
      "DRV-011", "DRV-012"
    ];
    
    return driverIds.map(driverId => this.inventoryDriverDocuments(driverId));
  }

  /**
   * Generate placement recommendations
   */
  generatePlacementRecommendations(inventories: DriverDocumentInventory[]): {
    totalFilesFound: number;
    totalMissingDocuments: number;
    totalDuplicates: number;
    placementActions: PlacementAction[];
  } {
    let totalFilesFound = 0;
    let totalMissingDocuments = 0;
    let totalDuplicates = 0;
    const placementActions: PlacementAction[] = [];
    
    inventories.forEach(inventory => {
      totalFilesFound += inventory.existingFiles.length;
      totalMissingDocuments += inventory.missingDocuments.length;
      totalDuplicates += inventory.duplicatesFound.length;
      
      Object.entries(inventory.placementMap).forEach(([category, mapping]) => {
        if (!mapping.alreadyCorrectlyPlaced && mapping.filesToPlace.length > 0) {
          placementActions.push({
            driverId: inventory.driverId,
            category,
            action: "move_to_generated",
            files: mapping.filesToPlace,
            targetPaths: mapping.targetPaths,
            priority: this.getPlacementPriority(category),
            reason: "Files exist but not in generated BOF Vault location"
          });
        }
      });
      
      if (inventory.missingDocuments.length > 0) {
        placementActions.push({
          driverId: inventory.driverId,
          category: "missing_documents",
          action: "generate_missing",
          files: inventory.missingDocuments.map(docType => ({
            documentType: docType,
            fileName: `${docType.replace(/\s+/g, '_').toLowerCase()}.html`,
            filePath: `generated/drivers/${inventory.driverId}/${docType.replace(/\s+/g, '_').toLowerCase()}.html`
          })),
          targetPaths: inventory.missingDocuments.map(docType => 
            `generated/drivers/${inventory.driverId}/${docType.replace(/\s+/g, '_').toLowerCase()}.html`
          ),
          priority: "high",
          reason: "Required documents missing from inventory"
        });
      }
    });
    
    return {
      totalFilesFound,
      totalMissingDocuments,
      totalDuplicates,
      placementActions: placementActions.sort((a, b) => {
        const priorityOrder = { "critical": 0, "high": 1, "medium": 2, "low": 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
    };
  }

  /**
   * Get placement priority for category
   */
  private getPlacementPriority(category: string): "critical" | "high" | "medium" | "low" {
    const criticalCategories = ["CDL", "Medical Certification", "MVR"];
    const highCategories = ["Driver Application", "I-9", "W-9"];
    const mediumCategories = ["FMCSA / Compliance", "Emergency Contact"];
    
    if (criticalCategories.includes(category)) return "critical";
    if (highCategories.includes(category)) return "high";
    if (mediumCategories.includes(category)) return "medium";
    return "low";
  }
}

export interface PlacementAction {
  driverId: string;
  category: string;
  action: "move_to_generated" | "generate_missing" | "remove_duplicate";
  files: ExistingDocumentFile[] | { documentType: DqfDocumentType; fileName: string; filePath: string }[];
  targetPaths: string[];
  priority: "critical" | "high" | "medium" | "low";
  reason: string;
}
