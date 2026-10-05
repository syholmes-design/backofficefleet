/**
 * Canonical-only gate for BOF controlled documents.
 * A generated file is not a current controlled document unless the roster says so.
 */
import {
  CONTROLLED_DOCUMENT_ROSTER,
  getControlledDocumentByAppId,
  getControlledDocumentByCode,
} from "@/lib/document-control/registry";
import type { ControlledDocumentRecord, DocumentLifecycle } from "@/lib/document-control/types";

export const NON_CURRENT_DOCUMENT_LIFECYCLES: ReadonlySet<DocumentLifecycle> = new Set([
  "SUPERSEDED",
  "ARCHIVED",
]);

export const GENERATOR_PREVIEW_SEGMENT = "_generator-preview";
export const HISTORICAL_DOCUMENT_SEGMENT = "_historical";

export function isCurrentCanonicalDocument(row: ControlledDocumentRecord): boolean {
  return !NON_CURRENT_DOCUMENT_LIFECYCLES.has(row.lifecycle);
}

export function listCurrentCanonicalDocuments(): ControlledDocumentRecord[] {
  return CONTROLLED_DOCUMENT_ROSTER.filter(isCurrentCanonicalDocument);
}

export function listCurrentCanonicalCodes(): string[] {
  return listCurrentCanonicalDocuments().map((row) => row.code);
}

export function listCurrentCanonicalAppIds(): string[] {
  return listCurrentCanonicalDocuments().flatMap((row) => row.stableAppIds);
}

export function fileCabinetItemIsCurrentCanonical(cabinetId: string): boolean {
  const ctrl = getControlledDocumentByAppId(cabinetId);
  return Boolean(ctrl && isCurrentCanonicalDocument(ctrl));
}

export function listDuplicateCurrentCanonicalTitles(): string[] {
  const seen = new Map<string, string[]>();
  for (const row of listCurrentCanonicalDocuments()) {
    const key = row.name.trim().toLowerCase();
    const existing = seen.get(key) ?? [];
    existing.push(row.code);
    seen.set(key, existing);
  }
  return [...seen.entries()].filter(([, codes]) => codes.length > 1).map(([title]) => title);
}

export function listUnauthorizedIndexCodes(indexText: string): string[] {
  const mentioned = [...indexText.matchAll(/\bBOF-[A-Z]+(?:-[A-Z]+)*-\d{3}\b/g)].map((m) => m[0]);
  return [...new Set(mentioned)].filter((code) => !getControlledDocumentByCode(code));
}

export function isIsolatedGeneratedDocumentPath(relPath: string): boolean {
  const normalized = relPath.replace(/\\/g, "/");
  if (normalized.includes(`/${GENERATOR_PREVIEW_SEGMENT}/`) || normalized.includes(`${GENERATOR_PREVIEW_SEGMENT}/`)) {
    return true;
  }
  if (normalized.includes(`/${HISTORICAL_DOCUMENT_SEGMENT}/`) || normalized.includes(`${HISTORICAL_DOCUMENT_SEGMENT}/`)) {
    return true;
  }
  if (normalized.endsWith(".pre-shell.html")) return true;
  return false;
}
