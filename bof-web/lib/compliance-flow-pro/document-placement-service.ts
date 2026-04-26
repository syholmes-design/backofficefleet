/**
 * Document Placement Service for BOF Vault
 * 
 * Places existing driver documents into correct BOF Vault categories
 * and handles file organization for ComplianceFlow Pro integration.
 */

import type { PlacementAction } from "./driver-document-inventory";
import { DriverDocumentInventoryService } from "./driver-document-inventory";
import { promises as fs } from 'fs';
import path from 'path';

export class DocumentPlacementService {
  private inventoryService: DriverDocumentInventoryService;
  private baseDir: string;

  constructor() {
    this.inventoryService = new DriverDocumentInventoryService();
    this.baseDir = process.cwd();
  }

  /**
   * Execute complete placement process for all drivers
   */
  async executePlacement(): Promise<PlacementExecutionResult> {
    console.log("🔍 Starting BOF Vault document placement process...");
    
    const inventories = this.inventoryService.inventoryAllDrivers();
    const recommendations = this.inventoryService.generatePlacementRecommendations(inventories);
    
    const results: PlacementExecutionResult = {
      totalDrivers: inventories.length,
      totalFilesFound: recommendations.totalFilesFound,
      totalMissingDocuments: recommendations.totalMissingDocuments,
      totalDuplicates: recommendations.totalDuplicates,
      placementResults: [],
      errors: [],
      summary: ""
    };

    // Execute placement actions in priority order
    for (const action of recommendations.placementActions) {
      try {
        const result = await this.executePlacementAction(action);
        results.placementResults.push(result);
        
        if (result.success) {
          console.log(`✅ ${action.driverId} - ${action.category}: ${result.message}`);
        } else {
          console.log(`❌ ${action.driverId} - ${action.category}: ${result.message}`);
          results.errors.push(result.message);
        }
      } catch (error) {
        const errorMessage = `Failed to execute placement for ${action.driverId} - ${action.category}: ${error}`;
        console.error(`❌ ${errorMessage}`);
        results.errors.push(errorMessage);
      }
    }

    // Generate summary
    results.summary = this.generateExecutionSummary(results);
    
    console.log("📋 BOF Vault document placement complete");
    console.log(results.summary);
    
    return results;
  }

  /**
   * Execute individual placement action
   */
  private async executePlacementAction(action: PlacementAction): Promise<PlacementActionResult> {
    switch (action.action) {
      case "move_to_generated":
        return this.moveToGenerated(action);
      case "generate_missing":
        return this.generateMissing(action);
      case "remove_duplicate":
        return this.removeDuplicate();
      default:
        return {
          success: false,
          message: `Unknown action: ${action.action}`,
          filesProcessed: 0
        };
    }
  }

  /**
   * Move existing files to generated directory
   */
  private async moveToGenerated(action: PlacementAction): Promise<PlacementActionResult> {
    if (!Array.isArray(action.files)) {
      return {
        success: false,
        message: "Invalid files array for move action",
        filesProcessed: 0
      };
    }

    const files = action.files as unknown[];
    let processedCount = 0;

    for (const file of files) {
      const fileRecord = file as { filePath: string; fileName: string; fileFormat?: string; documentType?: string };
      try {
        const sourcePath = path.join(this.baseDir, "public", fileRecord.filePath);
        const targetDir = path.join(this.baseDir, "public", "generated", "drivers", action.driverId);
        
        // Ensure target directory exists
        await fs.mkdir(targetDir, { recursive: true });
        
        // Convert to HTML if needed for generated directory
        const targetFileName = fileRecord.fileName.replace(/\.[^/.]+$/, '.html');
        const targetPath = path.join(targetDir, targetFileName);
        
        if (fileRecord.fileFormat === "html") {
          // Move HTML files directly
          await fs.copyFile(sourcePath, targetPath);
        } else if (fileRecord.fileFormat === "image") {
          // For images, create a simple HTML wrapper
          await this.createImageHtmlWrapper(sourcePath, targetPath, fileRecord.documentType || "Unknown");
        }
        
        processedCount++;
      } catch (error) {
        console.error(`Error moving ${fileRecord.fileName}:`, error);
      }
    }

    return {
      success: processedCount > 0,
      message: `Moved ${processedCount} files to generated directory`,
      filesProcessed: processedCount
    };
  }

