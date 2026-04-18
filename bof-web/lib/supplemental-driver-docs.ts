import type { BofData } from "./load-bof-data";
import { DRIVER_DOCUMENT_TYPES, type DocumentRow } from "./driver-queries";

/** Documents in demo-data that are not one of the seven core credential types (e.g. MCSA PDF, profile HTML). */
export function getSupplementalDocumentsForDriver(
  data: BofData,
  driverId: string
): DocumentRow[] {
  const core = new Set<string>(DRIVER_DOCUMENT_TYPES);
  return data.documents.filter(
    (d) => d.driverId === driverId && !core.has(d.type as (typeof DRIVER_DOCUMENT_TYPES)[number])
  ) as DocumentRow[];
}
