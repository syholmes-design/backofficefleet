/**
 * Centralized marketing / demo CTAs and sector landing links.
 * Configure booking via NEXT_PUBLIC_BOOK_DEMO_URL or NEXT_PUBLIC_CALENDAR_URL.
 */

export type SectorLink = {
  label: string;
  href: string;
  sector: "for-hire" | "private-fleet" | "government";
};

const SECTOR_LINKS: SectorLink[] = [
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
  return SECTOR_LINKS;
}

export function getBookAssessmentHrefForSector(
  sector: SectorLink["sector"],
  source?: string,
): string {
  const params = new URLSearchParams({ sector });
  if (source) params.set("source", source);
  return `/book-assessment?${params.toString()}`;
}

/** Canonical in-app CTAs for the /dashboard hero (all routes exist under (bof)). */
export type DashboardHeroCta = {
  id: "dispatch" | "attention_queue" | "settlements";
  label: string;
  href: string;
  variant: "primary" | "secondary";
};

export function getHeroLinks(): DashboardHeroCta[] {
  return [
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
    {
      id: "settlements",
      label: "Open Settlements",
      href: "/settlements",
      variant: "secondary",
    },
  ];
}

/**
 * External booking URL (Calendly, Calendarfy, etc.) or internal assessment fallback.
 * Priority: NEXT_PUBLIC_BOOK_DEMO_URL → NEXT_PUBLIC_CALENDAR_URL → NEXT_PUBLIC_CALENDLY_URL (legacy)
 * → /book-assessment?source=demo-hero
 */
export function getBookDemoHref(): string {
  const bookDemo =
    process.env.NEXT_PUBLIC_BOOK_DEMO_URL?.trim() ||
    process.env.NEXT_PUBLIC_CALENDAR_URL?.trim() ||
    process.env.NEXT_PUBLIC_CALENDLY_URL?.trim();
  if (bookDemo) return bookDemo;
  return "/book-assessment?source=demo-hero";
}

export function isExternalHref(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
