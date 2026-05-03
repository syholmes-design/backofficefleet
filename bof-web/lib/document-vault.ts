import type { BofData } from "@/lib/load-bof-data";
import {
  DRIVER_DOCUMENT_TYPES,
  type DocumentRow,
  type DriverDocType,
} from "@/lib/driver-queries";
import { normalizeDocStatus } from "@/lib/document-ui";
import {
  inferDriverVaultCategoryFromDocumentType,
  mapDriverVaultCategoryToOwnership,
} from "@/lib/bof-vault-ownership-adapter";
import { getCanonicalMappingService } from "@/lib/compliance-flow-pro/canonical-mapping-service";
import { reconcileCredentialIncident } from "@/lib/compliance/credential-incident-reconciliation";
import { getDriverDocumentByType } from "@/lib/driver-doc-registry";

export type VaultDocumentRow = DocumentRow & {
  driverName: string;
  /** Open compliance mapped to this driver + document type, or status AT RISK */
  atRisk: boolean;
  /** Critical compliance on this credential and/or explicit blocksPayment on the row */
  blocking: boolean;
  /** Core seven, primary extensions, or secondary / other (vault scanability) */
  vaultGroup: "Core" | "Primary" | "Secondary" | "Other";
  vaultOwnershipLabel: string;
  vaultPrimaryOwner: "vault" | "dispatch" | "billing" | "claims" | "load";
  vaultSortOrder: number;
  /** Whether this document should appear in main BOF Vault view */
  vaultVisible: boolean;
  /** Whether this document should appear as secondary reference */
  vaultSecondaryVisible: boolean;
};

function vaultGroupLabel(doc: DocumentRow): VaultDocumentRow["vaultGroup"] {
  if (DRIVER_DOCUMENT_TYPES.includes(doc.type as DriverDocType)) return "Core";
  if (doc.docTier === "secondary") return "Secondary";
  if (doc.docTier === "primary") return "Primary";
  return "Other";
}

/** Map compliance incident labels to one of the seven driver document types. */
export function mapIncidentTypeToDocType(incidentType: string): string | null {
  const t = incidentType.toLowerCase();
  if (t.includes("medical card")) return "Medical Card";
  if (t.includes("mvr")) return "MVR";
  if (t.includes("cdl")) return "CDL";
  if (t.includes("i-9") || t.includes("i9")) return "I-9";
  if (t.includes("fmcsa")) return "FMCSA";
  if (t.includes("w-9") || t.includes("w9")) return "W-9";
  if (t.includes("bank")) return "Bank Info";
  return null;
}

function complianceFlagsForDoc(
  data: BofData,
  driverId: string,
  docType: string
): { atRisk: boolean; blocking: boolean } {
  const open = data.complianceIncidents.filter((c) => {
    if (c.driverId !== driverId) return false;
    const st = String(c.status ?? "").toUpperCase();
    if (st === "CLOSED" || st === "RESOLVED") return false;
    return reconcileCredentialIncident(data, c).display;
  });
  let atRisk = false;
  let blocking = false;
  for (const inc of open) {
    const mapped = mapIncidentTypeToDocType(inc.type);
    if (mapped === docType) {
      atRisk = true;
      if (inc.severity === "CRITICAL") blocking = true;
    }
  }
  return { atRisk, blocking };
}

/**
 * One row per record in `data.documents` (fleet driver rows from demo JSON, including structured supplemental stack).
 * Uses canonical mapping to surface only chosen canonical files and suppress duplicates.
 */
