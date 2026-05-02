/**
 * Sanitize dynamic strings embedded in SVG/XML text nodes and attributes
 * that expect plain text (not raw markup).
 *
 * Do not use for href/data URLs; use path/URL validation separately.
 */
export function sanitizeSvgText(value) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Invalid in XML 1.0 PCDATA (and most SVG text). */
export const INVALID_XML_PCDATA_CTRL_RE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
