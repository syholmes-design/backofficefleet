import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import type { PlatformCapabilityKey } from "@/components/recovered-site/PlatformCapabilityLinks";
import { RecoveredPageView } from "@/components/recovered-site/RecoveredPageView";
import { loadRecoveredPage, recoveredEntry, recoveredRoutes, recoveredSlug } from "@/lib/recovered-site/business-operations";

/**
 * Service explainers: BOF's historical Dispatch, Drivers, Documents, Safety, Settlements and Fleet
 * pages, recovered verbatim from Git history (see docs/recovery/). Their original URLs now belong to
 * the signed-in platform, so they are published under /services. Generated from the manifest.
 */
export const dynamicParams = false;

type Params = { slug?: string[] };

const SECTION = "/services";

function routeFor(slug: string[] | undefined) {
  return [SECTION, ...(slug ?? [])].join("/");
}

export function generateStaticParams(): Params[] {
  return [{ slug: [] }, ...recoveredRoutes(SECTION).map((route) => ({ slug: recoveredSlug(route, SECTION) }))];
}

/** The explainers listed on /services, each with its detail pages (titles and descriptions come from the recovered pages). */
const SERVICE_INDEX: Array<[string, string[]]> = [
  ["/services/dispatch", []],
  ["/services/drivers", ["/services/drivers/onboarding", "/services/drivers/compliance-documents", "/services/drivers/communication", "/services/drivers/settlements-payments"]],
  ["/services/documents", []],
  ["/services/safety", []],
  ["/services/settlements", ["/services/settlements/audit-trail", "/services/settlements/exception-visibility", "/services/settlements/finance-operations-alignment", "/services/settlements/single-record-accountability"]],
  ["/services/fleet", []],
];

const shortTitle = (route: string) => (recoveredEntry(route)?.title ?? route).replace(/ \| BackOfficeFleet$/, "");

function ServicesIndex() {
  return (
    <section className="bof-services-index" aria-labelledby="services-index-heading">
      <h1 id="services-index-heading">BOF services</h1>
      <p className="bof-services-index__lead">
        Each service page explains the work BOF performs and leads to its detail pages and to a demonstration with
        fictional records. Business Operations (HR, accounting, treasury, finance, payroll) has its own section.
      </p>
      <div className="bof-services-index__grid">
        {SERVICE_INDEX.map(([route, children]) => (
          <article key={route}>
            <h2>
              <Link href={route}>{shortTitle(route)} →</Link>
            </h2>
            {recoveredEntry(route)?.description ? <p>{recoveredEntry(route)?.description}</p> : null}
            {children.length ? (
              <ul>
                {children.map((child) => (
                  <li key={child}>
                    <Link href={child}>{shortTitle(child)}</Link>
                  </li>
                ))}
              </ul>
            ) : null}
            {DEMOS_BY_ROUTE[route]?.[0] ? (
              <Link className="bof-services-index__demo" href={DEMOS_BY_ROUTE[route][0][1]}>
                {DEMOS_BY_ROUTE[route][0][0]} →
              </Link>
            ) : null}
          </article>
        ))}
      </div>
      <p className="bof-services-index__actions">
        <Link href="/business-operations">Business Operations →</Link>
        <Link href="/interactive-demo">Interactive demo →</Link>
        <Link href="/assessment">Take the Assessment →</Link>
      </p>
    </section>
  );
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  if (!slug?.length) return { title: "Services | BackOfficeFleet", description: "BOF service explainers with detail pages and demonstrations." };
  const entry = recoveredEntry(routeFor(slug));
  if (!entry) return {};
  return {
    title: entry.title || "Services | BackOfficeFleet",
    description: entry.description || undefined,
    robots: entry.archive ? { index: false, follow: false } : undefined,
  };
}

