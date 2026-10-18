import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PlatformCapabilityLinks, type PlatformCapabilityKey } from "@/components/recovered-site/PlatformCapabilityLinks";
import { RecoveredPageScripts } from "@/components/recovered-site/RecoveredPageScripts";
import { loadRecoveredPage, recoveredEntry, recoveredRoutes } from "@/lib/recovered-site/business-operations";

/**
 * Business Operations: BOF's original pages recovered verbatim from Git history
 * (see docs/recovery/). Every route is generated at build time from the manifest.
 */
export const dynamicParams = false;

type Params = { slug?: string[] };

/** "fork-20260819" -> "2026-08-19" */
function versionDate(generation: string) {
  const digits = generation.match(/(\d{4})(\d{2})(\d{2})$/);
  return digits ? `${digits[1]}-${digits[2]}-${digits[3]}` : "earlier version";
}

function routeFor(slug: string[] | undefined) {
  return ["/business-operations", ...(slug ?? [])].join("/");
}

export function generateStaticParams(): Params[] {
  return recoveredRoutes().map((route) => ({ slug: route.split("/").slice(2).filter(Boolean) }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const entry = recoveredEntry(routeFor(slug));
  if (!entry) return {};
  return {
    title: entry.title || "Business Operations | BackOfficeFleet",
    description: entry.description || undefined,
    robots: entry.archive ? { index: false, follow: false } : undefined,
  };
}

/** Where the explanation connects to an operating capability, offer the demo and the sign-in path. */
const CAPABILITIES_BY_ROUTE: Record<string, PlatformCapabilityKey[]> = {
  "/business-operations": ["driver-onboarding", "driver-compliance-documents", "dispatch-assignment"],
  "/business-operations/driver-onboarding": ["driver-onboarding", "driver-compliance-documents", "dispatch-assignment"],
  "/business-operations/driver-onboarding/assignment-readiness": ["driver-onboarding", "driver-compliance-documents", "dispatch-assignment"],
  "/business-operations/hr-tier/recruiting-onboarding": ["driver-onboarding", "driver-compliance-documents"],
  "/business-operations/document-management": ["driver-compliance-documents", "driver-onboarding"],
  "/business-operations/document-management/records-control": ["driver-compliance-documents", "driver-onboarding"],
  "/business-operations/document-records-control": ["driver-compliance-documents", "driver-onboarding", "dispatch-assignment"],
};

/**
 * Navigation between recovered generations: the two pages that exist only in the
 * 2026-08-19 fork are otherwise unlinked from the July page family (and vice versa).
 */
const RELATED_BY_ROUTE: Record<string, Array<[string, string]>> = {
  "/business-operations/customer-billing": [["Billing & AR Control", "/business-operations/customer-billing/billing-ar-control"]],
  "/business-operations/accounts-receivable": [["Billing & AR Control", "/business-operations/customer-billing/billing-ar-control"]],
  "/business-operations/customer-billing/billing-ar-control": [
    ["Customer Billing", "/business-operations/customer-billing"],
    ["Billing Packet Control", "/business-operations/customer-billing/billing-packet-control"],
    ["Accounts Receivable", "/business-operations/accounts-receivable"],
  ],
  "/business-operations/document-management": [["Document & Records Control", "/business-operations/document-records-control"]],
  "/business-operations/document-management/records-control": [["Document & Records Control", "/business-operations/document-records-control"]],
  "/business-operations/document-records-control": [
    ["Document Management", "/business-operations/document-management"],
    ["Records Control", "/business-operations/document-management/records-control"],
  ],
};

export default async function RecoveredBusinessOperationsPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const route = routeFor(slug);
  const page = await loadRecoveredPage(route);
  if (!page) notFound();
  const capabilities = CAPABILITIES_BY_ROUTE[route];

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
            // Verbatim recovered markup from this repository's history (not user input).
            dangerouslySetInnerHTML={{ __html: page.html }}
          />
        </div>
      </div>
      {RELATED_BY_ROUTE[route] ? (
        <nav className="bof-recovered-related" aria-label="Related Business Operations pages">
          <span>Related Business Operations pages:</span>
          {RELATED_BY_ROUTE[route].map(([label, href]) => (
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
