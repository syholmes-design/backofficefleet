import type { ReactNode } from "react";

export type MarketingPremiumHeroProps = {
  /** Stable id for `aria-labelledby` on the wrapping `<section>`. */
  sectionAriaLabelledBy?: string;
  titleId?: string;
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  support?: string;
  trustItems?: readonly string[];
  ctas: ReactNode;
  /** Optional right column — product preview, stat panel, or sector visual. */
  visual?: ReactNode;
  /** Accessible name for the hero trust bullet list. */
  trustAriaLabel?: string;
  /** Optional brand block shown above eyebrow. */
  brand?: ReactNode;
  /** `photo` — split layout tuned for real hero photography (integrated column, not a floating slab). */
  heroLayout?: "default" | "photo";
};

/**
 * Light-band premium hero — same visual language as the home marketing hero.
 * Used by the home page and sector templates for cohesion.
 */
export function MarketingPremiumHero({
  sectionAriaLabelledBy,
  titleId = "bof-mkt-hero-heading",
  eyebrow,
  title,
  subtitle,
  support,
  trustItems,
  ctas,
  visual,
  trustAriaLabel = "Highlights",
  brand,
  heroLayout = "default",
}: MarketingPremiumHeroProps) {
  const layoutClass = heroLayout === "photo" ? "bof-mkt-hero-premium bof-mkt-hero-premium--photo" : "bof-mkt-hero-premium";
  const gridClass =
    heroLayout === "photo"
      ? "bof-mkt-container bof-mkt-hero-premium-grid bof-mkt-hero-premium-grid--photo"
      : "bof-mkt-container bof-mkt-hero-premium-grid";
  return (
    <section
      className={layoutClass}
      aria-labelledby={sectionAriaLabelledBy ?? titleId}
    >
      <div className={gridClass}>
        <div className="bof-mkt-hero-premium-copy">
          {brand ? <div className="bof-mkt-hero-premium-brand">{brand}</div> : null}
          <p className="bof-mkt-hero-premium-eyebrow">{eyebrow}</p>
          <h1 id={titleId} className="bof-mkt-hero-premium-title">
            {title}
          </h1>
          <p className="bof-mkt-hero-premium-sub">{subtitle}</p>
          {support ? <p className="bof-mkt-hero-premium-support">{support}</p> : null}
          <div className="bof-mkt-hero-premium-ctas">{ctas}</div>
          {trustItems && trustItems.length > 0 ? (
            <ul className="bof-mkt-hero-trust" aria-label={trustAriaLabel}>
              {trustItems.map((label) => (
                <li key={label}>
                  <span className="bof-mkt-hero-trust-mark" aria-hidden />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {visual ? <div className="bof-mkt-hero-premium-visual">{visual}</div> : null}
      </div>
    </section>
  );
}
