/**
 * Dispatch Document Service
 * 
 * Handles load-specific documents that belong to Dispatch/Loads areas,
 * separate from BOF Vault driver-core documents.
 */

import type { BofData } from "./load-bof-data";
import type { DocumentRow } from "./driver-queries";

// Types for load proof bundle items with different shapes
interface LoadProofItemWithFiles {
  status: string;
  fileUrl: string;
  previewUrl: string;
  blocksPayment: boolean;
  disputeExposure: boolean;
  notes: string;
}

interface LoadProofItemNoFiles {
  status: string;
  blocksPayment: boolean;
  disputeExposure: boolean;
  notes: string;
  riskNote?: string;
}

export type DispatchDocumentCategory = 
  | "Bill of Lading"
  | "Proof of Delivery"
  | "Rate Confirmation"
  | "Fuel Receipt"
  | "Seal Photos"
  | "Cargo Photos"
  | "Lumper Receipt"
  | "RFID / Dock Validation"
  | "Other Load Documents";

export type DispatchDocumentRow = DocumentRow & {
  loadId: string;
  loadNumber: string;
  dispatchCategory: DispatchDocumentCategory;
  dispatchSortOrder: number;
  blocksPayment?: boolean;
  disputeExposure?: boolean;
  notes?: string;
};

/**
 * Identify load-specific document types that belong to Dispatch/Loads
 */
export function inferDispatchDocumentCategory(docType: string): DispatchDocumentCategory {
  const t = docType.toLowerCase();
  
  if (t.includes("bol") || t.includes("bill of lading")) return "Bill of Lading";
  if (t.includes("pod") || t.includes("proof of delivery")) return "Proof of Delivery";
  if (t.includes("rate confirmation")) return "Rate Confirmation";
  if (t.includes("fuel receipt")) return "Fuel Receipt";
  if (t.includes("seal photo")) return "Seal Photos";
  if (t.includes("cargo photo") || t.includes("pre-trip")) return "Cargo Photos";
  if (t.includes("empty-trailer") || t.includes("empty trailer")) return "Cargo Photos";
  if (t.includes("lumper receipt")) return "Lumper Receipt";
  if (t.includes("rfid") || t.includes("dock validation")) return "RFID / Dock Validation";
  
  return "Other Load Documents";
}

/**
 * Get dispatch sort order for document categories
 */
const DISPATCH_SORT_ORDER: Record<DispatchDocumentCategory, number> = {
  "Rate Confirmation": 1,
  "Bill of Lading": 2,
  "Proof of Delivery": 3,
  "Seal Photos": 4,
  "Cargo Photos": 5,
  "Fuel Receipt": 6,
  "Lumper Receipt": 7,
  "RFID / Dock Validation": 8,
  "Other Load Documents": 9,
};

/**
 * Build dispatch document rows from load proof bundles
 */
export function buildDispatchDocumentRows(data: BofData): DispatchDocumentRow[] {
  const dispatchDocuments: DispatchDocumentRow[] = [];
  
  // Process load proof bundles - these are the primary source of load-specific documents
  Object.entries(data.loadProofBundles || {}).forEach(([loadId, loadBundle]) => {
    const load = data.loads.find(l => l.id === loadId);
    const loadNumber = load?.number || loadId;
    
    Object.entries(loadBundle.items).forEach(([docType, docItem]) => {
      const category = inferDispatchDocumentCategory(docType);
      
      // Handle different item shapes safely
      const hasFiles = 'fileUrl' in docItem;
      
      let fileUrl: string | undefined;
      let previewUrl: string | undefined;
      let blocksPayment: boolean;
      let disputeExposure: boolean;
      
      if (hasFiles) {
        const itemWithFiles = docItem as LoadProofItemWithFiles;
        fileUrl = itemWithFiles.fileUrl;
        previewUrl = itemWithFiles.previewUrl;
        blocksPayment = itemWithFiles.blocksPayment;
        disputeExposure = itemWithFiles.disputeExposure;
      } else {
        const itemNoFiles = docItem as LoadProofItemNoFiles;
        blocksPayment = itemNoFiles.blocksPayment;
        disputeExposure = itemNoFiles.disputeExposure;
      }
      
      const dispatchDoc: DispatchDocumentRow = {
        driverId: "", // Load documents don't belong to specific drivers
        type: docType,
        status: docItem.status,
        fileUrl,
        previewUrl,
        loadId,
        loadNumber,
        dispatchCategory: category,
        dispatchSortOrder: DISPATCH_SORT_ORDER[category],
        blocksPayment,
        disputeExposure,
        notes: docItem.notes,
      };
      
      dispatchDocuments.push(dispatchDoc);
    });
  });
  
  return dispatchDocuments.sort((a, b) => {
    // Sort by load number first, then by dispatch category order
    if (a.loadNumber !== b.loadNumber) {
      return a.loadNumber.localeCompare(b.loadNumber);
    }
    if (a.dispatchSortOrder !== b.dispatchSortOrder) {
      return a.dispatchSortOrder - b.dispatchSortOrder;
    }
    return a.type.localeCompare(b.type);
  });
}

/**
 * Get dispatch documents for a specific load
 */
export function getDispatchDocumentsForLoad(data: BofData, loadId: string): DispatchDocumentRow[] {
  const allDispatchDocs = buildDispatchDocumentRows(data);
  return allDispatchDocs.filter(doc => doc.loadId === loadId);
}
