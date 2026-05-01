import Link from "next/link";

/**
 * Cross-links from sector/home “shell” cards into the live Phase C funnel routes.
 * Keeps CTAs consistent across marketing pages.
 */
type MarketingFunnelEntryRowProps = {
  sector?: "for-hire" | "private-fleet" | "government";
};

export function MarketingFunnelEntryRow({ sector }: MarketingFunnelEntryRowProps = {}) {
  const assessmentHref = sector ? `/book-assessment?sector=${sector}` : "/book-assessment";
  return (
    <div className="bof-mkt-funnel-entry-row">
      <Link
        href="/fleet-savings"
        className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-primary bof-mkt-funnel-entry-btn"
      >
        Open savings calculator
      </Link>
      <Link
        href={assessmentHref}
        className="bof-mkt-btn-enterprise bof-mkt-btn-enterprise-secondary bof-mkt-funnel-entry-btn"
      >
        Start fleet assessment
      </Link>
      <Link href="/apply" className="bof-mkt-funnel-entry-text">
        Qualify for demo conversation →
      </Link>
    </div>
  );
}
