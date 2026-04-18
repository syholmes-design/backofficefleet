import type { BofData } from "@/lib/load-bof-data";
import {
  DRIVER_DOCUMENT_TYPES,
  type DocumentRow,
  type DriverDocType,
} from "@/lib/driver-queries";
import { normalizeDocStatus } from "@/lib/document-ui";

export type VaultDocumentRow = DocumentRow & {
  driverName: string;
  /** Open compliance mapped to this driver + document type, or status AT RISK */
  atRisk: boolean;
  /** Critical compliance on this credential and/or explicit blocksPayment on the row */
  blocking: boolean;
  /** Core seven, primary extensions, or secondary / other (vault scanability) */
  vaultGroup: "Core" | "Primary" | "Secondary" | "Other";
};

function vaultGroupLabel(doc: DocumentRow): VaultDocumentRow["vaultGroup"] {
  if (doc.docTier === "secondary") return "Secondary";
  if (doc.docTier === "primary") return "Primary";
  if (DRIVER_DOCUMENT_TYPES.includes(doc.type as DriverDocType)) return "Core";
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
  const open = data.complianceIncidents.filter(
    (c) => c.driverId === driverId && c.status === "OPEN"
  );
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
 * One row per record in `data.documents` (12 drivers × core + structured supplemental stack).
 */
export function buildVaultRows(data: BofData): VaultDocumentRow[] {
  const nameById = new Map(data.drivers.map((d) => [d.id, d.name]));

  return data.documents.map((raw) => {
    const doc = raw as DocumentRow & { blocksPayment?: boolean };
    const flags = complianceFlagsForDoc(data, doc.driverId, doc.type);
    const statusNorm = normalizeDocStatus(doc.status);
    const explicitBlock = doc.blocksPayment === true;

    return {
      ...doc,
      driverName: nameById.get(doc.driverId) ?? doc.driverId,
      atRisk: flags.atRisk || statusNorm === "AT RISK" || statusNorm === "AT_RISK",
      blocking: flags.blocking || explicitBlock,
      vaultGroup: vaultGroupLabel(doc),
    };
  });
}
