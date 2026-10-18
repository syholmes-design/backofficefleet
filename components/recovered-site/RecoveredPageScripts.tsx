"use client";

import { useEffect } from "react";

/**
 * Runs a recovered page's original in-page widget scripts (workspace filters,
 * pay-profile workbench) after its content is in the DOM. Script text comes
 * from the repository's recovered content, never from user input.
 */
export function RecoveredPageScripts({ inlineScripts, widgetScripts }: { inlineScripts: string[]; widgetScripts: string[] }) {
  useEffect(() => {
    const added: HTMLScriptElement[] = [];
    let cancelled = false;

    // Original pages revealed sections on scroll via site.js (not loaded here): show them.
    document.querySelectorAll(".bof-legacy .reveal").forEach((el) => el.classList.add("is-visible", "in-view", "visible"));

    const runInline = () => {
      for (const code of inlineScripts) {
        const el = document.createElement("script");
        el.text = `(function(){${code}\n})();`;
        document.body.appendChild(el);
        added.push(el);
      }
    };

    const loadNext = (index: number) => {
      if (cancelled) return;
      if (index >= widgetScripts.length) {
        runInline();
        return;
      }
      const el = document.createElement("script");
      el.src = widgetScripts[index];
      el.async = false;
      el.onload = () => loadNext(index + 1);
      el.onerror = () => loadNext(index + 1);
      document.body.appendChild(el);
      added.push(el);
    };
    loadNext(0);

    return () => {
      cancelled = true;
      added.forEach((el) => el.remove());
    };
  }, [inlineScripts, widgetScripts]);

  return null;
}
