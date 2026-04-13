import type { BofData } from "./load-bof-data";

export const DRIVER_DOCUMENT_TYPES = [
  "CDL",
  "Medical Card",
  "MVR",
  "I-9",
  "FMCSA",
  "W-9",
  "Bank Info",
] as const;

export type DriverDocType = (typeof DRIVER_DOCUMENT_TYPES)[number];

/** Document row from JSON; optional fields supported when present without changing required shape. */
export type DocumentRow = {
  driverId: string;
  type: string;
  status: string;
  expirationDate?: string;
  previewUrl?: string;
  fileUrl?: string;
  /** When true, payment/dispatch may be blocked until resolved */
  blocksPayment?: boolean;
};

export function getDriverById(data: BofData, id: string) {
  return data.drivers.find((d) => d.id === id) ?? null;
}

export function getOrderedDocumentsForDriver(
  data: BofData,
  driverId: string
): DocumentRow[] {
  const byType = new Map<string, DocumentRow>();
  for (const doc of data.documents) {
    if (doc.driverId !== driverId) continue;
    byType.set(doc.type, doc as DocumentRow);
  }
  return DRIVER_DOCUMENT_TYPES.map((type) => {
    const row = byType.get(type);
    if (row) return row;
    return {
      driverId,
      type,
      status: "MISSING",
    };
  });
}

export function assignedTrucksForDriver(data: BofData, driverId: string) {
  const assets = [
    ...new Set(
      data.loads.filter((l) => l.driverId === driverId).map((l) => l.assetId)
    ),
  ];
  return assets;
}

export function primaryAssignedTruck(data: BofData, driverId: string) {
  const loads = data.loads.filter((l) => l.driverId === driverId);
  if (loads.length === 0) return null;
  const active = loads.find((l) => l.status === "En Route");
  return (active ?? loads[0]).assetId;
}

export function readinessFromDocuments(docs: DocumentRow[]) {
  let valid = 0;
  let expired = 0;
  let missing = 0;
  for (const d of docs) {
    const s = d.status.toUpperCase();
    if (s === "VALID") valid += 1;
    else if (s === "EXPIRED") expired += 1;
    else missing += 1;
  }
  const label =
    missing === 0 && expired === 0
      ? "Ready — all documents on file"
      : missing > 0 && expired > 0
        ? `Action required — ${missing} missing, ${expired} expired`
        : missing > 0
          ? `Action required — ${missing} missing document(s)`
          : `Attention — ${expired} expired document(s)`;
  return { valid, expired, missing, label };
}

export function complianceNotesForDriver(data: BofData, driverId: string) {
  return data.complianceIncidents.filter((c) => c.driverId === driverId);
}
