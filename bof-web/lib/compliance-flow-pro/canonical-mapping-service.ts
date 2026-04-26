/**
 * Canonical Mapping Service
 * 
 * Integrates the canonical file mapping into BOF Vault to surface only chosen canonical files
 * and suppress duplicates/stale variants.
 */

import type { DocumentRow } from '@/lib/driver-queries';

export interface CanonicalMapping {
  [driverId: string]: {
    [documentType: string]: string; // documentType -> filePath
  };
}

export interface CanonicalDocumentRow extends DocumentRow {
  isCanonical: boolean;
  canonicalSource: 'mapping' | 'original';
}

export class CanonicalMappingService {
  private mapping: CanonicalMapping | null = null;
  private mappingUrl: string;
  
  constructor() {
    this.mappingUrl = '/generated/driver-vault-mapping.json';
  }

  /**
   * Load the canonical mapping from the static asset
   */
  async loadMapping(): Promise<void> {
    try {
      const response = await fetch(this.mappingUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const mappingData = await response.text();
      this.mapping = JSON.parse(mappingData);
      console.log(`✅ Canonical mapping loaded: ${Object.keys(this.mapping || {}).length} drivers`);
    } catch (error) {
      console.warn(`⚠️  Could not load canonical mapping: ${error}`);
      this.mapping = null;
    }
  }

  /**
   * Get the canonical file path for a specific driver and document type
   */
  getCanonicalFilePath(driverId: string, documentType: string): string | null {
    if (!this.mapping) return null;
    
    const driverMapping = this.mapping[driverId];
    if (!driverMapping) return null;
    
    // Try exact match first
    let filePath = driverMapping[documentType];
    if (filePath) return filePath;
    
    // Try common variations and mappings
    const typeMappings: Record<string, string[]> = {
      'CDL': ['CDL'],
      'Medical Card': ['Medical Certification', 'Medical Card'],
      'Medical Certification': ['Medical Certification', 'Medical Card'],
      'MVR': ['MVR'],
      'I-9': ['I-9'],
      'W-9': ['W-9'],
      'FMCSA': ['FMCSA Clearinghouse'],
      'Bank Info': ['Bank Information'],
      'Bank Information': ['Bank Information', 'Bank Info'],
      'Driver Application': ['Driver Application'],
      'Emergency Contact': ['Emergency Contact'],
      'Secondary Contact': ['Secondary Contact'],
      'Road Test Certificate': ['Road Test Certificate'],
      'Drug Test Result': ['Drug Test Result'],
      'Employment Verification': ['Employment Verification'],
      'Prior Employer Inquiry': ['Prior Employer Inquiry'],
      'Safety Performance History': ['Safety Performance History'],
      'Incident Reports': ['Incident Reports'],
    };
    
    const possibleTypes = typeMappings[documentType] || [documentType];
    for (const type of possibleTypes) {
      filePath = driverMapping[type];
      if (filePath) return filePath;
    }
    
    return null;
  }

  /**
   * Filter documents to only include canonical files
   */
  filterCanonicalDocuments(documents: DocumentRow[]): CanonicalDocumentRow[] {
    if (!this.mapping) {
      // No mapping available, return all documents as original
      return documents.map(doc => ({
        ...doc,
        isCanonical: true,
        canonicalSource: 'original'
      }));
    }

    const canonicalDocs: CanonicalDocumentRow[] = [];
    const processedTypes = new Set<string>();
    
    for (const doc of documents) {
      const canonicalPath = this.getCanonicalFilePath(doc.driverId, doc.type);
      
      if (canonicalPath) {
        // Normalize path for comparison
        const normalizedDocPath = this.normalizePath(doc.fileUrl || '');
        const normalizedCanonicalPath = this.normalizePath(canonicalPath);
        
        if (normalizedDocPath === normalizedCanonicalPath) {
          // This is the canonical file
          canonicalDocs.push({
            ...doc,
            isCanonical: true,
            canonicalSource: 'mapping'
          });
          processedTypes.add(doc.type);
        } else {
          // This is a duplicate/stale file, skip it
          console.log(`🔁 Skipping duplicate: ${doc.driverId}/${doc.type} (${normalizedDocPath} != ${normalizedCanonicalPath})`);
        }
      } else {
        // No mapping found, include as original
        canonicalDocs.push({
          ...doc,
          isCanonical: true,
          canonicalSource: 'original'
        });
      }
    }
    
    // Add any missing canonical documents that weren't in the original list
    for (const doc of documents) {
      if (processedTypes.has(doc.type)) continue;
      
      const canonicalPath = this.getCanonicalFilePath(doc.driverId, doc.type);
      if (canonicalPath && !processedTypes.has(doc.type)) {
        // Create a synthetic document row for the canonical file
        canonicalDocs.push({
          driverId: doc.driverId,
          type: doc.type,
          status: 'VALID', // Assume canonical files are valid
          fileUrl: `/${canonicalPath.replace(/\\/g, '/')}`,
          previewUrl: `/${canonicalPath.replace(/\\/g, '/')}`,
          isCanonical: true,
          canonicalSource: 'mapping'
        });
        processedTypes.add(doc.type);
      }
    }
    
    return canonicalDocs;
  }

  /**
   * Normalize file path for consistent comparison
   */
  private normalizePath(filePath: string): string {
    return filePath
      .replace(/\\/g, '/') // Convert backslashes to forward slashes
      .replace(/^\/+/, '') // Remove leading slashes
      .toLowerCase();
  }

  /**
   * Get mapping statistics
   */
  getMappingStats(): { totalDrivers: number; totalMappings: number; driverCounts: Record<string, number> } {
    if (!this.mapping) {
      return { totalDrivers: 0, totalMappings: 0, driverCounts: {} };
    }
    
    const driverCounts: Record<string, number> = {};
    let totalMappings = 0;
    
    for (const [driverId, mappings] of Object.entries(this.mapping)) {
      const count = Object.keys(mappings).length;
      driverCounts[driverId] = count;
      totalMappings += count;
    }
    
    return {
      totalDrivers: Object.keys(this.mapping).length,
      totalMappings,
      driverCounts
    };
  }

  /**
   * Check if mapping is loaded and available
   */
  isMappingAvailable(): boolean {
    return this.mapping !== null;
  }

  /**
   * Get all document types for a driver from the mapping
   */
  getDriverDocumentTypes(driverId: string): string[] {
    if (!this.mapping || !this.mapping[driverId]) {
      return [];
    }
    
    return Object.keys(this.mapping[driverId]);
  }

  /**
   * Get all drivers in the mapping
   */
  getMappedDrivers(): string[] {
    if (!this.mapping) {
      return [];
    }
    
    return Object.keys(this.mapping);
  }
}

// Singleton instance for use across the application
let canonicalMappingService: CanonicalMappingService | null = null;

export function getCanonicalMappingService(): CanonicalMappingService {
  if (!canonicalMappingService) {
    canonicalMappingService = new CanonicalMappingService();
  }
  return canonicalMappingService;
}
