import manifest from "@/lib/generated/operating-doc-manifest.json";

export type OperatingDocumentCategory = "claims" | "settlements" | "factoring" | "vendors";
export type OperatingDocumentKind = "generated" | "promoted_from_loads";

export type OperatingDocumentRecord = {
  id: string;
  kind: OperatingDocumentKind;
  category: OperatingDocumentCategory;
  path: string;
  loadId?: string;
  vendorId?: string;
};

type OperatingDocumentManifest = {
  generatedOn?: string;
  p1Scope?: string;
  docs?: OperatingDocumentRecord[];
};

const raw = manifest as OperatingDocumentManifest;
const DOCS: OperatingDocumentRecord[] = Array.isArray(raw.docs) ? raw.docs : [];

function normalizePath(path: string): string {
  const trimmed = String(path || "").trim();
  if (!trimmed) return "";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

function titleFromPath(path: string): string {
  const last = normalizePath(path).split("/").filter(Boolean).pop() ?? "";
  const stem = last.replace(/\.html?$/i, "");
  return stem
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function typeFromPath(path: string): string {
  const last = normalizePath(path).split("/").filter(Boolean).pop() ?? "";
  return last.replace(/\.html?$/i, "");
}

export function getOperatingDocumentsForLoad(loadId: string): OperatingDocumentRecord[] {
  const id = String(loadId || "").trim();
  if (!id) return [];
  return DOCS.filter((doc) => doc.loadId === id).map((doc) => ({ ...doc, path: normalizePath(doc.path) }));
}

export function getOperatingDocumentsByCategory(category: OperatingDocumentCategory): OperatingDocumentRecord[] {
  return DOCS.filter((doc) => doc.category === category).map((doc) => ({ ...doc, path: normalizePath(doc.path) }));
}

export function getOperatingDocumentsForVendor(vendorId: string): OperatingDocumentRecord[] {
  const id = String(vendorId || "").trim();
  if (!id) return [];
  return DOCS.filter((doc) => doc.vendorId === id).map((doc) => ({ ...doc, path: normalizePath(doc.path) }));
}

export function getOperatingDocumentsForFactoring(loadId: string): OperatingDocumentRecord[] {
  const id = String(loadId || "").trim();
  if (!id) return [];
  return DOCS
    .filter((doc) => doc.category === "factoring" && doc.loadId === id)
    .map((doc) => ({ ...doc, path: normalizePath(doc.path) }));
}

export function getOperatingDocumentTitle(doc: OperatingDocumentRecord): string {
  return titleFromPath(doc.path);
}

export function getOperatingDocumentType(doc: OperatingDocumentRecord): string {
  return typeFromPath(doc.path);
}

export function getOperatingDocumentPath(doc: OperatingDocumentRecord): string {
  return normalizePath(doc.path);
}
