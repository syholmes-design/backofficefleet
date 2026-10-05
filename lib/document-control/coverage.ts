import { CONTROLLED_DOCUMENT_ROSTER } from "@/lib/document-control/registry";
import { OPERATIONS_FILE_CABINET_REGISTRY } from "@/lib/operations-file-cabinet";
import {
  listCurrentCanonicalAppIds,
  listCurrentCanonicalDocuments,
} from "@/lib/document-control/canonical-gate";

export function listDuplicateControlledCodes(): string[] {
  const seen = new Map<string, number>();
  for (const row of CONTROLLED_DOCUMENT_ROSTER) {
    seen.set(row.code, (seen.get(row.code) ?? 0) + 1);
  }
  return [...seen.entries()].filter(([, count]) => count > 1).map(([code]) => code);
}

export function listDuplicateStableAppIds(): string[] {
  const seen = new Map<string, number>();
  for (const row of CONTROLLED_DOCUMENT_ROSTER) {
    for (const id of row.stableAppIds) {
      seen.set(id, (seen.get(id) ?? 0) + 1);
    }
  }
  return [...seen.entries()].filter(([, count]) => count > 1).map(([id]) => id);
}

export function getCabinetDocumentCoverage() {
  const mappedIds = new Set(
    CONTROLLED_DOCUMENT_ROSTER.flatMap((row) => row.stableAppIds)
  );
  const currentAppIds = new Set(listCurrentCanonicalAppIds());
  const cabinetIds = OPERATIONS_FILE_CABINET_REGISTRY.map((item) => item.id);
  const mapped = cabinetIds.filter((id) => mappedIds.has(id));
  const unmapped = cabinetIds.filter((id) => !mappedIds.has(id));
  const unmappedCurrent = cabinetIds.filter((id) => !currentAppIds.has(id));
  return {
    cabinetCount: cabinetIds.length,
    rosterCount: CONTROLLED_DOCUMENT_ROSTER.length,
    currentCanonicalCount: listCurrentCanonicalDocuments().length,
    mappedCount: mapped.length,
    unmapped,
    unmappedCurrent,
    duplicateCodes: listDuplicateControlledCodes(),
    duplicateAppIds: listDuplicateStableAppIds(),
  };
}
