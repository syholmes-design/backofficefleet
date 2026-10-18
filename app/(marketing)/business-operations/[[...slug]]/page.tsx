import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { PlatformCapabilityKey } from "@/components/recovered-site/PlatformCapabilityLinks";
import { RecoveredPageView } from "@/components/recovered-site/RecoveredPageView";
import { loadRecoveredPage, recoveredEntry, recoveredRoutes, recoveredSlug } from "@/lib/recovered-site/business-operations";

/**
 * Business Operations: BOF's original pages recovered verbatim from Git history
 * (see docs/recovery/). Every route is generated at build time from the manifest.
 */
export const dynamicParams = false;

type Params = { slug?: string[] };

const SECTION = "/business-operations";

function routeFor(slug: string[] | undefined) {
  return [SECTION, ...(slug ?? [])].join("/");
}

export function generateStaticParams(): Params[] {
  return recoveredRoutes(SECTION).map((route) => ({ slug: recoveredSlug(route, SECTION) }));
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
  return (
    <RecoveredPageView
      page={page}
      route={route}
      related={RELATED_BY_ROUTE[route]}
      relatedLabel="Related Business Operations pages"
      capabilities={CAPABILITIES_BY_ROUTE[route]}
    />
  );
}