  /**
   * Generate missing document placeholders
   */
  private async generateMissing(action: PlacementAction): Promise<PlacementActionResult> {
    if (!Array.isArray(action.files)) {
      return {
        success: false,
        message: "Invalid files array for generate action",
        filesProcessed: 0
      };
    }

    const files = action.files as unknown[];
    let processedCount = 0;

    for (const file of files) {
      const fileRecord = file as { fileName: string; documentType: string };
      try {
        const targetDir = path.join(this.baseDir, "public", "generated", "drivers", action.driverId);
        await fs.mkdir(targetDir, { recursive: true });
        
        const targetPath = path.join(targetDir, fileRecord.fileName);
        await this.generateDocumentPlaceholder(fileRecord.documentType, targetPath);
        
        processedCount++;
      } catch (error) {
        console.error(`Error generating ${fileRecord.fileName}:`, error);
      }
    }

    return {
      success: processedCount > 0,
      message: `Generated ${processedCount} missing document placeholders`,
      filesProcessed: processedCount
    };
  }

  /**
   * Remove duplicate files
   */
  private async removeDuplicate(): Promise<PlacementActionResult> {
    // For now, just log duplicates - actual removal can be done manually
    return {
      success: true,
      message: `Identified duplicates for manual review`,
      filesProcessed: 0
    };
  }

  /**
   * Create HTML wrapper for image files
   */
  private async createImageHtmlWrapper(imagePath: string, targetPath: string, documentType: string): Promise<void> {
    const imageFileName = path.basename(imagePath);
    const imageRelativePath = `/documents/drivers/${path.basename(path.dirname(imagePath))}/${imageFileName}`;
    
    const htmlContent = this.generateImageHtmlTemplate(documentType, imageRelativePath, imageFileName);
    await fs.writeFile(targetPath, htmlContent, 'utf8');
  }

  /**
   * Generate HTML template for image documents
   */
  private generateImageHtmlTemplate(documentType: string, imagePath: string, fileName: string): string {
    const templates: Record<string, string> = {
      "CDL": `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BOF CDL - ${fileName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .cdl-image { max-width: 600px; border: 1px solid #ccc; }
        .footer { margin-top: 30px; text-align: center; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Commercial Driver's License</h1>
        <p>BOF Generated Document</p>
    </div>
    <div class="cdl-image">
        <img src="${imagePath}" alt="CDL" style="width: 100%;" />
    </div>
    <div class="footer">
        <p>Generated by BOF Vault ComplianceFlow Pro</p>
        <p>Document ID: ${fileName}</p>
    </div>
</body>
</html>`,
      "Medical Certification": `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BOF Medical Certification - ${fileName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .medical-image { max-width: 600px; border: 1px solid #ccc; }
        .footer { margin-top: 30px; text-align: center; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Medical Certification</h1>
        <p>BOF Generated Document</p>
    </div>
    <div class="medical-image">
        <img src="${imagePath}" alt="Medical Certification" style="width: 100%;" />
    </div>
    <div class="footer">
        <p>Generated by BOF Vault ComplianceFlow Pro</p>
        <p>Document ID: ${fileName}</p>
    </div>
</body>
</html>`,
      "MVR": `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BOF MVR - ${fileName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .mvr-image { max-width: 600px; border: 1px solid #ccc; }
        .footer { margin-top: 30px; text-align: center; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Motor Vehicle Record</h1>
        <p>BOF Generated Document</p>
    </div>
    <div class="mvr-image">
        <img src="${imagePath}" alt="MVR" style="width: 100%;" />
    </div>
    <div class="footer">
        <p>Generated by BOF Vault ComplianceFlow Pro</p>
        <p>Document ID: ${fileName}</p>
    </div>
</body>
</html>`,
      "Driver Application": `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BOF Driver Application - ${fileName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .app-image { max-width: 600px; border: 1px solid #ccc; }
        .footer { margin-top: 30px; text-align: center; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Driver Application</h1>
        <p>BOF Generated Document</p>
    </div>
    <div class="app-image">
        <img src="${imagePath}" alt="Driver Application" style="width: 100%;" />
    </div>
    <div class="footer">
        <p>Generated by BOF Vault ComplianceFlow Pro</p>
        <p>Document ID: ${fileName}</p>
    </div>
</body>
</html>`
    };

    return templates[documentType] || templates["Other / Supporting Docs"];
  }

