import Image from "next/image";
import type { ReactNode } from "react";

export type MarketingGovernmentHeroProps = {
  titleId: string;
  sectionAriaLabelledBy?: string;
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  support: string;
  trustItems: readonly string[];
  trustAriaLabel: string;
  ctas: ReactNode;
  /** Public path e.g. `/assets/images/hero-government-fleets.png` */
  imageSrc: string;
  imageAlt: string;
  /** Short line on the image (not a product mock; editorial caption bar). */
  imageCaption?: string;
  /** Optional custom className for page-specific styling */
  className?: string;
};

/**
 * Government hero: two-column layout with left copy and right image
 * Mirrors the home page hero structure for proper integration
 */
export function MarketingGovernmentHero({
  titleId,
  sectionAriaLabelledBy,
  eyebrow,
  title,
  subtitle,
  support,
  trustItems,
  trustAriaLabel,
  ctas,
  imageSrc,
  imageAlt,
  imageCaption,
  className,
}: MarketingGovernmentHeroProps) {
  return (
    <section
      className={`bof-mkt-government-hero ${className || ""}`}
      aria-labelledby={sectionAriaLabelledBy ?? titleId}
    >
      <div className="bof-mkt-government-hero__grid">
        <div className="bof-mkt-government-hero__copy">
          <p className="bof-mkt-government-hero__eyebrow">{eyebrow}</p>
          <h1 id={titleId} className="bof-mkt-government-hero__title">
            {title}
          </h1>
          <p className="bof-mkt-government-hero__sub">{subtitle}</p>
          <p className="bof-mkt-government-hero__support">{support}</p>
          <div className="bof-mkt-government-hero__ctas">{ctas}</div>
          {trustItems.length > 0 ? (
            <ul className="bof-mkt-government-hero__trust" aria-label={trustAriaLabel}>
              {trustItems.map((label) => (
                <li key={label}>
                  <span className="bof-mkt-government-hero__trust-mark" aria-hidden />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="bof-mkt-government-hero__visual">
          <div className="bof-mkt-government-hero__image-wrap bof-mkt-hero-image-panel--private-fleets-size">
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              priority
              sizes="(max-width: 899px) 100vw, 50vw"
              className="bof-mkt-government-hero__image"
            />
          </div>
          {imageCaption ? (
            <div className="bof-mkt-government-hero__caption">
              <p className="bof-mkt-government-hero__image-caption">{imageCaption}</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
