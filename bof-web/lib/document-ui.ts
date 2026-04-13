import type { DocumentRow } from "@/lib/driver-queries";

export function statusBadgeClass(status: string) {
  const s = status.toUpperCase();
  if (s === "VALID") return "bof-doc-badge bof-doc-badge-valid";
  if (s === "EXPIRED") return "bof-doc-badge bof-doc-badge-expired";
  if (s === "MISSING") return "bof-doc-badge bof-doc-badge-missing";
  if (s === "AT RISK" || s === "AT_RISK" || s === "ATRISK")
    return "bof-doc-badge bof-doc-badge-warn";
  return "bof-doc-badge bof-doc-badge-neutral";
}

export function previewAvailable(doc: Pick<DocumentRow, "previewUrl" | "fileUrl">) {
  const u = (doc.previewUrl || doc.fileUrl || "").trim();
  return u.length > 0;
}

export function proofHref(doc: Pick<DocumentRow, "previewUrl" | "fileUrl">) {
  const u = (doc.fileUrl || doc.previewUrl || "").trim();
  return u.length > 0 ? u : null;
}

export function isImagePath(url: string) {
  return /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url);
}

export function isHtmlPath(url: string) {
  return /\.html(\?|$)/i.test(url);
}

/** Previews that render in an iframe (HTML credential shells, PDFs). */
export function isEmbedPreviewPath(url: string) {
  return isHtmlPath(url) || /\.pdf(\?|$)/i.test(url);
}

export function normalizeDocStatus(status: string) {
  return status.trim().toUpperCase().replace(/\s+/g, " ");
}
