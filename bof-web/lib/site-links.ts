/**
 * Centralized marketing / demo CTAs and sector landing links.
 * Configure booking via NEXT_PUBLIC_BOOK_DEMO_URL or NEXT_PUBLIC_CALENDAR_URL.
 */

export type SectorLink = {
  label: string;
  href: string;
  sector: "for-hire" | "private-fleet" | "government";
};

export const sectorLinks: SectorLink[] = [
  {
    label: "For-Hire Carriers",
    href: "/for-hire-carriers",
    sector: "for-hire",
  },
  {
    label: "Private Fleets",
    href: "/private-fleets",
    sector: "private-fleet",
  },
  {
    label: "Government",
    href: "/government",
    sector: "government",
  },
];

/**
 * Reference CTAs for dashboards / docs. The /dashboard hero lists Book + Dispatch + Attention Queue
 * explicitly in `DashboardPageClient` so URLs stay obvious and the hero PNG stays non-interactive.
 */
export const demoHeroLinks = [
  { label: "Open Dispatch Board", href: "/dispatch" },
  { label: "Review Attention Queue", href: "/dashboard#attention-queue" },
  { label: "Open Settlements", href: "/settlements" },
];

export function getSectorLinks(): SectorLink[] {
  return sectorLinks.map((s) => ({ ...s }));
}

export function getBookAssessmentHrefForSector(
  sector: SectorLink["sector"],
  source?: string,
): string {
  const params = new URLSearchParams({ sector });
  if (source) params.set("source", source);
  return `/book-assessment?${params.toString()}`;
}

export function getBookDemoHref(): string {
  const bookDemo =
    process.env.NEXT_PUBLIC_BOOK_DEMO_URL?.trim() ||
    process.env.NEXT_PUBLIC_CALENDAR_URL?.trim();
  if (bookDemo) return bookDemo;
  return "/book-assessment?source=dashboard-hero";
}

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
