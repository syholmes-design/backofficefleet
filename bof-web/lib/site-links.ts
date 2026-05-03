/**
 * Centralized marketing / demo CTAs and sector landing links.
 * Configure booking via NEXT_PUBLIC_BOOK_DEMO_URL or NEXT_PUBLIC_CALENDAR_URL.
 */

export type SectorLink = {
  label: string;
  href: string;
  sector: "for-hire" | "private-fleet" | "government";
};

/** Landing pages for sector positioning (used by /dashboard hero and header). */
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

/** Legacy operational links for the /dashboard hero (DOM only; prefer explicit CTAs in the hero). */
export type DashboardHeroCta = {
  id: "dispatch" | "attention_queue";
  label: string;
  href: string;
  variant: "primary" | "secondary";
};

export const demoHeroLinks: DashboardHeroCta[] = [
  {
    id: "dispatch",
    label: "Open Dispatch Board",
    href: "/dispatch",
    variant: "primary",
  },
  {
    id: "attention_queue",
    label: "Review Attention Queue",
    href: "/dashboard#attention-queue",
    variant: "secondary",
  },
];

export function getHeroLinks(): DashboardHeroCta[] {
  return demoHeroLinks.map((c) => ({ ...c }));
}

/**
 * External booking URL (Calendly, Calendarfy, etc.) or internal assessment fallback.
 * Priority: NEXT_PUBLIC_BOOK_DEMO_URL → NEXT_PUBLIC_CALENDAR_URL → NEXT_PUBLIC_CALENDLY_URL (legacy)
 * → /book-assessment?source=dashboard-hero
 */
export function getBookDemoHref(): string {
  const bookDemo =
    process.env.NEXT_PUBLIC_BOOK_DEMO_URL?.trim() ||
    process.env.NEXT_PUBLIC_CALENDAR_URL?.trim() ||
    process.env.NEXT_PUBLIC_CALENDLY_URL?.trim();
  if (bookDemo) return bookDemo;
  return "/book-assessment?source=dashboard-hero";
}

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