/** Each explainer leads on to the demonstrations of the same work (fictional records, no sign-in). */
const DEMOS_BY_ROUTE: Record<string, Array<[string, string]>> = {
  "/services/dispatch": [
    ["Interactive dispatch board", "/interactive-demo/dispatch"],
    ["Load queue", "/interactive-demo/load-queue"],
    ["Dispatch exceptions demo", "/demo/dispatch"],
    ["Customer load intake", "/customer-portal/load-intake"],
    ["Pre-trip load status", "/demo/loads"],
  ],
  "/services/drivers": [
    ["Driver files demo", "/interactive-demo/drivers"],
    ["Driver document intake", "/interactive-demo/drivers/document-intake"],
    ["Driver Onboarding", "/services/drivers/onboarding"],
    ["Driver Compliance Documents", "/services/drivers/compliance-documents"],
    ["Driver Communication", "/services/drivers/communication"],
    ["Driver Settlements & Payments", "/services/drivers/settlements-payments"],
  ],
  "/services/drivers/onboarding": [
    ["Recruiting & onboarding workspace", "/business-operations/hr-tier/recruiting-onboarding"],
    ["Driver document intake", "/interactive-demo/drivers/document-intake"],
    ["Driver Onboarding (Business Operations)", "/business-operations/driver-onboarding"],
  ],
  "/services/drivers/compliance-documents": [
    ["Driver files demo", "/interactive-demo/drivers"],
    ["Driver file cabinet (sample documents)", "/documents"],
    ["Safety & compliance demo", "/interactive-demo/safety"],
  ],
  "/services/drivers/communication": [
    ["Alerts demo", "/interactive-demo/alerts"],
    ["Driver files demo", "/interactive-demo/drivers"],
  ],
  "/services/drivers/settlements-payments": [
    ["Settlements demo", "/interactive-demo/settlements"],
    ["Settlement holds demo", "/demo/settlements"],
    ["Payroll Administration", "/business-operations/payroll-administration"],
  ],
  "/services/documents": [
    ["Documents demo", "/interactive-demo/documents"],
    ["Driver document intake", "/interactive-demo/drivers/document-intake"],
    ["Driver file cabinet (sample documents)", "/documents"],
    ["BOF Vault intake", "/bof-vault/intake"],
    ["Document & Records Control", "/business-operations/document-records-control"],
  ],
  "/services/safety": [
    ["Safety & compliance demo", "/interactive-demo/safety"],
    ["Safety review", "/safety"],
    ["Driver Compliance Documents", "/services/drivers/compliance-documents"],
  ],
  "/services/settlements": [
    ["Settlements demo", "/interactive-demo/settlements"],
    ["Settlement holds demo", "/demo/settlements"],
    ["Money at risk", "/money-at-risk"],
    ["Savings estimate", "/fleet-savings"],
    ["Audit trail", "/services/settlements/audit-trail"],
    ["Exception visibility", "/services/settlements/exception-visibility"],
    ["Finance and operations alignment", "/services/settlements/finance-operations-alignment"],
    ["Single-record accountability", "/services/settlements/single-record-accountability"],
  ],
  "/services/fleet": [
    ["Interactive control room", "/interactive-demo"],
    ["Savings estimate", "/fleet-savings"],
    ["Command center demo", "/demo/command-center"],
  ],
};
for (const sub of ["audit-trail", "exception-visibility", "finance-operations-alignment", "single-record-accountability"]) {
  DEMOS_BY_ROUTE[`/services/settlements/${sub}`] = [
    ["Settlements", "/services/settlements"],
    ["Settlements demo", "/interactive-demo/settlements"],
    ["Settlement holds demo", "/demo/settlements"],
  ];
}

const CAPABILITIES_BY_ROUTE: Record<string, PlatformCapabilityKey[]> = {
  "/services/dispatch": ["dispatch-assignment", "driver-compliance-documents"],
  "/services/drivers": ["driver-onboarding", "driver-compliance-documents", "dispatch-assignment"],
  "/services/drivers/onboarding": ["driver-onboarding", "driver-compliance-documents"],
  "/services/drivers/compliance-documents": ["driver-compliance-documents", "dispatch-assignment"],
  "/services/documents": ["driver-compliance-documents", "driver-onboarding"],
};

export default async function RecoveredServicePage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  if (!slug?.length) return <ServicesIndex />;
  const route = routeFor(slug);
  const page = await loadRecoveredPage(route);
  if (!page) notFound();
  return (
    <RecoveredPageView
      page={page}
      route={route}
      related={DEMOS_BY_ROUTE[route]}
      relatedLabel="See it in the demonstrations"
      capabilities={CAPABILITIES_BY_ROUTE[route]}
    />
  );
}