export function buildVaultRows(data: BofData): VaultDocumentRow[] {
  const nameById = new Map(data.drivers.map((d) => [d.id, d.name]));
  
  // Process only driver-core documents that belong in BOF Vault
  // Load-specific documents (BOL, POD, etc.) are handled by Dispatch/Loads areas
  const vaultDocuments = data.documents.filter(doc => {
    const category = inferDriverVaultCategoryFromDocumentType(doc.type);
    // Only process documents that have a valid Vault category
    return category !== "Other / Supporting Docs" || 
           doc.type.toLowerCase().includes("profile") ||
           doc.type.toLowerCase().includes("supporting");
  });

  const rows = vaultDocuments.map((raw) => {
    const doc = raw as DocumentRow & { blocksPayment?: boolean };
    const flags = complianceFlagsForDoc(data, doc.driverId, doc.type);
    const statusNorm = normalizeDocStatus(doc.status);
    const explicitBlock = doc.blocksPayment === true;
    const category = inferDriverVaultCategoryFromDocumentType(doc.type);
    const ownership = mapDriverVaultCategoryToOwnership(category);
    const canonicalUrl = getDriverDocumentByType(doc.driverId, doc.type);

    return {
      ...doc,
      fileUrl: canonicalUrl ?? doc.fileUrl,
      previewUrl: canonicalUrl ?? doc.previewUrl,
      driverName: nameById.get(doc.driverId) ?? doc.driverId,
      atRisk: flags.atRisk || statusNorm === "AT RISK" || statusNorm === "AT_RISK",
      blocking: flags.blocking || explicitBlock,
      vaultGroup: vaultGroupLabel(doc),
      vaultOwnershipLabel: ownership.ownershipLabel,
      vaultPrimaryOwner: ownership.vaultPrimaryOwner,
      vaultSortOrder: ownership.vaultSortOrder,
      vaultVisible: ownership.vaultVisible,
      vaultSecondaryVisible: ownership.vaultSecondaryVisible,
    };
  });

  return rows.sort((a, b) => {
    if (a.vaultSortOrder !== b.vaultSortOrder) return a.vaultSortOrder - b.vaultSortOrder;
    if (a.driverId !== b.driverId) return a.driverId.localeCompare(b.driverId);
    return a.type.localeCompare(b.type);
  });
}

/**
 * Client-side function to apply canonical mapping to vault rows
 */
export async function applyCanonicalMappingToRows(rows: VaultDocumentRow[]): Promise<VaultDocumentRow[]> {
  const canonicalService = getCanonicalMappingService();
  await canonicalService.loadMapping();
  
  // Convert VaultDocumentRow back to DocumentRow for filtering
  const documentRows: DocumentRow[] = rows.map(row => ({
    driverId: row.driverId,
    type: row.type,
    status: row.status,
    issueDate: row.issueDate,
    expirationDate: row.expirationDate,
    previewUrl: row.previewUrl,
    fileUrl: row.fileUrl,
    blocksPayment: row.blocking,
    docTier: row.docTier,
    demoPlaceholder: row.demoPlaceholder,
    sourceLicenseNumber: row.sourceLicenseNumber,
    cdlNumber: row.cdlNumber,
    licenseClass: row.licenseClass,
    cdlIssueDate: row.cdlIssueDate,
    cdlExpiration: row.cdlExpiration,
    cdlEndorsements: row.cdlEndorsements,
    cdlRestrictions: row.cdlRestrictions,
  }));
  
  // Filter documents using canonical mapping
  const canonicalDocuments = canonicalService.filterCanonicalDocuments(documentRows);
  
  // Map back to VaultDocumentRow format
  return canonicalDocuments.map((doc) => {
    const originalRow = rows.find(r => r.driverId === doc.driverId && r.type === doc.type);
    return {
      ...doc,
      driverName: originalRow?.driverName || doc.driverId,
      atRisk: originalRow?.atRisk || false,
      blocking: originalRow?.blocking || false,
      vaultGroup: originalRow?.vaultGroup || "Other",
      vaultOwnershipLabel: originalRow?.vaultOwnershipLabel || "",
      vaultPrimaryOwner: originalRow?.vaultPrimaryOwner || "vault",
      vaultSortOrder: originalRow?.vaultSortOrder || 999,
      vaultVisible: originalRow?.vaultVisible || false,
      vaultSecondaryVisible: originalRow?.vaultSecondaryVisible || false,
    };
  });
}
