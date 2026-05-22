import type { BofData } from "./load-bof-data";
import { FLEET_STRUCTURED_SUPPLEMENTAL_TYPE_SET } from "./john-carter-reference";
import { DRIVER_DOCUMENT_TYPES, type DocumentRow } from "./driver-queries";

/**
 * Ad-hoc attachments only — excludes the seven core types and the fleet structured
 * primary-extension + secondary stack (wired in build:data).
 */
export function getSupplementalDocumentsForDriver(
  data: BofData,
  driverId: string
): DocumentRow[] {
  const core = new Set<string>(DRIVER_DOCUMENT_TYPES);
  return data.documents.filter(
    (d) =>
      d.driverId === driverId &&
      !core.has(d.type as (typeof DRIVER_DOCUMENT_TYPES)[number]) &&
      !FLEET_STRUCTURED_SUPPLEMENTAL_TYPE_SET.has(d.type)
  ) as DocumentRow[];
}
