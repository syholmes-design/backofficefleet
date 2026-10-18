import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RecoveredPageView } from "@/components/recovered-site/RecoveredPageView";
import { loadRecoveredPage, recoveredEntry, recoveredRoutes, recoveredSlug } from "@/lib/recovered-site/business-operations";

/**
 * BOF's interactive product demonstration (2026-07-29), recovered verbatim from Git history.
 * Every record is fictional; the page scripts render each route client-side. No sign-in.
 */
export const dynamicParams = false;

type Params = { slug?: string[] };

const SECTION = "/interactive-demo";

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
  return { title: entry.title || "Interactive demo | BackOfficeFleet", description: entry.description || undefined };
}

export default async function InteractiveDemoPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const route = routeFor(slug);
  const page = await loadRecoveredPage(route);
  if (!page) notFound();
  return (
    <>
      <p className="bof-demo-notice" role="note">
        Interactive demonstration: every driver, load and document here is fictional.
      </p>
      <RecoveredPageView
        page={page}
        route={route}
        related={[
          ["Take the Assessment", "/assessment"],
          ["Service explainers", "/services/dispatch"],
          ["Business Operations", "/business-operations"],
        ]}
        relatedLabel="Next steps"
      />
    </>
  );
}
