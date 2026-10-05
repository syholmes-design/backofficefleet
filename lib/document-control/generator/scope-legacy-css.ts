/**
 * Prefix legacy inline document CSS so it cannot restyle the controlled shell.
 * Does not rewrite document content.
 */
export function scopeLegacyCssToDocBody(css: string): string {
  return css.replace(/(^|})\s*([^{}]+?)\s*\{/g, (full, brace: string, selectors: string) => {
    const trimmed = selectors.trim();
    if (!trimmed || trimmed.startsWith("@")) return full;
    const scoped = trimmed
      .split(",")
      .map((raw) => {
        const selector = raw.trim();
        if (!selector) return selector;
        if (selector === ":root") return ".doc-body";
        if (selector === "*" || selector.startsWith("*")) return `.doc-body, .doc-body ${selector}`;
        if (selector === "body" || selector.startsWith("body ")) {
          return selector.replace(/^body\b/, ".doc-body");
        }
        if (selector.startsWith(".doc-body")) return selector;
        return `.doc-body ${selector}`;
      })
      .join(", ");
    return `${brace} ${scoped} {`;
  });
}

export function extractDocumentInnerHtml(html: string): { title?: string; innerHtml: string } {
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const style = html.match(/<style>([\s\S]*?)<\/style>/i)?.[1] ?? "";
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? html;
  const scoped = style ? `<style>${scopeLegacyCssToDocBody(style)}</style>` : "";
  return { title, innerHtml: `${scoped}${body}` };
}
