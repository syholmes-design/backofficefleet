import type { DocumentRow } from "@/lib/driver-queries";

/** Human-readable labels for vault and driver document cards (internal `type` keys unchanged). */
const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  "Medical Card": "Medical examiner's certificate / Med card",
  FMCSA: "FMCSA Compliance",
  "Bank Info": "Bank info / Direct deposit",
  "MCSA-5875": "Medical exam report (MCSA-5875)",
  "Emergency Contact": "Emergency contact",
  "MCSA-5876 (signed PDF)": "Signed medical exam (MCSA-5876)",
  "Driver profile (HTML)": "Driver profile (HTML)",
  "Driver Application": "Driver application",
  "Safety Acknowledgment": "Safety acknowledgment",
  "Qualification File": "Qualification file status",
  "Insurance Card": "Insurance card",
  "Incident / Accident Report": "Incident / accident report",
  "BOF Medical Summary": "BOF medical summary",
  "FMCSA DQF Compliance Summary": "FMCSA DQF compliance summary (generated)",
};

export function documentTypeLabel(type: string): string {
  return DOCUMENT_TYPE_LABELS[type] ?? type;
}

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

/** Canonical vault PDFs (I-9 / W-9): iframe embed is unreliable — open in new tab from compact card. */
export function isCanonicalVaultFormPdf(url: string, kind: "i9" | "w9"): boolean {
  const u = url.trim();
  if (!u.startsWith("/documents/drivers/DRV-")) return false;
  if (!/\.pdf(\?|$)/i.test(u)) return false;
  if (kind === "w9") return /\/w9-drv-\d{3}\.pdf$/i.test(u);
  return /\/i9-drv-\d{3}\.pdf$/i.test(u);
}

/** Canonical FMCSA DQF Compliance Summary PDF — administrative summary only; not a credential expiration source. */
export function isCanonicalDqfComplianceSummaryPdf(url: string): boolean {
  const u = url.trim();
  if (!u.startsWith("/documents/drivers/DRV-")) return false;
  return /\.pdf(\?|$)/i.test(u) && /\/dqf-compliance-summary-drv-\d{3}\.pdf$/i.test(u);
}

/** Previews that render in an iframe (HTML credential shells; PDFs except canonical non-embed driver vault PDFs). */
export function isEmbedPreviewPath(url: string) {
  if (!url) return false;
  if (
    isCanonicalVaultFormPdf(url, "i9") ||
    isCanonicalVaultFormPdf(url, "w9") ||
    isCanonicalDqfComplianceSummaryPdf(url)
  )
    return false;
  return isHtmlPath(url) || /\.pdf(\?|$)/i.test(url);
}

export function normalizeDocStatus(status: string) {
  return status.trim().toUpperCase().replace(/\s+/g, " ");
}

export type DocumentSignal = "blocking" | "expired" | "missing" | "at-risk" | "resolved";

export function documentSignal(doc: Pick<DocumentRow, "status"> & { blocking?: boolean; atRisk?: boolean }): DocumentSignal {
  const s = normalizeDocStatus(doc.status);
  if (doc.blocking) return "blocking";
  if (s === "EXPIRED") return "expired";
  if (s === "MISSING") return "missing";
  if (doc.atRisk || s === "AT RISK" || s === "AT_RISK" || s === "ATRISK") return "at-risk";
  return "resolved";
}

export function documentSignalLabel(signal: DocumentSignal): string {
  switch (signal) {
    case "blocking":
      return "Blocking action";
    case "expired":
      return "Expired";
    case "missing":
      return "Missing";
    case "at-risk":
      return "At risk";
    default:
      return "Resolved / clean";
  }
}

export function documentSignalClass(signal: DocumentSignal): string {
  switch (signal) {
    case "blocking":
      return "bof-status-pill bof-status-pill-danger";
    case "expired":
    case "missing":
      return "bof-status-pill bof-status-pill-warn";
    case "at-risk":
      return "bof-status-pill bof-status-pill-info";
    default:
      return "bof-status-pill bof-status-pill-ok";
  }
}
