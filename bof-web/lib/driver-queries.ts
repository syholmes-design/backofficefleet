import type { BofData } from "./load-bof-data";
import type { DriverMedicalExpanded } from "./driver-medical-expanded";
import {
  JOHN_CARTER_PRIMARY_EXTRA_TYPES,
  JOHN_CARTER_SECONDARY_TYPE_ORDER,
} from "./john-carter-reference";
import {
  getCanonicalDriverDocuments,
  getDriverDocumentByType,
} from "./driver-doc-registry";

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

export type DocumentTier = "primary" | "secondary";

/** Document row from JSON; optional fields supported when present without changing required shape. */
export type DocumentRow = {
  driverId: string;
  type: string;
  status: string;
  /** When present on generated rows (e.g. medical card HTML metadata) */
  issueDate?: string;
  expirationDate?: string;
  previewUrl?: string;
  fileUrl?: string;
  /** When true, payment/dispatch may be blocked until resolved */
  blocksPayment?: boolean;
  /** Demo: primary vs secondary stack (fleet document layout). */
  docTier?: DocumentTier;
  /** Synthetic demo shell — not a production scan */
  demoPlaceholder?: boolean;
  /** License / CDL identifier from spreadsheet (display) */
  sourceLicenseNumber?: string;
  cdlNumber?: string;
  licenseClass?: string;
  cdlIssueDate?: string;
  cdlExpiration?: string;
  cdlEndorsements?: string;
  cdlRestrictions?: string;
};

export function getDriverById(data: BofData, id: string) {
  return data.drivers.find((d) => d.id === id) ?? null;
}

export function getOrderedDocumentsForDriver(
  data: BofData,
  driverId: string
): DocumentRow[] {
  const canonical = getCanonicalDriverDocuments(data, driverId);
  const byType = new Map<string, DocumentRow>();
  for (const doc of data.documents) {
    if (doc.driverId !== driverId) continue;
    byType.set(doc.type, doc as DocumentRow);
  }
  return DRIVER_DOCUMENT_TYPES.map((type) => {
    const canonicalDoc = canonical.find((d) => d.type === type);
    const row = byType.get(type);
    if (row) {
      return {
        ...row,
        status: canonicalDoc?.status ?? row.status,
        expirationDate: canonicalDoc?.expirationDate ?? row.expirationDate,
        fileUrl:
          canonicalDoc?.fileUrl ??
          getDriverDocumentByType(driverId, type) ??
          row.fileUrl,
        previewUrl:
          canonicalDoc?.previewUrl ??
          getDriverDocumentByType(driverId, type) ??
          row.previewUrl,
      };
    }
    return {
      driverId,
      type,
      status: canonicalDoc?.status ?? "MISSING",
      expirationDate: canonicalDoc?.expirationDate,
      fileUrl: canonicalDoc?.fileUrl ?? getDriverDocumentByType(driverId, type),
      previewUrl:
        canonicalDoc?.previewUrl ?? getDriverDocumentByType(driverId, type),
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

/** Expanded medical / MCSA fields from `driver_templates_expanded.xlsx` (merged into demo-data.json). */
export function getDriverMedicalExpanded(
  data: BofData,
  driverId: string
): DriverMedicalExpanded | null {
  const raw = (
    data as BofData & {
      driverMedicalExpanded?: Record<string, DriverMedicalExpanded>;
    }
  ).driverMedicalExpanded?.[driverId];
  return raw ?? null;
}

/** MCSA-5875 + Emergency Contact (fleet-wide; same ordering as reference driver). */
export function getPrimaryStackExtraDocuments(
  data: BofData,
  driverId: string
): DocumentRow[] {
  const want = new Set<string>(JOHN_CARTER_PRIMARY_EXTRA_TYPES);
  const byType = new Map<string, DocumentRow>();
  for (const doc of data.documents) {
    if (doc.driverId !== driverId) continue;
    if (want.has(doc.type)) byType.set(doc.type, doc as DocumentRow);
  }
  return JOHN_CARTER_PRIMARY_EXTRA_TYPES.map(
    (t) =>
      byType.get(t) ?? {
        driverId,
        type: t,
        status: "MISSING",
      }
  );
}

/**
 * Supplemental rows not in the seven core types or primary extensions.
 * Fleet-wide stable order (same as John Carter reference layout).
 */
export function getSecondaryStackDocumentsOrdered(
  data: BofData,
  driverId: string
): DocumentRow[] {
  const core = new Set<string>(DRIVER_DOCUMENT_TYPES);
  const primaryExtra = new Set<string>(JOHN_CARTER_PRIMARY_EXTRA_TYPES);

  const pool = data.documents.filter(
    (d) =>
      d.driverId === driverId &&
      !core.has(d.type as (typeof DRIVER_DOCUMENT_TYPES)[number]) &&
      !primaryExtra.has(d.type)
  ) as DocumentRow[];

  const order = new Map(
    JOHN_CARTER_SECONDARY_TYPE_ORDER.map((t, i) => [t, i])
  );
  return [...pool].sort((a, b) => {
    const ia = order.get(
      a.type as (typeof JOHN_CARTER_SECONDARY_TYPE_ORDER)[number]
    );
    const ib = order.get(
      b.type as (typeof JOHN_CARTER_SECONDARY_TYPE_ORDER)[number]
    );
    return (ia ?? 99) - (ib ?? 99) || a.type.localeCompare(b.type);
  });
}