  /**
   * Generate placeholder for missing documents
   */
  private async generateDocumentPlaceholder(documentType: string, targetPath: string): Promise<void> {
    const placeholderContent = this.generatePlaceholderTemplate(documentType);
    await fs.writeFile(targetPath, placeholderContent, 'utf8');
  }

  /**
   * Generate placeholder template
   */
  private generatePlaceholderTemplate(documentType: string): string {
    const templates: Record<string, string> = {
      "CDL": `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BOF CDL - Missing Document</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; color: #e74c3c; }
        .placeholder { text-align: center; padding: 40px; background: #fff3cd; border-radius: 4px; margin: 20px 0; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚫 CDL Missing</h1>
            <p>Commercial Driver's License document not found</p>
        </div>
        <div class="placeholder">
            <h2>Document Required</h2>
            <p>This driver's CDL document needs to be uploaded to complete their qualification file.</p>
            <p><strong>Action Required:</strong> Upload current CDL</p>
        </div>
        <div class="footer">
            <p>Generated by BOF Vault ComplianceFlow Pro</p>
            <p>Status: Missing - Action Required</p>
        </div>
    </div>
</body>
</html>`,
      "Medical Certification": `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BOF Medical Certification - Missing Document</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; color: #e74c3c; }
        .placeholder { text-align: center; padding: 40px; background: #fff3cd; border-radius: 4px; margin: 20px 0; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚫 Medical Certification Missing</h1>
            <p>Medical certification document not found</p>
        </div>
        <div class="placeholder">
            <h2>Document Required</h2>
            <p>This driver's medical certification needs to be uploaded to complete their qualification file.</p>
            <p><strong>Action Required:</strong> Upload current medical certificate</p>
        </div>
        <div class="footer">
            <p>Generated by BOF Vault ComplianceFlow Pro</p>
            <p>Status: Missing - Action Required</p>
        </div>
    </div>
</body>
</html>`
    };

    return templates[documentType] || `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>BOF Document - Missing</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; color: #e74c3c; }
        .placeholder { text-align: center; padding: 40px; background: #fff3cd; border-radius: 4px; margin: 20px 0; }
        .footer { margin-top: 30px; text-align: center; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚫 Document Missing</h1>
            <p>${documentType} document not found</p>
        </div>
        <div class="placeholder">
            <h2>Document Required</h2>
            <p>This ${documentType.toLowerCase()} document needs to be uploaded to complete the qualification file.</p>
            <p><strong>Action Required:</strong> Upload current ${documentType}</p>
        </div>
        <div class="footer">
            <p>Generated by BOF Vault ComplianceFlow Pro</p>
            <p>Status: Missing - Action Required</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate execution summary
   */
  private generateExecutionSummary(results: PlacementExecutionResult): string {
    const successCount = results.placementResults.filter(r => r.success).length;
    const errorCount = results.errors.length;
    
    return `
📊 BOF Vault Document Placement Summary
========================================
Total Drivers Processed: ${results.totalDrivers}
Total Files Found: ${results.totalFilesFound}
Total Missing Documents: ${results.totalMissingDocuments}
Total Duplicates Found: ${results.totalDuplicates}

Placement Results:
✅ Successful Actions: ${successCount}
❌ Failed Actions: ${errorCount}

${errorCount > 0 ? '\nErrors:\n' + results.errors.map(e => `  - ${e}`).join('\n') : ''}

Next Steps:
- Review generated documents in /public/generated/drivers/
- Upload missing documents through driver onboarding
- Resolve duplicate files manually
- Test ComplianceFlow Pro integration

BOF Vault is now ready for ComplianceFlow Pro demo!
========================================
    `;
  }
}

export interface PlacementExecutionResult {
  totalDrivers: number;
  totalFilesFound: number;
  totalMissingDocuments: number;
  totalDuplicates: number;
  placementResults: PlacementActionResult[];
  errors: string[];
  summary: string;
}

export interface PlacementActionResult {
  success: boolean;
  message: string;
  filesProcessed: number;
}
