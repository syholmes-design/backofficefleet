import Link from "next/link";

import { PlatformCapabilityLinks, type PlatformCapabilityKey } from "@/components/recovered-site/PlatformCapabilityLinks";
import { RecoveredPageScripts } from "@/components/recovered-site/RecoveredPageScripts";
import type { RecoveredPage } from "@/lib/recovered-site/business-operations";

/** "fork-20260819" -> "2026-08-19" */
function versionDate(generation: string) {
  const digits = generation.match(/(\d{4})(\d{2})(\d{2})$/);
  return digits ? `${digits[1]}-${digits[2]}-${digits[3]}` : "earlier version";
}

/**
 * Renders one recovered page (verbatim historical markup, scoped stylesheet, original widget
 * scripts) with the connections the current site adds after it: related pages and demos.
 */
export function RecoveredPageView({
  page,
  route,
  related,
  relatedLabel,
  capabilities,
}: {
  page: RecoveredPage;
  route: string;
  related?: Array<[string, string]>;
  relatedLabel?: string;
  capabilities?: PlatformCapabilityKey[];
}) {
  return (
    <>
      <link rel="stylesheet" href={`/recovered-assets/${page.generation}/scoped.css`} precedence="default" />
      {page.archive ? (
        <div className="bof-recovered-archive-banner" role="note">
          Archived historical version ({versionDate(page.generation)}), kept for owner review and not linked from the public
          site.
        </div>
      ) : null}
      {/* Provenance (commit and path) stays in docs/recovery/, not in public markup. */}
      <div className="bof-legacy" data-recovered-route={route}>
        <div className={`bof-legacy-body ${page.bodyClass}`}>
          <div
            className={`bof-legacy-main ${page.mainClass}`}
            id={page.mainId || undefined}
            // Original <main> data-* attributes: mount points the page's own scripts look for.
            {...(page.mainData ?? {})}
            // Verbatim recovered markup from this repository's history (not user input).
            dangerouslySetInnerHTML={{ __html: page.html }}
          />
        </div>
      </div>
      {related?.length ? (
        <nav className="bof-recovered-related" aria-label={relatedLabel ?? "Related pages"}>
          <span>{relatedLabel ?? "Related pages"}:</span>
          {related.map(([label, href]) => (
            <Link key={href} href={href}>
              {label} →
            </Link>
          ))}
        </nav>
      ) : null}
      {capabilities ? <PlatformCapabilityLinks keys={capabilities} currentRoute={route} /> : null}
      <RecoveredPageScripts inlineScripts={page.inlineScripts} widgetScripts={page.widgetScripts} />
    </>
  );
}
